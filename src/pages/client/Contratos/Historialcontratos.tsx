import React, { useState } from 'react';
import {
  Box, Typography, Paper, IconButton, Tooltip, Chip, Stack,
  Button, Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  Description as PdfIcon, Visibility as VisibilityIcon, Close as CloseIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import type { ContratoFirmadoDto } from '../../../types/dto/contrato-general.dto';
import PDFViewerMejorado from './components/PDFViewerMejorado';
import ImagenService from '../../../Services/imagen.service';
import ContratoGeneralService from '../../../Services/contrato-general.service';



// ==========================================
// COMPONENTE MODAL (Sub-componente)
// ==========================================
interface VerModalProps {
    open: boolean;
    onClose: () => void;
    contrato: ContratoFirmadoDto | null;
}

const VerContratoFirmadoModal: React.FC<VerModalProps> = ({ open, onClose, contrato }) => {
  if (!contrato) return null;
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle display="flex" justifyContent="space-between">
        {contrato.nombre_archivo}
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <PDFViewerMejorado
          pdfUrl={ImagenService.resolveImageUrl(contrato.url_archivo)}
          signatureDataUrl={null}
          onSignaturePositionSet={() => {}}
          readOnlyMode={true}
        />
        <Box mt={2} p={2} bgcolor="grey.50">
            <Typography variant="caption" display="block">
                Hash SHA-256: {contrato.hash_archivo_firmado}
            </Typography>
            <Typography variant="caption" display="block">
                Fecha: {new Date(contrato.fecha_firma).toLocaleString()}
            </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button 
            variant="contained" 
            startIcon={<DownloadIcon />} 
            onClick={() => ContratoGeneralService.downloadAndSave(contrato.id, contrato.nombre_archivo)}
        >
            Descargar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const HistorialContratos: React.FC = () => {
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoFirmadoDto | null>(null);

  const { data: contratos, isLoading } = useQuery({
    queryKey: ['misContratos'],
    queryFn: async () => (await ContratoGeneralService.findMyContracts()).data
  });

  return (
    <Box maxWidth="md" mx="auto" p={3}>
      <Typography variant="h4" gutterBottom>📄 Mis Documentos</Typography>
      
      {isLoading ? <CircularProgress /> : (
        <Stack spacing={2}>
          {contratos?.map((contrato) => (
            <Paper key={contrato.id} sx={{ p: 2, border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'success.light' }}><PdfIcon /></Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">{contrato.nombre_archivo}</Typography>
                        <Stack direction="row" spacing={1}>
                            <Chip 
                                label={contrato.estado_firma} 
                                size="small" 
                                color={contrato.estado_firma === 'FIRMADO' ? 'success' : 'error'} 
                                variant="outlined" 
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                {new Date(contrato.fecha_firma).toLocaleDateString()}
                            </Typography>
                        </Stack>
                    </Box>
                </Box>
                
                <Stack direction="row">
                    <Tooltip title="Ver">
                        <IconButton onClick={() => setContratoSeleccionado(contrato)}><VisibilityIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Descargar">
                        <IconButton onClick={() => ContratoGeneralService.downloadAndSave(contrato.id, contrato.nombre_archivo)}>
                            <DownloadIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Paper>
          ))}
          {contratos?.length === 0 && <Typography>No tienes contratos firmados aún.</Typography>}
        </Stack>
      )}

      <VerContratoFirmadoModal 
        open={!!contratoSeleccionado} 
        onClose={() => setContratoSeleccionado(null)} 
        contrato={contratoSeleccionado} 
      />
    </Box>
  );
};

export default HistorialContratos;