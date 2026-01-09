// src/pages/Client/Proyectos/AdminProyectos.tsx

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Chip, IconButton, Stack, Tooltip,
  TextField, MenuItem, InputAdornment, Switch,
  alpha, Avatar, useTheme
} from '@mui/material';
import {
  Add, Search, Edit,
  Visibility as VisibilityIcon,
  MonetizationOn as MonetizationOnIcon,
  Image as ImageIcon,
  PlayArrow,
  Apartment as ApartmentIcon,
} from '@mui/icons-material';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProyectoDto, ProyectoDto, UpdateProyectoDto } from '../../../types/dto/proyecto.dto';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';

import { useSnackbar } from '../../../context/SnackbarContext'; 
import { useModal } from '../../../hooks/useModal';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog/ConfirmDialog';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import ProyectoService from '../../../services/proyecto.service';
import CuotaMensualService from '../../../services/cuotaMensual.service';

// Modales
import CreateProyectoModal from './components/modals/CreateProyectoModal';
import ConfigCuotasModal from './components/modals/ConfigCuotasModal';
import EditProyectoModal from './components/modals/EditProyectoModal';
import ProjectLotesModal from './components/modals/ProjectLotesModal';
import ManageImagesModal from './components/modals/ManageImagesModal';

type TipoInversionFilter = 'all' | 'mensual' | 'directo';

