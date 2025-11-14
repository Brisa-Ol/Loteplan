import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, TableContainer, Table,
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

// --- IMPORTS ACTUALIZADOS ---
import proyectoService from '../../Services/proyecto.service';
// ❗ Importamos el servicio de ADMIN para crear/borrar imágenes
import adminImagenService from '../../Services/adminImagen.service'; 
// Asumo que tu DTO se llama ProyectoDTO
import type { ProyectoDTO, CreateProyectoDTO, UpdateProyectoDTO } from '../../types/dto/proyecto.dto';

import { PageContainer, PageHeader, SectionTitle } from '../../components/common';
import { QueryHandler } from '../../components/common/QueryHandler/QueryHandler';

// --- IMPORTAMOS LOS 3 MODALES ---
import CreateProyectoModal from '../../components/Admin/Proyectos/CreateProyectoModal';
// 2. Importamos tu modal de Edición
import EditProyectoModal from '../../components/Admin/Proyectos/EditProyectoModal';
// 3. Importamos el NUEVO modal de Gestión de Imágenes
import ManageImagesModal from '../../components/Admin/Proyectos/ManageImagesModal'; 

const AdminProyectos: React.FC = () => {
  const queryClient = useQueryClient();

  // --- ESTADOS DE MODALES ACTUALIZADOS ---
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [manageImagesModalOpen, setManageImagesModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState<ProyectoDTO | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Query (Sin cambios)
  const { data: proyectos = [], isLoading, error } = useQuery<ProyectoDTO[], Error>({
    queryKey: ['adminAllProjects'],
    queryFn: proyectoService.getAllProyectos
  });

  // --- MUTACIÓN DE CREACIÓN (CORREGIDA) ---
  const createMutation = useMutation({
    mutationFn: async ({ data, image }: { data: CreateProyectoDTO; image: File | null }) => {
      // 1. Crear el proyecto
      const createdProyecto = await proyectoService.createProyecto(data);

      // 2. Si hay imagen, subirla usando adminImagenService
      if (image && createdProyecto?.id) {
        console.log(`Subiendo imagen para el Proyecto ID: ${createdProyecto.id}...`);
        
        // ❗ USA EL SERVICIO CORRECTO
        await adminImagenService.create(
          image,
          data.descripcion || data.nombre_proyecto, // Usamos la descripción o el nombre como desc. de imagen
          createdProyecto.id, // id_proyecto
          null // id_lote
        );
      }
      return createdProyecto;
    },
    onSuccess: (data) => {
      // Invalidamos para refrescar la tabla
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
      // Si subimos imagen, también invalidamos las imágenes de ese proyecto (para el modal de gestión)
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
    // Tu modal EditProyectoModal pasa (id, data)
    mutationFn: ({ id, data }: { id: string, data: UpdateProyectoDTO }) => 
      proyectoService.updateProyecto(id, data),
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

  // Mutación para eliminar proyecto (Sin cambios)
  const deleteMutation = useMutation({
    mutationFn: (id: number) => proyectoService.deleteProyecto(id.toString()),
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
  
  // Este handler ya es compatible con tu CreateProyectoModal (que usa Formik)
  const handleCreateSubmit = async (data: CreateProyectoDTO, image: File | null) => {
    await createMutation.mutateAsync({ data, image });
  };

  // Este handler es compatible con tu EditProyectoModal
  const handleEditSubmit = async (id: string, data: UpdateProyectoDTO) => {
    await updateMutation.mutateAsync({ id, data });
  };

  // Handlers para abrir/cerrar modales
  const handleEditClick = (proyecto: ProyectoDTO) => {
    setSelectedProyecto(proyecto);
    setEditModalOpen(true);
  };
  
  const handleManageImagesClick = (proyecto: ProyectoDTO) => {
    setSelectedProyecto(proyecto);
    setManageImagesModalOpen(true);
  };

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
    // Retrasamos un poco para que el modal se cierre antes de que el dato desaparezca
    setTimeout(() => setSelectedProyecto(null), 150); 
  };

  const getEstadoChip = (estado: string) => {
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
                            {proyecto.moneda} ${proyecto.monto_inversion?.toLocaleString() || 0}
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