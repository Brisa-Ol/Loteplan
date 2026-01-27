// src/components/common/DataTable/DataTable.tsx

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
  showInactiveToggle?: boolean; // Nueva prop para mostrar el filtro
  inactiveLabel?: string; // Personalizar etiqueta de inactivos
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

  // 1. Ordenar datos: activos primero, inactivos al final (como en e-commerce)
  const sortedData = useMemo(() => {
    if (!isRowActive) return data;
    
    return [...data].sort((a, b) => {
      const aActive = isRowActive(a);
      const bActive = isRowActive(b);
      if (aActive === bActive) return 0;
      return aActive ? -1 : 1; // Activos primero
    });
  }, [data, isRowActive]);

  // 2. Filtrar inactivos si el toggle está desactivado
  const filteredData = useMemo(() => {
    if (!isRowActive || showInactive) return sortedData;
    return sortedData.filter(row => isRowActive(row));
  }, [sortedData, showInactive, isRowActive]);

  // 3. Contar inactivos para el badge
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
      {/* Toggle para mostrar/ocultar inactivos (patrón común en e-commerce) */}
      {isRowActive && showInactiveToggle && inactiveCount > 0 && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            mb: 1.5, 
            px: 2,
            pt: 1 
          }}
        >
          <FormControlLabel
            control={
              <Switch 
                checked={showInactive} 
                onChange={(e) => {
                  setShowInactive(e.target.checked);
                  setPage(0); // Reset página al filtrar
                }}
                size="small"
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Mostrar {inactiveLabel.toLowerCase()}s
                </Typography>
                <Chip 
                  label={inactiveCount} 
                  size="small" 
                  sx={{ 
                    height: 18, 
                    fontSize: '0.7rem',
                    bgcolor: alpha(theme.palette.grey[500], 0.15),
                    color: 'text.secondary'
                  }} 
                />
              </Box>
            }
          />
        </Box>
      )}

      <TableContainer component={Paper} sx={{ ...sx }}>
        <Table size={isMobile ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{ 
                    minWidth: column.minWidth,
                    fontWeight: 600,
                    bgcolor: alpha(theme.palette.primary.main, 0.02)
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
                <TableCell colSpan={visibleColumns.length} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => {
                const rowKey = getRowKey(row);
                const isHighlighted = highlightedRowId === rowKey;
                const isActive = isRowActive ? isRowActive(row) : true;

                // Estilos mejorados con mejores prácticas de e-commerce
                const defaultRowStyles: SxProps<Theme> = {
                  cursor: onRowClick && isActive ? 'pointer' : 'default',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  
                  // Fondo más sutil para inactivos
                  bgcolor: isHighlighted 
                    ? alpha(theme.palette.success.main, 0.12)
                    : !isActive 
                      ? alpha(theme.palette.grey[500], 0.03) // Muy sutil
                      : 'inherit',
                  
                  // Opacidad reducida para inactivos (estándar e-commerce)
                  opacity: !isActive ? 0.5 : 1,
                  
                  // Borde izquierdo como indicador de estado (Amazon, Shopify)
                  borderLeft: !isActive 
                    ? `3px solid ${alpha(theme.palette.grey[400], 0.5)}` 
                    : isHighlighted 
                      ? `3px solid ${theme.palette.success.main}`
                      : '3px solid transparent',

                  // Estilos de celdas
                  '& .MuiTableCell-root': {
                    color: !isActive ? theme.palette.text.disabled : 'inherit',
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  },

                  '&:hover': {
                    bgcolor: isHighlighted 
                      ? alpha(theme.palette.success.main, 0.18)
                      : !isActive
                        ? alpha(theme.palette.grey[500], 0.06) // Hover más sutil en inactivos
                        : alpha(theme.palette.primary.main, 0.04),
                    transform: onRowClick && isActive ? 'translateX(2px)' : 'none',
                    opacity: !isActive ? 0.65 : 1, // Mejora legibilidad al hover
                    boxShadow: onRowClick && isActive 
                      ? `inset 3px 0 0 ${theme.palette.primary.main}` 
                      : 'none',
                  },

                  '&:last-child .MuiTableCell-root': {
                    borderBottom: 0,
                  },
                };

                const customStyles = getRowSx ? getRowSx(row) : {};

                return (
                  <TableRow
                    key={rowKey}
                    hover={isActive} // Solo hover en filas activas
                    onClick={() => isActive && onRowClick?.(row)} // Solo click en activas
                    sx={{ ...defaultRowStyles, ...customStyles }}
                  >
                    {visibleColumns.map((column) => {
                      const cellValue = (row as Record<string, unknown>)[column.id];
                      return (
                        <TableCell 
                          key={column.id} 
                          align={column.align || 'left'}
                          sx={{
                            // En mobile, agregar badge de estado inactivo
                            position: 'relative',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {column.render
                              ? column.render(row)
                              : column.format
                                ? column.format(cellValue, row)
                                : String(cellValue ?? '')}
                            
                            {/* Badge de inactivo en mobile (primera columna) */}
                            {isMobile && !isActive && column.id === columns[0].id && (
                              <Chip 
                                label={inactiveLabel}
                                size="small" 
                                sx={{ 
                                  height: 20,
                                  fontSize: '0.65rem',
                                  bgcolor: alpha(theme.palette.grey[500], 0.15),
                                  color: 'text.disabled',
                                  fontWeight: 500,
                                }} 
                              />
                            )}
                          </Box>
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
            labelRowsPerPage={isMobile ? "Filas" : "Filas por página:"}
            labelDisplayedRows={({ from, to, count }) => 
              isMobile ? `${from}-${to} / ${count}` : `${from}–${to} de ${count !== -1 ? count : `+${to}`}`
            }
            sx={{
              borderTop: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.grey[50], 0.3),
            }}
          />
        )}
      </TableContainer>
    </Box>
  );
}