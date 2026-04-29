// src/features/client/pages/Proyectos/components/ProjectCard.tsx

import {
  ArrowForward,
  CheckCircle,
  EventAvailable,
  LocalOffer,
  LockOutlined,
  PendingActions,
  ReceiptLong,
  Timer,
  Visibility
} from "@mui/icons-material";
import {
  alpha, Box, Button, Card, CardContent, CardMedia, Chip, Divider,
  LinearProgress, Stack, Tooltip, Typography, useTheme, Zoom
} from "@mui/material";
import React, { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/core/context/AuthContext";
import type { ProyectoDto } from "@/core/types/proyecto.dto";
// ✅ Importamos los DTOs para analizar el estado real
import type { AdhesionDto } from "@/core/types/adhesion.dto";
import type { SuscripcionDto } from "@/core/types/suscripcion.dto";
import { useProyectoHelpers } from "@/features/client/hooks/useProyectoHelpers";

export interface ProjectCardProps {
  project: ProyectoDto;
  onClick?: () => void;
  // ✅ Reemplazamos los booleanos simples por los objetos completos (opcionales)
  suscripcionUsuario?: SuscripcionDto;
  adhesionUsuario?: AdhesionDto;
}

const CardHeader: React.FC<{
  imagenPrincipal: string;
  badge: any;
  esPack: boolean;
  estadoConfig: { label: string; color: string };
  nombreProyecto: string;
  tiempoLabel: string;
  esUrgente: boolean;
  tooltipFecha: string;
  isPrelanzamiento: boolean;
  isLleno: boolean;
  participacion: any;
  onImageError: () => void;
}> = ({
  imagenPrincipal, badge, esPack, estadoConfig,
  nombreProyecto, tiempoLabel, esUrgente, tooltipFecha, isPrelanzamiento, isLleno, participacion,
  onImageError
}) => {
    const isFinalizado = estadoConfig.label.toLowerCase() === 'finalizado';
    const timeIcon = esUrgente ? <Timer sx={{ fontSize: 16 }} /> : <EventAvailable sx={{ fontSize: 16 }} />;
    const timeColor = esUrgente ? 'error' : (tiempoLabel?.includes('Abre') ? 'info' : 'warning');

    return (
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden', bgcolor: 'grey.200' }}>
        <CardMedia
          component="img" height="100%" image={imagenPrincipal} alt={nombreProyecto} loading="lazy" onError={onImageError}
          sx={{ objectFit: 'cover', transition: 'transform 0.5s ease', '&:hover': { transform: 'scale(1.05)' }, filter: isFinalizado ? 'grayscale(0.6)' : 'none' }}
        />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)', pointerEvents: 'none' }} />

        <Chip icon={<badge.icon sx={{ fontSize: '16px !important' }} />} label={badge.label} size="small" color="primary" sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700, boxShadow: 2 }} />

        <Stack spacing={0.5} sx={{ position: 'absolute', top: 12, right: 12 }} alignItems="flex-end">
          {participacion ? (
            <Chip
              icon={<participacion.icon sx={{ fontSize: '16px !important' }} />}
              label={participacion.chipLabel}
              color={participacion.colorTheme}
              size="small"
              sx={{ fontWeight: 800, color: 'white', boxShadow: 2 }}
            />
          ) : isFinalizado ? (
            <Chip label="FINALIZADO" color="success" size="small" sx={{ fontWeight: 800, color: 'white', boxShadow: 2 }} />
          ) : isLleno ? (
            <Chip label="CUPOS AGOTADOS" color="error" size="small" sx={{ fontWeight: 800, color: 'white', boxShadow: 2 }} />
          ) : isPrelanzamiento ? (
            <Chip label="PRÓXIMAMENTE" color="info" size="small" sx={{ fontWeight: 800, color: 'white', boxShadow: 2 }} />
          ) : (
            <Chip label="ABIERTO" color="success" size="small" sx={{ fontWeight: 800, color: 'white', boxShadow: 2 }} />
          )}
          {esPack && <Chip icon={<LocalOffer sx={{ fontSize: 14 }} />} label="PACK" color="warning" size="small" sx={{ fontWeight: 800, boxShadow: 2 }} />}
        </Stack>

        {tiempoLabel && !isFinalizado && !participacion && (
          <Tooltip title={tooltipFecha} arrow TransitionComponent={Zoom} placement="top">
            <Chip icon={timeIcon} label={tiempoLabel} size="small" color={timeColor} sx={{ position: 'absolute', bottom: 12, right: 12, fontWeight: 700, boxShadow: 3 }} />
          </Tooltip>
        )}
      </Box>
    );
  };

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, suscripcionUsuario, adhesionUsuario }) => {
  const helpers = useProyectoHelpers(project);
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const imageState = useRef<{ error: boolean }>({ error: false });
  const handleImageError = useCallback(() => { imageState.current.error = true; }, []);

  const hoy = new Date();
  const fechaInicio = new Date(project.fecha_inicio);
  const isPrelanzamiento = fechaInicio > hoy;
  const isLleno = project.suscripciones_actuales >= (project.obj_suscripciones || 1);

  const imagenFinal = imageState.current.error ? '/assets/placeholder-project.jpg' : helpers.imagenPrincipal;
  const tooltipFecha = isPrelanzamiento ? `Apertura programada: ${helpers.fechas.inicio}` : `Fecha límite: ${helpers.fechas.cierre}`;

// =========================================================================
  // ✅ MOTOR DE ESTADOS DE PARTICIPACIÓN (Filtra Cancelados)
  // =========================================================================
  let participacion: any = null;

  // 1. Verificamos si tiene una suscripción ACTIVA
  const tieneSuscripcionActiva = suscripcionUsuario && suscripcionUsuario.activo;
  
  // 2. Verificamos si tiene una adhesión NO CANCELADA
  const tieneAdhesionActiva = adhesionUsuario && adhesionUsuario.estado !== 'cancelada';

  // Si tiene al menos una de las dos cosas activas, evaluamos el estado
  if (tieneSuscripcionActiva || tieneAdhesionActiva) {
    
    // Si la adhesión está completada O la suscripción marca adhesion_completada
    const completada = (adhesionUsuario?.estado === 'completada') || (suscripcionUsuario?.adhesion_completada === true);
    
    // ✅ Verificamos si ya empezó a pagar la suscripción mensual
    const empezoAPagarSuscripcion = Number(suscripcionUsuario?.monto_total_pagado || 0) > 0;

    if (completada) {
      // Si está en espera Y aún no empezó a pagar cuotas de suscripción
      if (project.estado_proyecto === 'En Espera' && !empezoAPagarSuscripcion) {
        participacion = {
          colorTheme: "info",
          chipLabel: "ADHESIÓN COMPLETA",
          bannerLabel: "Cupo reservado • Esperando inicio",
          icon: EventAvailable
        };
      } else {
        // Si el proyecto ya está "En Proceso" O ya empezó a pagar cuotas
        participacion = {
          colorTheme: "success",
          chipLabel: "SUSCRIPTO",
          bannerLabel: "Participando activamente",
          icon: CheckCircle
        };
      }
    } else {
      if (project.estado_proyecto === 'En proceso') {
        participacion = {
          colorTheme: "warning",
          chipLabel: "EN PROCESO",
          bannerLabel: "Abonando Adhesión + Suscripción",
          icon: PendingActions
        };
      } else {
        participacion = {
          colorTheme: "warning",
          chipLabel: "PAGANDO ADHESIÓN",
          bannerLabel: "Abonando cuotas de ingreso",
          icon: ReceiptLong
        };
      }
    }
  }

  // ✅ BOTÓN DE ACCIÓN
  let buttonText = "Suscribirme";
  let buttonIcon = <ArrowForward />;
  let buttonColor: "primary" | "success" | "warning" | "error" | "info" = "primary";
  let isDisabled = false;

  if (!isAuthenticated) {
    buttonText = "Registrate para ver detalles";
    buttonIcon = <LockOutlined />;
    buttonColor = "warning";
  } else if (participacion) {
    buttonText = "Ver mi Plan";
    buttonIcon = <Visibility />;
    buttonColor = participacion.colorTheme;
  } else if (helpers.estaFinalizado || isLleno) {
    buttonText = "Cupos Agotados";
    buttonIcon = <></>;
    isDisabled = true;
  } else if (isPrelanzamiento) {
    buttonText = "Ver Detalles";
  }

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (onClick) onClick();
  };

  return (
    <Card
      onClick={handleAction}
      sx={{
        height: "100%", display: "flex", flexDirection: "column", cursor: 'pointer', borderRadius: 3, overflow: 'hidden',
        border: `1px solid ${!isAuthenticated ? theme.palette.warning.light : participacion ? alpha(theme.palette[participacion.colorTheme as 'primary'].main, 0.4) : theme.palette.divider}`,
        transition: 'all 0.3s ease',
        "&:hover": { transform: "translateY(-6px)", boxShadow: theme.shadows[10], borderColor: theme.palette[buttonColor].main }
      }}
    >
      <CardHeader
        imagenPrincipal={imagenFinal} badge={helpers.badge} esPack={!!project.pack_de_lotes} estadoConfig={helpers.estadoConfig} nombreProyecto={project.nombre_proyecto}
        tiempoLabel={helpers.tiempoLabel} esUrgente={helpers.esUrgente} tooltipFecha={tooltipFecha}
        isPrelanzamiento={isPrelanzamiento} isLleno={isLleno} participacion={participacion} onImageError={handleImageError}
      />

      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, mb: 1, height: 52, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.nombre_proyecto}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>{project.descripcion}</Typography>
        </Box>

