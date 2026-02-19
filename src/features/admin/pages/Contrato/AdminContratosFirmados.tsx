import {
  BarChart as BarChartIcon,
  Business,
  Description as DescriptionIcon,
  Download as DownloadIcon, Fingerprint,
  Gavel,
  HistoryEdu,
  Person,
  PieChart as PieChartIcon, ViewList
} from '@mui/icons-material';
import {
  alpha, Avatar,
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import React, { useMemo, useState } from 'react';

// Utils
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis, YAxis
} from 'recharts';

// Hooks y DTOs
import type { ContratoFirmadoDto } from '@/core/types/dto/contrato-firmado.dto';

// Componentes Compartidos
import { AdminPageHeader } from '@/shared/components/admin/Adminpageheader';
import AlertBanner from '@/shared/components/admin/Alertbanner';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { ViewModeToggle, type ViewMode } from '@/shared/components/admin/Viewmodetoggle';
import { StatCard, StatusBadge } from '@/shared/components/domain/cards/StatCard/StatCard';
import { DataTable, type DataTableColumn } from '@/shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '@/shared/components/data-grid/QueryHandler/QueryHandler';
import { FilterBar, FilterSearch } from '@/shared/components/forms/filters/FilterBar';
import { PageContainer } from '@/shared/components/layout/containers/PageContainer/PageContainer';
import { useAdminContratosFirmados } from '../../hooks/contrato/useAdminContratosFirmados';

