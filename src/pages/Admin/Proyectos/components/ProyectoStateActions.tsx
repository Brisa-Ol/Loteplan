// src/components/Admin/Proyectos/Components/ProyectoStateActions.tsx

import React from 'react';
import {
  Box, Paper, Typography, Button, Stack, Alert, Divider, Chip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Pause as PauseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import type { ProyectoDto } from '../../../../types/dto/proyecto.dto';



interface ProyectoStateActionsProps {
  proyecto: ProyectoDto;
  onIniciarProceso: () => void;
  onFinalizar: () => void;
  isLoading: boolean;
}

export const ProyectoStateActions: React.FC<ProyectoStateActionsProps> = ({
  proyecto,
  onIniciarProceso,
  onFinalizar,
  isLoading
}) => {
  // Lógica de estado
  const canIniciarProceso = 
    proyecto.tipo_inversion === 'mensual' && 
    proyecto.estado_proyecto === 'En Espera';

  const canFinalizar = proyecto.estado_proyecto === 'En proceso';
  const isFinished = proyecto.estado_proyecto === 'Finalizado';

  return (
    <Box sx={{ px: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Acciones de Estado del Proyecto
      </Typography>

      <Stack spacing={3}>
        {/* Estado Actual */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <InfoIcon color="primary" />
            <Typography variant="subtitle1" fontWeight="bold">
              Estado Actual del Proyecto
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={2} alignItems="center">
            {/* ✅ CORRECCIÓN: Usamos sx para simular 'large' ya que la prop no existe */}
            <Chip
              label={proyecto.estado_proyecto}
              color={
                proyecto.estado_proyecto === 'En Espera' ? 'warning' :
                proyecto.estado_proyecto === 'En proceso' ? 'success' : 'default'
              }
              // size="medium" (Default)
              sx={{ 
                fontSize: '1rem', 
                height: 32, 
                px: 1,
                fontWeight: 'bold'
              }}
            />
            
            {proyecto.tipo_inversion === 'mensual' && proyecto.estado_proyecto === 'En proceso' && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Meses Restantes
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {proyecto.meses_restantes} / {proyecto.plazo_inversion}
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            {proyecto.estado_proyecto === 'En Espera' && (
              <>
                El proyecto está en espera. {proyecto.tipo_inversion === 'mensual' ? 
                  'Debe alcanzar el objetivo de suscripciones o iniciar el proceso manualmente.' : 
                  'Puedes activarlo cuando esté listo.'}
              </>
            )}
            {proyecto.estado_proyecto === 'En proceso' && (
              <>
                El proyecto está activo. {proyecto.tipo_inversion === 'mensual' && 
                  `Se están generando pagos mensuales automáticamente. Quedan ${proyecto.meses_restantes} meses de ${proyecto.plazo_inversion}.`}
              </>
            )}
            {proyecto.estado_proyecto === 'Finalizado' && (
              'El proyecto ha sido finalizado. No se generarán más pagos.'
            )}
          </Typography>
        </Paper>

        {/* Acción: Iniciar Proceso (Solo para Mensuales en Espera) */}
        {canIniciarProceso && (
          <Paper variant="outlined" sx={{ p: 3, bgcolor: 'success.50' }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <PlayIcon color="success" />
              <Typography variant="subtitle1" fontWeight="bold">
                Iniciar Proceso del Proyecto
              </Typography>
            </Stack>

            <Alert severity="info" sx={{ mb: 2 }}>
              Esta acción moverá el proyecto de <strong>"En Espera"</strong> a <strong>"En proceso"</strong>.
              Se comenzará el conteo de meses y se habilitará la generación automática de pagos mensuales.
            </Alert>

            <Stack spacing={1} mb={2}>
              <Typography variant="body2" color="text.secondary">
                • Objetivo de suscripciones: {proyecto.suscripciones_actuales} / {proyecto.obj_suscripciones}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Plazo de inversión: {proyecto.plazo_inversion} meses
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Cuota mensual configurada: ${Number(proyecto.monto_inversion).toLocaleString()}
              </Typography>
            </Stack>

            <Button
              variant="contained"
              color="success"
              startIcon={<PlayIcon />}
              onClick={onIniciarProceso}
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? 'Iniciando...' : 'Iniciar Proceso Ahora'}
            </Button>
          </Paper>
        )}

        {/* Acción: Finalizar Proyecto (Para proyectos En Proceso) */}
        {canFinalizar && (
          <Paper variant="outlined" sx={{ p: 3, bgcolor: 'info.50' }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <CheckIcon color="info" />
              <Typography variant="subtitle1" fontWeight="bold">
                Finalizar Proyecto
              </Typography>
            </Stack>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>⚠️ Acción Permanente:</strong> Marcar el proyecto como "Finalizado" 
              detendrá la generación de pagos mensuales. Esta acción no puede revertirse.
            </Alert>

            <Button
              variant="contained"
              color="info"
              startIcon={<CheckIcon />}
              onClick={onFinalizar}
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? 'Finalizando...' : 'Marcar como Finalizado'}
            </Button>
          </Paper>
        )}

        {/* Proyecto Finalizado */}
        {isFinished && (
          <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.100' }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <PauseIcon color="disabled" />
              <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
                Proyecto Finalizado
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Este proyecto ha sido marcado como finalizado. No se pueden realizar más acciones 
              de cambio de estado. Los datos históricos permanecen disponibles para auditoría.
            </Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
};