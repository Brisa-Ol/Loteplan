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

// --- Imports de Servicios y Tipos ---
import type { ContratoFirmadoDto } from '../../../types/dto/contrato-general.dto';
import ContratoGeneralService from '../../../Services/contrato-general.service';
import ImagenService from '../../../Services/imagen.service';

// --- Imports de Componentes y Hooks ---
import PDFViewerMejorado from './components/PDFViewerMejorado'; // Asegúrate que la ruta sea correcta
import { useModal } from '../../../hooks/useModal'; // 👈 Importamos el hook

// ==========================================
// COMPONENTE MODAL (Sub-componente)
// ==========================================
interface VerModalProps {
  open: boolean;
  onClose: () => void;
  contrato: ContratoFirmadoDto | null;
}

const VerContratoFirmadoModal: React.FC<VerModalProps> = ({ open, onClose, contrato }) => {
  // Protección: Si no hay contrato, no renderizamos contenido (aunque el Dialog controle la visibilidad)
  if (!contrato) return null;
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" component="span" noWrap sx={{ maxWidth: '90%' }}>
            {contrato.nombre_archivo}
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0, height: '70vh', display: 'flex', flexDirection: 'column' }}>
        {/* Visor PDF */}
        <Box flex={1} bgcolor="#f5f5f5" overflow="hidden">
            <PDFViewerMejorado
              pdfUrl={ImagenService.resolveImageUrl(contrato.url_archivo)}
              signatureDataUrl={null}
              onSignaturePositionSet={() => {}}
              readOnlyMode={true}
            />
        </Box>

        {/* Metadatos Footer */}
        <Box p={2} bgcolor="background.paper" borderTop="1px solid #e0e0e0">
            <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" fontWeight="bold">Hash de Integridad (SHA-256):</Typography>
                    <Chip 
                        label={contrato.hash_archivo_firmado?.substring(0, 20) + "..."} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontFamily: 'monospace' }}
                    />
                </Stack>
                <Typography variant="caption" display="block" color="text.secondary">
                    Firmado digitalmente el: {new Date(contrato.fecha_firma).toLocaleString()}
                </Typography>
            </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cerrar</Button>
        <Button 
            variant="contained" 
            startIcon={<DownloadIcon />} 
            onClick={() => ContratoGeneralService.downloadAndSave(contrato.id, contrato.nombre_archivo)}
        >
            Descargar Copia
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const HistorialContratos: React.FC = () => {
  // 1. Instancia del Hook
  const verModal = useModal();
  
  // 2. Estado para los datos (separado de la visibilidad)
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoFirmadoDto | null>(null);

  // 3. Queries
  const { data: contratos, isLoading } = useQuery({
    queryKey: ['misContratos'],
    queryFn: async () => (await ContratoGeneralService.findMyContracts()).data
  });

  // 4. Handlers optimizados
  const handleVerContrato = (contrato: ContratoFirmadoDto) => {
    setContratoSeleccionado(contrato);
    verModal.open(); // Usamos el hook para abrir
  };

  const handleCloseModal = () => {
    verModal.close(); // Usamos el hook para cerrar
    // Opcional: Limpiar la selección después de que termine la animación de cierre (aprox 300ms)
    // O limpiarlo inmediatamente si no te importa el "flash" de datos vacíos al cerrar.
    setTimeout(() => setContratoSeleccionado(null), 300);
  };

  return (
    <Box maxWidth="md" mx="auto" p={3}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        📄 Mis Documentos
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Accede a tu historial de contratos firmados y verifica su integridad.
      </Typography>
      
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : (
        <Stack spacing={2}>
          {(!contratos || contratos.length === 0) ? (
             <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography color="text.secondary">No tienes contratos firmados aún.</Typography>
             </Paper>
          ) : (
            contratos.map((contrato) => (
                <Paper 
                    key={contrato.id} 
                    elevation={1}
                    sx={{ 
                        p: 2, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.main', boxShadow: 2 }
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'error.light', color: 'error.main' }}>
                            <PdfIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {contrato.nombre_archivo}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                                <Chip 
                                    label={contrato.estado_firma} 
                                    size="small" 
                                    color={contrato.estado_firma === 'FIRMADO' ? 'success' : 'warning'} 
                                    variant="filled" 
                                />
                                <Typography variant="caption" color="text.secondary">
                                    • {new Date(contrato.fecha_firma).toLocaleDateString()}
                                </Typography>
                            </Stack>
                        </Box>
                    </Box>
                    
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Ver Documento">
                            <IconButton 
                                color="primary" 
                                onClick={() => handleVerContrato(contrato)}
                            >
                                <VisibilityIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Descargar PDF">
                            <IconButton 
                                color="default"
                                onClick={() => ContratoGeneralService.downloadAndSave(contrato.id, contrato.nombre_archivo)}
                            >
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Paper>
            ))
          )}
        </Stack>
      )}

      {/* Modal controlado por el hook */}
      <VerContratoFirmadoModal 
        open={verModal.isOpen} 
        onClose={handleCloseModal} 
        contrato={contratoSeleccionado} 
      />
    </Box>
  );
};

export default HistorialContratos;