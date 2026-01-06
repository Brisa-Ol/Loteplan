// src/pages/Admin/Plantillas/AdminPlantillas.tsx

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Box, Typography, Paper, Chip, IconButton, Tooltip, 
  Stack, Button, TextField, MenuItem, InputAdornment, useTheme, Switch, CircularProgress, alpha, Divider
} from '@mui/material';
import { 
  Search, Upload as UploadIcon, Add as AddIcon,
  Edit as EditIcon, Delete as DeleteIcon,
  Description as FileIcon
} from '@mui/icons-material'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- DTOs y Servicios ---
import type { ContratoPlantillaDto } from '../../../types/dto/contrato.dto';
import ContratoPlantillaService from '../../../services/contrato-plantilla.service';
import ProyectoService from '../../../services/proyecto.service';

// --- Componentes Comunes ---
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import { useModal } from '../../../hooks/useModal';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';

// ✅ Hook Global
import { useSnackbar } from '../../../context/SnackbarContext';

// --- Modales ---
import CreatePlantillaModal from './components/modals/CreatePlantillaModal';
import UpdatePdfModal from './components/modals/UpdatePdfModal';
import UpdateMetadataModal from './components/modals/UpdateMetadataModal'; 

const AdminPlantillas: React.FC = () => {
  const theme = useTheme(); 
  const queryClient = useQueryClient();
  
  // ✅ Usamos el contexto global solo para mensajes de éxito
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

    showSuccess(msg); // ✅ Llamada global
  };

  // --- MUTACIONES (Sin onError manual) ---

  const createMutation = useMutation({
    mutationFn: ContratoPlantillaService.create,
    onSuccess: (data) => {
        const newItem = (data as any).data; 
        handleSuccess('Plantilla creada correctamente.', createModal.close, newItem?.id);
    },
    // onError eliminado: El error sale automático por httpService
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
    onError: () => confirmDialog.close() // Solo cerramos el modal, la alerta sale sola
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

      <Paper 
        elevation={0} 
        sx={{ 
            p: 2, mb: 3, borderRadius: 2, 
            border: '1px solid', borderColor: 'divider', 
            bgcolor: alpha(theme.palette.background.paper, 0.6)
        }} 
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField 
            placeholder="Buscar por nombre de archivo..." size="small" value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} sx={{ flexGrow: 1 }}
            InputProps={{ 
                startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
                sx: { borderRadius: 2 }
            }}
          />
          <TextField
            select label="Filtrar por Proyecto" size="small" value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)} sx={{ minWidth: 220 }}
            InputProps={{ sx: { borderRadius: 2 } }}
          >
            <MenuItem value="all"><em>Todos los Proyectos</em></MenuItem>
            {proyectos.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre_proyecto}</MenuItem>)}
          </TextField>
          
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 1 }} />

          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={createModal.open}
            sx={{ borderRadius: 2, fontWeight: 700, boxShadow: theme.shadows[2] }}
          >
            Nuevo Contrato
          </Button>
        </Stack>
      </Paper>

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable 
          columns={columns} 
          data={filteredPlantillas} 
          getRowKey={(row) => row.id} 
          
          // ✅ Opacidad automática para inactivos
          isRowActive={(row) => row.activo}
          // ✅ Efecto flash para feedback
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

      {/* ✅ Eliminado el <Snackbar> manual. El provider global lo maneja. */}

    </PageContainer>
  );
};

export default AdminPlantillas;