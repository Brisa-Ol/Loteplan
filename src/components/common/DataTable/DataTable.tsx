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
    Switch,                 // <--- Nuevo import
    FormControlLabel,       // <--- Nuevo import
    Typography,             // <--- Nuevo import
    type SxProps,
    type Theme,
} from '@mui/material';

// ----------------------------------------------------------------------
// 1. COMPONENTE EXTRA: DataSwitch
// Úsalo en tus columnas para tener siempre el mismo estilo de switch
// ----------------------------------------------------------------------
interface DataSwitchProps {
    active: boolean;
    onChange: () => void;
    disabled?: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
}

export const DataSwitch: React.FC<DataSwitchProps> = ({ 
    active, 
    onChange, 
    disabled = false,
    activeLabel = "Visible",
    inactiveLabel = "Oculto"
}) => {
    return (
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
            sx={{ margin: 0 }} // Ajuste para que no ocupe espacio extra en la celda
        />
    );
};

// ----------------------------------------------------------------------
// 2. DEFINICIÓN DE LA TABLA
// ----------------------------------------------------------------------

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
    elevation?: number;
    variant?: 'elevation' | 'outlined';
    emptyMessage?: string;
    sx?: SxProps<Theme>;
    
    // 🔥 NUEVA PROP: Para cambiar el estilo de la fila dinámicamente
    // Ejemplo: (row) => ({ opacity: row.activo ? 1 : 0.5 })
    getRowSx?: (row: T) => SxProps<Theme>;

    // Pagination props
    pagination?: boolean;
    defaultRowsPerPage?: number;
    rowsPerPageOptions?: number[];
}

export function DataTable<T>({
    columns,
    data,
    getRowKey,
    onRowClick,
    elevation = 0,
    variant = 'outlined',
    emptyMessage = 'No hay datos disponibles',
    sx,
    getRowSx, // <--- La recibimos aquí
    pagination = true,
    defaultRowsPerPage = 10,
    rowsPerPageOptions = [10, 25, 50],
}: DataTableProps<T>) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

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
            elevation={elevation}
            variant={variant}
            sx={{ borderRadius: 2, ...sx }}
        >
            <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                        {columns.map((column) => (
                            <TableCell
                                key={column.id}
                                align={column.align || 'left'}
                                sx={{
                                    fontWeight: 'bold',
                                    color: 'text.secondary',
                                    minWidth: column.minWidth,
                                }}
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
                            // Calculamos el estilo dinámico de la fila
                            const dynamicRowStyle = getRowSx ? getRowSx(row) : {};

                            return (
                                <TableRow
                                    key={getRowKey(row)}
                                    hover
                                    onClick={() => onRowClick?.(row)}
                                    sx={{
                                        cursor: onRowClick ? 'pointer' : 'default',
                                        transition: 'all 0.3s ease', // Animación suave
                                        ...dynamicRowStyle // 🔥 Aplicamos el estilo dinámico
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