// src/pages/client/MiCuenta/Perfil/Perfil.tsx

import kycService from '@/core/api/services/kyc.service';
import { useAuth } from '@/core/context/AuthContext';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { alpha, Box, Divider, Stack, Typography, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PersonalDataForm from './components/PersonalDataForm';
import ProfileHeader from './components/ProfileHeader';
import { DangerZoneCard, KycStatusCard, Security2FACard } from './components/ProfileCards';
import DeleteAccountModal from './modal/DeleteAccountModal';

import { useDeleteAccount } from './hooks/useDeleteAccount';
import { usePasswordChange } from './hooks/usePasswordChange';
import { useProfileForm } from './hooks/useProfileForm';

// Componente decorativo con margen superior cero para alineación perfecta
const SectionLabel: React.FC<{ label: string }> = ({ label }) => {
  const theme = useTheme();
  return (
    <Box display="flex" alignItems="center" gap={2} sx={{ mt: 0, mb: 2 }}>
      <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 1.5, whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
      <Divider sx={{ flex: 1, borderColor: alpha(theme.palette.divider, 0.6) }} />
    </Box>
  );
};

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

  const kycApproved = kycStatus?.estado_verificacion === 'APROBADA';

  return (
    <PageContainer maxWidth="lg">
      {/* DISEÑO DE DOS COLUMNAS CON ALINEACIÓN PERFECTA ARRIBA */}
      <Box 
        display="grid" 
        gridTemplateColumns={{ xs: '1fr', md: '320px 1fr' }} 
        gap={4} 
        alignItems="start"
        sx={{ mt: 0, pt: 0 }} // Aseguramos que el grid empiece arriba del todo
      >
        {/* Columna Izquierda: Header (con Sticky en Desktop) */}
        <Box sx={{ mt: 0, pt: 0 }}>
          <ProfileHeader user={user} kycApproved={kycApproved} />
        </Box>

        {/* Columna Derecha: Stack de formularios y tarjetas */}
        <Stack spacing={4} sx={{ mt: 0, pt: 0 }}>
          <Box>
            {/* El primer SectionLabel debe tener mt: 0 */}
            <SectionLabel label="Información Personal" />
            <PersonalDataForm profileHook={profileHook} passwordHook={passwordHook} />
          </Box>

          <Box>
            <SectionLabel label="Verificación" />
            <KycStatusCard kycStatus={kycStatus} onNavigate={() => navigate('/client/kyc')} />
          </Box>

          <Box>
            <SectionLabel label="Seguridad" />
            <Security2FACard
              is2FAEnabled={user?.is_2fa_enabled ?? false}
              isExpanded={showSecurity}
              onToggle={() => setShowSecurity(v => !v)}
            />
          </Box>

          <Box>
            <SectionLabel label="Cuenta" />
            <DangerZoneCard
              showBlock={deleteHook.showBlock}
              blockMessage={deleteHook.blockMessage}
              isChecking={deleteHook.isChecking}
              onDelete={deleteHook.handleDeleteClick}
              onGoToFinanzas={deleteHook.goToSuscripciones}
            />
          </Box>
        </Stack>
      </Box>

      <DeleteAccountModal
        open={deleteHook.confirmController.open}
        onClose={deleteHook.confirmController.close}
        is2FAEnabled={user?.is_2fa_enabled ?? false}
      />
    </PageContainer>
  );
};

export default Perfil;