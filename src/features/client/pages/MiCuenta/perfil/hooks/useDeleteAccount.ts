// src/pages/client/MiCuenta/Perfil/hooks/useDeleteAccount.ts

import UsuarioService from '@/core/api/services/usuario.service';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useDeleteAccount = () => {
  const navigate              = useNavigate();
  const confirmController     = useConfirmDialog();

  const [blockMessage,    setBlockMessage]    = useState<string | null>(null);
  const [showBlock,       setShowBlock]       = useState(false);
  const [isChecking,      setIsChecking]      = useState(false);

  const handleDeleteClick = async () => {
    setShowBlock(false);
    setBlockMessage(null);
    setIsChecking(true);
    try {
      const res        = await UsuarioService.validateDeactivation();
      const validation = res.data;
      if (!validation.canDeactivate) {
        const warnings = validation.warnings;
        setBlockMessage(warnings?.length > 0 ? warnings.join(' ') : 'No puedes desactivar tu cuenta en este momento.');
        setShowBlock(true);
      } else {
        confirmController.confirm('delete_account');
      }
    } catch (error: any) {
      setBlockMessage(error?.response?.data?.error || 'No puedes desactivar tu cuenta. Revisá tu situación financiera.');
      setShowBlock(true);
    } finally {
      setIsChecking(false);
    }
  };

  const goToSuscripciones = () => navigate('/client/finanzas/suscripciones');

  return {
    confirmController,
    blockMessage, showBlock,
    isChecking, handleDeleteClick,
    goToSuscripciones,
  };
};