import React, { useState, useMemo, useCallback } from 'react';
import { 
  Box, Typography, Stack, Skeleton, Alert, useTheme, Fade, 
  Tabs, Tab, Chip, Button
} from '@mui/material';
import { 
  Lock, Gavel, AccessTime, EmojiEvents, Apps 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useLotesProyecto } from '../../hooks/useLotesProyecto';
import PujarModal from './components/PujarModal';
import LoteCard from './components/LoteCard'; 
import { GlobalSnackbar } from '../../../../shared/components/ui/feedback/GlobalSnackbarProps/GlobalSnackbarProps';
import { useAuth } from '@/core/context/AuthContext';
import { ConfirmDialog } from '@/shared/components/domain/modals/ConfirmDialog/ConfirmDialog';
import { ROUTES } from '@/routes';
import { useVerificarSuscripcion } from '../../hooks/useVerificarSuscripcion';


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

export const ListaLotesProyecto: React.FC<Props> = ({ idProyecto }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [tabValue, setTabValue] = useState('todos');

  const logic = useLotesProyecto(idProyecto, isAuthenticated);

  // 1. VERIFICAR SUSCRIPCIÓN EN EL PADRE
  const { estaSuscripto, isLoading: loadingSub } = useVerificarSuscripcion(idProyecto);

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

  const handleNavigate = useCallback((id: number) => {
    const ruta = ROUTES.CLIENT.LOTES.DETALLE.replace(':id', String(id));
    navigate(ruta);
  }, [navigate]);

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
    gap: 3,
    alignItems: 'stretch'
  };

  if (!isAuthenticated) {
    return (
      <Fade in timeout={500}>
        <Box mt={{ xs: 2, md: 4 }} p={{ xs: 3, md: 5 }} textAlign="center" bgcolor="background.paper" borderRadius={4} border={`1px dashed ${theme.palette.divider}`}>
          <Lock sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>Inventario Exclusivo</Typography>
          <Button variant="contained" onClick={() => navigate('/login')}>Iniciar Sesión para ver Lotes</Button>
        </Box>
      </Fade>
    );
  }

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

  return (
    <Box mt={{ xs: 3, md: 4 }}>
      {/* HEADER CON PESTAÑAS (Igual) */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ '& .MuiTab-root': { minHeight: 60, fontWeight: 600 }, '& .Mui-selected': { color: 'primary.main' } }}>
          <Tab value="todos" label={<Stack direction="row" gap={1} alignItems="center">Todos <Chip label={counts.todos} size="small" sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }} /></Stack>} icon={<Apps fontSize="small" />} iconPosition="start" />
          <Tab value="activa" label={<Stack direction="row" gap={1} alignItems="center">En Curso <Chip label={counts.activa} color="success" size="small" sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }} /></Stack>} icon={<Gavel fontSize="small" />} iconPosition="start" disabled={counts.activa === 0} />
          <Tab value="pendiente" label={<Stack direction="row" gap={1} alignItems="center">Próximos <Chip label={counts.pendiente} color="warning" size="small" sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }} /></Stack>} icon={<AccessTime fontSize="small" />} iconPosition="start" disabled={counts.pendiente === 0} />
          <Tab value="finalizada" label={<Stack direction="row" gap={1} alignItems="center">Finalizados <Chip label={counts.finalizada} size="small" sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }} /></Stack>} icon={<EmojiEvents fontSize="small" />} iconPosition="start" disabled={counts.finalizada === 0} />
        </Tabs>
      </Box>

      {/* GRID DE RESULTADOS */}
      {filteredLotes.length > 0 ? (
        <Fade in key={tabValue} timeout={300}>
          <Box sx={gridStyles}>
            {filteredLotes.map((lote) => (
              <LoteCard 
                key={lote.id}
                lote={lote}
                onNavigate={handleNavigate}
                onPujar={logic.handleOpenPujar} 
                onRemoveFav={logic.handleRequestUnfav}
                // 2. PASAR PROPS AL HIJO
                isSubscribed={estaSuscripto}
                isLoadingSub={loadingSub}
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