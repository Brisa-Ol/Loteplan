// src/pages/client/MiCuenta/Perfil/Perfil.tsx

import kycService from '@/core/api/services/kyc.service';
import { useAuth } from '@/core/context/AuthContext';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PersonalDataForm from './components/PersonalDataForm';
import { DangerZoneCard, KycStatusCard, Security2FACard } from './components/ProfileCards';
import ProfileHeader from './components/ProfileHeader';
import { useDeleteAccount } from './hooks/useDeleteAccount';
import { usePasswordChange } from './hooks/usePasswordChange';
import { useProfileForm } from './hooks/useProfileForm';
import DeleteAccountModal from './modal/DeleteAccountModal';

const Perfil: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const profileHook = useProfileForm();
  const passwordHook = usePasswordChange();
  const deleteHook = useDeleteAccount();

  const [showSecurity, setShowSecurity] = useState(false);

  const { data: kycStatus } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: () => kycService.getStatus(),
    retry: false,
  });

  return (
    <PageContainer maxWidth="md">
      <Stack spacing={4}>

        <ProfileHeader user={user} />

        <PersonalDataForm profileHook={profileHook} passwordHook={passwordHook} />

        <KycStatusCard
          kycStatus={kycStatus}
          onNavigate={() => navigate('/client/kyc')}
        />

        <Security2FACard
          is2FAEnabled={user?.is_2fa_enabled ?? false}
          isExpanded={showSecurity}
          onToggle={() => setShowSecurity(v => !v)}
        />

        <DangerZoneCard
          showBlock={deleteHook.showBlock}
          blockMessage={deleteHook.blockMessage}
          isChecking={deleteHook.isChecking}
          onDelete={deleteHook.handleDeleteClick}
          onGoToFinanzas={deleteHook.goToSuscripciones}
        />

      </Stack>

      <DeleteAccountModal
        open={deleteHook.confirmController.open}
        onClose={deleteHook.confirmController.close}
        is2FAEnabled={user?.is_2fa_enabled ?? false}
      />
    </PageContainer>
  );
};

export default Perfil;