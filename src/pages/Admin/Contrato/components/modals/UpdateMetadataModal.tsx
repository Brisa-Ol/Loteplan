import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Stack, FormHelperText 
} from '@mui/material';
import type { ContratoPlantillaDto } from '../../../../../types/dto/contrato.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  plantilla: ContratoPlantillaDto | null;
  onSubmit: (data: Partial<ContratoPlantillaDto>) => Promise<void>;
  isLoading: boolean;
  proyectos: any[]; 
}

const UpdateMetadataModal: React.FC<Props> = ({ open, onClose, plantilla, onSubmit, isLoading, proyectos }) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      nombre_archivo: nombre,
      version: Number(version),
      id_proyecto: idProyecto === '' ? null : Number(idProyecto)
    });
  };

  if (!plantilla) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle variant="h6">Editar Datos</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField label="ID Plantilla" value={plantilla.id} disabled variant="filled" size="small" sx={{ width: 100 }} />
            <TextField label="Nombre del Archivo" fullWidth required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <Stack direction="row" spacing={2}>
              <TextField label="Versión" type="number" required sx={{ width: '120px' }} value={version} onChange={(e) => setVersion(Number(e.target.value))} />
              <TextField select label="Proyecto Asignado" fullWidth value={idProyecto} onChange={(e) => setIdProyecto(e.target.value)}>
                <MenuItem value=""><em>-- Genérica --</em></MenuItem>
                {proyectos.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
              </TextField>
            </Stack>
            <FormHelperText>Nota: Solo actualiza la información en BD, no el archivo.</FormHelperText>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained" disabled={!nombre || isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UpdateMetadataModal;