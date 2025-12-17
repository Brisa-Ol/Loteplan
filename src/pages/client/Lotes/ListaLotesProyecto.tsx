// src/components/Proyectos/ListaLotesProyecto.tsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, CardMedia, Typography, Button,
  Chip, Stack, Skeleton, Alert, Fade, Tooltip
} from '@mui/material';
import {
  Gavel, CheckCircle, Lock, MonetizationOn, AccessTime, CalendarMonth
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Services and Context
import { useAuth } from '../../../context/AuthContext';
import LoteService from '../../../Services/lote.service';
import ImagenService from '../../../Services/imagen.service';
import type { LoteDto } from '../../../types/dto/lote.dto';

// Child Components
import { PujarModal } from '../Proyectos/components/PujarModal';
import { FavoritoButton } from '../../../components/common/BotonFavorito/BotonFavorito';

interface Props {
  idProyecto: number;
}

export const ListaLotesProyecto: React.FC<Props> = ({ idProyecto }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);

  const { data: lotes, isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['lotesProyecto', idProyecto],
    queryFn: async () => {
      // Obtenemos los lotes activos (que incluyen los "pendientes" si el backend lo permite)
      const res = await LoteService.getAllActive();
      const todosLosLotes = res.data;
      return todosLosLotes.filter(lote => lote.id_proyecto === idProyecto);
    },
    enabled: !!idProyecto && isAuthenticated,
    retry: 1
  });

  if (!isAuthenticated) {
    return (
      <Box mt={4} p={5} textAlign="center" bgcolor="grey.50" borderRadius={3} border="1px dashed" borderColor="grey.300">
        <Lock sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
          Sección Exclusiva
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Debes iniciar sesión para ver los lotes y participar en la subasta.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Iniciar Sesión
        </Button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box mt={4}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={380} width="100%" sx={{ borderRadius: 3 }} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (error) return <Alert severity="error" sx={{ mt: 2 }}>Error al cargar los lotes disponibles.</Alert>;

  if (!lotes || lotes.length === 0) {
    return (
      <Box mt={4} p={4} bgcolor="grey.100" borderRadius={2} textAlign="center">
        <Typography color="text.secondary">
          No hay lotes activos asignados a este proyecto actualmente.
        </Typography>
      </Box>
    );
  }

  return (
    <Box mt={4}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Inventario del Proyecto ({lotes.length})
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {lotes.map((lote) => {
          const imgUrl = lote.imagenes && lote.imagenes.length > 0
            ? ImagenService.resolveImageUrl(lote.imagenes[0].url)
            : '/assets/placeholder-lote.jpg';

          return (
            <Fade in={true} key={lote.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3,
                  cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'visible',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4, borderColor: 'primary.main' }
                }}
                onClick={() => navigate(`/lotes/${lote.id}`)}
              >
                {/* IMAGE AREA */}
                <Box sx={{ position: 'relative', height: 200, borderRadius: '12px 12px 0 0', overflow: 'hidden', bgcolor: 'grey.100' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={imgUrl}
                    alt={lote.nombre_lote}
                    sx={{ objectFit: 'cover' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/assets/placeholder-lote.jpg';
                    }}
                  />

                  <Box position="absolute" top={10} left={10}>
                    {lote.estado_subasta === 'activa' ? (
                      <Chip label="Activo" color="success" size="small" icon={<CheckCircle sx={{ color: 'white !important' }} />} />
                    ) : lote.estado_subasta === 'pendiente' ? (
                      <Chip label="Próximamente" color="warning" size="small" icon={<AccessTime sx={{ color: 'white !important' }} />} />
                    ) : (
                      <Chip label={lote.estado_subasta} color="default" size="small" />
                    )}
                  </Box>

                  <Box position="absolute" top={5} right={5} onClick={(e) => e.stopPropagation()}>
                    <FavoritoButton loteId={lote.id} />
                  </Box>
                </Box>

                {/* CONTENT AREA */}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pt: 2 }}>
                  <Typography variant="h6" fontWeight="bold" lineHeight={1.2} mb={1} noWrap>
                    {lote.nombre_lote}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Lote #{lote.id}
                  </Typography>

                  {/* Fecha si está pendiente (Información del Admin) */}
                  {lote.estado_subasta === 'pendiente' && lote.fecha_inicio && (
                    <Stack direction="row" spacing={1} alignItems="center" mb={2} sx={{ color: 'warning.main', bgcolor: 'warning.lighter', p: 0.5, borderRadius: 1 }}>
                      <CalendarMonth fontSize="small" />
                      <Typography variant="caption" fontWeight="bold">
                        Inicia: {new Date(lote.fecha_inicio).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  )}

                  <Box flexGrow={1} />

                  <Box mb={2} p={1.5} bgcolor="primary.50" borderRadius={2}>
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                      <MonetizationOn fontSize="inherit" /> PRECIO BASE
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={800}>
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(Number(lote.precio_base))}
                    </Typography>
                  </Box>

                  {/* ACTION BUTTON */}
                  {lote.estado_subasta === 'activa' ? (
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Gavel />}
                      onClick={(e) => { e.stopPropagation(); setSelectedLote(lote); }}
                      sx={{ borderRadius: 2, fontWeight: 'bold' }}
                    >
                      Pujar Ahora
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ borderRadius: 2, fontWeight: 'bold' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/lotes/${lote.id}`);
                      }}
                    >
                      Ver Detalles
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Fade>
          );
        })}
      </Box>

      {selectedLote && (
        <PujarModal open={!!selectedLote} lote={selectedLote} onClose={() => setSelectedLote(null)} />
      )}
    </Box>
  );
};