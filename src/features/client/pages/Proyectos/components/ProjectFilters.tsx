import React, { useState, useEffect, useCallback } from "react";
import { 
  Box, TextField, MenuItem, Button, Stack, InputAdornment, 
  Paper, useTheme, alpha, IconButton, Tooltip, Typography, Chip
} from "@mui/material";
import { 
  FilterList as FilterIcon, 
  Search as SearchIcon, 
  Clear as ClearIcon,
  Category,
} from "@mui/icons-material";

import type { EstadoProyecto } from "@/core/types/dto/proyecto.dto";

interface ProjectFiltersProps {
  onFilter: (filters: { status: string; search: string }) => void;
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({ onFilter }) => {
  const theme = useTheme();
  
  // Estado local para input (actualización inmediata)
  const [localSearch, setLocalSearch] = useState("");
  
  // Estado para filtros aplicados (con debounce)
  const [status, setStatus] = useState<EstadoProyecto | "todos">("todos");
  
  // ✅ MEJORA 1: Debounce para búsqueda (300ms)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onFilter({ status, search: value });
        }, 300);
      };
    })(),
    [status, onFilter]
  );

  // Efecto para aplicar debounce cuando cambia localSearch
  useEffect(() => {
    debouncedSearch(localSearch);
  }, [localSearch, debouncedSearch]);

  // Handler para cambio de estado (sin debounce, es un select)
  const handleStatusChange = (newStatus: EstadoProyecto | "todos") => {
    setStatus(newStatus);
    onFilter({ status: newStatus, search: localSearch });
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setStatus("todos");
    onFilter({ status: "todos", search: "" });
  };

  // ✅ MEJORA 2: Indicador visual de filtros activos
  const tieneFiltrosActivos = localSearch || status !== 'todos';

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 5, width: "100%", px: { xs: 2, md: 0 } }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 4, 
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
          border: `1px solid ${theme.palette.divider}`,
          maxWidth: 900,
          width: "100%",
          bgcolor: 'background.paper',
          transition: 'all 0.3s ease',
          '&:focus-within': {
            transform: 'translateY(-2px)',
            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
            borderColor: theme.palette.primary.main
          }
        }}
      >
        <Stack 
          direction={{ xs: "column", md: "row" }} 
          spacing={2} 
          alignItems="center"
        >
          {/* 🔍 Búsqueda con Debounce */}
          <TextField
            placeholder="Buscar proyecto por nombre..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              // ✅ MEJORA 3: Botón para limpiar búsqueda
              endAdornment: localSearch && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setLocalSearch("")}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* 📊 Filtro por Estado */}
          <TextField
            select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as EstadoProyecto | "todos")}
            fullWidth
            size="small"
            sx={{ maxWidth: { md: 250 } }}
            InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Category color="action" fontSize="small" />
                  </InputAdornment>
                ),
            }}
          >
            <MenuItem value="todos">
                <Typography variant="body2" fontWeight={500}>Todos los estados</Typography>
            </MenuItem>
            
            <MenuItem value="En proceso">
                <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                    <Typography variant="body2">En proceso</Typography>
                </Box>
            </MenuItem>
            
            <MenuItem value="En Espera">
                <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                    <Typography variant="body2">Próximamente</Typography>
                </Box>
            </MenuItem>
            
            <MenuItem value="Finalizado">
                <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                    <Typography variant="body2">Finalizados</Typography>
                </Box>
            </MenuItem>
          </TextField>

          {/* ✅ MEJORA 4: Botón de limpiar solo cuando hay filtros */}
          {tieneFiltrosActivos && (
            <Tooltip title="Limpiar todos los filtros">
              <IconButton 
                onClick={handleClearFilters}
                size="small"
                sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    color: 'text.secondary',
                    minWidth: 40,
                    height: 40,
                    '&:hover': {
                        borderColor: theme.palette.error.main,
                        color: theme.palette.error.main,
                        bgcolor: alpha(theme.palette.error.main, 0.05)
                    }
                }}
              >
               <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* ✅ MEJORA 5: Chips de filtros activos */}
        {tieneFiltrosActivos && (
          <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
            {localSearch && (
              <Chip
                label={`Búsqueda: "${localSearch}"`}
                size="small"
                onDelete={() => setLocalSearch("")}
                color="primary"
                variant="outlined"
              />
            )}
            {status !== 'todos' && (
              <Chip
                label={`Estado: ${status}`}
                size="small"
                onDelete={() => handleStatusChange("todos")}
                color="primary"
                variant="outlined"
              />
            )}
          </Stack>
        )}
      </Paper>
    </Box>
  );
};