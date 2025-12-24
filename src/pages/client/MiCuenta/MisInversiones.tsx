import React, { useState } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Button, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Skeleton, alpha, useTheme,
  Divider, Card
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
import TwoFactorAuthModal from '../../../components/common/TwoFactorAuthModal/TwoFactorAuthModal';

// Hooks
import { useModal } from '../../../hooks/useModal';

const MisInversiones: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // --- 1. ESTADOS Y MODAL ---
  const twoFaModal = useModal();
  const [selectedInversionId, setSelectedInversionId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  // --- 2. QUERY ---
  const { data: inversiones, isLoading, isError, refetch } = useQuery<InversionDto[]>({
    queryKey: ['misInversiones'],
    queryFn: async () => (await InversionService.getMisInversiones()).data,
    retry: 1
  });

  // --- 3. MUTATION (Pagar) ---
  const payMutation = useMutation({
    mutationFn: async (inversionId: number) => {
      return await MercadoPagoService.iniciarCheckoutModelo('inversion', inversionId);
    },
    onSuccess: (response, inversionId) => {
      const data = response.data;
      if (response.status === 202 || data.is2FARequired) {
        setSelectedInversionId(inversionId);
        setTwoFAError(null);
        twoFaModal.open();
        return;
      }
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Error al iniciar pago')
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
      case 'reembolsado': return { label: 'Reembolsado', color: 'info' as const, icon: <CheckCircle fontSize="small" /> };
      default: return { label: estado, color: 'default' as const, icon: null };
    }
  };

  // Stats Calculados
  const stats = {
    total: inversiones?.length || 0,
    pagadas: inversiones?.filter(i => i.estado === 'pagado').length || 0,
    monto: inversiones?.reduce((acc, inv) => acc + Number(inv.monto), 0) || 0
  };

  // --- CONFIGURACIÓN DE COLUMNAS ---
  const columns = [
    { id: 'proyecto', label: 'Proyecto / ID', align: 'left' },
    { id: 'fecha', label: 'Fecha', align: 'left' },
    { id: 'monto', label: 'Monto Invertido', align: 'left' },
    { id: 'estado', label: 'Estado', align: 'left' },
    { id: 'acciones', label: 'Acciones', align: 'right' },
  ];

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
            boxShadow: theme.shadows[1]
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 2 }} />}
            spacing={{ xs: 4, md: 6 }}
            alignItems="center"
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
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: theme.shadows[2]
        }}
      >
        <Table sx={{ minWidth: 700 }}>
          {/* Header */}
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align as any}
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    py: 2.5
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* Body */}
          <TableBody>
            {isLoading ? (
              // Loading State
              Array.from(new Array(3)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="text" width={180} height={25} /><Skeleton variant="text" width={100} height={15} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell><Skeleton variant="text" width={120} /></TableCell>
                  <TableCell><Skeleton variant="rounded" width={80} height={24} /></TableCell>
                  <TableCell align="right"><Skeleton variant="rounded" width={100} height={30} sx={{ ml: 'auto' }} /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              // Error State
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <ErrorOutline color="error" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography color="error" variant="body2">No se pudieron cargar las inversiones.</Typography>
                  <Button size="small" onClick={() => refetch()} sx={{ mt: 1 }}>Reintentar</Button>
                </TableCell>
              </TableRow>
            ) : inversiones && inversiones.length > 0 ? (
              // Data State
              inversiones.map((inversion) => {
                const status = getStatusConfig(inversion.estado);
                const nombreProyecto = inversion.proyecto?.nombre_proyecto || `Proyecto no disponible`;

                return (
                  <TableRow
                    key={inversion.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.2s',
                      cursor: 'default'
                    }}
                  >
                    {/* Columna: Proyecto */}
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="text.primary">
                          {nombreProyecto}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', opacity: 0.8 }}>
                          ID: #{inversion.id}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Columna: Fecha */}
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Schedule fontSize="inherit" color="action" sx={{ fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(inversion.fecha_inversion)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Columna: Monto */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="text.primary">
                        {formatCurrency(inversion.monto)}
                      </Typography>
                    </TableCell>

                    {/* Columna: Estado */}
                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        variant="outlined"
                        icon={status.icon as any}
                        sx={{ fontWeight: 600, borderWidth: 1 }}
                      />
                    </TableCell>

                    {/* Columna: Acciones */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">

                        <Tooltip title="Ver detalles">
                          <Button
                            variant="outlined"
                            color="inherit"
                            size="small"
                            startIcon={<Visibility fontSize="small" />}
                            onClick={() => navigate(`/proyectos/${inversion.id_proyecto}`)}
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

                        {inversion.estado === 'pendiente' && (
                          <Tooltip title="Ir a MercadoPago">
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<Payment fontSize="small" />}
                              onClick={() => handlePagarClick(inversion.id)}
                              disabled={payMutation.isPending}
                              disableElevation
                              sx={{ fontWeight: 600 }}
                            >
                              Pagar
                            </Button>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              // Empty State
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 4,
                      maxWidth: 400,
                      mx: 'auto',
                      bgcolor: 'background.default',
                      borderStyle: 'dashed',
                      borderColor: theme.palette.divider,
                      borderRadius: 4
                    }}
                  >
                    <Box
                      sx={{
                        width: 64, height: 64, mx: 'auto', mb: 2, borderRadius: '50%',
                        bgcolor: alpha(theme.palette.text.secondary, 0.1),
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <TrendingUp sx={{ fontSize: 32, color: 'text.secondary', opacity: 0.5 }} />
                    </Box>
                    <Typography variant="h6" color="text.primary" gutterBottom fontWeight={600}>
                      Aún no tienes inversiones
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      Explora los proyectos inmobiliarios disponibles y comienza a invertir hoy mismo.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => navigate('/client/Proyectos/RoleSelection')}
                      disableElevation
                      sx={{ borderRadius: 2 }}
                    >
                      Explorar Oportunidades
                    </Button>
                  </Paper>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

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