// src/features/admin/pages/Usuarios/hooks/useUserColumns.tsx

import { env } from '@/core/config/env';
import type { UsuarioDto } from '@/core/types/usuario.dto';
import type { DataTableColumn } from '@/shared';
import {
    Edit as EditIcon,
    Visibility,
} from '@mui/icons-material';
import {
    alpha, Avatar, Box, Chip, IconButton,
    Stack, Switch, Tooltip, Typography,
} from '@mui/material';
import { useMemo } from 'react';
import type { useAdminUsuarios } from '../../../hooks/usuario/useAdminUsuarios';

const useUserColumns = (logic: ReturnType<typeof useAdminUsuarios>) => {
    return useMemo<DataTableColumn<UsuarioDto>[]>(() => [
        {
            id: 'identidad',
            label: 'Usuario / Identidad',
            minWidth: 240,
            cardPrimary: true,
            sortable: true,
            render: (u) => (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{
                        width: 38, height: 38, fontWeight: 800,
                        bgcolor: u.activo ? alpha('#CC6333', 0.1) : alpha('#666', 0.1),
                        color: u.activo ? '#CC6333' : '#999',
                    }}>
                        {u.nombre_usuario.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={700} noWrap>{u.nombre} {u.apellido}</Typography>
                        <Typography variant="caption" color="primary.main" display="block" sx={{ fontWeight: 600 }}>@{u.nombre_usuario}</Typography>
                        <Typography variant="caption" color="text.secondary">DNI: {u.dni}</Typography>
                    </Box>
                </Stack>
            ),
        },
        {
            id: 'email',
            label: 'Contacto',
            minWidth: 200,
            cardSecondary: true,
            sortable: true,
            render: (u) => (
                <Box>
                    <Typography variant="body2" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {u.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Tel: {u.numero_telefono}
                    </Typography>
                </Box>
            ),
        },
        {
            id: 'fecha_registro',
            label: 'Registro',
            minWidth: 120,
            sortable: true,
            hideOnMobile: true,
            render: (u) => (
                <Typography variant="body2">
                    {new Date(u.fecha_registro || u.createdAt || '').toLocaleDateString(env.defaultLocale)}
                </Typography>
            ),
        },
        {
            id: 'activo',
            label: 'Estado',
            align: 'center',
            minWidth: 120,
            render: (u) => (
                <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                    <Switch
                        checked={u.activo}
                        onChange={() => logic.handleToggleStatusClick(u)}
                        size="small"
                        disabled={u.rol === 'admin' || u.id === logic.currentUser?.id}
                        color="success"
                    />
                    <Chip
                        label={u.activo ? 'ACTIVO' : 'INACTIVO'}
                        size="small"
                        variant={u.activo ? 'filled' : 'outlined'}
                        color={u.activo ? 'success' : 'default'}
                        sx={{ fontSize: '0.6rem', fontWeight: 800, width: 75 }}
                    />
                </Stack>
            ),
        },
        {
            id: 'acciones',
            label: 'Acciones',
            align: 'right',
            minWidth: 80,
            render: (u) => (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end" sx={{ width: 'fit-content', ml: 'auto' }}>
                    <Tooltip title="Ver Detalle">
                        <IconButton onClick={(e) => { e.stopPropagation(); logic.handleViewUser(u); }} size="small" color="info">
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                        <IconButton onClick={(e) => { e.stopPropagation(); logic.handleEditUser(u); }} size="small">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        },
    ], [logic]);
};

export default useUserColumns;