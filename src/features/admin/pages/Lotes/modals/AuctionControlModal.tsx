import React, { useState, useEffect } from 'react';
import { Stack, Typography, Alert, Box, TextField, Button, Chip } from '@mui/material';
import { PlayCircleFilled, StopCircle, Gavel, AccessTime, Update as UpdateIcon } from '@mui/icons-material';
import type { LoteDto } from '../../../../../core/types/dto/lote.dto';
import BaseModal from '../../../../../shared/components/domain/modals/BaseModal/BaseModal';

interface Props {
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
  onStart: (id: number, dates: { fecha_inicio: string; fecha_fin: string }) => void;
  onEnd: (id: number) => void;
  isLoading: boolean;
}

const AuctionControlModal: React.FC<Props> = ({ open, onClose, lote, onStart, onEnd, isLoading }) => {
  const [formData, setFormData] = useState({ fecha_inicio: '', fecha_fin: '' });
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData({ fecha_inicio: '', fecha_fin: '' });
      setDateError(null);
    }
  }, [open, lote]);

  // Validación en tiempo real: Fin > Inicio
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
  const isFormValid = formData.fecha_inicio !== '' && formData.fecha_fin !== '' && !dateError;

  // ✨ UX FEATURE: Helper para configurar fechas rápidas ajustadas a zona horaria local
  const setQuickDuration = (days: number) => {
      const now = new Date();
      const end = new Date();
      end.setDate(now.getDate() + days);

      // Truco para ajustar UTC a Local ISO string compatible con input datetime-local
      const toLocalISO = (d: Date) => {
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().slice(0, 16);
      };

      setFormData({
          fecha_inicio: toLocalISO(now),
          fecha_fin: toLocalISO(end)
      });
  };

  const handleConfirm = () => {
    if (isPending) {
      onStart(lote.id, { fecha_inicio: formData.fecha_inicio, fecha_fin: formData.fecha_fin });
    } else if (isActive) {
      onEnd(lote.id);
    }
  };

  const getModalConfig = () => {
    if (isPending) return {
        title: `Iniciar Subasta: ${lote.nombre_lote}`,
        icon: <PlayCircleFilled />, color: 'success', btnText: 'Confirmar Inicio',
        desc: 'Defina el periodo. Una vez iniciada, los usuarios habilitados podrán ofertar.'
    };
    if (isActive) return {
        title: `Finalizar Subasta: ${lote.nombre_lote}`,
        icon: <StopCircle />, color: 'error', btnText: 'Finalizar Ahora',
        desc: 'Se cerrará la subasta inmediatamente y se adjudicará al ganador actual.'
    };
    return { title: 'Subasta Finalizada', icon: <Gavel />, color: 'primary', btnText: 'Cerrar', desc: 'Esta subasta ya terminó.' };
  };

  const config = getModalConfig();

  return (
    <BaseModal
      open={open} onClose={onClose}
      title={config.title} subtitle={`ID: ${lote.id}`} icon={config.icon}
      headerColor={config.color as any} confirmText={config.btnText} confirmButtonColor={config.color as any}
      onConfirm={isFinished ? undefined : handleConfirm} isLoading={isLoading}
      maxWidth="sm" hideConfirmButton={isFinished} disableConfirm={isPending && !isFormValid}
      cancelText="Cerrar"
    >
      <Stack spacing={2}>
        <Alert severity={config.color as any} variant="filled" icon={config.icon}>{config.desc}</Alert>
        
        <Box bgcolor="background.paper" p={2} borderRadius={2} border="1px solid #eee">
             <Typography variant="caption" color="text.secondary" fontWeight={700}>PRECIO BASE</Typography>
             <Typography variant="h4" fontWeight={700}>${Number(lote.precio_base).toLocaleString()}</Typography>
        </Box>

        {isPending && (
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1} display="block">
                CONFIGURACIÓN RÁPIDA
            </Typography>
            <Stack direction="row" spacing={1} mb={2}>
                <Chip icon={<AccessTime />} label="24 Horas" onClick={() => setQuickDuration(1)} clickable color="primary" variant="outlined" />
                <Chip icon={<AccessTime />} label="3 Días" onClick={() => setQuickDuration(3)} clickable color="primary" variant="outlined" />
                <Chip icon={<AccessTime />} label="1 Semana" onClick={() => setQuickDuration(7)} clickable color="primary" variant="outlined" />
            </Stack>

            <Stack direction="row" spacing={2}>
                <TextField
                  label="Inicio" type="datetime-local" fullWidth required
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  error={formData.fecha_inicio === ''}
                />
                <TextField
                  label="Fin" type="datetime-local" fullWidth required
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  error={!!dateError} helperText={dateError}
                />
            </Stack>
          </Box>
        )}
      </Stack>
    </BaseModal>
  );
};

export default AuctionControlModal;