{helpers.esMensual && helpers.progreso && !isPrelanzamiento && (
          <Box sx={{ mb: participacion ? 1.5 : 3, p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              {/* ✅ Cambiamos "CUPO DISPONIBLE" por "CUPOS OCUPADOS" para que el número tenga sentido */}
              <Typography variant="caption" fontWeight={800} color="primary">CUPOS OCUPADOS</Typography>
              <Typography variant="caption" fontWeight={800}>{helpers.progreso.actual} / {helpers.progreso.meta}</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={helpers.progreso.porcentaje} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        )}

        {/* ✅ BANNER DE ESTADO INFERIOR */}
        {participacion && (
          <Box sx={{
            mb: 2, p: 1.2,
            bgcolor: alpha(theme.palette[participacion.colorTheme as 'primary'].main, 0.08),
            border: `1px solid ${alpha(theme.palette[participacion.colorTheme as 'primary'].main, 0.2)}`,
            borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1
          }}>
            <participacion.icon color={participacion.colorTheme} fontSize="small" />
            <Typography variant="body2" fontWeight={800} color={`${participacion.colorTheme}.dark`}>
              {participacion.bannerLabel}
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 'auto' }}>
          <Divider sx={{ mb: 2 }} />

          {!isAuthenticated && (
            <Typography variant="caption" display="block" textAlign="center" sx={{ mb: 1.5, color: 'warning.dark', fontWeight: 700 }}>
              Debes iniciar sesión para ver los detalles
            </Typography>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>{helpers.esMensual ? 'CUOTA INGRESO' : 'INVERSIÓN ÚNICA'}</Typography>
              <Typography variant="h6" color="primary.main" fontWeight={900}>{helpers.precioFormateado}</Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary" fontWeight={700}>PLAZO</Typography>
              <Typography variant="body2" fontWeight={800}>{helpers.plazoTexto}</Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            fullWidth
            color={buttonColor}
            endIcon={buttonIcon}
            onClick={handleAction}
            sx={{
              py: 1.2, fontWeight: 800, borderRadius: 2,
              ...(!isAuthenticated && {
                bgcolor: 'warning.secondary', color: '#000',
                '&:hover': { bgcolor: alpha('#ddb833', 0.8) }
              })
            }}
          >
            {buttonText}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};