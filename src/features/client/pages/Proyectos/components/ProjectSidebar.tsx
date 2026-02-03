// src/features/client/pages/Proyectos/components/ProjectSidebar.tsx

import React from 'react';
import { 
  Card, Box, Stack, Alert, Button, LinearProgress, 
  Typography, useTheme, alpha, Divider 
} from '@mui/material';
import { 
  ArrowForward, HistoryEdu, CheckCircle, Description, 
  GppGood, MonetizationOn, Download, CalendarMonth, Lock,
  Token as TokenIcon 
} from '@mui/icons-material';

import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import { useProyectoHelpers } from '@/features/client/hooks/useProyectoHelpers';

// ✅ IMPORTACIONES DE SEGURIDAD
import { useSecurityGuard } from '@/shared/hooks/useSecurityGuard';
import { SecurityRequirementModal } from '@/shared/components/domain/modals/SecurityRequirementModal/SecurityRequirementModal';

// ==========================================
// 1. INTERFACES
// ==========================================

export interface ProjectSidebarLogic {
  user: any | null; 
  puedeFirmar: boolean;
  yaFirmo: boolean;
  handleMainAction: () => void;
  handleClickFirmar: () => void;
  handleVerContratoFirmado: () => void;
  handleInversion: {
    isPending: boolean;
    mutate: () => void;
  };
  modales: {
    contrato: { open: () => void };
  };
}

interface ProjectSidebarProps {
  logic: ProjectSidebarLogic;
  proyecto: ProyectoDto;
}

