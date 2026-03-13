// src/features/admin/pages/Inversiones/components/InversionesFiltersBar.tsx

import type { useAdminInversiones } from '@/features/admin/hooks/finanzas/useAdminInversiones';
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/FilterBar';
import { RestartAlt as ClearIcon } from '@mui/icons-material';
import { alpha, Box, IconButton, MenuItem, Stack, TextField, Tooltip, useTheme } from '@mui/material';
import React from 'react';

interface Props {
  logic: ReturnType<typeof useAdminInversiones>;
  startDate: string;
  endDate: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onClear: () => void;
}

const InversionesFiltersBar: React.FC<Props> = ({
  logic, startDate, endDate, onStartDateChange, onEndDateChange, onClear
}) => {
  const theme = useTheme();
  return (
    <FilterBar sx={{ mb: 3, p: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, alignItems: { xs: 'stretch', lg: 'center' }, width: '100%' }}>

        <Box sx={{ flex: 1, minWidth: { xs: '100%', lg: 300 } }}>
          <FilterSearch placeholder="Buscar inversor o proyecto..." value={logic.searchTerm} onSearch={logic.setSearchTerm} fullWidth />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: { xs: 'center', lg: 'flex-end' } }}>

          <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <TextField type="date" label="Desde" size="small" InputLabelProps={{ shrink: true }}
              value={startDate} onChange={(e) => onStartDateChange(e.target.value)}
              sx={{ width: { xs: '50%', sm: 140 } }} />
            <TextField type="date" label="Hasta" size="small" InputLabelProps={{ shrink: true }}
              value={endDate} onChange={(e) => onEndDateChange(e.target.value)}
              sx={{ width: { xs: '50%', sm: 140 } }} />
          </Stack>

          <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
            <FilterSelect label="Estado" value={logic.filterStatus} onChange={(e) => logic.setFilterStatus(e.target.value as any)} sx={{ flex: 1, minWidth: 120 }}>
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pendiente">Pendientes</MenuItem>
              <MenuItem value="pagado">Pagados</MenuItem>
              <MenuItem value="fallido">Fallidos</MenuItem>
            </FilterSelect>
            <FilterSelect label="Proyecto" value={logic.filterProject} onChange={(e) => logic.setFilterProject(e.target.value)} sx={{ flex: 1, minWidth: 160 }}>
              <MenuItem value="all">Todos los Proyectos</MenuItem>
              {logic.proyectos.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
              ))}
            </FilterSelect>
          </Box>

          <Tooltip title="Limpiar filtros">
            <IconButton onClick={onClear} size="small" sx={{ bgcolor: alpha(theme.palette.error.main, 0.08), color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.15) } }}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>

        </Box>
      </Box>
    </FilterBar>
  );
};

export default InversionesFiltersBar;