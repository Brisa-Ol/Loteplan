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
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { LocationOn as LocationIcon } from "@mui/icons-material";
import type { EstadoProyecto, ProyectoDto } from "../../../types/dto/proyecto.dto";
import ImagenService from "../../../Services/imagen.service";

// Importaciones de arquitectura

interface ProjectCardProps {
  project: ProyectoDto;
  type: "ahorrista" | "inversionista";
}

const statusMap: Record<EstadoProyecto, "active" | "completed" | "upcoming"> = {
  "En Espera": "upcoming",
  "En proceso": "active",
  "Finalizado": "completed",
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, type }) => {
  const navigate = useNavigate();

  const projectStatus = statusMap[project.estado_proyecto] || "upcoming";

  // ✅ Usamos el servicio centralizado para la URL de la imagen
  const imageUrl = project.imagenes && project.imagenes.length > 0
    ? ImagenService.resolveImageUrl(project.imagenes[0].url)
    : "/assets/placeholder-project.jpg"; // Asegúrate de tener esta imagen en public/assets

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
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3, // Bordes redondeados modernos
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
        transition: "all 0.3s ease",
        backgroundColor: "#fff",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
        },
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={imageUrl}
        alt={project.nombre_proyecto}
        sx={{
          objectFit: "cover",
        }}
      />

      <CardContent
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          p: 3,
        }}
      >
        {/* --- Estado + Ubicación --- */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Chip
            label={statusLabels[projectStatus]}
            color={statusColors[projectStatus]}
            size="small"
            sx={{ fontWeight: 600, borderRadius: 1 }}
          />
          <Box display="flex" alignItems="center" gap={0.5}>
            <LocationIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary" noWrap maxWidth={120}>
              {project.forma_juridica || "Ubicación N/A"}
            </Typography>
          </Box>
        </Box>

        {/* --- Título --- */}
        <Typography
          variant="h6"
          fontWeight={700}
          noWrap
          gutterBottom
          title={project.nombre_proyecto} // Tooltip nativo por si se corta
        >
          {project.nombre_proyecto}
        </Typography>

        {/* --- Descripción --- */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 40, // Altura fija para alinear tarjetas
          }}
        >
          {project.descripcion || "Sin descripción disponible para este proyecto."}
        </Typography>

        {/* --- Datos Financieros (Abajo) --- */}
        <Box mt="auto">
          {type === "ahorrista" ? (
            // VISTA AHORRISTA
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Cuota Mensual
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight={700}>
                  {project.moneda || "$"} {Number(project.monto_inversion).toLocaleString()}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block">
                  Plazo
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {project.plazo_inversion ?? "N/A"} meses
                </Typography>
              </Box>
            </Stack>
          ) : (
            // VISTA INVERSIONISTA
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Inversión Total
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight={700}>
                  {project.moneda || "USD"} {Number(project.monto_inversion).toLocaleString()}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block">
                  Lotes Disp.
                </Typography>
                <Typography variant="body1" fontWeight={600} color="success.main">
                  {project.lotes ? project.lotes.length : 0}
                </Typography>
              </Box>
            </Stack>
          )}

          {/* --- Botón --- */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 3, borderRadius: 2, fontWeight: 'bold' }}
            onClick={() => navigate(`/proyectos/${project.id}`)}
          >
            Ver Detalles
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};