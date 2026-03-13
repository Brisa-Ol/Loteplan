// components/LoadingFavorites.tsx
import { Box, Skeleton } from '@mui/material';

export const LoadingFavorites = () => (
    <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3}>
        {[1, 2, 3, 4].map(n => <Skeleton key={n} variant="rectangular" height={380} sx={{ borderRadius: 4 }} />)}
    </Box>
);