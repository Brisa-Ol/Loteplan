// src/pages/client/MiCuenta/Inversiones/MisInversiones.tsx

import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Button, Tooltip,
  useTheme, alpha
} from '@mui/material';
import {
  CheckCircle, Schedule, ErrorOutline, Visibility,
  Payment, Refresh, TrendingUp, MonetizationOn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useModal } from '../../../../shared/hooks/useModal';
import InversionService from '../../../services/inversion.service';
import MercadoPagoService from '../../../services/pagoMercado.service';
import type { ApiError } from '../../../services/httpService';
import useSnackbar from '../../../../shared/hooks/useSnackbar';
import type { InversionDto } from '../../../types/dto/inversion.dto';

import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader/PageHeader';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import TwoFactorAuthModal from '../../../../shared/components/domain/modals/TwoFactorAuthModal/TwoFactorAuthModal';
import { env } from '../../../config/env';


// Helper de Estados (Fuera del componente para evitar recreación)
const getStatusConfig = (estado: string) => {
  switch (estado) {
    case 'pagado': return { label: 'Pagado', color: 'success' as const, icon: <CheckCircle fontSize="small" /> };
    case 'pendiente': return { label: 'Pendiente', color: 'warning' as const, icon: <Schedule fontSize="small" /> };
    case 'fallido': return { label: 'Fallido', color: 'error' as const, icon: <ErrorOutline fontSize="small" /> };
    case 'reembolsado': return { label: 'Reembolsado', color: 'info' as const, icon: <Refresh fontSize="small" /> };
    default: return { label: estado, color: 'default' as const, icon: null };
  }
};

const MisInversiones: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showInfo } = useSnackbar();

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
      
      // Caso A: Requiere 2FA
      if (response.status === 202 || data.is2FARequired) {
        setTwoFAError(null);
        twoFaModal.open();
        return;
      }
      
      // Caso B: Redirección directa
      MercadoPagoService.handleRedirect(data);
    },
    onError: (error: unknown) => {
        setHighlightedId(null);
        const err = error as ApiError;

        if (err.type === 'SECURITY_ACTION') {
            showInfo("⚠️ Para pagar debes configurar tu 2FA primero.");
            navigate('/client/MiCuenta/SecuritySettings');
            return;
        }
    }
  });

  // --- 4. MUTATION (2FA) ---
  const confirmar2FAMutation = useMutation({
    mutationFn: async (codigo: string) => {
      if (!selectedInversionId) throw new Error("ID perdido.");
      return await InversionService.confirmar2FA({ inversionId: selectedInversionId, codigo_2fa: codigo });
    },
    onSuccess: (response) => {
      MercadoPagoService.handleRedirect(response.data);
      twoFaModal.close();
    },
    onError: (err: unknown) => {
        const apiError = err as ApiError;
        setTwoFAError(apiError.message || "Código inválido.");
    }
  });

  // --- HELPERS ---
  const handlePagarClick = (id: number) => payMutation.mutate(id);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat(env.defaultLocale, { 
        style: 'currency', currency: env.defaultCurrency, maximumFractionDigits: 0 
    }).format(val);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(env.defaultLocale, { 
        day: '2-digit', month: 'short', year: 'numeric' 
    });

  // Stats Calculados
  const stats = useMemo(() => ({
    total: inversiones.length,
    pagadas: inversiones.filter(i => i.estado === 'pagado').length,
    monto: inversiones.reduce((acc, inv) => acc + Number(inv.monto), 0)
  }), [inversiones]);

  // --- COLUMNAS ---
  const columns = useMemo<DataTableColumn<InversionDto>[]>(() => [
    {
      id: 'proyecto', label: 'Proyecto / ID', minWidth: 200,
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
      id: 'fecha', label: 'Fecha', minWidth: 120,
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
      id: 'monto', label: 'Monto Invertido', minWidth: 150,
      render: (row) => (
        <Typography variant="body2" fontWeight={700} color="primary.main">
            {formatCurrency(Number(row.monto))}
        </Typography>
      )
    },
    {
      id: 'estado', label: 'Estado', minWidth: 140,
      render: (row) => {
        const status = getStatusConfig(row.estado);
        return (
            <Chip
                label={status.label}
                color={status.color}
                size="small"
                variant="outlined"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                icon={status.icon as any}
                sx={{ fontWeight: 600, borderWidth: 1 }}
            />
        );
      }
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right', minWidth: 180,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [theme, payMutation.isPending, selectedInversionId, navigate]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Historial de Inversiones"
        subtitle='Gestiona tus participaciones y pagos pendientes'
      />

      {/* --- KPI SECTION --- */}
      <Box 
        mb={4} 
        display="grid" 
        gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr 1fr' }} 
        gap={3}
      >
        <StatCard 
            title="Capital Total" 
            value={formatCurrency(stats.monto)} 
            icon={<MonetizationOn />} 
            color="primary" 
            loading={isLoading}
            subtitle="Inversión acumulada"
        />
        <StatCard 
            title="Participaciones" 
            value={stats.total.toString()} 
            icon={<TrendingUp />} 
            color="secondary" 
            loading={isLoading}
            subtitle="Total histórico"
        />
        <StatCard 
            title="Finalizadas" 
            value={stats.pagadas.toString()} 
            icon={<CheckCircle />} 
            color="success" 
            loading={isLoading}
            subtitle="Pagos completados"
        />
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
                highlightedRowId={highlightedId}
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