// src/features/client/pages/Contratos/HistorialContratos.tsx

import {
  Business,
  Download as DownloadIcon,
  Fingerprint,
  Gavel,
  History as HistoryIcon,
  Description as PdfIcon,
  VerifiedUser,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  alpha, useTheme
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useMemo } from 'react';

// --- COMPONENTE COMPARTIDOS ---
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { VerContratoFirmadoModal } from '../Proyectos/modals/VerContratoFirmadoModal';

// --- HOOK Y DTO ---
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';
import { useHistorialContratos } from '../../hooks/useHistorialContratos';

const HistorialContratos: React.FC = () => {
  const theme = useTheme();
  const logic = useHistorialContratos();

  // ── COLUMNAS DE LA TABLA (Optimizadas para mostrar nombres) ──
  const columns = useMemo<DataTableColumn<ContratoFirmadoDto>[]>(() => [
    {
      id: 'proyecto',
      label: 'Proyecto / Referencia',
      minWidth: 240,
      render: (row) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              width: 40, height: 40
            }}
          >
            <Business fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color="primary.main">
              {row.proyectoAsociado?.nombre_proyecto || 'Proyecto General'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Contrato de {row.proyectoAsociado?.tipo_inversion === 'mensual' ? 'Suscripción' : 'Inversión'}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'archivo',
      label: 'Documento Digital',
      minWidth: 260,
      render: (row) => (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <PdfIcon sx={{ fontSize: 16, color: theme.palette.error.main }} />
            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
              {row.nombre_archivo}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
            <Fingerprint sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
              SHA256: {row.hash_archivo_firmado?.substring(0, 10)}...
            </Typography>
          </Stack>
        </Box>
      )
    },
    {
      id: 'fecha',
      label: 'Fecha de Firma',
      minWidth: 150,
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {row.fecha_firma ? format(new Date(row.fecha_firma), 'dd MMM, yyyy', { locale: es }) : '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.fecha_firma ? format(new Date(row.fecha_firma), 'HH:mm') + ' hs' : ''}
          </Typography>
        </Box>
      )
    },
    {
      id: 'estado',
      label: 'Estado Legal',
      align: 'center',
      render: (row) => (
        <Chip
          icon={<VerifiedUser sx={{ fontSize: '14px !important' }} />}
          label={row.estado_firma}
          size="small"
          color="success"
          variant="filled"
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
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
              onClick={() => logic.handleVerContrato(row)}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Descargar PDF">
            <IconButton
              size="small"
              color="primary"
              onClick={() => logic.handleDownload(row)}
              disabled={logic.downloadingId === row.id}
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
            >
              {logic.downloadingId === row.id ? <CircularProgress size={18} /> : <DownloadIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [theme, logic]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Mis Contratos"
        subtitle="Repositore seguro de tus acuerdos firmados digitalmente bajo tecnología 2FA."
      />

      {/* KPI RESUMEN */}
      <Box mb={4} display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
        <StatCard title="Documentos Firmados" value={logic.stats.total.toString()} icon={<Gavel />} color="primary" loading={logic.isLoading} />
        <StatCard title="Última Actividad" value={logic.stats.lastDate} icon={<HistoryIcon />} color="info" loading={logic.isLoading} />
        <StatCard title="Estado de Red" value="Protegido" icon={<VerifiedUser />} color="success" loading={logic.isLoading} subtitle="Firma con Hash SHA-256" />
      </Box>

      {/* TABLA DE CONTRATOS */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
        <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={logic.contratos}
            getRowKey={(row) => row.id}
            emptyMessage="No posees contratos registrados en tu historial."
            pagination
            defaultRowsPerPage={10}
          />
        </Paper>
      </QueryHandler>

      {/* Modal de Previsualización */}
      <VerContratoFirmadoModal
        open={logic.verModal.isOpen}
        onClose={logic.handleCloseModal}
        contrato={logic.contratoSeleccionado}
      />
    </PageContainer>
  );
};

export default HistorialContratos;