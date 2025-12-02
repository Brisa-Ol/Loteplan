// src/components/Proyectos/ListaLotesProyecto.tsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, Card, CardContent, Typography, Button, Chip, Stack, Skeleton, Alert 
} from '@mui/material';
import { Gavel, CheckCircle, LockClock } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import type { LoteDto } from '../../../types/dto/lote.dto';
import LoteService from '../../../Services/lote.service';
import { PujarModal } from '../Proyectos/components/PujarModal';
import { FavoritoButton } from '../../../components/common/BotonFavorito/BotonFavorito';


interface Props {
  idProyecto: number;
}

export const ListaLotesProyecto: React.FC<Props> = ({ idProyecto }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedLote, setSelectedLote] = useState<LoteDto | null>(null);

  // 1. Obtener lotes del proyecto
  const { data: lotes, isLoading, error } = useQuery<LoteDto[]>({
    queryKey: ['lotesProyecto', idProyecto],
    queryFn: async () => {
      const res = await LoteService.getByProject(idProyecto);
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <Box mt={4}>
        <Typography variant="h5" gutterBottom fontWeight="bold">Lotes en Subasta</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Skeleton variant="rectangular" height={200} width="100%" sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={200} width="100%" sx={{ borderRadius: 2 }} />
        </Stack>
      </Box>
    );
  }

  if (error) return <Alert severity="error">Error cargando lotes.</Alert>;

  if (!lotes || lotes.length === 0) {
    return (
      <Box mt={4} p={4} bgcolor="grey.100" borderRadius={2} textAlign="center">
        <Typography color="text.secondary">No hay lotes disponibles en este momento.</Typography>
      </Box>
    );
  }

  return (
    <Box mt={5}>
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
        Lotes en Subasta
      </Typography>
      
      {/* 🏗️ LAYOUT: CSS Grid Responsivo */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',       // 1 columna en móvil
            sm: '1fr 1fr',   // 2 columnas en tablet
            md: 'repeat(3, 1fr)' // 3 columnas en desktop
          },
          gap: 3 // Espacio entre tarjetas
        }}
      >
        {lotes.map((lote) => (
          <Card 
            key={lote.id} 
            variant="outlined" 
            // Navegación al hacer clic en la tarjeta
            onClick={() => navigate(`/lotes/${lote.id}`)}
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 3,
              transition: 'all 0.2s',
              cursor: 'pointer',
              '&:hover': { boxShadow: 3, borderColor: 'primary.main' }
            }}
          >
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              
              {/* Header con nombre y favorito */}
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="h6" fontWeight="bold" lineHeight={1.2} flex={1}>
                  {lote.nombre_lote}
                </Typography>
                
                {/* 🛑 IMPORTANTE: e.stopPropagation() previene que al hacer clic 
                   en el corazón o el chip se active la navegación de la tarjeta.
                */}
                <Box display="flex" alignItems="center" gap={1} onClick={(e) => e.stopPropagation()}>
                  
                  {/* 👇 BOTÓN DE FAVORITO INTEGRADO */}
                  <FavoritoButton loteId={lote.id} size="small" />
                  
                  {lote.estado_subasta === 'finalizada' ? (
                    <Chip label="Vendido" color="default" size="small" variant="filled" />
                  ) : lote.estado_subasta === 'activa' ? (
                    <Chip label="Activo" color="success" size="small" icon={<CheckCircle />} />
                  ) : (
                    <Chip label="Próximamente" color="info" size="small" icon={<LockClock />} />
                  )}
                </Box>
              </Stack>
              
              {/* Precio Base */}
              <Box mb={3}>
                <Typography variant="caption" color="text.secondary" display="block">
                  PRECIO BASE
                </Typography>
                <Typography variant="h5" color="primary.main" fontWeight={700}>
                  USD {Number(lote.precio_base).toLocaleString()}
                </Typography>
              </Box>
              
              {/* Botón de Acción (Al fondo) */}
              <Box mt="auto">
                {lote.estado_subasta === 'activa' ? (
                  <Button 
                    variant="contained" 
                    fullWidth 
                    startIcon={<Gavel />}
                    onClick={(e) => {
                        // 🛑 Detener propagación para que no navegue al detalle al pulsar el botón
                        e.stopPropagation(); 
                        
                        if(!isAuthenticated) return navigate('/login');
                        setSelectedLote(lote);
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Pujar Ahora
                  </Button>
                ) : (
                  <Button variant="outlined" fullWidth disabled>
                    No Disponible
                  </Button>
                )}
              </Box>

            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Modal de Puja */}
      {selectedLote && (
        <PujarModal 
          open={!!selectedLote} 
          lote={selectedLote} 
          onClose={() => setSelectedLote(null)} 
        />
      )}
    </Box>
  );
};