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
  Stack
} from '@mui/material';
import { 
  Lock, 
  CheckCircle, 
  ErrorOutline, 
  AccountBalanceWallet, 
  Schedule,
  ReceiptLong
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
import { DataTable, type DataTableColumn } from '../../../../components/common/DataTable/DataTable'; // Ajusta la ruta
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

  // Helper interno para obtener nombre del proyecto en la tabla
  const getNombreProyecto = (idProyecto: number) => {
    const sub = suscripcionesQuery.data?.find(s => s.id_proyecto === idProyecto);
    return sub?.proyectoAsociado?.nombre_proyecto || `Proyecto #${idProyecto}`;
  };

  // 3. Lógica de Filtrado y Contadores
  const { filteredData, counts, historialData } = useMemo(() => {
    const data = pagosQuery.data || [];
    
    // Contadores para los Badges (Notificaciones)
    const counts = {
      pendientes: data.filter(p => p.estado_pago === 'pendiente').length,
      vencidas: data.filter(p => p.estado_pago === 'vencido').length,
      pagadas: data.filter(p => p.estado_pago === 'pagado' || p.estado_pago === 'cubierto_por_puja').length
    };

    // Ordenamiento por fecha de vencimiento
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
      case 2: // Historial (Solo para tener la referencia, aunque usaremos historialData)
        filtered = [];
        break;
    }

    // Datos específicos para el componente de Historial (Pagados o Cubiertos)
    const historialData = sorted.filter(p => 
        p.estado_pago === 'pagado' || p.estado_pago === 'cubierto_por_puja'
    );

    return { filteredData: filtered, counts, historialData };
  }, [pagosQuery.data, currentTab]);

  // 4. Mutaciones (Checkout y 2FA)
  const iniciarPagoMutation = useMutation({
    mutationFn: async (pagoId: number) => {
      setSelectedPagoId(pagoId);
      return await MercadoPagoService.iniciarCheckoutModelo('pago', pagoId);
    },
    onSuccess: (response) => {
      const data = response.data;
      // Caso: Requiere 2FA
      if (response.status === 202 || data.is2FARequired) {
        setTwoFAError(null);
        twoFaModal.open();
        return;
      }
      // Caso: Redirección MP
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

  // 5. Columnas de la Tabla (Solo para Tabs 0 y 1)
  const columns: DataTableColumn<PagoDto>[] = useMemo(() => [
    {
      id: 'proyecto',
      label: 'Proyecto',
      minWidth: 160,
      render: (row) => (
        <Stack>
            <Typography variant="body2" fontWeight="bold">
            {getNombreProyecto(row.id_proyecto ?? 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
             ID: {row.id_suscripcion}
            </Typography>
        </Stack>
      )
    },
    {
      id: 'mes',
      label: 'Cuota',
      minWidth: 90,
      align: 'center',
      render: (row) => (
        <Chip label={`#${row.mes}`} size="small" variant="outlined" />
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
      minWidth: 130,
      render: (row) => (
        <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
          ${Number(row.monto).toLocaleString('es-AR')}
        </Typography>
      )
    },
    {
      id: 'estado_pago',
      label: 'Estado',
      minWidth: 130,
      render: (row) => {
        const config = getStatusConfig(row.estado_pago);
        return (
          <Chip 
            label={config.label} 
            color={config.color as any} 
            size="small" 
            variant="filled" // Si usas MUI Joy, sino 'filled' u 'outlined'
            icon={config.icon as any}
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
            sx={{ borderRadius: 2, minWidth: 110, textTransform: 'none', fontWeight: 'bold' }}
          >
            {isProcessing ? 'Procesando...' : row.estado_pago === 'vencido' ? 'Regularizar' : 'Pagar'}
          </Button>
        );
      }
    }
  ], [suscripcionesQuery.data, iniciarPagoMutation.isPending, selectedPagoId]);

  return (
    <PageContainer maxWidth="lg">
      <PageHeader 
        title="Mis Cuotas" 
        subtitle="Gestiona tus obligaciones mensuales y visualiza el progreso de tus planes." 
      />

      {/* --- PESTAÑAS --- */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
            value={currentTab} 
            onChange={(_, val) => setCurrentTab(val)}
            indicatorColor="primary"
            textColor="primary"
        >
          {/* TAB 0: Por Pagar */}
          <Tab 
            icon={<Schedule />} 
            iconPosition="start"
            label={
              <Badge badgeContent={counts.pendientes} color="primary" sx={{ px: 1 }}>
                Por Pagar
              </Badge>
            } 
          />
          
          {/* TAB 1: Vencidas */}
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

          {/* TAB 2: Historial */}
          <Tab 
            icon={<ReceiptLong />}
            iconPosition="start"
            label={`Historial (${counts.pagadas})`} 
          />
        </Tabs>
      </Box>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        
        {/* --- CONTENIDO CONDICIONAL --- */}
        {currentTab === 2 ? (
            
            // ✅ VISTA DE HISTORIAL AGRUPADO
            <HistorialPagosAgrupado 
                pagos={historialData}
                suscripciones={suscripcionesQuery.data || []}
            />

        ) : (
            
            // ✅ VISTA DE TABLA (Pendientes y Vencidas)
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
                // Resalta filas vencidas en rojo suave
                getRowSx={(row) => ({
                    bgcolor: row.estado_pago === 'vencido' ? '#fff5f5' : 'inherit',
                    transition: 'background-color 0.3s'
                })}
            />

        )}

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