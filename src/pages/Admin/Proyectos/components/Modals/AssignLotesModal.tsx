// src/components/Admin/Proyectos/AssignLotesModal.tsx (Corregido)
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, IconButton, CircularProgress, Alert,
  Autocomplete, TextField, Checkbox, Chip, Stack
} from '@mui/material';
import { Close as CloseIcon, Layers as LotesIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// ❗ CORRECCIÓN 1: Importar AssignLotesDTO junto con ProyectoDTO
import type { ProyectoDTO, AsignarLotesDTO } from '../../../../../types/dto/proyecto.dto';
import type { ILote } from '../../../../../types/dto/lote.dto';
import { loteService } from '../../../../../Services/lote.service';



interface AssignLotesModalProps {
  open: boolean;
  onClose: () => void;
  // Esta línea ahora funcionará
  onSubmit: (proyectoId: number, data: AsignarLotesDTO) => Promise<void>;
  proyecto: ProyectoDTO | null;
  isLoading?: boolean;
}

const AssignLotesModal: React.FC<AssignLotesModalProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  proyecto,
  isLoading = false 
}) => {
  const [selectedLotes, setSelectedLotes] = useState<ILote[]>([]);

  // Query para traer lotes sin asignar
  const { data: lotesDisponibles = [], isLoading: isLoadingLotes } = useQuery<ILote[], Error>({
    queryKey: ['unassignedLotes'],
    queryFn: loteService.getLotesSinProyecto, // Esto ya está correcto
    enabled: open,
  });

  const handleSubmit = async () => {
    if (!proyecto || selectedLotes.length === 0) return;
    
    try {
      // El ID (proyecto.id) ya es un número, así que esto está correcto
      await onSubmit(proyecto.id, {
        lotesIds: selectedLotes.map(lote => lote.id)
      });
      setSelectedLotes([]);
      onClose();
    } catch (error) {
      console.error('Error al asignar lotes:', error);
    }
  };

  const handleClose = () => {
    setSelectedLotes([]);
    onClose();
  };

  if (!proyecto) return null;

  const lotesYaAsignados = proyecto.lotes || [];

  return (
    <Dialog open={open} onClose={isLoading ? undefined : handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LotesIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Asignar Lotes al Proyecto
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={isLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          
          {/* Información del Proyecto */}
          <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {proyecto.nombre_proyecto}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tipo: {proyecto.tipo_inversion === 'mensual' ? 'Ahorro (Mensual)' : 'Inversión (Directo)'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Estado: {proyecto.estado_proyecto}
            </Typography>
          </Box>

          {/* Lotes Ya Asignados */}
          {lotesYaAsignados.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Lotes Actuales ({lotesYaAsignados.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {lotesYaAsignados.map((lote) => (
                  <Chip
                    key={lote.id}
                    label={`${lote.nombre_lote} (ID: ${lote.id})`}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Selector de Nuevos Lotes */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
              Agregar Nuevos Lotes
            </Typography>
            <Autocomplete
              multiple
              id="lotes-selector"
              options={lotesDisponibles}
              getOptionLabel={(option) => `${option.nombre_lote} (ID: ${option.id})`}
              value={selectedLotes}
              onChange={(_, newValue) => setSelectedLotes(newValue)}
              loading={isLoadingLotes}
              disabled={isLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar lotes disponibles..."
                  placeholder="Selecciona uno o varios lotes"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingLotes ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox style={{ marginRight: 8 }} checked={selected} />
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {option.nombre_lote}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {/* Esto ya está correcto */}
                      ID: {option.id} • Precio Base: ${Number(option.precio_base).toLocaleString()}
                    </Typography>
                  </Box>
                </li>
              )}
            />
            
            {lotesDisponibles.length === 0 && !isLoadingLotes && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No hay lotes disponibles sin asignar. Debes crear lotes primero.
              </Alert>
            )}

            {selectedLotes.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>{selectedLotes.length}</strong> lote(s) seleccionado(s) para asignar.
              </Alert>
            )}
          </Box>

        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || selectedLotes.length === 0}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LotesIcon />}
        >
          {isLoading ? 'Asignando...' : `Asignar ${selectedLotes.length} Lote(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignLotesModal;