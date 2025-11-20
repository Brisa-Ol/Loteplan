import React, { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, IconButton, Stack, Tooltip, useTheme 
} from '@mui/material';
import { Add, Delete, PlayArrow, Edit, Visibility, Link as LinkIcon } from '@mui/icons-material';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import { PageContainer } from '../../../../components/common/PageContainer/PageContainer';
import ProyectoService from '../../../../Services/proyecto.service';
import type { CreateProyectoDto } from '../../../../types/dto/proyecto.dto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CreateProyectoModal from '../modals/CreateProyectoModal';


const AdminProyectos: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);

  // 1. Cargar Proyectos
  const { data: proyectos, isLoading, error } = useQuery({
    queryKey: ['adminProyectos'],
    queryFn: async () => (await ProyectoService.getAllAdmin()).data
  });

  // 2. Mutaciones
  const createMutation = useMutation({
    mutationFn: (data: CreateProyectoDto) => ProyectoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      setModalOpen(false);
      alert('Proyecto creado correctamente');
    },
    onError: (err: any) => alert(`Error: ${err.response?.data?.error || err.message}`)
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.startProcess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });
      alert('Proyecto iniciado. Cobros activados.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ProyectoService.softDelete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProyectos'] })
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'En proceso': return 'success';
      case 'Finalizado': return 'default';
      default: return 'warning';
    }
  };

  return (
    <PageContainer maxWidth="xl">
      
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h3" fontWeight={700} color="text.primary">Gestión de Proyectos</Typography>
          <Typography variant="subtitle1" color="text.secondary">Administra el catálogo de inversiones y sus estados.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => setModalOpen(true)}
          size="large"
        >
          Nuevo Proyecto
        </Button>
      </Stack>

      <QueryHandler isLoading={isLoading} error={error as Error}>
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Finanzas</strong></TableCell>
                <TableCell><strong>Progreso</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proyectos?.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>{p.nombre_proyecto}</Typography>
                    <Typography variant="caption" color="text.secondary">ID: {p.id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={p.tipo_inversion === 'mensual' ? 'Ahorro' : 'Directo'} 
                      size="small" 
                      color={p.tipo_inversion === 'mensual' ? 'primary' : 'secondary'} 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={p.estado_proyecto} 
                      size="small" 
                      color={getStatusColor(p.estado_proyecto) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {p.moneda} {Number(p.monto_inversion).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {p.tipo_inversion === 'mensual' 
                      ? <Typography variant="body2">{p.suscripciones_actuales} / {p.obj_suscripciones} Subs</Typography>
                      : <Typography variant="body2">{p.lotes?.length || 0} Lotes</Typography>
                    }
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      
                      {/* Botón Iniciar Proceso (Solo Ahorro Pendiente) */}
                      {p.tipo_inversion === 'mensual' && p.estado_proyecto === 'En Espera' && (
                        <Tooltip title="Iniciar Proceso (Activar Cobros)">
                          <IconButton 
                            color="success" 
                            onClick={() => {
                               if(confirm('¿Iniciar conteo de meses? Esto activará los cobros.')) startMutation.mutate(p.id);
                            }}
                          >
                            <PlayArrow />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Ver Lotes / Asignar">
                        <IconButton color="info">
                          <LinkIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Eliminar">
                        <IconButton 
                          color="error" 
                          onClick={() => {
                             if(confirm('¿Eliminar proyecto?')) deleteMutation.mutate(p.id);
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {proyectos?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No hay proyectos registrados.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </QueryHandler>

      <CreateProyectoModal 
        open={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onSubmit={async (data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </PageContainer>
  );
};

export default AdminProyectos;