// src/pages/Admin/Plantillas/components/modals/CreatePlantillaModal.tsx

import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Stack, Typography, Box, MenuItem, 
  useTheme, IconButton, Avatar, alpha, Divider, CircularProgress, InputAdornment
} from '@mui/material';
import { 
    CloudUpload, 
    Close as CloseIcon, 
    NoteAdd as AddIcon,
    Label as NameIcon,
    Numbers as VersionIcon,
    Business as ProjectIcon
} from '@mui/icons-material';
import type { CreatePlantillaDto } from '../../../../../types/dto/contrato.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlantillaDto) => Promise<void>;
  isLoading: boolean;
  proyectos: any[]; 
}

const CreatePlantillaModal: React.FC<Props> = ({ open, onClose, onSubmit, isLoading, proyectos }) => {
  const theme = useTheme(); 
  const [nombre, setNombre] = useState('');
  const [version, setVersion] = useState(1);
  const [idProyecto, setIdProyecto] = useState<string>(''); 
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    await onSubmit({
      file, nombre_archivo: nombre, version: Number(version),
      id_proyecto: idProyecto === '' ? null : Number(idProyecto)
    });
    handleClose();
  };

  const handleClose = () => {
    if (!isLoading) {
        setNombre(''); setVersion(1); setIdProyecto(''); setFile(null); onClose();
    }
  };

  const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                <AddIcon />
            </Avatar>
            <Box>
                <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                    Nueva Plantilla
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Subir documento base para contratos
                </Typography>
            </Box>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={isLoading} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            
            {/* Campos de Texto */}
            <TextField 
                label="Nombre descriptivo" 
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
                {proyectos.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
              </TextField>
            </Stack>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Zona de Carga */}
            <Box 
              component="label"
              sx={{ 
                border: '2px dashed',
                borderColor: file ? theme.palette.primary.main : theme.palette.grey[400], 
                borderRadius: 2, 
                p: 4, 
                textAlign: 'center', 
                bgcolor: file ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.background.default, 0.5), 
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
                onChange={(e) => { 
                    if (e.target.files && e.target.files[0]) { 
                        setFile(e.target.files[0]); 
                        if (!nombre) setNombre(e.target.files[0].name.replace('.pdf', '')); 
                    } 
                }} 
                disabled={isLoading}
              />
              
              <CloudUpload 
                sx={{ 
                    fontSize: 48, 
                    color: file ? theme.palette.primary.main : theme.palette.text.disabled, 
                    mb: 1 
                }} 
              />
              
              <Typography variant="body1" fontWeight={600} color={file ? 'primary' : 'textSecondary'}>
                {file ? file.name : "Haz clic para subir el PDF"}
              </Typography>
              
              {!file && (
                  <Typography variant="caption" color="text.secondary">
                      Soporta solo archivos .PDF
                  </Typography>
              )}
            </Box>

          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
          <Button onClick={handleClose} color="inherit" disabled={isLoading} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={!file || !nombre || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
            sx={{ px: 4, borderRadius: 2, fontWeight: 700 }}
          >
            {isLoading ? 'Subiendo...' : 'Crear Plantilla'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreatePlantillaModal;