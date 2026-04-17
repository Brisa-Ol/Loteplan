import PujaService from '@/core/api/services/puja.service';
import TransaccionService from '@/core/api/services/transaccion.service';
import type { EstadoPuja, PujaDto } from '@/core/types/puja.dto';
import { FilterSelect } from '@/shared';
import {
    Box,
    Chip,
    CircularProgress,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    alpha,
    useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';



const ESTADO_OPTIONS: { value: EstadoPuja; label: string; color: 'success' | 'error' | 'warning' | 'default' | 'info' }[] = [
    { value: 'activa', label: 'Activa', color: 'info' },
    { value: 'ganadora_pagada', label: 'Ganadora Pagada', color: 'success' },
    { value: 'perdedora', label: 'Perdedora', color: 'default' },
    { value: 'cancelada', label: 'Cancelada', color: 'error' },
    { value: 'ganadora_incumplimiento', label: 'Incumplimiento', color: 'warning' },
];

interface Props {
    idSuscripcion: number;
}

export const PujasSection = ({ idSuscripcion }: Props) => {
    const theme = useTheme();
    const [selectedEstados, setSelectedEstados] = useState<EstadoPuja[]>([]);
    

    const { data: pujas = [], isLoading } = useQuery({
        queryKey: ['pujasSuscripcion', idSuscripcion, selectedEstados],
        queryFn: async () => {
            const res = await PujaService.getFilteredPujasByEstado(
                idSuscripcion,
                selectedEstados[0],
                selectedEstados[1]
            );
            return res.data;
        },
        enabled: selectedEstados.length > 0, //se ejecuta si hay filtros
    });
    
    const pujaIds = pujas.map((p: PujaDto) => p.id);

    const { data: transacciones = {} } = useQuery({
    queryKey: ['transaccionesPujas', pujaIds],
    queryFn: async () => {
        const results = await Promise.all(
            pujaIds.map(id =>
                TransaccionService.getTransaccionByPujaId(id)
                    .then(res => ({ id, transaccionId: res.data.transaccion_id ?? null }))
                    .catch(() => ({ id, transaccionId: null }))
            )
        );
        // Devuelve un mapa { [pujaId]: transaccionId }
        return Object.fromEntries(results.map(r => [r.id, r.transaccionId]));
    },
    enabled: pujaIds.length > 0,
});

    const handleEstadoChange = (value: any) => {
        // value es un array por MultiSelect
        if (value.length <= 2) setSelectedEstados(value);
    };

    const getChipProps = (estado: EstadoPuja) =>
        ESTADO_OPTIONS.find(o => o.value === estado) ?? { color: 'default' as const, label: estado };



    return (
        <Box sx={{
            p: 2.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2" fontWeight={700}>
                    Historial de Pujas
                </Typography>

                <FilterSelect
                    label="Estado"
                    value={selectedEstados}
                    onChange={(e: any) => handleEstadoChange(e.target.value)}
                    sx={{ minWidth: 220 }}
                    SelectProps={{
                        multiple: true,
                        renderValue: (selected: any) =>
                            selected.length === 0
                                ? 'Todos'
                                : selected.map((v: EstadoPuja) =>
                                    ESTADO_OPTIONS.find(o => o.value === v)?.label
                                ).join(', '),
                    }}
                >
                    {ESTADO_OPTIONS.map(opt => (
                        <MenuItem
                            key={opt.value}
                            value={opt.value}
                            disabled={selectedEstados.length >= 2 && !selectedEstados.includes(opt.value)}
                        >
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                    label={opt.label}
                                    color={opt.color}
                                    size="small"
                                    sx={{ fontWeight: 600, pointerEvents: 'none' }}
                                />
                            </Stack>
                        </MenuItem>
                    ))}
                </FilterSelect>
            </Stack>

            {isLoading ? (
                <Box display="flex" justifyContent="center" py={3}>
                    <CircularProgress size={28} />
                </Box>
            ) : selectedEstados.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    Seleccioná al menos un estado para ver el historial.
                </Typography>
            ) : pujas.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    No hay pujas para los filtros seleccionados.
                </Typography>
            ) : (
                <TableContainer sx={{ borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                <TableCell sx={{ fontWeight: 700 }}>ID Lote</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Proyecto</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Monto</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>ID Transaccion</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pujas.map((puja: PujaDto) => {
                                const chipProps = getChipProps(puja.estado_puja);
                                
                                return (
                                    <TableRow key={puja.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                #{puja.lote?.id ?? puja.id_lote}
                                            </Typography>
                                            {puja.lote?.nombre_lote && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {puja.lote.nombre_lote}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {puja.proyectoAsociado?.nombre_proyecto ?? `#${puja.lote?.proyectoLote?.id}`}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                ${puja.monto_puja.toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {new Date(puja.fecha_puja).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {transacciones[puja.id] ? `#${transacciones[puja.id]}` : '--'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={chipProps.label}
                                                color={chipProps.color}
                                                size="small"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};