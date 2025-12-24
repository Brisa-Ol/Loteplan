import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Box, 
  Typography, 
  Button, 
  Chip, 
  Tabs, 
  Tab, 
  Badge,
  Stack,
  Card,
  Avatar,
  Divider,
  useTheme,
  alpha,
  Paper
} from '@mui/material';
import { 
  Lock, 
  CheckCircle, 
  ErrorOutline, 
  AccountBalanceWallet, 
  Schedule,
  ReceiptLong,
  MonetizationOn,
  Refresh,
  Warning
} from '@mui/icons-material';

// --- SERVICIOS Y TIPOS ---
import PagoService from '../../../../Services/pago.service';
import SuscripcionService from '../../../../Services/suscripcion.service';
import MercadoPagoService from '../../../../Services/pagoMercado.service';
import type { SuscripcionDto } from '../../../../types/dto/suscripcion.dto';
import type { PagoDto } from '../../../../types/dto/pago.dto';

// --- COMPONENTES COMUNES ---
import { PageContainer } from '../../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import TwoFactorAuthModal from '../../../../components/common/TwoFactorAuthModal/TwoFactorAuthModal';
import { DataTable, type DataTableColumn } from '../../../../components/common/DataTable/DataTable'; 
import { useModal } from '../../../../hooks/useModal';
import { HistorialPagosAgrupado } from './components/HistorialAgrupado';

// ----------------------------------------------------------------------
// HELPER: Configuración visual de estados
// ----------------------------------------------------------------------
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pagado':
      return { color: 'success', label: 'Pagado', icon: <CheckCircle /> };
    case 'pendiente':
      return { color: 'info', label: 'Próximo', icon: <Schedule /> };
    case 'vencido':
      return { color: 'error', label: 'Vencido', icon: <ErrorOutline /> };
    case 'cubierto_por_puja':
      return { color: 'success', label: 'Cubierto (Puja)', icon: <AccountBalanceWallet /> };
    default:
      return { color: 'default', label: status, icon: null };
  }
};

