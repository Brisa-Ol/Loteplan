// src/features/admin/pages/Usuarios/modals/sections/KycDataColumn.tsx

import { env } from '@/core/config/env';
import type { KycDTO } from '@/core/types/kyc.dto';
import {
    AccountCircle,
    AdminPanelSettings as AdminIcon,
    AssignmentInd,
    CakeOutlined as BirthdayIcon,
    EventAvailable as DateIcon,
    Email,
    Fingerprint as FingerprintIcon,
    Public as IpIcon,
    MapOutlined as MapIcon,
    Person as PersonIcon,
    Phone,
    HighlightOff as RejectIcon,
    ShieldOutlined as ShieldIcon,
    WarningAmber
} from '@mui/icons-material';
import { Alert, alpha, Avatar, Box, Button, Divider, Paper, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';

// --- Mini componentes reutilizables (Más compactos) ---

const LabelCaption = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <Stack direction="row" spacing={0.75} alignItems="center" mb={1}>
        {React.cloneElement(icon as React.ReactElement<any>, { sx: { fontSize: 16, color: 'text.secondary' } })}
        <Typography variant="overline" color="text.secondary" lineHeight={1} sx={{ fontSize: '0.65rem' }}>
            {children}
        </Typography>
    </Stack>
);

const UserDataField = ({ icon, label, value, isHighlight = false }: { icon: React.ReactNode; label: string; value?: string | null; isHighlight?: boolean }) => {
    const theme = useTheme();
    return (
        <Box sx={{
            p: 1.25, // Reducido de 1.5
            borderRadius: 1.5,
            bgcolor: isHighlight ? alpha(theme.palette.warning.main, 0.1) : theme.palette.secondary.light,
            border: '1px solid',
            borderColor: isHighlight ? 'warning.main' : 'secondary.main',
            transition: theme.transitions.create(['border-color', 'background-color'])
        }}>
            <Stack direction="row" spacing={0.75} alignItems="center" mb={0.25}>
                {React.cloneElement(icon as React.ReactElement<any>, { sx: { fontSize: 14, color: isHighlight ? 'warning.main' : 'primary.main' } })}
                <Typography variant="overline" color="text.secondary" lineHeight={1} sx={{ fontSize: '0.6rem' }}>
                    {label}
                </Typography>
                {isHighlight && <WarningAmber sx={{ fontSize: 14, color: 'warning.main', ml: 'auto' }} />}
            </Stack>
            {/* Reducido a body2 para que el texto ocupe menos espacio */}
            <Typography variant="body2" fontWeight={600} color="text.primary">
                {value || 'N/D'}
            </Typography>
        </Box>
    );
};

interface Props {
    kyc: KycDTO;
    isPending: boolean;
}

