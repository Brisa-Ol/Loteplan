import React, { useState, useMemo } from 'react';
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
  Box,
  Chip,
  type SxProps,
  type Theme,
  useTheme,
  useMediaQuery,
  alpha,
  Stack
} from '@mui/material';

// --- DataSwitch (Componente auxiliar para celdas) ---
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
  format?: (value: any, row: T) => React.ReactNode;
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
  showInactiveToggle?: boolean; 
  inactiveLabel?: string; 
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
  showInactiveToggle = true,
  inactiveLabel = 'Inactivo',
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [showInactive, setShowInactive] = useState(true);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 1. Ordenar datos: Activos primero
  const sortedData = useMemo(() => {
    if (!isRowActive) return data;
    return [...data].sort((a, b) => {
      const aActive = isRowActive(a);
      const bActive = isRowActive(b);
      return aActive === bActive ? 0 : aActive ? -1 : 1;
    });
  }, [data, isRowActive]);

  // 2. Filtrar por Toggle
  const filteredData = useMemo(() => {
    if (!isRowActive || showInactive) return sortedData;
    return sortedData.filter(row => isRowActive(row));
  }, [sortedData, showInactive, isRowActive]);

  // 3. Conteo de inactivos
  const inactiveCount = useMemo(() => {
    if (!isRowActive) return 0;
    return data.filter(row => !isRowActive(row)).length;
  }, [data, isRowActive]);

  const paginatedData = pagination
    ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : filteredData;

  const visibleColumns = columns.filter(col => !(isMobile && col.hideOnMobile));

  return (
    <Box>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, ...sx }}>
        <Table size={isMobile ? 'small' : 'medium'}>
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              {visibleColumns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{ minWidth: column.minWidth, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem' }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.disabled">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => {
                const rowKey = getRowKey(row);
                const isHighlighted = highlightedRowId === rowKey;
                const isActive = isRowActive ? isRowActive(row) : true;

                const rowStyles: SxProps<Theme> = {
                  cursor: onRowClick && isActive ? 'pointer' : 'default',
                  transition: 'background-color 0.2s',
                  bgcolor: isHighlighted ? alpha(theme.palette.success.main, 0.08) : 'inherit',
                  opacity: !isActive ? 0.6 : 1,
                  '&:hover': {
                    bgcolor: isActive ? alpha(theme.palette.primary.main, 0.04) : alpha(theme.palette.action.disabledBackground, 0.02),
                  },
                  ...(getRowSx ? getRowSx(row) : {})
                };

                return (
                  <TableRow key={rowKey} onClick={() => isActive && onRowClick?.(row)} sx={rowStyles}>
                    {visibleColumns.map((column) => {
                      // @ts-ignore - Acceso dinámico seguro
                      const cellValue = row[column.id];
                      
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

        {pagination && filteredData.length > 0 && (
          <TablePagination
            rowsPerPageOptions={rowsPerPageOptions}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas:"
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </TableContainer>
    </Box>
  );
}