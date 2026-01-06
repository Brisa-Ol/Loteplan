// src/pages/User/Contratos/HistorialContratos.tsx

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Stack, IconButton, Tooltip, Chip,
  Button, Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
  alpha, useTheme, CircularProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  Description as PdfIcon, 
  Visibility as VisibilityIcon, 
  Close as CloseIcon,
  Fingerprint,
  CheckCircle
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Imports de Servicios y Tipos ---
import type { ContratoFirmadoDto } from '../../../types/dto/contrato-general.dto';
import ContratoGeneralService from '../../../services/contrato-general.service';
import ImagenService from '../../../services/imagen.service';

// --- Imports de Componentes y Hooks ---
import PDFViewerMejorado from './components/PDFViewerMejorado';
import { useModal } from '../../../hooks/useModal';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

// ==========================================
// COMPONENTE MODAL (Estilizado)
// ==========================================
interface VerModalProps {
  open: boolean;
  onClose: () => void;
  contrato: ContratoFirmadoDto | null;
}

const VerContratoFirmadoModal: React.FC<VerModalProps> = ({ open, onClose, contrato }) => {
  const theme = useTheme();

  if (!contrato) return null;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
           <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
             <PdfIcon />
           </Avatar>
           <Box>
             <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: 400 }}>
                {contrato.nombre_archivo}
             </Typography>
             <Typography variant="caption" color="text.secondary">
                Visualización de documento firmado
             </Typography>
           </Box>
        </Stack>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, height: '70vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
        <Box flex={1} overflow="hidden" position="relative">
            <PDFViewerMejorado
              pdfUrl={ImagenService.resolveImageUrl(contrato.url_archivo)}
              signatureDataUrl={null}
              onSignaturePositionSet={() => {}}
              readOnlyMode={true}
            />
        </Box>

        {/* Metadatos Footer */}
        <Box p={2} bgcolor="background.paper" borderTop={`1px solid ${theme.palette.divider}`}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                    <Fingerprint color="action" fontSize="small" />
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">Integridad (SHA-256):</Typography>
                    <Tooltip title={contrato.hash_archivo_firmado}>
                      <Chip 
                        label={contrato.hash_archivo_firmado?.substring(0, 16) + "..."} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                      />
                    </Tooltip>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                    Firmado el: {new Date(contrato.fecha_firma).toLocaleString()}
                </Typography>
            </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} color="inherit">Cerrar</Button>
        <Button 
            variant="contained" 
            startIcon={<DownloadIcon />} 
            onClick={() => ContratoGeneralService.downloadAndSave(contrato.id, contrato.nombre_archivo)}
        >
            Descargar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const HistorialContratos: React.FC = () => {
  const theme = useTheme();
  const verModal = useModal();
  
  // Estados Locales
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoFirmadoDto | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  
  // ✅ Feedback visual: Flash verde al descargar
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Queries
  const { data: contratos = [], isLoading, error } = useQuery({
    queryKey: ['misContratos'],
    queryFn: async () => (await ContratoGeneralService.findMyContracts()).data
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
      
      // Activar efecto visual de éxito en la fila
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
      render: (row) => (
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
        {/* ✅ DataTable Implementado */}
        <DataTable
            columns={columns}
            data={contratos}
            getRowKey={(row) => row.id}
            
            // ✅ Feedback Visual al descargar
            highlightedRowId={highlightedId}

            emptyMessage="No tienes contratos firmados aún."
            pagination={true}
            defaultRowsPerPage={5}
        />
      </QueryHandler>

      {/* Modal controlado por el hook */}
      <VerContratoFirmadoModal 
        open={verModal.isOpen} 
        onClose={handleCloseModal} 
        contrato={contratoSeleccionado} 
      />
    </PageContainer>
  );
};

export default HistorialContratos;