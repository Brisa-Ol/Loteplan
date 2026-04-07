// src/pages/client/MiCuenta/Perfil/components/ProfileCards.tsx

import {
  Badge as BadgeIcon,
  CheckCircle,
  DeleteForever as DeleteIcon,
  ExpandLess,
  ExpandMore,
  InfoOutlined,
  MoneyOff,
  RadioButtonUnchecked,
  Shield,
  VerifiedUser,
  Warning
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Typography,
  useTheme,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import React, { useState } from 'react';
import SecuritySettings from '../../SecuritySettings/SecuritySettings';
import { BaseModal, useConfirmDialog } from '@/shared';

// ─────────────────────────────────────────────
// KycStatusCard — con mini stepper de progreso
// ─────────────────────────────────────────────

const KYC_COLOR_MAP: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  APROBADA: 'success',
  PENDIENTE: 'warning',
  RECHAZADA: 'error',
};

const KYC_STEPS = ['Iniciar', 'Pendiente', 'Aprobada'];

function getKycStep(estado?: string) {
  if (!estado) return 0;
  if (estado === 'PENDIENTE') return 1;
  if (estado === 'APROBADA') return 2;
  if (estado === 'RECHAZADA') return 0; // vuelve al inicio para re-intentar
  return 0;
}

interface KycProps {
  kycStatus: any;
  onNavigate: () => void;
}

