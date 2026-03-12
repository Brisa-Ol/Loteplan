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
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import LoteService from '@/core/api/services/lote.service';
import { useAuth } from '@/core/context/AuthContext';
import type { LoteDto } from '@/core/types/lote.dto';
import { ROUTES } from '@/routes';
import { useModal } from '@/shared/hooks/useModal';
import { useVerificarSuscripcion } from '../../hooks/useVerificarSuscripcion';
import LoteCard from './components/LoteCard';
import { PujarModal } from './modals/PujarModal';
import { env } from '@/core/config/env'; // 👈 1. Importación de env

// ===================================================
// SKELETON LOADER
// ===================================================

const LoteCardSkeleton = () => (
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

// ===================================================
// COMPONENTE PRINCIPAL
// ===================================================

interface ListaLotesProyectoProps {
  idProyecto: number;
}

const ListaLotesProyecto: React.FC<ListaLotesProyectoProps> = ({ idProyecto }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const pujarModal = useModal();
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteDto | null>(null);

  // Suscripción del usuario a este proyecto
  const {
    estaSuscripto,
    tokensDisponibles,
    isLoading: isLoadingSub,
  } = useVerificarSuscripcion(idProyecto);

  // Lotes del proyecto
  const { data: lotes, isLoading, isError } = useQuery({
    queryKey: ['lotes', 'proyecto', idProyecto],
    queryFn: async () => {
      const todos = (await LoteService.getAllActive()).data;
      return todos.filter((l) => Number(l.id_proyecto) === Number(idProyecto));
    },
    // 👈 2. Aplicamos el tiempo de caché centralizado
    staleTime: env.queryStaleTime || 300000, 
    enabled: !!idProyecto,
  });

  // ── Handlers ──

  const handleNavigate = useCallback(
    (id: number) => navigate(ROUTES.CLIENT.LOTES.DETALLE.replace(':id', String(id))),
    [navigate]
  );

  const handlePujar = useCallback(
    (lote: LoteDto) => {
      setLoteSeleccionado(lote);
      pujarModal.open();
    },
    [pujarModal]
  );

  // ── Estados de carga / error ──

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <LoteCardSkeleton key={i} />
        ))}
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        No se pudieron cargar los lotes. Intentá nuevamente más tarde.
      </Alert>
    );
  }

  if (!lotes || lotes.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" spacing={2} py={8}>
        <FilterListOff sx={{ fontSize: 56, color: 'text.disabled' }} />
        <Typography variant="h6" color="text.secondary" fontWeight={700}>
          Sin lotes disponibles
        </Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center">
          Este proyecto aún no tiene lotes publicados para subasta.
        </Typography>
      </Stack>
    );
  }

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <Gavel sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography variant="body2" color="text.secondary" fontWeight={700}>
          {lotes.length} lote{lotes.length !== 1 ? 's' : ''} en subasta
        </Typography>
        {isLoadingSub && <CircularProgress size={14} />}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {lotes.map((lote) => (
          <LoteCard
            key={lote.id}
            lote={lote}
            onNavigate={handleNavigate}
            onPujar={handlePujar}
            isSubscribed={estaSuscripto}
            hasTokens={tokensDisponibles > 0}
            isLoadingSub={isLoadingSub}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </Box>

      {loteSeleccionado && (
        <PujarModal
          {...pujarModal.modalProps}
          lote={loteSeleccionado}
          yaParticipa={
            !!user &&
            Array.isArray(loteSeleccionado.pujas) &&
            loteSeleccionado.pujas.some(
              (p) => Number(p.id_usuario) === Number(user.id) && p.estado_puja === 'activa'
            )
          }
          soyGanador={!!user && Number(loteSeleccionado.id_ganador) === Number(user.id)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['lotes', 'proyecto', idProyecto] })}
        />
      )}
    </>
  );
};

export default ListaLotesProyecto;