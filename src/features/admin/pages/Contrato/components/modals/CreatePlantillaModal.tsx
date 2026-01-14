// src/pages/Admin/Plantillas/components/modals/CreatePlantillaModal.tsx

import React, { useState, useCallback } from 'react';
import {
  TextField,
  Stack,
  Typography,
  Box,
  MenuItem,
  useTheme,
  Divider,
  InputAdornment,
  alpha,
} from '@mui/material';
import {
  CloudUpload,
  NoteAdd as AddIcon,
  Label as NameIcon,
  Numbers as VersionIcon,
  Business as ProjectIcon,
} from '@mui/icons-material';
import type { CreatePlantillaDto } from '../../../../../../core/types/dto/contrato-plantilla.dto';
import useSnackbar from '../../../../../../shared/hooks/useSnackbar';
import { env } from '../../../../../../core/config/env';
import { BaseModal } from '../../../../../../shared/components/domain/modals/BaseModal/BaseModal';



// Definimos una interfaz básica para el proyecto
interface ProyectoSimple {
  id: number;
  nombre_proyecto: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlantillaDto) => Promise<void>;
  isLoading: boolean;
  proyectos: ProyectoSimple[];
}

const CreatePlantillaModal: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  proyectos,
}) => {
  const theme = useTheme();
  // ✅ Hook para notificaciones de error
  const { showError } = useSnackbar();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [version, setVersion] = useState<number | string>(1);
  const [idProyecto, setIdProyecto] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Helper para convertir bytes a MB para visualización
  const maxMb = Math.floor(env.maxFileSize / 1024 / 1024);

  // Reset del formulario
  const handleReset = useCallback(() => {
    setNombre('');
    setVersion(1);
    setIdProyecto('');
    setFile(null);
    setDragActive(false);
    onClose();
  }, [onClose]);

  // Manejo del envío
  const handleConfirm = async () => {
    if (!file || !nombre || !version) return;

    await onSubmit({
      file,
      nombre_archivo: nombre,
      version: Number(version),
      id_proyecto: idProyecto === '' ? null : Number(idProyecto),
    });

    handleReset();
  };

  // ✅ VALIDACIÓN CENTRALIZADA
  const validateAndSetFile = (selectedFile: File) => {
    // 1. Validación de Tipo (Regla de negocio: Solo PDF para plantillas)
    if (selectedFile.type !== 'application/pdf') {
        showError('Solo se permiten archivos PDF para las plantillas.');
        return;
    }

    // 2. Validación de Tamaño (Regla de infraestructura: env.maxFileSize)
    if (selectedFile.size > env.maxFileSize) {
        showError(`El archivo excede el tamaño máximo permitido de ${maxMb}MB.`);
        return;
    }

    setFile(selectedFile);
    
    // Autocompletar nombre
    if (!nombre) {
      setNombre(selectedFile.name.replace('.pdf', ''));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };
    
  // Manejadores para Drag & Drop visual
  const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
          setDragActive(true);
      } else if (e.type === "dragleave") {
          setDragActive(false);
      }
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
           validateAndSetFile(e.dataTransfer.files[0]);
      }
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
      disableConfirm={!file || !nombre || !version || isLoading}
      confirmButtonIcon={<CloudUpload />}
      maxWidth="sm"
    >
      <Stack spacing={3}>
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
            onChange={(e) => setVersion(e.target.value)}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <VersionIcon color="action" />
                </InputAdornment>
              ),
              inputProps: { min: 1, step: 0.1 },
            }}
          />
          <TextField
            select
            label="Proyecto Asignado"
            fullWidth
            value={idProyecto}
            onChange={(e) => setIdProyecto(e.target.value === '' ? '' : Number(e.target.value))}
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
            <MenuItem value="">
              <em>-- Genérica (Global) --</em>
            </MenuItem>
            {proyectos.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.nombre_proyecto}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box
          component="label"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            display: 'block',
            border: '2px dashed',
            borderColor: dragActive 
                ? 'primary.main' 
                : file 
                    ? 'success.main' 
                    : 'grey.400',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: dragActive 
                ? alpha(theme.palette.primary.main, 0.1) 
                : file 
                    ? alpha(theme.palette.success.main, 0.05) 
                    : alpha(theme.palette.background.default, 0.5),
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': !isLoading
              ? {
                  borderColor: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  transform: 'translateY(-2px)'
                }
              : {},
          }}
        >
          <input
            type="file"
            hidden
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isLoading}
          />

          <CloudUpload
            sx={{
              fontSize: 48,
              color: file ? 'success.main' : (dragActive ? 'primary.main' : 'text.disabled'),
              mb: 1,
              transition: 'color 0.3s ease'
            }}
          />

          <Typography
            variant="body1"
            fontWeight={600}
            color={file ? 'success.main' : 'textPrimary'}
          >
            {file ? file.name : (dragActive ? "¡Suelta el archivo aquí!" : "Haz clic o arrastra el PDF")}
          </Typography>

          {/* ✅ 3. Texto dinámico basado en configuración */}
          {!file && (
            <Typography variant="caption" color="text.secondary">
              Soporta solo archivos .PDF (Máx {maxMb}MB)
            </Typography>
          )}
        </Box>
      </Stack>
    </BaseModal>
  );
};

export default CreatePlantillaModal;