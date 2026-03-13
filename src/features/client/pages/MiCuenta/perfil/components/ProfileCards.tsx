// src/pages/client/MiCuenta/Perfil/components/ProfileCards.tsx

import { Badge as BadgeIcon, DeleteForever as DeleteIcon, MoneyOff, Security as SecurityIcon, VerifiedUser, Warning } from '@mui/icons-material';
import {
  Alert, AlertTitle, alpha, Avatar, Box, Button, Card, CardContent,
  Chip, CircularProgress, Divider, Stack, Typography, useTheme
} from '@mui/material';
import React from 'react';
import SecuritySettings from '../../SecuritySettings/SecuritySettings';

// ─────────────────────────────────────────────
// KycStatusCard
// ─────────────────────────────────────────────

const KYC_COLOR_MAP: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  APROBADA: 'success', PENDIENTE: 'warning', RECHAZADA: 'error',
};

interface KycProps {
  kycStatus: any;
  onNavigate: () => void;
}

export const KycStatusCard: React.FC<KycProps> = ({ kycStatus, onNavigate }) => {
  const theme   = useTheme();
  const estado  = kycStatus?.estado_verificacion;
  const color   = KYC_COLOR_MAP[estado] ?? 'default';
  const isOk    = estado === 'APROBADA';

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center" width="100%">
            <Avatar variant="rounded" sx={{
              bgcolor: isOk ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
              color: isOk ? 'success.main' : 'warning.main', width: 56, height: 56,
            }}>
              <BadgeIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>Verificación de Identidad</Typography>
              <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                <Typography variant="body2" color="text.secondary">Estado actual:</Typography>
                <Chip label={estado || 'NO INICIADO'} color={color as any} size="small" variant="filled" sx={{ fontWeight: 700 }} />
              </Stack>
            </Box>
          </Stack>

          {!isOk ? (
            <Button variant="contained" color="warning" onClick={onNavigate} sx={{ minWidth: 160, borderRadius: 2 }} disableElevation>
              {estado === 'PENDIENTE' ? 'Ver Estado' : 'Iniciar KYC'}
            </Button>
          ) : (
            <Box display="flex" alignItems="center" gap={1}
              sx={{ color: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.1), px: 2, py: 1, borderRadius: 2 }}>
              <VerifiedUser />
              <Typography variant="body2" fontWeight={700}>Identidad Verificada</Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────
// Security2FACard
// ─────────────────────────────────────────────

interface SecurityProps {
  is2FAEnabled: boolean;
  isExpanded:   boolean;
  onToggle:     () => void;
}

export const Security2FACard: React.FC<SecurityProps> = ({ is2FAEnabled, isExpanded, onToggle }) => {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center" width="100%">
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}>
              <SecurityIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>Verificación de 2 factores</Typography>
              <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                <Typography variant="body2" color="text.secondary">Estado actual:</Typography>
                <Chip label={is2FAEnabled ? 'ACTIVO' : 'INACTIVO'} color={is2FAEnabled ? 'success' : 'warning'} size="small" variant="filled" sx={{ fontWeight: 700 }} />
              </Stack>
            </Box>
          </Stack>
          <Button variant="outlined" color="primary" onClick={onToggle} sx={{ minWidth: 140, borderRadius: 2 }}>
            {isExpanded ? 'Ocultar' : 'Configurar'}
          </Button>
        </Stack>

        {isExpanded && (
          <Box mt={4}>
            <Divider sx={{ mb: 4 }} />
            <SecuritySettings />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────
// DangerZoneCard
// ─────────────────────────────────────────────

interface DangerProps {
  showBlock:       boolean;
  blockMessage:    string | null;
  isChecking:      boolean;
  onDelete:        () => void;
  onGoToFinanzas:  () => void;
}

export const DangerZoneCard: React.FC<DangerProps> = ({ showBlock, blockMessage, isChecking, onDelete, onGoToFinanzas }) => {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.error.light}`, bgcolor: alpha(theme.palette.error.main, 0.02), borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }}>
              <Warning />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} color="error.main">Zona de Peligro</Typography>
              <Typography variant="body2" color="text.secondary">Acciones irreversibles sobre tu cuenta.</Typography>
            </Box>
          </Stack>

          {showBlock && (
            <Alert severity="warning" icon={<MoneyOff fontSize="inherit" />} variant="outlined"
              sx={{ border: `1px solid ${theme.palette.warning.main}`, bgcolor: 'background.paper', borderRadius: 2 }}>
              <AlertTitle fontWeight={700}>Acción Bloqueada</AlertTitle>
              <Typography variant="body2" paragraph>{blockMessage}</Typography>
              <Button size="small" color="warning" variant="contained" onClick={onGoToFinanzas} sx={{ fontWeight: 700, borderRadius: 2 }}>
                Ir a Mis Suscripciones
              </Button>
            </Alert>
          )}

          <Box display="flex" justifyContent="flex-end" pt={1}>
            <Button variant="contained" color="error" disableElevation
              startIcon={isChecking ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
              onClick={onDelete} disabled={isChecking}
              sx={{ borderRadius: 2, fontWeight: 700 }}>
              Desactivar Cuenta
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};