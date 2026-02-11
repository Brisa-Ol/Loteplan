// src/features/client/pages/Pujas/MisPujas.tsx

import {
  Cancel, CheckCircle,
  EmojiEvents,
  Gavel,
  History as HistoryIcon,
  MonetizationOn,
  Visibility,
  Warning
} from '@mui/icons-material';
import {
  Box, Chip, IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip, Typography,
  alpha,
  useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Componentes Comunes
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';

// Servicios y Config
import PujaService from '@/core/api/services/puja.service';
import { env } from '@/core/config/env';
import type { PujaDto } from '@/core/types/dto/puja.dto';
import { ROUTES } from '@/routes';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

const MisPujas: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  // Formateador de moneda dinámico
  const formatCurrency = useCurrencyFormatter();

  // 1. Obtención de Datos
  // El backend ahora devuelve las relaciones lote y proyectoAsociado por defecto
  const { data: misPujas = [], isLoading, error } = useQuery<PujaDto[]>({
    queryKey: ['misPujas'],
    queryFn: async () => (await PujaService.getMyPujas()).data,
  });

  // 2. Estadísticas y Filtrado
  const { activePujas, historyPujas, stats } = useMemo(() => {
    const activeStates = ['activa', 'ganadora_pendiente'];

    const active = misPujas.filter(p => activeStates.includes(p.estado_puja));
    const history = misPujas.filter(p => !activeStates.includes(p.estado_puja));

    const totalComprometido = active.reduce((acc, curr) => acc + Number(curr.monto_puja), 0);
    const ganadas = misPujas.filter(p => ['ganadora_pagada', 'ganadora_pendiente'].includes(p.estado_puja)).length;

    return {
      activePujas: active.sort((a, b) => new Date(b.fecha_puja).getTime() - new Date(a.fecha_puja).getTime()),
      historyPujas: history.sort((a, b) => new Date(b.fecha_puja).getTime() - new Date(a.fecha_puja).getTime()),
      stats: {
        activas: active.length,
        ganadas,
        comprometido: totalComprometido
      }
    };
  }, [misPujas]);

  // Helper de fecha
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(env.defaultLocale, {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  // 3. Configuración de Columnas
  const columns = useMemo<DataTableColumn<PujaDto>[]>(() => [
    {
      id: 'lote',
      label: 'Lote / Proyecto',
      minWidth: 260,
      render: (puja) => {
        // El backend puede enviar el proyecto en 'proyectoAsociado' o dentro de 'lote.proyecto'
        const nombreProyecto = puja.proyectoAsociado?.nombre_proyecto || puja.lote?.proyecto?.nombre_proyecto || 'PROYECTO GENERAL';
        const nombreLote = puja.lote?.nombre_lote || `Lote #${puja.id_lote}`;

        return (
          <Box>
            {/* Nombre del Lote */}
            <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
              {nombreLote}
            </Typography>

            {/* Nombre del Proyecto */}
            <Typography
              variant="caption"
              color="primary.main"
              fontWeight={700}
              sx={{ display: 'block', mt: 0.3, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}
            >
              {nombreProyecto}
            </Typography>

            {/* ID de Referencia técnica */}
            <Stack direction="row" spacing={1} alignItems="center" mt={1}>
              <Chip
                label={`ID: #${puja.id_lote}`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.6rem',
                  fontFamily: 'monospace',
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  color: 'text.secondary',
                  border: 'none'
                }}
              />
            </Stack>
          </Box>
        );
      }
    },
    {
      id: 'monto',
      label: 'Mi Oferta',
      minWidth: 140,
      render: (puja) => (
        <Box>
          <Typography variant="body2" fontWeight={800} sx={{ color: 'primary.main', fontSize: '1rem' }}>
            {formatCurrency(puja.monto_puja)}
          </Typography>
          {puja.estado_puja === 'ganadora_pendiente' && (
            <Typography variant="caption" color="warning.dark" fontWeight={800} sx={{ display: 'block' }}>
              PAGO REQUERIDO
            </Typography>
          )}
        </Box>
      )
    },
    {
      id: 'fecha',
      label: 'Fecha Oferta',
      minWidth: 150,
      render: (puja) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(puja.fecha_puja)}
        </Typography>
      )
    },
    {
      id: 'estado',
      label: 'Estado',
      minWidth: 160,
      render: (puja) => {
        let color: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' = 'default';
        let label = 'DESCONOCIDO';
        let icon = <Gavel fontSize="small" />;
        let variant: 'filled' | 'outlined' = 'outlined';

        switch (puja.estado_puja) {
          case 'activa':
            color = 'primary';
            label = 'OFERTA ACTIVA';
            variant = 'outlined';
            break;
          case 'ganadora_pendiente':
            color = 'warning';
            label = 'GANASTE (PAGAR)';
            icon = <EmojiEvents fontSize="small" />;
            variant = 'filled';
            break;
          case 'ganadora_pagada':
            color = 'success';
            label = 'ADJUDICADO';
            icon = <CheckCircle fontSize="small" />;
            variant = 'filled';
            break;
          case 'perdedora':
            color = 'default';
            label = 'SUPERADA';
            icon = <Cancel fontSize="small" />;
            break;
          case 'ganadora_incumplimiento':
            color = 'error';
            label = 'ANULADA';
            icon = <Warning fontSize="small" />;
            break;
          default:
            label = puja.estado_puja.toUpperCase();
        }

        return (
          <Chip
            label={label}
            color={color}
            size="small"
            icon={icon}
            variant={variant}
            sx={{ fontWeight: 800, fontSize: '0.7rem' }}
          />
        );
      }
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      minWidth: 80,
      render: (puja) => (
        <Tooltip title="Ver Lote">
          <IconButton
            size="small"
            onClick={() => navigate(ROUTES.CLIENT.LOTES.DETALLE.replace(':id', String(puja.id_lote)))}
            sx={{
              color: 'text.secondary',
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': { color: 'primary.main', borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], [navigate, theme, formatCurrency]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Mis Ofertas"
        subtitle="Monitorea tus pujas activas y gestiona tus lotes ganados."
      />

      <Box mb={4} display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
        <StatCard
          title="Capital Ofertado"
          value={formatCurrency(stats.comprometido)}
          icon={<MonetizationOn />}
          color="primary"
          loading={isLoading}
          subtitle="En subastas activas"
        />
        <StatCard
          title="Pujas Activas"
          value={stats.activas.toString()}
          icon={<Gavel />}
          color="info"
          loading={isLoading}
          subtitle="Participando ahora"
        />
        <StatCard
          title="Lotes Ganados"
          value={stats.ganadas.toString()}
          icon={<EmojiEvents />}
          color="success"
          loading={isLoading}
          subtitle="Total histórico"
        />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} textColor="primary" indicatorColor="primary">
          <Tab label={`En Curso (${stats.activas})`} icon={<Gavel />} iconPosition="start" />
          <Tab label="Historial" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      <QueryHandler isLoading={isLoading} error={error as Error}>
        <Paper elevation={0} sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: theme.shadows[1]
        }}>
          <DataTable
            columns={columns}
            data={tabValue === 0 ? activePujas : historyPujas}
            getRowKey={(row) => row.id}
            emptyMessage={tabValue === 0 ? "No tienes pujas activas." : "No hay historial de subastas."}
            pagination
            defaultRowsPerPage={10}
            isRowActive={(row) => tabValue === 0}
          />
        </Paper>
      </QueryHandler>
    </PageContainer>
  );
};

export default MisPujas;