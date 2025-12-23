import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Box,
  Button,
  Chip,
  Alert,
  Stack,
  Divider,
  useTheme,
  Tooltip,
  Avatar,
  alpha,
  Paper
} from '@mui/material';
import {
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  HighlightOff as RejectIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AdminPanelSettings as AdminIcon,
  EventAvailable as DateIcon,
  Badge as BadgeIcon,
  Fingerprint as FingerprintIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import type { KycDTO } from '../../../../types/dto/kyc.dto';

interface KycDetailModalProps {
  open: boolean;
  onClose: () => void;
  kyc: KycDTO | null;
  onApprove: (kyc: KycDTO) => void;
  onReject: (kyc: KycDTO) => void;
}

// 🔧 HELPER ROBUSTO PARA IMÁGENES
const getImageUrl = (path: string | null) => {
  if (!path) return '';
  const cleanPath = path.replace(/\\/g, '/');
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${cleanPath}`; 
};

const KycDetailModal: React.FC<KycDetailModalProps> = ({ 
  open, onClose, kyc, onApprove, onReject 
}) => {
  const theme = useTheme();

  if (!kyc) return null;

  // Estilos reutilizables
  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'text.secondary',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    mb: 0.5,
    display: 'flex',
    alignItems: 'center',
    gap: 0.5
  };

  const valueStyle = {
    fontWeight: 600,
    color: 'text.primary'
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
      PaperProps={{ 
        sx: { 
          borderRadius: 3,
          boxShadow: theme.shadows[10]
        } 
      }}
    >
      {/* --- HEADER --- */}
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        pb: 2, pt: 3, px: 3,
        bgcolor: alpha(theme.palette.primary.main, 0.04)
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <BadgeIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
              Verificación KYC #{kyc.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Revisión de identidad y documentación
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CancelIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />

      {/* --- CONTENIDO --- */}
      <DialogContent sx={{ p: 0 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} divider={<Divider orientation="vertical" flexItem />}>
          
          {/* 🟢 COLUMNA IZQUIERDA: DATOS Y ESTADO */}
          <Box sx={{ flex: 1, p: 3 }}>
            <Stack spacing={4}>
            
              {/* 1. Datos del Solicitante */}
              <Box>
                <Typography sx={labelStyle}><PersonIcon fontSize="inherit" /> Solicitante</Typography>
                <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.5), border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48, fontSize: '1.2rem' }}>
                        {kyc.nombre_completo.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={valueStyle} lineHeight={1.2}>
                          {kyc.nombre_completo}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {kyc.usuario?.email || `ID Usuario: ${kyc.id_usuario}`}
                        </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>

              {/* 2. Documento y Estado */}
              <Stack direction="row" spacing={2}>
                 <Box flex={1}>
                    <Typography sx={labelStyle}><FingerprintIcon fontSize="inherit" /> Documento ({kyc.tipo_documento})</Typography>
                    <Typography variant="h6" sx={{ ...valueStyle, fontFamily: 'monospace', letterSpacing: 1 }}>
                        {kyc.numero_documento}
                    </Typography>
                 </Box>
                 <Box flex={1}>
                    <Typography sx={labelStyle}><CheckCircleIcon fontSize="inherit" /> Estado</Typography>
                    <Chip 
                        label={kyc.estado_verificacion} 
                        color={kyc.estado_verificacion === 'APROBADA' ? 'success' : kyc.estado_verificacion === 'RECHAZADA' ? 'error' : 'warning'} 
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 800, border: '1px solid', borderWidth: 2 }} 
                    />
                 </Box>
              </Stack>

              {/* 3. AUDITORÍA (Solo si no es pendiente) */}
              {kyc.estado_verificacion !== 'PENDIENTE' && (
                <Box sx={{ position: 'relative' }}>
                    <Divider sx={{ mb: 2 }}><Chip label="Auditoría" size="small" /></Divider>
                    <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: alpha(theme.palette.action.active, 0.04),
                        border: '1px dashed',
                        borderColor: theme.palette.divider
                    }}>
                        <Typography sx={labelStyle}><AdminIcon fontSize="inherit" /> Revisado Por</Typography>
                        
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
                                <Typography sx={labelStyle}><DateIcon fontSize="inherit" /> Fecha Resolución</Typography>
                                <Typography variant="body2" fontWeight={500}>
                                    {new Date(kyc.fecha_verificacion).toLocaleDateString()} a las {new Date(kyc.fecha_verificacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
              )}

              {/* 4. Geolocalización */}
              {(kyc.latitud_verificacion && kyc.longitud_verificacion) && (
                <Box>
                    <Typography sx={labelStyle}><LocationIcon fontSize="inherit" /> Ubicación de envío</Typography>
                    <Alert severity="info" variant="outlined" sx={{ py: 0, borderStyle: 'dashed' }}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        Lat: {kyc.latitud_verificacion} • Lon: {kyc.longitud_verificacion}
                        </Typography>
                    </Alert>
                </Box>
              )}

              {/* 5. Rechazo */}
              {kyc.motivo_rechazo && (
                <Box>
                    <Typography sx={{ ...labelStyle, color: 'error.main' }}><HighlightOffIcon fontSize="inherit" /> Motivo Rechazo</Typography>
                    <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
                        {kyc.motivo_rechazo}
                    </Alert>
                </Box>
              )}
            </Stack>
          </Box>

          {/* 🟣 COLUMNA DERECHA: EVIDENCIA (FOTOS) */}
          <Box sx={{ flex: 1.3, p: 3, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" mb={2}>
                EVIDENCIA DOCUMENTAL
            </Typography>
            
            <Stack spacing={3}>
              <EvidenceImage title="Frente del Documento" src={kyc.url_foto_documento_frente} />
              <EvidenceImage title="Dorso del Documento" src={kyc.url_foto_documento_dorso} />
              <EvidenceImage title="Prueba de Vida (Selfie)" src={kyc.url_foto_selfie_con_documento} />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      {/* --- FOOTER (ACCIONES) --- */}
      <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
        <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2, mr: 'auto' }}>
          Cerrar
        </Button>
        
        {kyc.estado_verificacion === 'PENDIENTE' && (
          <Stack direction="row" spacing={2}>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<RejectIcon />}
              onClick={() => onReject(kyc)}
              sx={{ borderRadius: 2, px: 3 }}
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
              Aprobar Verificación
            </Button>
          </Stack>
        )}
      </DialogActions>
    </Dialog>
  );
};

// --- SUBCOMPONENTE DE IMAGEN ---
const EvidenceImage = ({ title, src }: { title: string, src: string | null }) => {
  if (!src) return null;
  const theme = useTheme();
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="caption" fontWeight={700} color="text.secondary">
            {title.toUpperCase()}
        </Typography>
        <Tooltip title="Abrir original">
            <IconButton size="small" onClick={() => window.open(getImageUrl(src), '_blank')}>
                <OpenIcon fontSize="inherit" />
            </IconButton>
        </Tooltip>
      </Box>
      
      <Box 
        sx={{ 
          position: 'relative',
          width: '100%', 
          height: 200, // Altura fija para consistencia
          borderRadius: 2, 
          border: `1px solid ${theme.palette.divider}`, 
          bgcolor: theme.palette.background.paper,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          cursor: 'zoom-in',
          '&:hover': { 
            boxShadow: theme.shadows[4],
            borderColor: theme.palette.primary.main,
            '& img': { transform: 'scale(1.05)' }
          }
        }} 
        onClick={() => window.open(getImageUrl(src), '_blank')}
      >
        <Box 
            component="img"
            src={getImageUrl(src)} 
            alt={title}
            sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover', // Cover para que se vea bonito en la miniatura
                transition: 'transform 0.5s ease',
            }}
        />
      </Box>
    </Box>
  );
};

// Helper Icon import (por si falta arriba)
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

export default KycDetailModal;