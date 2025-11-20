// src/components/common/ProjectCard/ProjectCard.tsx

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
import { useNavigate } from "react-router-dom";
import { LocationOn as LocationIcon } from "@mui/icons-material";
import ImagenService from "../../../../Services/imagen.service";
import type { ProyectoDto } from "../../../../types/dto/proyecto.dto";


interface ProjectCardProps {
  project: ProyectoDto;
  type: "ahorrista" | "inversionista";
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, type }) => {
  const navigate = useNavigate();

  // Lógica de estado visual
  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'En proceso': return { label: 'Activo', color: 'success' as const };
      case 'Finalizado': return { label: 'Finalizado', color: 'default' as const };
      default: return { label: 'Próximamente', color: 'info' as const };
    }
  };

  const statusConfig = getStatusConfig(project.estado_proyecto);

  // Usamos el helper del servicio para la imagen
  const imageUrl = project.imagenes && project.imagenes.length > 0
    ? ImagenService.resolveImageUrl(project.imagenes[0].url)
    : '/assets/placeholder-project.jpg'; // Ruta absoluta a public

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
            // VISTA AHORRISTA (Mensual)
            <Box display="flex" justifyContent="space-between">
              <Box>
                <Typography variant="caption">Cuota Mensual</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                  {project.moneda} {Number(project.monto_inversion).toLocaleString()}
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
            // VISTA INVERSIONISTA (Directo)
            <Box display="flex" justifyContent="space-between">
               <Box>
                <Typography variant="caption">Inversión Total</Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                  {project.moneda} {Number(project.monto_inversion).toLocaleString()}
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
            onClick={() => navigate(`/proyectos/${project.id}`)}
          >
            Ver Detalles
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};