import React, { useMemo, useState } from 'react';
import {
  Box, Chip, IconButton, Stack, Tooltip, Typography, Paper,
  useTheme, Tabs, Tab, alpha
} from '@mui/material';
import {
  Gavel, MonetizationOn,
  EmojiEvents, History as HistoryIcon,
  Cancel, CheckCircle, Warning, Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Componentes Comunes
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';

// Servicios y Config
import PujaService from '@/core/api/services/puja.service';
import { env } from '@/core/config/env';
import type { PujaDto } from '@/core/types/dto/puja.dto';

const MisPujas: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  // 1. Data Fetching
  const { data: misPujas = [], isLoading, error } = useQuery<PujaDto[]>({
    queryKey: ['misPujas'],
    queryFn: async () => (await PujaService.getMyPujas()).data,
  });

  // 2. Stats & Filtering
  const { activePujas, historyPujas, stats } = useMemo(() => {
    // Clasificación de estados
    const activeStates = ['activa', 'ganadora_pendiente'];

    const active = misPujas.filter(p => activeStates.includes(p.estado_puja));
    const history = misPujas.filter(p => !activeStates.includes(p.estado_puja));

    // Stats calculation
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

  // Helpers
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(env.defaultLocale, {
      style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 0
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(env.defaultLocale, {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  // 3. Configuración de Columnas
  const columns = useMemo<DataTableColumn<PujaDto>[]>(() => [
    {
      id: 'lote',
      label: 'Lote / Referencia',
      minWidth: 220,
      render: (puja) => (
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
            {puja.lote?.nombre_lote || 'Lote Desconocido'}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
            <Chip
              label={`REF: #${puja.id_lote}`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontFamily: 'monospace',
                bgcolor: alpha(theme.palette.secondary.main, 0.1)
              }}
            />
          </Stack>
        </Box>
      )
    },
    {
      id: 'monto',
      label: 'Mi Oferta',
      minWidth: 140,
      render: (puja) => (
        <Typography variant="body2" fontWeight={700} sx={{ color: 'primary.main', fontSize: '1rem' }}>
          {formatCurrency(Number(puja.monto_puja))}
        </Typography>
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
        let label = 'Desconocido';
        let icon = <Gavel fontSize="small" />;
        let variant: 'filled' | 'outlined' = 'outlined';

        switch (puja.estado_puja) {
          case 'activa':
            color = 'primary';
            label = 'OFERTA ACTIVA';
            variant = 'outlined'; // Outlined porque aún no se define
            break;
          case 'ganadora_pendiente':
            color = 'warning';
            label = 'GANASTE (PAGAR)';
            icon = <EmojiEvents fontSize="small" />;
            variant = 'filled'; // Filled para llamar la atención (Acción requerida)
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
        }

        return (
          <Chip
            label={label}
            color={color}
            size="small"
            icon={icon}
            variant={variant}
            sx={{ fontWeight: 700 }}
          />
        );
      }
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      minWidth: 100,
      render: (puja) => (
        <Tooltip title="Ver Lote">
          <IconButton
            size="small"
            onClick={() => navigate(`/lotes/${puja.id_lote}`)}
            sx={{
              color: 'text.secondary',
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': { color: 'primary.main', borderColor: 'primary.main' }
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], [navigate, theme]);

  return (
    <PageContainer maxWidth="lg">

      {/* HEADER SIMÉTRICO */}
      <PageHeader
        title="Mis Ofertas"
        subtitle="Monitorea tus pujas activas y gestiona tus lotes ganados."
      />

      {/* KPI CARDS */}
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

      {/* TABS */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} textColor="primary" indicatorColor="primary">
          <Tab label="En Curso" icon={<Gavel />} iconPosition="start" />
          <Tab label="Historial" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* TABLA CON TABS */}
      <QueryHandler isLoading={isLoading} error={error as Error}>
        <Paper elevation={0} sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: theme.shadows[1]
        }}>
          {tabValue === 0 ? (
            <DataTable
              columns={columns}
              data={activePujas}
              getRowKey={(row) => row.id}
              emptyMessage="No tienes pujas activas en este momento."
              pagination
              defaultRowsPerPage={5}
            />
          ) : (
            <DataTable
              columns={columns}
              data={historyPujas}
              getRowKey={(row) => row.id}
              emptyMessage="No tienes historial de subastas finalizadas."
              pagination
              defaultRowsPerPage={5}
              isRowActive={() => false} // Visualmente desactiva las filas históricas
            />
          )}
        </Paper>
      </QueryHandler>

    </PageContainer>
  );
};

export default MisPujas;