// src/features/client/pages/Lotes/ListaLotesProyecto.tsx

import {
  AccessTime, Apps, Block, EmojiEvents, Gavel, Lock,
} from '@mui/icons-material';
import {
  Alert, Box, Button, Fade, Skeleton, Stack, Tab, Tabs, Typography, alpha, useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ProyectoService from '@/core/api/services/proyecto.service';
import { useAuth } from '@/core/context/AuthContext';
import type { LoteDto } from '@/core/types/dto/lote.dto';
import type { ProyectoDto } from '@/core/types/dto/proyecto.dto';
import { ROUTES } from '@/routes';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { useLotesProyecto } from '../../hooks/useLotesProyecto';
import LoteCard from './components/LoteCard';
import { PujarModal } from './modals/PujarModal';

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

const MemoizedLoteCard = React.memo(LoteCard, (prev, next) =>
  prev.lote.id === next.lote.id &&
  prev.lote.estado_subasta === next.lote.estado_subasta &&
  prev.lote.precio_base === next.lote.precio_base &&
  prev.lote.monto_ganador_lote === next.lote.monto_ganador_lote &&
  prev.isSubscribed === next.isSubscribed &&
  prev.hasTokens === next.hasTokens &&
  prev.tokensDisponibles === next.tokensDisponibles &&
  prev.isLoadingSub === next.isLoadingSub &&
  prev.isAuthenticated === next.isAuthenticated &&
  (prev.lote.pujas?.length || 0) === (next.lote.pujas?.length || 0),
);
MemoizedLoteCard.displayName = 'MemoizedLoteCard';

export const ListaLotesProyecto: React.FC<Props> = ({ idProyecto }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [tabValue, setTabValue] = useState('todos');

  const { data: proyecto, isLoading: loadingProyecto } = useQuery<ProyectoDto>({
    queryKey: ['proyecto', idProyecto],
    queryFn: async () => (await ProyectoService.getByIdActive(idProyecto)).data,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const logic = useLotesProyecto(idProyecto, isAuthenticated);

  const { filteredLotes, counts } = useMemo(() => {
    if (!logic.lotes) return { filteredLotes: [], counts: { todos: 0, activa: 0, pendiente: 0, finalizada: 0 } };

    const counts = logic.lotes.reduce(
      (acc, lote) => {
        acc.todos++;
        const estado = lote.estado_subasta as keyof typeof acc;
        if (acc[estado] !== undefined) acc[estado]++;
        return acc;
      },
      { todos: 0, activa: 0, pendiente: 0, finalizada: 0 },
    );

    let result = logic.lotes;
    if (tabValue !== 'todos') {
      result = result.filter((l) => l.estado_subasta === tabValue);
    }
    if (tabValue === 'todos') {
      result = [...result].sort((a, b) => getPesoEstado(b.estado_subasta) - getPesoEstado(a.estado_subasta));
    }

    return { filteredLotes: result, counts };
  }, [logic.lotes, tabValue]);

  const handleNavigate = useCallback((id: number) => {
    navigate(ROUTES.CLIENT.LOTES.DETALLE.replace(':id', String(id)));
  }, [navigate]);

  const handlePujar = useCallback((lote: LoteDto) => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: window.location.pathname }, replace: false });
      return;
    }
    logic.handleOpenPujar(lote);
  }, [isAuthenticated, logic, navigate]);

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
    gap: 3,
    alignItems: 'stretch',
  };

  // ── Renders condicionales ──────────────────────

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

  if (proyecto?.tipo_inversion === 'directo') {
    return (
      <Fade in timeout={500}>
        <Box
          mt={{ xs: 2, md: 4 }} p={{ xs: 3, md: 5 }} textAlign="center"
          bgcolor="background.paper" borderRadius={4}
          border={`1px solid ${theme.palette.divider}`}
        >
          <Block sx={{ fontSize: 60, color: 'warning.main', mb: 2, opacity: 0.7 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>Inventario No Disponible</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Este es un proyecto de <strong>inversión directa</strong>. Los lotes forman parte del pack completo.
          </Typography>
          <Button variant="outlined" onClick={() => navigate(ROUTES.PUBLIC.HOME)}>Volver a Proyectos</Button>
        </Box>
      </Fade>
    );
  }

  if (logic.isLoading) {
    return <Box mt={4}><Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} /></Box>;
  }

  if (logic.error) return <Alert severity="error">Error al cargar inventario.</Alert>;

  return (
    <Box mt={{ xs: 3, md: 4 }}>

      {/* ✅ APLICACIÓN DEL PAGE HEADER */}


      {/* Alertas de autenticación / suscripción */}
      {!isAuthenticated && (
        <Alert
          severity="info" variant="outlined" icon={<Lock />}
          sx={{ mb: 3, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.02) }}
        >
          <Typography variant="body2">
            Estás viendo el <strong>inventario público</strong>. Inicia sesión para participar.
          </Typography>
          <Button
            size="small" variant="text"
            onClick={() => navigate(ROUTES.LOGIN)}
            sx={{ mt: 1, fontWeight: 700, textTransform: 'none' }}
          >
            Iniciar Sesión ahora
          </Button>
        </Alert>
      )}

      {isAuthenticated && !logic.isSubscribed && !logic.isLoading && (
        <Alert severity="warning" variant="outlined" icon={<Lock />} sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>Suscripción Requerida</Typography>
          <Typography variant="body2">Debes estar suscripto al proyecto para participar en las subastas.</Typography>
        </Alert>
      )}

      {/* Tabs de filtro */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
          <Tab value="todos" label={`Todos (${counts.todos})`} icon={<Apps fontSize="small" />} iconPosition="start" />
          <Tab value="activa" label={`En Curso (${counts.activa})`} icon={<Gavel fontSize="small" />} iconPosition="start" disabled={counts.activa === 0} />
          <Tab value="pendiente" label={`Próximos (${counts.pendiente})`} icon={<AccessTime fontSize="small" />} iconPosition="start" disabled={counts.pendiente === 0} />
          <Tab value="finalizada" label={`Finalizados (${counts.finalizada})`} icon={<EmojiEvents fontSize="small" />} iconPosition="start" disabled={counts.finalizada === 0} />
        </Tabs>
      </Box>

      {/* Listado */}
      {filteredLotes.length > 0 ? (
        <Fade in key={tabValue} timeout={300}>
          <Box sx={gridStyles}>
            {filteredLotes.map((lote) => (
              <MemoizedLoteCard
                key={lote.id}
                lote={lote}
                onNavigate={handleNavigate}
                onPujar={handlePujar}
                isSubscribed={logic.isSubscribed}
                hasTokens={logic.hasTokens}
                tokensDisponibles={logic.tokensDisponibles}
                isLoadingSub={logic.isLoading}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </Box>
        </Fade>
      ) : (
        <Box py={8} textAlign="center" bgcolor="action.hover" borderRadius={4}>
          <Typography color="text.secondary">No hay lotes en esta categoría actualmente.</Typography>
        </Box>
      )}

      {logic.selectedLote && (
        <PujarModal
          open={logic.pujarModal.isOpen}
          lote={logic.selectedLote}
          onClose={logic.closePujarModal}
        />
      )}

      <ConfirmDialog
        controller={logic.confirmDialog}
        onConfirm={logic.executeUnfav}
        isLoading={logic.unfavPending}
      />
    </Box>
  );
};