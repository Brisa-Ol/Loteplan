// src/pages/Admin/Plantillas/components/modals/UpdatePdfModal.tsx

import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Alert, useTheme, alpha, Stack, Avatar
} from '@mui/material';
import {
  CloudUpload,
  PictureAsPdf,
  Warning
} from '@mui/icons-material';
import type { ContratoPlantillaDto, UpdatePlantillaPdfDto } from '../../../../../../core/types/dto/contrato-plantilla.dto';
import useSnackbar from '../../../../../../shared/hooks/useSnackbar';
import { env } from '../../../../../../core/config/env';
import BaseModal from '../../../../../../shared/components/domain/modals/BaseModal/BaseModal';

interface Props {
  open: boolean;
  onClose: () => void;
  plantilla: ContratoPlantillaDto | null;
  onSubmit: (data: UpdatePlantillaPdfDto) => Promise<void>;
  isLoading: boolean;
}

const UpdatePdfModal: React.FC<Props> = ({ open, onClose, plantilla, onSubmit, isLoading }) => {
  const theme = useTheme();
  const { showError } = useSnackbar();
  
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Helper para visualización de MB
  const maxMb = Math.floor(env.maxFileSize / 1024 / 1024);

  const handleConfirm = async () => {
    if (!file || !plantilla) return;
    await onSubmit({ id: plantilla.id, file });
    handleClose();
  };

  const handleClose = useCallback(() => {
    setFile(null);
    setDragActive(false);
    onClose();
  }, [onClose]);

  // ✅ Validación centralizada de archivos
  const validateAndSetFile = (selectedFile: File) => {
    // 1. Validación de Tipo
    if (selectedFile.type !== 'application/pdf') {
        showError('Solo se permiten archivos PDF.');
        return;
    }

    // 2. Validación de Tamaño
    if (selectedFile.size > env.maxFileSize) {
        showError(`El archivo excede el tamaño máximo permitido de ${maxMb}MB.`);
        return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // ✅ Manejadores Drag & Drop
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

  if (!plantilla) return null;

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Actualizar PDF"
      subtitle={`Plantilla Actual: v${plantilla.version}`}
      icon={<CloudUpload />}
      headerColor="primary"
      confirmText="Reemplazar Archivo"
      onConfirm={handleConfirm}
      isLoading={isLoading}
      disableConfirm={!file || isLoading}
      confirmButtonIcon={<CloudUpload />}
      maxWidth="sm"
    >
      <Stack spacing={3}>
        {/* Alerta de Seguridad */}
        <Alert
          severity="warning"
          variant="outlined"
          icon={<Warning fontSize="inherit" />}
          sx={{
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'warning.main',
            bgcolor: alpha(theme.palette.warning.main, 0.02)
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} color="warning.dark">
            Acción Delicada
          </Typography>
          <Typography variant="caption" color="text.secondary" component="p">
            Al reemplazar el archivo, se recalculará el <strong>Hash de Seguridad</strong>. Asegúrese de que el nuevo PDF sea la versión correcta y final.
          </Typography>
        </Alert>

        {/* Zona de Carga (Drag & Drop) */}
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
                    : 'divider',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            bgcolor: dragActive 
                ? alpha(theme.palette.primary.main, 0.1) 
                : file 
                    ? alpha(theme.palette.success.main, 0.04) 
                    : alpha(theme.palette.background.default, 0.5),
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': !isLoading ? {
              borderColor: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              transform: 'translateY(-2px)'
            } : {}
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
              width: 56, height: 56, margin: '0 auto', mb: 2,
              bgcolor: file ? 'success.main' : alpha(theme.palette.action.disabled, 0.1),
              color: file ? 'white' : 'text.secondary',
              transition: 'all 0.3s ease'
            }}
          >
            {file ? <PictureAsPdf /> : <CloudUpload />}
          </Avatar>

          <Typography variant="body1" fontWeight={700} color={file ? 'success.main' : 'text.primary'}>
            {file ? file.name : (dragActive ? "¡Suelta el PDF aquí!" : "Haga clic o arrastre el nuevo PDF")}
          </Typography>
          
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            {file 
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB` 
                : `Solo se permiten archivos .PDF (Máx ${maxMb}MB)`}
          </Typography>
        </Box>
      </Stack>
    </BaseModal>
  );
};

export default UpdatePdfModal;