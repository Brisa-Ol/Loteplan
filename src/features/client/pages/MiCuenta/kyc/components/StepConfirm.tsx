import { Assignment, RadioButtonUnchecked } from '@mui/icons-material';
import { Avatar, Box, Card, CardContent, Divider, Stack, Typography, alpha, useTheme } from '@mui/material';

export const StepConfirm = ({ data, files }: any) => {
    const theme = useTheme();
    return (
        <Stack spacing={4}>
            <Box display="flex" alignItems="center" gap={2}>
                <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Assignment /></Avatar>
                <Typography variant="h6" fontWeight={700}>Resumen de Envío</Typography>
            </Box>
            <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.05), border: '1px solid divider', borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={3}>
                        <Box><Typography variant="caption" fontWeight={700}>NOMBRE</Typography><Typography>{data.nombreCompleto}</Typography></Box>
                        <Box><Typography variant="caption" fontWeight={700}>ID</Typography><Typography>{data.tipoDocumento} - {data.numeroDocumento}</Typography></Box>
                        <Box sx={{ gridColumn: '1 / -1' }}><Divider /></Box>
                        <Box sx={{ gridColumn: '1 / -1' }}>
                            <Typography variant="caption" fontWeight={700} display="block" mb={1}>ARCHIVOS</Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                {Object.entries(files).filter(([_, f]) => f).map(([key]) => (
                                    <Box key={key} sx={{ px: 2, py: 0.5, borderRadius: 10, border: '1px solid divider', bgcolor: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <RadioButtonUnchecked color="success" fontSize="inherit" /> {key.toUpperCase()}
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Stack>
    );
};