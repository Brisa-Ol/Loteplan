// components/EmptyFavorites.tsx
import { Card, Typography, Button } from '@mui/material';
import { BookmarkBorder, Gavel as GavelIcon } from '@mui/icons-material';

export const EmptyFavorites = ({ onExplorar }: { onExplorar: () => void }) => (
    <Card elevation={0} sx={{ p: 8, textAlign: 'center', bgcolor: 'background.default', border: '2px dashed', borderColor: 'divider', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <BookmarkBorder sx={{ fontSize: 48, color: 'primary.main', opacity: 0.6, mb: 3 }} />
        <Typography variant="h5" fontWeight={800} gutterBottom>Tu lista de seguimiento está vacía</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mb: 4 }}>Guarda los lotes que te interesen para monitorear su precio y estado.</Typography>
        <Button variant="contained" size="large" startIcon={<GavelIcon />} onClick={onExplorar} sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}>Explorar Oportunidades</Button>
    </Card>
);