// ============================================================================
// SUB-COMPONENTE: ANALYTICS (Memoizado para performance)
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
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
      <Box sx={{ bgcolor: alpha(theme.palette.background.paper, 0.5), p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={800} mb={3}>Tipología Legal</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={typeData}
              cx="50%" cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {typeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
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

  // KPIS
  const stats = useMemo(() => {
    const data = logic.filteredContratos;
    const total = data.length;
    const inv = data.filter(c => c.id_inversion_asociada).length;
    const subs = data.filter(c => c.id_suscripcion_asociada).length;
    const verified = data.filter(c => c.hash_archivo_firmado).length;

    return { total, inv, subs, verified };
  }, [logic.filteredContratos]);

  // COLUMNAS DEFINITIVAS
  const columns = useMemo<DataTableColumn<ContratoFirmadoDto>[]>(() => [
{
      id: 'id',
      label: 'Nombre del Archivo', // Cambiamos el título de la columna
      minWidth: 200, // Le damos un poco más de espacio
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <DescriptionIcon sx={{ fontSize: 16 }} />
          </Avatar>
          <Box minWidth={0}>
            {/* El Nombre del Archivo ahora es el texto principal (Body2, Bold) */}
            <Tooltip title={row.nombre_archivo}>
              <Typography 
                variant="body2" 
                fontWeight={700} 
                sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {row.nombre_archivo}
              </Typography>
            </Tooltip>
            {/* El ID pasa a ser un dato secundario abajo (Caption) */}
            <Typography variant="caption" color="text.secondary">
              ID Interno: #{row.id}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'usuario',
      label: 'Firmante',
      minWidth: 260,
      render: (row) => {
        const user = row.usuarioFirmante;
        const nombreCompleto = user ? `${user.nombre} ${user.apellido}`.trim() : `Usuario #${row.id_usuario_firmante}`;
        const inicial = user ? user.nombre.charAt(0).toUpperCase() : '';

        return (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{
              width: 36, height: 36,
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              color: theme.palette.secondary.main,
              fontSize: 15, fontWeight: 800
            }}>
              {inicial || <Person fontSize="small" />}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={800} noWrap title={nombreCompleto}>
                {nombreCompleto}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user ? user.email : 'Sin datos extendidos'}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        );
      }
    },
    {
      id: 'proyecto',
      label: 'Proyecto Asociado',
      minWidth: 200,
      render: (row) => {
        const proj = row.proyectoAsociado;

        return (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Business fontSize="small" color="action" />
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={700} color="text.primary" noWrap title={proj?.nombre_proyecto || `Proyecto #${row.id_proyecto}`}>
                {proj?.nombre_proyecto || `Proyecto #${row.id_proyecto}`}
              </Typography>
              {proj && (
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }} noWrap>
                  {proj.estado_proyecto} • {proj.tipo_inversion}
                </Typography>
              )}
            </Box>
          </Stack>
        );
      }
    },
    {
      id: 'tipo',
      label: 'Clasificación',
      align: 'center',
      render: (row) => {
        let statusType: any = 'default';
        let label = 'GENERAL';

        if (row.id_inversion_asociada) {
          statusType = 'active'; // Verde
          label = 'INVERSIÓN';
        } else if (row.id_suscripcion_asociada) {
          statusType = 'in_progress'; // Azul/Info
          label = 'SUSCRIPCIÓN';
        }

        return <StatusBadge status={statusType} customLabel={label} />;
      }
    },
    {
      id: 'fecha',
      label: 'Fecha de Firma',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {row.fecha_firma ? format(new Date(row.fecha_firma), 'dd/MM/yyyy', { locale: es }) : '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.fecha_firma ? format(new Date(row.fecha_firma), 'HH:mm', { locale: es }) + ' hs' : ''}
          </Typography>
        </Box>
      )
    },
    {
      id: 'hash',
      label: 'Integridad',
      align: 'center',
      render: (row) => (
        <Tooltip title={row.hash_archivo_firmado ? `SHA-256: ${row.hash_archivo_firmado}` : 'Sin Hash Criptográfico'}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ cursor: 'help' }}>
            <Fingerprint color={row.hash_archivo_firmado ? "success" : "disabled"} fontSize="small" />
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                color: row.hash_archivo_firmado ? 'success.main' : 'text.disabled',
                bgcolor: row.hash_archivo_firmado ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.action.disabled, 0.05),
                px: 0.8, py: 0.2, borderRadius: 1,
                fontWeight: 700
              }}
            >
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
        <Tooltip title="Descargar Copia Legal">
          <span>
            <IconButton
              color="primary"
              onClick={() => logic.handleDownload(row)}
              disabled={logic.downloadingId === row.id}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
              }}
            >
              {logic.downloadingId === row.id
                ? <CircularProgress size={18} color="inherit" />
                : <DownloadIcon fontSize="small" />
              }
            </IconButton>
          </span>
        </Tooltip>
      )
    }
  ], [theme, logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <AdminPageHeader
        title="Auditoría de Contratos"
        subtitle="Registro histórico de acuerdos legales y contratos digitalizados."
      />

      {logic.error && (
        <AlertBanner
          severity="error"
          title="Error de Conexión"
          message={(logic.error as Error).message || "No se pudieron cargar los contratos."}
        />
      )}

      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
        <StatCard
          title="Total Firmados"
          value={stats.total}
          subtitle="Acuerdos registrados"
          icon={<Gavel />}
          color="primary"
          loading={logic.isLoading}
        />
        <StatCard
          title="Inversiones"
          value={stats.inv}
          subtitle="Contratos de capital"
          icon={<PieChartIcon />}
          color="success"
          loading={logic.isLoading}
        />
        <StatCard
          title="Suscripciones"
          value={stats.subs}
          subtitle="Planes mensuales"
          icon={<HistoryEdu />}
          color="secondary"
          loading={logic.isLoading}
        />
        <StatCard
          title="Verificados"
          value={stats.verified}
          subtitle="Con Hash criptográfico"
          icon={<Fingerprint />}
          color="info"
          loading={logic.isLoading}
        />
      </MetricsGrid>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        mb={3}
        spacing={2}
      >
        <ViewModeToggle
          value={viewMode}
          onChange={(newMode) => setViewMode(newMode)}
          options={[
            { value: 'table', label: 'Tabla', icon: <ViewList fontSize="small" /> },
            { value: 'analytics', label: 'Analítica', icon: <BarChartIcon fontSize="small" /> }
          ]}
        />

        <FilterBar sx={{ flex: 1, maxWidth: { sm: 600 } }}>
          <FilterSearch
            placeholder="Buscar por inversor, email, proyecto o Hash..."
            value={logic.searchTerm}
            onSearch={logic.setSearchTerm}
            sx={{ flexGrow: 1 }}
          />
        </FilterBar>
      </Stack>

      {viewMode === 'analytics' ? (
        <ContratosAnalytics data={logic.filteredContratos} />
      ) : (
        <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
          <DataTable
            columns={columns}
            data={logic.filteredContratos}
            getRowKey={(row) => row.id}
            isRowActive={(row) => !!row.hash_archivo_firmado}
            highlightedRowId={logic.highlightedId}
            showInactiveToggle={false}
            emptyMessage="No se han encontrado registros de contratos firmados."
            pagination={true}
            defaultRowsPerPage={10}
          />
        </QueryHandler>
      )}
    </PageContainer>
  );
};

export default AdminContratosFirmados;