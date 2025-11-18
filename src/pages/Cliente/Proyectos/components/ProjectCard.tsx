// src/components/common/ProjectCard/ProjectCard.tsx - VERSIÓN CORRECTA (Usa ProyectoDTO)
// ═══════════════════════════════════════════════════════════
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
// --- 1. Importar DTO y EstadoProyecto ---
import type { ProyectoDTO, EstadoProyecto } from "../../../../types/dto/proyecto.dto"; // Verifica la ruta!


// --- 1. Lee la variable de entorno de la URL pública del backend ---
const API_PUBLIC_URL = import.meta.env.VITE_API_PUBLIC_URL || 'http://localhost:3000';
// --- 3. Definir ProjectCardProps usando SOLO ProyectoDTO ---
interface ProjectCardProps {
  project: ProyectoDTO; // 👈 Prop 'project' es de tipo ProyectoDTO
  type: "ahorrista" | "inversionista";
}

// Mapeo de EstadoProyecto (backend) a Status (frontend)
const statusMap: Record<EstadoProyecto, "active" | "completed" | "upcoming"> = {
  "En Espera": "upcoming",
  "En proceso": "active",
  "Finalizado": "completed",
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, type }) => {
  const navigate = useNavigate();

  // Usa los campos directamente de 'project' (que es ProyectoDTO)
  const projectStatus = statusMap[project.estado_proyecto] || "upcoming";
  const imageUrl = project.imagenes?.[0]?.url
    // project.imagenes[0].url es "imagenes/mi-foto.jpg" (de la BD)
    // API_PUBLIC_URL es "http://localhost:3001"
    // Tu app.js sirve la carpeta 'uploads'
    // Resultado: "http://localhost:3001/uploads/imagenes/mi-foto.jpg"
    ? `${API_PUBLIC_URL}${project.imagenes[0].url.replace(/\\/g, '/')}` // Reemplaza \ por / si acaso
    : '/images/placeholder.jpg'; // Fallback

  const statusColors = {
    active: "success",
    completed: "default",
    upcoming: "info",
  } as const;

  const statusLabels = {
    active: "Activo",
    completed: "Finalizado",
    upcoming: "Próximamente",
  };

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: 380,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
        },
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={imageUrl}
        alt={project.nombre_proyecto} // Usa campo del DTO
      />
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Chip
            label={statusLabels[projectStatus]}
            color={statusColors[projectStatus]}
            size="small"
          />
          <Box display="flex" alignItems="center" gap={0.5}>
            <LocationIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {project.forma_juridica || "Ubicación pendiente"} {/* Usa campo del DTO */}
            </Typography>
          </Box>
        </Box>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          {project.nombre_proyecto} {/* Usa campo del DTO */}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2} noWrap>
          {project.descripcion || 'Sin descripción'} {/* Usa campo del DTO */}
        </Typography>
        <Box mt="auto" pt={2}>
          {type === "ahorrista" ? (
            <Box display="flex" justifyContent="space-between" alignItems="baseline">
              <Box>
                <Typography variant="caption" color="text.secondary">Cuota mensual</Typography>
                <Typography variant="h6" color="primary.main" fontWeight={700}>
                  {project.moneda || '$'} {project.monto_inversion?.toLocaleString() ?? 'N/A'}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary">Plazo</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {project.plazo_inversion ?? 'N/A'} meses
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box display="flex" justifyContent="space-between" alignItems="baseline">
              <Box>
                <Typography variant="caption" color="text.secondary">Inversión mín.</Typography>
                <Typography variant="h6" color="primary.main" fontWeight={700}>
                  {project.moneda || 'USD'} {project.monto_inversion?.toLocaleString() ?? 'N/A'}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary">Rentabilidad</Typography>
                <Typography variant="h6" color="success.main" fontWeight={700}>
                   N/A % {/* Necesitarías añadir 'rentabilidad' al DTO */}
                </Typography>
              </Box>
            </Box>
          )}
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => navigate(`/proyectos/${project.id}`)} // Usa ID del DTO
          >
            Ver detalles
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
