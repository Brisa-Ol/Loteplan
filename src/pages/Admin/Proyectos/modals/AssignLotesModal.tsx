// src/components/Admin/Proyectos/Modals/AssignLotesModal.tsx
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, IconButton, CircularProgress, Alert,
  Autocomplete, TextField, Checkbox, Chip, Stack
} from '@mui/material';
import { Close as CloseIcon, Layers as LotesIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// --- Servicios ---
// ✅ CORRECCIÓN: Importar con el nombre exacto que tiene el export default
import LoteService from '../../../../Services/lote.service';

// --- Tipos ---
// ✅ CORRECCIÓN: Usar LoteDto y ProyectoDto (coincidiendo con tus archivos .dto.ts)
import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';
import type { LoteDto } from '../../../../types/dto/lote.dto';

interface AssignLotesModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (proyectoId: string, data: { lotesIds: number[] }) => void;
  proyecto: ProyectoDto | null;
  isLoading?: boolean;
}

export const AssignLotesModal: React.FC<AssignLotesModalProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  proyecto,
  isLoading = false 
}) => {
  const [selectedLotes, setSelectedLotes] = useState<LoteDto[]>([]);

  // 1. Query para traer lotes sin asignar
  const { data: lotesDisponibles = [], isLoading: isLoadingLotes } = useQuery<LoteDto[]>({
    queryKey: ['lotesSinProyecto'],
    // ✅ CORRECCIÓN: Usamos el método correcto 'getUnassigned' y extraemos .data
    queryFn: async () => {
      const response = await LoteService.getUnassigned();
      return response.data;
    },
    enabled: open, 
  });

  const handleSubmit = () => {
    if (!proyecto || selectedLotes.length === 0) return;
    
    // Enviamos solo los IDs
    onSubmit(proyecto.id.toString(), {
      lotesIds: selectedLotes.map(lote => lote.id)
    });
    
    setSelectedLotes([]);
  };

  const handleClose = () => {
    setSelectedLotes([]);
    onClose();
  };

  if (!proyecto) return null;

  // Asumimos que ProyectoDto tiene una propiedad opcional 'lotes'
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
          <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, opacity: 0.2 }}> 
             {/* Ajusté el color a primary.light con opacidad simulada o usa un gris suave si primary.50 no existe en tu tema */}
             <Box sx={{ opacity: 1, color: 'text.primary' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {proyecto.nombre_proyecto}
                </Typography>
                <Typography variant="body2">
                  Tipo: {proyecto.tipo_inversion === 'mensual' ? 'Ahorro (Mensual)' : 'Inversión (Directo)'}
                </Typography>
                <Typography variant="body2">
                  Estado: {proyecto.estado_proyecto}
                </Typography>
             </Box>
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
                    color="default"
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
              // Muestra Nombre y Precio
              getOptionLabel={(option) => `${option.nombre_lote} ($${Number(option.precio_base).toLocaleString()})`}
              value={selectedLotes}
              onChange={(_, newValue) => setSelectedLotes(newValue)}
              loading={isLoadingLotes}
              disabled={isLoading}
              isOptionEqualToValue={(option, value) => option.id === value.id} // Importante para evitar warnings
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
                       ID: {option.id} - Base: ${Number(option.precio_base).toLocaleString()}
                    </Typography>
                  </Box>
                </li>
              )}
            />
            
            {lotesDisponibles.length === 0 && !isLoadingLotes && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No hay lotes "huérfanos" disponibles. Crea nuevos lotes sin proyecto asignado primero.
              </Alert>
            )}

            {selectedLotes.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Se asignarán <strong>{selectedLotes.length}</strong> lote(s) a este proyecto.
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