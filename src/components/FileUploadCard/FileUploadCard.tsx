import { Box, Typography, Button, Paper, IconButton } from '@mui/material';
import { CloudUpload, Delete, CheckCircle } from '@mui/icons-material';
import type { ChangeEvent } from 'react';

interface FileUploadCardProps {
  title: string;
  description: string;
  accept: string; // "image/*" o "video/*"
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = ({ 
  title, description, accept, file, onFileSelect, onRemove 
}) => {
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 3, 
        textAlign: 'center', 
        borderStyle: 'dashed', 
        borderColor: file ? 'success.main' : 'grey.400',
        bgcolor: file ? 'success.lighter' : 'background.paper'
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
            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
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
          <input type="file" hidden accept={accept} onChange={handleChange} />
        </Button>
      )}
    </Paper>
  );
};