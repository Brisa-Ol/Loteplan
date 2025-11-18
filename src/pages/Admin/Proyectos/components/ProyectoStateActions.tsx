// src/components/Admin/Proyectos/Components/ProyectoStateActions.tsx (Corregido)
import React from 'react';
import {
  Box, Paper, Typography, Button, Stack, Alert, Chip, Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import type { ProyectoDTO } from '../../../../types/dto/proyecto.dto';

interface ProyectoStateActionsProps {
  proyecto: ProyectoDTO;
  onIniciarProceso: () => void;
  onFinalizar: () => void;
  isLoading: boolean;
}

// Helper para formatear DATEONLY (ej: "2025-11-17") sin errores de zona horaria
const formatSafeDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  // Añadir T00:00:00 previene que new Date() interprete la fecha como UTC
  // y la mueva un día atrás por la zona horaria.
  return new Date(dateString + 'T00:00:00').toLocaleDateString();
};

const ProyectoStateActions: React.FC<ProyectoStateActionsProps> = ({
  proyecto,
  onIniciarProceso,
  onFinalizar,
  isLoading
}) => {
  return (
    <Box sx={{ px: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Gestión de Estado del Proyecto
      </Typography>

      {/* Estado Actual */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Estado Actual
        </Typography>
        <Stack direction="row" spacing={2} mb={2}>
          <Chip
            label={proyecto.estado_proyecto}
            color={
              proyecto.estado_proyecto === 'En Espera' ? 'warning' :
              proyecto.estado_proyecto === 'En proceso' ? 'success' : 'default'
            }
            // ❗ CORRECCIÓN: Cambiado de "large" a "medium"
            size="medium"
          />
          <Chip
            label={proyecto.activo ? 'Activo' : 'Inactivo'}
            color={proyecto.activo ? 'success' : 'default'}
            variant={proyecto.activo ? 'filled' : 'outlined'}
            // ❗ CORRECCIÓN: Cambiado de "large" a "medium"
            size="medium"
          />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {proyecto.estado_proyecto === 'En Espera' && 'El proyecto está esperando para comenzar el proceso.'}
          {proyecto.estado_proyecto === 'En proceso' && 'El proyecto está actualmente en ejecución.'}
          {proyecto.estado_proyecto === 'Finalizado' && 'El proyecto ha sido completado.'}
        </Typography>
      </Paper>

      {/* Acciones Disponibles */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="bold">
          Acciones Disponibles
        </Typography>

        <Stack spacing={2} mt={2}>
          {/* Iniciar Proceso (solo para mensuales en espera) */}
          {proyecto.tipo_inversion === 'mensual' && proyecto.estado_proyecto === 'En Espera' && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Iniciar Proceso:</strong> Mueve el proyecto a "En proceso" y comienza el conteo de meses restantes ({proyecto.plazo_inversion} meses).
              </Alert>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<PlayIcon />}
                onClick={onIniciarProceso}
                disabled={isLoading}
                fullWidth
              >
                Iniciar Proceso del Proyecto
              </Button>
            </Box>
          )}

          {/* Finalizar Proyecto (solo si está en proceso) */}
          {proyecto.estado_proyecto === 'En proceso' && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Finalizar Proyecto:</strong> Marca el proyecto como "Finalizado". Esta acción es permanente y no se puede revertir.
              </Alert>
              <Button
                variant="contained"
                color="info"
                size="large"
                startIcon={<CheckIcon />}
                onClick={onFinalizar}
                disabled={isLoading}
                fullWidth
              >
                Finalizar Proyecto
              </Button>
            </Box>
          )}

          {/* Información sobre proyecto finalizado */}
          {proyecto.estado_proyecto === 'Finalizado' && (
            <Alert severity="success">
              <strong>Proyecto Finalizado:</strong> Este proyecto ha sido completado. No hay más acciones disponibles.
            </Alert>
          )}

          {/* Información adicional */}
          {proyecto.tipo_inversion === 'mensual' && proyecto.estado_proyecto === 'En proceso' && (
            <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Información del Proceso Activo:
              </Typography>
              <Typography variant="body2">
                • Fecha de inicio: {formatSafeDate(proyecto.fecha_inicio_proceso)}
              </Typography>
              <Typography variant="body2">
                • Meses restantes: {proyecto.meses_restantes} de {proyecto.plazo_inversion}
              </Typography>
              <Typography variant="body2">
                • Suscripciones: {proyecto.suscripciones_actuales} / {proyecto.obj_suscripciones}
              </Typography>
            </Paper>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default ProyectoStateActions;