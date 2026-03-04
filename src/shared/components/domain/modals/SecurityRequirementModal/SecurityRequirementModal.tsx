// src/components/domain/modals/SecurityRequirementModal/SecurityRequirementModal.tsx
// (o la ruta donde lo tengas ubicado)

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Stack } from '@mui/material';
import { Lock, VerifiedUser } from '@mui/icons-material';

import { ROUTES } from '@/routes';
import { BaseModal } from '@/shared/components/domain/modals/BaseModal/BaseModal'; // ✅ Importación nombrada

export type SecurityRequirementType = '2FA_MISSING' | 'KYC_MISSING' | null;

interface SecurityRequirementModalProps {
  open: boolean;
  type: SecurityRequirementType;
  onClose: () => void;
}

export const SecurityRequirementModal: React.FC<SecurityRequirementModalProps> = ({
  open, type, onClose
}) => {
  const navigate = useNavigate();

  if (!type) return null;

  const config = {
    '2FA_MISSING': {
      title: 'Seguridad Requerida (2FA)',
      icon: <Lock />,
      color: 'warning' as const,
      description: 'Para realizar esta operación, debes activar la Autenticación de Dos Factores (2FA) en tu cuenta.',
      buttonText: 'Activar 2FA Ahora',
      path: ROUTES.CLIENT.CUENTA.SEGURIDAD
    },
    'KYC_MISSING': {
      title: 'Verificación Requerida',
      icon: <VerifiedUser />,
      color: 'info' as const,
      description: 'Por regulaciones de seguridad, debes completar y aprobar tu verificación de identidad (KYC) antes de operar.',
      buttonText: 'Ir a Verificación',
      path: ROUTES.CLIENT.CUENTA.KYC
    }
  };

  const current = config[type];

  const handleAction = () => {
    onClose();
    navigate(current.path);
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={current.title}
      icon={current.icon}
      headerColor={current.color}
      maxWidth="xs"
      confirmText={current.buttonText}
      confirmButtonColor={current.color}
      onConfirm={handleAction}
      cancelText="Cancelar"
    >
      <Stack spacing={2} textAlign="center" py={1}>
        <Typography variant="body1" color="text.secondary" fontWeight={500} lineHeight={1.6}>
          {current.description}
        </Typography>
      </Stack>
    </BaseModal>
  );
};