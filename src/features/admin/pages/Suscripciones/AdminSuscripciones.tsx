// src/features/admin/pages/Suscripciones/AdminSuscripciones.tsx

import { AdminPageHeader, AlertBanner, PageContainer } from '@/shared';
import { Box, Chip, Stack } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 🆕 IMPORTAR USENAVIGATE
import { useAdminSuscripciones } from '../../hooks/finanzas/useAdminSuscripciones';
import CancelacionesTab from './components/CancelacionesTab';
import SuscripcionesActiveTab from './components/SuscripcionesActiveTab';
import AdhesionesTab from './components/AdhesionesTab';

const AdminSuscripciones: React.FC = () => {
  const logic = useAdminSuscripciones();
  const navigate = useNavigate(); // 🆕 INICIALIZAR NAVEGACIÓN

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
  const handleTabChange = (index: number) => {
    logic.setTabIndex(index);
    sessionStorage.setItem('adminSuscripcionesTab', index.toString());
  };

  // 🆕 BLOQUE ACTUALIZADO PARA NAVEGAR A RESÚMENES CON FILTRO
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
          navigate('/admin/resumenes'); // ⚠️ Asegúrate de que esta sea la ruta correcta en tu AppRouter
        } 
      },
    }];
  }, [logic, navigate]);

  const TABS = [
    { label: 'Suscripciones Activas', index: 0 },
    { label: 'Adhesiones',            index: 1 },
    { label: 'Historial de Bajas',    index: 2 }, 
  ];

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <AdminPageHeader
        title="Gestión de Planes de Ahorro"
        subtitle="Monitoreo de recaudación, morosidad y estados de planes"
      />

      {criticalAlerts.map((alert, i) => <AlertBanner key={i} {...alert} />)}

      <Box sx={{ mb: 4, mt: 2 }}>
        <Stack direction="row" spacing={1}>
          {TABS.map(({ label, index }) => (
            <Chip
              key={index} label={label}
              onClick={() => handleTabChange(index)}
              color={logic.tabIndex === index ? 'primary' : 'default'}
              variant={logic.tabIndex === index ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, px: 1 }}
            />
          ))}
        </Stack>
      </Box>

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
    </PageContainer>
  );
};

export default AdminSuscripciones;