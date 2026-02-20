// src/features/client/pages/Proyectos/components/ProjectCard.tsx

import {
  ArrowForward,
  EventAvailable,
  LocalOffer,
  Timer
} from "@mui/icons-material";
import {
  alpha, Box, Button, Card, CardContent, CardMedia, Chip, Divider,
  LinearProgress, Stack, Tooltip, Typography, useTheme, Zoom
} from "@mui/material";
import React, { useCallback, useRef } from "react";

import type { ProyectoDto } from "@/core/types/dto/proyecto.dto";
import { useProyectoHelpers } from "@/features/client/hooks/useProyectoHelpers";

export interface ProjectCardProps {
  project: ProyectoDto;
  onClick?: () => void;
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
  isPrelanzamiento: boolean; // 🆕 Reemplaza a isEnEspera
  isLleno: boolean;
  onImageError: () => void;
}> = ({
  imagenPrincipal, badge, esPack, estadoConfig,
  nombreProyecto, tiempoLabel, esUrgente, tooltipFecha, isPrelanzamiento, isLleno,
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

        {/* 🧠 LÓGICA VISUAL DE ESTADOS */}
        <Stack spacing={0.5} sx={{ position: 'absolute', top: 12, right: 12 }} alignItems="flex-end">
          {isFinalizado ? (
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

        {tiempoLabel && !isFinalizado && (
          <Tooltip title={tooltipFecha} arrow TransitionComponent={Zoom} placement="top">
            <Chip icon={timeIcon} label={tiempoLabel} size="small" color={timeColor} sx={{ position: 'absolute', bottom: 12, right: 12, fontWeight: 700, boxShadow: 3, ...(esUrgente && { animation: 'pulse-urgency 2s infinite', '@keyframes pulse-urgency': { '0%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.7)' }, '70%': { boxShadow: '0 0 0 6px rgba(211, 47, 47, 0)' }, '100%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)' } } }) }} />
          </Tooltip>
        )}
      </Box>
    );
  };

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const helpers = useProyectoHelpers(project);
  const theme = useTheme();
  const imageState = useRef<{ error: boolean }>({ error: false });
  const handleImageError = useCallback(() => { imageState.current.error = true; }, []);

  // 🧠 LÓGICA DE TIEMPO Y CUPOS
  const hoy = new Date();
  const fechaInicio = new Date(project.fecha_inicio);
  const isPrelanzamiento = fechaInicio > hoy; 
  const isLleno = project.suscripciones_actuales >= (project.obj_suscripciones || 1); 
  
  const imagenFinal = imageState.current.error ? '/assets/placeholder-project.jpg' : helpers.imagenPrincipal;
  const tooltipFecha = isPrelanzamiento ? `Apertura programada: ${helpers.fechas.inicio}` : `Fecha límite: ${helpers.fechas.cierre}`;

  return (
    <Card onClick={onClick} sx={{ height: "100%", display: "flex", flexDirection: "column", cursor: 'pointer', borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}`, transition: 'all 0.3s ease', "&:hover": { transform: "translateY(-6px)", boxShadow: theme.shadows[10], borderColor: theme.palette.primary.main } }}>
      <CardHeader
        imagenPrincipal={imagenFinal} badge={helpers.badge} esPack={!!project.pack_de_lotes} estadoConfig={helpers.estadoConfig} nombreProyecto={project.nombre_proyecto}
        tiempoLabel={helpers.tiempoLabel} esUrgente={helpers.esUrgente} tooltipFecha={tooltipFecha}
        isPrelanzamiento={isPrelanzamiento} isLleno={isLleno} onImageError={handleImageError}
      />

      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, mb: 1, height: 52, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.nombre_proyecto}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>{project.descripcion}</Typography>
        </Box>

        {/* Muestra la barra de progreso solo si NO es prelanzamiento */}
        {helpers.esMensual && helpers.progreso && !isPrelanzamiento && ( 
          <Box sx={{ mb: 3, p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="caption" fontWeight={800} color="primary">CUPO DISPONIBLE</Typography>
              <Typography variant="caption" fontWeight={800}>{helpers.progreso.actual} / {helpers.progreso.meta}</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={helpers.progreso.porcentaje} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        )}

        <Box sx={{ mt: 'auto' }}>
          <Divider sx={{ mb: 2 }} />
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
            variant={helpers.estaFinalizado || isLleno ? "outlined" : "contained"}
            fullWidth endIcon={!helpers.estaFinalizado && !isLleno && !isPrelanzamiento && <ArrowForward />}
            sx={{ py: 1.2, fontWeight: 800, borderRadius: 2, boxShadow: helpers.estaFinalizado || isLleno ? 'none' : 3 }}
          >
            {helpers.estaFinalizado || isLleno ? 'CUPOS AGOTADOS' : (isPrelanzamiento ? 'Ver Detalles' : 'Suscribirme')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};