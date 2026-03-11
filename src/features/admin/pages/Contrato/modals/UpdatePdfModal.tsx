import { env } from '@/core/config/env';
import type { ContratoPlantillaDto, UpdatePlantillaPdfDto } from '@/core/types/dto/contrato-plantilla.dto';
import { BaseModal } from '@/shared/components/domain';
import { useSnackbar } from '@/shared/hooks';
import {
  CloudUpload,
  PictureAsPdf
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';

// ============================================================================
// INTERFACES
// ============================================================================
interface Props {
  open: boolean;
  onClose: () => void;
  plantilla: ContratoPlantillaDto | null;
  onSubmit: (data: UpdatePlantillaPdfDto) => Promise<void>;
  isLoading: boolean;
}

// ============================================================================
// COMPONENTE
// ============================================================================
const UpdatePdfModal: React.FC<Props> = ({ open, onClose, plantilla, onSubmit, isLoading }) => {
  const theme = useTheme();
  const { showError } = useSnackbar();

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // --- Helpers ---
  const maxMb = useMemo(() => Math.floor(env.maxFileSize / 1024 / 1024), []);

  const handleClose = useCallback(() => {
    setFile(null);
    setDragActive(false);
    onClose();
  }, [onClose]);

  const handleConfirm = async () => {
    if (!file || !plantilla) return;
    await onSubmit({ id: plantilla.id, file });
    handleClose();
  };

  // ✅ VALIDACIÓN CENTRALIZADA
  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      showError('Solo se permiten archivos PDF.');
      return;
    }

    if (selectedFile.size > env.maxFileSize) {
      showError(`El archivo excede el tamaño máximo permitido de ${maxMb}MB.`);
      return;
    }

    setFile(selectedFile);
  };

  // --- Manejadores de Eventos ---
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

  // --- Estilos Memorizados ---
  const styles = useMemo(() => ({
    dropZone: (isActive: boolean, hasFile: boolean) => ({
      display: 'block',
      border: '2px dashed',
      borderColor: isActive ? 'primary.main' : hasFile ? 'success.main' : 'divider',
      borderRadius: 3,
      p: 4,
      textAlign: 'center',
      bgcolor: isActive
        ? alpha(theme.palette.primary.main, 0.05)
        : hasFile ? alpha(theme.palette.success.main, 0.02) : alpha(theme.palette.background.default, 0.5),
      cursor: isLoading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease-in-out',
      '&:hover': !isLoading ? {
        borderColor: 'primary.main',
        bgcolor: alpha(theme.palette.primary.main, 0.02),
        transform: 'translateY(-2px)'
      } : {}
    }),
    alert: {
      borderRadius: 2,
      border: '1px dashed',
      borderColor: 'warning.main',
      bgcolor: alpha(theme.palette.warning.main, 0.02),
      '& .MuiAlert-icon': { color: 'warning.main' }
    },
    avatar: (isActive: boolean, hasFile: boolean) => ({
      width: 56,
      height: 56,
      mx: 'auto',
      mb: 2,
      bgcolor: hasFile ? 'success.main' : (isActive ? 'primary.main' : alpha(theme.palette.action.disabled, 0.1)),
      color: hasFile || isActive ? 'common.white' : 'text.disabled',
      transition: 'all 0.3s ease',
      boxShadow: hasFile ? `0 8px 16px ${alpha(theme.palette.success.main, 0.2)}` : 'none'
    })
  }), [theme, isLoading]);

  if (!plantilla) return null;

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Actualizar Archivo PDF"
      subtitle={`Plantilla: ${plantilla.nombre_archivo} (v${plantilla.version})`}
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
        <Alert severity="warning" variant="outlined" sx={styles.alert}>
          <Typography variant="subtitle2" fontWeight={800} color="warning.dark">
            Acción Crítica de Seguridad
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Al reemplazar el archivo, el sistema generará un nuevo <strong>Hash de Integridad</strong>.
            Este cambio es irreversible y afectará a los nuevos contratos generados.
          </Typography>
        </Alert>

        <Box
          component="label"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={styles.dropZone(dragActive, !!file)}
        >
          <input
            type="file"
            hidden
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isLoading}
          />

          <Avatar sx={styles.avatar(dragActive, !!file)}>
            {file ? <PictureAsPdf /> : <CloudUpload />}
          </Avatar>

          <Typography variant="body1" fontWeight={700} color={file ? 'success.main' : 'text.primary'}>
            {file ? file.name : (dragActive ? "¡Suelta el PDF ahora!" : "Seleccione o arrastre el nuevo PDF")}
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {file
              ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
              : `Solo archivos PDF permitidos (Máximo ${maxMb}MB)`}
          </Typography>
        </Box>
      </Stack>
    </BaseModal>
  );
};

export default UpdatePdfModal;