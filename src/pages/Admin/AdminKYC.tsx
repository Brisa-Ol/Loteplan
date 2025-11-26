import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { Close as CloseIcon, Check as CheckIcon, Block as BlockIcon } from '@mui/icons-material';
import type { KycDTO } from '../../types/dto/kyc.dto';


interface KYCDetailsModalProps {
  open: boolean;
  kyc: KycDTO;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const KYCDetailsModal: React.FC<KYCDetailsModalProps> = ({ 
  open, 
  kyc, 
  onClose, 
  onApprove, 
  onReject 
}) => {

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          Detalle de Verificación
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* USAMOS BOX CON FLEXBOX EN LUGAR DE GRID 
            flexDirection: column en móviles, row en escritorio (md)
        */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          
          {/* --- COLUMNA IZQUIERDA (DATOS) --- */}
          <Box sx={{ flex: 1, minWidth: { md: '300px' } }}>
            <Typography variant="subtitle2" color="text.secondary">Solicitante</Typography>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              {kyc.nombre_completo}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" mt={2}>Documento</Typography>
            <Typography variant="body1" gutterBottom>
              {kyc.tipo_documento}: {kyc.numero_documento}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" mt={2}>Estado Actual</Typography>
            <Typography variant="body1" gutterBottom sx={{ 
                color: kyc.estado_verificacion === 'PENDIENTE' ? 'warning.main' : 'text.primary',
                fontWeight: 'bold'
            }}>
              {kyc.estado_verificacion}
            </Typography>

            {kyc.fecha_nacimiento && (
               <>
                <Typography variant="subtitle2" color="text.secondary" mt={2}>Fecha Nacimiento</Typography>
                <Typography variant="body1">
                    {new Date(kyc.fecha_nacimiento).toLocaleDateString()}
                </Typography>
               </>
            )}
          </Box>

          {/* --- COLUMNA DERECHA (FOTOS) --- */}
          <Box sx={{ flex: 2 }}>
            <Typography variant="h6" gutterBottom>Evidencia</Typography>
            
            <Box mb={3}>
              <Typography variant="caption" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                Frente del Documento
              </Typography>
              <Box 
                component="img" 
                src={kyc.url_foto_documento_frente} 
                alt="DNI Frente" 
                sx={{ 
                  width: '100%', 
                  borderRadius: 2, 
                  border: '1px solid #e0e0e0', 
                  maxHeight: 300, 
                  objectFit: 'contain',
                  bgcolor: '#f5f5f5'
                }} 
              />
            </Box>

            {kyc.url_foto_documento_dorso && (
              <Box mb={3}>
                <Typography variant="caption" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                    Dorso del Documento
                </Typography>
                <Box 
                  component="img" 
                  src={kyc.url_foto_documento_dorso} 
                  alt="DNI Dorso" 
                  sx={{ 
                    width: '100%', 
                    borderRadius: 2, 
                    border: '1px solid #e0e0e0', 
                    maxHeight: 300, 
                    objectFit: 'contain',
                    bgcolor: '#f5f5f5'
                  }} 
                />
              </Box>
            )}

            <Box>
              <Typography variant="caption" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                Selfie con Documento
              </Typography>
              <Box 
                component="img" 
                src={kyc.url_foto_selfie_con_documento} 
                alt="Selfie" 
                sx={{ 
                  width: '100%', 
                  borderRadius: 2, 
                  border: '1px solid #e0e0e0', 
                  maxHeight: 400, 
                  objectFit: 'contain',
                  bgcolor: '#f5f5f5'
                }} 
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        
        <Button 
          onClick={onReject} 
          variant="outlined" 
          color="error" 
          startIcon={<BlockIcon />}
        >
          Rechazar
        </Button>

        <Button 
          onClick={onApprove} 
          variant="contained" 
          color="success" 
          startIcon={<CheckIcon />}
        >
          Aprobar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KYCDetailsModal;