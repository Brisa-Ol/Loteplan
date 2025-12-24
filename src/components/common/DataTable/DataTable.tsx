// src/components/common/DataTable/DataTable.tsx

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    Switch,
    FormControlLabel,
    Typography,
    type SxProps,
    type Theme,
} from '@mui/material';
import theme from '../../../theme';

// --- DataSwitch (Componente Auxiliar) ---
interface DataSwitchProps {
    active: boolean;
    onChange: () => void;
    disabled?: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
}

export const DataSwitch: React.FC<DataSwitchProps> = ({ 
    active, onChange, disabled = false, activeLabel = "Visible", inactiveLabel = "Oculto" 
}) => (
    <FormControlLabel
        control={
            <Switch
                checked={active}
                onChange={onChange}
                color="success"
                size="small"
                disabled={disabled}
            />
        }
        label={
            <Typography variant="caption" color={active ? 'text.primary' : 'text.disabled'}>
                {active ? activeLabel : inactiveLabel}
            </Typography>
        }
        labelPlacement="end"
        sx={{ margin: 0 }}
    />
);

// --- Interfaces ---
export interface DataTableColumn<T> {
    id: string;
    label: string;
    align?: 'left' | 'right' | 'center';
    minWidth?: number;
    format?: (value: any, row: T) => React.ReactNode;
    render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    data: T[];
    getRowKey: (row: T) => string | number;
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
    sx?: SxProps<Theme>;
    getRowSx?: (row: T) => SxProps<Theme>; // Para estilos dinámicos (ej. efecto flash)
    pagination?: boolean;
    defaultRowsPerPage?: number;
    rowsPerPageOptions?: number[];
}

// --- Componente Principal ---
export function DataTable<T>({
    columns,
    data,
    getRowKey,
    onRowClick,
    emptyMessage = 'No hay datos disponibles',
    sx,
    getRowSx,
    pagination = true,
    defaultRowsPerPage = 10,
    rowsPerPageOptions = [10, 25, 50],
}: DataTableProps<T>) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

    const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedData = pagination
        ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        : data;

    return (
        <TableContainer
            component={Paper}
            // El Theme ya maneja borderRadius, border y boxShadow aquí.
            sx={{ border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                bgcolor: 'background.default', // Gris muy claro o blanco según el theme
                ...sx }} 
        >
            <Table>
                {/* El Theme maneja el backgroundColor del TableHead */}
                <TableHead>
                    <TableRow>
                        {columns.map((column) => (
                            <TableCell
                                key={column.id}
                                align={column.align || 'left'}
                                // El Theme maneja fontWeight, color y borderBottom
                                sx={{ minWidth: column.minWidth }}
                            >
                                {column.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                
                <TableBody>
                    {paginatedData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : (
                        paginatedData.map((row) => {
                            const dynamicRowStyle = getRowSx ? getRowSx(row) : {};
                            return (
                                <TableRow
                                    key={getRowKey(row)}
                                    hover // El Theme maneja el color del hover
                                    onClick={() => onRowClick?.(row)}
                                    sx={{
                                        cursor: onRowClick ? 'pointer' : 'default',
                                        transition: 'all 0.3s ease',
                                        ...dynamicRowStyle
                                    }}
                                >
                                    {columns.map((column) => (
                                        <TableCell key={column.id} align={column.align || 'left'}>
                                            {column.render
                                                ? column.render(row)
                                                : column.format
                                                    ? column.format((row as any)[column.id], row)
                                                    : (row as any)[column.id]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            {pagination && data.length > 0 && (
                <TablePagination
                    rowsPerPageOptions={rowsPerPageOptions}
                    component="div"
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
                    }
                />
            )}
        </TableContainer>
    );
}