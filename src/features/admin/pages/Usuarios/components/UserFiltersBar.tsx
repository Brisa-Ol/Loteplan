// src/features/admin/pages/Usuarios/components/UserFiltersBar.tsx

import { FilterBar, FilterSearch, FilterSelect } from '@/shared';
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

interface UserFiltersBarProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  clearFilters: () => void;
}

const UserFiltersBar: React.FC<UserFiltersBarProps> = ({
  searchTerm, setSearchTerm,
  filterStatus, setFilterStatus,
  startDate, setStartDate,
  endDate, setEndDate,
  clearFilters,
}) => {
  const theme = useTheme();

  return (
    <FilterBar sx={{ mb: 3, p: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, alignItems: { xs: 'stretch', lg: 'center' }, width: '100%' }}>

        {/* BUSCADOR (Ocupa el espacio disponible a la izquierda) */}
        <Box sx={{ flex: 1, minWidth: { xs: '100%', lg: 300 } }}>
          <FilterSearch
            placeholder="Buscar por DNI, nombre o correo..."
            value={searchTerm}
            onSearch={setSearchTerm}
            fullWidth
          />
        </Box>

        {/* CONTENEDOR DE FILTROS Y BOTONES (Alineados a la derecha en desktop) */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: { xs: 'center', lg: 'flex-end' } }}>

          {/* FECHAS */}
          <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              type="date"
              label="Desde"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={dateInputStyles}
            />
            <TextField
              type="date"
              label="Hasta"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={dateInputStyles}
            />
          </Stack>

          {/* SELECT ESTADO */}
          <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
            <FilterSelect
              label="Estado"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ flex: 1, minWidth: 140 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="inactive">Inactivos</MenuItem>
            </FilterSelect>
          </Box>



        </Box>
      </Box>
    </FilterBar>
  );
};

export default UserFiltersBar;