export const KycStatusCard: React.FC<KycProps> = ({ kycStatus, onNavigate }) => {
  const theme = useTheme();
  const estado = kycStatus?.estado_verificacion;
  const color = KYC_COLOR_MAP[estado] ?? 'default';
  const isOk = estado === 'APROBADA';
  const activeStep = getKycStep(estado);

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={3}>
          {/* Header row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center" width="100%">
              <Avatar
                variant="rounded"
                sx={{
                  bgcolor: isOk ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                  color: isOk ? 'success.main' : 'warning.main',
                  width: 56, height: 56,
                }}
              >
                <BadgeIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={700}>Verificación de Identidad</Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                  <Typography variant="body2" color="text.secondary">Estado actual:</Typography>
                  <Chip
                    label={estado || 'NO INICIADO'}
                    color={color as any}
                    size="small"
                    variant="filled"
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
              </Box>
            </Stack>

            {!isOk ? (
              <Button
                variant="contained"
                color="warning"
                onClick={onNavigate}
                sx={{ minWidth: 160, borderRadius: 2 }}
                disableElevation
              >
                {estado === 'PENDIENTE' ? 'Ver Estado' : 'Iniciar KYC'}
              </Button>
            ) : (
              <Box
                display="flex" alignItems="center" gap={1}
                sx={{
                  color: 'success.main',
                  bgcolor: '#FFFFFF',
                  px: 2, py: 1, borderRadius: 2,
                }}
              >
                <VerifiedUser />
                <Typography variant="body2" fontWeight={700}>Identidad Verificada</Typography>
              </Box>
            )}
          </Stack>

          {/* Stepper de progreso */}
          <Box sx={{ px: { xs: 0, sm: 2 } }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {KYC_STEPS.map((label, index) => {
                const completed = index < activeStep || isOk;
                return (
                  <Step key={label} completed={completed}>
                    <StepLabel
                      StepIconComponent={() =>
                        completed || index === activeStep ? (
                          <CheckCircle
                            sx={{
                              fontSize: 22,
                              color: isOk
                                ? 'success.main'
                                : index === activeStep
                                  ? 'warning.main'
                                  : alpha(theme.palette.success.main, 0.7),
                            }}
                          />
                        ) : (
                          <RadioButtonUnchecked
                            sx={{ fontSize: 22, color: 'text.disabled' }}
                          />
                        )
                      }
                    >
                      <Typography
                        variant="caption"
                        fontWeight={index === activeStep ? 700 : 400}
                        color={index === activeStep ? 'text.primary' : 'text.secondary'}
                      >
                        {label}
                      </Typography>
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────
// Security2FACard — escudo con color dinámico y colapsable
// ─────────────────────────────────────────────

interface SecurityProps {
  is2FAEnabled: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export const Security2FACard: React.FC<SecurityProps> = ({ is2FAEnabled, isExpanded, onToggle }) => {
  const theme = useTheme();

  const shieldColor = is2FAEnabled ? theme.palette.success.main : theme.palette.error.main;
  const shieldBg = is2FAEnabled
    ? alpha(theme.palette.success.main, 0.1)
    : alpha(theme.palette.error.main, 0.1);

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center" width="100%">
            <Avatar
              variant="rounded"
              sx={{
                bgcolor: shieldBg,
                color: shieldColor,
                width: 56, height: 56,
                transition: 'background-color 0.4s ease, color 0.4s ease',
              }}
            >
              <Shield fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>Autenticación de 2 Factores (2FA)</Typography>
              <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                <Typography variant="body2" color="text.secondary">Estado actual:</Typography>
                <Chip
                  label={is2FAEnabled ? 'ACTIVO' : 'INACTIVO'}
                  color={is2FAEnabled ? 'success' : 'error'}
                  size="small"
                  variant="filled"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
            </Box>
          </Stack>

          <Button
            variant="contained" // Cambiado a contained para que el fondo (bgcolor) se aplique correctamente
            onClick={onToggle}
            endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
            sx={{
              minWidth: 140,
              color: '#fff',
              borderColor: '#E07A4D',
              bgcolor: '#E07A4D',
              fontWeight: 800,
              px: 3,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 'none', 
              '&:hover': {
                bgcolor: '#A34D26',
                borderColor: 'success.main',
                boxShadow: 'none',
              },
            }}
          >
            {isExpanded ? 'Ocultar' : 'Configurar'}
          </Button>
        </Stack>

        <Collapse in={isExpanded} unmountOnExit>
          <Box mt={4}>
            <Divider sx={{ mb: 4 }} />
            <SecuritySettings />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────
// DangerZoneCard — zona colapsable de borrado
// ─────────────────────────────────────────────

interface DangerProps {
  showBlock: boolean;
  blockMessage: string | null;
  isChecking: boolean;
  onDelete: () => void;
  onGoToFinanzas: () => void;
}

export const DangerZoneCard: React.FC<DangerProps> = ({
  showBlock, blockMessage, isChecking, onDelete, onGoToFinanzas,
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Hook centralizado
  const { open, config, confirm, close } = useConfirmDialog();

  return (
    <>
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${
            isExpanded
              ? showBlock
                ? theme.palette.warning.main
                : theme.palette.error.light
              : theme.palette.divider
          }`,
          bgcolor: isExpanded ? alpha(theme.palette.error.main, 0.02) : 'background.paper',
          borderRadius: 3,
          transition: 'border-color 0.3s ease, background-color 0.3s ease',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={0}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              onClick={() => setIsExpanded(v => !v)}
              sx={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: alpha(
                      showBlock ? theme.palette.warning.main : theme.palette.error.main,
                      0.1
                    ),
                    color: showBlock ? 'warning.main' : 'error.main',
                  }}
                >
                  {showBlock ? <MoneyOff /> : <Warning />}
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    Zona de Peligro
                  </Typography>
                  <Typography variant="body2" color={showBlock ? 'warning.main' : 'text.secondary'}>
                    {showBlock
                      ? '⚠️ Tenés acciones pendientes que bloquean esta operación.'
                      : 'Las acciones aquí son permanentes y no se pueden deshacer.'}
                  </Typography>
                </Box>
              </Stack>

              <Button
                size="small"
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded((v) => !v);
                }}
                endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                sx={{
                  color: '#fff',
                  bgcolor: '#D32F2F',
                  fontWeight: 800,
                  px: 2,
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#B71C1C',
                    boxShadow: 'none',
                  },
                }}
              >
                {isExpanded ? 'Ocultar Acciones' : 'Ver Acciones'}
              </Button>
            </Stack>

            <Collapse in={isExpanded} unmountOnExit>
              <Stack spacing={3} mt={3}>
                <Divider />

                {/* Alerta de bloqueo */}
                {showBlock && (
                  <Alert
                    severity="warning"
                    icon={<MoneyOff fontSize="inherit" />}
                    variant="outlined"
                    sx={{
                      border: `1px solid ${theme.palette.warning.main}`,
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                    }}
                  >
                    <AlertTitle fontWeight={700}>Acción Bloqueada</AlertTitle>
                    <Typography variant="body2" paragraph>{blockMessage}</Typography>
                    <Button
                      size="small"
                      color="warning"
                      variant="contained"
                      onClick={onGoToFinanzas}
                      sx={{ fontWeight: 700, borderRadius: 2 }}
                    >
                      Ir a Mis Suscripciones
                    </Button>
                  </Alert>
                )}

                <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1} pt={1}>
                  <Tooltip
                    title={showBlock ? (blockMessage ?? 'No podés desactivar tu cuenta ahora.') : ''}
                    arrow
                    disableHoverListener={!showBlock}
                    disableFocusListener={!showBlock}
                    disableTouchListener={!showBlock}
                  >
                    <span>
                      <Button
                        variant="contained"
                        color="error"
                        disableElevation
                        startIcon={
                          isChecking 
                            ? <CircularProgress size={18} color="inherit" /> 
                            : <DeleteIcon />
                        }
                        onClick={() => confirm('delete_account')}
                        disabled={isChecking || showBlock}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                      >
                        Desactivar Cuenta
                      </Button>
                    </span>
                  </Tooltip>

                  {showBlock && blockMessage && (
                    <Typography
                      variant="caption"
                      color="warning.main"
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                    >
                      <InfoOutlined sx={{ fontSize: 14 }} />
                      Resolvé tus bloqueos primero
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Collapse>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Integración de tu BaseModal con el config del hook ── */}
      <BaseModal
        open={open}
        onClose={close}
        title={config?.title || 'Confirmar Acción'}
        icon={<Warning />} // Ícono que recibe tu BaseModal en el header
        headerColor={config?.severity === 'error' ? 'error' : config?.severity === 'warning' ? 'warning' : 'primary'}
        confirmText={config?.confirmText}
        confirmButtonColor={config?.severity === 'error' ? 'error' : 'primary'}
        cancelText="Cancelar"
        isLoading={isChecking}
        maxWidth="xs" // Para que no quede gigante en una simple confirmación
        onConfirm={() => {
          close();
          onDelete(); 
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {config?.description}
        </Typography>
      </BaseModal>
    </>
  );
};