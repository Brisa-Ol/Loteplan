// src/pages/Admin/Proyectos/ProyectoDetailPage.tsx
import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, Stack, Tabs, Tab, Chip,
  Alert, Breadcrumbs, Link, Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import proyectoService from '../../../../Services/proyecto.service';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import type { ProyectoDTO } from '../../../../types/dto/proyecto.dto';

// Componentes
import ProyectoBasicInfo from '../components/ProyectoBasicInfo';
import { ProyectoLotesManager } from '../components/ProyectoLotesManager';
import { ProyectoPriceHistory } from '../components/ProyectoPriceHistory';
import { ProyectoSuscripciones } from '../components/ProyectoSuscripciones';
import { ProyectoStateActions } from '../components/ProyectoStateActions';

// Modales
import ManageImagesModal from '../modals/ManageImagesModal';
import EditProyectoModal from '../modals/EditProyectoModal';
import AssignLotesModal from '../modals/AssignLotesModal';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`proyecto-tabpanel-${index}`}
      aria-labelledby={`proyecto-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ProyectoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentTab, setCurrentTab] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [imagesModalOpen, setImagesModalOpen] = useState(false);
  const [lotesModalOpen, setLotesModalOpen] = useState(false);

  // Query: Obtener datos del proyecto
  const { data: proyecto, isLoading, error } = useQuery<ProyectoDTO, Error>({
    queryKey: ['proyecto', id],
    queryFn: () => proyectoService.getProyectoById(Number(id)),
    enabled: !!id,
  });

  // Mutation: Actualizar proyecto
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      proyectoService.updateProyecto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyecto', id] });
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
      setEditModalOpen(false);
    },
  });

  // Mutation: Iniciar proceso (solo para mensuales)
  const iniciarProcesoMutation = useMutation({
    mutationFn: (proyectoId: string) =>
      proyectoService.iniciarProcesoProyecto(proyectoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyecto', id] });
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
    },
  });

  // Mutation: Finalizar proyecto
  const finalizarMutation = useMutation({
    mutationFn: (proyectoId: string) =>
      proyectoService.updateProyecto(proyectoId, { estado_proyecto: 'Finalizado' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyecto', id] });
      queryClient.invalidateQueries({ queryKey: ['adminAllProjects'] });
    },
  });

  // Mutation: Asignar lotes
  const assignLotesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      proyectoService.assignLotesToProyecto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyecto', id] });
      setLotesModalOpen(false);
    },
  });

  // Handlers
  const handleEditSubmit = async (proyectoId: string, data: any) => {
    await updateMutation.mutateAsync({ id: proyectoId, data });
  };

  const handleIniciarProceso = () => {
    if (!id) return;
    if (window.confirm('¿Iniciar el proceso de este proyecto? Esto comenzará el conteo de meses.')) {
      iniciarProcesoMutation.mutate(id);
    }
  };

  const handleFinalizar = () => {
    if (!id) return;
    if (window.confirm('¿Marcar este proyecto como FINALIZADO? Esta acción es permanente.')) {
      finalizarMutation.mutate(id);
    }
  };

  const handleAssignLotes = async (proyectoId: string, data: any) => {
    await assignLotesMutation.mutateAsync({ id: proyectoId, data });
  };

  if (!id) {
    return <Alert severity="error">ID de proyecto no válido</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          onClick={() => navigate('/admin/proyectos')}
          sx={{ cursor: 'pointer' }}
        >
          Proyectos
        </Link>
        <Typography color="text.primary">Detalle</Typography>
      </Breadcrumbs>

      <QueryHandler isLoading={isLoading} error={error}>
        {proyecto && (
          <>
            {/* Header */}
            <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/proyectos')}
                    sx={{ mb: 2 }}
                  >
                    Volver al Listado
                  </Button>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {proyecto.nombre_proyecto}
                  </Typography>
                  <Stack direction="row" spacing={1} mb={2}>
                    <Chip
                      label={proyecto.tipo_inversion === 'mensual' ? 'Ahorro (Mensual)' : 'Inversión (Directo)'}
                      color={proyecto.tipo_inversion === 'mensual' ? 'primary' : 'secondary'}
                    />
                    <Chip
                      label={proyecto.estado_proyecto}
                      color={
                        proyecto.estado_proyecto === 'En Espera' ? 'warning' :
                        proyecto.estado_proyecto === 'En proceso' ? 'success' : 'default'
                      }
                    />
                    <Chip
                      label={proyecto.activo ? 'Activo' : 'Inactivo'}
                      color={proyecto.activo ? 'success' : 'default'}
                      variant={proyecto.activo ? 'filled' : 'outlined'}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    ID: {proyecto.id} • Creado: {new Date(proyecto.createdAt!).toLocaleDateString()}
                  </Typography>
                </Box>

                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setEditModalOpen(true)}
                  >
                    Editar Datos
                  </Button>

                  {/* Acciones según el estado */}
                  {proyecto.tipo_inversion === 'mensual' && proyecto.estado_proyecto === 'En Espera' && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<PlayIcon />}
                      onClick={handleIniciarProceso}
                      disabled={iniciarProcesoMutation.isPending}
                    >
                      Iniciar Proceso
                    </Button>
                  )}

                  {proyecto.estado_proyecto === 'En proceso' && (
                    <Button
                      variant="contained"
                      color="info"
                      startIcon={<CheckIcon />}
                      onClick={handleFinalizar}
                      disabled={finalizarMutation.isPending}
                    >
                      Finalizar Proyecto
                    </Button>
                  )}
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Info Rápida */}
              <Stack direction="row" spacing={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Monto Inversión</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    ${proyecto.monto_inversion?.toLocaleString() || 0} {proyecto.moneda}
                  </Typography>
                </Box>
                {proyecto.tipo_inversion === 'mensual' && (
                  <>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Suscripciones</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {proyecto.suscripciones_actuales} / {proyecto.obj_suscripciones}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Meses Restantes</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {proyecto.meses_restantes || proyecto.plazo_inversion || 0}
                      </Typography>
                    </Box>
                  </>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">Lotes Asignados</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {proyecto.lotes?.length || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Imágenes</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {proyecto.imagenes?.length || 0}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Tabs de Gestión */}
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={currentTab}
                onChange={(_, newValue) => setCurrentTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Información Básica" />
                <Tab label="Gestión de Lotes" />
                {proyecto.tipo_inversion === 'mensual' && <Tab label="Historial de Precios" />}
                <Tab label="Suscripciones" />
                <Tab label="Acciones de Estado" />
              </Tabs>

              <TabPanel value={currentTab} index={0}>
                <ProyectoBasicInfo
                  proyecto={proyecto}
                  onEdit={() => setEditModalOpen(true)}
                  onManageImages={() => setImagesModalOpen(true)}
                />
              </TabPanel>

              <TabPanel value={currentTab} index={1}>
                <ProyectoLotesManager
                  proyecto={proyecto}
                  onAssignLotes={() => setLotesModalOpen(true)}
                />
              </TabPanel>

              {proyecto.tipo_inversion === 'mensual' && (
                <TabPanel value={currentTab} index={2}>
                  <ProyectoPriceHistory proyectoId={proyecto.id} />
                </TabPanel>
              )}

              <TabPanel value={currentTab} index={proyecto.tipo_inversion === 'mensual' ? 3 : 2}>
                <ProyectoSuscripciones proyectoId={proyecto.id} />
              </TabPanel>

              <TabPanel value={currentTab} index={proyecto.tipo_inversion === 'mensual' ? 4 : 3}>
                <ProyectoStateActions
                  proyecto={proyecto}
                  onIniciarProceso={handleIniciarProceso}
                  onFinalizar={handleFinalizar}
                  isLoading={iniciarProcesoMutation.isPending || finalizarMutation.isPending}
                />
              </TabPanel>
            </Paper>

            {/* Modales */}
            <EditProyectoModal
              open={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              onSubmit={handleEditSubmit}
              proyecto={proyecto}
              isLoading={updateMutation.isPending}
            />

            <ManageImagesModal
              open={imagesModalOpen}
              onClose={() => setImagesModalOpen(false)}
              proyecto={proyecto}
            />

            <AssignLotesModal
              open={lotesModalOpen}
              onClose={() => setLotesModalOpen(false)}
              onSubmit={handleAssignLotes}
              proyecto={proyecto}
              isLoading={assignLotesMutation.isPending}
            />
          </>
        )}
      </QueryHandler>
    </Box>
  );
};

export default ProyectoDetailPage;