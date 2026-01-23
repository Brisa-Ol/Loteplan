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
  useMediaQuery,
  alpha
} from '@mui/material';

// --- DataSwitch ---
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
    control={<Switch checked={active} onChange={onChange} color="success" size="small" disabled={disabled} />}
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
  format?: (value: unknown, row: T) => React.ReactNode;
  render?: (row: T) => React.ReactNode;
  hideOnMobile?: boolean; 
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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

  const visibleColumns = columns.filter(col => !(isMobile && col.hideOnMobile));

  return (
    <TableContainer component={Paper} sx={{ ...sx }}>
      <Table size={isMobile ? 'small' : 'medium'}>
        <TableHead>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
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
              <TableCell colSpan={visibleColumns.length} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row) => {
              const rowKey = getRowKey(row);
              const isHighlighted = highlightedRowId === rowKey;
              const isActive = isRowActive ? isRowActive(row) : true;

              const defaultRowStyles: SxProps<Theme> = {
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                
                // 1. Fondo (Verde si nuevo, Gris si inactivo)
                bgcolor: isHighlighted 
                  ? alpha(theme.palette.success.main, 0.12)
                  : !isActive 
                    ? alpha(theme.palette.grey[500], 0.06)
                    : 'inherit',
                
                // 2. ✨ NUEVO: Opacidad (Atenúa todo el contenido si está inactivo)
                // ESTO ES LO QUE FALTABA
                opacity: !isActive ? 0.6 : 1,

                '&:hover': {
                  bgcolor: isHighlighted 
                    ? alpha(theme.palette.success.main, 0.18)
                    : alpha(theme.palette.primary.main, 0.08),
                  transform: onRowClick ? 'translateX(2px)' : 'none',
                  // Al hacer hover, recuperamos un poco la opacidad para que sea legible
                  opacity: !isActive ? 0.85 : 1, 
                },
              };

              const customStyles = getRowSx ? getRowSx(row) : {};

              return (
                <TableRow
                  key={rowKey}
                  hover
                  onClick={() => onRowClick?.(row)}
                  sx={{ ...defaultRowStyles, ...customStyles }}
                >
                  {visibleColumns.map((column) => {
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
          labelRowsPerPage={isMobile ? "Filas" : "Filas por página:"}
          labelDisplayedRows={({ from, to, count }) => 
            isMobile ? `${from}-${to} / ${count}` : `${from}–${to} de ${count !== -1 ? count : `+${to}`}`
          }
        />
      )}
    </TableContainer>
  );
}