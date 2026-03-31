// src/features/admin/pages/Contrato/AdminContratosFirmados.tsx

import {
  BarChart as BarChartIcon,
  Business,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Fingerprint,
  Gavel,
  HistoryEdu,
  Person,
  PieChart as PieChartIcon,
  ViewList
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import React, { useMemo, useState } from 'react';

// Utils
import { format } from 'date-fns';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis, YAxis
} from 'recharts';

// Hooks y DTOs
import type { ContratoFirmadoDto } from '@/core/types/contrato-firmado.dto';

// Componentes Compartidos
import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader'; // ✅ Aplicado
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { ViewModeToggle, type ViewMode } from '@/shared/components/admin/Viewmodetoggle';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler';
import { StatCard, StatusBadge } from '@/shared/components/domain/cards/StatCard';
import { FilterBar, FilterSearch, FilterSelect } from '@/shared/components/forms/FilterBar';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import AlertBanner from '@/shared/components/ui/Alertbanner';
import { useAdminContratosFirmados } from '../../hooks/contrato/useAdminContratosFirmados';

// ============================================================================
// SUB-COMPONENTE: ANALYTICS
// ============================================================================
const ContratosAnalytics = React.memo<{ data: ContratoFirmadoDto[] }>(({ data }) => {
  const theme = useTheme();

  const typeData = useMemo(() => {
    const inversiones = data.filter(c => c.id_inversion_asociada).length;
    const suscripciones = data.filter(c => c.id_suscripcion_asociada).length;
    const otros = data.length - inversiones - suscripciones;

    return [
      { name: 'Inversiones', value: inversiones, color: theme.palette.primary.main },
      { name: 'Suscripciones', value: suscripciones, color: theme.palette.secondary.main },
      { name: 'Generales', value: otros, color: theme.palette.info.main },
    ].filter(i => i.value > 0);
  }, [data, theme]);

  const projectData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const name = curr.proyectoAsociado?.nombre_proyecto || `Proy #${curr.id_proyecto}`;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data]);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
      <Box sx={{ bgcolor: alpha(theme.palette.background.paper, 0.5), p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={800} mb={3}>Tipología Legal</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
            <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ bgcolor: alpha(theme.palette.background.paper, 0.5), p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={800} mb={3}>Volumen por Proyecto (Top 5)</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={projectData} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} />
            <RechartsTooltip cursor={{ fill: alpha(theme.palette.primary.main, 0.1) }} contentStyle={{ borderRadius: 8 }} />
            <Bar dataKey="value" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
});

