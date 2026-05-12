// src/features/admin/pages/Suscripciones/AdminSuscripciones.tsx

import { AdminPageHeader, AlertBanner, PageContainer } from '@/shared';
import { History as HistoryIcon, PlayCircleOutline, Receipt } from '@mui/icons-material';
import { Box, Card, Tab, Tabs } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminSuscripciones } from '../../hooks/finanzas/useAdminSuscripciones';
import AdhesionesTab from './components/AdhesionesTab';
import CancelacionesTab from './components/CancelacionesTab';
import SuscripcionesActiveTab from './components/SuscripcionesActiveTab';

const AdminSuscripciones: React.FC = () => {
  const logic = useAdminSuscripciones();
  const navigate = useNavigate();

  // Estados para el filtro de fechas
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Lógica de filtrado interceptando la fecha 'createdAt'
  const dataConFiltroFechas = useMemo(() => {
    const baseData = logic.filteredSuscripciones || []; 
    
    return baseData.filter((item: any) => {
      if (!startDate && !endDate) return true;
      
      const itemDate = new Date(item.createdAt);
      
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        if (itemDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        if (itemDate > end) return false;
      }
      
      return true;
    });
  }, [logic.filteredSuscripciones, startDate, endDate]);

  // Recuperar la pestaña guardada al recargar la página
  useEffect(() => {
    const savedTab = sessionStorage.getItem('adminSuscripcionesTab');
    if (savedTab !== null) {
      logic.setTabIndex(Number(savedTab));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guardar la pestaña en sessionStorage cuando se hace clic
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    logic.setTabIndex(newValue);
    sessionStorage.setItem('adminSuscripcionesTab', newValue.toString());
  };

  const criticalAlerts = useMemo(() => {
    if (logic.stats.tasaMorosidad <= 15) return [];
    return [{
      severity: 'error' as const,
      title: 'Morosidad Crítica',
      message: `La tasa de morosidad es del ${logic.stats.tasaMorosidad}% ($${Number(logic.stats.totalEnRiesgo).toLocaleString()} en riesgo).`,
      action: { 
        label: 'Ver Morosos', 
        onClick: () => {
          sessionStorage.setItem('resumenesFilter', 'overdue');
          navigate('/admin/resumenes');
        } 
      },
    }];
  }, [logic, navigate]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <AdminPageHeader
        title="Gestión de Planes de Ahorro"
        subtitle="Monitoreo de recaudación, morosidad y estados de planes"
      />

      {criticalAlerts.map((alert, i) => <AlertBanner key={i} {...alert} />)}

      {/* 🆕 BARRA DE PESTAÑAS ADAPTADA AL TEMA GLOBAL */}
      <Card 
        elevation={0} 
        sx={{ 
          mb: 4, 
          mt: 2, 
          bgcolor: 'background.paper', // Utiliza el #ECECEC de tu tema
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px' // Respeta la forma global definida en theme.components
        }}
      >
        <Tabs
          value={logic.tabIndex}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 56,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 56,
              color: 'text.secondary', // Texto gris oscuro cuando está inactivo
              px: 3, // Mayor espaciado horizontal para que respire
              '&.Mui-selected': {
                color: 'primary.main', // Naranja/Óxido cuando está activo
              }
            }
          }}
        >
          <Tab 
            icon={<PlayCircleOutline fontSize="small" />} 
            iconPosition="start" 
            label="Suscripciones Activas" 
          />
          <Tab 
            icon={<Receipt fontSize="small" />} 
            iconPosition="start" 
            label="Adhesiones" 
          />
          <Tab 
            icon={<HistoryIcon fontSize="small" />} 
            iconPosition="start" 
            label="Historial de Bajas" 
          />
        </Tabs>
      </Card>

      <Box>
        {logic.tabIndex === 0 && (
          <SuscripcionesActiveTab
            logic={{ ...logic, filteredSuscripciones: dataConFiltroFechas }}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
        )}
        {logic.tabIndex === 1 && <AdhesionesTab />}        
        {logic.tabIndex === 2 && <CancelacionesTab />}    
      </Box>
    </PageContainer>
  );
};

export default AdminSuscripciones;