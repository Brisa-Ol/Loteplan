// src/pages/Admin/Plantillas/AdminPlantillas.tsx

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Box, Typography, Chip, IconButton, Tooltip, 
  Stack, Button, MenuItem, useTheme, Switch, CircularProgress, alpha 
} from '@mui/material';
import { 
  Upload as UploadIcon, Add as AddIcon,
  Edit as EditIcon, Delete as DeleteIcon,
  Description as FileIcon
} from '@mui/icons-material'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


// --- Componentes Comunes ---
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { useModal } from '../../../../shared/hooks/useModal';
import { useConfirmDialog } from '../../../../shared/hooks/useConfirmDialog';

// --- Modales ---
import CreatePlantillaModal from './components/modals/CreatePlantillaModal';
import UpdatePdfModal from './components/modals/UpdatePdfModal';
import UpdateMetadataModal from './components/modals/UpdateMetadataModal'; 
import useSnackbar from '../../../../shared/hooks/useSnackbar';
import ContratoPlantillaService from '../../../../core/api/services/contrato-plantilla.service';
import type { ContratoPlantillaDto } from '../../../../core/types/dto/contrato-plantilla.dto';
import ProyectoService from '../../../../core/api/services/proyecto.service';
import { FilterBar, FilterSearch, FilterSelect } from '../../../../shared/components/forms/filters/FilterBar/FilterBar';
import { ConfirmDialog } from '../../../../shared/components/domain/modals/ConfirmDialog/ConfirmDialog';

