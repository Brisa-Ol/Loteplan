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
  CardActionArea, // Importamos esto para hacer clickeable la imagen
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { LocationOn as LocationIcon } from "@mui/icons-material";
import type { EstadoProyecto, ProyectoDto } from "../../../types/dto/proyecto.dto";
import ImagenService from "../../../services/imagen.service";

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

  const imageUrl = project.imagenes && project.imagenes.length > 0
    ? ImagenService.resolveImageUrl(project.imagenes[0].url)
    : "/assets/placeholder-project.jpg";

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

  // ✅ Helper para formatear moneda profesionalmente
  const formatCurrency = (amount: number | string) => {
    if (!amount) return "$ 0";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: project.moneda || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const handleNavigate = () => navigate(`/proyectos/${project.id}`);

  return (
    <Card
      elevation={0} // Quitamos elevación base para usar borde
      sx={{
        width: "100%",
        height: "100%", // Ocupa toda la altura de la celda del grid
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.3s ease",
        backgroundColor: "#fff",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: (theme) => theme.shadows[8],
          borderColor: "primary.main", // Borde de color al hacer hover
        },
      }}
    >
      {/* Hacemos la imagen clickeable */}
      <CardActionArea onClick={handleNavigate}>
        <CardMedia
          component="img"
          height="200"
          image={imageUrl}
          alt={project.nombre_proyecto}
          sx={{ objectFit: "cover" }}
        />
        
        {/* Chip de estado flotante sobre la imagen (Estilo moderno) */}
        <Box position="absolute" top={12} right={12}>
             <Chip
                label={statusLabels[projectStatus]}
                color={statusColors[projectStatus]}
                size="small"
                sx={{ fontWeight: 700, boxShadow: 1 }}
              />
        </Box>
      </CardActionArea>

      <CardContent
        sx={{
          flexGrow: 1, // Esto empuja el contenido para llenar el espacio
          display: "flex",
          flexDirection: "column",
          p: { xs: 2, md: 3 }, // Padding responsive
        }}
      >
        {/* --- Ubicación --- */}
        <Box display="flex" alignItems="center" gap={0.5} mb={1}>
          <LocationIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary" noWrap>
            {project.forma_juridica || "Ubicación N/A"}
          </Typography>
        </Box>

        {/* --- Título (Line Clamp 2 líneas) --- */}
        <Typography
          variant="h6"
          fontWeight={800}
          gutterBottom
          title={project.nombre_proyecto}
          sx={{
            fontSize: { xs: "1rem", md: "1.15rem" }, // Fuente responsive
            display: "-webkit-box",
            WebkitLineClamp: 2, // Permite 2 líneas antes de cortar
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.3,
            minHeight: "2.6em", // Altura mínima para alinear tarjetas con títulos cortos
          }}
        >
          {project.nombre_proyecto}
        </Typography>

        {/* --- Descripción --- */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {project.descripcion || "Sin descripción disponible."}
        </Typography>

        {/* Espaciador para empujar datos financieros al fondo */}
        <Box flexGrow={1} />

        {/* --- Datos Financieros --- */}
        <Box 
            mt={2} 
            pt={2} 
            borderTop="1px dashed" 
            borderColor="divider"
        >
          {type === "ahorrista" ? (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                  CUOTA MENSUAL
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight={800} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  {formatCurrency(project.monto_inversion)}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block">
                  Plazo
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {project.plazo_inversion ?? "N/A"} meses
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                  INVERSIÓN TOTAL
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight={800} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  {formatCurrency(project.monto_inversion)}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block">
                  Disponibles
                </Typography>
                <Typography variant="body2" fontWeight={700} color="success.main">
                  {project.lotes ? project.lotes.length : 0} Lotes
                </Typography>
              </Box>
            </Stack>
          )}

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2, borderRadius: 2, fontWeight: "bold", textTransform: 'none' }}
            onClick={handleNavigate}
          >
            Ver Detalles
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};