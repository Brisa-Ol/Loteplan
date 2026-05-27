// src/features/client/pages/Contratos/HistorialContratos.tsx

import { env } from '@/core/config/env';
import type { ContratoFirmadoDto } from '@/core/types/contrato-firmado.dto';
import { DataTable, PageContainer, PageHeader, QueryHandler, StatCard, type DataTableColumn } from '@/shared';
import {
  Business,
  Download as DownloadIcon,
  Fingerprint,
  Gavel,
  History as HistoryIcon,
  Description as PdfIcon,
  VerifiedUser,
  Visibility as VisibilityIcon,
  Security,
  VpnKey
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha, 
  useTheme
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useMemo } from 'react';
import { useHistorialContratos } from '../../hooks/useHistorialContratos';
import { VerContratoFirmadoModal } from '../Proyectos/modals/VerContratoFirmadoModal';

const safeFormatShortDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  const safeString = dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr;
  const date = new Date(safeString);
  if (isNaN(date.getTime())) return 'Fecha inválida';
  return format(date, "dd MMM yyyy", { locale: es });
};

const safeFormatTime = (dateStr?: string | null) => {
  if (!dateStr) return '';
  if (dateStr.length === 10) return '';
  return format(new Date(dateStr), 'HH:mm', { locale: es });
};

const HistorialContratos: React.FC = () => {
  const theme = useTheme();
  const logic = useHistorialContratos();

  // ── COLUMNAS DE LA TABLA ──
  const columns = useMemo<DataTableColumn<ContratoFirmadoDto>[]>(() => [
    {
      id: 'proyecto',
      label: 'Acuerdo / Proyecto',
      minWidth: 260,
      render: (row) => {
        const isMensual = row.proyectoAsociado?.tipo_inversion === 'mensual';
        return (
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 40, height: 40 }}>
              <Business fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" color="primary.main">
                {row.proyectoAsociado?.nombre_proyecto || 'Acuerdo General'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                <Chip 
                  label={isMensual ? 'Suscripción' : 'Inversión'} 
                  size="small" 
                  color={isMensual ? 'info' : 'warning'}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }} 
                />
              </Stack>
            </Box>
          </Stack>
        );
      }
    },
    {
      id: 'archivo',
      label: 'Documento PDF',
      minWidth: 220,
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <PdfIcon sx={{ color: theme.palette.error.main }} />
          <Tooltip title={row.nombre_archivo}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>
              {row.nombre_archivo}
            </Typography>
          </Tooltip>
        </Stack>
      )
    },
    {
      id: 'seguridad',
      label: 'Auditoría y Seguridad',
      minWidth: 250,
      render: (row) => (
        <Box>
          <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
            <VpnKey sx={{ fontSize: 14, color: 'success.main' }} />
            <Typography variant="caption" color="success.main" fontWeight={600}>
              2FA Verificado
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
              • IP: {row.ip_firma}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Fingerprint sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Tooltip title={`Hash completo: ${row.hash_archivo_firmado}`}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                SHA256: {row.hash_archivo_firmado?.substring(0, 12)}...
              </Typography>
            </Tooltip>
          </Stack>
        </Box>
      )
    },
    {
      id: 'fecha',
      label: 'Registro de Firma',
      minWidth: 150,
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {safeFormatShortDate(row.fecha_firma)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            a las {safeFormatTime(row.fecha_firma)} hs
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
          sx={{ fontWeight: 800 }} // El theme maneja el border-radius y padding general
        />
      )
    },
    {
      id: 'acciones',
      label: 'Gestión',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Ver Documento">
            <IconButton
              size="small"
              onClick={() => logic.handleVerContrato(row)}
              sx={{ border: `1px solid ${theme.palette.divider}` }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Descargar PDF original">
            <IconButton
              size="small"
              color="primary"
              onClick={() => logic.handleDownload(row)}
              disabled={logic.downloadingId === row.id}
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
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
        subtitle="Repositorio seguro de tus acuerdos firmados digitalmente bajo tecnología 2FA"
      />

      {/* KPI RESUMEN */}
      <Box mb={4} display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
        <StatCard 
          title="Documentos Firmados" 
          value={logic.stats.total.toString()} 
          icon={<Gavel />} 
          color="primary" 
          loading={logic.isLoading} 
        />
        <StatCard 
          title="Última Actividad" 
          value={logic.stats.lastDate} 
          icon={<HistoryIcon />} 
          color="info" 
          loading={logic.isLoading} 
        />
        <StatCard 
          title="Nivel de Seguridad" 
          value="Máxima" 
          icon={<Security />} 
          color="success" 
          loading={logic.isLoading} 
          subtitle="Autenticación 2FA Activa" 
        />
      </Box>

      {/* TABLA DE CONTRATOS */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
        {/* Utilizamos Card para heredar la sombra, borderRadius: 12 y estilos globales de tu Theme */}
        <Card sx={{ border: `1px solid ${theme.palette.divider}`, overflow: 'hidden', boxShadow: 'none' }}>
          <DataTable
            columns={columns}
            data={logic.contratos}
            getRowKey={(row) => row.id}
            emptyMessage="No posees contratos registrados en tu historial."
            pagination
            defaultRowsPerPage={env.defaultPageSize} 
          />
        </Card>
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