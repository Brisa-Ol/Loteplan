import React, { useState } from "react";
import {
  Card, CardMedia, CardContent, Typography, Chip, Box, Button,
  useTheme, alpha, Divider, Stack, LinearProgress
} from "@mui/material";
import {
  ArrowForward, CalendarMonth, GppGood, Group, 
  AccessTime, LocalOffer, Map, BusinessCenter, BrokenImage
} from "@mui/icons-material";
import type { ProyectoDto } from "@/core/types/dto/proyecto.dto";
import { useProyectoHelpers } from "@/features/client/hooks/useProyectoHelpers";

// ==========================================
// SUBCOMPONENTES VISUALES
// ==========================================

const CardHeader: React.FC<{ 
  imagenPrincipal: string; 
  badge: any; 
  esPack: boolean;
  estadoConfig: { label: string; color: string };
  diasRestantes: number;
  esUrgente: boolean;
  nombreProyecto: string;
  onImageError: () => void;
}> = ({ imagenPrincipal, badge, esPack, estadoConfig, diasRestantes, esUrgente, nombreProyecto, onImageError }) => {
  const theme = useTheme();
  const BadgeIcon = badge.icon;
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Box sx={{ position: 'relative', height: 200, overflow: 'hidden', bgcolor: 'grey.100' }}>
      {/* ✅ MEJORA 1: Lazy loading de imágenes */}
      <CardMedia 
        component="img" 
        height="100%" 
        image={imagenPrincipal} 
        alt={nombreProyecto}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        onError={onImageError}
        sx={{ 
          objectFit: 'cover', 
          transition: 'all 0.5s ease',
          opacity: imageLoaded ? 1 : 0,
          '&:hover': { transform: 'scale(1.05)' }
        }} 
      />

      {/* ✅ MEJORA 2: Placeholder mientras carga */}
      {!imageLoaded && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.200'
          }}
        >
          <BrokenImage sx={{ fontSize: 48, color: 'grey.400' }} />
        </Box>
      )}
      
      {/* Gradiente superior para legibilidad */}
      <Box sx={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 40%)',
        pointerEvents: 'none' 
      }} />
      
      {/* Badge tipo inversión (Izquierda) */}
      <Chip 
        icon={<BadgeIcon sx={{ fontSize: '16px !important', color: 'inherit' }} />}
        label={badge.label}
        size="small"
        color="primary"
        sx={{ 
          position: 'absolute', top: 12, left: 12,
          boxShadow: 2, fontSize: '0.75rem'
        }}
      />
      
      {/* Stack Superior Derecho: Estado + Pack */}
      <Stack 
        direction="column" 
        spacing={0.5} 
        alignItems="flex-end"
        sx={{ position: 'absolute', top: 12, right: 12 }}
      >
        {/* Badge de Estado */}
        <Chip 
          label={estadoConfig.label}
          color={estadoConfig.color as any} 
          size="small"
          sx={{ 
            color: 'white', 
            boxShadow: 2,
            fontSize: '0.75rem',
            ...(estadoConfig.color === 'default' && {
               bgcolor: alpha(theme.palette.common.black, 0.6),
               backdropFilter: 'blur(4px)'
            })
          }}
        />

        {/* Badge Pack */}
        {esPack && (
          <Chip 
            icon={<LocalOffer sx={{ fontSize: '16px !important' }}/>}
            label="PACK"
            color="warning"
            size="small"
            sx={{ boxShadow: 2 }}
          />
        )}
      </Stack>
      
      {/* Badge Urgencia */}
      {esUrgente && (
        <Chip 
          icon={<AccessTime sx={{ fontSize: '16px !important' }}/>}
          label={`${diasRestantes} días`}
          size="small"
          sx={{ 
            position: 'absolute', bottom: 12, right: 12,
            bgcolor: 'rgba(0,0,0,0.7)', 
            color: 'white',
            backdropFilter: 'blur(4px)',
            border: 'none'
          }}
        />
      )}
    </Box>
  );
};

