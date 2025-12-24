import React, { useState } from "react";
import { 
  Box, TextField, MenuItem, Button, Stack, InputAdornment, 
  Paper, useTheme, alpha 
} from "@mui/material";
import { 
  FilterList as FilterIcon, 
  Search as SearchIcon, 
  Clear as ClearIcon,
  LocationOn,
  Category
} from "@mui/icons-material";

interface ProjectFiltersProps {
  onFilter: (filters: { location: string; status: string; search: string }) => void;
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({ onFilter }) => {
  const theme = useTheme();
  
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("todos");

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleApplyFilters();
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 5, width: "100%", px: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 4, 
          boxShadow: theme.shadows[4], // Sombra flotante suave
          border: `1px solid ${theme.palette.divider}`,
          maxWidth: 1100,
          width: "100%",
          bgcolor: 'background.paper'
        }}
      >
        <Stack 
          direction={{ xs: "column", md: "row" }} 
          spacing={2} 
          alignItems="center"
        >
          {/* 🔍 Búsqueda por Nombre */}
          <TextField
            placeholder="Buscar proyecto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 }
            }}
          />

          {/* 📍 Filtro por Ubicación */}
          <TextField
            placeholder="Ubicación / Zona"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            size="small"
            sx={{ maxWidth: { md: 280 } }}
            InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn color="action" fontSize="small" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
            }}
          />

          {/* 📊 Filtro por Estado */}
          <TextField
            select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            fullWidth
            size="small"
            sx={{ maxWidth: { md: 220 } }}
            InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Category color="action" fontSize="small" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
            }}
          >
            <MenuItem value="todos">Todos los Estados</MenuItem>
            <MenuItem value="En proceso">En Proceso (Activos)</MenuItem>
            <MenuItem value="En Espera">Próximamente</MenuItem>
            <MenuItem value="Finalizado">Finalizados</MenuItem>
          </TextField>

          {/* Botones de Acción */}
          <Stack direction="row" spacing={1} sx={{ minWidth: { xs: '100%', md: 'auto' } }}>
            <Button
              variant="contained"
              startIcon={<FilterIcon />}
              onClick={handleApplyFilters}
              fullWidth
              disableElevation
              sx={{ 
                  py: 1, 
                  fontWeight: 700, 
                  borderRadius: 2,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  px: 3
              }}
            >
              Aplicar Filtros
            </Button>
            
            {(search || location || status !== 'todos') && (
                <Button 
                    variant="outlined" 
                    onClick={handleClearFilters}
                    sx={{ 
                        minWidth: 50, 
                        px: 1, 
                        borderRadius: 2,
                        borderColor: theme.palette.divider,
                        color: 'text.secondary',
                        '&:hover': {
                            borderColor: theme.palette.error.main,
                            color: theme.palette.error.main,
                            bgcolor: alpha(theme.palette.error.main, 0.05)
                        }
                    }}
                >
                <ClearIcon />
                </Button>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};