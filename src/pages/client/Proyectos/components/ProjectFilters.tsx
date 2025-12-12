// Filtros de proyectos - CORREGIDO
// ═══════════════════════════════════════════════════════════
import React, { useState } from "react";
import { Box, TextField, MenuItem, Button, Stack } from "@mui/material";
import { FilterList as FilterIcon } from "@mui/icons-material";

interface ProjectFiltersProps {
  onFilter: (filters: any) => void;
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({ onFilter }) => {
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");

  const handleApplyFilters = () => {
    onFilter({ location, status });
  };

  const handleClearFilters = () => {
    setLocation("");
    setStatus("");
    onFilter({});
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        mb: 4,
        width: "100%",
      }}
    >
      <Box
        sx={{
          bgcolor: "background.paper",
          p: 3,
          borderRadius: 2,
          boxShadow: 1,
          maxWidth: 900,
          width: "100%",
        }}
      >
        <Stack 
          direction={{ xs: "column", md: "row" }} 
          spacing={2} 
          alignItems="center"
        >
          {/* Filtro por ubicación */}
          <TextField
            select
            label="Ubicación"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
            sx={{ maxWidth: { md: 250 } }}
          >
            <MenuItem value="">Todas las ubicaciones</MenuItem>
            <MenuItem value="lujan">Luján de Cuyo</MenuItem>
            <MenuItem value="lasheras">Las Heras</MenuItem>
            <MenuItem value="mendoza">Gran Mendoza</MenuItem>
          </TextField>

          {/* Filtro por estado */}
          <TextField
            select
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            fullWidth
            sx={{ maxWidth: { md: 200 } }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="active">Activo</MenuItem>
            <MenuItem value="upcoming">Próximamente</MenuItem>
            <MenuItem value="completed">Completado</MenuItem>
          </TextField>

          {/* Botones */}
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<FilterIcon />}
              onClick={handleApplyFilters}
            >
              Filtrar
            </Button>
            <Button variant="outlined" onClick={handleClearFilters}>
              Limpiar
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};