// src/components/common/ProjectCard/ProjectCard.tsx
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
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { LocationOn as LocationIcon, Favorite, FavoriteBorder } from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { isFavorito, toggleFavorito } from "../../../Services/favorito.service";
import type { EstadoProyecto, ProyectoDTO } from "../../../types/dto/proyecto.dto";


const API_PUBLIC_URL = import.meta.env.VITE_API_PUBLIC_URL || "http://localhost:3001";

interface ProjectCardProps {
  project: ProyectoDTO;
  type: "ahorrista" | "inversionista";
}

const statusMap: Record<EstadoProyecto, "active" | "completed" | "upcoming"> = {
  "En Espera": "upcoming",
  "En proceso": "active",
  "Finalizado": "completed",
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, type }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const projectStatus = statusMap[project.estado_proyecto as EstadoProyecto] || "upcoming";

  const imageUrl = project.imagenes?.[0]?.url
    ? `${API_PUBLIC_URL}${project.imagenes[0].url}`
    : "/images/placeholder.jpg";

  const statusColors: Record<"active" | "completed" | "upcoming", "success" | "default" | "info"> = {
    active: "success",
    completed: "default",
    upcoming: "info",
  };

  const statusLabels: Record<"active" | "completed" | "upcoming", string> = {
    active: "Activo",
    completed: "Finalizado",
    upcoming: "Próximamente",
  };

  const { data: favoritoData } = useQuery({
    queryKey: ["isFavorito", project.id],
    queryFn: () => isFavorito(project.id),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const isProjectFavorito = favoritoData?.esFavorito || false;

  const toggleFavoritoMutation = useMutation({
    mutationFn: (projectId: number) => toggleFavorito(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isFavorito", project.id] });
      queryClient.invalidateQueries({ queryKey: ["misFavoritos"] });
    },
    onError: (error: Error) => {
      console.error("Error al marcar favorito:", error);
      alert(`Error: ${error.message}`);
    },
  });

  const handleToggleFavorito = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    toggleFavoritoMutation.mutate(project.id);
  };

  return (
    <Card
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: 4,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        overflow: "hidden",
        transition: "all 0.3s ease",
        backgroundColor: "#fff",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        },
      }}
    >
      {/* --- Botón de Favorito --- */}
      {isAuthenticated && (
        <IconButton
          onClick={handleToggleFavorito}
          disabled={toggleFavoritoMutation.isPending}
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 1)" },
            zIndex: 2,
          }}
        >
          {isProjectFavorito ? (
            <Favorite fontSize="small" color="error" />
          ) : (
            <FavoriteBorder fontSize="small" sx={{ color: "text.secondary" }} />
          )}
        </IconButton>
      )}

      <CardMedia
        component="img"
        height="200"
        image={imageUrl}
        alt={project.nombre_proyecto}
        sx={{
          objectFit: "cover",
          filter: "brightness(0.96)",
        }}
      />

      <CardContent
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          p: 2.5,
        }}
      >
        {/* Estado + Ubicación */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Chip
            label={statusLabels[projectStatus]}
            color={statusColors[projectStatus]}
            size="small"
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              textTransform: "capitalize",
            }}
          />
          <Box display="flex" alignItems="center" gap={0.5}>
            <LocationIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {project.forma_juridica || "Ubicación pendiente"}
            </Typography>
          </Box>
        </Box>

        {/* Título */}
        <Typography
          variant="h6"
          fontWeight={700}
          noWrap
          sx={{ mb: 1, color: "text.primary" }}
        >
          {project.nombre_proyecto}
        </Typography>

        {/* Descripción */}
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
          {project.descripcion || "Sin descripción"}
        </Typography>

        {/* Datos financieros */}
        <Box mt="auto">
          {type === "ahorrista" ? (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Cuota mensual
                </Typography>
                <Typography variant="h6" color="primary" fontWeight={700}>
                  {project.moneda || "$"} {project.monto_inversion?.toLocaleString() ?? "N/A"}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary">
                  Plazo
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {project.plazo_inversion ?? "N/A"} meses
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Inversión mín.
                </Typography>
                <Typography variant="h6" color="primary" fontWeight={700}>
                  {project.moneda || "USD"} {project.monto_inversion?.toLocaleString() ?? "N/A"}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary">
                  Rentabilidad
                </Typography>
                <Typography variant="h6" color="success.main" fontWeight={700}>
                  N/A %
                </Typography>
              </Box>
            </Box>
          )}

          {/* Botón */}
          <Button
            variant="contained"
            fullWidth
            sx={{
              mt: 2.5,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
            }}
            onClick={() => navigate(`/proyectos/${project.id}`)}
          >
            Ver detalles
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
