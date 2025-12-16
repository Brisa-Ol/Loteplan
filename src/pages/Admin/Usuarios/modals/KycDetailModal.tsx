// src/pages/admin/Kyc/modals/KycDetailModal.tsx

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
  Avatar // ✅ Agregamos Avatar para mejor visualización
} from '@mui/material';
import {
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  HighlightOff as RejectIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AdminPanelSettings as AdminIcon,
  EventAvailable as DateIcon
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

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      {/* --- HEADER --- */}
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PersonIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Verificación #{kyc.id}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CancelIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />

      {/* --- CONTENIDO --- */}
      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          
          {/* 🟢 COLUMNA IZQUIERDA: DATOS Y ESTADO */}
          <Box sx={{ flex: 1 }}>
            
            {/* 1. Datos del Solicitante */}
            <Box mb={3}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>SOLICITANTE</Typography>
              <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                {kyc.nombre_completo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {kyc.usuario?.email || `ID Usuario: ${kyc.id_usuario}`}
              </Typography>
            </Box>

            {/* 2. Documento */}
            <Box mb={3}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>DOCUMENTO ({kyc.tipo_documento})</Typography>
              <Typography variant="h5" sx={{ letterSpacing: 1, fontFamily: 'monospace' }}>
                {kyc.numero_documento}
              </Typography>
            </Box>

            {/* 3. Estado Actual */}
            <Box mb={3}>
               <Typography variant="caption" color="text.secondary" fontWeight={700}>ESTADO</Typography>
               <Box mt={0.5}>
                 <Chip 
                    label={kyc.estado_verificacion} 
                    color={kyc.estado_verificacion === 'APROBADA' ? 'success' : kyc.estado_verificacion === 'RECHAZADA' ? 'error' : 'warning'} 
                    size="small"
                    sx={{ fontWeight: 'bold' }} 
                  />
               </Box>
            </Box>

            {/* 4. AUDITORÍA (DATOS DEL ADMIN) - Solo visible si ya no es pendiente */}
            {kyc.estado_verificacion !== 'PENDIENTE' && (
              <Box mb={3} sx={{ bgcolor: theme.palette.action.hover, p: 2, borderRadius: 2, border: `1px dashed ${theme.palette.divider}` }}>
                <Stack spacing={2}>
                  
                  {/* --- DATOS DEL ADMINISTRADOR --- */}
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" display="flex" alignItems="center" gap={0.5} mb={1}>
                      <AdminIcon fontSize="inherit" /> RESPONSABLE DE LA REVISIÓN
                    </Typography>
                    
                    {kyc.verificador ? (
                      // ✅ CASO 1: Tenemos los datos del admin (JOIN exitoso)
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar 
                          sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main, fontSize: '0.8rem' }}
                        >
                          {kyc.verificador.nombre.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {kyc.verificador.nombre} {kyc.verificador.apellido}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {kyc.verificador.email}
                            </Typography>
                            <Chip 
                              label={kyc.verificador.rol || 'Admin'} 
                              size="small" 
                              variant="outlined"
                              sx={{ height: 16, fontSize: '0.6rem' }} 
                            />
                          </Stack>
                        </Box>
                      </Stack>
                    ) : (
                      // ⚠️ CASO 2: Fallback si solo tenemos el ID (por si acaso)
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Administrador (ID: {kyc.id_verificador})
                      </Typography>
                    )}
                  </Box>
                  
                  <Divider />

                  {/* Fecha de Decisión */}
                  {kyc.fecha_verificacion && (
                    <Box>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                        <DateIcon fontSize="inherit" /> FECHA RESOLUCIÓN
                      </Typography>
                      <Typography variant="body2" mt={0.5}>
                        {new Date(kyc.fecha_verificacion).toLocaleDateString()} 
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          ({new Date(kyc.fecha_verificacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                        </Typography>
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}

            {/* 5. Geolocalización (Si existe) */}
            {(kyc.latitud_verificacion && kyc.longitud_verificacion) && (
              <Box mb={3}>
                <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>UBICACIÓN DE ENVÍO</Typography>
                </Stack>
                <Alert severity="info" icon={false} sx={{ py: 0.5, px: 1.5 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    Lat: {kyc.latitud_verificacion} <br/> Lon: {kyc.longitud_verificacion}
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* 6. Motivo de Rechazo (Si aplica) */}
            {kyc.motivo_rechazo && (
              <Box mt={2}>
                <Typography variant="caption" color="error.main" fontWeight={700}>MOTIVO RECHAZO</Typography>
                <Alert severity="error" variant="outlined" sx={{ mt: 0.5 }}>
                  {kyc.motivo_rechazo}
                </Alert>
              </Box>
            )}
          </Box>

          {/* 🟣 COLUMNA DERECHA: EVIDENCIA (FOTOS) */}
          <Box sx={{ flex: 1.5 }}>
            <Typography variant="h6" gutterBottom color="text.primary">Documentación</Typography>
            
            <Stack spacing={3}>
              <EvidenceImage title="Frente del Documento" src={kyc.url_foto_documento_frente} />
              <EvidenceImage title="Dorso del Documento" src={kyc.url_foto_documento_dorso} />
              <EvidenceImage title="Selfie de Prueba de Vida" src={kyc.url_foto_selfie_con_documento} />
            </Stack>
          </Box>
        </Box>
      </DialogContent>

      {/* --- FOOTER (ACCIONES) --- */}
      <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>
        
        {/* Solo mostrar botones si está PENDIENTE */}
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
              sx={{ color: 'white', px: 3 }}
            >
              Aprobar Verificación
            </Button>
          </>
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
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5} color="text.secondary">
        {title.toUpperCase()}
      </Typography>
      <Tooltip title="Click para abrir imagen original">
        <Box 
          component="img" 
          src={getImageUrl(src)} 
          alt={title}
          sx={{ 
            width: '100%', 
            borderRadius: 2, 
            border: `1px solid ${theme.palette.divider}`, 
            maxHeight: 300, 
            objectFit: 'contain', 
            bgcolor: theme.palette.action.hover,
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'zoom-in',
            '&:hover': { 
              transform: 'scale(1.01)',
              boxShadow: theme.shadows[2]
            }
          }} 
          onClick={() => window.open(getImageUrl(src), '_blank')}
        />
      </Tooltip>
    </Box>
  );
};

export default KycDetailModal;