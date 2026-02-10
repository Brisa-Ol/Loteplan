// src/components/Admin/Proyectos/Components/ProyectoStateActions.tsx

import React from 'react';
import {
  Box, Paper, Typography, Button, Stack, Alert, Divider, Chip,
  useTheme, alpha, Avatar
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Pause as PauseIcon,
  Info as InfoIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Event as EventIcon
} from '@mui/icons-material';
import type { ProyectoDto } from '../../../../../core/types/dto/proyecto.dto';


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
  const theme = useTheme();

  // Lógica de estado
  const canIniciarProceso =
    proyecto.tipo_inversion === 'mensual' &&
    proyecto.estado_proyecto === 'En Espera';

  const canFinalizar = proyecto.estado_proyecto === 'En proceso';
  const isFinished = proyecto.estado_proyecto === 'Finalizado';

  // Helper de estilos
  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'text.secondary',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    mb: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 0.5
  };

  return (
    <Box sx={{ px: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <InfoIcon color="primary" />
        <Typography variant="h6" fontWeight={800} color="text.primary">
          Control de Estado
        </Typography>
      </Stack>

      <Stack spacing={3}>

        {/* 1. TARJETA DE ESTADO ACTUAL */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.background.paper, 0.4)
          }}
        >
          <Typography sx={labelStyle}>Estado Actual</Typography>

          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Chip
              label={proyecto.estado_proyecto}
              // Mapeo manual de colores para asegurar compatibilidad
              color={
                proyecto.estado_proyecto === 'En Espera' ? 'warning' :
                  proyecto.estado_proyecto === 'En proceso' ? 'success' :
                    proyecto.estado_proyecto === 'Finalizado' ? 'info' : 'default'
              }
              sx={{
                fontSize: '0.9rem',
                height: 32,
                px: 1,
                fontWeight: 700,
                // Estilo "Theme Global"
                bgcolor: proyecto.estado_proyecto === 'En Espera' ? alpha(theme.palette.warning.main, 0.1) :
                  proyecto.estado_proyecto === 'En proceso' ? alpha(theme.palette.success.main, 0.1) :
                    proyecto.estado_proyecto === 'Finalizado' ? alpha(theme.palette.info.main, 0.1) :
                      alpha(theme.palette.grey[500], 0.1),
                color: proyecto.estado_proyecto === 'En Espera' ? 'warning.main' :
                  proyecto.estado_proyecto === 'En proceso' ? 'success.main' :
                    proyecto.estado_proyecto === 'Finalizado' ? 'info.main' :
                      'text.secondary',
                border: '1px solid',
                borderColor: proyecto.estado_proyecto === 'En Espera' ? alpha(theme.palette.warning.main, 0.2) :
                  proyecto.estado_proyecto === 'En proceso' ? alpha(theme.palette.success.main, 0.2) :
                    proyecto.estado_proyecto === 'Finalizado' ? alpha(theme.palette.info.main, 0.2) :
                      theme.palette.divider
              }}
            />

            {proyecto.tipo_inversion === 'mensual' && proyecto.estado_proyecto === 'En proceso' && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                <TimerIcon fontSize="small" />
                <Typography variant="body2" fontWeight={600}>
                  {proyecto.meses_restantes} / {proyecto.plazo_inversion} meses restantes
                </Typography>
              </Stack>
            )}
          </Stack>

          <Alert severity="info" variant="outlined" sx={{ borderStyle: 'dashed', bgcolor: 'transparent' }}>
            {proyecto.estado_proyecto === 'En Espera' && (
              <>
                El proyecto está en espera de lanzamiento. {proyecto.tipo_inversion === 'mensual' ?
                  'Requiere iniciar el proceso manualmente para activar cobros.' :
                  'Hazlo visible para comenzar a recibir inversiones.'}
              </>
            )}
            {proyecto.estado_proyecto === 'En proceso' && (
              <>
                El proyecto está activo y operativo. {proyecto.tipo_inversion === 'mensual' &&
                  `El sistema genera cuotas automáticas mensualmente.`}
              </>
            )}
            {proyecto.estado_proyecto === 'Finalizado' && (
              'El ciclo de vida del proyecto ha concluido. No se generarán nuevas deudas ni cobros.'
            )}
          </Alert>
        </Paper>

        {/* 2. ACCIÓN: INICIAR PROCESO (Solo Mensuales en Espera) */}
        {canIniciarProceso && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: alpha(theme.palette.success.main, 0.3),
              bgcolor: alpha(theme.palette.success.main, 0.04)
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}>
                <PlayIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                  Iniciar Proceso
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Activación de ciclo financiero
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 2, borderColor: alpha(theme.palette.success.main, 0.2) }} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
              <Box flex={1}>
                <Typography sx={labelStyle}><TrendingUpIcon fontSize="inherit" /> Objetivo Suscripciones</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {proyecto.suscripciones_actuales} / {proyecto.obj_suscripciones}
                </Typography>
              </Box>
              <Box flex={1}>
                <Typography sx={labelStyle}><EventIcon fontSize="inherit" /> Plazo</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {proyecto.plazo_inversion} Meses
                </Typography>
              </Box>
              <Box flex={1}>
                <Typography sx={labelStyle}><MoneyIcon fontSize="inherit" /> Cuota Base</Typography>
                <Typography variant="body1" fontWeight={600}>
                  ${Number(proyecto.monto_inversion).toLocaleString()}
                </Typography>
              </Box>
            </Stack>

            <Alert severity="success" variant="filled" sx={{ mb: 2, borderRadius: 2 }}>
              Al iniciar, el estado cambiará a <strong>"En proceso"</strong> y se habilitará la generación de cuotas.
            </Alert>

            <Button
              variant="contained"
              color="success"
              startIcon={<PlayIcon />}
              onClick={onIniciarProceso}
              disabled={isLoading}
              fullWidth
              size="large"
              sx={{ borderRadius: 2, fontWeight: 700, boxShadow: theme.shadows[4] }}
            >
              {isLoading ? 'Iniciando...' : 'Confirmar Inicio de Proyecto'}
            </Button>
          </Paper>
        )}

        {/* 3. ACCIÓN: FINALIZAR PROCESO */}
        {canFinalizar && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: alpha(theme.palette.info.main, 0.3),
              bgcolor: alpha(theme.palette.info.main, 0.04)
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                <CheckIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                  Finalizar Proyecto
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cierre administrativo
                </Typography>
              </Box>
            </Stack>

            <Alert severity="warning" variant="outlined" sx={{ mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
              <strong>Acción Irreversible:</strong> Al finalizar, se detendrá permanentemente la generación de cobros y el ciclo de inversión.
            </Alert>

            <Button
              variant="contained"
              color="info"
              startIcon={<CheckIcon />}
              onClick={onFinalizar}
              disabled={isLoading}
              fullWidth
              size="large"
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {isLoading ? 'Finalizando...' : 'Marcar como Finalizado'}
            </Button>
          </Paper>
        )}

        {/* 4. ESTADO FINALIZADO (Solo informativo) */}
        {isFinished && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.action.disabledBackground, 0.1),
              borderStyle: 'dashed',
              borderRadius: 3
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <PauseIcon color="disabled" />
              <Typography variant="body2" color="text.secondary">
                Este proyecto está cerrado. No se requieren más acciones.
              </Typography>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
};