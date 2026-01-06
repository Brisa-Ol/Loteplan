// src/pages/Admin/ResumenesCuenta/AdminResumenesCuenta.tsx

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem,
  InputAdornment, Chip, IconButton, Tooltip, LinearProgress, useTheme, alpha, Stack
} from '@mui/material';
import {
  Search, Visibility, CheckCircle, AccessTime, ErrorOutline, AccountBalanceWallet
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import DetalleResumenModal from './modals/DetalleResumenModal';
import { useModal } from '../../../../hooks/useModal';
import type { ResumenCuentaDto } from '../../../../types/dto/resumenCuenta.dto';
import ResumenCuentaService from '../../../../services/resumenCuenta.service';
import { PageContainer } from '../../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../../components/common/DataTable/DataTable';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';

const AdminResumenesCuenta: React.FC = () => {
  const theme = useTheme();

  // --- ESTADOS DE FILTRO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  
  // Estado para feedback visual (opcional si agregas acciones futuras)
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Hooks
  const detalleModal = useModal();
  const [selectedResumen, setSelectedResumen] = useState<ResumenCuentaDto | null>(null);

  // --- QUERY ---
  const { data: resumenes = [], isLoading, error } = useQuery({
    queryKey: ['adminResumenes'],
    queryFn: async () => {
      const response = await ResumenCuentaService.findAll();
      return response.data;
    },
  });

  // --- FILTRADO (Memoized) ---
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

  // Handlers (Callback para rendimiento)
  const handleVerDetalle = useCallback((resumen: ResumenCuentaDto) => {
    setSelectedResumen(resumen);
    detalleModal.open();
  }, [detalleModal]);

  const handleCloseModal = useCallback(() => {
    detalleModal.close();
    setTimeout(() => setSelectedResumen(null), 300);
  }, [detalleModal]);

  // --- COLUMNAS ---
  const columns = useMemo<DataTableColumn<ResumenCuentaDto>[]>(() => [
    {
      id: 'id',
      label: 'ID / Ref',
      minWidth: 100,
      render: (resumen) => (
        <Box>
          <Typography variant="body2" fontWeight={700}>#{resumen.id}</Typography>
          <Typography variant="caption" color="text.secondary">
            Susc. #{resumen.id_suscripcion}
          </Typography>
        </Box>
      )
    },
    {
      id: 'proyecto',
      label: 'Proyecto / Plan',
      minWidth: 200,
      render: (resumen) => (
        <Box>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {resumen.nombre_proyecto}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime sx={{ fontSize: 10 }} /> Plan de {resumen.meses_proyecto} meses
          </Typography>
        </Box>
      )
    },
    {
      id: 'cuotas',
      label: 'Progreso Cuotas',
      minWidth: 160,
      render: (resumen) => (
        <Stack spacing={0.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
             <Typography variant="caption" fontWeight={700} color="text.primary">
                {resumen.cuotas_pagadas} / {resumen.meses_proyecto}
             </Typography>
             {resumen.cuotas_vencidas > 0 && (
                <Chip
                  label={`${resumen.cuotas_vencidas} vencida(s)`}
                  color="error"
                  size="small"
                  variant="filled"
                  sx={{ height: 16, fontSize: '0.65rem', fontWeight: 700 }}
                />
             )}
          </Stack>
          
          <LinearProgress
            variant="determinate"
            value={Math.min(resumen.porcentaje_pagado, 100)}
            sx={{ 
                height: 6, 
                borderRadius: 3,
                bgcolor: alpha(theme.palette.grey[400], 0.2),
                '& .MuiLinearProgress-bar': {
                    bgcolor: resumen.porcentaje_pagado >= 100 
                      ? theme.palette.success.main 
                      : resumen.cuotas_vencidas > 0 ? theme.palette.warning.main : theme.palette.primary.main
                }
            }}
          />
        </Stack>
      )
    },
    {
      id: 'porcentaje',
      label: '%',
      align: 'center',
      render: (resumen) => (
        <Typography variant="body2" fontWeight={700} color="text.secondary">
            {resumen.porcentaje_pagado.toFixed(0)}%
        </Typography>
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
            label={isCompleted ? 'Completado' : hasOverdue ? 'Con Deuda' : 'Al Día'}
            color={isCompleted ? 'success' : hasOverdue ? 'error' : 'info'}
            size="small"
            variant={isCompleted || hasOverdue ? 'filled' : 'outlined'}
            icon={
                isCompleted ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : 
                hasOverdue ? <ErrorOutline sx={{ fontSize: '14px !important' }} /> : 
                undefined
            }
            sx={{ fontWeight: 600, minWidth: 90 }}
          />
        );
      }
    },
    {
      id: 'cuota_mensual',
      label: 'Valor Cuota',
      render: (resumen) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
            <AccountBalanceWallet sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ fontFamily: 'monospace' }}>
                ${resumen.detalle_cuota.valor_mensual_final.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Typography>
        </Stack>
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (resumen) => (
        <Tooltip title="Ver Detalle Completo">
          <IconButton
            size="small"
            onClick={() => handleVerDetalle(resumen)}
            sx={{ 
                color: 'primary.main', 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], [theme, handleVerDetalle]);

  return (
    <PageContainer maxWidth="xl">

      <PageHeader
        title="Resúmenes de Cuenta"
        subtitle="Visualiza el estado de todos los planes de pago y suscripciones activas."
      />

      {/* Barra de Filtros */}
      <Paper 
        elevation={0} 
        sx={{ 
            p: 2, mb: 3, borderRadius: 2, 
            border: '1px solid', borderColor: 'divider', 
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center'
        }} 
      >
        <TextField
          placeholder="Buscar por proyecto, ID resumen o ID suscripción..."
          size="small"
          sx={{ flexGrow: 1, minWidth: 300 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search color="action"/></InputAdornment>,
            sx: { borderRadius: 2 }
          }}
        />

        <TextField
          select
          label="Filtrar por Estado"
          size="small"
          value={filterState}
          onChange={(e) => setFilterState(e.target.value as any)}
          sx={{ minWidth: 200 }}
          InputProps={{ sx: { borderRadius: 2 } }}
        >
          <MenuItem value="all">Todos los Estados</MenuItem>
          <MenuItem value="active">Activos (Al día)</MenuItem>
          <MenuItem value="overdue">Con Vencidas</MenuItem>
          <MenuItem value="completed">Completados</MenuItem>
        </TextField>
      </Paper>

      {/* Tabla */}
      <QueryHandler isLoading={isLoading} error={error as Error}>
        <DataTable
          columns={columns}
          data={filteredResumenes}
          getRowKey={(row) => row.id} 
          
          // ✅ Las cuentas completadas (100%) se atenúan para centrarse en las activas/deudoras
          isRowActive={(row) => row.porcentaje_pagado < 100} 
          highlightedRowId={highlightedId}

          emptyMessage="No se encontraron resúmenes de cuenta con los filtros actuales."
          pagination={true}
          defaultRowsPerPage={10}
        />
      </QueryHandler>

      {/* Modal Detalle */}
      <DetalleResumenModal
        open={detalleModal.isOpen}
        onClose={handleCloseModal}
        resumen={selectedResumen}
      />
    </PageContainer>
  );
};

export default AdminResumenesCuenta;