// src/pages/client/MiCuenta/SecuritySettings.tsx

import { useAuth } from '@/core/context/AuthContext';
import { PageContainer, PageHeader } from '@/shared';
import { Alert, Box } from '@mui/material';
import React, { useState } from 'react';
import { use2FADisable } from './hooks/use2FADisable';
import { use2FASetup } from './hooks/use2FASetup';
import SecurityStatusCard from './components/SecurityStatusCard';
import SecurityInfoCard from './components/SecurityInfoCard';
import SecurityActionsCard, { SecurityHelpSection } from './components/SecurityActionsCard';
import Enable2FADialog from './components/Enable2FADialog';
import Disable2FADialog from './components/Disable2FADialog';


const SecuritySettings: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const is2FAEnabled = user?.is_2fa_enabled ?? false;

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const setup   = use2FASetup(setSuccessMessage);
  const disable = use2FADisable(setSuccessMessage);

  const isLoading = authLoading || setup.isLoading || disable.isLoading;

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Seguridad de la Cuenta"
        subtitle="Gestiona la autenticación de dos factores y protege el acceso a tu cuenta."
      />

      <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 3, borderRadius: 2 }}>
            {successMessage}
          </Alert>
        )}

        <SecurityStatusCard  is2FAEnabled={is2FAEnabled} />
        <SecurityInfoCard />
        <SecurityActionsCard
          is2FAEnabled={is2FAEnabled}
          isLoading={isLoading}
          onEnable={setup.open}
          onDisable={() => disable.setIsOpen(true)}
        />
        <SecurityHelpSection />
      </Box>

      <Enable2FADialog  setup={setup} />
      <Disable2FADialog disable={disable} />
    </PageContainer>
  );
};

export default SecuritySettings;