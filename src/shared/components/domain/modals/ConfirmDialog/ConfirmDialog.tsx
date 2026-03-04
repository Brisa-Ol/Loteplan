// src/shared/components/domain/modals/ConfirmDialog/ConfirmDialog.tsx

import React, { useEffect, useState } from 'react';
import { CheckCircle, ErrorOutline, Help, WarningAmber } from '@mui/icons-material';
import { Stack, TextField, Typography, useTheme, alpha } from '@mui/material';
import { BaseModal } from '../BaseModal/BaseModal'; // ✅ Usamos BaseModal

// ============================================================================
// INTERFAZ
// ============================================================================
interface Props {
  controller: any; // Hook useConfirmDialog
  onConfirm: (inputValue?: string) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

type ThemeColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

// ============================================================================
// COMPONENTE
// ============================================================================
export const ConfirmDialog: React.FC<Props> = ({
  controller, onConfirm, isLoading, title, description
}) => {
  const theme = useTheme();
  const { open, close, config } = controller;
  const [inputValue, setInputValue] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setInputValue('');
      setTouched(false);
    }
  }, [open]);

  if (!config) return null;

  const displayTitle = title || config.title;
  const displayDesc = description || config.description;
  const severity = config.severity || 'info';
  const confirmText = config.confirmText || 'Confirmar';

  // 🎨 CONFIGURACIÓN DE COLORES PARA BASEMODAL
  const getSeverityData = (): { icon: React.ReactNode; color: ThemeColor } => {
    switch (severity) {
      case 'error': return { icon: <ErrorOutline />, color: 'error' };
      case 'success': return { icon: <CheckCircle />, color: 'success' };
      case 'warning': return { icon: <WarningAmber />, color: 'warning' };
      case 'info':
      default: return { icon: <Help />, color: 'primary' };
    }
  };

  const { icon: severityIcon, color: severityColor } = getSeverityData();

  const isConfirmDisabled = Boolean(config.requireInput && inputValue.trim().length < 3);

  const handleConfirmClick = () => {
    if (isConfirmDisabled) {
      setTouched(true);
      return;
    }
    onConfirm(inputValue);
  };

  return (
    <BaseModal
      open={open}
      onClose={close}
      title={displayTitle}
      icon={severityIcon}
      headerColor={severityColor}
      maxWidth="xs"
      confirmText={confirmText}
      confirmButtonColor={severityColor}
      onConfirm={handleConfirmClick}
      isLoading={isLoading}
      disableConfirm={isConfirmDisabled}
    >
      <Stack spacing={3}>
        {displayDesc && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontWeight: 500, lineHeight: 1.6 }}
          >
            {displayDesc}
          </Typography>
        )}

        {config.requireInput && (
          <TextField
            autoFocus
            fullWidth
            label={config.inputLabel || "Motivo"}
            placeholder="Escribe aquí..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            error={touched && isConfirmDisabled}
            helperText={touched && isConfirmDisabled ? "Mínimo 3 caracteres" : ""}
            size="small"
            multiline
            minRows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                bgcolor: alpha(theme.palette.background.paper, 0.5)
              }
            }}
          />
        )}
      </Stack>
    </BaseModal>
  );
};