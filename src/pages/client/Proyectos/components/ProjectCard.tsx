import React from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  useTheme,
  alpha,
  Divider,
  Stack
} from "@mui/material";
import { 
    LocationOn as LocationIcon, 
    ArrowForward, 
    CalendarMonth, 
    MonetizationOn, 
    MapsHomeWork
} from "@mui/icons-material";
import ImagenService from "../../../../Services/imagen.service";
import type { ProyectoDto } from "../../../../types/dto/proyecto.dto";

export interface ProjectCardProps {
  project: ProyectoDto;
  type: "ahorrista" | "inversionista";
  onClick?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, type, onClick }) => {
  const theme = useTheme();

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'En proceso': return { label: 'Activo', color: 'success' as const };
      case 'Finalizado': return { label: 'Finalizado', color: 'default' as const };
      default: return { label: 'Próximamente', color: 'info' as const };
    }
  };

  const statusConfig = getStatusConfig(project.estado_proyecto);

  const imageUrl = project.imagenes && project.imagenes.length > 0
    ? ImagenService.resolveImageUrl(project.imagenes[0].url)
    : '/assets/placeholder-project.jpg'; 

  // Formateador de moneda consistente
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { 
        style: 'currency', 
        currency: project.moneda === 'USD' ? 'USD' : 'ARS', 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": { 
            transform: "translateY(-4px)", 
            boxShadow: theme.shadows[8],
            borderColor: theme.palette.primary.main
        },
      }}
    >
      {/* Imagen Header */}
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <CardMedia
            component="img"
            height="100%"
            image={imageUrl}
            alt={project.nombre_proyecto}
            sx={{ objectFit: 'cover' }}
        />
        
        {/* Overlay Gradiente */}
        <Box sx={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 60%)',
            pointerEvents: 'none'
        }} />

        {/* Badge de Estado */}
        <Chip 
            label={statusConfig.label} 
            color={statusConfig.color} 
            size="small" 
            variant="filled" // Para mejor contraste sobre imagen
            sx={{ 
                position: 'absolute', top: 12, right: 12, 
                fontWeight: 700, boxShadow: 2, height: 24 
            }} 
        />
      </Box>
      
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 2.5 }}>
        
        {/* Ubicación / Tipo */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Chip 
                label={type === "ahorrista" ? "Plan Ahorro" : "Inversión"} 
                size="small" 
                variant="outlined"
                sx={{ 
                    borderRadius: 1, height: 20, fontSize: '0.65rem', fontWeight: 700,
                    borderColor: theme.palette.primary.main, color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                }}
            />
            {project.forma_juridica && (
                <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                    <LocationIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption" noWrap sx={{ maxWidth: 120 }}>
                        {project.forma_juridica}
                    </Typography>
                </Stack>
            )}
        </Stack>

        {/* Título */}
        <Typography variant="h6" gutterBottom fontWeight={700} noWrap title={project.nombre_proyecto} sx={{ mb: 1 }}>
          {project.nombre_proyecto}
        </Typography>
        
        {/* Descripción corta */}
        <Typography variant="body2" color="text.secondary" mb={2} sx={{
           display: '-webkit-box',
           WebkitLineClamp: 2,
           WebkitBoxOrient: 'vertical',
           overflow: 'hidden',
           minHeight: 40, // Altura fija para alineación
           fontSize: '0.875rem',
           lineHeight: 1.5
        }}>
          {project.descripcion || 'Sin descripción disponible.'}
        </Typography>

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        {/* Datos Financieros */}
        <Box mt="auto">
          {type === "ahorrista" ? (
            <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Valor de Cuota
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" color="primary.main">
                    <MonetizationOn sx={{ fontSize: 18 }} />
                    <Typography variant="subtitle1" fontWeight={800}>
                        {formatMoney(Number(project.monto_inversion))}
                    </Typography>
                </Stack>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Plazo
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                    <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                        {project.plazo_inversion} meses
                    </Typography>
                </Stack>
              </Box>
            </Stack>
          ) : (
            <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
               <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Inversión Total
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" color="primary.main">
                    <MonetizationOn sx={{ fontSize: 18 }} />
                    <Typography variant="subtitle1" fontWeight={800}>
                        {formatMoney(Number(project.monto_inversion))}
                    </Typography>
                </Stack>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Disponibilidad
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                    <MapsHomeWork sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                        {project.lotes?.length || 0} Lotes
                    </Typography>
                </Stack>
              </Box>
            </Stack>
          )}

          <Button
            variant="contained"
            fullWidth
            disableElevation
            endIcon={<ArrowForward />}
            sx={{ 
                mt: 3, 
                fontWeight: 700, 
                borderRadius: 2, 
                textTransform: 'none',
                py: 1.2
            }}
            onClick={onClick} 
          >
            Ver Detalles
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};