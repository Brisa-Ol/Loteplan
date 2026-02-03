// src/features/client/pages/Lotes/ListaLotesProyecto.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { 
  Box, Typography, Stack, Skeleton, Alert, useTheme, Fade, 
  Tabs, Tab, Chip, Button
} from '@mui/material';
import { 
  Lock, Gavel, AccessTime, EmojiEvents, Apps, Block, CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { useLotesProyecto } from '../../hooks/useLotesProyecto';
import PujarModal from './components/PujarModal';
import LoteCard from './components/LoteCard'; 
import { GlobalSnackbar } from '../../../../shared/components/ui/feedback/GlobalSnackbarProps/GlobalSnackbarProps';
import { useAuth } from '@/core/context/AuthContext';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { ROUTES } from '@/routes';
import ProyectoService from '@/core/api/services/proyecto.service';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import type { LoteDto } from '@/core/types/dto/lote.dto';

interface Props {
  idProyecto: number;
}

const getPesoEstado = (estado: string) => {
  switch (estado) {
    case 'activa': return 3;
    case 'pendiente': return 2;
    case 'finalizada': return 1;
    default: return 0;
  }
};

// ✅ OPTIMIZACIÓN 1: Memoizar LoteCard con comparador personalizado
const MemoizedLoteCard = React.memo(LoteCard, (prevProps, nextProps) => {
  // Solo re-renderizar si cambian estas props críticas
  return (
    prevProps.lote.id === nextProps.lote.id &&
    prevProps.lote.estado_subasta === nextProps.lote.estado_subasta &&
    prevProps.lote.precio_base === nextProps.lote.precio_base &&
    prevProps.lote.monto_ganador_lote === nextProps.lote.monto_ganador_lote &&
    prevProps.isSubscribed === nextProps.isSubscribed &&
    prevProps.hasTokens === nextProps.hasTokens &&
    prevProps.tokensDisponibles === nextProps.tokensDisponibles &&
    prevProps.isLoadingSub === nextProps.isLoadingSub &&
    (prevProps.lote.pujas?.length || 0) === (nextProps.lote.pujas?.length || 0)
  );
});

// Agregar displayName para mejor debugging
MemoizedLoteCard.displayName = 'MemoizedLoteCard';

export const ListaLotesProyecto: React.FC<Props> = ({ idProyecto }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [tabValue, setTabValue] = useState('todos');

  // 1. VALIDACIÓN: VERIFICAR TIPO DE PROYECTO
  const { data: proyecto, isLoading: loadingProyecto } = useQuery<ProyectoDto>({
    queryKey: ['proyecto', idProyecto],
    queryFn: async () => (await ProyectoService.getByIdActive(idProyecto)).data,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const logic = useLotesProyecto(idProyecto, isAuthenticated);

  // ✅ OPTIMIZACIÓN 2: Memoizar filtrado y sorting
  const { filteredLotes, counts } = useMemo(() => {
    if (!logic.lotes) return { filteredLotes: [], counts: { todos: 0, activa: 0, pendiente: 0, finalizada: 0 } };

    const counts = logic.lotes.reduce((acc, lote) => {
      acc.todos++;
      const estado = lote.estado_subasta as keyof typeof acc;
      if (acc[estado] !== undefined) acc[estado]++;
      return acc;
    }, { todos: 0, activa: 0, pendiente: 0, finalizada: 0 });

    let result = logic.lotes;
    if (tabValue !== 'todos') {
      result = result.filter(l => l.estado_subasta === tabValue);
    }

    if (tabValue === 'todos') {
      result = [...result].sort((a, b) => getPesoEstado(b.estado_subasta) - getPesoEstado(a.estado_subasta));
    }

    return { filteredLotes: result, counts };
  }, [logic.lotes, tabValue]);

  // ✅ OPTIMIZACIÓN 3: Memoizar handlers con useCallback
  const handleNavigate = useCallback((id: number) => {
    const ruta = ROUTES.CLIENT.LOTES.DETALLE.replace(':id', String(id));
    navigate(ruta);
  }, [navigate]);

  const handlePujar = useCallback((lote: LoteDto) => {
    logic.handleOpenPujar(lote);
  }, [logic]);

  const handleRemoveFav = useCallback((id: number) => {
    logic.handleRequestUnfav(id);
  }, [logic]);

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
    gap: 3,
    alignItems: 'stretch'
  };

  // VALIDACIÓN 1: CARGANDO PROYECTO
  if (loadingProyecto) {
    return (
      <Box mt={4}>
        <Stack direction="row" spacing={2} mb={3}>
           <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 2 }} />
           <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 2 }} />
        </Stack>
        <Box sx={gridStyles}>
          {[1, 2, 3].map((i) => (
            <Box key={i}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: '16px 16px 0 0' }} />
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: '0 0 16px 16px' }} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  // VALIDACIÓN 2: BLOQUEO PARA INVERSIONISTAS DIRECTOS
  if (proyecto?.tipo_inversion === 'directo') {
    return (
      <Fade in timeout={500}>
        <Box mt={{ xs: 2, md: 4 }} p={{ xs: 3, md: 5 }} textAlign="center" bgcolor="background.paper" borderRadius={4} border={`1px solid ${theme.palette.divider}`}>
          <Block sx={{ fontSize: 60, color: 'warning.main', mb: 2, opacity: 0.7 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Inventario No Disponible
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Este es un proyecto de <strong>inversión directa</strong>. 
            Los lotes forman parte del pack completo y no se subastan individualmente.
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Al invertir en este proyecto, recibirás TODOS los lotes al finalizar.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate(`/cliente/proyectos/${idProyecto}`)}
          >
            Volver al Proyecto
          </Button>
        </Box>
      </Fade>
    );
  }

  // VALIDACIÓN 3: USUARIO NO AUTENTICADO
  if (!isAuthenticated) {
    return (
      <Fade in timeout={500}>
        <Box mt={{ xs: 2, md: 4 }} p={{ xs: 3, md: 5 }} textAlign="center" bgcolor="background.paper" borderRadius={4} border={`1px dashed ${theme.palette.divider}`}>
          <Lock sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>Inventario Exclusivo</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Inicia sesión para ver los lotes disponibles en subasta.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/login')}>
            Iniciar Sesión
          </Button>
        </Box>
      </Fade>
    );
  }

  // VALIDACIÓN 4: CARGANDO LOTES
  if (logic.isLoading) {
    return (
      <Box mt={4}>
        <Stack direction="row" spacing={2} mb={3}>
           <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 2 }} />
           <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 2 }} />
        </Stack>
        <Box sx={gridStyles}>
          {[1, 2, 3].map((i) => (
            <Box key={i}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: '16px 16px 0 0' }} />
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: '0 0 16px 16px' }} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (logic.error) return <Alert severity="error">Error al cargar inventario.</Alert>;

  // RENDER PRINCIPAL (SOLO PARA PROYECTOS MENSUALES)
  return (
    <Box mt={{ xs: 3, md: 4 }}>
      
      {/* ✅ ALERTAS INTELIGENTES */}
      {!logic.isSubscribed && !logic.isLoading && (
        <Alert severity="warning" variant="outlined" icon={<Lock />} sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Suscripción Requerida
          </Typography>
          <Typography variant="body2">
            Debes estar suscripto al proyecto para participar en las subastas.
          </Typography>
          <Button 
            size="small" 
            variant="text" 
            onClick={() => navigate(`/cliente/proyectos/${idProyecto}`)}
            sx={{ mt: 1 }}
          >
            Ver opciones de suscripción
          </Button>
        </Alert>
      )}

      {logic.isSubscribed && !logic.hasTokens && !logic.isLoading && (
        <Alert severity="info" variant="filled" icon={<EmojiEvents />} sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Token en Uso
          </Typography>
          <Typography variant="body2">
            Ya estás participando activamente en una subasta de este proyecto. 
            Puedes revisar el estado de tus pujas en "Mis Pujas".
          </Typography>
          <Button 
            size="small" 
            variant="text" 
            onClick={() => navigate('/cliente/mis-pujas')}
            sx={{ mt: 1, color: 'white' }}
          >
            Ver mis pujas
          </Button>
        </Alert>
      )}

      {logic.isSubscribed && logic.hasTokens && !logic.isLoading && (
        <Alert severity="success" variant="outlined" icon={<CheckCircle />} sx={{ mb: 3, borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight={600}>
                ¡Listo para Ofertar!
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tienes {logic.tokensDisponibles} token{logic.tokensDisponibles === 1 ? '' : 's'} disponible{logic.tokensDisponibles === 1 ? '' : 's'}
              </Typography>
            </Box>
            <Chip 
              label={`${logic.tokensDisponibles} 🎟️`}
              color="success"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        </Alert>
      )}

      {/* HEADER CON PESTAÑAS */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ '& .MuiTab-root': { minHeight: 60, fontWeight: 600 }, '& .Mui-selected': { color: 'primary.main' } }}>
          <Tab value="todos" label={<Stack direction="row" gap={1} alignItems="center">Todos <Chip label={counts.todos} size="small" sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }} /></Stack>} icon={<Apps fontSize="small" />} iconPosition="start" />
          <Tab value="activa" label={<Stack direction="row" gap={1} alignItems="center">En Curso <Chip label={counts.activa} color="success" size="small" sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }} /></Stack>} icon={<Gavel fontSize="small" />} iconPosition="start" disabled={counts.activa === 0} />
          <Tab value="pendiente" label={<Stack direction="row" gap={1} alignItems="center">Próximos <Chip label={counts.pendiente} color="warning" size="small" sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }} /></Stack>} icon={<AccessTime fontSize="small" />} iconPosition="start" disabled={counts.pendiente === 0} />
          <Tab value="finalizada" label={<Stack direction="row" gap={1} alignItems="center">Finalizados <Chip label={counts.finalizada} size="small" sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }} /></Stack>} icon={<EmojiEvents fontSize="small" />} iconPosition="start" disabled={counts.finalizada === 0} />
        </Tabs>
      </Box>

      {/* GRID DE RESULTADOS CON COMPONENTE MEMOIZADO */}
      {filteredLotes.length > 0 ? (
        <Fade in key={tabValue} timeout={300}>
          <Box sx={gridStyles}>
            {filteredLotes.map((lote) => (
              <MemoizedLoteCard 
                key={lote.id}
                lote={lote}
                onNavigate={handleNavigate}
                onPujar={handlePujar}
                onRemoveFav={handleRemoveFav}
                isSubscribed={logic.isSubscribed}
                hasTokens={logic.hasTokens}
                tokensDisponibles={logic.tokensDisponibles}
                isLoadingSub={logic.isLoading}
              />
            ))}
          </Box>
        </Fade>
      ) : (
        <Box py={8} textAlign="center" bgcolor="action.hover" borderRadius={4}>
          <Typography color="text.secondary">No hay lotes en esta categoría actualmente.</Typography>
          {tabValue !== 'todos' && (<Button sx={{ mt: 2 }} onClick={() => setTabValue('todos')}>Ver todos los lotes</Button>)}
        </Box>
      )}

      {/* MODALES */}
      {logic.selectedLote && (
        <PujarModal 
          open={logic.pujarModal.isOpen} 
          lote={logic.selectedLote} 
          onClose={logic.closePujarModal} 
        />
      )}

      <ConfirmDialog controller={logic.confirmDialog} onConfirm={logic.executeUnfav} isLoading={logic.unfavPending} />
      <GlobalSnackbar open={logic.snackbar.open} message={logic.snackbar.message} severity={logic.snackbar.severity} onClose={logic.closeSnackbar} />
    </Box>
  );
};