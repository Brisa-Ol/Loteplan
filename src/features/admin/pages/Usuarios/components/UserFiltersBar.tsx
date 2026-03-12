// src/features/admin/pages/Usuarios/components/UserFiltersBar.tsx

import { FilterBar, FilterSearch, FilterSelect } from '@/shared';
import { RestartAlt } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import React from 'react';

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
}) => (
  <FilterBar sx={{ mb: 3 }}>
    <Stack spacing={2} width="100%">
      <FilterSearch
        placeholder="Buscar por DNI, nombre..."
        value={searchTerm}
        onSearch={setSearchTerm}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.5fr 1fr 1fr 0.5fr' }, gap: 2 }}>
        <FilterSelect label="Estado" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="active">Activos</MenuItem>
          <MenuItem value="inactive">Inactivos</MenuItem>
        </FilterSelect>
        <TextField
          type="date" label="Desde" value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }} size="small"
        />
        <TextField
          type="date" label="Hasta" value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }} size="small"
        />
        <Button startIcon={<RestartAlt />} onClick={clearFilters}>Limpiar</Button>
      </Box>
    </Stack>
  </FilterBar>
);

export default UserFiltersBar;