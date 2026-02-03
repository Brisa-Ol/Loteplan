import {
  Add as AddIcon,
  BarChart as BarChartIcon,
  CheckCircle,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Description as FileIcon,
  FolderShared, Public,
  Upload as UploadIcon,
  ViewList
} from '@mui/icons-material';
import {
  alpha, Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis, YAxis
} from 'recharts';

// Hooks y DTOs
import type { ContratoPlantillaDto } from '../../../../core/types/dto/contrato-plantilla.dto';
import { useAdminPlantillas } from '../../hooks/useAdminPlantillas';

// Componentes Compartidos (Legacy)
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { StatCard } from '../../../../shared/components/domain/cards/StatCard/StatCard';
import { ConfirmDialog } from '../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { FilterBar, FilterSearch, FilterSelect } from '../../../../shared/components/forms/filters/FilterBar';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';



// Modales
import AdminPageHeader from '@/shared/components/admin/Adminpageheader';
import AlertBanner from '@/shared/components/admin/Alertbanner';
import MetricsGrid from '@/shared/components/admin/Metricsgrid';
import { ViewModeToggle, type ViewMode } from '@/shared/components/admin/Viewmodetoggle';
import CreatePlantillaModal from './components/modals/CreatePlantillaModal';
import UpdateMetadataModal from './components/modals/UpdateMetadataModal';
import UpdatePdfModal from './components/modals/UpdatePdfModal';

