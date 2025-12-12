import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem,
  InputAdornment, Chip, IconButton, Tooltip, LinearProgress
} from '@mui/material';
import {
  Search, Visibility, CheckCircle, AccessTime
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import type { ResumenCuentaDto } from '../../../types/dto/resumenCuenta.dto';

// --- COMPONENTES ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable'; 

import { PageHeader } from '../../../components/common/PageHeader/PageHeader';

// ✅ 1. Importar Hook
import { useModal } from '../../../hooks/useModal';
import ResumenCuentaService from '../../../Services/resumenCuenta.service';
import DetalleResumenModal from './modals/DetalleResumenModal';

const AdminResumenesCuenta: React.FC = () => {

  // --- ESTADOS DE FILTRO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');

  // ✅ 2. Hook useModal
  const detalleModal = useModal();
  // Estado de Datos
  const [selectedResumen, setSelectedResumen] = useState<ResumenCuentaDto | null>(null);

  // --- QUERY: Obtener todos los resúmenes (Admin) ---
  const { data: resumenes = [], isLoading, error } = useQuery({
    queryKey: ['adminResumenes'],
    queryFn: async () => {
      const response = await ResumenCuentaService.findAll();
      return response.data;
    },
  });

  // --- FILTRADO ---
  const filteredResumenes = useMemo(() => {
    return resumenes.filter(resumen => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        resumen.nombre_proyecto.toLowerCase().includes(term) ||
        resumen.id.toString().includes(term) ||
        resumen.id_suscripcion.toString().includes(term);

      let matchesState = true;
      if (filterState === 'active') {
        matchesState = resumen.porcentaje_pagado < 100 && resumen.cuotas_vencidas === 0;
      } else if (filterState === 'completed') {
        matchesState = resumen.porcentaje_pagado >= 100;
      } else if (filterState === 'overdue') {
        matchesState = resumen.cuotas_vencidas > 0;
      }

      return matchesSearch && matchesState;
    });
  }, [resumenes, searchTerm, filterState]);

  // ✅ 3. Handlers
  const handleVerDetalle = (resumen: ResumenCuentaDto) => {
    setSelectedResumen(resumen);
    detalleModal.open();
  };

  const handleCloseModal = () => {
    detalleModal.close();
    setSelectedResumen(null);
  };

  // --- COLUMNAS DE LA TABLA ---
  const columns: DataTableColumn<ResumenCuentaDto>[] = [
    {
      id: 'id',
      label: 'ID',
      render: (resumen) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>#{resumen.id}</Typography>
          <Typography variant="caption" color="text.secondary">
            Susc. {resumen.id_suscripcion}
          </Typography>
        </Box>
      )
    },
    {
      id: 'proyecto',
      label: 'Proyecto',
      render: (resumen) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {resumen.nombre_proyecto}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {resumen.meses_proyecto} meses
          </Typography>
        </Box>
      )
    },
    {
      id: 'cuotas',
      label: 'Cuotas Pagadas',
      render: (resumen) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {resumen.cuotas_pagadas} / {resumen.meses_proyecto}
          </Typography>
          {resumen.cuotas_vencidas > 0 && (
            <Chip
              label={`${resumen.cuotas_vencidas} vencidas`}
              color="error"
              size="small"
              sx={{ mt: 0.5 }}
            />
          )}
        </Box>
      )
    },
    {
      id: 'progreso',
      label: 'Progreso',
      render: (resumen) => (
        <Box sx={{ minWidth: 120 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={resumen.porcentaje_pagado}
              sx={{ flex: 1, height: 8, borderRadius: 4 }}
              color={resumen.porcentaje_pagado >= 100 ? 'success' : 'primary'}
            />
            <Typography variant="caption" fontWeight="bold">
              {resumen.porcentaje_pagado.toFixed(1)}%
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (resumen) => {
        const isCompleted = resumen.porcentaje_pagado >= 100;
        const hasOverdue = resumen.cuotas_vencidas > 0;

        return (
          <Chip
            label={isCompleted ? 'Completado' : hasOverdue ? 'Con Vencidas' : 'Activo'}
            color={isCompleted ? 'success' : hasOverdue ? 'error' : 'info'}
            size="small"
            icon={isCompleted ? <CheckCircle fontSize="small" /> : hasOverdue ? <AccessTime fontSize="small" /> : undefined}
          />
        );
      }
    },
    {
      id: 'cuota_mensual',
      label: 'Cuota Mensual',
      render: (resumen) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          ${resumen.detalle_cuota.valor_mensual_final.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (resumen) => (
        <Tooltip title="Ver Detalle">
          <IconButton
            size="small"
            // ✅ Usar handler
            onClick={() => handleVerDetalle(resumen)}
            color="primary"
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <PageContainer maxWidth="xl">

      <PageHeader
        title="Resúmenes de Cuenta"
        subtitle="Visualiza el estado de todos los planes de pago y suscripciones activas."
      />

      {/* Barra de Filtros */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', borderRadius: 2 }} elevation={0} variant="outlined">

        <TextField
          placeholder="Buscar por proyecto, ID resumen o ID suscripción..."
          size="small"
          sx={{ flexGrow: 1, minWidth: 300 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
        />

        <TextField
          select
          label="Estado"
          size="small"
          value={filterState}
          onChange={(e) => setFilterState(e.target.value as any)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="active">Activos</MenuItem>
          <MenuItem value="completed">Completados</MenuItem>
          <MenuItem value="overdue">Con Vencidas</MenuItem>
        </TextField>

      </Paper>

      {/* Tabla */}
      <QueryHandler isLoading={isLoading} error={error as Error}>
        <DataTable
          columns={columns}
          data={filteredResumenes}
          // ✅ CORRECCIÓN AQUÍ: Agregamos getRowKey
          getRowKey={(row) => row.id} 
          emptyMessage="No se encontraron resúmenes de cuenta."
          pagination={true}
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* ✅ Modal con Hook */}
      <DetalleResumenModal
        open={detalleModal.isOpen} // ✅
        onClose={handleCloseModal} // ✅
        resumen={selectedResumen}
      />
    </PageContainer>
  );
};

export default AdminResumenesCuenta;