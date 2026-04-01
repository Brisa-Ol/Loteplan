// src/features/admin/pages/Lotes/modals/AuctionControlModal.tsx

import { AccessTime, Gavel, PlayCircleFilled, StopCircle } from '@mui/icons-material';
import { Alert, alpha, Box, Chip, Stack, TextField, Typography, useTheme } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';

import type { LoteDto } from '@/core/types/lote.dto';
import { BaseModal } from '@/shared';



// ============================================================================
// INTERFACES
// ============================================================================
interface Props {
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
  onStart: (id: number) => void;
  onEnd: (id: number) => void;
  isLoading: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AuctionControlModal: React.FC<Props> = ({ open, onClose, lote, onStart, onEnd, isLoading }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({ fecha_inicio: '', fecha_fin: '' });
  const [dateError, setDateError] = useState<string | null>(null);

  // --- Efecto: Reset de formulario ---
  useEffect(() => {
    if (open) {
      setFormData({ fecha_inicio: '', fecha_fin: '' });
      setDateError(null);
    }
  }, [open]);

  // --- Validación en tiempo real ---
  useEffect(() => {
    if (formData.fecha_inicio && formData.fecha_fin) {
      if (new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)) {
        setDateError('La fecha de fin debe ser posterior a la de inicio.');
      } else {
        setDateError(null);
      }
    }
  }, [formData.fecha_inicio, formData.fecha_fin]);

  // --- Helpers de Lógica ---
  const isPending = lote?.estado_subasta === 'pendiente';
  const isActive = lote?.estado_subasta?.toLowerCase() === 'activa';
  const isFinished = lote?.estado_subasta === 'finalizada';
  const isFormValid = formData.fecha_inicio !== '' && formData.fecha_fin !== '' && !dateError;

  const setQuickDuration = (days: number) => {
    const now = new Date();
    const end = new Date();
    end.setDate(now.getDate() + days);

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
    if (!lote) return;
    if (isPending) {
      onStart(lote.id);
    } else if (isActive) {
      onEnd(lote.id);
    }
  };

  // --- Configuración Dinámica ---
  const config = useMemo(() => {
    if (!lote) return null;
    if (isPending) return {
      title: `Iniciar Subasta: ${lote.nombre_lote}`,
      icon: <PlayCircleFilled />, color: 'success' as const, btnText: 'Confirmar Inicio',
      desc: 'Defina el periodo. Una vez iniciada, los usuarios habilitados podrán ofertar.'
    };
    if (isActive) return {
      title: `Finalizar Subasta: ${lote.nombre_lote}`,
      icon: <StopCircle />, color: 'error' as const, btnText: 'Finalizar Ahora',
      desc: 'Se cerrará la subasta inmediatamente y se adjudicará al ganador actual (si existe).'
    };
    return {
      title: 'Subasta Finalizada', icon: <Gavel />, color: 'info' as const,
      btnText: 'Cerrar', desc: 'Esta subasta ya terminó.'
    };
  }, [lote, isPending, isActive]);

  // --- Estilos Memorizados ---
  const styles = useMemo(() => ({
    priceBox: {
      bgcolor: alpha(theme.palette.background.default, 0.5),
      p: 2,
      borderRadius: 2,
      border: '1px solid',
      borderColor: theme.palette.divider,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    labelCaption: {
      fontWeight: 800,
      fontSize: '0.65rem',
      color: 'text.secondary',
      textTransform: 'uppercase',
      letterSpacing: 1,
      mb: 0.5
    }
  }), [theme]);

  if (!lote || !config) return null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={config.title}
      subtitle={`Referencia: #LT-${lote.id}`}
      icon={config.icon}
      headerColor={config.color}
      confirmText={config.btnText}
      confirmButtonColor={config.color}
      onConfirm={isFinished ? undefined : handleConfirm}
      isLoading={isLoading}
      maxWidth="sm"
      hideConfirmButton={isFinished}
      disableConfirm={isPending && !isFormValid}
      cancelText="Cerrar"
    >
      <Stack spacing={3}>
        {/* Alerta Informativa */}
        <Alert
          severity={config.color}
          variant="outlined"
          icon={config.icon}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {config.desc}
        </Alert>

        {/* Resumen de Precio */}
        <Box sx={styles.priceBox}>
          <Typography sx={styles.labelCaption}>PRECIO BASE DE SALIDA</Typography>
          <Typography variant="h3" fontWeight={900} color="text.primary">
            ${Number(lote.precio_base).toLocaleString('es-AR')}
          </Typography>
        </Box>

        {/* Configuración de Fechas (Solo si está pendiente) */}
        {isPending && (
          <Box>
            <Typography sx={styles.labelCaption} mb={1}>
              DURACIÓN ESTIMADA (AUTO-CONFIG)
            </Typography>
            <Stack direction="row" spacing={1} mb={3}>
              <Chip
                icon={<AccessTime sx={{ fontSize: '1rem !important' }} />}
                label="24 Horas"
                onClick={() => setQuickDuration(1)}
                clickable
                sx={{ fontWeight: 700 }}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<AccessTime sx={{ fontSize: '1rem !important' }} />}
                label="3 Días"
                onClick={() => setQuickDuration(3)}
                clickable
                sx={{ fontWeight: 700 }}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<AccessTime sx={{ fontSize: '1rem !important' }} />}
                label="1 Semana"
                onClick={() => setQuickDuration(7)}
                clickable
                sx={{ fontWeight: 700 }}
                color="primary"
                variant="outlined"
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Inicio de Subasta"
                type="datetime-local"
                fullWidth
                required
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
                error={formData.fecha_inicio === ''}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                label="Fin de Subasta"
                type="datetime-local"
                fullWidth
                required
                value={formData.fecha_fin}
                onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                InputLabelProps={{ shrink: true }}
                error={!!dateError}
                helperText={dateError}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          </Box>
        )}

        {/* Estado actual para Subastas Activas */}
        {isActive && (
          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.05), borderRadius: 2, textAlign: 'center', border: '1px dashed', borderColor: theme.palette.error.main }}>
            <Typography variant="body2" color="error.main" fontWeight={700}>
              ATENCIÓN: Al finalizar manualmente, se detendrá la recepción de pujas inmediatamente.
            </Typography>
          </Box>
        )}
      </Stack>
    </BaseModal>
  );
};

export default AuctionControlModal;