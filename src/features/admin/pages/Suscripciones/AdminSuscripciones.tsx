// src/features/admin/pages/Suscripciones/AdminSuscripciones.tsx

import { AdminPageHeader, AlertBanner, PageContainer } from '@/shared';
import { Box, Chip, Stack } from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { useAdminSuscripciones } from '../../hooks/finanzas/useAdminSuscripciones';
import CancelacionesTab from './components/CancelacionesTab';
import SuscripcionesActiveTab from './components/SuscripcionesActiveTab';

const AdminSuscripciones: React.FC = () => {
  const logic = useAdminSuscripciones();

  // ✅ NUEVO: Recuperar la pestaña guardada al recargar la página
  useEffect(() => {
    const savedTab = sessionStorage.getItem('adminSuscripcionesTab');
    if (savedTab !== null) {
      logic.setTabIndex(Number(savedTab));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ NUEVO: Guardar la pestaña en sessionStorage cuando se hace clic
  const handleTabChange = (index: number) => {
    logic.setTabIndex(index);
    sessionStorage.setItem('adminSuscripcionesTab', index.toString());
  };

  const criticalAlerts = useMemo(() => {
    if (logic.stats.tasaMorosidad <= 15) return [];
    return [{
      severity: 'error' as const,
      title: 'Morosidad Crítica',
      message: `La tasa de morosidad es del ${logic.stats.tasaMorosidad}% ($${Number(logic.stats.totalEnRiesgo).toLocaleString()} en riesgo).`,
      action: { label: 'Ver Morosos', onClick: () => logic.setFilterStatus('inactivas') },
    }];
  }, [logic]);

  const TABS = [
    { label: 'Suscripciones Activas', index: 0 },
    { label: 'Historial de Bajas', index: 1 },
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
              onClick={() => handleTabChange(index)} // ✅ Usamos la nueva función aquí
              color={logic.tabIndex === index ? 'primary' : 'default'}
              variant={logic.tabIndex === index ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, px: 1 }}
            />
          ))}
        </Stack>
      </Box>

      {logic.tabIndex === 0 ? <SuscripcionesActiveTab logic={logic} /> : <CancelacionesTab />}
    </PageContainer>
  );
};

export default AdminSuscripciones;