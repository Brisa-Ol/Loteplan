// src/features/client/pages/Pujas/MisPujas.tsx

import {
  CalendarMonth,
  Cancel, CheckCircle, EmojiEvents, Gavel,
  MonetizationOn,
  Payment, Visibility
} from '@mui/icons-material';
import {
  Box, Button, Chip, IconButton, Paper, Stack,
  Tab, Tabs, Tooltip, Typography,
  useTheme
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Componentes Comunes
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import TwoFactorAuthModal from '../../../../shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { useModal } from '../../../../shared/hooks/useModal';

// Servicios y Tipos
import PujaService from '@/core/api/services/puja.service';
import type { PujaDto } from '@/core/types/dto/puja.dto';
import { ROUTES } from '@/routes';
import useSnackbar from '../../../../shared/hooks/useSnackbar';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

const MisPujas: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showError } = useSnackbar();
  const formatCurrency = useCurrencyFormatter();

  const [tabValue, setTabValue] = useState(0);
  const twoFaModal = useModal();
  const [selectedPujaId, setSelectedPujaId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  const { data: misPujas = [], isLoading, error } = useQuery<PujaDto[]>({
    queryKey: ['misPujas'],
    queryFn: async () => (await PujaService.getMyPujas()).data,
  });

  const { activePujas, historyPujas, stats } = useMemo(() => {
    const activeStates = ['activa', 'ganadora_pendiente'];
    const active = misPujas.filter(p => activeStates.includes(p.estado_puja));
    const history = misPujas.filter(p => !activeStates.includes(p.estado_puja));

    const totalComprometido = active.reduce((acc, curr) => acc + Number(curr.monto_puja || 0), 0);
    const ganadas = misPujas.filter(p => ['ganadora_pagada', 'ganadora_pendiente'].includes(p.estado_puja)).length;

    return {
      activePujas: active.sort((a, b) => new Date(b.fecha_puja).getTime() - new Date(a.fecha_puja).getTime()),
      historyPujas: history.sort((a, b) => new Date(b.fecha_puja).getTime() - new Date(a.fecha_puja).getTime()),
      stats: { activas: active.length, ganadas, comprometido: totalComprometido }
    };
  }, [misPujas]);

  const iniciarPagoMutation = useMutation({
    mutationFn: async (pujaId: number) => {
      setSelectedPujaId(pujaId);
      return await PujaService.initiatePayment(pujaId);
    },
    onSuccess: (res: any) => {
      if (res.data?.is2FARequired || res.status === 202) {
        setTwoFAError(null);
        twoFaModal.open();
      } else if (res.data?.url_checkout) {
        window.location.href = res.data.url_checkout;
      }
    },
    onError: (err: any) => showError(err.response?.data?.message || 'Error al iniciar el pago')
  });

  const confirmar2FAMutation = useMutation({
    mutationFn: (codigo: string) =>
      PujaService.confirmPayment2FA({ pujaId: selectedPujaId!, codigo_2fa: codigo }),
    onSuccess: (res: any) => {
      if (res.data?.url_checkout) window.location.href = res.data.url_checkout;
      twoFaModal.close();
    },
    onError: (err: any) => setTwoFAError(err.response?.data?.message || "Código incorrecto")
  });

  // ── COLUMNAS CORREGIDAS ──
  const columns = useMemo<DataTableColumn<PujaDto>[]>(() => [
    {
      id: 'proyecto',
      label: 'Proyecto',
      minWidth: 200,
      render: (puja) => {
        // ✅ SOLUCIÓN: Buscamos en el path del JSON real y fallback al DTO
        const nombreProj = (puja.lote as any)?.proyectoLote?.nombre_proyecto
          || puja.proyectoAsociado?.nombre_proyecto
          || 'Proyecto General';
        return (
          <Typography variant="subtitle2" fontWeight={800} color="primary.main">
            {nombreProj}
          </Typography>
        );
      }
    },
    {
      id: 'lote',
      label: 'Lote',
      minWidth: 150,
      render: (puja) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: puja.estado_puja === 'activa' ? 'success.main' : 'divider' }} />
          <Typography variant="body2" fontWeight={600}>
            {puja.lote?.nombre_lote || `Lote #${puja.id_lote}`}
          </Typography>
        </Stack>
      )
    },
    {
      id: 'monto',
      label: 'Mi Oferta',
      minWidth: 140,
      render: (puja) => (
        <Typography variant="body2" fontWeight={700}>
          {formatCurrency(puja.monto_puja)}
        </Typography>
      )
    },
    {
      id: 'estado',
      label: 'Estado',
      minWidth: 160,
      render: (puja) => {
        const configs: Record<string, any> = {
          activa: { label: 'ACTIVA', color: 'info', icon: <Gavel fontSize="small" /> },
          ganadora_pendiente: { label: 'GANASTE (PAGAR)', color: 'warning', icon: <EmojiEvents fontSize="small" />, variant: 'filled' },
          ganadora_pagada: { label: 'ADJUDICADO', color: 'success', icon: <CheckCircle fontSize="small" />, variant: 'filled' },
          perdedora: { label: 'SUPERADA', color: 'default', icon: <Cancel fontSize="small" /> },
        };
        const config = configs[puja.estado_puja] || { label: puja.estado_puja.toUpperCase(), color: 'default' };
        return <Chip label={config.label} color={config.color} size="small" icon={config.icon} variant={config.variant || 'outlined'} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />;
      }
    },
    {
      id: 'fecha',
      label: 'Fecha',
      minWidth: 120,
      render: (puja) => (
        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
          <CalendarMonth sx={{ fontSize: 14 }} />
          {new Date(puja.fecha_puja).toLocaleDateString()}
        </Typography>
      )
    },
    {
      id: 'acciones',
      label: 'Gestión',
      align: 'right',
      render: (puja) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {puja.estado_puja === 'ganadora_pendiente' && (
            <Button
              variant="contained" color="warning" size="small"
              onClick={() => iniciarPagoMutation.mutate(puja.id)}
              disabled={iniciarPagoMutation.isPending}
              startIcon={<Payment />}
              sx={{ fontWeight: 800, borderRadius: 2 }}
            >
              PAGAR
            </Button>
          )}
          <Tooltip title="Ir al Lote">
            <IconButton size="small" onClick={() => navigate(ROUTES.CLIENT.LOTES.DETALLE.replace(':id', String(puja.id_lote)))}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [navigate, formatCurrency, iniciarPagoMutation.isPending]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader title="Mis Ofertas" subtitle="Gestión de pujas y adjudicaciones." />

      <Box mb={4} display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={2}>
        <StatCard title="Capital Ofertado" value={formatCurrency(stats.comprometido)} icon={<MonetizationOn />} color="primary" loading={isLoading} />
        <StatCard title="Pujas Activas" value={stats.activas.toString()} icon={<Gavel />} color="info" loading={isLoading} />
        <StatCard title="Lotes Ganados" value={stats.ganadas.toString()} icon={<EmojiEvents />} color="success" loading={isLoading} />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} textColor="primary" indicatorColor="primary">
          <Tab label="Subastas en Curso" sx={{ fontWeight: 700 }} />
          <Tab label="Historial" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      <QueryHandler isLoading={isLoading} error={error as Error}>
        <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={tabValue === 0 ? activePujas : historyPujas}
            getRowKey={(row) => row.id}
            emptyMessage={tabValue === 0 ? "No tienes ofertas activas." : "El historial está vacío."}
            pagination
          />
        </Paper>
      </QueryHandler>

      <TwoFactorAuthModal
        open={twoFaModal.isOpen}
        onClose={() => { twoFaModal.close(); setTwoFAError(null); }}
        onSubmit={(code) => confirmar2FAMutation.mutate(code)}
        isLoading={confirmar2FAMutation.isPending}
        error={twoFAError}
        title="Confirmar Pago de Lote"
      />
    </PageContainer>
  );
};

export default MisPujas;