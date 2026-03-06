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
  Avatar,
} from '@mui/material';
import {
  CloudUpload,
  NoteAdd as AddIcon,
  Label as NameIcon,
  Numbers as VersionIcon,
  Business as ProjectIcon,
} from '@mui/icons-material';
import { useSnackbar } from '@/shared/hooks/useSnackbar';
import type { CreatePlantillaDto } from '@/core/types/dto';
import { env } from '@/core/config/env';
import { BaseModal } from '@/shared/components/domain';

// ============================================================================
// INTERFACES
// ============================================================================
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

// ============================================================================
// COMPONENTE
// ============================================================================
const CreatePlantillaModal: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  proyectos,
}) => {
  const theme = useTheme();
  const { showError } = useSnackbar();

  // --- Estados del formulario ---
  const [nombre, setNombre] = useState('');
  const [version, setVersion] = useState<number | string>(1);
  const [idProyecto, setIdProyecto] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Helper de configuración
  const maxMb = Math.floor(env.maxFileSize / 1024 / 1024);

  // --- Manejadores ---
  const handleReset = useCallback(() => {
    setNombre('');
    setVersion(1);
    setIdProyecto('');
    setFile(null);
    setDragActive(false);
    onClose();
  }, [onClose]);

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
    if (selectedFile.type !== 'application/pdf') {
      showError('Solo se permiten archivos PDF para las plantillas.');
      return;
    }

    if (selectedFile.size > env.maxFileSize) {
      showError(`El archivo excede el tamaño máximo permitido de ${maxMb}MB.`);
      return;
    }

    setFile(selectedFile);
    if (!nombre) setNombre(selectedFile.name.replace('.pdf', ''));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
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
      // Se deshabilita si falta info o está cargando
      disableConfirm={!file || !nombre || !version || isLoading}
      confirmButtonIcon={<CloudUpload />}
      maxWidth="sm"
    >
      <Stack spacing={3}>
        {/* Campo: Nombre */}
        <TextField
          label="Nombre descriptivo"
          fullWidth
          required
          placeholder="Ej: Contrato de Arrendamiento 2024"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={isLoading}
          sx={commonInputSx}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <NameIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {/* Campo: Versión */}
          <TextField
            label="Versión"
            type="number"
            required
            sx={{ width: { xs: '100%', sm: '140px' }, ...commonInputSx }}
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <VersionIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
              inputProps: { min: 1, step: 0.1 },
            }}
          />

          {/* Campo: Proyecto */}
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
                  <ProjectIcon color="action" fontSize="small" />
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

        {/* Zona de Carga de Archivo */}
        <Box
          component="label"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed',
            borderColor: dragActive
              ? 'primary.main'
              : file ? 'success.main' : 'grey.300',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            bgcolor: dragActive
              ? alpha(theme.palette.primary.main, 0.05)
              : file ? alpha(theme.palette.success.main, 0.02) : 'transparent',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': !isLoading ? {
              borderColor: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            } : {},
          }}
        >
          <input
            type="file"
            hidden
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isLoading}
          />

          <Avatar
            sx={{
              width: 56,
              height: 56,
              mb: 2,
              bgcolor: file ? 'success.main' : (dragActive ? 'primary.main' : alpha(theme.palette.text.disabled, 0.1)),
              color: file || dragActive ? 'common.white' : 'text.disabled',
              transition: 'all 0.3s ease'
            }}
          >
            <CloudUpload fontSize="medium" />
          </Avatar>

          <Typography variant="subtitle1" fontWeight={700} color={file ? 'success.main' : 'text.primary'}>
            {file ? file.name : (dragActive ? "Suelte para cargar" : "Seleccione archivo PDF")}
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {file 
              ? `${(file.size / 1024 / 1024).toFixed(2)} MB` 
              : `Arrastra el archivo o haz clic aquí (Máx ${maxMb}MB)`
            }
          </Typography>
        </Box>
      </Stack>
    </BaseModal>
  );
};

export default CreatePlantillaModal;