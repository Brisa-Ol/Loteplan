// src/pages/Admin/Plantillas/components/modals/UpdateMetadataModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  TextField, MenuItem, Stack, Box, Alert, Chip, InputAdornment 
} from '@mui/material';
import { 
    EditNote as EditIcon, 
    Save as SaveIcon,
    Label as NameIcon,
    Numbers as VersionIcon,
    Business as ProjectIcon
} from '@mui/icons-material';
import { BaseModal } from '../../../../../components/common/BaseModal/BaseModal';
import type { ContratoPlantillaDto } from '../../../../../types/dto/contrato.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  plantilla: ContratoPlantillaDto | null;
  onSubmit: (data: Partial<ContratoPlantillaDto>) => Promise<void>;
  isLoading: boolean;
  proyectos: any[]; 
}

const UpdateMetadataModal: React.FC<Props> = ({ 
  open, onClose, plantilla, onSubmit, isLoading, proyectos 
}) => {
  const [nombre, setNombre] = useState('');
  const [version, setVersion] = useState(1);
  const [idProyecto, setIdProyecto] = useState<string>(''); 

  useEffect(() => {
    if (plantilla) {
      setNombre(plantilla.nombre_archivo);
      setVersion(plantilla.version);
      setIdProyecto(plantilla.id_proyecto === null ? '' : plantilla.id_proyecto.toString());
    }
  }, [plantilla]);

  const handleConfirm = async () => {
    await onSubmit({
      nombre_archivo: nombre,
      version: Number(version),
      id_proyecto: idProyecto === '' ? null : Number(idProyecto)
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
      disableConfirm={!nombre || isLoading}
      confirmButtonIcon={<SaveIcon />}
      maxWidth="sm"
      headerExtra={
        <Chip 
          label={`ID: ${plantilla.id}`} 
          size="small" 
          variant="outlined" 
          sx={{ fontWeight: 700, borderRadius: 1.5 }}
        />
      }
    >
      <Stack spacing={3}>
        {/* Nombre */}
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
              <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
            ))}
          </TextField>
        </Stack>

        {/* Aviso */}
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
          Esta acción solo actualiza la información en la base de datos, no modifica el archivo PDF físico.
        </Alert>
      </Stack>
    </BaseModal>
  );
};

export default UpdateMetadataModal;