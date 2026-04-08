import {
  ArrowForward,
  CalendarMonth,
  CheckCircle, Description,
  Download,
  GppGood,
  HistoryEdu,
  InfoOutlined,
  Lock,
  MonetizationOn,
  ReplayOutlined,
  Token as TokenIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Stack,
  Typography, useTheme
} from '@mui/material';
import React, { useState } from 'react';

import type { ProyectoDto } from '@/core/types/proyecto.dto';
import { useProyectoHelpers } from '@/features/client/hooks/useProyectoHelpers';
import { ROUTES } from '@/routes';
import { useNavigate } from 'react-router-dom';

// ==========================================
// 1. INTERFACES
// ==========================================

export interface ProjectSidebarLogic {
  user: any | null;
  puedeFirmar: boolean;
  yaFirmo: boolean;
  yaCancelado: boolean;
  tieneFirmaPendiente: boolean; // ✅ agregar
  handleMainAction: () => void;
  handleClickFirmar: () => void;
  handleVerContratoFirmado: () => void;
  handleInversion: { isPending: boolean; mutate: () => void };
  modales: { contrato: { open: () => void } };
}

interface ProjectSidebarProps {
  logic: ProjectSidebarLogic;
  proyecto: ProyectoDto;
  cantProyectUser: number,
  puedeFirmar?: boolean | undefined
}

