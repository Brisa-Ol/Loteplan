// src/pages/User/Contratos/HistorialContratos.tsx

import React, { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle,
  Download as DownloadIcon,
  Fingerprint,
  Description as PdfIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha, useTheme
} from '@mui/material';


// --- COMPONENTES ---
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { useModal } from '../../../../shared/hooks/useModal';

// ✅ IMPORTAMOS EL MODAL REUTILIZABLE
import { VerContratoFirmadoModal } from '../Proyectos/modals/VerContratoFirmadoModal';
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';
import ContratoGeneralService from '@/core/api/services/contrato-general.service';

const HistorialContratos: React.FC = () => {
  const theme = useTheme();
  const verModal = useModal();
  
  // Estados Locales
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoFirmadoDto | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Queries
  const { data: contratos = [], isLoading, error } = useQuery({
    queryKey: ['misContratos'],
    queryFn: async () => (await ContratoGeneralService.findMyContracts()).data,
    refetchOnWindowFocus: false
  });

  // Handlers
  const handleVerContrato = useCallback((contrato: ContratoFirmadoDto) => {
    setContratoSeleccionado(contrato);
    verModal.open();
  }, [verModal]);

  const handleCloseModal = useCallback(() => {
    verModal.close();
    setTimeout(() => setContratoSeleccionado(null), 300);
  }, [verModal]);

  const handleDownload = useCallback(async (contrato: ContratoFirmadoDto) => {
    try {
      setDownloadingId(contrato.id);
      await ContratoGeneralService.downloadAndSave(contrato.id, contrato.nombre_archivo);
      
      // Feedback visual
      setHighlightedId(contrato.id);
      setTimeout(() => setHighlightedId(null), 2500);
    } catch (err) {
      console.error("Error al descargar", err);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  // Definición de Columnas
  const columns = useMemo<DataTableColumn<ContratoFirmadoDto>[]>(() => [
    {
      id: 'archivo',
      label: 'Documento',
      minWidth: 250,
      render: (row) => (
        <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                <PdfIcon fontSize="small" />
            </Avatar>
            <Box>
                <Typography variant="body2" fontWeight={600} color="text.primary">
                    {row.nombre_archivo}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <Fingerprint sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Tooltip title={`Hash SHA-256: ${row.hash_archivo_firmado}`}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', cursor: 'help' }}>
                            {row.hash_archivo_firmado?.substring(0, 8)}...
                        </Typography>
                    </Tooltip>
                </Stack>
            </Box>
        </Stack>
      )
    },
    {
      id: 'fecha',
      label: 'Fecha de Firma',
      minWidth: 150,
      render: (row) => (
        <Box>
            <Typography variant="body2" fontWeight={500}>
                {row.fecha_firma ? format(new Date(row.fecha_firma), 'dd MMM yyyy', { locale: es }) : '-'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {row.fecha_firma ? format(new Date(row.fecha_firma), 'HH:mm', { locale: es }) + ' hs' : ''}
            </Typography>
        </Box>
      )
    },
    {
      id: 'estado',
      label: 'Estado',
      render: () => (
        <Chip 
            icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
            label="Firmado & Verificado" 
            size="small" 
            color="success" 
            variant="outlined"
            sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.05) }}
        />
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Ver Documento">
                <IconButton 
                    size="small"
                    onClick={() => handleVerContrato(row)}
                    sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}
                >
                    <VisibilityIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Descargar PDF">
                <span>
                    <IconButton 
                        size="small"
                        onClick={() => handleDownload(row)}
                        disabled={downloadingId === row.id}
                        sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
                    >
                        {downloadingId === row.id ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon fontSize="small" />}
                    </IconButton>
                </span>
            </Tooltip>
        </Stack>
      )
    }
  ], [theme, downloadingId, handleVerContrato, handleDownload]);

  return (
    <PageContainer maxWidth="md">
      <PageHeader 
        title="Mis Contratos" 
        subtitle="Historial de contratos firmados y verificación de integridad."
      />
      
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable
            columns={columns}
            data={contratos}
            getRowKey={(row) => row.id}
            highlightedRowId={highlightedId}
            emptyMessage="No tienes contratos firmados aún."
            pagination={true}
            defaultRowsPerPage={5}
        />
      </QueryHandler>

      {/* Modal Reutilizable */}
      <VerContratoFirmadoModal 
        open={verModal.isOpen} 
        onClose={handleCloseModal} 
        contrato={contratoSeleccionado} 
      />
    </PageContainer>
  );
};

export default HistorialContratos;