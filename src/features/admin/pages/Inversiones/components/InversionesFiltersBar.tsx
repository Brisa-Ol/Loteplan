// src/features/admin/pages/Inversiones/components/InversionesFiltersBar.tsx

import type { useAdminInversiones } from '@/features/admin/hooks/finanzas/useAdminInversiones';
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/FilterBar';
import { Box, MenuItem, Stack, TextField, useTheme } from '@mui/material';
import React from 'react';

// Estilos compartidos para los inputs de fecha (ícono del calendario en naranja #CC6333)
const dateInputStyles = {
  width: { xs: '50%', sm: 140 },
  '& input::-webkit-calendar-picker-indicator': {
    cursor: 'pointer',
    filter: 'brightness(0) saturate(100%) invert(46%) sepia(50%) saturate(1637%) hue-rotate(345deg) brightness(90%) contrast(85%)'
  }
};

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
            <TextField
              type="date"
              label="Desde"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              sx={dateInputStyles} // 👈 Se aplica el estilo naranja
            />
            <TextField
              type="date"
              label="Hasta"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              sx={dateInputStyles} // 👈 Se aplica el estilo naranja
            />
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
        </Box>
      </Box>
    </FilterBar>
  );
};

export default InversionesFiltersBar;