// ============================================================================
// SUB-COMPONENTE: ANALYTICS (Distribución de Plantillas)
// ============================================================================
const PlantillaAnalytics: React.FC<{ data: ContratoPlantillaDto[], proyectos: any[] }> = ({ data, proyectos }) => {
  const theme = useTheme();

  const pieData = useMemo(() => {
    const global = data.filter(p => !p.id_proyecto).length;
    const assigned = data.filter(p => p.id_proyecto).length;
    return [
      { name: 'Globales', value: global, color: theme.palette.info.main },
      { name: 'Por Proyecto', value: assigned, color: theme.palette.primary.main },
    ];
  }, [data, theme]);

  const barData = useMemo(() => {
    const active = data.filter(p => p.activo).length;
    const inactive = data.filter(p => !p.activo).length;
    return [
      { name: 'Activas', value: active, color: theme.palette.success.main },
      { name: 'Inactivas', value: inactive, color: theme.palette.text.disabled },
    ];
  }, [data, theme]);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
      {/* Gráfico Distribución */}
      <Box sx={{ bgcolor: alpha(theme.palette.background.paper, 0.5), p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={800} mb={3}>Tipo de Asignación</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%" cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Gráfico Estado */}
      <Box sx={{ bgcolor: alpha(theme.palette.background.paper, 0.5), p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={800} mb={3}>Estado del Inventario</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
            <RechartsTooltip cursor={{ fill: alpha(theme.palette.primary.main, 0.1) }} contentStyle={{ borderRadius: 8 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
              {barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const AdminPlantillas: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminPlantillas();

  // Estado de Vista
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // --------------------------------------------------------------------------
  // CÁLCULO DE KPIS
  // --------------------------------------------------------------------------
  const stats = useMemo(() => {
    const data = logic.filteredPlantillas;
    const total = data.length;
    const active = data.filter(p => p.activo).length;
    const global = data.filter(p => !p.id_proyecto).length;
    const assigned = total - global;

    return { total, active, global, assigned };
  }, [logic.filteredPlantillas]);

  // --------------------------------------------------------------------------
  // DEFINICIÓN DE COLUMNAS
  // --------------------------------------------------------------------------
  const columns = useMemo<DataTableColumn<ContratoPlantillaDto>[]>(() => [
    {
      id: 'id',
      label: 'ID',
      minWidth: 60,
      render: (row) => <Typography variant="caption" fontWeight={700} color="text.secondary">#{row.id}</Typography>
    },
    {
      id: 'nombre_archivo',
      label: 'Documento / Hash',
      minWidth: 280,
      render: (row) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            color: row.activo ? 'primary.main' : 'text.disabled',
            width: 40, height: 40
          }}>
            <FileIcon />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {row.nombre_archivo}
            </Typography>
            <Tooltip title={`Hash Original: ${row.hash_archivo_original}`}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '0.65rem' }}>
                SHA256: {row.hash_archivo_original?.substring(0, 12).toUpperCase()}...
              </Typography>
            </Tooltip>
          </Box>
        </Stack>
      )
    },
    {
      id: 'version',
      label: 'Versión',
      align: 'center',
      render: (row) => (
        <Box
          sx={{
            display: 'inline-block',
            px: 1, py: 0.5,
            borderRadius: 1,
            border: '1px dashed',
            borderColor: 'text.disabled',
            fontWeight: 800,
            fontSize: '0.65rem'
          }}
        >
          V{row.version}
        </Box>
      )
    },
    {
      id: 'id_proyecto',
      label: 'Asignación',
      minWidth: 200,
      render: (row) => {
        const proyecto = logic.proyectos.find(p => p.id === row.id_proyecto);
        return row.id_proyecto ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <FolderShared fontSize="small" color="primary" sx={{ fontSize: 16 }} />
            <Typography variant="caption" fontWeight={700} color="primary.main">
              {proyecto?.nombre_proyecto?.toUpperCase() || `ID: ${row.id_proyecto}`}
            </Typography>
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Public fontSize="small" color="info" sx={{ fontSize: 16 }} />
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              GLOBAL
            </Typography>
          </Stack>
        );
      }
    },
    {
      id: 'visibilidad',
      label: 'Estado',
      align: 'center',
      render: (row) => {
        const isProcessingThis = logic.isToggling && logic.modales.confirmDialog.data?.id === row.id;

        return (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            {isProcessingThis ? (
              <CircularProgress size={20} color="primary" />
            ) : (
              <Switch
                checked={row.activo}
                onChange={() => logic.handleToggleActive(row)}
                color="success"
                size="small"
                disabled={logic.isToggling || logic.isDeleting}
              />
            )}
          </Stack>
        );
      }
    },
    {
      id: 'actions',
      label: 'Acciones',
      align: 'right',
      minWidth: 160,
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">

          {/* CORRECCIÓN: Envolver en <span> para evitar error de Tooltip en elementos disabled */}

          <Tooltip title="Editar Metadatos">
            <span>
              <IconButton
                size="small"
                onClick={() => logic.handleOpenUpdateMeta(row)}
                disabled={logic.isToggling || logic.isDeleting}
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Actualizar Archivo PDF">
            <span>
              <IconButton
                size="small"
                onClick={() => logic.handleOpenUpdatePdf(row)}
                disabled={!row.activo || logic.isToggling || logic.isDeleting}
                sx={{ color: 'info.main', bgcolor: alpha(theme.palette.info.main, 0.05), '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.15) } }}
              >
                <UploadIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Eliminar Plantilla">
            <span>
              <IconButton
                size="small"
                onClick={() => logic.handleDelete(row)}
                disabled={logic.isToggling || logic.isDeleting}
                sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.15) } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

        </Stack>
      )
    }
  ], [logic, theme]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      {/* 1. HEADER ESTANDARIZADO */}
      <AdminPageHeader
        title="Gestión de Plantillas"
        subtitle="Control de versiones de contratos legales y documentos base."
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={logic.modales.create.open}
            sx={{ fontWeight: 700, px: 3 }}
          >
            Nueva Plantilla
          </Button>
        }
      />

      {/* 2. ERRORES */}
      {logic.error && (
        <AlertBanner
          severity="error"
          title="Error de Sistema"
          message={(logic.error as Error).message || "No se pudieron cargar las plantillas."}
        />
      )}

      {/* 3. KPIS GRID */}
      <MetricsGrid columns={{ xs: 1, sm: 2, lg: 4 }}>
        <StatCard
          title="Total Plantillas"
          value={stats.total}
          subtitle="Inventario total"
          icon={<FileIcon />}
          color="info"
          loading={logic.isLoading}
        />
        <StatCard
          title="Activas"
          value={stats.active}
          subtitle="Disponibles para uso"
          icon={<CheckCircle />}
          color="success"
          loading={logic.isLoading}
        />
        <StatCard
          title="Globales"
          value={stats.global}
          subtitle="Base general"
          icon={<Public />}
          color="warning"
          loading={logic.isLoading}
        />
        <StatCard
          title="Específicas"
          value={stats.assigned}
          subtitle="Asignadas a proyectos"
          icon={<FolderShared />}
          color="primary"
          loading={logic.isLoading}
        />
      </MetricsGrid>

      {/* 4. CONTROLES */}
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
            { value: 'table', label: 'Lista', icon: <ViewList fontSize="small" /> },
            { value: 'analytics', label: 'Estadísticas', icon: <BarChartIcon fontSize="small" /> }
          ]}
        />

        <FilterBar sx={{ flex: 1, maxWidth: { sm: 700 } }}>
          <FilterSearch
            placeholder="Buscar por nombre de archivo..."
            value={logic.searchTerm}
            onSearch={logic.setSearchTerm}
            sx={{ flexGrow: 1 }}
          />

          <FilterSelect
            label="Proyecto"
            value={logic.filterProject}
            onChange={(e) => logic.setFilterProject(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">Todos los Proyectos</MenuItem>
            <Divider />
            {logic.proyectos.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
            ))}
          </FilterSelect>
        </FilterBar>
      </Stack>

      {/* 5. CONTENIDO */}
      {viewMode === 'analytics' ? (
        <PlantillaAnalytics data={logic.filteredPlantillas} proyectos={logic.proyectos} />
      ) : (
        <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
          <DataTable
            columns={columns}
            data={logic.filteredPlantillas}
            getRowKey={(row) => row.id}

            // UX: Opacidad para inactivas
            isRowActive={(row) => row.activo}
            showInactiveToggle={true}
            inactiveLabel="Ver Inactivas"

            highlightedRowId={logic.highlightedId}
            emptyMessage="No se encontraron plantillas registradas."
            pagination
            defaultRowsPerPage={10}
          />
        </QueryHandler>
      )}

      {/* 6. MODALES */}
      <CreatePlantillaModal
        open={logic.modales.create.isOpen}
        onClose={logic.modales.create.close}
        onSubmit={async (data) => { await logic.createMutation.mutateAsync(data); }}
        isLoading={logic.isCreating}
        proyectos={logic.proyectos}
      />

      {logic.plantillaSelected && (
        <>
          <UpdatePdfModal
            open={logic.modales.updatePdf.isOpen}
            onClose={() => { logic.modales.updatePdf.close(); logic.setPlantillaSelected(null); }}
            plantilla={logic.plantillaSelected}
            onSubmit={async (data) => { await logic.updatePdfMutation.mutateAsync(data); }}
            isLoading={logic.isUpdatingPdf}
          />

          <UpdateMetadataModal
            open={logic.modales.updateMeta.isOpen}
            onClose={() => { logic.modales.updateMeta.close(); logic.setPlantillaSelected(null); }}
            plantilla={logic.plantillaSelected}
            proyectos={logic.proyectos}
            onSubmit={async (values) => { await logic.updateMetaMutation.mutateAsync({ id: logic.plantillaSelected!.id, data: values }); }}
            isLoading={logic.isUpdatingMeta}
          />
        </>
      )}

      <ConfirmDialog
        controller={logic.modales.confirmDialog}
        onConfirm={logic.handleConfirmAction}
        isLoading={logic.isToggling || logic.isDeleting}
      />
    </PageContainer>
  );
};

export default AdminPlantillas;