// ==========================================
// 2. SUBCOMPONENTE: Propuesta de Valor (Tokens)
// ... (Sin cambios aquí)
// ==========================================
const TokenValueProposition = () => {
  const theme = useTheme();
  return (
    <Stack spacing={1.5} sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
      <Typography variant="caption" fontWeight={800} color="success.main" sx={{ textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
        <TokenIcon sx={{ fontSize: 16 }} /> Incluido en tu suscripción:
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Acceso a subastas mensuales</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}><strong>1 Token de Puja</strong> activo</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Garantía de devolución de token si pierdes</Typography>
      </Stack>
    </Stack>
  );
};

// ==========================================
// 3. SUBCOMPONENTE: Stepper Visual
// ... (Sin cambios aquí)
// ==========================================
const ProcessStepper: React.FC<{
  paso1Completo: boolean;
  paso2Completo: boolean;
  esMensual: boolean;
}> = ({ paso1Completo, paso2Completo, esMensual }) => {
  const theme = useTheme();
  const steps = [
    {
      icon: paso1Completo ? CheckCircle : MonetizationOn,
      label: esMensual ? 'Suscripción al Plan' : 'Pago del Pack Completo',
      completed: paso1Completo,
      active: !paso1Completo
    },
    {
      icon: paso2Completo ? CheckCircle : HistoryEdu,
      label: 'Firma de Contrato',
      completed: paso2Completo,
      active: paso1Completo && !paso2Completo
    }
  ];

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), p: 2.5, borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
      <Typography variant="subtitle2" fontWeight={700} mb={2} color="primary.main" sx={{ letterSpacing: 0.5 }}>
        TU PROCESO DE INVERSIÓN
      </Typography>
      <Stack spacing={2}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isLast = idx === steps.length - 1;
          return (
            <React.Fragment key={idx}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ width: 40, height: 40, minWidth: 40, borderRadius: '50%', bgcolor: step.completed ? 'success.main' : step.active ? 'primary.main' : alpha(theme.palette.text.disabled, 0.1), color: step.completed || step.active ? 'white' : 'text.disabled', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: step.active ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` : 'none', transition: 'all 0.3s ease' }}>
                  <Icon fontSize="small"/>
                </Box>
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={step.active ? 700 : 500} sx={{ textDecoration: step.completed ? 'line-through' : 'none', color: step.completed ? 'text.secondary' : step.active ? 'text.primary' : 'text.disabled' }}>
                    {step.label}
                  </Typography>
                </Box>
              </Box>
              {!isLast && (
                <Box sx={{ ml: 2.4, height: 24, borderLeft: `2px solid ${step.completed ? theme.palette.success.main : alpha(theme.palette.text.disabled, 0.2)}` }} />
              )}
            </React.Fragment>
          );
        })}
      </Stack>
    </Box>
  );
};

// ==========================================
// 4. SUBCOMPONENTE: Header de Precios
// ... (Sin cambios aquí)
// ==========================================
const PriceHeader: React.FC<{ helpers: ReturnType<typeof useProyectoHelpers>; }> = ({ helpers }) => {
    const BadgeIcon = helpers.badge.icon;
    const bgHeader = helpers.badge.color === 'success' ? 'success.main' : 'primary.main';

    return (
        <Box sx={{ bgcolor: bgHeader, p: 3, color: 'white', borderRadius: '12px 12px 0 0', position: 'relative', overflow: 'hidden' }}>
             <Box sx={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
             <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 1.5, py: 0.5, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 0.8, backdropFilter: 'blur(4px)' }}>
                    <BadgeIcon sx={{ fontSize: 18 }} />
                    <Typography variant="caption" fontWeight={700} color="inherit">{helpers.badge.label}</Typography>
                </Box>
                {helpers.estaActivo && (
                    <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', px: 1.5, py: 0.5, borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight={700} color="inherit">ACTIVO</Typography>
                    </Box>
                )}
            </Stack>
            <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 500, display: 'block', mb: 0.5, color: 'inherit' }}>
                {helpers.esMensual ? 'VALOR DE CUOTA MENSUAL' : 'INVERSIÓN TOTAL'}
            </Typography>
            <Typography variant="h3" fontWeight={700} sx={{ mb: 1, color: 'inherit' }}>
                {helpers.precioFormateado}
            </Typography>
            {helpers.esMensual ? (
                <Stack direction="row" alignItems="center" gap={1} sx={{ opacity: 0.95 }}>
                    <CalendarMonth fontSize="small" />
                    <Typography variant="body2" fontWeight={600} color="inherit">{helpers.plazoTexto}</Typography>
                </Stack>
            ) : (
                helpers.hayLotes && (
                    <Stack direction="row" alignItems="center" gap={1} sx={{ opacity: 0.95 }}>
                        <Description fontSize="small" />
                        <Typography variant="body2" fontWeight={600} color="inherit">
                          Pack de {helpers.cantidadLotes} lotes
                        </Typography>
                    </Stack>
                )
            )}
        </Box>
    );
};

// ==========================================
// 5. COMPONENTE PRINCIPAL
// ==========================================

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ 
  logic, 
  proyecto
}) => {
  const theme = useTheme();
  const helpers = useProyectoHelpers(proyecto); 

  // ✅ INICIALIZAMOS EL GUARDIA
  const { withSecurityCheck, securityModalProps } = useSecurityGuard();

  const user = logic.user;
  const paso1Completo = logic.puedeFirmar || logic.yaFirmo;
  const paso2Completo = logic.yaFirmo;

  return (
    <>
      <Card 
        sx={{ 
          position: { lg: 'sticky' }, 
          top: { lg: 100 }, 
          overflow: 'visible' 
        }}
      >
        
        <PriceHeader helpers={helpers} />

        <Box p={3}>
          <Stack spacing={3}>
            
            {user && (
              <ProcessStepper 
                  paso1Completo={paso1Completo} 
                  paso2Completo={paso2Completo} 
                  esMensual={helpers.esMensual} 
              />
            )}

            <Box>
              {!user ? (
                <Stack spacing={2}>
                  {helpers.esMensual && <TokenValueProposition />}
                  <Button 
                    variant="contained" fullWidth size="large" 
                    onClick={logic.handleMainAction} // Sin seguridad: Redirige a Login
                    startIcon={<ArrowForward />} 
                  >
                    Ingresar para Invertir
                  </Button>
                </Stack>
              ) : (
                <>
                  {!paso1Completo && (
                    <Stack spacing={2}>
                      {helpers.esMensual && <TokenValueProposition />}

                      <Button 
                          variant="contained" fullWidth size="large" 
                          // ✅ PROTEGIDO: Inversión requiere KYC/2FA
                          onClick={() => withSecurityCheck(logic.handleMainAction)} 
                          disabled={logic.handleInversion.isPending}
                          endIcon={!logic.handleInversion.isPending && <ArrowForward />}
                      >
                        {logic.handleInversion.isPending 
                          ? 'Procesando...' 
                          : helpers.esMensual 
                            ? 'Suscribirme al Plan' 
                            : 'Invertir en el Pack'
                        }
                      </Button>
                      
                      {helpers.esMensual && helpers.progreso && helpers.progreso.disponibles > 0 && (
                          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.08), borderRadius: 2 }}>
                              <Stack direction="row" justifyContent="space-between" mb={1}>
                                  <Typography variant="caption" fontWeight={700} color="success.dark">
                                      Cupos Disponibles
                                  </Typography>
                                  <Typography variant="caption" fontWeight={800} color="success.main">
                                      {helpers.progreso.disponibles}
                                  </Typography>
                              </Stack>
                              <LinearProgress 
                                  variant="determinate" 
                                  value={helpers.progreso.porcentaje} 
                                  color="success" 
                                  sx={{ height: 6, borderRadius: 3 }} 
                              />
                          </Box>
                      )}

                      {!helpers.esMensual && (
                          <Alert severity="info" variant="outlined" icon={<Lock />}>
                              <Typography variant="caption" display="block" fontWeight={600}>
                                  INVERSIÓN PACK COMPLETO
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                  Al invertir recibirás TODOS los lotes del proyecto al finalizar.
                                  No se requiere participar en subastas.
                              </Typography>
                          </Alert>
                      )}
                    </Stack>
                  )}

                  {paso1Completo && !paso2Completo && (
                    <Stack spacing={2}>
                      <Alert severity="warning" icon={<HistoryEdu />}>
                          Pago confirmado. Firma tu contrato para finalizar.
                      </Alert>
                      <Button 
                          variant="contained" color="warning" fullWidth size="large" 
                          // ✅ PROTEGIDO: Firmar requiere identidad verificada
                          onClick={() => withSecurityCheck(logic.handleClickFirmar)} 
                          sx={{ color: 'white' }}
                      >
                        Firmar Contrato Digital
                      </Button>
                      <Button variant="text" size="small" onClick={logic.modales.contrato.open}>
                          Ver borrador del contrato
                      </Button>
                    </Stack>
                  )}

                  {paso2Completo && (
                    <Stack spacing={2}>
                      <Alert severity="success" icon={<CheckCircle />}>
                          ¡Inversión completada exitosamente!
                      </Alert>
                      <Button 
                          variant="outlined" color="success" fullWidth 
                          onClick={logic.handleVerContratoFirmado} 
                          startIcon={<Download />} 
                      >
                        Descargar Contrato Firmado
                      </Button>
                    </Stack>
                  )}
                </>
              )}
            </Box>
            
            <Divider />
            
            <Stack spacing={1.5}>
               <Stack direction="row" alignItems="center" gap={1.5}>
                  <Box sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), p: 1, borderRadius: 1.5, display: 'flex' }}>
                      <GppGood color="success" fontSize="small" />
                  </Box>
                  <Box>
                      <Typography variant="subtitle2" color="text.primary" display="block">
                          Operación Legal
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                          Protección jurídica garantizada
                      </Typography>
                  </Box>
               </Stack>
               
               <Stack direction="row" alignItems="center" gap={1.5}>
                  <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), p: 1, borderRadius: 1.5, display: 'flex' }}>
                      <Description color="primary" fontSize="small" />
                  </Box>
                  <Box>
                      <Typography variant="subtitle2" color="text.primary" display="block">
                          Contrato Digital
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                          Firma electrónica válida
                      </Typography>
                  </Box>
               </Stack>
            </Stack>

          </Stack>
        </Box>
      </Card>

      {/* ✅ RENDERIZAR EL MODAL DE SEGURIDAD */}
      <SecurityRequirementModal {...securityModalProps} />
    </>
  );
};

export default ProjectSidebar;