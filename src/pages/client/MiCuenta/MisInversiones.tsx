// src/pages/User/Inversiones/MisInversiones.tsx

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Button, Tooltip,
  Avatar, Divider, Card, useTheme, alpha
} from '@mui/material';
import {
  CheckCircle, Schedule, ErrorOutline, Visibility,
  Payment, TrendingUp, MonetizationOn, Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

// Servicios y Tipos
import InversionService from '../../../Services/inversion.service';
import type { InversionDto } from '../../../types/dto/inversion.dto';
import MercadoPagoService from '../../../Services/pagoMercado.service';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import TwoFactorAuthModal from '../../../components/common/TwoFactorAuthModal/TwoFactorAuthModal';

// Hooks
import { useModal } from '../../../hooks/useModal';
import type { ApiError } from '../../../Services/httpService';

const MisInversiones: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // --- 1. ESTADOS Y MODAL ---
  const twoFaModal = useModal();
  const [selectedInversionId, setSelectedInversionId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // --- 2. QUERY ---
  const { data: inversiones = [], isLoading, error } = useQuery<InversionDto[]>({
    queryKey: ['misInversiones'],
    queryFn: async () => (await InversionService.getMisInversiones()).data,
    retry: 1
  });

  // --- 3. MUTATION (Pagar) ---
  const payMutation = useMutation({
    mutationFn: async (inversionId: number) => {
      setSelectedInversionId(inversionId);
      setHighlightedId(inversionId); 
      return await MercadoPagoService.iniciarCheckoutModelo('inversion', inversionId);
    },
    onSuccess: (response) => {
      const data = response.data;
      if (response.status === 202 || data.is2FARequired) {
        setTwoFAError(null);
        twoFaModal.open();
        return;
      }
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    },
    onError: (error: unknown) => {
        setHighlightedId(null);
        const err = error as ApiError;

        // ✅ MANEJO DE SEGURIDAD (Si el usuario perdió el estado 2FA/KYC)
        if (err.type === 'SECURITY_ACTION') {
            alert("⚠️ Requisito de Seguridad: Para realizar pagos debes tener activo el 2FA.");
            navigate('/client/MiCuenta/SecuritySettings');
            return;
        }

        alert(err.message || 'Error al iniciar pago');
    }
  });

  // --- 4. MUTATION (2FA) ---
  const confirmar2FAMutation = useMutation({
    mutationFn: async (codigo: string) => {
      if (!selectedInversionId) throw new Error("ID perdido.");
      return await InversionService.confirmar2FA({ inversionId: selectedInversionId, codigo_2fa: codigo });
    },
    onSuccess: (response) => {
      if (response.data.redirectUrl) window.location.href = response.data.redirectUrl;
      twoFaModal.close();
    },
    onError: (err: any) => setTwoFAError(err.response?.data?.error || "Código inválido.")
  });

  // --- HELPERS ---
  const handlePagarClick = (id: number) => payMutation.mutate(id);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  const getStatusConfig = (estado: string) => {
    switch (estado) {
      case 'pagado': return { label: 'Pagado', color: 'success' as const, icon: <CheckCircle fontSize="small" /> };
      case 'pendiente': return { label: 'Pendiente', color: 'warning' as const, icon: <Schedule fontSize="small" /> };
      case 'fallido': return { label: 'Fallido', color: 'error' as const, icon: <ErrorOutline fontSize="small" /> };
      case 'reembolsado': return { label: 'Reembolsado', color: 'info' as const, icon: <Refresh fontSize="small" /> };
      default: return { label: estado, color: 'default' as const, icon: null };
    }
  };

  // Stats Calculados (Memoized)
  const stats = useMemo(() => ({
    total: inversiones?.length || 0,
    pagadas: inversiones?.filter(i => i.estado === 'pagado').length || 0,
    monto: inversiones?.reduce((acc, inv) => acc + Number(inv.monto), 0) || 0
  }), [inversiones]);

  // --- CONFIGURACIÓN DE COLUMNAS ---
  const columns = useMemo<DataTableColumn<InversionDto>[]>(() => [
    {
      id: 'proyecto',
      label: 'Proyecto / ID',
      minWidth: 200,
      render: (row) => (
        <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">
                {row.proyecto?.nombre_proyecto || `Proyecto no disponible`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', opacity: 0.8 }}>
                ID: #{row.id}
            </Typography>
        </Box>
      )
    },
    {
      id: 'fecha',
      label: 'Fecha',
      minWidth: 120,
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1}>
            <Schedule fontSize="inherit" color="action" sx={{ fontSize: 16 }} />
            <Typography variant="body2" color="text.secondary">
                {formatDate(row.fecha_inversion)}
            </Typography>
        </Stack>
      )
    },
    {
      id: 'monto',
      label: 'Monto Invertido',
      minWidth: 150,
      render: (row) => (
        <Typography variant="body2" fontWeight={700} color="primary.main">
            {formatCurrency(Number(row.monto))}
        </Typography>
      )
    },
    {
      id: 'estado',
      label: 'Estado',
      minWidth: 140,
      render: (row) => {
        const status = getStatusConfig(row.estado);
        return (
            <Chip
                label={status.label}
                color={status.color}
                size="small"
                variant="outlined"
                icon={status.icon as any}
                sx={{ fontWeight: 600, borderWidth: 1 }}
            />
        );
      }
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      minWidth: 180,
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Ver detalles">
                <Button
                    variant="outlined"
                    color="inherit"
                    size="small"
                    startIcon={<Visibility fontSize="small" />}
                    onClick={() => navigate(`/proyectos/${row.id_proyecto}`)}
                    sx={{
                        borderColor: theme.palette.divider,
                        color: 'text.secondary',
                        '&:hover': {
                            borderColor: theme.palette.primary.main,
                            color: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.05)
                        }
                    }}
                >
                    Ver
                </Button>
            </Tooltip>

            {row.estado === 'pendiente' && (
                <Tooltip title="Ir a MercadoPago">
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<Payment fontSize="small" />}
                        onClick={() => handlePagarClick(row.id)}
                        disabled={payMutation.isPending}
                        disableElevation
                        sx={{ fontWeight: 600 }}
                    >
                        {payMutation.isPending && selectedInversionId === row.id ? '...' : 'Pagar'}
                    </Button>
                </Tooltip>
            )}
        </Stack>
      )
    }
  ], [theme, payMutation.isPending, selectedInversionId, navigate]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Historial de Inversiones"
        subtitle='Gestiona tus participaciones y pagos pendientes'
      />

      {/* --- KPI SECTION --- */}
      <Box mb={4} display="flex" justifyContent="center">
        <Card
          elevation={0}
          sx={{
            p: 3,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            bgcolor: 'background.paper',
            boxShadow: theme.shadows[1],
            minWidth: { xs: '100%', md: '80%' }
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 2 }} />}
            spacing={{ xs: 4, md: 6 }}
            alignItems="center"
            justifyContent="center"
          >
            {/* KPI 1: Capital */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}>
                <MonetizationOn fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  CAPITAL TOTAL
                </Typography>
                <Typography variant="h4" fontWeight={700} color="text.primary">
                  {formatCurrency(stats.monto)}
                </Typography>
              </Box>
            </Stack>

            {/* KPI 2: Total */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', width: 56, height: 56 }}>
                <TrendingUp fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  PARTICIPACIONES
                </Typography>
                <Typography variant="h4" fontWeight={700} color="text.primary">
                  {stats.total}
                </Typography>
              </Box>
            </Stack>

            {/* KPI 3: Exitosas */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 56, height: 56 }}>
                <CheckCircle fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5}>
                  FINALIZADAS
                </Typography>
                <Typography variant="h4" fontWeight={700} color="text.primary">
                  {stats.pagadas}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Card>
      </Box>

      {/* --- DATATABLE --- */}
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <Paper
            elevation={0}
            sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: theme.shadows[2]
            }}
        >
            <DataTable
                columns={columns}
                data={inversiones}
                getRowKey={(row) => row.id}
                pagination
                defaultRowsPerPage={10}
                
                // ✅ Feedback visual al pagar
                highlightedRowId={highlightedId}

                // ✅ Atenuar reembolsadas/fallidas
                isRowActive={(row) => !['fallido', 'reembolsado'].includes(row.estado)}

                emptyMessage="Aún no tienes inversiones registradas."
            />
        </Paper>
      </QueryHandler>

      {/* Modal 2FA */}
      <TwoFactorAuthModal
        open={twoFaModal.isOpen}
        onClose={() => { twoFaModal.close(); setTwoFAError(null); }}
        onSubmit={(code) => confirmar2FAMutation.mutate(code)}
        isLoading={confirmar2FAMutation.isPending}
        error={twoFAError}
        title="Seguridad Requerida"
        description="Confirma tu pago ingresando el código de autenticación de tu app."
      />
    </PageContainer>
  );
};

export default MisInversiones;