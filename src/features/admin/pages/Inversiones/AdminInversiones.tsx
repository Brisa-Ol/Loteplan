import React, { useMemo } from 'react';
import {
  AccountBalanceWallet,
  AttachMoney,
  MonetizationOn,
  Person as PersonIcon,
  Search,
  ShowChart,
  Visibility
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
  MenuItem, 
  TextField 
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  XAxis, 
  YAxis
} from 'recharts';

import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import DetalleInversionModal from './components/DetalleInversionModal';
import { useAdminInversiones } from '../../hooks/useAdminInversiones';
import { FilterBar, FilterSelect } from '../../../../shared/components/forms/filters/FilterBar';
import type { InversionDto } from '../../../../core/types/dto/inversion.dto';
import type { ProyectoDto } from '../../../../core/types/dto/proyecto.dto';

const AdminInversiones: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminInversiones();

  // Definición de Columnas
  const columns = useMemo<DataTableColumn<InversionDto>[]>(() => [
    {
      id: 'id', label: 'ID', minWidth: 60,
      render: (inv) => <Typography variant="body2" fontWeight={700}>#{inv.id}</Typography>
    },
    {
      id: 'usuario', label: 'Inversor', minWidth: 220,
      render: (inv) => {
        const user = logic.getUserInfo(inv.id_usuario);
        return (
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1), 
              color: 'primary.main', 
              width: 36, height: 36, 
              fontSize: 14, fontWeight: 'bold' 
            }}>
              {user.name.charAt(0) || <PersonIcon />}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
              <Typography variant="caption" color="text.secondary">{user.email}</Typography>
            </Box>
          </Stack>
        );
      }
    },
    {
      id: 'proyecto', label: 'Proyecto', minWidth: 150,
      render: (inv) => (
        <Typography variant="body2" fontWeight={500}>
          {logic.getProjectName(inv.id_proyecto)}
        </Typography>
      )
    },
    {
      id: 'monto', label: 'Monto',
      render: (inv) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
          ${Number(inv.monto).toLocaleString('es-AR')}
        </Typography>
      )
    },
    {
      id: 'estado', label: 'Estado',
      render: (inv) => {
        const statusConfig: Record<string, { color: any; variant: "filled" | "outlined" }> = {
          pagado: { color: 'success', variant: 'filled' },
          pendiente: { color: 'warning', variant: 'outlined' },
          fallido: { color: 'error', variant: 'outlined' },
          reembolsado: { color: 'info', variant: 'outlined' }
        };
        const config = statusConfig[inv.estado] || statusConfig.pendiente;

        return (
          <Chip 
            label={inv.estado.toUpperCase()} 
            size="small" 
            color={config.color} 
            variant={config.variant}
            sx={{ fontWeight: 700, fontSize: '0.65rem' }}
          />
        );
      }
    },
    {
      id: 'fecha', label: 'Fecha',
      render: (inv) => {
        const dateObj = new Date(inv.fecha_inversion || inv.fecha_creacion || '');
        return (
          <Box>
            <Typography variant="body2">
              {dateObj.toLocaleDateString('es-AR')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute:'2-digit' })}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'acciones', label: 'Acciones', align: 'right',
      render: (inv) => (
        <Tooltip title="Ver Detalle">
          <IconButton 
            color="primary" 
            onClick={() => logic.handleViewDetails(inv)} 
            size="small"
            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], [theme, logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader
        title="Gestión de Inversiones"
        subtitle="Monitoreo de capital ingresado y rendimiento de inversores."
      />

      {/* ========== 1. KPIs ========== */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <StatCard 
          title="Total Registrado" 
          value={`$${Number(logic.liquidezData?.total_invertido_registrado || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
          subtitle="Intención de inversión"
          color="info" icon={<AttachMoney />} loading={logic.isLoading}
        />
        <StatCard 
          title="Capital Consolidado" 
          value={`$${Number(logic.liquidezData?.total_pagado || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
          subtitle="Cobros efectivos"
          color="success" icon={<MonetizationOn />} loading={logic.isLoading}
        />
        <StatCard 
          title="Tasa de Liquidez" 
          value={`${logic.liquidezData?.tasa_liquidez || 0}%`} 
          subtitle="Conversión de pagos" 
          color="warning" icon={<ShowChart />} loading={logic.isLoading}
        />
        <StatCard 
          title="Transacciones" 
          value={logic.filteredInversiones.length.toString()} 
          subtitle="Volumen filtrado"
          color="primary" icon={<AccountBalanceWallet />} loading={logic.isLoading}
        />
      </Box>

      {/* ========== 2. FILTROS ========== */}
      <FilterBar>
        <TextField 
          placeholder="Buscar inversor, ID, proyecto..." 
          size="small" 
          sx={{ flexGrow: 1 }} 
          value={logic.searchTerm} 
          onChange={(e) => logic.setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <Search color="action" sx={{ mr: 1 }} /> }}
        />
        
        <FilterSelect 
          label="Estado"
          value={logic.filterStatus}
          onChange={(e) => logic.setFilterStatus(e.target.value as any)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="pendiente">Pendiente</MenuItem>
          <MenuItem value="pagado">Pagado</MenuItem>
          <MenuItem value="fallido">Fallido</MenuItem>
        </FilterSelect>

        <FilterSelect 
          label="Proyecto"
          value={logic.filterProject}
          onChange={(e) => logic.setFilterProject(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">Todos los proyectos</MenuItem>
          {logic.proyectos.map((p: ProyectoDto) => (
            <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
          ))}
        </FilterSelect>
      </FilterBar>

      {/* ========== 3. GRÁFICO ========== */}
      <Box sx={{ height: 350, mb: 4, width: '100%' }}> 
        <Typography variant="h6" fontWeight={700} mb={2}>Top Inversores (Capital Consolidado)</Typography>
        <Box sx={{ width: '100%', height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
          {logic.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={logic.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip 
                  formatter={(val: number) => [`$${val.toLocaleString('es-AR')}`, 'Invertido']} 
                />
                <Bar dataKey="monto" radius={[4, 4, 0, 0]} barSize={50}>
                  {logic.chartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index < 3 ? theme.palette.warning.main : theme.palette.primary.main} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Stack height="100%" alignItems="center" justifyContent="center">
              <Typography color="text.secondary">
                {logic.isLoading ? "Cargando métricas..." : "No hay datos de inversores aún."}
              </Typography>
            </Stack>
          )}
        </Box>
      </Box>

      {/* ========== 4. DATA TABLE ========== */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
        <DataTable
          columns={columns}
          data={logic.filteredInversiones}
          getRowKey={(row) => row.id}
          // ✅ Definimos como 'Inactivo' las inversiones fallidas para poder filtrarlas con el Switch
          isRowActive={(row) => row.estado !== 'fallido'}
          showInactiveToggle={true}
          inactiveLabel="Fallidas"
          emptyMessage="No se encontraron registros de inversión."
          pagination
        />
      </QueryHandler>

      {/* Modal de Detalle */}
      {logic.selectedInversion && (
        <DetalleInversionModal 
          open={logic.detailModal.isOpen} 
          onClose={logic.handleCloseModal} 
          inversion={logic.selectedInversion}
          userName={logic.getUserInfo(logic.selectedInversion.id_usuario).name}
          userEmail={logic.getUserInfo(logic.selectedInversion.id_usuario).email}
          projectName={logic.getProjectName(logic.selectedInversion.id_proyecto)}
        />
      )}
    </PageContainer>
  );
};

export default AdminInversiones;