import React from 'react';
import {
  AdminPanelSettings as AdminIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  EventAvailable as DateIcon,
  Fingerprint as FingerprintIcon,
  OpenInNew as OpenIcon,
  Person as PersonIcon,
  HighlightOff as RejectIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';

// Imports del Core/Shared
import type { KycDTO } from '../../../../../core/types/dto/kyc.dto';
import { env } from '../../../../../core/config/env'; // Usamos tu config centralizada
import BaseModal from '../../../../../shared/components/domain/modals/BaseModal/BaseModal';

// =============================================================================
// 🔧 HELPERS & CONSTANTS
// =============================================================================

const STATUS_COLORS: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  APROBADA: 'success',
  RECHAZADA: 'error',
  PENDIENTE: 'warning',
};

/**
 * Genera la URL absoluta para la imagen basándose en la configuración pública.
 */
const getImageUrl = (path: string | null): string => {
  if (!path) return '';
  const cleanPath = path.replace(/\\/g, '/'); // Normaliza paths de Windows
  // Usamos apiPublicUrl (ej: localhost:3000) en lugar de apiBaseUrl (localhost:3000/api)
  return `${env.apiPublicUrl}/uploads/${cleanPath}`;
};

// =============================================================================
// ⚛️ COMPONENT: KycDetailModal
// =============================================================================

interface KycDetailModalProps {
  open: boolean;
  onClose: () => void;
  kyc: KycDTO | null;
  onApprove: (kyc: KycDTO) => void;
  onReject: (kyc: KycDTO) => void;
}

const KycDetailModal: React.FC<KycDetailModalProps> = ({
  open,
  onClose,
  kyc,
  onApprove,
  onReject
}) => {
  const theme = useTheme();

  if (!kyc) return null;

  const statusColor = STATUS_COLORS[kyc.estado_verificacion] || 'default';
  const isPending = kyc.estado_verificacion === 'PENDIENTE';

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Verificación KYC #${kyc.id}`}
      subtitle="Revisión de identidad y documentación"
      icon={<BadgeIcon />}
      headerColor={statusColor === 'default' ? 'primary' : statusColor}
      maxWidth="md"
      headerExtra={
        <Chip
          label={kyc.estado_verificacion}
          color={statusColor === 'default' ? 'primary' : statusColor}
          variant="filled"
          sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
        />
      }
      customActions={
        <>
          <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2, mr: 'auto' }}>
            Cerrar
          </Button>

          {isPending && (
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => onReject(kyc)}
                sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
              >
                Rechazar
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => onApprove(kyc)}
                sx={{ borderRadius: 2, px: 3, fontWeight: 700, color: 'white' }}
              >
                Aprobar
              </Button>
            </Stack>
          )}
        </>
      }
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />}
      >
        {/* === COLUMNA IZQUIERDA: DATOS === */}
        <Box sx={{ flex: 1 }}>
          <Stack spacing={3}>

            {/* 1. Datos del Solicitante */}
            <Box>
              <Label text="Solicitante" icon={<PersonIcon fontSize="inherit" />} />
              <Paper
                elevation={0}
                sx={{
                  p: 2, borderRadius: 2,
                  border: '1px solid', borderColor: 'divider',
                  bgcolor: alpha(theme.palette.background.paper, 0.5)
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48, fontWeight: 700 }}>
                    {kyc.nombre_completo.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                      {kyc.nombre_completo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {kyc.usuario?.email || `ID Usuario: ${kyc.id_usuario}`}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>

            {/* 2. Documento */}
            <Box>
              <Label text={`Documento (${kyc.tipo_documento})`} icon={<FingerprintIcon fontSize="inherit" />} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'monospace', letterSpacing: 1, pl: 1 }}>
                {kyc.numero_documento}
              </Typography>
            </Box>

            {/* 3. Auditoría (Si ya fue procesado) */}
            {!isPending && (
              <Box>
                <Divider sx={{ mb: 2 }}><Chip label="Auditoría" size="small" /></Divider>
                <Box sx={{
                  p: 2, borderRadius: 2,
                  bgcolor: alpha(theme.palette.action.active, 0.04),
                  border: '1px dashed', borderColor: theme.palette.divider
                }}>
                  <Label text="Revisado Por" icon={<AdminIcon fontSize="inherit" />} />

                  {kyc.verificador ? (
                    <Stack direction="row" spacing={1.5} alignItems="center" mt={1}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: theme.palette.secondary.main, fontSize: '0.7rem' }}>
                        {kyc.verificador.nombre.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {kyc.verificador.nombre} {kyc.verificador.apellido}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {kyc.verificador.email}
                        </Typography>
                      </Box>
                    </Stack>
                  ) : (
                    <Typography variant="body2" fontStyle="italic" color="text.secondary">
                      Admin ID: {kyc.id_verificador}
                    </Typography>
                  )}

                  {kyc.fecha_verificacion && (
                    <Box mt={2}>
                      <Label text="Fecha Resolución" icon={<DateIcon fontSize="inherit" />} />
                      <Typography variant="body2" fontWeight={500}>
                        {new Date(kyc.fecha_verificacion).toLocaleDateString()} a las {new Date(kyc.fecha_verificacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* 4. Motivo Rechazo */}
            {kyc.motivo_rechazo && (
              <Box>
                <Label text="Motivo Rechazo" icon={<RejectIcon fontSize="inherit" />} color="error.main" />
                <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
                  {kyc.motivo_rechazo}
                </Alert>
              </Box>
            )}
          </Stack>
        </Box>

        {/* === COLUMNA DERECHA: FOTOS === */}
        <Box sx={{ flex: 1.3 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary" mb={2} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Evidencia Documental
          </Typography>

          <Stack spacing={3}>
            <EvidenceImage title="Frente" src={kyc.url_foto_documento_frente} />
            <EvidenceImage title="Dorso" src={kyc.url_foto_documento_dorso} />
            <EvidenceImage title="Selfie" src={kyc.url_foto_selfie_con_documento} />
          </Stack>
        </Box>
      </Stack>
    </BaseModal>
  );
};

// =============================================================================
// 🧩 SUB-COMPONENTES
// =============================================================================

const Label: React.FC<{ text: string; icon: React.ReactNode; color?: string }> = ({
  text, icon, color = 'text.secondary'
}) => (
  <Typography
    variant="caption"
    sx={{
      display: 'flex', alignItems: 'center', gap: 0.5,
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
      mb: 0.5, color: color
    }}
  >
    {icon} {text}
  </Typography>
);

const EvidenceImage: React.FC<{ title: string; src: string | null }> = ({ title, src }) => {
  const theme = useTheme();

  if (!src) return null;
  const url = getImageUrl(src);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          {title.toUpperCase()}
        </Typography>
        <Tooltip title="Abrir original">
          <IconButton size="small" onClick={() => window.open(url, '_blank')}>
            <OpenIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          position: 'relative', width: '100%', height: 200,
          borderRadius: 2, border: '1px solid', borderColor: 'divider',
          bgcolor: 'background.paper', overflow: 'hidden',
          transition: 'all 0.3s ease', cursor: 'zoom-in',
          '&:hover': {
            boxShadow: theme.shadows[4],
            borderColor: theme.palette.primary.main,
            '& img': { transform: 'scale(1.05)' }
          }
        }}
        onClick={() => window.open(url, '_blank')}
      >
        <Box
          component="img"
          src={url}
          alt={title}
          sx={{
            width: '100%', height: '100%', objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
        />
      </Box>
    </Box>
  );
};

export default KycDetailModal;