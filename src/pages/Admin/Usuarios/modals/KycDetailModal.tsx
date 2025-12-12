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
  useTheme,
  Stack,
  Divider
} from '@mui/material';
import {
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  HighlightOff as RejectIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import type { KycDTO } from '../../../../types/dto/kyc.dto';

interface KycDetailModalProps {
  open: boolean;
  onClose: () => void;
  kyc: KycDTO | null;
  onApprove: (kyc: KycDTO) => void;
  onReject: (kyc: KycDTO) => void; // Esto abre el segundo modal de motivo
}

// Helper interno para rutas de imágenes
const getImageUrl = (path: string | null) => {
  if (!path) return '';
  const cleanPath = path.replace(/\\/g, '/');
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${cleanPath}`;
};

const KycDetailModal: React.FC<KycDetailModalProps> = ({ 
  open, 
  onClose, 
  kyc, 
  onApprove, 
  onReject 
}) => {
  const theme = useTheme();

  if (!kyc) return null;

  // Helper para color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'warning';
      case 'APROBADA': return 'success';
      case 'RECHAZADA': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 } // Usando el estilo de tu tema
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PersonIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Detalle de Verificación #{kyc.id}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CancelIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          
          {/* COLUMNA IZQUIERDA: DATOS */}
          <Box sx={{ flex: 1 }}>
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Solicitante</Typography>
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                {kyc.nombre_completo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {kyc.usuario?.email || 'Email no disponible'}
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Estado Actual</Typography>
              <Chip 
                label={kyc.estado_verificacion} 
                color={getStatusColor(kyc.estado_verificacion) as any} 
                size="small"
                sx={{ fontWeight: 'bold' }} 
              />
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Documento de Identidad</Typography>
              <Typography variant="body1" fontWeight={500}>
                {kyc.tipo_documento}
              </Typography>
              <Typography variant="h5" sx={{ letterSpacing: 1 }}>
                {kyc.numero_documento}
              </Typography>
            </Box>

            {(kyc as any).latitud_verificacion && (
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Geolocalización</Typography>
                <Alert severity="info" icon={false} sx={{ py: 0 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    Lat: {(kyc as any).latitud_verificacion}<br/>
                    Lon: {(kyc as any).longitud_verificacion}
                  </Typography>
                </Alert>
              </Box>
            )}

            {kyc.motivo_rechazo && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="error.main" gutterBottom>Motivo de Rechazo</Typography>
                <Alert severity="error" variant="outlined">
                  {kyc.motivo_rechazo}
                </Alert>
              </Box>
            )}
          </Box>

          {/* COLUMNA DERECHA: EVIDENCIA (FOTOS) */}
          <Box sx={{ flex: 1.5 }}>
            <Typography variant="h6" gutterBottom color="text.primary">Evidencia Gráfica</Typography>
            
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" fontWeight={600} display="block" mb={1} color="text.secondary">
                  Frente del Documento
                </Typography>
                <Box 
                  component="img" 
                  src={getImageUrl(kyc.url_foto_documento_frente)} 
                  sx={{ 
                    width: '100%', 
                    borderRadius: 2, 
                    border: `1px solid ${theme.palette.divider}`, 
                    maxHeight: 250, 
                    objectFit: 'contain', 
                    bgcolor: theme.palette.action.hover 
                  }} 
                />
              </Box>

              {kyc.url_foto_documento_dorso && (
                <Box>
                  <Typography variant="caption" fontWeight={600} display="block" mb={1} color="text.secondary">
                    Dorso del Documento
                  </Typography>
                  <Box 
                    component="img" 
                    src={getImageUrl(kyc.url_foto_documento_dorso)} 
                    sx={{ 
                      width: '100%', 
                      borderRadius: 2, 
                      border: `1px solid ${theme.palette.divider}`, 
                      maxHeight: 250, 
                      objectFit: 'contain', 
                      bgcolor: theme.palette.action.hover 
                    }} 
                  />
                </Box>
              )}

              <Box>
                <Typography variant="caption" fontWeight={600} display="block" mb={1} color="text.secondary">
                  Selfie de Verificación
                </Typography>
                <Box 
                  component="img" 
                  src={getImageUrl(kyc.url_foto_selfie_con_documento)} 
                  sx={{ 
                    width: '100%', 
                    borderRadius: 2, 
                    border: `1px solid ${theme.palette.divider}`, 
                    maxHeight: 350, 
                    objectFit: 'contain', 
                    bgcolor: theme.palette.action.hover 
                  }} 
                />
              </Box>
            </Stack>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: theme.palette.background.default, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} variant="text" color="inherit">
          Cerrar
        </Button>
        
        {/* Acciones solo si está pendiente */}
        {kyc.estado_verificacion === 'PENDIENTE' && (
          <>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<RejectIcon />}
              onClick={() => onReject(kyc)}
            >
              Rechazar
            </Button>
            <Button 
              variant="contained" 
              color="success" 
              startIcon={<CheckCircleIcon />}
              onClick={() => onApprove(kyc)}
              sx={{ color: 'white' }}
            >
              Aprobar Verificación
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default KycDetailModal;