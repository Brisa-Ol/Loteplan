// src/components/Proyectos/ProjectFilters.tsx
import React, { useState } from "react";
import { Box, TextField, MenuItem, Button, Stack, InputAdornment } from "@mui/material";
import { FilterList as FilterIcon, Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";

interface ProjectFiltersProps {
  onFilter: (filters: { location: string; status: string; search: string }) => void;
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({ onFilter }) => {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("todos"); // Default "todos"

  const handleApplyFilters = () => {
    onFilter({ 
        location, 
        status: status === "todos" ? "" : status,
        search 
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setLocation("");
    setStatus("todos");
    onFilter({ location: "", status: "", search: "" });
  };

  // Manejo de tecla Enter para buscar
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleApplyFilters();
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 4, width: "100%" }}>
      <Box
        sx={{
          bgcolor: "background.paper",
          p: 3,
          borderRadius: 3, // Más redondeado
          boxShadow: 2,    // Sombra más suave
          maxWidth: 1000,
          width: "100%",
        }}
      >
        <Stack 
          direction={{ xs: "column", md: "row" }} 
          spacing={2} 
          alignItems="center"
        >
          {/* 🔍 Búsqueda por Nombre */}
          <TextField
            label="Buscar proyecto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* 📍 Filtro por Ubicación (Ahora es texto libre para flexibilidad) */}
          <TextField
            label="Ubicación / Zona"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            sx={{ maxWidth: { md: 250 } }}
          />

          {/* 📊 Filtro por Estado (Alineado con DB) */}
          <TextField
            select
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            fullWidth
            sx={{ maxWidth: { md: 200 } }}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="En proceso">Activos</MenuItem>
            <MenuItem value="En Espera">Próximamente</MenuItem>
            <MenuItem value="Finalizado">Finalizados</MenuItem>
          </TextField>

          {/* Botones de Acción */}
          <Stack direction="row" spacing={1} sx={{ minWidth: 180 }}>
            <Button
              variant="contained"
              startIcon={<FilterIcon />}
              onClick={handleApplyFilters}
              fullWidth
              sx={{ py: 1.2, fontWeight: 'bold' }}
            >
              Filtrar
            </Button>
            <Button 
                variant="outlined" 
                onClick={handleClearFilters}
                sx={{ minWidth: 50, px: 1 }}
            >
              <ClearIcon />
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};