// ==========================================
// 2. SUBCOMPONENTE: Propuesta de Valor
// ==========================================
const TokenValueProposition = () => {
  const theme = useTheme();
  return (
    <Stack spacing={1.5} sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
      <Typography variant="caption" fontWeight={800} color="success.main" sx={{ textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
        <TokenIcon sx={{ fontSize: 16 }} /> Incluido en tu suscripción:
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center"><CheckCircle sx={{ fontSize: 16, color: 'success.main' }} /><Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Acceso a subastas mensuales</Typography></Stack>
      <Stack direction="row" spacing={1} alignItems="center"><CheckCircle sx={{ fontSize: 16, color: 'success.main' }} /><Typography variant="body2" sx={{ fontSize: '0.85rem' }}><strong>1 Token de Puja</strong> activo</Typography></Stack>
      <Stack direction="row" spacing={1} alignItems="center"><CheckCircle sx={{ fontSize: 16, color: 'success.main' }} /><Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Garantía de devolución de token si pierdes</Typography></Stack>
    </Stack>
  );
};

// ==========================================
// 3. SUBCOMPONENTE: Stepper Visual
// ==========================================
const ProcessStepper: React.FC<any> = ({ paso1Completo, paso2Completo, esMensual }) => {
  const theme = useTheme();
  const steps = [
    { icon: paso1Completo ? CheckCircle : MonetizationOn, label: esMensual ? 'Suscripción al Plan' : 'Pago del Pack', completed: paso1Completo, active: !paso1Completo },
    { icon: paso2Completo ? CheckCircle : HistoryEdu, label: 'Firma de Contrato', completed: paso2Completo, active: paso1Completo && !paso2Completo }
  ];

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), p: 2.5, borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
      <Typography variant="subtitle2" fontWeight={700} mb={2} color="primary.main" sx={{ letterSpacing: 0.5 }}>TU PROCESO DE INVERSIÓN</Typography>
      <Stack spacing={2}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={idx}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ width: 40, height: 40, minWidth: 40, borderRadius: '50%', bgcolor: step.completed ? 'success.main' : step.active ? 'primary.main' : alpha(theme.palette.text.disabled, 0.1), color: step.completed || step.active ? 'white' : 'text.disabled', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: step.active ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` : 'none' }}>
                  <Icon fontSize="small" />
                </Box>
                <Typography variant="body2" fontWeight={step.active ? 700 : 500} sx={{ textDecoration: step.completed ? 'line-through' : 'none', color: step.completed ? 'text.secondary' : step.active ? 'text.primary' : 'text.disabled' }}>{step.label}</Typography>
              </Box>
              {idx === 0 && <Box sx={{ ml: 1.9, height: 24, borderLeft: `2px solid ${step.completed ? theme.palette.success.main : alpha(theme.palette.text.disabled, 0.2)}` }} />}
            </React.Fragment>
          );
        })}
      </Stack>
    </Box>
  );
};

// ==========================================
// 4. SUBCOMPONENTE: Header de Precios
// ==========================================
const PriceHeader: React.FC<{ helpers: any, isPrelanzamiento: boolean, isLleno: boolean }> = ({ helpers, isPrelanzamiento, isLleno }) => {
  const BadgeIcon = helpers.badge.icon;
  const bgHeader = isLleno ? 'grey.600' : isPrelanzamiento ? 'info.main' : (helpers.badge.color === 'success' ? 'success.main' : 'primary.main');

  return (
    <Box sx={{ bgcolor: bgHeader, p: 3, color: 'white', borderRadius: '12px 12px 0 0', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
      <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 1.5, py: 0.5, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 0.8, backdropFilter: 'blur(4px)' }}>
          <BadgeIcon sx={{ fontSize: 18 }} />
          <Typography variant="caption" fontWeight={700} color="inherit">{helpers.badge.label}</Typography>
        </Box>
        {isLleno ? (
          <Box sx={{ bgcolor: 'rgba(211, 47, 47, 0.8)', px: 1.5, py: 0.5, borderRadius: 1 }}>
            <Typography variant="caption" fontWeight={800} color="inherit">AGOTADO</Typography>
          </Box>
        ) : isPrelanzamiento ? (
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', px: 1.5, py: 0.5, borderRadius: 1 }}>
            <Typography variant="caption" fontWeight={800} color="inherit">PRÓXIMAMENTE</Typography>
          </Box>
        ) : (
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', px: 1.5, py: 0.5, borderRadius: 1 }}>
            <Typography variant="caption" fontWeight={700} color="inherit">ABIERTO</Typography>
          </Box>
        )}
      </Stack>
      <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 500, display: 'block', mb: 0.5, color: 'inherit' }}>
        {helpers.esMensual ? 'CUOTA INICIAL DE INGRESO' : 'INVERSIÓN TOTAL'}
      </Typography>
      <Typography variant="h3" fontWeight={700} sx={{ mb: 1, color: 'inherit' }}>{helpers.precioFormateado}</Typography>
      {helpers.esMensual && (
        <Stack direction="row" alignItems="center" gap={1} sx={{ opacity: 0.95 }}>
          <CalendarMonth fontSize="small" />
          <Typography variant="body2" fontWeight={600} color="inherit">{helpers.plazoTexto}</Typography>
        </Stack>
      )}
    </Box>
  );
};

// ==========================================
// 5. COMPONENTE PRINCIPAL
// ==========================================
export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ logic, proyecto, cantProyectUser, puedeFirmar }) => {

  //variables Thomy

  const [openResubModal, setOpenResubModal] = useState(false)
  const navigate = useNavigate()

  //fin variables Thomy

  //Funciones Thomy

  const handleClickContracts = () => {
    if (cantProyectUser > 1) {
      navigate(ROUTES.CLIENT.CUENTA.CONTRATOS)
    } else {
      logic.handleVerContratoFirmado()
    }
  }

  const handleSubscriptionOrSigning = () => {
    if (puedeFirmar) {
      logic.handleClickFirmar()
    } else {
      setOpenResubModal(true)
    }
  }

  //Fin Funciones Thomy

  const theme = useTheme();
  const helpers = useProyectoHelpers(proyecto);

  const user = logic.user;
  const paso1Completo = logic.puedeFirmar || logic.yaFirmo || logic.tieneFirmaPendiente;
  const paso2Completo = logic.yaFirmo;

  // 🧠 LÓGICA MAESTRA DE ESTADOS
  const hoy = new Date();
  const fechaInicio = new Date(proyecto.fecha_inicio);

  const isPrelanzamiento = fechaInicio > hoy;
  const isLleno = proyecto.suscripciones_actuales >= (proyecto.obj_suscripciones || 1);
  const isFinalizado = proyecto.estado_proyecto === 'Finalizado';

  // El stepper solo se muestra si el usuario tiene o tuvo una participación activa
  const mostrarStepper = user && (paso1Completo || paso2Completo);

  return (
    <Card sx={{ position: { lg: 'sticky' }, top: { lg: 100 }, overflow: 'visible' }}>
      <PriceHeader helpers={helpers} isPrelanzamiento={isPrelanzamiento} isLleno={isLleno} />

      <Box p={3}>
        <Stack spacing={3}>
          {mostrarStepper && (
            <ProcessStepper paso1Completo={paso1Completo} paso2Completo={paso2Completo} esMensual={helpers.esMensual} />
          )}

          <Box>
            {/* CASO 1: FINALIZADO */}
            {isFinalizado && !paso1Completo ? (
              <Stack spacing={2}>
                <Alert severity="success" icon={<CheckCircle />} sx={{ borderRadius: 2 }}>
                  El proyecto concluyó exitosamente.
                </Alert>
              </Stack>
            ) :

              /* CASO 2: PRE-LANZAMIENTO (sin suscripción activa) */
              isPrelanzamiento && !paso1Completo ? (
                <Stack spacing={2}>
                  {helpers.esMensual && <TokenValueProposition />}
                  <Alert severity="info" icon={<InfoOutlined />} sx={{ borderRadius: 2 }}>
                    Este proyecto abre suscripciones el <strong>{fechaInicio.toLocaleDateString()}</strong>.
                  </Alert>
                  <Button variant="contained" disabled fullWidth size="large" startIcon={<CalendarMonth />} sx={{ fontWeight: 800, bgcolor: 'action.disabledBackground' }}>
                    Apertura Próximamente
                  </Button>
                </Stack>
              ) :

                /* CASO 3: LLENO / AGOTADO (sin suscripción activa) */
                isLleno && !paso1Completo ? (
                  <Stack spacing={2}>
                    <Alert severity="error" icon={<Lock />} sx={{ borderRadius: 2 }}>
                      <strong>Cupos Agotados.</strong> Ya no se aceptan nuevas suscripciones en este proyecto.
                    </Alert>
                    <Button variant="contained" disabled fullWidth size="large" startIcon={<Lock />} sx={{ fontWeight: 800, bgcolor: 'action.disabledBackground' }}>
                      Proyecto Lleno
                    </Button>
                  </Stack>
                ) :

                  /* CASO 4: NO LOGUEADO */
                  !user ? (
                    <Stack spacing={2}>
                      {helpers.esMensual && <TokenValueProposition />}
                      <Button variant="contained" fullWidth size="large" onClick={logic.handleMainAction} startIcon={<Lock />} sx={{ fontWeight: 700 }}>
                        {helpers.esMensual ? 'Identificate para Suscribirte' : 'Identificate para Invertir'}
                      </Button>
                    </Stack>
                  ) :

                    /* CASO 5: LOGUEADO Y CANCELADO ANTERIORMENTE */
                    logic.yaCancelado && !paso1Completo ? (
                      <Stack spacing={2}>
                        <Alert severity="warning" icon={<InfoOutlined />} sx={{ borderRadius: 2 }}>
                          Cancelaste tu suscripción a este proyecto.
                          {!isLleno && ' Podés volver a suscribirte si hay cupos disponibles.'}
                        </Alert>
                        {!isLleno && (
                          <>
                            {helpers.esMensual && <TokenValueProposition />}
                            <Button
                              variant="outlined"
                              color="warning"
                              fullWidth
                              size="large"
                              onClick={logic.handleMainAction}
                              endIcon={<ArrowForward />}
                              startIcon={<ReplayOutlined />}
                              sx={{ fontWeight: 700 }}
                            >
                              Volver a Suscribirme
                            </Button>
                          </>
                        )}
                      </Stack>
                    ) :

                      /* CASO 6: LOGUEADO — FLUJO NORMAL */
                      (
                        <>
                          {/* 6A: Pendiente de Pago */}
                          {!paso1Completo && (
                            <Stack spacing={2}>
                              {helpers.esMensual && <TokenValueProposition />}
                              <Button
                                variant="contained" fullWidth size="large"
                                onClick={logic.handleMainAction}
                                disabled={logic.handleInversion.isPending}
                                endIcon={!logic.handleInversion.isPending && <ArrowForward />}
                                sx={{ fontWeight: 700 }}
                              >
                                {logic.handleInversion.isPending ? 'Procesando...' : helpers.esMensual ? 'Pagar Cuota de Ingreso' : 'Invertir en el Pack'}
                              </Button>

                              {helpers.esMensual && helpers.progreso && (
                                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.08), borderRadius: 2 }}>
                                  <Stack direction="row" justifyContent="space-between" mb={1}>
                                    <Typography variant="caption" fontWeight={700} color="success.dark">Cupos Disponibles</Typography>
                                    <Typography variant="caption" fontWeight={800} color="success.main">{helpers.progreso.disponibles}</Typography>
                                  </Stack>
                                  <LinearProgress variant="determinate" value={helpers.progreso.porcentaje} color="success" sx={{ height: 6, borderRadius: 3 }} />
                                </Box>
                              )}
                            </Stack>
                          )}

                          {/* 6B: Pagado, Pendiente de Firma */}
                          {paso1Completo && !paso2Completo && (
                            <Stack spacing={2}>
                              <Alert severity="warning" icon={<HistoryEdu />}>
                                Pago confirmado. Firma tu contrato para asegurar tu lugar.
                              </Alert>
                              <Button variant="contained" color="warning" fullWidth size="large" onClick={logic.handleClickFirmar} sx={{ color: 'white', fontWeight: 700 }}>
                                Firmar Contrato Digital
                              </Button>
                              <Button variant="text" size="small" onClick={logic.modales.contrato.open} sx={{ fontWeight: 600 }}>
                                Ver borrador del contrato
                              </Button>
                            </Stack>
                          )}

                          {/* 5C: Proceso Completado */}
                          {paso2Completo && (
                            <Stack spacing={2}>
                        {isFinalizado ? (
                          <Alert severity="info">
                            Esta inversión ya finalizó. No es posible realizar nuevas suscripciones.
                          </Alert>
                        ) : (
                                <Alert severity="success" icon={<CheckCircle />}>
                                  {cantProyectUser === 1
                                    ? 'Ya tienes una suscripción activa'
                                    : `Tienes ${cantProyectUser} suscripciones activas`}
                                </Alert>
                        )}

                              {/* 🔁 Volver a suscribirse */}
                              <Button
                                variant="contained"
                                fullWidth
                                onClick={handleSubscriptionOrSigning}
                          disabled={isFinalizado}
                                sx={{ fontWeight: 700 }}
                              >
                                {puedeFirmar
                            ? 'Firmar contrato'
                            : isFinalizado
                              ? 'Inversión finalizada'
                              : 'Volver a suscribirse para adquirir otro Token'}
                              </Button>

                              {/* 📄 Contratos */}
                              <Button
                                variant="outlined"
                                color="success"
                                fullWidth
                                onClick={handleClickContracts}
                                startIcon={<Download />}
                                sx={{ fontWeight: 700 }}
                              >
                                {cantProyectUser > 1
                                  ? 'Ver contratos'
                                  : 'Descargar contrato'}
                              </Button>
                            </Stack>
                          )}
                        </>
                      )}
          </Box>

          <Divider />

          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), p: 1, borderRadius: 1.5, display: 'flex' }}><GppGood color="success" fontSize="small" /></Box>
              <Box>
                <Typography variant="subtitle2" color="text.primary" display="block" fontWeight={700}>Operación Legal</Typography>
                <Typography variant="caption" color="text.secondary">Protección jurídica garantizada</Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), p: 1, borderRadius: 1.5, display: 'flex' }}><Description color="primary" fontSize="small" /></Box>
              <Box>
                <Typography variant="subtitle2" color="text.primary" display="block" fontWeight={700}>Contrato Digital</Typography>
                <Typography variant="caption" color="text.secondary">Firma electrónica válida</Typography>
              </Box>
            </Stack>
          </Stack>

        </Stack>
      </Box>

      <Dialog open={openResubModal} onClose={() => setOpenResubModal(false)}>
        <DialogTitle>Volver a suscribirse</DialogTitle>

        <DialogContent>
          <Typography>
            Ya tenés una suscripción activa en este proyecto.
          </Typography>

          <Typography sx={{ mt: 2 }}>
            Si continuás:
          </Typography>

          <Box component="ul" sx={{ pl: 2, mt: 1 }}>
            <li>Se generará una nueva inversión independiente</li>
            <li>Deberás realizar otro pago mensual</li>
            <li>Obtendrás un token adicional para tus pujas</li>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenResubModal(false)}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              setOpenResubModal(false);
              logic.handleMainAction(); // 👈 recién acá disparás el flujo
            }}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ProjectSidebar;