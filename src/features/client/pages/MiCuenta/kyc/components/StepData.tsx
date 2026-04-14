import { Person } from '@mui/icons-material';
import { alpha, Avatar, Box, MenuItem, Stack, TextField, Typography, useTheme } from '@mui/material';

export const StepData = ({ data, onChange }: any) => {
    const theme = useTheme();
    return (
        <Stack spacing={4}>
            <Box display="flex" alignItems="center" gap={2}>
                <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Person /></Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={700}>Información Básica</Typography>
                    <Typography variant="body2" color="text.secondary">Ingresa tus datos tal cual figuran en tu documento.</Typography>
                </Box>
            </Box>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                <TextField select fullWidth label="Tipo Documento" value={data.tipo_documento} onChange={(e) => onChange({ ...data, tipo_documento: e.target.value })}>
                    {['DNI', 'PASAPORTE', 'LICENCIA'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField fullWidth label="Número Documento" value={data.numero_documento} onChange={(e) => onChange({ ...data, numero_documento: e.target.value })} />
                <Box sx={{ gridColumn: '1 / -1' }}>
                    <TextField fullWidth label="Nombre Completo" value={data.nombre_completo} onChange={(e) => onChange({ ...data, nombre_completo: e.target.value })} />
                </Box>
                <TextField fullWidth type="date" label="Fecha Nacimiento" value={data.fecha_nacimiento} onChange={(e) => onChange({ ...data, fecha_nacimiento: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Box>
        </Stack>
    );
};