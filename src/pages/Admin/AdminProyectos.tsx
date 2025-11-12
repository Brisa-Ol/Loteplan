// src/pages/Admin/AdminProyectos.tsx (COMPLETO CON TODOS LOS MODALES)
import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, Chip,
  IconButton, Tooltip, Stack, Alert, Snackbar
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Layers as LotesIcon,
  CreditCard as CuotaIcon,
  CheckCircle as CheckCircleIcon,
  PauseCircle as PauseIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

import proyectoService from '../../Services/proyecto.service';
import type { 
  ProyectoDTO, 
  EstadoProyecto, 
  TipoInversion,
  CreateProyectoDTO,
  UpdateProyectoDTO,
  AssignLotesDTO
} from '../../types/dto/proyecto.dto';

import { PageContainer, PageHeader, SectionTitle } from '../../components/common';
import { QueryHandler } from '../../components/common/QueryHandler/QueryHandler';
import { AdminBreadcrumbs } from '../../components/layout/Navbar/AdminBreadcrumbs';

// ❗ IMPORTAMOS LOS 3 MODALES
import CreateProyectoModal from '../../components/Admin/Proyectos/CreateProyectoModal';
import EditProyectoModal from '../../components/Admin/Proyectos/EditProyectoModal';
import AssignLotesModal from '../../components/Admin/Proyectos/AssignLotesModal';
import ConfigCuotasModal from '../../components/Admin/Proyectos/ConfigCuotasModal';

// Helpers de estado y tipo
const estadoMap: Record<EstadoProyecto, { label: string; color: "success" | "warning" | "default" }> = {
  "En proceso": { label: "En Proceso", color: "success" },
  "En Espera": { label: "En Espera", color: "warning" },
  "Finalizado": { label: "Finalizado", color: "default" },
};

const tipoMap: Record<TipoInversion, { label: string; color: "primary" | "info" }> = {
  "directo": { label: "Inversión", color: "primary" },
  "mensual": { label: "Ahorro", color: "info" },
};

const AdminProyectos: React.FC = () => {
  const queryClient = useQueryClient();

  // ❗ Estados para los 4 modales
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignLotesModalOpen, setAssignLotesModalOpen] = useState(false);
  const [configCuotasModalOpen, setConfigCuotasModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState<ProyectoDTO | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  // Query
  const { data: proyectos = [], isLoading, error } = useQuery<ProyectoDTO[], Error>({
    queryKey: ['adminAllProjects'],
    queryFn: proyectoService.getAllProyectos
  });

  // ══════════════════════════════════════════════════════════
  // MUTACIONES
  // ══════════════════════════════════════════════════════════

  const createMutation = useMutation({
    mutationFn: proyectoService.createProyecto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
      queryClient.invalidateQueries({ queryKey: ['unassignedLotes'] });
      setSnackbar({ open: true, message: 'Proyecto creado con éxito', severity: 'success' });
    },
    onError: (err: any) => {
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || 'Error al crear el proyecto', 
        severity: 'error' 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProyectoDTO }) => 
      proyectoService.updateProyecto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
      setSnackbar({ open: true, message: 'Proyecto actualizado con éxito', severity: 'success' });
    },
    onError: (err: any) => {
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || 'Error al actualizar el proyecto', 
        severity: 'error' 
      });
    }
  });

  const assignLotesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignLotesDTO }) => 
      proyectoService.assignLotesToProyecto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
      queryClient.invalidateQueries({ queryKey: ['unassignedLotes'] });
      setSnackbar({ open: true, message: 'Lotes asignados con éxito', severity: 'success' });
    },
    onError: (err: any) => {
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || 'Error al asignar lotes', 
        severity: 'error' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: proyectoService.deleteProyecto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
      setSnackbar({ open: true, message: 'Proyecto desactivado', severity: 'success' });
    },
    onError: (err: any) => {
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || 'Error al desactivar', 
        severity: 'error' 
      });
    }
  });

  // ══════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════

  const handleCreateSubmit = async (data: CreateProyectoDTO) => {
    await createMutation.mutateAsync(data);
  };

  const handleEditClick = (proyecto: ProyectoDTO) => {
    setSelectedProyecto(proyecto);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (id: string, data: UpdateProyectoDTO) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const handleAssignLotesClick = (proyecto: ProyectoDTO) => {
    setSelectedProyecto(proyecto);
    setAssignLotesModalOpen(true);
  };

  const handleAssignLotesSubmit = async (id: string, data: AssignLotesDTO) => {
    await assignLotesMutation.mutateAsync({ id, data });
  };

  const handleConfigCuotasClick = (proyecto: ProyectoDTO) => {
    setSelectedProyecto(proyecto);
    setConfigCuotasModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas desactivar este proyecto?")) {
      deleteMutation.mutate(id.toString());
    }
  };

  return (
    <PageContainer maxWidth="lg">
      <AdminBreadcrumbs />
      <PageHeader
        title="Gestión de Proyectos"
        subtitle="Crea, edita, asigna lotes y configura cuotas para todos los proyectos."
      />

      <Paper elevation={2} sx={{ p: 3, overflow: 'hidden' }}>
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
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
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre del Proyecto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Lotes Asignados</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proyectos.map((proyecto) => {
                    const estado = estadoMap[proyecto.estado_proyecto];
                    const tipo = tipoMap[proyecto.tipo_inversion];

                    return (
                      <TableRow key={proyecto.id} hover>
                        <TableCell>
                          <Typography variant="body1" fontWeight={600}>
                            {proyecto.nombre_proyecto}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {proyecto.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={tipo.label} size="small" color={tipo.color} />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={estado.label} 
                            size="small" 
                            color={estado.color} 
                            icon={
                              estado.color === 'success' ? <CheckCircleIcon /> : 
                              (estado.color === 'warning' ? <PauseIcon /> : <ErrorIcon />)
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={500}>
                            {proyecto.lotes?.length || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar Proyecto">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditClick(proyecto)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Asignar Lotes">
                            <IconButton 
                              size="small" 
                              color="default"
                              onClick={() => handleAssignLotesClick(proyecto)}
                            >
                              <LotesIcon />
                            </IconButton>
                          </Tooltip>
                          {proyecto.tipo_inversion === 'mensual' && (
                            <Tooltip title="Configurar Cuotas">
                              <IconButton 
                                size="small" 
                                color="default"
                                onClick={() => handleConfigCuotasClick(proyecto)}
                              >
                                <CuotaIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Desactivar Proyecto">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDelete(proyecto.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </QueryHandler>
      </Paper>
      
      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODALES */}
      {/* ══════════════════════════════════════════════════════════ */}
      
      <CreateProyectoModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
      />

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

      <AssignLotesModal
        open={assignLotesModalOpen}
        onClose={() => {
          setAssignLotesModalOpen(false);
          setSelectedProyecto(null);
        }}
        onSubmit={handleAssignLotesSubmit}
        proyecto={selectedProyecto}
        isLoading={assignLotesMutation.isPending}
      />

      <ConfigCuotasModal
        open={configCuotasModalOpen}
        onClose={() => {
          setConfigCuotasModalOpen(false);
          setSelectedProyecto(null);
        }}
        proyecto={selectedProyecto}
      />

      {/* Snackbar */}
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