import React, { useMemo } from 'react';
import { 
  Box, Typography, Chip, IconButton, Tooltip, 
  Stack, Button, MenuItem, useTheme, Switch, CircularProgress, alpha, Avatar, 
  Divider
} from '@mui/material';
import { 
  Upload as UploadIcon, Add as AddIcon,
  Edit as EditIcon, Delete as DeleteIcon,
  Description as FileIcon
} from '@mui/icons-material'; 

import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { FilterBar, FilterSearch, FilterSelect } from '../../../../shared/components/forms/filters/FilterBar';
import { ConfirmDialog } from '../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

import CreatePlantillaModal from './components/modals/CreatePlantillaModal';
import UpdatePdfModal from './components/modals/UpdatePdfModal';
import UpdateMetadataModal from './components/modals/UpdateMetadataModal'; 

import type { ContratoPlantillaDto } from '../../../../core/types/dto/contrato-plantilla.dto';
import { useAdminPlantillas } from '../../hooks/useAdminPlantillas';

const AdminPlantillas: React.FC = () => {
  const theme = useTheme(); 
  const logic = useAdminPlantillas();

  // --- DEFINICIÓN DE COLUMNAS ---
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
        <Chip 
            label={`V${row.version}`} 
            size="small" 
            variant="outlined" 
            sx={{ fontWeight: 800, fontSize: '0.65rem', borderStyle: 'dashed' }} 
        />
      )
    },
    { 
      id: 'id_proyecto', 
      label: 'Asignación', 
      minWidth: 200,
      render: (row) => {
        const proyecto = logic.proyectos.find(p => p.id === row.id_proyecto);
        return row.id_proyecto ? (
          <Chip 
            label={proyecto?.nombre_proyecto?.toUpperCase() || `ID: ${row.id_proyecto}`} 
            color="primary" 
            variant="filled"
            size="small" 
            sx={{ fontWeight: 800, fontSize: '0.6rem' }}
          />
        ) : (
          <Chip label="GLOBAL" size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.6rem' }} />
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
            {!isProcessingThis && (
              <Typography 
                variant="caption" 
                fontWeight={700} 
                sx={{ 
                    minWidth: 55, 
                    color: row.activo ? 'success.main' : 'text.disabled',
                    textTransform: 'uppercase'
                }}
              >
                {row.activo ? 'Activa' : 'Inactiva'}
              </Typography>
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
          <Tooltip title="Editar Metadatos">
            <IconButton 
              size="small" 
              onClick={() => logic.handleOpenUpdateMeta(row)}
              disabled={logic.isToggling || logic.isDeleting}
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Actualizar Archivo PDF">
            <IconButton 
              size="small" 
              onClick={() => logic.handleOpenUpdatePdf(row)} 
              disabled={!row.activo || logic.isToggling || logic.isDeleting} 
              sx={{ color: 'info.main', bgcolor: alpha(theme.palette.info.main, 0.05), '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.15) } }}
            >
              <UploadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar Plantilla">
            <IconButton 
              size="small" 
              onClick={() => logic.handleDelete(row)} 
              disabled={logic.isToggling || logic.isDeleting}
              sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.15) } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [logic, theme]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader 
        title="Gestión de Plantillas" 
        subtitle="Control de versiones de contratos legales y documentos base para inversiones." 
      />

      {/* FILTROS */}
      <FilterBar>
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
            sx={{ minWidth: 240 }}
        >
            <MenuItem value="all">Todos los Proyectos</MenuItem>
            <Divider />
            {logic.proyectos.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
            ))}
        </FilterSelect>

        <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={logic.modales.create.open}
            sx={{ fontWeight: 700, px: 3, whiteSpace: 'nowrap' }}
        >
            Nueva Plantilla
        </Button>
      </FilterBar>

      {/* TABLA DE DATOS */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
        <DataTable 
          columns={columns} 
          data={logic.filteredPlantillas} 
          getRowKey={(row) => row.id} 
          
          // ✅ INTEGRACIÓN: Control de opacidad y switch de filtrado rápido
          isRowActive={(row) => row.activo}
          showInactiveToggle={true}
          inactiveLabel="Inactivas"
          
          highlightedRowId={logic.highlightedId}
          emptyMessage="No se encontraron plantillas registradas."
          pagination 
          defaultRowsPerPage={10} 
        />
      </QueryHandler>

      {/* MODALES */}
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