// src/features/client/pages/Lotes/ListaLotesProyecto.tsx

import { FilterListOff, Gavel } from '@mui/icons-material';
import {
  Alert,
  Box,
  CircularProgress,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react'; // <-- Asegúrate de importar useMemo
import { useNavigate } from 'react-router-dom';

import LoteService from '@/core/api/services/lote.service';
import { env } from '@/core/config/env';
import { useAuth } from '@/core/context/AuthContext';
import type { LoteDto } from '@/core/types/lote.dto';
import { ROUTES } from '@/routes';
import { useModal } from '@/shared/hooks/useModal';
import { useVerificarSuscripcion } from '../../hooks/useVerificarSuscripcion';
import LoteCard from './components/LoteCard';
import { PujarModal } from './modals/PujarModal';

const LoteCardSkeleton = () => (
  // ... tu código del esqueleto sigue igual ...
  <Box sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
    <Skeleton variant="rectangular" height={200} />
    <Box sx={{ p: 2.5 }}>
      <Skeleton variant="text" width="70%" height={28} />
      <Skeleton variant="text" width="50%" height={20} sx={{ mt: 1 }} />
      <Skeleton variant="text" width="40%" height={32} sx={{ mt: 1 }} />
      <Skeleton variant="rectangular" height={36} sx={{ mt: 2, borderRadius: 2 }} />
    </Box>
  </Box>
);

interface ListaLotesProyectoProps {
  idProyecto: number;
}

const ListaLotesProyecto: React.FC<ListaLotesProyectoProps> = ({ idProyecto }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const pujarModal = useModal();
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteDto | null>(null);

  const { estaSuscripto, tokensDisponibles, isLoading: isLoadingSub } = useVerificarSuscripcion(idProyecto);

  const { data: lotes, isLoading, isError } = useQuery({
    queryKey: ['lotes', 'proyecto', idProyecto],
    queryFn: async () => {
      const todos = (await LoteService.getAllActive()).data;
      return todos.filter((l) => Number(l.id_proyecto) === Number(idProyecto));
    },
    staleTime: env.queryStaleTime || 300000,
    enabled: !!idProyecto,
  });

  const handleNavigate = useCallback((id: number) => navigate(ROUTES.CLIENT.LOTES.DETALLE.replace(':id', String(id))), [navigate]);

  const handlePujar = useCallback((lote: LoteDto) => {
    setLoteSeleccionado(lote);
    pujarModal.open();
  }, [pujarModal]);

  const isLider = useCallback((lote: LoteDto) => {
    if (!user) return false;
    // Adaptado al cambio de pujaMasAlta que vimos antes
    if (lote.id_puja_mas_alta && Array.isArray(lote.pujas)) {
      return lote.pujas.some((p: any) => Number(p.id_usuario) === Number(user.id) && Number(p.id) === Number(lote.id_puja_mas_alta));
    }
    return false;
  }, [user]);

  const participa = useCallback((lote: LoteDto) => {
    if (!user || !Array.isArray(lote.pujas)) return false;
    return lote.pujas.some((p) => Number(p.id_usuario) === Number(user.id) && p.estado_puja !== 'cancelada');
  }, [user]);

//  Función para saber si el usuario ganó definitivamente este lote
  const ganadorDefinitivo = useCallback((lote: LoteDto) => {
    if (!user) return false;
    return lote.estado_subasta === 'finalizada' && Number(lote.id_ganador) === Number(user.id);
  }, [user]);

  // Lógica de Ordenamiento
  const lotesOrdenados = useMemo(() => {
    if (!lotes) return [];

    return [...lotes].sort((a, b) => {
      const aGanador = ganadorDefinitivo(a);
      const bGanador = ganadorDefinitivo(b);

      // 1. PRIORIDAD ABSOLUTA: Lotes que el usuario ya GANÓ
      if (aGanador && !bGanador) return -1;
      if (!aGanador && bGanador) return 1;

      const aParticipa = participa(a);
      const bParticipa = participa(b);

      // 2. Prioridad: Lotes donde el usuario participa actualmente
      if (aParticipa && !bParticipa) return -1;
      if (!aParticipa && bParticipa) return 1;

      // 3. Prioridad: Lotes con subasta abierta ('activa')
      const aActiva = a.estado_subasta === 'activa';
      const bActiva = b.estado_subasta === 'activa';

      if (aActiva && !bActiva) return -1;
      if (!aActiva && bActiva) return 1;

      // 4. Prioridad: Lotes 'pendientes' (próximamente) antes que los finalizados que perdió
      const aPendiente = a.estado_subasta === 'pendiente';
      const bPendiente = b.estado_subasta === 'pendiente';

      if (aPendiente && !bPendiente) return -1;
      if (!aPendiente && bPendiente) return 1;

      // Si hay empate en todo lo anterior, mantener el orden original del backend
      return 0;
    });
  }, [lotes, participa, ganadorDefinitivo]); 

  if (isLoading) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 3 }}>
        {Array.from({ length: 3 }).map((_, i) => <LoteCardSkeleton key={i} />)}
      </Box>
    );
  }

  if (isError) return <Alert severity="error" sx={{ borderRadius: 3 }}>No se pudieron cargar los lotes.</Alert>;

  if (!lotesOrdenados || lotesOrdenados.length === 0) {

    return (
      <Stack alignItems="center" justifyContent="center" spacing={2} py={8}>
        <FilterListOff sx={{ fontSize: 56, color: 'text.disabled' }} />
        <Typography variant="h6" color="text.secondary" fontWeight={700}>Sin lotes disponibles</Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center">Este proyecto aún no tiene lotes publicados para subasta.</Typography>
      </Stack>
    );
  }

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <Gavel sx={{ color: 'text.secondary', fontSize: 20 }} />
        {/* Cambiar lotes.length a lotesOrdenados.length */}
        <Typography variant="body2" color="text.secondary" fontWeight={700}>{lotesOrdenados.length} lote{lotesOrdenados.length !== 1 ? 's' : ''} en subasta</Typography>
        {isLoadingSub && <CircularProgress size={14} />}
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 3 }}>
        {/* ✅ MAPEAMOS EL ARRAY ORDENADO EN LUGAR DEL ORIGINAL */}
        {lotesOrdenados.map((lote) => (
          <LoteCard
            key={lote.id} lote={lote} onNavigate={handleNavigate} onPujar={handlePujar}
            isSubscribed={estaSuscripto} hasTokens={tokensDisponibles > 0}
            isLoadingSub={isLoadingSub} isAuthenticated={isAuthenticated}
          />
        ))}
      </Box>

      {loteSeleccionado && (
        <PujarModal
          {...pujarModal.modalProps}
          lote={loteSeleccionado}
          yaParticipa={participa(loteSeleccionado)}
          soyGanador={isLider(loteSeleccionado)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['lotes', 'proyecto', idProyecto] })}
        />
      )}
    </>
  );
};

export default ListaLotesProyecto;