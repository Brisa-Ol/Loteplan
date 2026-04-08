// src/features/client/pages/Pujas/MisPujas.tsx

import PujaService from '@/core/api/services/puja.service';
import type { PujaDto } from '@/core/types/puja.dto';
import { ROUTES } from '@/routes';
import { BaseModal, DataTable, PageContainer, PageHeader, QueryHandler, StatCard, useModal, type DataTableColumn } from '@/shared';
import TwoFactorAuthModal from '@/shared/components/domain/modals/TwoFactorAuthModal';
import {
  Cancel,
  Celebration,
  CheckCircle, EmojiEvents, Gavel,
  InfoOutlined,
  MonetizationOn,
  Payment, Visibility
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box, Button, Chip,
  Divider,
  IconButton, Paper, Stack,
  Tab, Tabs, Tooltip, Typography,
  useTheme
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useSnackbar from '../../../../shared/hooks/useSnackbar';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

const MisPujas: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showError } = useSnackbar();
  const formatCurrency = useCurrencyFormatter();

  const [tabValue, setTabValue] = useState(0);
  const twoFaModal = useModal();
  const checkoutModal = useModal();
  const successPaymentModal = useModal();

  const [selectedPuja, setSelectedPuja] = useState<PujaDto | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  // --- QUERIES ---
  const { data: misPujas = [], isLoading, error, refetch } = useQuery<PujaDto[]>({
    queryKey: ['misPujas'],
    queryFn: async () => (await PujaService.getMyPujas()).data,
  });

  // LÓGICA DE DETECCIÓN DE PAGO EXITOSO AL VOLVER DE MERCADO PAGO
  useEffect(() => {
    const status = searchParams.get('status');
    const collectionStatus = searchParams.get('collection_status');

    if (status === 'approved' || collectionStatus === 'approved') {
      successPaymentModal.open();
      setSearchParams({}); // Limpiar URL
      refetch(); // Actualizar tabla para ver el estado 'ganadora_pagada'
    }
  }, [searchParams, refetch]);

  const { activePujas, historyPujas, stats } = useMemo(() => {
    const activeStates = ['activa', 'ganadora_pendiente'];
    const active = misPujas.filter(p => activeStates.includes(p.estado_puja));
    const history = misPujas.filter(p => !activeStates.includes(p.estado_puja));

    const totalComprometido = active.reduce((acc, curr) => acc + Number(curr.monto_puja || 0), 0);
    
    // ✅ CORREGIDO: Usamos estado_puja y el valor correcto 'ganadora_pagada'
    const ganadas = misPujas.filter(p => 
      ['ganadora_pagada', 'ganadora_pendiente'].includes(p.estado_puja)
    ).length;

    return {
      activePujas: active.sort((a, b) => new Date(b.fecha_puja).getTime() - new Date(a.fecha_puja).getTime()),
      historyPujas: history.sort((a, b) => new Date(b.fecha_puja).getTime() - new Date(a.fecha_puja).getTime()),
      stats: { activas: active.length, ganadas, comprometido: totalComprometido }
    };
  }, [misPujas]);

  // --- HANDLERS ---
  const handlePagarClick = (puja: PujaDto) => {
    setSelectedPuja(puja);
    checkoutModal.open();
  };

  const iniciarPagoMutation = useMutation({
    mutationFn: async (pujaId: number) => await PujaService.initiatePayment(pujaId),
    onSuccess: (res: any) => {
      checkoutModal.close();
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
    mutationFn: (code: string) =>
      PujaService.confirmPayment2FA({
        pujaId: selectedPuja!.id,
        codigo_2fa: code
      }),
    onSuccess: (res: any) => {
      if (res.data?.url_checkout) {
        window.location.href = res.data.url_checkout;
      }
      twoFaModal.close();
    },
    onError: (err: any) => setTwoFAError(err.response?.data?.message || "Código incorrecto")
  });

  const columns = useMemo<DataTableColumn<PujaDto>[]>(() => [
    {
      id: 'proyecto',
      label: 'Proyecto',
      minWidth: 200,
      render: (puja) => {
        const nombreProj = (puja.lote as any)?.proyectoLote?.nombre_proyecto || puja.proyectoAsociado?.nombre_proyecto || 'Proyecto General';
        return <Typography variant="subtitle2" fontWeight={800} color="primary.main">{nombreProj}</Typography>;
      }
    },
    {
      id: 'lote',
      label: 'Lote',
      minWidth: 150,
      render: (puja) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: puja.estado_puja === 'activa' ? 'success.main' : 'divider' }} />
          <Typography variant="body2" fontWeight={600}>{puja.lote?.nombre_lote || `Lote #${puja.id_lote}`}</Typography>
        </Stack>
      )
    },
    {
      id: 'monto',
      label: 'Mi Oferta',
      minWidth: 140,
      render: (puja) => <Typography variant="body2" fontWeight={700}>{formatCurrency(puja.monto_puja)}</Typography>
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
      id: 'acciones',
      label: 'Gestión',
      align: 'right',
      render: (puja) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {puja.estado_puja === 'ganadora_pendiente' && (
            <Button
              variant="contained" color="warning" size="small"
              onClick={() => handlePagarClick(puja)}
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
      <PageHeader title="Mis Pujas" subtitle="Gestión de pujas y adjudicaciones." />

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
            pagination
          />
        </Paper>
      </QueryHandler>

      {/* MODAL DE RESUMEN DE PAGO */}
      <BaseModal
        open={checkoutModal.isOpen}
        onClose={checkoutModal.close}
        title="Resumen de Adjudicación"
        maxWidth="xs"
        confirmText="Continuar al Pago"
        onConfirm={() => iniciarPagoMutation.mutate(selectedPuja!.id)}
        isLoading={iniciarPagoMutation.isPending}
        headerColor="success"
        icon={<EmojiEvents />}
      >
        {selectedPuja && (
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="h6" fontWeight={900} color="success.main">¡Felicitaciones!</Typography>
              <Typography variant="body2" color="text.secondary">Has ganado la subasta para el siguiente lote:</Typography>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02), borderRadius: 2 }}>
              <Stack spacing={1.5}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" fontWeight={700} color="text.secondary">PROYECTO</Typography>
                  <Typography variant="body2" fontWeight={800}>{(selectedPuja.lote as any)?.proyectoLote?.nombre_proyecto || 'General'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" fontWeight={700} color="text.secondary">LOTE</Typography>
                  <Typography variant="body2" fontWeight={800}>{selectedPuja.lote?.nombre_lote}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" fontWeight={900}>TOTAL A PAGAR</Typography>
                  <Typography variant="h6" fontWeight={900} color="primary.main">{formatCurrency(selectedPuja.monto_puja)}</Typography>
                </Box>
              </Stack>
            </Paper>

            <Box sx={{ display: 'flex', gap: 1.5, p: 1.5, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
              <InfoOutlined color="info" fontSize="small" />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                Al continuar, se generará una orden de pago segura.
              </Typography>
            </Box>
          </Stack>
        )}
      </BaseModal>

      {/* MODAL DE PAGO EXITOSO */}
      <BaseModal
        open={successPaymentModal.isOpen}
        onClose={successPaymentModal.close}
        title="¡Pago Confirmado!"
        maxWidth="xs"
        hideConfirmButton
        cancelText="Entendido"
        headerColor="success"
        icon={<CheckCircle />}
      >
        <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center', py: 2 }}>
          <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), width: 60, height: 60 }}>
            <Celebration sx={{ color: 'success.main', fontSize: 35 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={900}>¡Adjudicación Exitosa!</Typography>
            <Typography variant="body2" color="text.secondary">
              Tu lote ya figura como <b>ADJUDICADO</b>. Puedes revisarlo en tu historial.
            </Typography>
          </Box>
          <Button variant="contained" color="success" fullWidth onClick={successPaymentModal.close} sx={{ mt: 2, fontWeight: 800 }}>
            Cerrar
          </Button>
        </Stack>
      </BaseModal>

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