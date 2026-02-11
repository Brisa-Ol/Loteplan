import React, { useEffect, useState } from 'react';
import { CheckCircle, ErrorOutline, Help, WarningAmber } from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Slide,
  Stack,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';

// ============================================================================
// TRANSICIÓN
// ============================================================================
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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

  // 🎨 CONFIGURACIÓN DE COLORES (Primary = Naranja)
  const getSeverityData = () => {
    const configs = {
      error: {
        color: theme.palette.error.main,
        icon: <ErrorOutline />,
        btnColor: 'error' as const
      },
      success: {
        color: theme.palette.success.main,
        icon: <CheckCircle />,
        btnColor: 'success' as const
      },
      warning: {
        color: theme.palette.primary.main,
        icon: <WarningAmber />,
        btnColor: 'primary' as const
      },
      info: {
        color: theme.palette.primary.main,
        icon: <Help />,
        btnColor: 'primary' as const
      }
    };
    return configs[severity as keyof typeof configs] || configs.info;
  };

  const { color: severityColor, icon: severityIcon, btnColor } = getSeverityData();

  const handleConfirmClick = () => {
    if (config.requireInput && inputValue.trim().length < 3) {
      setTouched(true);
      return;
    }
    onConfirm(inputValue);
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      onClose={(_, reason) => {
        if (isLoading && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
        close();
      }}
      maxWidth="xs"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: alpha(theme.palette.common.black, 0.4),
          }
        }
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 2,
          border: '1px solid',
          borderColor: theme.palette.secondary.main,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }
      }}
    >
      {/* HEADER */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        pt: 5, pb: 2, px: 3,
        bgcolor: alpha(severityColor, 0.04),
      }}>
        <Avatar sx={{
          bgcolor: alpha(severityColor, 0.1),
          color: severityColor,
          width: 64, height: 64,
          mb: 2.5,
          border: `1px solid ${alpha(severityColor, 0.2)}`,
          '& svg': { fontSize: 32 }
        }}>
          {severityIcon}
        </Avatar>
        <Typography variant="h4" component="h2" fontWeight={700} color="text.primary">
          {displayTitle}
        </Typography>
      </Box>

      {/* CONTENIDO */}
      <DialogContent sx={{ px: 4, py: 2 }}>
        <Stack spacing={3}>
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            sx={{ fontWeight: 500, lineHeight: 1.6 }}
          >
            {displayDesc}
          </Typography>

          {config.requireInput && (
            <TextField
              autoFocus
              fullWidth
              label={config.inputLabel || "Motivo"}
              placeholder="Escribe aquí..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              error={config.requireInput && touched && inputValue.trim().length < 3}
              helperText={config.requireInput && touched && inputValue.trim().length < 3 ? "Mínimo 3 caracteres" : ""}
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
      </DialogContent>

      {/* ACCIONES */}
      <DialogActions sx={{
        p: 4,
        gap: 2,
        justifyContent: 'center',
        bgcolor: alpha(severityColor, 0.02),
      }}>
        <Button
          onClick={close}
          disabled={isLoading}
          color="inherit"
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            px: 4,
            textTransform: 'none'
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirmClick}
          disabled={isLoading || (config.requireInput && inputValue.trim().length < 3)}
          variant="contained"
          color={btnColor}
          sx={{
            borderRadius: 1,
            fontWeight: 700,
            px: 5, py: 1.2,
            minWidth: 150,
            textTransform: 'none',
            boxShadow: btnColor === 'primary' ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` : undefined,
          }}
        >
          {isLoading ? <CircularProgress size={20} color="inherit" /> : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};