const MisPagos: React.FC = () => {
  const theme = useTheme();
  
  // 1. Hooks y Estados
  const twoFaModal = useModal();
  const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  
  // Tabs: 0 = Por Pagar, 1 = Vencidas, 2 = Historial
  const [currentTab, setCurrentTab] = useState(0); 

  // 2. Carga de Datos
  const pagosQuery = useQuery<PagoDto[]>({
    queryKey: ['misPagos'],
    queryFn: async () => (await PagoService.getMyPayments()).data,
    refetchOnWindowFocus: false
  });

  const suscripcionesQuery = useQuery<SuscripcionDto[]>({
    queryKey: ['misSuscripciones'],
    queryFn: async () => (await SuscripcionService.getMisSuscripciones()).data,
    staleTime: 1000 * 60 * 5 // Cachear 5 min
  });

  const isLoading = pagosQuery.isLoading || suscripcionesQuery.isLoading;
  const error = pagosQuery.error || suscripcionesQuery.error;

  // Helper interno
  const getNombreProyecto = (idProyecto: number) => {
    const sub = suscripcionesQuery.data?.find(s => s.id_proyecto === idProyecto);
    return sub?.proyectoAsociado?.nombre_proyecto || `Proyecto #${idProyecto}`;
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  // 3. Lógica de Filtrado y Contadores
  const { filteredData, counts, historialData, stats } = useMemo(() => {
    const data = pagosQuery.data || [];
    
    // Contadores
    const counts = {
      pendientes: data.filter(p => p.estado_pago === 'pendiente').length,
      vencidas: data.filter(p => p.estado_pago === 'vencido').length,
      pagadas: data.filter(p => p.estado_pago === 'pagado' || p.estado_pago === 'cubierto_por_puja').length
    };

    // Montos totales para KPI
    const stats = {
        deudaVencida: data.filter(p => p.estado_pago === 'vencido').reduce((acc, curr) => acc + Number(curr.monto), 0),
        proximosVencimientos: data.filter(p => p.estado_pago === 'pendiente').reduce((acc, curr) => acc + Number(curr.monto), 0)
    };

    // Ordenamiento
    const sorted = [...data].sort((a, b) => 
      new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime()
    );

    let filtered: PagoDto[] = [];

    switch (currentTab) {
      case 0: // Por Pagar
        filtered = sorted.filter(p => p.estado_pago === 'pendiente');
        break;
      case 1: // Vencidas
        filtered = sorted.filter(p => p.estado_pago === 'vencido');
        break;
      case 2: // Historial
        filtered = [];
        break;
    }

    const historialData = sorted.filter(p => 
        p.estado_pago === 'pagado' || p.estado_pago === 'cubierto_por_puja'
    );

    return { filteredData: filtered, counts, historialData, stats };
  }, [pagosQuery.data, currentTab]);

  // 4. Mutaciones
  const iniciarPagoMutation = useMutation({
    mutationFn: async (pagoId: number) => {
      setSelectedPagoId(pagoId);
      return await MercadoPagoService.iniciarCheckoutModelo('pago', pagoId);
    },
    onSuccess: (response) => {
      const data = response.data;
      if (response.status === 202 || data.is2FARequired) {
        setTwoFAError(null);
        twoFaModal.open();
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Error al iniciar el pago.");
      setSelectedPagoId(null);
    }
  });

  const confirmar2FAMutation = useMutation({
    mutationFn: async (codigo: string) => {
      if (!selectedPagoId) throw new Error("ID de pago perdido.");
      return await PagoService.confirmarPago2FA({ pagoId: selectedPagoId, codigo_2fa: codigo });
    },
    onSuccess: (response) => {
      if (response.data.redirectUrl) window.location.href = response.data.redirectUrl;
      twoFaModal.close();
    },
    onError: (err: any) => setTwoFAError(err.response?.data?.error || "Código inválido.")
  });

  // 5. Columnas
  const columns: DataTableColumn<PagoDto>[] = useMemo(() => [
    {
      id: 'proyecto',
      label: 'Proyecto',
      minWidth: 180,
      render: (row) => (
        <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight="bold" color="text.primary">
            {getNombreProyecto(row.id_proyecto ?? 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
             ID Suscripción: #{row.id_suscripcion}
            </Typography>
        </Stack>
      )
    },
    {
      id: 'mes',
      label: 'Cuota',
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Chip 
            label={`Cuota ${row.mes}`} 
            size="small" 
            variant="outlined" 
            sx={{ fontWeight: 600, borderColor: theme.palette.divider }}
        />
      )
    },
    {
      id: 'fecha_vencimiento',
      label: 'Vencimiento',
      minWidth: 120,
      format: (value) => new Date(value).toLocaleDateString()
    },
    {
      id: 'monto',
      label: 'Monto',
      minWidth: 140,
      render: (row) => (
        <Typography variant="subtitle2" color="primary.main" fontWeight={800}>
          {formatCurrency(Number(row.monto))}
        </Typography>
      )
    },
    {
      id: 'estado_pago',
      label: 'Estado',
      minWidth: 140,
      render: (row) => {
        const config = getStatusConfig(row.estado_pago);
        return (
          <Chip 
            label={config.label} 
            color={config.color as any} 
            size="small" 
            variant="filled" // O "soft" si lo tienes configurado
            icon={config.icon as any}
            sx={{ fontWeight: 600 }}
          />
        );
      }
    },
    {
      id: 'acciones',
      label: 'Acción',
      align: 'right',
      render: (row) => {
        const isProcessing = iniciarPagoMutation.isPending && selectedPagoId === row.id;

        return (
          <Button
            variant="contained"
            color={row.estado_pago === 'vencido' ? 'error' : 'primary'}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              iniciarPagoMutation.mutate(row.id);
            }}
            disabled={iniciarPagoMutation.isPending}
            startIcon={!isProcessing ? <Lock fontSize="small" /> : null}
            disableElevation
            sx={{ 
                borderRadius: 2, 
                minWidth: 120, 
                fontWeight: 700,
                boxShadow: theme.shadows[2]
            }}
          >
            {isProcessing ? '...' : row.estado_pago === 'vencido' ? 'Regularizar' : 'Pagar'}
          </Button>
        );
      }
    }
  ], [suscripcionesQuery.data, iniciarPagoMutation.isPending, selectedPagoId, theme]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader 
        title="Mis Cuotas" 
        subtitle="Gestiona tus obligaciones mensuales y visualiza el progreso de tus planes."

      />

      {/* --- KPI SUMMARY (Estilo MisInversiones) --- */}
      <Box mb={4} display="flex" justifyContent="center">
        <Card
          elevation={0}
          sx={{
            p: 3,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            bgcolor: 'background.paper',
            minWidth: { xs: '100%', md: '80%' }
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, mx: 2 }} />}
            spacing={{ xs: 4, sm: 4 }}
            justifyContent="center"
            alignItems="center"
          >
            {/* KPI 1: Próximos Pagos */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', width: 56, height: 56 }}>
                <Schedule fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  PRÓXIMOS A VENCER
                </Typography>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                  {formatCurrency(stats.proximosVencimientos)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                   {counts.pendientes} cuotas pendientes
                </Typography>
              </Box>
            </Stack>

            {/* KPI 2: Deuda Vencida */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', width: 56, height: 56 }}>
                <Warning fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  DEUDA VENCIDA
                </Typography>
                <Typography variant="h5" fontWeight={700} color="error.main">
                  {formatCurrency(stats.deudaVencida)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {counts.vencidas} cuotas vencidas
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Card>
      </Box>

      {/* --- TABS --- */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
            value={currentTab} 
            onChange={(_, val) => setCurrentTab(val)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
        >
          <Tab 
            icon={<Schedule />} 
            iconPosition="start"
            label={
              <Badge badgeContent={counts.pendientes} color="info" sx={{ px: 1 }}>
                Por Pagar
              </Badge>
            } 
          />
          
          <Tab 
            icon={<ErrorOutline />}
            iconPosition="start"
            label={
              <Badge badgeContent={counts.vencidas} color="error" sx={{ px: 1 }}>
                Vencidas
              </Badge>
            } 
            sx={{ 
                color: counts.vencidas > 0 ? 'error.main' : 'inherit',
                fontWeight: counts.vencidas > 0 ? 'bold' : 'normal'
            }}
          />

          <Tab 
            icon={<ReceiptLong />}
            iconPosition="start"
            label={`Historial (${counts.pagadas})`} 
          />
        </Tabs>
      </Box>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        
        {/* --- CONTENIDO --- */}
        <Box>
            {currentTab === 2 ? (
                // Vista Historial (Agrupado)
                <HistorialPagosAgrupado 
                    pagos={historialData}
                    suscripciones={suscripcionesQuery.data || []}
                />
            ) : (
                // Vista Tabla (Pendientes / Vencidas)
                <Paper 
                    elevation={0}
                    sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: theme.shadows[1]
                    }}
                >
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        getRowKey={(row) => row.id}
                        pagination={true}
                        defaultRowsPerPage={10}
                        emptyMessage={
                            currentTab === 0 ? "¡Todo al día! No tienes pagos pendientes." :
                            "¡Excelente! No tienes cuotas vencidas."
                        }
                        getRowSx={(row) => ({
                            bgcolor: row.estado_pago === 'vencido' ? alpha(theme.palette.error.main, 0.05) : 'inherit',
                            transition: 'background-color 0.3s',
                            '&:hover': {
                                bgcolor: row.estado_pago === 'vencido' ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.action.hover, 0.05)
                            }
                        })}
                    />
                </Paper>
            )}
        </Box>

      </QueryHandler>

      {/* --- MODAL 2FA --- */}
      <TwoFactorAuthModal 
        open={twoFaModal.isOpen} 
        onClose={() => { twoFaModal.close(); setSelectedPagoId(null); setTwoFAError(null); }} 
        onSubmit={(code) => confirmar2FAMutation.mutate(code)} 
        isLoading={confirmar2FAMutation.isPending} 
        error={twoFAError}
        title="Confirmar Pago Seguro"
        description="Por seguridad, ingresa el código de tu autenticador para procesar este pago."
      />
    </PageContainer>
  );
};

export default MisPagos;