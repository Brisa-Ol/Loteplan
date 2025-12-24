// src/pages/Admin/Plantillas/components/modals/UpdatePdfModal.tsx

import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Box, Typography, Alert, useTheme, alpha,
  IconButton, Stack, Avatar, Divider, CircularProgress
} from '@mui/material';
import { 
    CloudUpload, 
    Close as CloseIcon, 
    PictureAsPdf, 
    Warning
} from '@mui/icons-material';
import type { ContratoPlantillaDto, UpdatePlantillaPdfDto } from '../../../../../types/dto/contrato-plantilla.dto';


interface Props {
  open: boolean;
  onClose: () => void;
  plantilla: ContratoPlantillaDto | null;
  onSubmit: (data: UpdatePlantillaPdfDto) => Promise<void>;
  isLoading: boolean;
}

const UpdatePdfModal: React.FC<Props> = ({ open, onClose, plantilla, onSubmit, isLoading }) => {
  const theme = useTheme();
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!file || !plantilla) return;
    await onSubmit({ id: plantilla.id, file });
    setFile(null);
    onClose();
  };

  const handleClose = () => {
      setFile(null);
      onClose();
  };

  if (!plantilla) return null;

  return (
    <Dialog 
        open={open} 
        onClose={isLoading ? undefined : handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: theme.shadows[10] } }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        pb: 2, pt: 3, px: 3,
        bgcolor: alpha(theme.palette.primary.main, 0.04)
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                <CloudUpload />
            </Avatar>
            <Box>
                <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                    Actualizar PDF
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Plantilla Actual: <strong>v{plantilla.version}</strong>
                </Typography>
            </Box>
        </Stack>
        <IconButton onClick={handleClose} size="small" disabled={isLoading} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 4 }}>
        <Stack spacing={3}>
            
            {/* Alerta de Seguridad */}
            <Alert 
                severity="warning" 
                variant="outlined" 
                icon={<Warning fontSize="inherit" />}
                sx={{ borderRadius: 2, border: '1px dashed', borderColor: 'warning.main' }}
            >
                <Typography variant="subtitle2" fontWeight={700} color="warning.dark">
                    Acción Delicada
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Al reemplazar el archivo, se recalculará el <strong>Hash de Seguridad</strong>. Asegúrese de que el nuevo PDF sea la versión correcta y final.
                </Typography>
            </Alert>

            {/* Zona de Carga */}
            <Box 
                component="label"
                sx={{ 
                    border: '2px dashed',
                    borderColor: file ? theme.palette.primary.main : theme.palette.divider,
                    borderRadius: 3, 
                    p: 4, 
                    textAlign: 'center', 
                    bgcolor: file ? alpha(theme.palette.primary.main, 0.04) : alpha(theme.palette.background.default, 0.5),
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }
                }}
            >
                <input 
                    type="file" 
                    hidden 
                    accept="application/pdf" 
                    onChange={(e) => { if (e.target.files) setFile(e.target.files[0]); }} 
                    disabled={isLoading}
                />
                
                <Avatar 
                    sx={{ 
                        width: 56, height: 56, margin: '0 auto', mb: 2,
                        bgcolor: file ? 'primary.main' : 'action.hover',
                        color: file ? 'white' : 'text.secondary'
                    }}
                >
                    {file ? <PictureAsPdf /> : <CloudUpload />}
                </Avatar>

                <Typography variant="body1" fontWeight={700} color={file ? 'primary.main' : 'text.primary'}>
                    {file ? file.name : "Haga clic para seleccionar"}
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Soporta solo archivos .PDF"}
                </Typography>
            </Box>

        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
        <Button onClick={handleClose} color="inherit" disabled={isLoading} sx={{ borderRadius: 2 }}>
            Cancelar
        </Button>
        <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary" 
            disabled={!file || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
            sx={{ px: 4, borderRadius: 2, fontWeight: 700 }}
        >
            {isLoading ? 'Procesando...' : 'Reemplazar Archivo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdatePdfModal;