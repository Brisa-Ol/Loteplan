// src/pages/Admin/Cancelaciones/modals/DetalleCancelacionModal.tsx

import React from 'react';
import {
  Typography, Chip, Stack, Paper, Box, Divider, useTheme, alpha
} from '@mui/material';
import {
  MoneyOff,
  Person,
  Business,
  CalendarToday,
} from '@mui/icons-material';
import type { SuscripcionCanceladaDto } from '@/core/types/dto/suscripcion.dto';
import BaseModal from '@/shared/components/domain/modals/BaseModal/BaseModal';


interface Props {
  open: boolean;
  onClose: () => void;
  cancelacion: SuscripcionCanceladaDto | null;
}

const DetalleCancelacionModal: React.FC<Props> = ({ open, onClose, cancelacion }) => {
  const theme = useTheme();

  if (!cancelacion) return null;

  // Color base para secciones internas (coincide con headerColor="error")
  const themeColorMain = theme.palette.error.main;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Detalle de Cancelación"
      subtitle={`Registro de Baja #${cancelacion.id}`}
      icon={<MoneyOff />}
      headerColor="error"
      maxWidth="md"
      hideConfirmButton
      cancelText="Cerrar"
      headerExtra={
        <Chip
          label="CANCELADO"
          color="error"
          variant="filled"
          sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
        />
      }
    >
      <Stack spacing={3}>

        {/* SECCIÓN 1: KPI PRINCIPAL (Monto a Liquidar) */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5, borderRadius: 2,
            border: '1px solid',
            borderColor: alpha(themeColorMain, 0.3),
            bgcolor: alpha(themeColorMain, 0.04)
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                MONTO TOTAL PAGADO (A LIQUIDAR)
              </Typography>
              <Typography variant="h4" fontWeight={800} color="error.main" sx={{ my: 0.5 }}>
                ${Number(cancelacion.monto_pagado_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                ⚠️ Este monto debe ser gestionado según la política de devolución.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* CONTENEDOR FLEX: Usuario y Proyecto */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>

          {/* SECCIÓN 2: Usuario */}
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Person color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>EX-SUSCRIPTOR</Typography>
            </Stack>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">Nombre Completo</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {cancelacion.usuario ? `${cancelacion.usuario.nombre} ${cancelacion.usuario.apellido}` : `ID Usuario: ${cancelacion.id_usuario}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {cancelacion.usuario?.email || '-'}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* SECCIÓN 3: Proyecto */}
          <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Business color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={800}>PROYECTO ORIGEN</Typography>
            </Stack>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">Nombre del Proyecto</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {cancelacion.proyecto?.nombre_proyecto || `ID Proyecto: ${cancelacion.id_proyecto}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Suscripción Original ID</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  #{cancelacion.id_suscripcion_original}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>

        {/* SECCIÓN 4: Detalles Técnicos */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <CalendarToday color="action" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
              DETALLES DE LA BAJA
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={4}
            divider={<Divider orientation="vertical" flexItem />}
            alignItems="center"
          >
            <Box>
              <Typography variant="caption" color="text.secondary">Fecha Cancelación</Typography>
              <Typography variant="body1" fontWeight={600}>
                {new Date(cancelacion.fecha_cancelacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Meses Abonados</Typography>
              <Typography variant="body1" fontWeight={600}>
                {cancelacion.meses_pagados} <Typography component="span" variant="body2" color="text.secondary">meses</Typography>
              </Typography>
            </Box>
          </Stack>
        </Paper>

      </Stack>
    </BaseModal>
  );
};

export default DetalleCancelacionModal;