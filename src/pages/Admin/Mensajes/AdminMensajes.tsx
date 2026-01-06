// src/pages/Admin/Mensajes/AdminMensajes.tsx

import React, { useMemo, useState } from 'react';
import {
    Typography, Paper, Chip, Stack, TextField, InputAdornment, Avatar, Tooltip, useTheme, alpha
} from '@mui/material';
import {
    Search, AdminPanelSettings, Person
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';

import type { MensajeDto } from '../../../types/dto/mensaje';
import MensajeService from '../../../services/mensaje.service';

const AdminMensajes: React.FC = () => {
    const theme = useTheme();
    const [searchTerm, setSearchTerm] = useState('');

    // Queries
    const { data: mensajes = [], isLoading, error } = useQuery({
        queryKey: ['adminMensajesAll'],
        queryFn: async () => (await MensajeService.getAllAdmin()).data,
        retry: 1 // No reintentar mucho si falla 500
    });

    // Filtrado (Memoizado)
    const filteredMensajes = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return mensajes.filter((m: MensajeDto) => {
            const content = (m.contenido || '').toLowerCase();
            const idMatch = m.id.toString().includes(term);
            const senderMatch = m.id_remitente?.toString().includes(term);
            const receiverMatch = m.id_receptor?.toString().includes(term);
            
            return content.includes(term) || idMatch || senderMatch || receiverMatch;
        });
    }, [mensajes, searchTerm]);

    // Columnas
    const columns = useMemo<DataTableColumn<MensajeDto>[]>(() => [
        {
            id: 'id',
            label: 'ID',
            minWidth: 70,
            render: (m) => <Typography variant="caption" fontWeight="bold" color="text.secondary">#{m.id}</Typography>
        },
        {
            id: 'remitente',
            label: 'De (Remitente)',
            minWidth: 140,
            render: (m) => (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                        <Person fontSize="inherit" />
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>ID: {m.id_remitente}</Typography>
                </Stack>
            )
        },
        {
            id: 'receptor',
            label: 'Para (Receptor)',
            minWidth: 140,
            render: (m) => (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }}>
                        <Person fontSize="inherit" />
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>ID: {m.id_receptor}</Typography>
                </Stack>
            )
        },
        {
            id: 'contenido',
            label: 'Mensaje',
            minWidth: 250,
            render: (m) => (
                <Tooltip title={m.contenido} placement="top-start">
                    <Typography variant="body2" noWrap sx={{ maxWidth: 350, color: 'text.primary' }}>
                        {m.contenido}
                    </Typography>
                </Tooltip>
            )
        },
        {
            id: 'fecha',
            label: 'Fecha',
            minWidth: 150,
            render: (m) => (
                <Typography variant="caption" color="text.secondary">
                    {m.createdAt ? new Date(m.createdAt).toLocaleString('es-AR') : '-'}
                </Typography>
            )
        },
        {
            id: 'estado',
            label: 'Estado',
            minWidth: 100,
            render: (m) => (
                <Chip
                    label={m.leido ? 'Leído' : 'No Leído'}
                    color={m.leido ? 'success' : 'default'} // 'default' es mejor que 'warning' para no leído
                    size="small"
                    variant={m.leido ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 600, height: 24 }}
                />
            )
        }
    ], [theme]);

    return (
        <PageContainer maxWidth="xl">
            <PageHeader
                title="Moderación de Mensajes"
                subtitle="Visualización y control del historial de comunicaciones."
            />

            {/* Filtros */}
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 2, mb: 3, 
                    borderRadius: 2, 
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.6)
                }} 
            >
                <TextField
                    placeholder="Buscar por contenido, ID de mensaje o usuarios..."
                    size="small"
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{ 
                        startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
                        sx: { borderRadius: 2 }
                    }}
                />
            </Paper>

            <QueryHandler isLoading={isLoading} error={error as Error}>
                <DataTable
                    columns={columns}
                    data={filteredMensajes}
                    getRowKey={(row) => row.id}
                    pagination
                    defaultRowsPerPage={10}
                    emptyMessage="No se encontraron mensajes en el sistema."
                />
            </QueryHandler>
        </PageContainer>
    );
};

export default AdminMensajes;