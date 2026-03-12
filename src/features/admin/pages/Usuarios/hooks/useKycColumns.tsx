// src/features/admin/pages/Usuarios/hooks/useKycColumns.tsx

import type { KycDTO } from '@/core/types/dto/kyc.dto';
import type { DataTableColumn } from '@/shared';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import { alpha, Avatar, Box, Chip, IconButton, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { useMemo } from 'react';
import type { useAdminKYC } from '../../../hooks/usuario/useAdminKYC';

const useKycColumns = (logic: ReturnType<typeof useAdminKYC>) => {
    const theme = useTheme();

    return useMemo<DataTableColumn<KycDTO>[]>(() => [
        {
            id: 'usuario',
            label: 'Solicitante',
            minWidth: 220,
            sortable: true,
            cardPrimary: true,
            render: (kyc) => (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        fontWeight: 800, width: 36, height: 36, borderRadius: '10px',
                    }}>
                        {kyc.nombre_completo?.[0] || 'U'}
                    </Avatar>
                    <Box minWidth={0}>
                        <Typography variant="body2" fontWeight={800} noWrap>{kyc.nombre_completo}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {kyc.usuario?.email}
                        </Typography>
                    </Box>
                </Stack>
            ),
        },
        {
            id: 'numero_documento',
            label: 'ID / Documento',
            sortable: true,
            cardSecondary: true,
            render: (kyc) => (
                <Box>
                    <Typography variant="caption" fontWeight={800} color="text.disabled" sx={{ display: 'block' }}>
                        {kyc.tipo_documento}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {kyc.numero_documento}
                    </Typography>
                </Box>
            ),
        },
        {
            id: 'estado_verificacion',
            label: 'Estado',
            align: 'center',
            sortable: true,
            render: (kyc) => (
                <Chip
                    label={kyc.estado_verificacion}
                    size="small"
                    color={
                        kyc.estado_verificacion === 'APROBADA' ? 'success' :
                            kyc.estado_verificacion === 'RECHAZADA' ? 'error' : 'warning'
                    }
                    sx={{ fontWeight: 900, fontSize: '0.65rem', borderRadius: 1.5, minWidth: 100 }}
                />
            ),
        },
        {
            id: 'acciones',
            label: '',
            align: 'right',
            render: (kyc) => (
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Tooltip title="Abrir Expediente">
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); logic.handleOpenDetails(kyc); }}
                            sx={{
                                bgcolor: alpha(theme.palette.info.main, 0.08),
                                color: 'info.main',
                                '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) },
                            }}
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        },
    ], [theme, logic]);
};

export default useKycColumns;