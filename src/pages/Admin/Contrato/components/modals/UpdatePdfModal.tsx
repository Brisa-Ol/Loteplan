// src/pages/Admin/Plantillas/components/modals/UpdatePdfModal.tsx

import React, { useState } from 'react';
import { 
  Box, Typography, Alert, useTheme, alpha, Stack, Avatar
} from '@mui/material';
import { 
    CloudUpload, 
    PictureAsPdf, 
    Warning
} from '@mui/icons-material';
import { BaseModal } from '../../../../../components/common/BaseModal/BaseModal';
// ✅ Ruta ajustada al estándar del proyecto
import type { ContratoPlantillaDto, UpdatePlantillaPdfDto } from '../../../../../types/dto/contrato.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  plantilla: ContratoPlantillaDto | null;
  onSubmit: (data: UpdatePlantillaPdfDto) => Promise<void>;
  isLoading: boolean;
}

const UpdatePdfModal: React.FC<Props> = ({ open, onClose, plantilla, onSubmit, isLoading }) => {
  const theme = useTheme();
  const [file, setFile] = useState<File | null>(null);

  const handleConfirm = async () => {
    if (!file || !plantilla) return;
    await onSubmit({ id: plantilla.id, file });
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    onClose();
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

        {/* Zona de Carga */}
        <Box 
          component="label"
          sx={{ 
            border: '2px dashed',
            borderColor: file ? 'primary.main' : 'divider',
            borderRadius: 3, 
            p: 4, 
            textAlign: 'center', 
            bgcolor: file ? alpha(theme.palette.primary.main, 0.04) : alpha(theme.palette.background.default, 0.5),
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'block',
            '&:hover': !isLoading ? { 
              borderColor: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.02)
            } : {}
          }}
        >
          <input 
            type="file" 
            hidden 
            accept="application/pdf" 
            onChange={(e) => { if (e.target.files) setFile(e.target.files[0]); }} 
            disabled={isLoading}
          />
          
          <Avatar 
            sx={{ 
              width: 56, height: 56, margin: '0 auto', mb: 2,
              bgcolor: file ? 'primary.main' : alpha(theme.palette.action.disabled, 0.1),
              color: file ? 'white' : 'text.secondary',
              transition: 'all 0.3s ease'
            }}
          >
            {file ? <PictureAsPdf /> : <CloudUpload />}
          </Avatar>

          <Typography variant="body1" fontWeight={700} color={file ? 'primary.main' : 'text.primary'}>
            {file ? file.name : "Haga clic para seleccionar nuevo PDF"}
          </Typography>
          
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Solo se permiten archivos .PDF"}
          </Typography>
        </Box>
      </Stack>
    </BaseModal>
  );
};

export default UpdatePdfModal;