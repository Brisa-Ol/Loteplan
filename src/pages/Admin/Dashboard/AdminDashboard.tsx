import React from 'react';
import { 
  Box, Paper, Typography, CircularProgress, useTheme 
} from '@mui/material';
import { 
  TrendingUp, Warning, MoneyOff, AttachMoney 
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import PagoService from '../../../Services/pago.service';
import SuscripcionService from '../../../Services/suscripcion.service';
import InversionService from '../../../Services/inversion.service';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';



// ✅ AQUÍ ESTÁ LA DEFINICIÓN QUE FALTABA
// Componente interno de Tarjeta KPI (Widget)
const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  subtitle?: string; 
  icon: React.ReactNode; 
  color: 'primary' | 'success' | 'error' | 'warning' | 'info';
}> = ({ title, value, subtitle, icon, color }) => {
  
  // Mapeo simple de colores (puedes usar tu theme.palette si prefieres)
  const colorMap: Record<string, string> = {
    primary: '#1976d2', // Azul standard o usa theme.palette.primary.main
    success: '#2e7d32',
    error: '#d32f2f',
    warning: '#ed6c02',
    info: '#0288d1',
  };

  const bgColor = colorMap[color] || '#ccc';

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
      }}
    >
      <Box>
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>{title}</Typography>
        <Typography variant="h4" fontWeight={700} my={1} color="text.primary">{value}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </Box>
      <Box 
        sx={{ 
          bgcolor: `${bgColor}20`, // Color con transparencia (hex + 20)
          color: bgColor, 
          p: 1.5, 
          borderRadius: '50%',
          display: 'flex' 
        }}
      >
        {icon}
      </Box>
    </Paper>
  );
};

// Componente Principal
const AdminDashboard: React.FC = () => {
  const date = new Date();

  // Consultas de KPIs
  const { data: morosidad, isLoading: l1 } = useQuery({ queryKey: ['kpiMorosidad'], queryFn: async () => (await SuscripcionService.getMorosityMetrics()).data });
  const { data: cancelacion, isLoading: l2 } = useQuery({ queryKey: ['kpiCancelacion'], queryFn: async () => (await SuscripcionService.getCancellationMetrics()).data });
  const { data: liquidez, isLoading: l3 } = useQuery({ queryKey: ['kpiLiquidez'], queryFn: async () => (await InversionService.getLiquidityMetrics()).data.data });
  const { data: pagosMes, isLoading: l4 } = useQuery({ 
    queryKey: ['kpiPagosMes'], 
    queryFn: async () => (await PagoService.getMonthlyMetrics(date.getMonth() + 1, date.getFullYear())).data.data 
  });

  const isLoading = l1 || l2 || l3 || l4;

  if (isLoading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;

  return (
    <PageContainer maxWidth="xl">

      {/* Encabezado */}
            <Box textAlign="center" mb={5}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">Dashboard Administrativo</Typography>
              <Typography color="text.secondary"> Visión general del estado financiero y operativo de la plataforma.</Typography>
            </Box>

      {/* GRID LAYOUT MANUAL (CSS Grid) */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
        gap: 3 
      }}>
        
        {/* KPI 1: Recaudo */}
        <StatCard 
          title="Recaudo Mes Actual"
          value={`$${Number(pagosMes?.total_recaudado || 0).toLocaleString()}`}
          subtitle={`${pagosMes?.total_pagos_pagados || 0} pagos procesados`}
          icon={<AttachMoney fontSize="large" />}
          color="success"
        />

        {/* KPI 2: Morosidad */}
        <StatCard 
          title="Tasa de Morosidad"
          value={`${morosidad?.tasa_morosidad || '0.00'}%`}
          subtitle={`$${Number(morosidad?.total_en_riesgo || 0).toLocaleString()} en riesgo`}
          icon={<Warning fontSize="large" />}
          color="error"
        />

        {/* KPI 3: Liquidez */}
        <StatCard 
          title="Conversión Inversión"
          value={`${liquidez?.tasa_liquidez || '0.00'}%`}
          subtitle="Inversiones concretadas"
          icon={<TrendingUp fontSize="large" />}
          color="primary"
        />

        {/* KPI 4: Churn Rate */}
        <StatCard 
          title="Tasa Cancelación"
          value={`${cancelacion?.tasa_cancelacion || '0.00'}%`}
          subtitle={`${cancelacion?.total_canceladas || 0} bajas totales`}
          icon={<MoneyOff fontSize="large" />}
          color="warning"
        />
      </Box>

    </PageContainer>
  );
};

export default AdminDashboard;