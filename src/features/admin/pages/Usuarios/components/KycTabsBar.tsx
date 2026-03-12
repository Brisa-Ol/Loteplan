// src/features/admin/pages/Usuarios/components/KycTabsBar.tsx

import type { TabValue } from '../../../hooks/usuario/useAdminKYC';
import {
  CheckCircleOutline as ApprovedIcon,
  History as HistoryIcon,
  PendingActions as PendingIcon,
  HighlightOff as RejectedIcon,
} from '@mui/icons-material';
import { Paper, Tab, Tabs } from '@mui/material';
import React from 'react';

interface KycTabsBarProps {
  currentTab: TabValue;
  onChange: (tab: TabValue) => void;
}

const KycTabsBar: React.FC<KycTabsBarProps> = ({ currentTab, onChange }) => (
  <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 0.5 }}>
    <Tabs
      value={currentTab}
      onChange={(_, v) => onChange(v)}
      variant="scrollable"
      sx={{ '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', borderRadius: 2, minHeight: 44 } }}
    >
      <Tab icon={<PendingIcon fontSize="small" />}  iconPosition="start" label="Pendientes"        value="pendiente" />
      <Tab icon={<ApprovedIcon fontSize="small" />} iconPosition="start" label="Aprobadas"         value="aprobada"  />
      <Tab icon={<RejectedIcon fontSize="small" />} iconPosition="start" label="Rechazadas"        value="rechazada" />
      <Tab icon={<HistoryIcon fontSize="small" />}  iconPosition="start" label="Historial Completo" value="todas"    />
    </Tabs>
  </Paper>
);

export default KycTabsBar;