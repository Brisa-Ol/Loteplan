import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField,
  MenuItem,
  Stack,
  Alert,
  Chip,
  InputAdornment,
  useTheme,
  alpha
} from '@mui/material';
import {
  EditNote as EditIcon,
  Save as SaveIcon,
  Label as NameIcon,
  Numbers as VersionIcon,
  Business as ProjectIcon,
} from '@mui/icons-material';
import type { ContratoPlantillaDto } from '@/core/types/dto';
import { BaseModal } from '@/shared/components/domain/modals';

// ============================================================================
// INTERFACES
// ============================================================================
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

// ============================================================================
// COMPONENTE
// ============================================================================
const UpdateMetadataModal: React.FC<Props> = ({
  open,
  onClose,
  plantilla,
  onSubmit,
  isLoading,
  proyectos,
}) => {
  const theme = useTheme();

  // --- Estados locales ---
  const [nombre, setNombre] = useState('');
  const [version, setVersion] = useState<number | string>(1);
  const [idProyecto, setIdProyecto] = useState<number | ''>('');

  // --- Efecto: Sincronización de datos ---
  useEffect(() => {
    if (plantilla) {
      setNombre(plantilla.nombre_archivo);
      setVersion(plantilla.version);
      setIdProyecto(plantilla.id_proyecto ?? '');
    }
  }, [plantilla]);

  // --- Manejadores ---
  const handleConfirm = async () => {
    if (!plantilla) return;
    
    await onSubmit({
      nombre_archivo: nombre,
      version: Number(version),
      id_proyecto: idProyecto === '' ? null : Number(idProyecto),
    });
  };

  // --- Estilos Memorizados ---
  const styles = useMemo(() => ({
    input: { '& .MuiOutlinedInput-root': { borderRadius: 2 } },
    idChip: { 
      fontWeight: 800, 
      borderRadius: 1.5, 
      bgcolor: alpha(theme.palette.info.main, 0.05) 
    },
    alert: { 
      borderRadius: 2,
      bgcolor: alpha(theme.palette.info.main, 0.05),
      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
      '& .MuiAlert-icon': { color: 'info.main' }
    },
    selectMenu: {
      PaperProps: {
        sx: {
          maxHeight: 250,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.divider, 0.2),
            borderRadius: '10px',
          },
        }
      }
    }
  }), [theme]);

  // Guardrail para evitar renderizado si no hay plantilla cargada
  if (!plantilla) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Editar Metadatos"
      subtitle="Actualizar información de la plantilla"
      icon={<EditIcon />}
      headerColor="info"
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
          color="info"
          sx={styles.idChip}
        />
      }
    >
      <Stack spacing={3}>
        {/* Campo: Nombre del Archivo */}
        <TextField
          label="Nombre del Archivo"
          fullWidth
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={isLoading}
          sx={styles.input}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <NameIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Fila: Versión y Proyecto */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Versión"
            type="number"
            required
            sx={{ width: { xs: '100%', sm: '140px' }, ...styles.input }}
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

          <TextField
            select
            label="Proyecto Asignado"
            fullWidth
            value={idProyecto}
            onChange={(e) => setIdProyecto(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={isLoading}
            sx={styles.input}
            SelectProps={{ MenuProps: styles.selectMenu }}
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

        {/* Alerta de contexto */}
        <Alert severity="info" variant="standard" sx={styles.alert}>
          Esta edición <strong>no afecta el contenido del PDF</strong>, únicamente actualiza su identificación y clasificación en el sistema.
        </Alert>
      </Stack>
    </BaseModal>
  );
};

export default UpdateMetadataModal;