import React from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
} from "@mui/material";
import { LocationOn as LocationIcon } from "@mui/icons-material";
import ImagenService from "../../../../Services/imagen.service";
import type { ProyectoDto } from "../../../../types/dto/proyecto.dto";

export interface ProjectCardProps {
  project: ProyectoDto;
  type: "ahorrista" | "inversionista";
  onClick?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, type, onClick }) => {
  
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
        minimumFractionDigits: 0 
    }).format(amount);
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={imageUrl}
        alt={project.nombre_proyecto}
      />
      
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Chip label={statusConfig.label} color={statusConfig.color} size="small" />
          {project.forma_juridica && (
             <Typography variant="caption" color="text.secondary" display="flex" alignItems="center">
               <LocationIcon sx={{ fontSize: 14, mr: 0.5 }} />
               {project.forma_juridica}
             </Typography>
          )}
        </Box>

        <Typography variant="h6" gutterBottom fontWeight="bold" noWrap>
          {project.nombre_proyecto}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" mb={2} sx={{
           display: '-webkit-box',
           WebkitLineClamp: 2,
           WebkitBoxOrient: 'vertical',
           overflow: 'hidden'
        }}>
          {project.descripcion || 'Sin descripción disponible.'}
        </Typography>

        <Box mt="auto">
          {type === "ahorrista" ? (
            <Box display="flex" justifyContent="space-between">
              <Box>
                <Typography variant="caption">Cuota Mensual</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                  {formatMoney(Number(project.monto_inversion))}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption">Plazo</Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {project.plazo_inversion} meses
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box display="flex" justifyContent="space-between">
               <Box>
                <Typography variant="caption">Inversión Total</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                  {formatMoney(Number(project.monto_inversion))}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption">Lotes</Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {project.lotes?.length || 0} Disp.
                </Typography>
              </Box>
            </Box>
          )}

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={onClick} 
          >
            Ver Detalles
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};