const KycDataColumn: React.FC<Props> = ({ kyc, isPending }) => {
    const theme = useTheme();
    const usr = kyc.usuario;

    const googleMapsUrl = kyc.latitud_verificacion && kyc.longitud_verificacion
        ? `https://www.google.com/maps?q=${kyc.latitud_verificacion},${kyc.longitud_verificacion}`
        : null;

    return (
        // Reducimos el espaciado principal de 4 a 2.5
        <Stack spacing={2.5}>

            {/* 1. Solicitante (Datos del KYC) */}
            <Box>
                <LabelCaption icon={<PersonIcon />}>Datos del Solicitante (KYC)</LabelCaption>
                <Paper variant="outlined" sx={{ p: 2, borderColor: 'secondary.main', borderRadius: 2 }}>

                    {/* Header: Avatar, Nombre e ID */}
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                        <Avatar sx={{
                            bgcolor: 'primary.main', width: 38, height: 38, // Avatar más pequeño
                            fontWeight: 700, fontSize: '1.1rem',
                        }}>
                            {kyc.nombre_completo.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box minWidth={0}>
                            {/* Cambiado de h6 a subtitle1 */}
                            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} noWrap>{kyc.nombre_completo}</Typography>
                            <Typography variant="caption" color="text.secondary">ID Usuario: #{kyc.id_usuario}</Typography>
                        </Box>
                    </Stack>

                    <Divider sx={{ mb: 2, borderColor: 'secondary.main' }} />

                    {/* Grid de Datos del Formulario KYC (gap reducido a 1.5) */}
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={1.5}>
                        <UserDataField
                            icon={<FingerprintIcon />}
                            label={`Documento (${kyc.tipo_documento})`}
                            value={kyc.numero_documento}
                        />

                        <UserDataField
                            icon={<BirthdayIcon />}
                            label="Nacimiento"
                            value={kyc.fecha_nacimiento ? new Date(kyc.fecha_nacimiento).toLocaleDateString(env.defaultLocale) : 'No declarada'}
                        />
                    </Box>
                </Paper>
            </Box>

            {/* 2. Datos de Registro */}
            {usr && (
                <Box>
                    <LabelCaption icon={<AccountCircle />}>Datos del Registro (Original)</LabelCaption>
                    <Paper variant="outlined" sx={{ p: 2, borderColor: 'secondary.main', borderRadius: 2 }}>
                        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={1.5}>
                            <UserDataField
                                icon={<AccountCircle />}
                                label="Nombre "
                                value={`${usr.nombre || ''} ${usr.apellido || ''}`.trim()}
                                isHighlight={kyc.nombre_completo.trim().toLowerCase() !== `${usr.nombre || ''} ${usr.apellido || ''}`.trim().toLowerCase()}
                            />

                            <UserDataField
                                icon={<AssignmentInd />}
                                label="DNI"
                                value={usr.dni}
                                isHighlight={kyc.numero_documento !== usr.dni}
                            />

                            <UserDataField icon={<Email />} label="Email" value={usr.email} />
                            <UserDataField icon={<Phone />} label="Teléfono" value={usr.numero_telefono} />
                        </Box>
                    </Paper>
                </Box>
            )}

            {/* 3. Seguridad Técnica */}
            <Box>
                <LabelCaption icon={<ShieldIcon />}>Seguridad Técnica</LabelCaption>
                <Paper variant="outlined" sx={{ p: 1.5, borderColor: alpha(theme.palette.info.main, 0.2), bgcolor: alpha(theme.palette.info.main, 0.02), borderRadius: 2 }}>
                    <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <IpIcon sx={{ fontSize: 14, color: 'info.main' }} />
                                <Typography variant="caption" fontWeight={600} color="text.secondary">Dirección IP:</Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{kyc.ip_verificacion || 'Desconocida'}</Typography>
                        </Box>

                        <Divider sx={{ borderColor: alpha(theme.palette.info.main, 0.1) }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <MapIcon sx={{ fontSize: 14, color: 'info.main' }} />
                                <Typography variant="caption" fontWeight={600} color="text.secondary">Ubicación:</Typography>
                            </Stack>
                            {googleMapsUrl ? (
                                <Button size="small" variant="text" onClick={() => window.open(googleMapsUrl, '_blank')}
                                    sx={{ fontSize: '0.75rem', p: 0, minWidth: 0 }}
                                >
                                    Abrir Mapa
                                </Button>
                            ) : (
                                <Typography variant="caption" color="text.disabled">Sin GPS</Typography>
                            )}
                        </Box>
                    </Stack>
                </Paper>
            </Box>

            {/* 4. Auditoría */}
            {!isPending && (
                <Box>
                    <Divider sx={{ mb: 2, borderColor: 'secondary.main' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">Registro de Auditoría</Typography>
                    </Divider>

                    <Paper variant="outlined" sx={{ p: 1.5, borderStyle: 'dashed', borderColor: 'secondary.main', bgcolor: 'secondary.light', borderRadius: 2 }}>
                        <LabelCaption icon={<AdminIcon />}>Evaluado por</LabelCaption>
                        {kyc.verificador ? (
                            <Stack direction="row" spacing={1.5} alignItems="center" mt={0.5}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.dark', fontWeight: 700, fontSize: '0.85rem' }}>
                                    {kyc.verificador.nombre.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                                        {kyc.verificador.nombre} {kyc.verificador.apellido}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {kyc.verificador.email}
                                    </Typography>
                                </Box>
                            </Stack>
                        ) : (
                            <Typography variant="body2" fontStyle="italic" color="text.disabled">
                                ID Administrador: {kyc.id_verificador || 'N/D'}
                            </Typography>
                        )}

                        {kyc.fecha_verificacion && (
                            <>
                                <Divider sx={{ my: 1, borderColor: 'secondary.main' }} />
                                <Box>
                                    <LabelCaption icon={<DateIcon />}>Fecha Resolución</LabelCaption>
                                    <Typography variant="body2" fontWeight={600} color="text.primary">
                                        {new Date(kyc.fecha_verificacion).toLocaleDateString(env.defaultLocale)} a las{' '}
                                        {new Date(kyc.fecha_verificacion).toLocaleTimeString(env.defaultLocale, { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Paper>
                </Box>
            )}

            {/* 5. Motivo Rechazo */}
            {kyc.motivo_rechazo && (
                <Box>
                    <LabelCaption icon={<RejectIcon color="error" />}>
                        <Box component="span" sx={{ color: 'error.main' }}>Motivo del Rechazo</Box>
                    </LabelCaption>
                    <Alert severity="error" sx={{ borderRadius: 2, py: 0, '& .MuiAlert-message': { fontSize: '0.875rem' } }}>
                        {kyc.motivo_rechazo}
                    </Alert>
                </Box>
            )}
        </Stack>
    );
};

export default KycDataColumn;