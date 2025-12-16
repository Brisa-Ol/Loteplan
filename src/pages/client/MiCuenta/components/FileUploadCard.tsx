import { Box, Typography, Button, Paper, useTheme, alpha } from '@mui/material'; // 1. Agregamos useTheme y alpha
import { CloudUpload, Delete, CheckCircle } from '@mui/icons-material';
import type { ChangeEvent } from 'react';

interface FileUploadCardProps {
  title: string;
  description: string;
  accept: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = ({ 
  title, description, accept, file, onFileSelect, onRemove 
}) => {
  const theme = useTheme(); // Hook para acceder a los colores

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
    // 2. CORRECCIÓN CLAVE: Resetear el input para permitir subir el mismo archivo si se borra
    e.target.value = ''; 
  };

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 3, 
        textAlign: 'center', 
        borderStyle: 'dashed', 
        borderColor: file ? 'success.main' : 'grey.400',
        // 3. CORRECCIÓN VISUAL: Usamos alpha para un fondo verde suave seguro
        bgcolor: file ? alpha(theme.palette.success.main, 0.08) : 'background.paper',
        transition: 'all 0.3s ease'
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        {description}
      </Typography>

      {file ? (
        <Box>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1} color="success.main">
            <CheckCircle />
            <Typography variant="body2" noWrap sx={{ maxWidth: 200, fontWeight: 500 }}>
              {file.name}
            </Typography>
          </Box>
          <Button 
            size="small" 
            color="error" 
            startIcon={<Delete />} 
            onClick={onRemove}
          >
            Quitar
          </Button>
        </Box>
      ) : (
        <Button
          component="label"
          variant="outlined"
          startIcon={<CloudUpload />}
        >
          Subir Archivo
          {/* El input hidden está perfecto */}
          <input type="file" hidden accept={accept} onChange={handleChange} />
        </Button>
      )}
    </Paper>
  );
};