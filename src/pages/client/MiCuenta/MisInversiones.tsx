import React, { useState } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Button, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Skeleton, alpha, useTheme,
  Divider, Card
} from '@mui/material';
import {
  CheckCircle, Schedule, ErrorOutline, Visibility,
  Payment, TrendingUp, MonetizationOn
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
import DetalleProyecto from '../Proyectos/DetalleProyecto';

const MisInversiones: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // --- 1. ESTADOS Y MODAL ---
  const twoFaModal = useModal();
  const [selectedInversionId, setSelectedInversionId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  // --- 2. QUERY ---
  const { data: inversiones, isLoading, isError } = useQuery<InversionDto[]>({
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

  // --- HANDLER ---
  const handlePagarClick = (id: number) => payMutation.mutate(id);

  // --- HELPERS VISUALES ---
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getStatusConfig = (estado: string) => {
    switch (estado) {
      case 'pagado': return { label: 'Pagado', color: 'success' as const, icon: <CheckCircle fontSize="small" /> };
      case 'pendiente': return { label: 'Pago Pendiente', color: 'warning' as const, icon: <Schedule fontSize="small" /> };
      case 'fallido': return { label: 'Fallido', color: 'error' as const, icon: <ErrorOutline fontSize="small" /> };
      case 'reembolsado': return { label: 'Reembolsado', color: 'info' as const, icon: <CheckCircle fontSize="small" /> };
      default: return { label: estado, color: 'default' as const, icon: null };
    }
  };

  // Stats
  const stats = {
    total: inversiones?.length || 0,
    pagadas: inversiones?.filter(i => i.estado === 'pagado').length || 0,
    monto: inversiones?.reduce((acc, inv) => acc + Number(inv.monto), 0) || 0
  };

  return (
    <PageContainer maxWidth="lg">
      <PageHeader title="Historial de Inversiones" subtitle='Gestiona tus participaciones y pagos pendientes' />

      {/* --- KPI SECTION (Adaptado al Theme) --- */}
      {/* Usamos <Card> porque tu theme ya define bordes de 12px, sombras y hover effects */}
      <Box display="flex" justifyContent="center" mb={4} width="100%">
        <Card
          elevation={0} // El theme ya maneja sombras, o ponemos 0 si queremos flat con borde
          sx={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4, 
            px: 4, 
            py: 2,
            width: 'fit-content',
            // Forzamos fondo blanco porque tu theme.paper es gris (#ECECEC)
            bgcolor: 'background.default', 
            border: `1px solid ${theme.palette.secondary.dark}` // Usamos el gris de tu paleta
          }}
        >
          {/* Item 1: Capital */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 48, height: 48 }}>
              <MonetizationOn fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5} display="block">
                CAPITAL
              </Typography>
              <Typography variant="h5" color="text.primary">
                {formatCurrency(stats.monto)}
              </Typography>
            </Box>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'secondary.dark' }} />

          {/* Item 2: Total */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: alpha(theme.palette.text.secondary, 0.1), color: 'text.secondary', width: 48, height: 48 }}>
              <TrendingUp fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5} display="block">
                TOTAL
              </Typography>
              <Typography variant="h5" color="text.primary">
                {stats.total}
              </Typography>
            </Box>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'secondary.dark' }} />

          {/* Item 3: Exitosas */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 48, height: 48 }}>
              <CheckCircle fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.5} display="block">
                EXITOSAS
              </Typography>
              <Typography variant="h5" color="text.primary">
                {stats.pagadas}
              </Typography>
            </Box>
          </Stack>
        </Card>
      </Box>

      {/* --- DATATABLE --- */}
      <TableContainer 
        component={Paper} 
        elevation={0} 
        sx={{ 
          // Paper ya tiene borderRadius: 12 por tu theme
          bgcolor: 'background.default', // Fondo blanco para contraste
          border: `1px solid ${theme.palette.secondary.dark}`
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'secondary.light' }}> {/* Usamos el gris claro del theme */}
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Proyecto</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Monto</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Estado</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {isLoading ? (
              [1, 2, 3].map((n) => (
           <TableRow key={n}>
        <TableCell><Skeleton variant="text" width={150} /></TableCell>
        <TableCell><Skeleton variant="text" width={80} /></TableCell>
        <TableCell><Skeleton variant="text" width={100} /></TableCell>
        <TableCell><Skeleton variant="rounded" width={80} height={24} /></TableCell>
        <TableCell align="right"><Skeleton variant="rectangular" width={40} height={30} sx={{ display: 'inline-block' }} /></TableCell>
      </TableRow>
              ))
            ) : isError ? (
              <TableRow>
      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
         <ErrorOutline color="error" sx={{ mb: 1 }} />
         <Typography color="error">No se pudieron cargar los datos.</Typography>
      </TableCell>
    </TableRow>
            ) : inversiones && inversiones.length > 0 ? (
              inversiones.map((inversion) => {
                const status = getStatusConfig(inversion.estado);
                const nombreProyecto = inversion.proyecto?.nombre_proyecto || `Inversión #${inversion.id}`;


               return (
        <TableRow 
          key={inversion.id} 
          hover 
          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
        >
          {/* ... (Las columnas de Proyecto, Fecha, Monto y Estado quedan igual) ... */}
          <TableCell>
            {/* ... Contenido Proyecto ... */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box>
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  {nombreProyecto}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                   ID: {inversion.id}
                </Typography>
              </Box>
            </Stack>
          </TableCell>

          <TableCell>
            <Typography variant="body2">{formatDate(inversion.fecha_inversion)}</Typography>
          </TableCell>

          <TableCell>
            <Typography variant="body2" fontWeight={600} color="primary.dark">
              {formatCurrency(inversion.monto)}
            </Typography>
          </TableCell>

          <TableCell>
            <Chip 
              label={status.label} 
              color={status.color} 
              size="small" 
              variant="outlined"
              icon={status.icon as any}
            />
          </TableCell>

          {/* ✅ COLUMNA DE ACCIONES ACTUALIZADA */}
          <TableCell align="right">
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              
              {/* 1. Botón Ver Proyecto (Estilo similar a Pagar pero Outlined) */}
              <Tooltip title="Ir al detalle del proyecto">
                <Button
                  variant="outlined" // Usamos outlined para diferenciarlo visualmente del pago
                  color="primary"    // Color principal
                  size="small"
                  startIcon={<Visibility fontSize="small" />}
                  onClick={() => navigate(`/proyectos/${inversion.id_proyecto}`)}
                  sx={{ fontWeight: 600 }}
                >
                  Ver
                </Button>
              </Tooltip>

              {/* 2. Botón Pagar (Solo si está pendiente) */}
              {inversion.estado === 'pendiente' && (
                <Tooltip title="Realizar pago pendiente">
                  <Button
                    variant="contained"
                    color="warning"
                    size="small"
                    startIcon={<Payment fontSize="small" />}
                    onClick={() => handlePagarClick(inversion.id)} // Usamos el ID de la inversión
                    disabled={payMutation.isPending}
                    disableElevation
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

              <TableRow>
      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
        <TrendingUp sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography variant="subtitle1" color="text.secondary">Aún no tienes inversiones.</Typography>
        <Button 
          variant="outlined" 
          size="small" 
          sx={{ mt: 2 }} 
          onClick={() => navigate('/client/Proyectos/RoleSelection')}
        >
          Explorar Oportunidades
        </Button>
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
        title="Confirmar Pago"
        description="Ingresa el código para autorizar la transacción."
      />
    </PageContainer>
  );
};

export default MisInversiones;