const CardInfo: React.FC<{ 
  nombreProyecto: string;
  descripcion: string;
  esMensual: boolean;
  progreso: any;
  formaJuridica?: string;
  tieneUbicacion: boolean;
  cantidadLotes: number;
}> = ({ nombreProyecto, descripcion, esMensual, progreso, formaJuridica, tieneUbicacion, cantidadLotes }) => {
  const theme = useTheme();

  return (
    <Box>
      <Typography 
        variant="h6" 
        gutterBottom 
        fontWeight={700} 
        sx={{ 
          lineHeight: 1.2, height: 48, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
        }}
      >
        {nombreProyecto}
      </Typography>
      
      <Typography 
        variant="body2" 
        color="text.secondary" 
        mb={2}
        sx={{ 
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          minHeight: 40
        }}
      >
        {descripcion || 'Oportunidad de inversión disponible.'}
      </Typography>
      
      {/* Progreso para planes mensuales */}
      {esMensual && progreso && (
        <Box sx={{ 
          mb: 2, p: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderRadius: 2
        }}>
          <Stack direction="row" justifyContent="space-between" mb={0.5} alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Group fontSize="small" color="primary" sx={{ fontSize: 16 }} />
              <Typography variant="caption" fontWeight={700} color="primary.dark">
                Cupos
              </Typography>
            </Stack>
            <Typography variant="caption" fontWeight={700} color="primary.main">
              {progreso.actual} / {progreso.meta}
            </Typography>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={progreso.porcentaje}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      )}
      
      {/* Info para inversión directa */}
      {!esMensual && (
        <Stack direction="row" spacing={1} mb={3}>
          {tieneUbicacion && (
            <Chip 
              label="Mapa"
              size="small"
              icon={<Map fontSize="small"/>}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: 'primary.dark',
                border: 'none'
              }}
            />
          )}
          <Chip 
            label={cantidadLotes > 0 ? `${cantidadLotes} Disp.` : "Consultar"}
            size="small"
            variant="outlined"
            color="primary"
            icon={<BusinessCenter fontSize="small"/>}
          />
        </Stack>
      )}
      
      {/* Forma jurídica */}
      {formaJuridica && (
        <Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
          <GppGood color="success" sx={{ fontSize: 16 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {formaJuridica}
          </Typography>
        </Stack>
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
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
            {esMensual ? 'Valor de Suscripción' : 'Valor de Inversión'}
          </Typography>
          <Typography 
            variant="h6" 
            color="primary.main" 
            fontWeight={700}
            sx={{ letterSpacing: -0.5 }}
          >
            {precioFormateado}
          </Typography>
        </Box>
        
        <Box textAlign="right">
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
            Modalidad
          </Typography>
          <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5}>
            {esMensual && <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary' }} />}
            <Typography variant="body2" fontWeight={600}>
              {plazoTexto}
            </Typography>
          </Stack>
        </Box>
      </Stack>
      
      <Button 
        variant="contained"
        fullWidth
        disableElevation
        disabled={estaFinalizado}
        endIcon={!estaFinalizado && <ArrowForward />}
        onClick={onClick}
        sx={{ mt: 2 }}
      >
        {estaFinalizado 
          ? 'Convocatoria Finalizada' 
          : (esMensual ? 'Suscribirme al Plan' : 'Ver Disponibilidad')
        }
      </Button>
    </Box>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export interface ProjectCardProps {
  project: ProyectoDto;
  onClick?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const theme = useTheme();
  const helpers = useProyectoHelpers(project);
  
  // ✅ MEJORA 3: Estado para manejar error de imagen
  const [imageError, setImageError] = useState(false);

  // ✅ MEJORA 4: Handler para error de imagen
  const handleImageError = () => {
    setImageError(true);
  };

  // Si hay error, usar placeholder
  const imagenFinal = imageError ? '/assets/placeholder-project.jpg' : helpers.imagenPrincipal;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex", 
        flexDirection: "column",
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease',
        "&:hover": {
          transform: "translateY(-4px)",
          borderColor: theme.palette.primary.main,
          boxShadow: theme.shadows[8]
        },
      }}
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
      />
      
      <CardContent sx={{ 
        flexGrow: 1, 
        display: "flex", 
        flexDirection: "column", 
        p: 3 
      }}>
        <CardInfo 
          nombreProyecto={project.nombre_proyecto}
          descripcion={project.descripcion}
          esMensual={helpers.esMensual}
          progreso={helpers.progreso}
          formaJuridica={project.forma_juridica}
          tieneUbicacion={!!(project.latitud && project.longitud)}
          cantidadLotes={helpers.cantidadLotes}
        />
        
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