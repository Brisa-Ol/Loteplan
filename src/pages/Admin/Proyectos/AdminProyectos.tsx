// Archivo: src/pages/Admin/Proyectos/AdminProyectos.tsx (Corregido)

import React, { useState } from 'react';
import {
  Paper, Typography, Button, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Chip,
  IconButton, Tooltip, Stack, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { proyectoService } from '../../../Services/proyecto.service';
import type { CreateProyectoDto, ProyectoDTO, ProyectoUpdateDTO } from '../../../types/dto/proyecto.dto';
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { SectionTitle } from '../../../components/common/SectionTitle/SectionTitle';
import EditProyectoModal from './components/Modals/EditProyectoModal';
import CreateProyectoModal from './components/Modals/CreateProyectoModal';
import ManageImagesModal from './components/Modals/ManageImagesModal';
import { imagenService } from '../../../Services/imagen.service';

// --- IMPORTS ACTUALIZADOS ---


const AdminProyectos: React.FC = () => {
  const queryClient = useQueryClient();

  // --- ESTADOS DE MODALES ACTUALIZADOS ---
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [manageImagesModalOpen, setManageImagesModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // ❗ CORRECCIÓN 1: Usar ProyectoDTO
  const [selectedProyecto, setSelectedProyecto] = useState<ProyectoDTO | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Query
  // ❗ CORRECCIÓN 1: Usar ProyectoDTO[]
  const { data: proyectos = [], isLoading, error } = useQuery<ProyectoDTO[], Error>({
    queryKey: ['adminAllProjects'],
    queryFn: proyectoService.getAllProyectos
  });

  // --- MUTACIÓN DE CREACIÓN (CORREGIDA) ---
  const createMutation = useMutation({
    // ❗ CORRECCIÓN 1: Usar ProyectoCreateDTO
    mutationFn: async ({ data, image }: { data: CreateProyectoDto; image: File | null }) => {
      // 1. Crear el proyecto
      const createdProyecto = await proyectoService.createProyecto(data);

      // 2. Si hay imagen, subirla usando imagenService
      if (image && createdProyecto?.id) {
        console.log(`Subiendo imagen para el Proyecto ID: ${createdProyecto.id}...`);
        
        // ❗ CORRECCIÓN 4: La llamada al servicio de imagen requiere el 'File'
        // y un objeto DTO como segundo argumento.
        await imagenService.create(
          image,
          { // Este es el DTO CreateImagenDTO
            descripcion: data.descripcion || data.nombre_proyecto,
            id_proyecto: createdProyecto.id,
            id_lote: null
          }
        );
      }
      return createdProyecto;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['projectImages', data.id] });
      }
      setSnackbar({ open: true, message: 'Proyecto creado con éxito', severity: 'success' });
      setCreateModalOpen(false);
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al crear el proyecto',
        severity: 'error'
      });
    }
  });

  // --- MUTACIÓN DE EDICIÓN (NUEVA) ---
  const updateMutation = useMutation({
    // ❗ CORRECCIÓN 3: El ID es 'number', no 'string'
    mutationFn: ({ id, data }: { id: number, data: ProyectoUpdateDTO }) => 
      proyectoService.updateProyecto(id, data), // El servicio espera un 'number'
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
      setSnackbar({ open: true, message: 'Proyecto actualizado con éxito', severity: 'success' });
      setEditModalOpen(false); // Cierra el modal de edición
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al actualizar el proyecto',
        severity: 'error'
      });
    }
  });

  // Mutación para eliminar proyecto (Soft Delete)
  const deleteMutation = useMutation({
    // ❗ CORRECCIÓN 3: El servicio 'deleteProyecto' espera un 'number'
    mutationFn: (id: number) => proyectoService.deleteProyecto(id),
     onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
      setSnackbar({ open: true, message: 'Proyecto desactivado', severity: 'success' });
      setDeleteDialogOpen(false);
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Error al desactivar',
        severity: 'error'
      });
    }
  });

  // --- HANDLERS ---
  
  // ❗ CORRECCIÓN 1: Usar ProyectoCreateDTO
  const handleCreateSubmit = async (data: CreateProyectoDto, image: File | null) => {
    await createMutation.mutateAsync({ data, image });
  };

  // ❗ CORRECCIÓN 3: El ID es 'number'
  const handleEditSubmit = async (id: number, data: ProyectoUpdateDTO) => {
    await updateMutation.mutateAsync({ id, data });
  };

  // Handlers para abrir/cerrar modales
  // ❗ CORRECCIÓN 1: Usar ProyectoDTO
  const handleEditClick = (proyecto: ProyectoDTO) => {
    setSelectedProyecto(proyecto);
    setEditModalOpen(true);
  };
  
  // ❗ CORRECCIÓN 1: Usar ProyectoDTO
  const handleManageImagesClick = (proyecto: ProyectoDTO) => {
    setSelectedProyecto(proyecto);
    setManageImagesModalOpen(true);
  };

  // ❗ CORRECCIÓN 1: Usar ProyectoDTO
  const handleDeleteClick = (proyecto: ProyectoDTO) => {
    setSelectedProyecto(proyecto);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedProyecto) {
      deleteMutation.mutate(selectedProyecto.id);
    }
  };
  
  // Función para cerrar y limpiar la selección
  const handleCloseModals = () => {
    setEditModalOpen(false);
    setManageImagesModalOpen(false);
    setDeleteDialogOpen(false);
    setTimeout(() => setSelectedProyecto(null), 150); 
  };

  // ❗ CORRECCIÓN 1: Tipar con el tipo estricto del DTO
  const getEstadoChip = (estado: ProyectoDTO['estado_proyecto']) => {
     const map: Record<string, { color: any; label: string }> = {
       'En Espera': { color: 'warning', label: 'En Espera' },
       'En proceso': { color: 'success', label: 'En Proceso' },
       'Finalizado': { color: 'default', label: 'Finalizado' },
     };
     return map[estado] || { color: 'default', label: estado };
  };

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="Gestión de Proyectos"
        subtitle="Crea y administra los proyectos de inversión."
      />

      <Paper elevation={2} sx={{ p: 3, overflow: 'hidden' }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <SectionTitle>
            Todos los Proyectos ({proyectos.length})
          </SectionTitle>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            Crear Proyecto
          </Button>
        </Stack>

        <QueryHandler isLoading={isLoading} error={error as Error | null}>
          {proyectos.length === 0 ? (
            <Alert severity="info">No hay proyectos creados todavía.</Alert>
          ) : (
            <TableContainer>
              <Table>
                
                {/* --- SECCIÓN DE TABLA RESTAURADA --- */}
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre del Proyecto</TableCell>
                    <TableCell>Tipo Inversión</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Imágenes</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {proyectos.map((proyecto) => {
                    const estadoChip = getEstadoChip(proyecto.estado_proyecto);

                    return (
                      <TableRow key={proyecto.id} hover>
                        {/* Celda 1: Nombre e ID */}
                        <TableCell>
                          <Typography variant="body1" fontWeight={600}>
                            {proyecto.nombre_proyecto}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {proyecto.id}
                          </Typography>
                        </TableCell>

                        {/* Celda 2: Tipo Inversión */}
                        <TableCell>
                          <Chip
                            label={proyecto.tipo_inversion === 'mensual' ? 'Ahorro' : 'Inversión'}
                            size="small"
                            color={proyecto.tipo_inversion === 'mensual' ? 'primary' : 'secondary'}
                          />
                        </TableCell>

                        {/* Celda 3: Monto */}
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {/* ❗ CORRECCIÓN 5: Convertir string a número antes de formatear */}
                            {proyecto.moneda} ${Number(proyecto.monto_inversion).toLocaleString() || 0}
                          </Typography>
                        </TableCell>

                        {/* Celda 4: Estado */}
                        <TableCell>
                          <Chip
                            label={estadoChip.label}
                            size="small"
                            color={estadoChip.color}
                          />
                        </TableCell>

                        {/* Celda 5: Conteo de Imágenes */}
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={500}>
                            {proyecto.imagenes?.length || 0}
                          </Typography>
                        </TableCell>

                        {/* Celda 6: Acciones */}
                        <TableCell align="center">
                          <Stack direction="row" spacing={0} justifyContent="center">
                            
                            <Tooltip title="Editar Proyecto">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditClick(proyecto)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Gestionar Imágenes">
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => handleManageImagesClick(proyecto)}
                              >
                                <ImageIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Desactivar Proyecto">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(proyecto)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                {/* --- FIN DE SECCIÓN RESTAURADA --- */}

              </Table>
            </TableContainer>
          )}
        </QueryHandler>
      </Paper>

      {/* --- RENDERIZADO DE MODALES --- */}
      
      {/* 1. TU MODAL DE CREACIÓN */}
      <CreateProyectoModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
      />

      {/* 2. TU MODAL DE EDICIÓN */}
      <EditProyectoModal
        open={editModalOpen}
        onClose={handleCloseModals}
        onSubmit={handleEditSubmit}
        proyecto={selectedProyecto}
        isLoading={updateMutation.isPending}
      />

      {/* 3. NUEVO MODAL DE GESTIÓN DE IMÁGENES */}
      {selectedProyecto && (
         <ManageImagesModal
         open={manageImagesModalOpen}
         onClose={handleCloseModals}
         proyecto={selectedProyecto}
       />
      )}

      {/* DIÁLOGO DE CONFIRMACIÓN */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseModals}
      >
        <DialogTitle>Confirmar Desactivación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas desactivar el proyecto{' '}
            <strong>{selectedProyecto?.nombre_proyecto}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModals}>Cancelar</Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
          >
            Desactivar
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminProyectos;