import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Box, Typography, Alert, useTheme 
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
  const theme = useTheme(); // 🎨
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!file || !plantilla) return;
    await onSubmit({ id: plantilla.id, file });
    setFile(null);
    onClose();
  };

  if (!plantilla) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle variant="h6">Actualizar PDF: v{plantilla.version}</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          ⚠️ Se reemplazará el archivo físico y cambiará el hash de seguridad.
        </Alert>

        <Box 
          sx={{ 
            border: '2px dashed',
            borderColor: file ? theme.palette.primary.main : theme.palette.grey[400],
            borderRadius: 2, 
            p: 4, 
            textAlign: 'center',
            bgcolor: file ? `${theme.palette.primary.main}1A` : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.3s',
            '&:hover': { borderColor: theme.palette.primary.main }
          }}
          component="label"
        >
          <input type="file" hidden accept="application/pdf" onChange={(e) => { if (e.target.files) setFile(e.target.files[0]); }} />
          <CloudUpload sx={{ fontSize: 48, color: file ? theme.palette.primary.main : theme.palette.text.disabled, mb: 1 }} />
          <Typography variant="body1" fontWeight={600} color={file ? 'primary' : 'textSecondary'}>
            {file ? file.name : "Seleccionar nuevo PDF"}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="warning" disabled={!file || isLoading}>
          {isLoading ? 'Subiendo...' : 'Reemplazar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdatePdfModal;