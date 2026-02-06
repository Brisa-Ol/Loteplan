import React, { useMemo } from 'react';
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
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { VerContratoFirmadoModal } from '../Proyectos/modals/VerContratoFirmadoModal';

// --- HOOK Y DTO ---
import { useHistorialContratos } from '../../hooks/useHistorialContratos'; // Ajusta la ruta de importación
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';

const HistorialContratos: React.FC = () => {
  const theme = useTheme();
  
  // ✅ Usamos el hook optimizado
  const logic = useHistorialContratos();

  // Definición de Columnas (Memoizado)
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
          variant="filled"
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
              onClick={() => logic.handleVerContrato(row)}
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
                onClick={() => logic.handleDownload(row)}
                disabled={logic.downloadingId === row.id}
                sx={{
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                {logic.downloadingId === row.id ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <DownloadIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      )
    }
  ], [theme, logic.downloadingId, logic.handleVerContrato, logic.handleDownload]);

  return (
    <PageContainer maxWidth="lg">
      {/* HEADER SIMÉTRICO */}
      <PageHeader
        title="Mis Contratos"
        subtitle="Consulta y descarga tus documentos verificados."
      />

      {/* KPI CARDS */}
      <Box mb={4} display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
        <StatCard
          title="Total Firmados"
          value={logic.stats.total.toString()}
          icon={<Gavel />}
          color="primary"
          loading={logic.isLoading}
          subtitle="Documentos legales"
        />
        <StatCard
          title="Última Firma"
          value={logic.stats.lastDate}
          icon={<HistoryIcon />}
          color="info"
          loading={logic.isLoading}
          subtitle="Actividad reciente"
        />
        <StatCard
          title="Seguridad"
          value="100%"
          icon={<VerifiedUser />}
          color="success"
          loading={logic.isLoading}
          subtitle="Integridad validada"
        />
      </Box>

      {/* TABLA */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
        <DataTable
          columns={columns}
          data={logic.contratos}
          getRowKey={(row) => row.id}
          highlightedRowId={logic.highlightedId}
          emptyMessage="No tienes contratos firmados aún."
          pagination={true}
          defaultRowsPerPage={5}
        />
      </QueryHandler>

      {/* Modal Reutilizable */}
      <VerContratoFirmadoModal
        open={logic.verModal.isOpen}
        onClose={logic.handleCloseModal}
        contrato={logic.contratoSeleccionado}
      />
    </PageContainer>
  );
};

export default HistorialContratos;