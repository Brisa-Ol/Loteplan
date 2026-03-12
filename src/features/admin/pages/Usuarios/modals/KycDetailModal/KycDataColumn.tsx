// src/features/admin/pages/Usuarios/modals/sections/KycDataColumn.tsx

import { env } from '@/core/config/env';
import type { KycDTO } from '@/core/types/dto/kyc.dto';
import {
    AdminPanelSettings as AdminIcon,
    CakeOutlined as BirthdayIcon,
    EventAvailable as DateIcon,
    Fingerprint as FingerprintIcon,
    Public as IpIcon,
    MapOutlined as MapIcon,
    Person as PersonIcon,
    HighlightOff as RejectIcon,
    ShieldOutlined as ShieldIcon
} from '@mui/icons-material';
import { Alert, alpha, Avatar, Box, Button, Chip, Divider, Paper, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';

const LabelCaption = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <Typography sx={{
        display: 'flex', alignItems: 'center', gap: 0.8,
        fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
        fontSize: '0.65rem', mb: 0.8, color: 'text.secondary',
    }}>
        {icon}{children}
    </Typography>
);

const MetaRow = ({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" fontWeight={700} sx={{ wordBreak: 'break-all', ml: 1 }}>{value}</Typography>
    </Box>
);

interface Props {
    kyc: KycDTO;
    isPending: boolean;
}

const KycDataColumn: React.FC<Props> = ({ kyc, isPending }) => {
    const theme = useTheme();

    const googleMapsUrl = kyc.latitud_verificacion && kyc.longitud_verificacion
        ? `https://www.google.com/maps?q=${kyc.latitud_verificacion},${kyc.longitud_verificacion}`
        : null;

    const cardSx = {
        p: 2, borderRadius: 2, border: '1px solid',
        borderColor: theme.palette.divider,
        bgcolor: alpha(theme.palette.background.paper, 0.5),
    };

    return (
        <Stack spacing={3.5}>
            {/* 1. Solicitante */}
            <Box>
                <LabelCaption icon={<PersonIcon fontSize="inherit" />}>Datos del Solicitante</LabelCaption>
                <Paper elevation={0} sx={cardSx}>
                    <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{
                                bgcolor: 'primary.main', width: 44, height: 44, fontWeight: 900, fontSize: '1rem',
                                boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`,
                            }}>
                                {kyc.nombre_completo.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box minWidth={0}>
                                <Typography variant="subtitle2" fontWeight={800} noWrap>{kyc.nombre_completo}</Typography>
                                <Typography variant="caption" color="text.secondary">ID Usuario: #{kyc.id_usuario}</Typography>
                            </Box>
                        </Stack>
                        <Divider sx={{ borderStyle: 'dotted' }} />
                        <Stack spacing={1}>
                            <MetaRow label="Email:" value={kyc.usuario?.email || 'N/D'} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Nacimiento:</Typography>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <BirthdayIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                    <Typography variant="caption" fontWeight={700}>
                                        {kyc.fecha_nacimiento ? new Date(kyc.fecha_nacimiento).toLocaleDateString(env.defaultLocale) : 'No declarada'}
                                    </Typography>
                                </Stack>
                            </Box>
                        </Stack>
                    </Stack>
                </Paper>
            </Box>

            {/* 2. Documento */}
            <Box>
                <LabelCaption icon={<FingerprintIcon fontSize="inherit" />}>Identificación ({kyc.tipo_documento})</LabelCaption>
                <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'monospace', letterSpacing: 2, pl: 0.5 }}>
                    {kyc.numero_documento}
                </Typography>
            </Box>

            {/* 3. Seguridad Técnica */}
            <Box>
                <LabelCaption icon={<ShieldIcon fontSize="inherit" />}>Seguridad Técnica</LabelCaption>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.03), border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.1) }}>
                    <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <IpIcon sx={{ fontSize: 14, color: 'info.main' }} />
                                <Typography variant="caption" fontWeight={600}>Dirección IP:</Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{kyc.ip_verificacion || 'Desconocida'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <MapIcon sx={{ fontSize: 14, color: 'info.main' }} />
                                <Typography variant="caption" fontWeight={600}>Ubicación:</Typography>
                            </Stack>
                            {googleMapsUrl ? (
                                <Button size="small" variant="text" onClick={() => window.open(googleMapsUrl, '_blank')}
                                    sx={{ fontSize: '0.65rem', minWidth: 0, p: 0, textTransform: 'none', fontWeight: 800 }}
                                >
                                    Ver en Mapa
                                </Button>
                            ) : (
                                <Typography variant="caption">Sin GPS</Typography>
                            )}
                        </Box>
                    </Stack>
                </Box>
            </Box>

            {/* 4. Auditoría */}
            {!isPending && (
                <Box>
                    <Divider sx={{ mb: 2 }}><Chip label="Log de Auditoría" size="small" sx={{ fontWeight: 800, fontSize: '0.6rem' }} /></Divider>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.action.hover, 0.5), border: '1px dashed', borderColor: theme.palette.divider }}>
                        <LabelCaption icon={<AdminIcon fontSize="inherit" />}>Verificado por</LabelCaption>
                        {kyc.verificador ? (
                            <Stack direction="row" spacing={1.5} alignItems="center" mt={1}>
                                <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.dark', fontSize: '0.65rem', fontWeight: 800 }}>
                                    {kyc.verificador.nombre.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" fontWeight={700} display="block" lineHeight={1}>
                                        {kyc.verificador.nombre} {kyc.verificador.apellido}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                        {kyc.verificador.email}
                                    </Typography>
                                </Box>
                            </Stack>
                        ) : (
                            <Typography variant="caption" fontStyle="italic" color="text.secondary">Admin ID: {kyc.id_verificador}</Typography>
                        )}

                        {kyc.fecha_verificacion && (
                            <Box mt={2}>
                                <LabelCaption icon={<DateIcon fontSize="inherit" />}>Fecha Resolución</LabelCaption>
                                <Typography variant="caption" fontWeight={700} color="text.primary">
                                    {new Date(kyc.fecha_verificacion).toLocaleDateString(env.defaultLocale)} a las{' '}
                                    {new Date(kyc.fecha_verificacion).toLocaleTimeString(env.defaultLocale, { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            )}

            {/* 5. Motivo Rechazo */}
            {kyc.motivo_rechazo && (
                <Box>
                    <LabelCaption icon={<RejectIcon fontSize="inherit" />}><span style={{ color: 'red' }}>Motivo del Rechazo</span></LabelCaption>
                    <Alert severity="error" variant="filled" sx={{ borderRadius: 2, '& .MuiAlert-message': { fontWeight: 600 } }}>
                        {kyc.motivo_rechazo}
                    </Alert>
                </Box>
            )}
        </Stack>
    );
};

export default KycDataColumn;