const AdminProyectos: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  // --- HOOKS DE MODALES ---
  const createModal = useModal();
  const cuotasModal = useModal();
  const lotesModal = useModal();
  const editModal = useModal();
  const imagesModal = useModal();
  const confirmDialog = useConfirmDialog();
  
  const [selectedProject, setSelectedProject] = useState<ProyectoDto | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<TipoInversionFilter>('all');

  const initialStatusRef = useRef<Record<number, boolean>>({});

  // --- QUERIES ---
  const { data: proyectos = [], isLoading, error } = useQuery({
    queryKey: ['adminProyectos'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data
  });

  useEffect(() => {
    if (proyectos.length > 0) {
      proyectos.forEach(p => {
        if (initialStatusRef.current[p.id] === undefined) {
          initialStatusRef.current[p.id] = p.activo;
        }
      });
    }
  }, [proyectos]);

  // --- MUTACIONES ---

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateProyectoDto }) => ProyectoService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      editModal.close(); 
      // Pequeño delay para limpiar el state solo después de que cierre el modal
      setTimeout(() => setSelectedProject(null), 300);
      setHighlightedId(variables.id); 
      showSuccess('Proyecto actualizado correctamente');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => ProyectoService.update(id, { activo }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      confirmDialog.close();
      setHighlightedId(variables.id);
      setTimeout(() => setHighlightedId(null), 2500);
      showSuccess(variables.activo ? 'Proyecto ahora es visible' : 'Proyecto ocultado');
    }
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.startProcess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      confirmDialog.close();
      showSuccess('Proceso de cobros iniciado');
    }
  });

  // --- HANDLERS ---

  const handleCreateSubmit = useCallback(async (data: any, image: File | null) => {
    try {
        // 1. Crear Proyecto
        const proyectoData: CreateProyectoDto = {
            nombre_proyecto: data.nombre_proyecto,
            descripcion: data.descripcion,
            tipo_inversion: data.tipo_inversion,
            plazo_inversion: data.plazo_inversion,
            forma_juridica: data.forma_juridica,
            monto_inversion: data.monto_inversion,
            moneda: data.moneda,
            suscripciones_minimas: data.suscripciones_minimas,
            obj_suscripciones: data.obj_suscripciones,
            fecha_inicio: data.fecha_inicio,
            fecha_cierre: data.fecha_cierre,
            latitud: data.latitud || null,
            longitud: data.longitud || null,
        };

        const resProyecto = await ProyectoService.create(proyectoData);
        const nuevoId = resProyecto.data.id;

        // 2. Crear Cuota
        if (data.tipo_inversion === 'mensual') {
            await CuotaMensualService.create({
                id_proyecto: nuevoId,
                nombre_proyecto: data.nombre_proyecto,
                total_cuotas_proyecto: data.plazo_inversion,
                nombre_cemento_cemento: data.nombre_cemento_cemento,
                valor_cemento_unidades: data.valor_cemento_unidades,
                valor_cemento: data.valor_cemento,
                porcentaje_plan: data.porcentaje_plan,
                porcentaje_administrativo: data.porcentaje_administrativo / 100, 
                porcentaje_iva: data.porcentaje_iva / 100
            });
        }

        // 3. Subir Imagen
        if (image) {
             console.log("Imagen lista para subir:", image.name);
             // await ImagenService.uploadProyectoImagen(nuevoId, image);
        }

        queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
        createModal.close();
        setHighlightedId(nuevoId);
        showSuccess('Proyecto creado y configurado exitosamente.');

    } catch (error: any) {
        console.error(error);
        const msg = error.response?.data?.message || 'Error al crear el proyecto';
        showError(msg);
    }
  }, [createModal, queryClient, showSuccess, showError]);

  const handleUpdateSubmit = useCallback(async (id: number, data: UpdateProyectoDto) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  // HANDLER: Abre los modales de forma segura
  const handleAction = useCallback((proyecto: ProyectoDto, action: 'edit' | 'images' | 'cuotas' | 'lotes', e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Evita que clicks burbujeen a la fila

    // 1. Setear proyecto
    setSelectedProject(proyecto);
    
    // 2. Abrir modal correspondiente
    if (action === 'edit') editModal.open();
    else if (action === 'images') imagesModal.open();
    else if (action === 'cuotas') cuotasModal.open();
    else if (action === 'lotes') lotesModal.open();
  }, [editModal, imagesModal, cuotasModal, lotesModal]);

  const handleConfirmAction = useCallback(() => {
    if (!confirmDialog.data) return;
    const project = confirmDialog.data as ProyectoDto;
    
    if (confirmDialog.action === 'start_project_process') {
      startMutation.mutate(project.id);
    } 
    else if (confirmDialog.action === 'toggle_project_visibility') {
      toggleActiveMutation.mutate({ id: project.id, activo: !project.activo });
    }
  }, [confirmDialog, startMutation, toggleActiveMutation]);

  // --- FILTRADO ---
  const filteredProyectos = useMemo(() => {
    return proyectos.filter(p => {
      const matchesSearch = p.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterTipo === 'all' || p.tipo_inversion === filterTipo;
      return matchesSearch && matchesType;
    });
  }, [proyectos, searchTerm, filterTipo]);

  // --- COLUMNAS ---
  const columns = useMemo<DataTableColumn<ProyectoDto>[]>(() => [
    {
      id: 'proyecto',
      label: 'Proyecto / ID',
      render: (p) => (
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <ApartmentIcon />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>{p.nombre_proyecto}</Typography>
            <Typography variant="caption" color="text.secondary">ID: {p.id}</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'tipo',
      label: 'Tipo',
      render: (p) => <Chip label={p.tipo_inversion === 'mensual' ? 'Ahorro' : 'Directo'} size="small" color={p.tipo_inversion === 'mensual' ? 'primary' : 'default'} />
    },
    {
        id: 'finanzas',
        label: 'Inversión',
        render: (p) => <Typography variant="body2" fontWeight={600}>{p.moneda} {Number(p.monto_inversion).toLocaleString()}</Typography>
    },
    {
      id: 'visibilidad',
      label: 'Visibilidad',
      align: 'center',
      render: (p) => (
        <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
          <Switch 
            checked={p.activo} 
            onChange={() => confirmDialog.confirm('toggle_project_visibility', p)} 
            size="small" 
            color="success" 
            disabled={toggleActiveMutation.isPending}
          />
          <Typography variant="caption" fontWeight={600} color={p.activo ? 'success.main' : 'text.disabled'}>
            {p.activo ? 'Visible' : 'Oculto'}
          </Typography>
        </Stack>
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (p) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          {/* Se pasa el evento 'e' para detener propagación */}
          <Tooltip title="Imágenes"><IconButton onClick={(e) => handleAction(p, 'images', e)} size="small" color="primary"><ImageIcon fontSize="small" /></IconButton></Tooltip>
          
          {p.tipo_inversion === 'mensual' && (
            <Tooltip title="Ver/Editar Cuotas"><IconButton onClick={(e) => handleAction(p, 'cuotas', e)} size="small"><MonetizationOnIcon fontSize="small" /></IconButton></Tooltip>
          )}
          
          {p.tipo_inversion === 'mensual' && p.estado_proyecto === 'En Espera' && (
            <Tooltip title="Iniciar Cobros"><IconButton onClick={() => confirmDialog.confirm('start_project_process', p)} size="small" sx={{ color: "success.main" }}><PlayArrow fontSize="small" /></IconButton></Tooltip>
          )}
          
          <Tooltip title="Editar"><IconButton onClick={(e) => handleAction(p, 'edit', e)} size="small"><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Lotes"><IconButton onClick={(e) => handleAction(p, 'lotes', e)} size="small" color="info"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
      )
    }
  ], [theme, toggleActiveMutation.isPending, confirmDialog, handleAction]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader title="Gestión de Proyectos" subtitle="Administra el catálogo de inversiones y estados." />

      <Paper elevation={0} sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <TextField 
          placeholder="Buscar..." size="small" sx={{ flexGrow: 1 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} 
        />
        <TextField select label="Tipo" size="small" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value as TipoInversionFilter)} sx={{ minWidth: 150 }}>
          <MenuItem value="all">Todos</MenuItem>
          <MenuItem value="directo">Directo</MenuItem>
          <MenuItem value="mensual">Ahorro</MenuItem>
        </TextField>
        <Button variant="contained" startIcon={<Add />} onClick={createModal.open}>Nuevo Proyecto</Button>
      </Paper>

      <QueryHandler isLoading={isLoading} error={error as Error}>
          <DataTable 
            columns={columns} 
            data={filteredProyectos} 
            getRowKey={(p) => p.id} 
            highlightedRowId={highlightedId} 
            pagination={true} 
          />
      </QueryHandler>

      {/* --- MODAL DE CREACIÓN --- */}
      <CreateProyectoModal
        {...createModal.modalProps} 
        onSubmit={handleCreateSubmit}
      />

      {/* --- MODALES DE EDICIÓN --- */}
      {/* Se renderizan SOLO si hay proyecto seleccionado para evitar errores de null */}
      {selectedProject && (
        <>
          <ConfigCuotasModal 
            open={cuotasModal.isOpen}
            onClose={cuotasModal.close} // ✅ CORREGIDO
            proyecto={selectedProject} 
          />
          
          <EditProyectoModal 
            open={editModal.isOpen}
            onClose={editModal.close} // ✅ CORREGIDO
            proyecto={selectedProject} 
            onSubmit={handleUpdateSubmit} 
            isLoading={updateMutation.isPending} 
          />
          
          <ProjectLotesModal 
            open={lotesModal.isOpen}
            onClose={lotesModal.close} // ✅ CORREGIDO
            proyecto={selectedProject} 
          />
          
          <ManageImagesModal 
            open={imagesModal.isOpen}
            onClose={imagesModal.close} // ✅ CORREGIDO
            proyecto={selectedProject} 
          />
        </>
      )}

      <ConfirmDialog 
        controller={confirmDialog}
        onConfirm={handleConfirmAction}
        isLoading={startMutation.isPending || toggleActiveMutation.isPending}
      />

    </PageContainer>
  );
};

export default AdminProyectos;