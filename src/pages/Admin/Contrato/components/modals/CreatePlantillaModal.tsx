import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Stack, Typography, Box, MenuItem, useTheme
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import type { CreatePlantillaDto } from '../../../../../types/dto/contrato.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlantillaDto) => Promise<void>;
  isLoading: boolean;
  proyectos: any[]; 
}

const CreatePlantillaModal: React.FC<Props> = ({ open, onClose, onSubmit, isLoading, proyectos }) => {
  const theme = useTheme(); // 🎨
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
    setNombre(''); setVersion(1); setIdProyecto(''); setFile(null); onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle variant="h5">Nueva Plantilla</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField label="Nombre descriptivo" fullWidth required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <Stack direction="row" spacing={2}>
              <TextField label="Versión" type="number" required sx={{ width: '120px' }} value={version} onChange={(e) => setVersion(Number(e.target.value))} />
              <TextField select label="Proyecto Asignado" fullWidth value={idProyecto} onChange={(e) => setIdProyecto(e.target.value)}>
                <MenuItem value=""><em>-- Genérica (Global) --</em></MenuItem>
                {proyectos.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
              </TextField>
            </Stack>

            {/* 🎨 Box de Subida Estilizado con tu Tema */}
            <Box 
              sx={{ 
                border: '2px dashed',
                // Si hay archivo, usa Naranja (primary), si no, gris
                borderColor: file ? theme.palette.primary.main : theme.palette.grey[400], 
                borderRadius: 2, 
                p: 4, 
                textAlign: 'center',
                // Fondo sutil naranja si hay archivo
                bgcolor: file ? `${theme.palette.primary.main}1A` : 'transparent', 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                   borderColor: theme.palette.primary.main,
                   bgcolor: `${theme.palette.primary.main}0D`
                }
              }}
              component="label"
            >
              <input type="file" hidden accept="application/pdf" onChange={(e) => { if (e.target.files && e.target.files[0]) { setFile(e.target.files[0]); if (!nombre) setNombre(e.target.files[0].name.replace('.pdf', '')); } }} />
              <CloudUpload sx={{ fontSize: 48, color: file ? theme.palette.primary.main : theme.palette.text.disabled, mb: 1 }} />
              <Typography variant="body1" fontWeight={600} color={file ? 'primary' : 'textSecondary'}>
                {file ? file.name : "Haz clic para subir el PDF"}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained" disabled={!file || !nombre || isLoading}>
            {isLoading ? 'Subiendo...' : 'Crear Plantilla'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreatePlantillaModal;