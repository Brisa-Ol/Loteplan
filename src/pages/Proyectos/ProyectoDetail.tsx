// src/pages/Proyectos/ProyectoDetail.tsx (Refactorizado y con Permisos)
// ═══════════════════════════════════════════════════════════
import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box, Typography, Button, Chip, Divider, List, ListItem, ListItemIcon,
  ListItemText, Stack, CircularProgress, Alert, Paper,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  ArrowBack as BackIcon,
} from "@mui/icons-material";
import { QueryHandler } from "../../components/common/QueryHandler/QueryHandler";
import { PageContainer, PageHeader } from "../../components/common";
import { useQuery, useMutation } from '@tanstack/react-query';

// --- 1. Servicios y Tipos ---
// ❗ CORRECCIÓN 1: Importamos el servicio por DEFECTO (sin llaves)
import proyectoService from '../../Services/proyecto.service';
import { crearInversion } from '../../Services/inversion.service';
import { iniciarCheckoutInversion } from '../../Services/pagoMercado.service';
import { iniciarPagoSuscripcion } from '../../Services/pago.service';

import type { ProyectoDTO, EstadoProyecto } from "../../types/dto/proyecto.dto";

// --- 2. Contexto y Permisos ---
import { useAuth } from "../../context/AuthContext";
import PermissionGuard from '../../components/PermissionGuard/PermissionGuard';
import { usePermissions } from "../../hook/usePermissions";

// --- 3. Constantes ---
const API_PUBLIC_URL = import.meta.env.VITE_API_PUBLIC_URL || 'http://localhost:3001';

const statusDisplayMap: Record<EstadoProyecto, { label: string; color: "info" | "success" | "default" }> = {
  "En Espera": { label: "Próximamente", color: "info" },
  "En proceso": { label: "Activo", color: "success" },
  "Finalizado": { label: "Finalizado", color: "default" },
};

const ProyectoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const permissions = usePermissions();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- 4. Hooks (Querys) ---
  // ❗ CORRECCIÓN 2: Usamos el servicio y el nombre de función correctos
  const { data: project, isLoading, error } = useQuery<ProyectoDTO | null, Error>({
    queryKey: ['proyecto', id],
    queryFn: () => proyectoService.getActiveProyectoById(Number(id)),
    enabled: !!id,
    retry: false,
  });

  const { data: cuotasArray, isLoading: isLoadingCuota } = useQuery({
    queryKey: ['cuotasMensuales', id],
    queryFn: () => getCuotasByProyectoId(Number(id)), // Asumiendo que este servicio sí es nombrado
    enabled: !!id && project?.tipo_inversion === 'mensual',
    retry: false,
  });

  const cuotaMensual = cuotasArray && cuotasArray.length > 0 ? cuotasArray[0] : null;

  // ===================================================================
  // MUTATIONS
  // ===================================================================

  const pagoSuscripcionMutation = useMutation({
    mutationFn: iniciarPagoSuscripcion,
    onSuccess: (data) => (window.location.href = data.redirectUrl),
    onError: (err: any) => console.error("❌ Error al iniciar pago de suscripción:", err)
  });

  const checkoutInversionMutation = useMutation({
    mutationFn: iniciarCheckoutInversion,
    onSuccess: (data) => (window.location.href = data.redirectUrl),
    onError: (err: any) => console.error("❌ Error al iniciar checkout de inversión:", err)
  });

  const createInversionMutation = useMutation({
    mutationFn: crearInversion,
    onSuccess: (inversionCreada) => {
      console.log("✅ Inversión creada (ID:", inversionCreada.inversionId, "). Iniciando checkout...");
      checkoutInversionMutation.mutate(inversionCreada.inversionId);
    },
    onError: (err: any) => console.error("❌ Error al crear la inversión:", err)
  });

  // ===================================================================
  // HANDLERS
  // ===================================================================

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    pagoSuscripcionMutation.reset();
    createInversionMutation.reset();
    checkoutInversionMutation.reset();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleConfirmCheckout = () => {
    if (!project) return;
    if (project.tipo_inversion === 'directo') {
      createInversionMutation.mutate({ id_proyecto: project.id });
    } else if (project.tipo_inversion === 'mensual') {
      pagoSuscripcionMutation.mutate({ id_proyecto: project.id });
    }
  };

  // ===================================================================
  // RENDER
  // ===================================================================

  const isProcessing = pagoSuscripcionMutation.isPending ||
    createInversionMutation.isPending ||
    checkoutInversionMutation.isPending;

  const mutationError = pagoSuscripcionMutation.error ||
    createInversionMutation.error ||
    checkoutInversionMutation.error;

  const isClienteButtonDisabled = project?.tipo_inversion === 'mensual' && !cuotaMensual && !isLoadingCuota;

  return (
    <PageContainer>
      <QueryHandler
        isLoading={isLoading || (project?.tipo_inversion === 'mensual' && isLoadingCuota)}
        error={error as Error | null}
        fullHeight={true}
        loadingMessage="Cargando proyecto..."
      >
        {project && (
          <>
            {/* Variables de renderizado (IIFE eliminada) */}
            {(() => {
              const isInvestor = project.tipo_inversion === 'directo';
              const imageUrl = project.imagenes?.[0]?.url
                ? `${API_PUBLIC_URL}${project.imagenes[0].url}`
                : '/images/placeholder.jpg';
              const status = statusDisplayMap[project.estado_proyecto];
              const montoDisplay = isInvestor
                ? project.monto_inversion?.toLocaleString()
                : cuotaMensual?.valor_mensual_final?.toLocaleString() ?? 'N/A';

              return (
                <>
                  <Button onClick={() => navigate(-1)} startIcon={<BackIcon />} sx={{ mb: 3 }}>
                    Volver
                  </Button>

                  <PageHeader title={project.nombre_proyecto} />

                  <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems="flex-start">
                    {/* Columna izquierda */}
                    <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 60%" } }}>
                      <Box
                        component="img"
                        src={imageUrl}
                        alt={project.nombre_proyecto}
                        sx={{
                          width: "100%",
                          height: { xs: 250, md: 400 },
                          objectFit: "cover",
                          borderRadius: 2,
                          mb: 3,
                        }}
                      />
                      <Typography variant="h5" gutterBottom fontWeight={600}>Descripción del proyecto</Typography>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        {project.descripcion || 'Sin descripción disponible.'}
                      </Typography>
                      
                      <Typography variant="h6" gutterBottom fontWeight={600} mt={3}>
                        Características principales
                      </Typography>
                      <List>
                        <ListItem disablePadding sx={{ mb: 1 }}> <ListItemIcon sx={{ minWidth: 40 }}><CheckIcon color="primary" /></ListItemIcon> <ListItemText primary="Terrenos urbanizados" /> </ListItem>
                        <ListItem disablePadding sx={{ mb: 1 }}> <ListItemIcon sx={{ minWidth: 40 }}><CheckIcon color="primary" /></ListItemIcon> <ListItemText primary="Todos los servicios" /> </ListItem>
                        <ListItem disablePadding sx={{ mb: 1 }}> <ListItemIcon sx={{ minWidth: 40 }}><CheckIcon color="primary" /></ListItemIcon> <ListItemText primary="Seguridad jurídica mediante Fideicomiso" /> </ListItem>
                        <ListItem disablePadding sx={{ mb: 1 }}> <ListItemIcon sx={{ minWidth: 40 }}><CheckIcon color="primary" /></ListItemIcon> <ListItemText primary="Zona de alto crecimiento" /> </ListItem>
                      </List>
                    </Box>

                    {/* Columna derecha */}
                    <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 40%" }, width: "100%" }}>
                      <Paper
                        sx={{
                          bgcolor: "background.paper", p: 3, borderRadius: 2,
                          boxShadow: 2, position: { md: "sticky" }, top: { md: 100 },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                          <Chip label={status.label} color={status.color} />
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {project.forma_juridica || 'Ubicación pendiente'}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Divider sx={{ my: 2 }} />

                        {isInvestor ? (
                          <>
                            <Box mb={3}> <Stack direction="row" spacing={1} alignItems="center" mb={1}> <MoneyIcon color="primary" /> <Typography variant="body2" color="text.secondary">Inversión mínima</Typography> </Stack> <Typography variant="h4" color="primary.main" fontWeight={700}> {project.moneda || 'USD'} {montoDisplay} </Typography> </Box>
                            <Box mb={3}> <Stack direction="row" spacing={1} alignItems="center" mb={1}> <TrendingUpIcon color="success" /> <Typography variant="body2" color="text.secondary">Rentabilidad estimada</Typography> </Stack> <Typography variant="h4" color="success.main" fontWeight={700}> N/A % </Typography> </Box>
                            <Box mb={3}> <Stack direction="row" spacing={1} alignItems="center" mb={1}> <ScheduleIcon color="action" /> <Typography variant="body2" color="text.secondary">Plazo de inversión</Typography> </Stack> <Typography variant="h5" fontWeight={600}> {project.plazo_inversion ?? 'N/A'} meses </Typography> </Box>
                          </>
                        ) : (
                          <>
                            <Box mb={3}> <Stack direction="row" spacing={1} alignItems="center" mb={1}> <MoneyIcon color="primary" /> <Typography variant="body2" color="text.secondary">Cuota mensual</Typography> </Stack> <Typography variant="h4" color="primary.main" fontWeight={700}> {project.moneda || '$'} {montoDisplay} </Typography> </Box>
                            <Box mb={3}> <Stack direction="row" spacing={1} alignItems="center" mb={1}> <ScheduleIcon color="action" /> <Typography variant="body2" color="text.secondary">Plazo total</Typography> </Stack> <Typography variant="h5" fontWeight={600}> {project.plazo_inversion ?? 'N/A'} meses </Typography> </Box>
                            <Box mb={3}> <Typography variant="body2" color="success.main" fontWeight={600}> ✓ Cuotas sin interés </Typography> <Typography variant="body2" color="success.main" fontWeight={600}> ✓ Adjudicación desde cuota 12 </Typography> </Box>
                          </>
                        )}
                        
                        {project.tipo_inversion === 'mensual' && !cuotaMensual && !isLoadingCuota && (
                          <Alert severity="warning" sx={{ mb: 2 }}>
                            Este proyecto aún no tiene una cuota configurada. No es posible suscribirse.
                          </Alert>
                        )}

                        {/* --- A. BOTÓN PARA CLIENTES --- */}
                        <PermissionGuard requireCliente>
                          <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{ mt: 1, position: 'relative' }}
                            onClick={handleOpenModal}
                            disabled={isClienteButtonDisabled}
                          >
                            {isInvestor ? "Invertir ahora" : "Suscribirme ahora"}
                          </Button>
                        </PermissionGuard>

                        {/* --- B. BOTONES PARA ADMIN --- */}
                        <PermissionGuard requireAdmin>
                          <Stack spacing={2} sx={{ mt: 2 }}>
                            <Typography variant="overline" color="text.secondary" textAlign="center">
                              Acciones de Administrador
                            </Typography>
                            <Button variant="outlined" fullWidth /* onClick={handleEdit} */>
                              Editar Proyecto
                            </Button>
                            <Button variant="contained" color="error" fullWidth /* onClick={handleDelete} */>
                              Eliminar Proyecto
                            </Button>
                          </Stack>
                        </PermissionGuard>

                        {/* --- C. BOTÓN PARA INVITADOS (NO LOGUEADOS) --- */}
                        {!isAuthenticated && (
                          <>
                            <Button
                              variant="contained"
                              fullWidth
                              size="large"
                              sx={{ mt: 1 }}
                              onClick={handleOpenModal} // ⬅️ Esto redirigirá a /login
                            >
                              {isInvestor ? "Invertir ahora" : "Suscribirme ahora"}
                            </Button>
                            <Typography variant="caption" color="text.secondary" display="block" mt={1} textAlign="center">
                              Necesitás iniciar sesión para continuar.
                            </Typography>
                          </>
                        )}
                        
                        {/* Modal de confirmación */}
                        <Dialog open={isModalOpen} onClose={handleCloseModal}>
                          <DialogTitle>Confirmar {isInvestor ? 'Inversión' : 'Suscripción'}</DialogTitle>
                          <DialogContent>
                            <DialogContentText>
                              Estás a punto de {isInvestor ? 'invertir en' : 'suscribirte a'} el proyecto:
                            </DialogContentText>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>{project.nombre_proyecto}</Typography>
                            <Typography variant="body1">{isInvestor ? 'Inversión mínima:' : 'Monto de cuota mensual:'}</Typography>
                            <Typography variant="h4" color="primary.main" fontWeight={700}>
                              {project.moneda || '$'} {montoDisplay}
                            </Typography>

                            {mutationError && (
                              <Alert severity="error" sx={{ mt: 2 }}>
                                {(mutationError as any)?.response?.data?.error || (mutationError as Error).message || "Ocurrió un error."}
                              </Alert>
                            )}
                          </DialogContent>
                          <DialogActions sx={{ p: 3, pt: 1 }}>
                            <Button onClick={handleCloseModal} disabled={isProcessing}>Cancelar</Button>
                            <Button
                              onClick={handleConfirmCheckout}
                              variant="contained"
                              disabled={isProcessing}
                              sx={{ position: 'relative', minWidth: 150 }}
                            >
                              {isProcessing ? (<CircularProgress size={24} sx={{ color: 'white', position: 'absolute' }} />) : ('Confirmar y Pagar')}
                            </Button>
                          </DialogActions>
                        </Dialog>
                      </Paper>
                    </Box>
                  </Stack>

                  {/* Sección de Ubicación */}
                  <Box mt={6}>
                    <Typography variant="h5" gutterBottom fontWeight={600}> Ubicación </Typography>
                    <Box sx={{ width: "100%", height: { xs: 300, md: 400 }, bgcolor: "grey.200", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Typography color="text.secondary"> Mapa de ubicación (integrar Google Maps aquí) </Typography>
                    </Box>
                  </Box>
                </>
              );
            })()}
          </>
        )}
      </QueryHandler>
    </PageContainer>
  );
};

export default ProyectoDetail;

function getCuotasByProyectoId(arg0: number): any {
  throw new Error("Function not implemented.");
}
