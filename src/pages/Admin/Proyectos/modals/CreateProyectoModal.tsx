// src/components/Admin/Proyectos/CreateProyectoModal.tsx (FINAL)
// Nota: Requiere un componente 'LoteSelector' que maneje la lista de lotes no asignados.

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Stack, Box, Typography, IconButton,
  CircularProgress, Alert, Divider
} from '@mui/material';
import type { CreateProyectoDTO } from '../../../../types/dto/proyecto.dto';
import { useFormik } from 'formik';


interface CreateProyectoModalProps {
  open: boolean;
  onClose: () => void;
  // ❗ CORRECCIÓN: Ahora recibe lotesIds en el DTO
  onSubmit: (data: CreateProyectoDTO, image: File | null) => Promise<void>;
  isLoading?: boolean;
}

// ... (validationSchema se mantiene igual)

const CreateProyectoModal: React.FC<CreateProyectoModalProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  isLoading = false 
}) => {
  const [image, setImage] = useState<File | null>(null);
  // ❗ CAMBIO: Estado para almacenar los IDs de los lotes seleccionados
  const [initialLotesIds, setInitialLotesIds] = useState<number[]>([]); 

  const formik = useFormik<CreateProyectoDTO>({
    initialValues: {
      // ... (Campos iniciales)
      lotesIds: [], // ❗ AÑADIDO: Array de IDs de lotes
    },
    // ... (validationSchema se mantiene igual)
    onSubmit: async (values) => {
      try {
        const dataToSend = { 
          ...values, 
          lotesIds: initialLotesIds // ❗ CRÍTICO: Adjuntar los IDs de lotes
        };
        
        await onSubmit(dataToSend, image);
        formik.resetForm();
        setImage(null);
        setInitialLotesIds([]); // Limpiar estado de lotes
      } catch (error) {
        console.error('Error al crear proyecto:', error);
      }
    },
  });
  
  // ... (handleClose, useEffect y JSX se mantienen iguales, añadiendo el componente LoteSelector)

  return (
    <Dialog open={open} onClose={isLoading ? undefined : handleClose} maxWidth="md" fullWidth>
      {/* ... (DialogTitle y Botón de Cerrar) ... */}

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* ... (Información Básica, Tipo de Inversión, Monto y Fechas - sin cambios) ... */}

            {/* ❗ NUEVA SECCIÓN: Lotes Iniciales */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                Lotes Iniciales (Opcional)
              </Typography>
              <LoteSelector // ❗ Componente que permite seleccionar lotes
                selectedLotesIds={initialLotesIds}
                onChange={setInitialLotesIds}
                disabled={isLoading}
              />
            </Box>
            
            <Divider />
            
            {/* Upload de Imagen Principal (se mantiene) */}
            {/* ... */}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          {/* ... (Botones de Cancelar/Crear - sin cambios) ... */}
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateProyectoModal;