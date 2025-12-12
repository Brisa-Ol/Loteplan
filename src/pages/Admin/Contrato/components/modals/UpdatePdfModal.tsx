import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Box, Typography, Alert 
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import type { UpdatePlantillaPdfDto, ContratoPlantillaDto } from '../../../../../types/dto/contrato.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  plantilla: ContratoPlantillaDto | null;
  onSubmit: (data: UpdatePlantillaPdfDto) => Promise<void>;
  isLoading: boolean;
}

const UpdatePdfModal: React.FC<Props> = ({ open, onClose, plantilla, onSubmit, isLoading }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!file || !plantilla) return;
    await onSubmit({ id: plantilla.id, file });
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight="bold">
        Actualizar PDF: Versión {plantilla?.version}
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⚠️ Estás a punto de reemplazar el archivo físico. Esto generará un nuevo Hash de integridad.
          Los contratos ya firmados NO se verán afectados.
        </Alert>

        <Box 
          sx={{ 
            border: '2px dashed #ccc', 
            borderRadius: 2, 
            p: 4, 
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
              if (e.target.files) setFile(e.target.files[0]);
            }}
          />
          <CloudUpload sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
          <Typography variant="body1">
            {file ? file.name : "Seleccionar nuevo PDF"}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="warning"
          disabled={!file || isLoading}
        >
          {isLoading ? 'Actualizando...' : 'Confirmar Actualización'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdatePdfModal;