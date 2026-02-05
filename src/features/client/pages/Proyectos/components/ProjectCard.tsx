import React, { useRef, useCallback } from "react";
import {
  Card, CardMedia, CardContent, Typography, Chip, Box, Button,
  useTheme, alpha, Divider, Stack, LinearProgress
} from "@mui/material";
import {
  ArrowForward, CalendarMonth, GppGood, Group, 
  AccessTime, LocalOffer, Map, BusinessCenter, BrokenImage
} from "@mui/icons-material";

// Tipos y Hooks
import type { ProyectoDto } from "@/core/types/dto/proyecto.dto";
import { useProyectoHelpers } from "@/features/client/hooks/useProyectoHelpers";

export interface ProjectCardProps {
  project: ProyectoDto;
  onClick?: () => void;
}

// --- SUBCOMPONENTES VISUALES ---
const CardHeader: React.FC<{ 
  imagenPrincipal: string; 
  badge: any; 
  esPack: boolean;
  estadoConfig: { label: string; color: string };
  diasRestantes: number;
  esUrgente: boolean;
  nombreProyecto: string;
  onImageError: () => void;
  onImageLoad: () => void;
}> = ({ imagenPrincipal, badge, esPack, estadoConfig, diasRestantes, esUrgente, nombreProyecto, onImageError, onImageLoad }) => {
  const theme = useTheme();
  const BadgeIcon = badge.icon;
  const imageState = useRef<{ loaded: boolean }>({ loaded: false });

  return (
    <Box sx={{ position: 'relative', height: 200, overflow: 'hidden', bgcolor: 'grey.100' }}>
      <CardMedia 
        component="img" 
        height="100%" 
        image={imagenPrincipal} 
        alt={nombreProyecto}
        loading="lazy"
        onLoad={() => { imageState.current.loaded = true; onImageLoad(); }}
        onError={onImageError}
        sx={{ objectFit: 'cover', transition: 'all 0.5s ease', '&:hover': { transform: 'scale(1.05)' } }} 
      />
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 40%)', pointerEvents: 'none' }} />
      <Chip icon={<BadgeIcon sx={{ fontSize: '16px !important', color: 'inherit' }} />} label={badge.label} size="small" color="primary" sx={{ position: 'absolute', top: 12, left: 12, boxShadow: 2 }} />
      <Stack direction="column" spacing={0.5} alignItems="flex-end" sx={{ position: 'absolute', top: 12, right: 12 }}>
        <Chip label={estadoConfig.label} color={estadoConfig.color as any} size="small" sx={{ color: 'white', boxShadow: 2 }} />
        {esPack && <Chip icon={<LocalOffer sx={{ fontSize: '16px !important' }}/>} label="PACK" color="warning" size="small" sx={{ boxShadow: 2 }} />}
      </Stack>
      {esUrgente && <Chip icon={<AccessTime sx={{ fontSize: '16px !important' }}/>} label={`${diasRestantes} días`} size="small" sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', backdropFilter: 'blur(4px)' }} />}
    </Box>
  );
};

const CardInfo: React.FC<{ 
  nombreProyecto: string;
  descripcion: string;
  esMensual: boolean;
  progreso: any;
}> = ({ nombreProyecto, descripcion, esMensual, progreso }) => {
  const theme = useTheme();
  return (
    <Box>
      <Typography variant="h6" gutterBottom fontWeight={700} sx={{ lineHeight: 1.2, height: 48, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{nombreProyecto}</Typography>
      <Typography variant="body2" color="text.secondary" mb={2} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>{descripcion}</Typography>
      {esMensual && progreso && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" fontWeight={700}>Cupos</Typography>
            <Typography variant="caption" fontWeight={700}>{progreso.actual} / {progreso.meta}</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={progreso.porcentaje} sx={{ height: 6, borderRadius: 3 }} />
        </Box>
      )}
    </Box>
  );
};

const CardFinancials: React.FC<{ 
  esMensual: boolean;
  precioFormateado: string;
  plazoTexto: string;
  estaFinalizado: boolean;
  onClick?: () => void;
}> = ({ esMensual, precioFormateado, plazoTexto, estaFinalizado, onClick }) => {
  return (
    <Box mt="auto">
      <Divider sx={{ mb: 2 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{esMensual ? 'Cuota Mensual' : 'Inversión Total'}</Typography>
          <Typography variant="h6" color="primary.main" fontWeight={700}>{precioFormateado}</Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Plazo</Typography>
          <Typography variant="body2" fontWeight={600}>{plazoTexto}</Typography>
        </Box>
      </Stack>
      
      {/* ✅ CORRECCIÓN: El botón ahora solo navega al detalle, NO intenta abrir checkout */}
      <Button 
        variant="contained"
        fullWidth
        disabled={estaFinalizado}
        endIcon={!estaFinalizado && <ArrowForward />}
        onClick={(e) => { 
          e.stopPropagation(); // Evita que se dispare el onClick del Card
          onClick?.(); // Navega al detalle del proyecto
        }}
        sx={{ mt: 2, fontWeight: 700 }}
      >
        {estaFinalizado 
          ? 'Finalizado' 
          : (esMensual ? 'Ver Plan Mensual' : 'Ver Disponibilidad')}
      </Button>
    </Box>
  );
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const helpers = useProyectoHelpers(project);
  const imageState = useRef<{ error: boolean }>({ error: false });
  const handleImageError = useCallback(() => { imageState.current.error = true; }, []);
  const imagenFinal = imageState.current.error ? '/assets/placeholder-project.jpg' : helpers.imagenPrincipal;

  return (
    <Card 
      sx={{ 
        height: "100%", display: "flex", flexDirection: "column", 
        cursor: 'pointer', transition: 'all 0.3s ease',
        "&:hover": { transform: "translateY(-4px)", boxShadow: 8 } 
      }} 
      onClick={onClick}
    >
      <CardHeader 
        imagenPrincipal={imagenFinal} 
        badge={helpers.badge} 
        esPack={!!project.pack_de_lotes} 
        estadoConfig={helpers.estadoConfig} 
        diasRestantes={helpers.diasRestantes} 
        esUrgente={helpers.esUrgente && project.estado_proyecto === 'En proceso'} 
        nombreProyecto={project.nombre_proyecto} 
        onImageError={handleImageError} 
        onImageLoad={() => {}} 
      />
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 3 }}>
        <CardInfo 
          nombreProyecto={project.nombre_proyecto} 
          descripcion={project.descripcion} 
          esMensual={helpers.esMensual} 
          progreso={helpers.progreso} 
        />
        {/* ✅ CORRECCIÓN: Ahora el botón recibe el mismo onClick que navega al detalle */}
        <CardFinancials 
          esMensual={helpers.esMensual} 
          precioFormateado={helpers.precioFormateado} 
          plazoTexto={helpers.plazoTexto} 
          estaFinalizado={helpers.estaFinalizado} 
          onClick={onClick} 
        />
      </CardContent>
    </Card>
  );
};