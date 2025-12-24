// src/pages/Admin/Plantillas/components/modals/UpdateMetadataModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Stack, Box, Typography, 
  IconButton, Avatar, Divider, Alert, Chip, CircularProgress,
  useTheme, alpha, InputAdornment
} from '@mui/material';
import { 
    Close as CloseIcon, 
    EditNote as EditIcon, 
    Save as SaveIcon,
    Label as NameIcon,
    Numbers as VersionIcon,
    Business as ProjectIcon
} from '@mui/icons-material';
import type { ContratoPlantillaDto } from '../../../../../types/dto/contrato.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  plantilla: ContratoPlantillaDto | null;
  onSubmit: (data: Partial<ContratoPlantillaDto>) => Promise<void>;
  isLoading: boolean;
  proyectos: any[]; 
}

const UpdateMetadataModal: React.FC<Props> = ({ open, onClose, plantilla, onSubmit, isLoading, proyectos }) => {
  const theme = useTheme();
  
  // Estados locales
  const [nombre, setNombre] = useState('');
  const [version, setVersion] = useState(1);
  const [idProyecto, setIdProyecto] = useState<string>(''); 

  useEffect(() => {
    if (plantilla) {
      setNombre(plantilla.nombre_archivo);
      setVersion(plantilla.version);
      setIdProyecto(plantilla.id_proyecto === null ? '' : plantilla.id_proyecto.toString());
    }
  }, [plantilla]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      nombre_archivo: nombre,
      version: Number(version),
      id_proyecto: idProyecto === '' ? null : Number(idProyecto)
    });
  };

  if (!plantilla) return null;

  // Estilos
  const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

  return (
    <Dialog 
        open={open} 
        onClose={isLoading ? undefined : onClose} 
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                <EditIcon />
            </Avatar>
            <Box>
                <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                    Editar Datos
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Modificar metadatos de la plantilla
                </Typography>
            </Box>
        </Box>
        <IconButton onClick={onClose} size="small" disabled={isLoading} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={3}>

            {/* Info Superior */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Chip 
                    label={`ID Plantilla: ${plantilla.id}`} 
                    size="small" 
                    variant="outlined" 
                    sx={{ fontWeight: 600, color: 'text.secondary' }}
                />
            </Box>
            
            {/* Nombre */}
            <TextField 
                label="Nombre del Archivo" 
                fullWidth 
                required 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)}
                disabled={isLoading}
                sx={commonInputSx}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <NameIcon color="action" />
                        </InputAdornment>
                    ),
                }}
            />
            
            {/* Fila: Versión y Proyecto */}
            <Stack direction="row" spacing={2}>
              <TextField 
                label="Versión" 
                type="number" 
                required 
                sx={{ width: '140px', ...commonInputSx }} 
                value={version} 
                onChange={(e) => setVersion(Number(e.target.value))}
                disabled={isLoading}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <VersionIcon color="action" />
                        </InputAdornment>
                    ),
                }}
              />
              <TextField 
                select 
                label="Proyecto Asignado" 
                fullWidth 
                value={idProyecto} 
                onChange={(e) => setIdProyecto(e.target.value)}
                disabled={isLoading}
                sx={commonInputSx}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <ProjectIcon color="action" />
                        </InputAdornment>
                    ),
                }}
              >
                <MenuItem value=""><em>-- Genérica (Global) --</em></MenuItem>
                {proyectos.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
                ))}
              </TextField>
            </Stack>

            {/* Aviso */}
            <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                Nota: Esta acción solo actualiza la información en la base de datos, no modifica el contenido del archivo PDF.
            </Alert>

          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
          <Button onClick={onClose} color="inherit" disabled={isLoading} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={!nombre || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{ px: 4, borderRadius: 2, fontWeight: 700 }}
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UpdateMetadataModal;