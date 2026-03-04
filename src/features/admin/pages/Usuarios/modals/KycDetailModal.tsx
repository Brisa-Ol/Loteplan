// src/features/admin/pages/Usuarios/modals/KycDetailModal.tsx

import React, { useMemo } from 'react';
import {
  AdminPanelSettings as AdminIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  EventAvailable as DateIcon,
  Fingerprint as FingerprintIcon,
  OpenInNew as OpenIcon,
  Person as PersonIcon,
  HighlightOff as RejectIcon,
  Public as IpIcon,
  MapOutlined as MapIcon,
  CakeOutlined as BirthdayIcon,
  ShieldOutlined as ShieldIcon
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

import type { KycDTO } from '@/core/types/dto/kyc.dto';
import { env } from '@/core/config/env';
import { BaseModal } from '@/shared/components/domain/modals';

// =============================================================================
// 🔧 HELPERS
// =============================================================================

const getImageUrl = (path: string | null): string => {
  if (!path) return '';
  const cleanPath = path.replace(/\\/g, '/');
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

  // --- Lógica de Estado ---
  const statusConfig = useMemo(() => {
    if (!kyc) return { color: 'primary' as const, label: 'S/D' };
    switch (kyc.estado_verificacion) {
      case 'APROBADA': return { color: 'success' as const, label: 'APROBADA' };
      case 'RECHAZADA': return { color: 'error' as const, label: 'RECHAZADA' };
      case 'PENDIENTE': return { color: 'warning' as const, label: 'PENDIENTE' };
      default: return { color: 'primary' as const, label: kyc.estado_verificacion };
    }
  }, [kyc]);

  // --- Estilos Memorizados ---
  const styles = useMemo(() => ({
    sideCard: {
      p: 2, borderRadius: 2,
      border: '1px solid', borderColor: theme.palette.divider,
      bgcolor: alpha(theme.palette.background.paper, 0.5)
    },
    auditBox: {
      p: 2, borderRadius: 2,
      bgcolor: alpha(theme.palette.action.hover, 0.5),
      border: '1px dashed', borderColor: theme.palette.divider
    },
    labelCaption: {
      display: 'flex', alignItems: 'center', gap: 0.8,
      fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
      fontSize: '0.65rem', mb: 0.8, color: 'text.secondary'
    },
    metaRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5
    }
  }), [theme]);

  if (!kyc) return null;

  const isPending = kyc.estado_verificacion === 'PENDIENTE';

  // URL para el mapa basada en las coordenadas del JSON
  const googleMapsUrl = kyc.latitud_verificacion && kyc.longitud_verificacion
    ? `https://www.google.com/maps?q=${kyc.latitud_verificacion},${kyc.longitud_verificacion}`
    : null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`Verificación KYC #${kyc.id}`}
      subtitle="Revisión de identidad y legitimidad de documentos"
      icon={<BadgeIcon />}
      headerColor={statusConfig.color}
      maxWidth="md"
      headerExtra={
        <Chip
          label={statusConfig.label}
          color={statusConfig.color}
          sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.7rem' }}
        />
      }
      customActions={
        <>
          <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700, px: 3 }}>
            Cerrar Expediente
          </Button>

          {isPending && (
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => onReject(kyc)}
                sx={{ borderRadius: 2, px: 3, fontWeight: 800 }}
              >
                Rechazar
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => onApprove(kyc)}
                sx={{ borderRadius: 2, px: 4, fontWeight: 900, color: 'white' }}
              >
                Aprobar Identidad
              </Button>
            </Stack>
          )}
        </>
      }
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={4}
        divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, opacity: 0.6 }} />}
      >
        {/* === COLUMNA IZQUIERDA: DATOS === */}
        <Box sx={{ flex: 1 }}>
          <Stack spacing={3.5}>

            {/* 1. Solicitante y Datos Personales */}
            <Box>
              <Typography variant="caption" sx={styles.labelCaption}>
                <PersonIcon fontSize="inherit" /> Datos del Solicitante
              </Typography>
              <Paper elevation={0} sx={styles.sideCard}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ 
                      bgcolor: 'primary.main', width: 44, height: 44,
                      fontWeight: 900, fontSize: '1rem',
                      boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`
                    }}>
                      {kyc.nombre_completo.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={800} noWrap>{kyc.nombre_completo}</Typography>
                      <Typography variant="caption" color="text.secondary">ID Usuario: #{kyc.id_usuario}</Typography>
                    </Box>
                  </Stack>
                  
                  <Divider sx={{ borderStyle: 'dotted' }} />
                  
                  <Stack spacing={1}>
                    <Box sx={styles.metaRow}>
                      <Typography variant="caption" color="text.secondary">Email:</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ wordBreak: 'break-all', ml: 1 }}>
                        {kyc.usuario?.email || 'N/D'}
                      </Typography>
                    </Box>
                    <Box sx={styles.metaRow}>
                      <Typography variant="caption" color="text.secondary">Nacimiento:</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <BirthdayIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                        <Typography variant="caption" fontWeight={700}>
                          {kyc.fecha_nacimiento ? new Date(kyc.fecha_nacimiento).toLocaleDateString('es-AR') : 'No declarada'}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </Stack>
              </Paper>
            </Box>

            {/* 2. Documento */}
            <Box>
              <Typography variant="caption" sx={styles.labelCaption}>
                <FingerprintIcon fontSize="inherit" /> Identificación ({kyc.tipo_documento})
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'monospace', letterSpacing: 2, pl: 0.5 }}>
                {kyc.numero_documento}
              </Typography>
            </Box>

            {/* 3. Seguridad Técnica */}
            <Box>
              <Typography variant="caption" sx={styles.labelCaption}>
                <ShieldIcon fontSize="inherit" /> Seguridad Técnica
              </Typography>
              <Box sx={{ 
                p: 2, borderRadius: 2, 
                bgcolor: alpha(theme.palette.info.main, 0.03), 
                border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.1) 
              }}>
                <Stack spacing={1}>
                  <Box sx={styles.metaRow}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IpIcon sx={{ fontSize: 14, color: 'info.main' }} />
                      <Typography variant="caption" fontWeight={600}>Dirección IP:</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{kyc.ip_verificacion || 'Desconocida'}</Typography>
                  </Box>

                  <Box sx={styles.metaRow}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MapIcon sx={{ fontSize: 14, color: 'info.main' }} />
                      <Typography variant="caption" fontWeight={600}>Ubicación:</Typography>
                    </Stack>
                    {googleMapsUrl ? (
                      <Button 
                        size="small" 
                        variant="text" 
                        onClick={() => window.open(googleMapsUrl, '_blank')}
                        sx={{ fontSize: '0.65rem', minWidth: 0, p: 0, textTransform: 'none', fontWeight: 800 }}
                      >
                        Ver en Mapa
                      </Button>
                    ) : (
                      <Typography variant="caption">Sin GPS</Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            </Box>

            {/* 4. Auditoría */}
            {!isPending && (
              <Box>
                <Divider sx={{ mb: 2 }}><Chip label="Log de Auditoría" size="small" sx={{ fontWeight: 800, fontSize: '0.6rem' }} /></Divider>
                <Box sx={styles.auditBox}>
                  <Typography variant="caption" sx={styles.labelCaption}>
                    <AdminIcon fontSize="inherit" /> Verificado por
                  </Typography>

                  {kyc.verificador ? (
                    <Stack direction="row" spacing={1.5} alignItems="center" mt={1}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.dark', fontSize: '0.65rem', fontWeight: 800 }}>
                        {kyc.verificador.nombre.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" fontWeight={700} display="block" lineHeight={1}>
                          {kyc.verificador.nombre} {kyc.verificador.apellido}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                          {kyc.verificador.email}
                        </Typography>
                      </Box>
                    </Stack>
                  ) : (
                    <Typography variant="caption" fontStyle="italic" color="text.secondary">
                      Admin ID: {kyc.id_verificador}
                    </Typography>
                  )}

                  {kyc.fecha_verificacion && (
                    <Box mt={2}>
                      <Typography variant="caption" sx={styles.labelCaption}>
                        <DateIcon fontSize="inherit" /> Fecha Resolución
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color="text.primary">
                        {new Date(kyc.fecha_verificacion).toLocaleDateString('es-AR')} a las {new Date(kyc.fecha_verificacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* 5. Motivo Rechazo */}
            {kyc.motivo_rechazo && (
              <Box>
                <Typography variant="caption" sx={{ ...styles.labelCaption, color: 'error.main' }}>
                  <RejectIcon fontSize="inherit" /> Motivo del Rechazo
                </Typography>
                <Alert severity="error" variant="filled" sx={{ borderRadius: 2, '& .MuiAlert-message': { fontWeight: 600 } }}>
                  {kyc.motivo_rechazo}
                </Alert>
              </Box>
            )}
          </Stack>
        </Box>

        {/* === COLUMNA DERECHA: FOTOS === */}
        <Box sx={{ flex: 1.4 }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" mb={2} sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>
            Evidencia Documental
          </Typography>

          <Stack spacing={2.5}>
            <EvidenceImage title="Frente del Documento" src={kyc.url_foto_documento_frente} />
            <EvidenceImage title="Dorso del Documento" src={kyc.url_foto_documento_dorso} />
            <EvidenceImage title="Selfie con Documento" src={kyc.url_foto_selfie_con_documento} />
          </Stack>
        </Box>
      </Stack>
    </BaseModal>
  );
};

// =============================================================================
// 🧩 SUB-COMPONENTES
// =============================================================================

const EvidenceImage: React.FC<{ title: string; src: string | null }> = ({ title, src }) => {
  const theme = useTheme();

  if (!src) return (
    <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
      <Typography variant="caption" color="text.disabled" fontWeight={700}>{title.toUpperCase()} NO DISPONIBLE</Typography>
    </Box>
  );

  const url = getImageUrl(src);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          {title.toUpperCase()}
        </Typography>
        <Tooltip title="Abrir en tamaño completo">
          <IconButton size="small" onClick={() => window.open(url, '_blank')} sx={{ p: 0.5 }}>
            <OpenIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Box
        sx={{
          position: 'relative', width: '100%', height: 180,
          borderRadius: 2, border: '1px solid', borderColor: theme.palette.divider,
          bgcolor: 'action.hover', overflow: 'hidden',
          transition: 'all 0.3s ease', cursor: 'zoom-in',
          '&:hover': {
            boxShadow: theme.shadows[4],
            borderColor: theme.palette.primary.main,
            '& img': { transform: 'scale(1.08)' }
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
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <Box sx={{ 
          position: 'absolute', inset: 0, 
          bgcolor: 'rgba(0,0,0,0)', transition: '0.3s',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } 
        }} />
      </Box>
    </Box>
  );
};

export default KycDetailModal;