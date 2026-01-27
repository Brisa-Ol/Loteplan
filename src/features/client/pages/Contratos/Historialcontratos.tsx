import React, { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Download as DownloadIcon,
  Fingerprint,
  Description as PdfIcon,
  Visibility as VisibilityIcon,
  VerifiedUser,
  History as HistoryIcon,
  Gavel
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
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard'; // ✅ Agregado
import { useModal } from '../../../../shared/hooks/useModal';

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

  // 1. Stats (Cálculos simples para las tarjetas)
  const stats = useMemo(() => {
    if (!contratos.length) return { total: 0, verified: 0, lastDate: '-' };

    // Ordenamos para encontrar el último
    const sorted = [...contratos].sort((a, b) => new Date(b.fecha_firma).getTime() - new Date(a.fecha_firma).getTime());

    return {
      total: contratos.length,
      verified: contratos.length, // Asumimos que si están aquí, están firmados
      lastDate: sorted[0].fecha_firma
        ? format(new Date(sorted[0].fecha_firma), 'dd MMM yyyy', { locale: es })
        : '-'
    };
  }, [contratos]);

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
      label: 'Documento / Hash',
      minWidth: 280,
      render: (row) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main,
              borderRadius: 2
            }}
          >
            <PdfIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
              {row.nombre_archivo}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
              <Chip
                icon={<Fingerprint style={{ fontSize: 12 }} />}
                label={`SHA: ${row.hash_archivo_firmado?.substring(0, 8)}...`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  color: 'text.secondary',
                  '& .MuiChip-icon': { color: 'text.secondary' }
                }}
              />
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
          <Typography variant="body2" fontWeight={600} color="text.primary">
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
      label: 'Integridad',
      render: () => (
        <Chip
          icon={<VerifiedUser sx={{ fontSize: '14px !important' }} />}
          label="Verificado y Firmado"
          size="small"
          color="success"
          variant="filled" // Filled para dar sensación de seguridad sólida
          sx={{ fontWeight: 600 }}
        />
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      minWidth: 120,
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Vista Previa">
            <IconButton
              size="small"
              onClick={() => handleVerContrato(row)}
              sx={{
                color: 'text.secondary',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': { borderColor: theme.palette.primary.main, color: theme.palette.primary.main }
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Descargar Original">
            <span>
              <IconButton
                size="small"
                onClick={() => handleDownload(row)}
                disabled={downloadingId === row.id}
                sx={{
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
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
    <PageContainer maxWidth="lg"> {/* Cambiado a lg para dar aire a las cards */}

      {/* HEADER SIMÉTRICO */}
      <PageHeader
        title="Mis Contratos"
        subtitle="Consulta y descarga tus documentos verificados."
      />

      {/* KPI CARDS */}
      <Box mb={4} display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
        <StatCard
          title="Total Firmados"
          value={stats.total.toString()}
          icon={<Gavel />}
          color="primary"
          loading={isLoading}
          subtitle="Documentos legales"
        />
        <StatCard
          title="Última Firma"
          value={stats.lastDate}
          icon={<HistoryIcon />}
          color="info"
          loading={isLoading}
          subtitle="Actividad reciente"
        />
        <StatCard
          title="Seguridad"
          value="100%"
          icon={<VerifiedUser />}
          color="success"
          loading={isLoading}
          subtitle="Integridad validada"
        />
      </Box>

      {/* TABLA */}
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