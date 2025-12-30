// src/pages/Admin/Plantillas/components/modals/CreatePlantillaModal.tsx

import React, { useState } from 'react';
import { 
  TextField, Stack, Typography, Box, MenuItem, 
  useTheme, Divider, InputAdornment, alpha 
} from '@mui/material';
import { 
    CloudUpload, 
    NoteAdd as AddIcon,
    Label as NameIcon,
    Numbers as VersionIcon,
    Business as ProjectIcon
} from '@mui/icons-material';
import { BaseModal } from '../../../../../components/common/BaseModal/BaseModal';
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

  const handleConfirm = async () => {
    if (!file) return;
    await onSubmit({
      file, 
      nombre_archivo: nombre, 
      version: Number(version),
      id_proyecto: idProyecto === '' ? null : Number(idProyecto)
    });
    handleReset();
  };

  const handleReset = () => {
    setNombre(''); 
    setVersion(1); 
    setIdProyecto(''); 
    setFile(null); 
    onClose();
  };

  const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

  return (
    <BaseModal
      open={open}
      onClose={handleReset}
      title="Nueva Plantilla"
      subtitle="Subir documento base para contratos"
      icon={<AddIcon />}
      headerColor="primary"
      confirmText="Crear Plantilla"
      onConfirm={handleConfirm}
      isLoading={isLoading}
      disableConfirm={!file || !nombre || isLoading}
      confirmButtonIcon={<CloudUpload />}
      maxWidth="sm"
    >
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
            {proyectos.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.nombre_proyecto}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Zona de Carga */}
        <Box 
          component="label"
          sx={{ 
            border: '2px dashed',
            borderColor: file ? 'primary.main' : 'grey.400', 
            borderRadius: 2, 
            p: 4, 
            textAlign: 'center', 
            bgcolor: file ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.background.default, 0.5), 
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
                borderColor: 'primary.main',
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
                    const selectedFile = e.target.files[0];
                    setFile(selectedFile); 
                    if (!nombre) setNombre(selectedFile.name.replace('.pdf', '')); 
                } 
            }} 
            disabled={isLoading}
          />
          
          <CloudUpload 
            sx={{ 
                fontSize: 48, 
                color: file ? 'primary.main' : 'text.disabled', 
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
    </BaseModal>
  );
};

export default CreatePlantillaModal;