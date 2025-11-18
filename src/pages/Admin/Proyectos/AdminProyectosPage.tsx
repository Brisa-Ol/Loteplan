// src/pages/Admin/Proyectos/ProyectosPage.tsx
import React, { useState } from 'react';
import {
  Box, Button, Paper, Typography, Chip, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, Alert, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import type { ProyectoDTO, CreateProyectoDto, ProyectoUpdateDTO } from '../../../types/dto/proyecto.dto';
import { proyectoService } from '../../../Services/proyecto.service';
import { imagenService } from '../../../Services/imagen.service';

import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import EditProyectoModal from './components/Modals/EditProyectoModal';
import CreateProyectoModal from './components/Modals/CreateProyectoModal';
import ManageImagesModal from './components/Modals/ManageImagesModal';
import ConfigCuotasModal from './components/Modals/ConfigCuotasModal';

const AdminProyectosPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados de modales
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [imagesModalOpen, setImagesModalOpen] = useState(false);
  const [cuotasModalOpen, setCuotasModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState<ProyectoDTO | null>(null);

  // Query: Obtener todos los proyectos
  const { data: proyectos = [], isLoading, error } = useQuery<ProyectoDTO[], Error>({
    queryKey: ['adminAllProjects'],
    queryFn: proyectoService.getAllProyectos,
  });

  // Estado para mostrar diálogo después de crear proyecto
  const [newlyCreatedProyecto, setNewlyCreatedProyecto] = useState<ProyectoDTO | null>(null);

  // Mutation: Crear proyecto
  const createMutation = useMutation({
    mutationFn: async (data: { proyecto: CreateProyectoDto; image: File | null }) => {
      // 1. Crear el proyecto
      const nuevoProyecto = await proyectoService.createProyecto(data.proyecto);
      
      // 2. Subir imagen si existe
      if (data.image) {
        await imagenService.create(data.image, {
          descripcion: `Imagen principal de ${nuevoProyecto.nombre_proyecto}`,
          id_proyecto: nuevoProyecto.id,
          id_lote: null
        });
      }
      
      return nuevoProyecto;
    },
    onSuccess: (nuevoProyecto) => {
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
      setCreateModalOpen(false);
      // Mostrar diálogo para ver como cliente
      setNewlyCreatedProyecto(nuevoProyecto);
    },
  });

  // Mutation: Actualizar proyecto
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProyectoUpdateDTO }) => 
      proyectoService.updateProyecto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
      setEditModalOpen(false);
      setSelectedProyecto(null);
    },
  });

  // Mutation: Activar/Desactivar proyecto
  const toggleActiveMutation = useMutation({
    mutationFn: async (proyecto: ProyectoDTO) => {
      if (proyecto.activo) {
        // Desactivar (soft delete)
        return proyectoService.deleteProyecto(proyecto.id);
      } else {
        // Reactivar - usamos 'as any' temporalmente porque 'activo' no está en ProyectoUpdateDTO
        return proyectoService.updateProyecto(proyecto.id, { activo: true } as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
    },
  });

  // Handlers
  const handleCreateSubmit = async (data: CreateProyectoDto, image: File | null) => {
    await createMutation.mutateAsync({ proyecto: data, image });
  };

  const handleEditSubmit = async (id: number, data: ProyectoUpdateDTO) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const handleToggleActive = (proyecto: ProyectoDTO) => {
    const action = proyecto.activo ? 'desactivar' : 'reactivar';
    if (window.confirm(`¿Seguro que deseas ${action} el proyecto "${proyecto.nombre_proyecto}"?`)) {
      toggleActiveMutation.mutate(proyecto);
    }
  };

  const handleViewDetail = (proyectoId: number) => {
    navigate(`/admin/proyectos/${proyectoId}`);
  };

  const handleViewAsClient = (proyectoId: number) => {
    // Abrir en nueva pestaña para ver como cliente
    window.open(`/proyectos/${proyectoId}`, '_blank');
  };

  // Helpers para estado y tipo
  const getEstadoColor = (estado: string): 'default' | 'warning' | 'success' | 'error' => {
    switch (estado) {
      case 'En Espera': return 'warning';
      case 'En proceso': return 'success';
      case 'Finalizado': return 'default';
      default: return 'default';
    }
  };

  const getTipoLabel = (tipo: string): string => {
    return tipo === 'mensual' ? 'Ahorro (Mensual)' : 'Inversión (Directo)';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Gestión de Proyectos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
          size="large"
        >
          Crear Nuevo Proyecto
        </Button>
      </Stack>

      {/* Tabla de Proyectos */}
      <QueryHandler isLoading={isLoading} error={error}>
        {proyectos.length === 0 ? (
          <Alert severity="info">
            No hay proyectos creados. Crea tu primer proyecto usando el botón de arriba.
          </Alert>
        ) : (
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado Proyecto</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Activo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                    Monto Inversión
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                    Imágenes
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proyectos.map((proyecto) => (
                  <TableRow 
                    key={proyecto.id}
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      opacity: proyecto.activo ? 1 : 0.6 
                    }}
                  >
                    <TableCell>{proyecto.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {proyecto.nombre_proyecto}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getTipoLabel(proyecto.tipo_inversion)}
                        size="small"
                        color={proyecto.tipo_inversion === 'mensual' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={proyecto.estado_proyecto}
                        size="small"
                        color={getEstadoColor(proyecto.estado_proyecto)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={proyecto.activo ? 'Activo' : 'Inactivo'}
                        size="small"
                        color={proyecto.activo ? 'success' : 'default'}
                        variant={proyecto.activo ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>
                        ${parseFloat(proyecto.monto_inversion || '0').toLocaleString()} {proyecto.moneda}
                      </Typography>
                      {proyecto.tipo_inversion === 'mensual' && (
                        <Typography variant="caption" color="text.secondary">
                          (Cuota mensual)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={proyecto.imagenes?.length || 0}
                        size="small"
                        color={proyecto.imagenes && proyecto.imagenes.length > 0 ? 'info' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {/* Ver como Cliente */}
                        <Tooltip title="Ver como Cliente">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleViewAsClient(proyecto.id)}
                          >
                            <PersonIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Ver Detalle */}
                        <Tooltip title="Ver Detalle Completo (Admin)">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewDetail(proyecto.id)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Editar */}
                        <Tooltip title="Editar Datos Básicos">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => {
                              setSelectedProyecto(proyecto);
                              setEditModalOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Gestionar Imágenes */}
                        <Tooltip title="Gestionar Imágenes">
                          <IconButton 
                            size="small" 
                            color="secondary"
                            onClick={() => {
                              setSelectedProyecto(proyecto);
                              setImagesModalOpen(true);
                            }}
                          >
                            <ImageIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Configurar Cuotas (solo mensual) */}
                        {proyecto.tipo_inversion === 'mensual' && (
                          <Tooltip title="Configurar Cuota Mensual">
                            <IconButton 
                              size="small" 
                              color="warning"
                              onClick={() => {
                                setSelectedProyecto(proyecto);
                                setCuotasModalOpen(true);
                              }}
                            >
                              <SettingsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Activar/Desactivar */}
                        <Tooltip title={proyecto.activo ? 'Desactivar' : 'Reactivar'}>
                          <IconButton 
                            size="small" 
                            color={proyecto.activo ? 'error' : 'success'}
                            onClick={() => handleToggleActive(proyecto)}
                            disabled={toggleActiveMutation.isPending}
                          >
                            {proyecto.activo ? (
                              <VisibilityOffIcon fontSize="small" />
                            ) : (
                              <ViewIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </QueryHandler>

      {/* Modales */}
      <CreateProyectoModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
      />

      {selectedProyecto && (
        <>
          <EditProyectoModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedProyecto(null);
            }}
            onSubmit={handleEditSubmit}
            proyecto={selectedProyecto}
            isLoading={updateMutation.isPending}
          />

          <ManageImagesModal
            open={imagesModalOpen}
            onClose={() => {
              setImagesModalOpen(false);
              setSelectedProyecto(null);
            }}
            proyecto={selectedProyecto}
          />

          <ConfigCuotasModal
            open={cuotasModalOpen}
            onClose={() => {
              setCuotasModalOpen(false);
              setSelectedProyecto(null);
            }}
            proyecto={selectedProyecto}
          />
        </>
      )}

      {/* Diálogo después de crear proyecto */}
      <Dialog
        open={!!newlyCreatedProyecto}
        onClose={() => setNewlyCreatedProyecto(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            ✅ Proyecto Creado Exitosamente
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            El proyecto <strong>"{newlyCreatedProyecto?.nombre_proyecto}"</strong> ha sido creado correctamente.
            <br /><br />
            ¿Deseas ver cómo se verá para los clientes?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button 
            onClick={() => setNewlyCreatedProyecto(null)}
            variant="outlined"
          >
            Cerrar
          </Button>
          <Button
            onClick={() => {
              if (newlyCreatedProyecto) {
                handleViewAsClient(newlyCreatedProyecto.id);
                setNewlyCreatedProyecto(null);
              }
            }}
            variant="contained"
            color="primary"
            startIcon={<PersonIcon />}
          >
            Ver como Cliente
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminProyectosPage;