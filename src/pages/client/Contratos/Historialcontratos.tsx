import React, { useState } from 'react';
import {
  Box, Typography, Stack, IconButton, Tooltip, Chip,
  Button, Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Card, CardContent, Divider, alpha, useTheme
} from '@mui/material';
import {
  Download as DownloadIcon,
  Description as PdfIcon, 
  Visibility as VisibilityIcon, 
  Close as CloseIcon,
  Fingerprint, // Para el Hash
  HistoryEdu // Icono para el Empty State
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// --- Imports de Servicios y Tipos ---
import type { ContratoFirmadoDto } from '../../../types/dto/contrato-general.dto';
import ContratoGeneralService from '../../../Services/contrato-general.service';
import ImagenService from '../../../Services/imagen.service';

// --- Imports de Componentes y Hooks ---
import PDFViewerMejorado from './components/PDFViewerMejorado';
import { useModal } from '../../../hooks/useModal';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';

// ==========================================
// COMPONENTE MODAL (Estilizado)
// ==========================================
interface VerModalProps {
  open: boolean;
  onClose: () => void;
  contrato: ContratoFirmadoDto | null;
}

const VerContratoFirmadoModal: React.FC<VerModalProps> = ({ open, onClose, contrato }) => {
  const theme = useTheme();

  if (!contrato) return null;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 } // Hereda del theme, pero aseguramos
      }}
    >
      <DialogTitle 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
           <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
             <PdfIcon />
           </Avatar>
           <Box>
             <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: 400 }}>
                {contrato.nombre_archivo}
             </Typography>
             <Typography variant="caption" color="text.secondary">
                Visualización de documento firmado
             </Typography>
           </Box>
        </Stack>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, height: '70vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
        <Box flex={1} overflow="hidden" position="relative">
            <PDFViewerMejorado
              pdfUrl={ImagenService.resolveImageUrl(contrato.url_archivo)}
              signatureDataUrl={null}
              onSignaturePositionSet={() => {}}
              readOnlyMode={true}
            />
        </Box>

        {/* Metadatos Footer */}
        <Box p={2} bgcolor="background.paper" borderTop={`1px solid ${theme.palette.divider}`}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                    <Fingerprint color="action" fontSize="small" />
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">Integridad (SHA-256):</Typography>
                    <Tooltip title={contrato.hash_archivo_firmado}>
                      <Chip 
                        label={contrato.hash_archivo_firmado?.substring(0, 16) + "..."} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                      />
                    </Tooltip>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                    Firmado el: {new Date(contrato.fecha_firma).toLocaleString()}
                </Typography>
            </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} color="inherit">Cerrar</Button>
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
  const verModal = useModal();
  const theme = useTheme();
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoFirmadoDto | null>(null);

  const { data: contratos, isLoading } = useQuery({
    queryKey: ['misContratos'],
    queryFn: async () => (await ContratoGeneralService.findMyContracts()).data
  });

  const handleVerContrato = (contrato: ContratoFirmadoDto) => {
    setContratoSeleccionado(contrato);
    verModal.open();
  };

  const handleCloseModal = () => {
    verModal.close();
    setTimeout(() => setContratoSeleccionado(null), 300);
  };

  return (
    <PageContainer maxWidth="md">
      <PageHeader 
        title="Mis Contratos" 
        subtitle="Historial de contratos firmados y verificación de integridad."
      />
      
      {isLoading ? (
        <Stack spacing={2}>
           {[1, 2, 3].map(n => (
             <Card key={n} elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Stack direction="row" spacing={2} alignItems="center">
                   <CircularProgress size={24} />
                   <Box width="100%" height={20} bgcolor="grey.100" />
                </Stack>
             </Card>
           ))}
        </Stack>
      ) : (
        <Stack spacing={2}>
          {(!contratos || contratos.length === 0) ? (
             <Card 
               elevation={0} 
               sx={{ 
                 p: 6, 
                 textAlign: 'center', 
                 border: `2px dashed ${theme.palette.divider}`,
                 bgcolor: 'background.default' 
               }}
             >
                <HistoryEdu sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                   No hay contratos firmados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                   Los documentos que firmes aparecerán automáticamente aquí.
                </Typography>
             </Card>
          ) : (
            contratos.map((contrato) => (
                <Card 
                    key={contrato.id} 
                    // El theme ya define la sombra y el hover para MuiCard
                    elevation={0} 
                    sx={{ 
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            borderColor: 'primary.main',
                            transform: 'translateY(-2px)'
                        }
                    }}
                >
                    <CardContent sx={{ p: '16px !important' }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2}>
                            
                            {/* Icono + Info */}
                            <Box display="flex" alignItems="center" gap={2} width="100%">
                                <Avatar 
                                    sx={{ 
                                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                                        color: 'primary.main',
                                        width: 48, 
                                        height: 48 
                                    }}
                                >
                                    <PdfIcon />
                                </Avatar>
                                <Box overflow="hidden">
                                    <Typography variant="subtitle1" fontWeight={700} noWrap title={contrato.nombre_archivo}>
                                        {contrato.nombre_archivo}
                                    </Typography>
                                    
                                    <Stack direction="row" spacing={1} alignItems="center" mt={0.5} flexWrap="wrap">
                                        <Chip 
                                            label={contrato.estado_firma} 
                                            size="small" 
                                            // Usamos el Success del theme
                                            sx={{ 
                                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                                color: 'success.main',
                                                fontWeight: 700,
                                                border: 'none'
                                            }} 
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(contrato.fecha_firma).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Box>
                            
                            {/* Acciones */}
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, height: 24, alignSelf: 'center' }} />
                                
                                <Tooltip title="Ver Documento">
                                    <IconButton 
                                        onClick={() => handleVerContrato(contrato)}
                                        sx={{ 
                                            color: 'primary.main',
                                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                                        }}
                                    >
                                        <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Descargar PDF">
                                    <IconButton 
                                        onClick={() => ContratoGeneralService.downloadAndSave(contrato.id, contrato.nombre_archivo)}
                                        sx={{ 
                                            color: 'text.secondary',
                                            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' }
                                        }}
                                    >
                                        <DownloadIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>

                        </Stack>
                    </CardContent>
                </Card>
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
    </PageContainer>
  );
};

export default HistorialContratos;