const AdminPlantillas: React.FC = () => {
  const theme = useTheme(); 
  const queryClient = useQueryClient();
  const { showSuccess } = useSnackbar();

  // 1. Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [plantillaSelected, setPlantillaSelected] = useState<ContratoPlantillaDto | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const initialStatusRef = useRef<Record<number, boolean>>({});

  // 2. Modales Hooks
  const createModal = useModal();
  const updatePdfModal = useModal();
  const updateMetaModal = useModal();
  const confirmDialog = useConfirmDialog();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const proyectoId = params.get('proyecto');
    if (proyectoId) setFilterProject(proyectoId);
  }, []);

  // 3. Data Fetching
  const { data: plantillas = [], isLoading, error } = useQuery<ContratoPlantillaDto[]>({
    queryKey: ['adminPlantillas'],
    queryFn: async () => (await ContratoPlantillaService.findAll()).data,
    staleTime: 1000 * 60 * 2 
  });

  const { data: proyectos = [] } = useQuery({
    queryKey: ['adminProyectosSelect'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data,
    staleTime: 1000 * 60 * 30 
  });

  useEffect(() => {
    if (plantillas.length > 0) {
      plantillas.forEach(p => {
        if (initialStatusRef.current[p.id] === undefined) {
          initialStatusRef.current[p.id] = p.activo;
        }
      });
    }
  }, [plantillas]);

  // 4. Lógica de Filtrado
  const filteredPlantillas = useMemo(() => {
    const term = searchTerm.toLowerCase();
    
    const filtered = plantillas.filter(plantilla => {
      const matchesSearch = plantilla.nombre_archivo.toLowerCase().includes(term);
      const matchesProject = filterProject === 'all' || plantilla.id_proyecto === Number(filterProject);
      return matchesSearch && matchesProject;
    });

    return filtered.sort((a, b) => {
      const statusA = initialStatusRef.current[a.id] ?? a.activo;
      const statusB = initialStatusRef.current[b.id] ?? b.activo;

      if (statusA !== statusB) {
        return statusA ? -1 : 1;
      }
      return a.nombre_archivo.localeCompare(b.nombre_archivo);
    });
  }, [plantillas, searchTerm, filterProject]);

  // 5. Helper de Éxito Refactorizado
  const handleSuccess = (msg: string, modalClose?: () => void, updatedId?: number) => {
    queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
    if (modalClose) modalClose();
    setPlantillaSelected(null);
    
    if (updatedId) {
        setHighlightedId(updatedId);
        setTimeout(() => setHighlightedId(null), 2500);
    }

    showSuccess(msg);
  };

  // --- MUTACIONES ---

  const createMutation = useMutation({
    mutationFn: ContratoPlantillaService.create,
    onSuccess: (data) => {
        const newItem = (data as any).data; 
        handleSuccess('Plantilla creada correctamente.', createModal.close, newItem?.id);
    },
  });

  const updatePdfMutation = useMutation({
    mutationFn: ContratoPlantillaService.updatePdf,
    onSuccess: (_, variables) => handleSuccess('PDF actualizado y hash recalculado.', updatePdfModal.close, variables.id),
  });

  const updateMetaMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<ContratoPlantillaDto> }) => 
      ContratoPlantillaService.update(id, data),
    onSuccess: (_, variables) => handleSuccess('Datos actualizados.', updateMetaModal.close, variables.id),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (plantilla: ContratoPlantillaDto) => 
      ContratoPlantillaService.toggleActive(plantilla.id, !plantilla.activo),
    onSuccess: (_, plantilla) => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
      confirmDialog.close();
      
      setHighlightedId(plantilla.id);
      setTimeout(() => setHighlightedId(null), 2500);
      
      showSuccess(plantilla.activo ? 'Plantilla ocultada' : 'Plantilla activada');
    },
    onError: () => confirmDialog.close()
  });

  const softDeleteMutation = useMutation({
    mutationFn: ContratoPlantillaService.softDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlantillas'] });
      confirmDialog.close();
      showSuccess('Plantilla eliminada (enviada a papelera).');
    },
    onError: () => confirmDialog.close()
  });

  // Handlers
  const handleToggleActive = useCallback((plantilla: ContratoPlantillaDto) => {
    confirmDialog.confirm('toggle_plantilla_status', plantilla);
  }, [confirmDialog]);

  const handleDelete = useCallback((plantilla: ContratoPlantillaDto) => {
    confirmDialog.confirm('delete_plantilla', plantilla);
  }, [confirmDialog]);

  const handleConfirmAction = () => {
    if (!confirmDialog.data) return;
    
    if (confirmDialog.action === 'toggle_plantilla_status') {
      toggleActiveMutation.mutate(confirmDialog.data);
    }
    else if (confirmDialog.action === 'delete_plantilla') {
      softDeleteMutation.mutate(confirmDialog.data.id);
    }
  };

  const handleOpenUpdatePdf = useCallback((row: ContratoPlantillaDto) => {
    setPlantillaSelected(row);
    updatePdfModal.open(); 
  }, [updatePdfModal]);

  const handleOpenUpdateMeta = useCallback((row: ContratoPlantillaDto) => {
    setPlantillaSelected(row);
    updateMetaModal.open();
  }, [updateMetaModal]);

  // 6. Columnas
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
          label={proyectos.find(p => p.id === row.id_proyecto)?.nombre_proyecto || `ID: ${row.id_proyecto}`} 
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
      id: 'visibilidad',
      label: 'Estado',
      align: 'center',
      render: (row) => {
        const isProcessingThis = toggleActiveMutation.isPending && confirmDialog.data?.id === row.id;

        return (
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
            {isProcessingThis ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
                <Tooltip title={row.activo ? 'Desactivar Plantilla' : 'Activar Plantilla'}>
                    <Switch
                        checked={row.activo}
                        onChange={() => handleToggleActive(row)}
                        color="success"
                        size="small"
                        disabled={toggleActiveMutation.isPending || softDeleteMutation.isPending}
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: theme.palette.success.main,
                                '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.1) },
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: theme.palette.success.main,
                            },
                        }}
                    />
                </Tooltip>
            )}
            
            {!isProcessingThis && (
              <Typography 
                variant="caption" 
                color={row.activo ? 'success.main' : 'text.disabled'}
                fontWeight={600}
                sx={{ minWidth: 50 }}
              >
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
              onClick={() => handleOpenUpdateMeta(row)}
              disabled={toggleActiveMutation.isPending || softDeleteMutation.isPending}
              sx={{ '&:hover': { color: theme.palette.primary.main } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Actualizar PDF">
            <IconButton 
              size="small" 
              onClick={() => handleOpenUpdatePdf(row)} 
              disabled={!row.activo || toggleActiveMutation.isPending || softDeleteMutation.isPending} 
              sx={{ color: theme.palette.info.main, '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) } }}
            >
              <UploadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton 
              size="small" 
              onClick={() => handleDelete(row)} 
              disabled={toggleActiveMutation.isPending || softDeleteMutation.isPending}
              sx={{ color: theme.palette.error.main, '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [proyectos, theme, toggleActiveMutation.isPending, softDeleteMutation.isPending, confirmDialog.data, handleToggleActive, handleDelete, handleOpenUpdateMeta, handleOpenUpdatePdf]);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Gestión de Plantillas" subtitle="Administración de documentos base y contratos legales." />

      {/* ✅ FILTROS CON FILTERBAR */}
      <FilterBar>
        <FilterSearch 
            placeholder="Buscar por nombre de archivo..." 
            value={searchTerm} 
            onSearch={setSearchTerm} 
            sx={{ flexGrow: 1 }}
        />
        
        <FilterSelect
            label="Filtrar por Proyecto"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            sx={{ minWidth: 220 }}
        >
            <MenuItem value="all"><em>Todos los Proyectos</em></MenuItem>
            {proyectos.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>
            ))}
        </FilterSelect>

        <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={createModal.open}
            sx={{ fontWeight: 700, boxShadow: theme.shadows[2], whiteSpace: 'nowrap' }}
        >
            Nuevo Contrato
        </Button>
      </FilterBar>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable 
          columns={columns} 
          data={filteredPlantillas} 
          getRowKey={(row) => row.id} 
          isRowActive={(row) => row.activo}
          highlightedRowId={highlightedId}
          pagination 
          defaultRowsPerPage={10} 
          emptyMessage="No se encontraron plantillas con los filtros actuales."
        />
      </QueryHandler>

      {/* Modales */}
      <CreatePlantillaModal 
        open={createModal.isOpen} 
        onClose={createModal.close} 
        onSubmit={async (data) => { await createMutation.mutateAsync(data); }} 
        isLoading={createMutation.isPending} 
        proyectos={proyectos} 
      />
      
      <UpdatePdfModal 
        open={updatePdfModal.isOpen} 
        onClose={() => { updatePdfModal.close(); setPlantillaSelected(null); }} 
        plantilla={plantillaSelected} 
        onSubmit={async (data) => { await updatePdfMutation.mutateAsync(data); }} 
        isLoading={updatePdfMutation.isPending} 
      />

      {plantillaSelected && updateMetaModal.isOpen && (
         <UpdateMetadataModal 
           open={updateMetaModal.isOpen} 
           onClose={() => { updateMetaModal.close(); setPlantillaSelected(null); }} 
           plantilla={plantillaSelected} 
           proyectos={proyectos} 
           onSubmit={async (values) => { await updateMetaMutation.mutateAsync({ id: plantillaSelected.id, data: values }); }} 
           isLoading={updateMetaMutation.isPending} 
         />
      )}

      {/* Modal de Confirmación */}
      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmAction}
        isLoading={toggleActiveMutation.isPending || softDeleteMutation.isPending}
      />

    </PageContainer>
  );
};

export default AdminPlantillas;