// src/pages/Admin/Plantillas/components/modals/UpdateMetadataModal.tsx

import React, { useState, useEffect } from 'react';
import {
  TextField,
  MenuItem,
  Stack,
  Alert,
  Chip,
  InputAdornment,
  useTheme,
  alpha // ✅ Necesario para el estilo del scroll
} from '@mui/material';
import {
  EditNote as EditIcon,
  Save as SaveIcon,
  Label as NameIcon,
  Numbers as VersionIcon,
  Business as ProjectIcon,
} from '@mui/icons-material';
import type { ContratoPlantillaDto } from '../../../../../../core/types/dto/contrato-plantilla.dto';
import BaseModal from '../../../../../../shared/components/domain/modals/BaseModal/BaseModal';

interface ProjectOption {
  id: number;
  nombre_proyecto: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  plantilla: ContratoPlantillaDto | null;
  onSubmit: (data: Partial<ContratoPlantillaDto>) => Promise<void>;
  isLoading: boolean;
  proyectos: ProjectOption[];
}

const UpdateMetadataModal: React.FC<Props> = ({
  open,
  onClose,
  plantilla,
  onSubmit,
  isLoading,
  proyectos,
}) => {
  const theme = useTheme(); // ✅ Hook para colores del scroll

  // Estados locales
  const [nombre, setNombre] = useState('');
  const [version, setVersion] = useState<number | string>(1);
  const [idProyecto, setIdProyecto] = useState<number | ''>('');

  // Cargar datos
  useEffect(() => {
    if (plantilla) {
      setNombre(plantilla.nombre_archivo);
      setVersion(plantilla.version);
      setIdProyecto(plantilla.id_proyecto ?? '');
    }
  }, [plantilla]);

  const handleConfirm = async () => {
    await onSubmit({
      nombre_archivo: nombre,
      version: Number(version),
      id_proyecto: idProyecto === '' ? null : Number(idProyecto),
    });
  };

  if (!plantilla) return null;

  const commonInputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Editar Datos"
      subtitle="Modificar metadatos de la plantilla"
      icon={<EditIcon />}
      headerColor="primary"
      confirmText="Guardar Cambios"
      onConfirm={handleConfirm}
      isLoading={isLoading}
      disableConfirm={!nombre || !version || isLoading}
      confirmButtonIcon={<SaveIcon />}
      maxWidth="sm"
      headerExtra={
        <Chip
          label={`ID: ${plantilla.id}`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 700, borderRadius: 1.5, borderColor: 'divider' }}
        />
      }
    >
      <Stack spacing={3}>
        {/* Nombre del Archivo */}
        <TextField
          label="Nombre del Archivo"
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

        {/* Fila: Versión y Proyecto */}
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
            // ✅ APLICAMOS EL ESTILO DE SCROLL DE UI ESTANDARIZADA
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: {
                    maxHeight: 300,
                    '&::-webkit-scrollbar': { width: '8px' },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'transparent',
                    }
                  }
                }
              }
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

        {/* Aviso Informativo */}
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
          Esta acción solo actualiza la información en la base de datos, no modifica el archivo PDF físico.
        </Alert>
      </Stack>
    </BaseModal>
  );
};

export default UpdateMetadataModal;