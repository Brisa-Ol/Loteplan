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
  useTheme,
  alpha
} from '@mui/material';

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
  id: string; // Se mantiene string para mayor flexibilidad (columnas calculadas)
  label: string;
  align?: 'left' | 'right' | 'center';
  minWidth?: number;
  // ✅ CORRECCIÓN: Se tipa el value como unknown en lugar de any
  format?: (value: unknown, row: T) => React.ReactNode;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  sx?: SxProps<Theme>;
  isRowActive?: (row: T) => boolean; 
  highlightedRowId?: string | number | null; 
  getRowSx?: (row: T) => SxProps<Theme>; 
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
  isRowActive,
  highlightedRowId,
  getRowSx,
  pagination = true,
  defaultRowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50],
}: DataTableProps<T>) {
  const theme = useTheme();
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
    <TableContainer component={Paper} sx={sx}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                sx={{ minWidth: column.minWidth, fontWeight: 700, color: 'text.secondary' }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={columns.length} 
                align="center" 
                sx={{ py: 6, color: 'text.disabled' }}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row) => {
              const rowKey = getRowKey(row);
              const isHighlighted = highlightedRowId === rowKey;
              const isActive = isRowActive ? isRowActive(row) : true;

              const defaultRowStyles = {
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background-color 0.5s ease',
                bgcolor: isHighlighted 
                  ? alpha(theme.palette.success.main, 0.12)
                  : !isActive 
                    ? alpha(theme.palette.grey[500], 0.2)
                    : 'inherit',
                '&:hover': {
                  bgcolor: isHighlighted 
                    ? alpha(theme.palette.success.main, 0.18)
                    : alpha(theme.palette.primary.main, 0.04)
                }
              };

              const customStyles = getRowSx ? getRowSx(row) : {};

              return (
                <TableRow
                  key={rowKey}
                  hover
                  onClick={() => onRowClick?.(row)}
                  sx={{ ...defaultRowStyles, ...customStyles }}
                >
                  {columns.map((column) => {
                    // ✅ CORRECCIÓN DE TIPADO:
                    // Obtenemos el valor de la celda de forma segura
                    const cellValue = (row as Record<string, unknown>)[column.id];

                    return (
                      <TableCell key={column.id} align={column.align || 'left'}>
                        {column.render
                          ? column.render(row)
                          : column.format
                            ? column.format(cellValue, row)
                            : String(cellValue ?? '')}
                      </TableCell>
                    );
                  })}
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
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `+${to}`}`}
        />
      )}
    </TableContainer>
  );
}