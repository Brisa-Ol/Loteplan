import React, { useMemo } from 'react';
import { 
  Box, Typography, Chip, IconButton, Tooltip, 
  Stack, Button, MenuItem, useTheme, Switch, CircularProgress, alpha 
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
import { FilterBar, FilterSearch, FilterSelect } from '../../../../shared/components/forms/filters/FilterBar/FilterBar';
import { ConfirmDialog } from '../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

import CreatePlantillaModal from './components/modals/CreatePlantillaModal';
import UpdatePdfModal from './components/modals/UpdatePdfModal';
import UpdateMetadataModal from './components/modals/UpdateMetadataModal'; 


import type { ContratoPlantillaDto } from '../../../../core/types/dto/contrato-plantilla.dto';
import { useAdminPlantillas } from '../../hooks/useAdminPlantillas';

const AdminPlantillas: React.FC = () => {
  const theme = useTheme(); 
  const logic = useAdminPlantillas(); // Hook

  // --- Columnas ---
  const columns = useMemo<DataTableColumn<ContratoPlantillaDto>[]>(() => [
    { id: 'id', label: 'ID', minWidth: 50 },
    { 
      id: 'nombre_archivo', label: 'Nombre / Archivo', minWidth: 250,
      render: (row) => (
        <Stack direction="row" spacing={2} alignItems="center">
            <FileIcon color={row.activo ? 'action' : 'disabled'} />
            <Box>
            <Typography variant="body2" fontWeight={600} color={row.activo ? 'text.primary' : 'text.disabled'}>
                {row.nombre_archivo}
            </Typography>
            <Tooltip title={row.hash_archivo_original}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: theme.palette.text.secondary }}>
                Hash: {row.hash_archivo_original?.substring(0, 8)}...
                </Typography>
            </Tooltip>
            </Box>
        </Stack>
      )
    },
    { 
      id: 'version', label: 'Versión', align: 'center',
      render: (row) => <Chip label={`v${row.version}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
    },
    { 
      id: 'id_proyecto', label: 'Proyecto Asignado', minWidth: 180,
      render: (row) => row.id_proyecto ? (
        <Chip 
          label={logic.proyectos.find(p => p.id === row.id_proyecto)?.nombre_proyecto || `ID: ${row.id_proyecto}`} 
          color="primary" 
          variant="outlined"
          size="small" 
          sx={{ fontWeight: 600, border: '1px solid' }}
        />
      ) : (
        <Chip label="Global" size="small" variant="outlined" color="default" />
      )
    },
    {
      id: 'visibilidad', label: 'Estado', align: 'center',
      render: (row) => {
        const isProcessingThis = logic.isToggling && logic.modales.confirmDialog.data?.id === row.id;

        return (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            {isProcessingThis ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
                <Tooltip title={row.activo ? 'Desactivar Plantilla' : 'Activar Plantilla'}>
                    <Switch
                        checked={row.activo}
                        onChange={() => logic.handleToggleActive(row)}
                        color="success"
                        size="small"
                        disabled={logic.isToggling || logic.isDeleting}
                    />
                </Tooltip>
            )}
            {!isProcessingThis && (
              <Typography variant="caption" color={row.activo ? 'success.main' : 'text.disabled'} fontWeight={600} sx={{ minWidth: 50 }}>
                {row.activo ? 'Activa' : 'Inactiva'}
              </Typography>
            )}
          </Stack>
        );
      }
    },
    {
      id: 'actions', label: 'Acciones', align: 'right', minWidth: 150,
      render: (row) => (
        <Stack direction="row" spacing={0} justifyContent="flex-end">
          <Tooltip title="Editar Datos">
            <IconButton 
              size="small" 
              onClick={() => logic.handleOpenUpdateMeta(row)}
              disabled={logic.isToggling || logic.isDeleting}
              sx={{ '&:hover': { color: theme.palette.primary.main } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Actualizar PDF">
            <IconButton 
              size="small" 
              onClick={() => logic.handleOpenUpdatePdf(row)} 
              disabled={!row.activo || logic.isToggling || logic.isDeleting} 
              sx={{ color: theme.palette.info.main, '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) } }}
            >
              <UploadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton 
              size="small" 
              onClick={() => logic.handleDelete(row)} 
              disabled={logic.isToggling || logic.isDeleting}
              sx={{ color: theme.palette.error.main, '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [logic, theme]);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Gestión de Plantillas" subtitle="Administración de documentos base y contratos legales." />

      {/* FILTROS */}
      <FilterBar>
        <FilterSearch 
            placeholder="Buscar por nombre de archivo..." 
            value={logic.searchTerm} 
            onSearch={logic.setSearchTerm} 
            sx={{ flexGrow: 1 }}
        />
        
        <FilterSelect
            label="Filtrar por Proyecto"
            value={logic.filterProject}
            onChange={(e) => logic.setFilterProject(e.target.value)}
            sx={{ minWidth: 220 }}
        >
            <MenuItem value="all"><em>Todos los Proyectos</em></MenuItem>
            {logic.proyectos.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
            ))}
        </FilterSelect>

        <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={logic.modales.create.open}
            sx={{ fontWeight: 700, boxShadow: theme.shadows[2], whiteSpace: 'nowrap' }}
        >
            Nuevo Contrato
        </Button>
      </FilterBar>

      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
        <DataTable 
          columns={columns} 
          data={logic.filteredPlantillas} 
          getRowKey={(row) => row.id} 
          
          // ✨ Props UX
          isRowActive={(row) => row.activo}
          highlightedRowId={logic.highlightedId}
          
          pagination 
          defaultRowsPerPage={10} 
          emptyMessage="No se encontraron plantillas con los filtros actuales."
        />
      </QueryHandler>

      {/* Modales */}
      <CreatePlantillaModal 
        open={logic.modales.create.isOpen} 
        onClose={logic.modales.create.close} 
        onSubmit={async (data) => { await logic.createMutation.mutateAsync(data); }} 
        isLoading={logic.isCreating} 
        proyectos={logic.proyectos} 
      />
      
      <UpdatePdfModal 
        open={logic.modales.updatePdf.isOpen} 
        onClose={() => { logic.modales.updatePdf.close(); logic.setPlantillaSelected(null); }} 
        plantilla={logic.plantillaSelected} 
        onSubmit={async (data) => { await logic.updatePdfMutation.mutateAsync(data); }} 
        isLoading={logic.isUpdatingPdf} 
      />

      {logic.plantillaSelected && logic.modales.updateMeta.isOpen && (
         <UpdateMetadataModal 
           open={logic.modales.updateMeta.isOpen} 
           onClose={() => { logic.modales.updateMeta.close(); logic.setPlantillaSelected(null); }} 
           plantilla={logic.plantillaSelected} 
           proyectos={logic.proyectos} 
           onSubmit={async (values) => { await logic.updateMetaMutation.mutateAsync({ id: logic.plantillaSelected!.id, data: values }); }} 
           isLoading={logic.isUpdatingMeta} 
         />
      )}

      {/* Modal de Confirmación */}
      <ConfirmDialog 
        controller={logic.modales.confirmDialog}
        onConfirm={logic.handleConfirmAction}
        isLoading={logic.isToggling || logic.isDeleting}
      />

    </PageContainer>
  );
};

export default AdminPlantillas;