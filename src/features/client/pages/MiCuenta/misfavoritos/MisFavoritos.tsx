import React from 'react';
import { Alert, Box, Chip } from '@mui/material';
import { PageContainer, PageHeader, ConfirmDialog } from '@/shared';
import { useFavoritesLogic } from './hooks/useFavoritesLogic';

// Sub-componentes
import FavoriteCard from './components/FavoriteCard';
import { EmptyFavorites } from './components/EmptyFavorites';
import { LoadingFavorites } from './components/LoadingFavorites';


const MisFavoritos: React.FC = () => {
  const {
    favoritos, isLoading, error, confirmDialog, isRemoving,
    handleConfirmDelete, handleVerDetalle, handleExplorar
  } = useFavoritesLogic();

  if (isLoading) return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Mis Favoritos" subtitle="Cargando..." />
      <LoadingFavorites />
    </PageContainer>
  );

  if (error) return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Mis Favoritos" />
      <Alert severity="error">Error al cargar tus favoritos. Intentá de nuevo más tarde.</Alert>
    </PageContainer>
  );

  return (
    <PageContainer maxWidth="xl">
      <PageHeader title="Mis Favoritos" subtitle="Seguí de cerca las oportunidades que te interesan." />

      {favoritos.length > 0 ? (
        <>
          <Box mb={3}>
            <Chip
              label={`${favoritos.length} lote${favoritos.length !== 1 ? 's' : ''} en seguimiento`}
              color="primary" size="small" sx={{ fontWeight: 700 }}
            />
          </Box>
          <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3} pb={4}>
            {favoritos.map((lote) => (
              <FavoriteCard
                key={lote.id}
                lote={lote}
                onVerDetalle={handleVerDetalle}
                onRemove={(id) => confirmDialog.confirm('remove_favorite', id)}
                isRemoving={isRemoving && confirmDialog.data === lote.id}
              />
            ))}
          </Box>
        </>
      ) : (
        <EmptyFavorites onExplorar={handleExplorar} />
      )}

      <ConfirmDialog
        controller={confirmDialog}
        onConfirm={handleConfirmDelete}
        isLoading={isRemoving}
        title="¿Dejar de seguir este lote?"
        description="Se eliminará de tu lista de favoritos."
      />
    </PageContainer>
  );
};

export default MisFavoritos;