ContratosAnalytics.displayName = 'ContratosAnalytics';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminContratosFirmados: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminContratosFirmados();
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const stats = useMemo(() => {
    const data = logic.filteredContratos;
    const total = data.length;
    const inv = data.filter(c => c.id_inversion_asociada).length;
    const subs = data.filter(c => c.id_suscripcion_asociada).length;
    const verified = data.filter(c => c.hash_archivo_firmado).length;
    return { total, inv, subs, verified };
  }, [logic.filteredContratos]);

  const columns = useMemo<DataTableColumn<ContratoFirmadoDto>[]>(() => [
    {
      id: 'id',
      label: 'Nombre del Archivo',
      minWidth: 200,
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <DescriptionIcon sx={{ fontSize: 16 }} />
          </Avatar>
          <Box minWidth={0}>
            <Tooltip title={row.nombre_archivo}>
              <Typography variant="body2" fontWeight={800} sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.nombre_archivo}
              </Typography>
            </Tooltip>
            <Typography variant="caption" color="text.secondary">ID Interno: #{row.id}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'usuario',
      label: 'Firmante',
      minWidth: 220,
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.dark, fontSize: 15, fontWeight: 800 }}>
            {row.usuarioFirmante?.nombre.charAt(0).toUpperCase() || <Person fontSize="small" />}
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={800} noWrap>{row.usuarioFirmante ? `${row.usuarioFirmante.nombre} ${row.usuarioFirmante.apellido}` : `ID: ${row.id_usuario_firmante}`}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{row.usuarioFirmante?.email}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'proyecto',
      label: 'Proyecto Asociado',
      minWidth: 200,
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Business fontSize="small" color="action" />
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={700} noWrap>{row.proyectoAsociado?.nombre_proyecto || `ID: ${row.id_proyecto}`}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{row.proyectoAsociado?.tipo_inversion || '---'}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'tipo',
      label: 'Clasificación',
      align: 'center',
      render: (row) => {
        const label = row.id_inversion_asociada ? 'INVERSIÓN' : row.id_suscripcion_asociada ? 'SUSCRIPCIÓN' : 'GENERAL';
        return <StatusBadge status={row.id_inversion_asociada ? 'active' : 'in_progress'} customLabel={label} />;
      }
    },
    {
      id: 'fecha',
      label: 'Fecha de Firma',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{row.fecha_firma ? format(new Date(row.fecha_firma), 'dd/MM/yyyy') : '-'}</Typography>
          <Typography variant="caption" color="text.secondary">{row.fecha_firma ? format(new Date(row.fecha_firma), 'HH:mm') + ' hs' : ''}</Typography>
        </Box>
      )
    },
    {
      id: 'hash',
      label: 'Integridad',
      align: 'center',
      render: (row) => (
        <Tooltip title={row.hash_archivo_firmado ? `SHA-256: ${row.hash_archivo_firmado}` : 'Sin Hash'}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <Fingerprint color={row.hash_archivo_firmado ? "success" : "disabled"} fontSize="small" />
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: row.hash_archivo_firmado ? 'success.main' : 'text.disabled', bgcolor: alpha(theme.palette.success.main, 0.05), px: 0.8, borderRadius: 1, fontWeight: 700 }}>
              {row.hash_archivo_firmado ? row.hash_archivo_firmado.substring(0, 8).toUpperCase() : 'N/A'}
            </Typography>
          </Stack>
        </Tooltip>
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (row) => (
        <IconButton color="primary" onClick={() => logic.handleDownload(row)} disabled={logic.downloadingId === row.id} size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          {logic.downloadingId === row.id ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon fontSize="small" />}
        </IconButton>
      )
    }
  ], [theme, logic]);

  // Estilos compartidos para los inputs de fecha (con el ícono del calendario en naranja)
  const dateInputStyles = {
    width: { xs: '100%', sm: 150 },
    bgcolor: 'background.paper',
    borderRadius: 1,
    '& input::-webkit-calendar-picker-indicator': {
      cursor: 'pointer',
      filter: 'brightness(0) saturate(100%) invert(46%) sepia(50%) saturate(1637%) hue-rotate(345deg) brightness(90%) contrast(85%)'
    }
  };

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      {/* ✅ APLICACIÓN DEL HEADER ESTANDARIZADO */}
      <AdminPageHeader
        title="Auditoría de Contratos"
        subtitle="Registro histórico de acuerdos legales y contratos digitalizados con respaldo criptográfico."
      />

      {logic.error && (
        <AlertBanner severity="error" title="Error de Conexión" message={(logic.error as Error).message} />
      )}

      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
        <StatCard title="Total Firmados" value={stats.total} icon={<Gavel />} color="primary" loading={logic.isLoading} />
        <StatCard title="Inversiones" value={stats.inv} icon={<PieChartIcon />} color="success" loading={logic.isLoading} />
        <StatCard title="Suscripciones" value={stats.subs} icon={<HistoryEdu />} color="secondary" loading={logic.isLoading} />
        <StatCard title="Verificados" value={stats.verified} icon={<Fingerprint />} color="info" loading={logic.isLoading} />
      </MetricsGrid>

      <Stack direction="column" spacing={2} mb={3}>
        <Stack direction="row" justifyContent={{ xs: 'center', sm: 'flex-end' }}>
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'table', label: 'Tabla', icon: <ViewList fontSize="small" /> },
              { value: 'analytics', label: 'Analítica', icon: <BarChartIcon fontSize="small" /> }
            ]}
          />
        </Stack>

        <FilterBar sx={{ width: '100%', flexWrap: 'wrap', gap: 2 }}>
          <FilterSearch placeholder="Inversor, email, proyecto o Hash..." value={logic.searchTerm} onSearch={logic.setSearchTerm} sx={{ flexGrow: 1, minWidth: { xs: '100%', md: 400 } }} />
          <FilterSelect label="Clasificación" value={logic.filterTipo} onChange={(e) => logic.setFilterTipo(e.target.value as string)} sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            <MenuItem value="all">Todas</MenuItem>
            <Divider />
            <MenuItem value="inversion">Inversiones</MenuItem>
            <MenuItem value="suscripcion">Suscripciones</MenuItem>
          </FilterSelect>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <TextField label="Desde" type="date" size="small" value={logic.startDate} onChange={(e) => logic.setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={dateInputStyles} />
            <TextField label="Hasta" type="date" size="small" value={logic.endDate} onChange={(e) => logic.setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={dateInputStyles} />
          </Stack>
        </FilterBar>
      </Stack>

      {viewMode === 'analytics' ? (
        <ContratosAnalytics data={logic.filteredContratos} />
      ) : (
        <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
          <DataTable columns={columns} data={logic.filteredContratos} getRowKey={(row) => row.id} isRowActive={(row) => !!row.hash_archivo_firmado} pagination />
        </QueryHandler>
      )}
    </PageContainer>
  );
};

export default AdminContratosFirmados;