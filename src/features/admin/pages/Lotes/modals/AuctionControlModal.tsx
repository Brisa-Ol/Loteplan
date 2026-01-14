import React, { useState, useEffect } from 'react';
import { Stack, Typography, Alert, Box, TextField } from '@mui/material';
import { PlayCircleFilled, StopCircle, Gavel } from '@mui/icons-material';
import type { LoteDto } from '../../../../../core/types/dto/lote.dto';
import BaseModal from '../../../../../shared/components/domain/modals/BaseModal/BaseModal';


interface Props {
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
  // Actualizamos la firma: ahora los datos son obligatorios al iniciar
  onStart: (id: number, dates: { fecha_inicio: string; fecha_fin: string }) => void;
  onEnd: (id: number) => void;
  isLoading: boolean;
}

const AuctionControlModal: React.FC<Props> = ({ open, onClose, lote, onStart, onEnd, isLoading }) => {
  const [formData, setFormData] = useState({
    fecha_inicio: '',
    fecha_fin: ''
  });

  // Estado para validar lógica de fechas (Fin > Inicio)
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData({ fecha_inicio: '', fecha_fin: '' });
      setDateError(null);
    }
  }, [open, lote]);

  // Validación en tiempo real
  useEffect(() => {
    if (formData.fecha_inicio && formData.fecha_fin) {
      if (new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)) {
        setDateError('La fecha de fin debe ser posterior a la de inicio.');
      } else {
        setDateError(null);
      }
    }
  }, [formData.fecha_inicio, formData.fecha_fin]);

  if (!lote) return null;

  const isPending = lote.estado_subasta === 'pendiente';
  const isActive = lote.estado_subasta === 'activa';
  const isFinished = lote.estado_subasta === 'finalizada';

  // Validamos que los campos no estén vacíos y no haya errores de lógica
  const isFormValid = formData.fecha_inicio !== '' && formData.fecha_fin !== '' && !dateError;

  const handleConfirm = () => {
    if (isPending) {
      // Como validamos isFormValid en el botón, aquí enviamos los datos directamente
      onStart(lote.id, { 
        fecha_inicio: formData.fecha_inicio, 
        fecha_fin: formData.fecha_fin 
      });
    } 
    else if (isActive) {
      onEnd(lote.id);
    }
  };

  const getModalConfig = () => {
    if (isPending) return {
        title: `Iniciar Subasta: ${lote.nombre_lote}`,
        icon: <PlayCircleFilled />,
        color: 'success',
        btnText: 'Iniciar Ahora',
        desc: 'Configure las fechas para dar inicio y a la subasta.'
    };
    if (isActive) return {
        title: `Finalizar Subasta: ${lote.nombre_lote}`,
        icon: <StopCircle />,
        color: 'error',
        btnText: 'Finalizar Ahora',
        desc: 'Al confirmar, se cerrará la subasta y se determinará el ganador automáticamente.'
    };
    return { title: 'Subasta Finalizada', icon: <Gavel />, color: 'primary', btnText: 'Cerrar', desc: 'Esta subasta ya terminó.' };
  };

  const config = getModalConfig();

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={config.title}
      subtitle={`ID: ${lote.id}`}
      icon={config.icon}
      headerColor={config.color as any}
      confirmText={config.btnText}
      confirmButtonColor={config.color as any}
      onConfirm={isFinished ? undefined : handleConfirm}
      isLoading={isLoading}
      maxWidth="sm"
      hideConfirmButton={isFinished}
      // Bloqueamos el botón si es pendiente y el formulario no es válido
      disableConfirm={isPending && !isFormValid}
      cancelText="Cerrar"
    >
      <Stack spacing={2}>
        <Alert severity={config.color as any} variant="filled">{config.desc}</Alert>
        
        <Box bgcolor="background.paper" p={2} borderRadius={2} border="1px solid #eee">
             <Typography variant="caption" color="text.secondary" fontWeight={700}>PRECIO BASE</Typography>
             <Typography variant="h4" fontWeight={700}>${Number(lote.precio_base).toLocaleString()}</Typography>
        </Box>

        {isPending && (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Fecha de Inicio"
              type="datetime-local"
              value={formData.fecha_inicio}
              onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required // Marca visual de obligatorio
              error={formData.fecha_inicio === ''} // Rojo si está vacío (opcional, puede ser agresivo al inicio)
            />

            <TextField
              label="Fecha de Fin"
              type="datetime-local"
              value={formData.fecha_fin}
              onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              error={!!dateError}
              helperText={dateError}
            />
          </Stack>
        )}

      </Stack>
    </BaseModal>
  );
};

export default AuctionControlModal;