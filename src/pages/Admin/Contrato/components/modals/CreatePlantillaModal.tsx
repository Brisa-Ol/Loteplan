import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Stack, Typography, Box 
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import type { CreatePlantillaDto } from '../../../../../types/dto/contrato.dto'; // Ajusta la ruta a tu DTO unificado

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlantillaDto) => Promise<void>;
  isLoading: boolean;
}

const CreatePlantillaModal: React.FC<Props> = ({ open, onClose, onSubmit, isLoading }) => {
  const [nombre, setNombre] = useState('');
  const [version, setVersion] = useState(1);
  const [idProyecto, setIdProyecto] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    await onSubmit({
      file,
      nombre_archivo: nombre,
      version: Number(version),
      id_proyecto: idProyecto ? Number(idProyecto) : null
    });
    handleClose();
  };

  const handleClose = () => {
    setNombre('');
    setVersion(1);
    setIdProyecto('');
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight="bold">Nueva Plantilla de Contrato</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3}>
            <TextField
              label="Nombre descriptivo"
              fullWidth
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Contrato Inversión Directa 2025"
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Versión Inicial"
                type="number"
                required
                fullWidth
                value={version}
                onChange={(e) => setVersion(Number(e.target.value))}
              />
              <TextField
                label="ID Proyecto (Opcional)"
                type="number"
                fullWidth
                value={idProyecto}
                onChange={(e) => setIdProyecto(e.target.value)}
                helperText="Dejar vacío para plantilla genérica"
              />
            </Stack>

            {/* Input de Archivo Estilizado */}
            <Box 
              sx={{ 
                border: '2px dashed #ccc', 
                borderRadius: 2, 
                p: 3, 
                textAlign: 'center',
                bgcolor: file ? 'action.hover' : 'transparent',
                cursor: 'pointer'
              }}
              component="label"
            >
              <input
                type="file"
                hidden
                accept="application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                    // Auto-llenar nombre si está vacío
                    if (!nombre) setNombre(e.target.files[0].name.replace('.pdf', ''));
                  }
                }}
              />
              <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="body1" fontWeight="bold">
                {file ? file.name : "Haz clic para subir el PDF"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Solo archivos PDF permitidos
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={!file || !nombre || isLoading}
          >
            {isLoading ? 'Subiendo...' : 'Crear Plantilla'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreatePlantillaModal;