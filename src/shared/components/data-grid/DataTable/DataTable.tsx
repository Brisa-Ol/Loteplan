import { FilterListOff } from '@mui/icons-material';
import {
  alpha,
  Box,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
  type SxProps,
  type Theme
} from '@mui/material';
import React, { useMemo, useState } from 'react';

// ============================================================================
// COMPONENTE: DATA SWITCH (Auxiliar)
// ============================================================================
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
      <Typography variant="caption" fontWeight={500} color={active ? 'text.primary' : 'text.disabled'}>
        {active ? activeLabel : inactiveLabel}
      </Typography>
    }
    labelPlacement="end"
    sx={{ margin: 0, '& .MuiTypography-root': { minWidth: 45 } }}
  />
);

// ============================================================================
// COMPONENTE PRINCIPAL: DATA TABLE
// ============================================================================

export interface DataTableColumn<T> {
  id: keyof T | string; // Tipado más flexible pero seguro
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
  rowsPerPageOptions = [5, 10, 25, 50],
  showInactiveToggle = false, // Default false para no ensuciar UI si no se necesita
  inactiveLabel = 'Mostrar inactivos',
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [showInactive, setShowInactive] = useState(false); // Default ocultos para limpieza

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 1. Lógica de Filtrado y Ordenamiento
  const processedData = useMemo(() => {
    let result = [...data];

    // Si hay lógica de activos, primero filtramos/ordenamos
    if (isRowActive) {
      // Filtrar si el toggle está apagado
      if (!showInactive) {
        result = result.filter(row => isRowActive(row));
      } else {
        // Si mostramos todos, ordenamos para que los activos salgan primero
        result.sort((a, b) => {
          const aActive = isRowActive(a);
          const bActive = isRowActive(b);
          return aActive === bActive ? 0 : aActive ? -1 : 1;
        });
      }
    }
    return result;
  }, [data, isRowActive, showInactive]);

  // 2. Conteo de inactivos (para mostrar en el label del switch si se desea)
  const inactiveCount = useMemo(() => {
    if (!isRowActive) return 0;
    return data.filter(row => !isRowActive(row)).length;
  }, [data, isRowActive]);

  // 3. Paginación
  const paginatedData = pagination
    ? processedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : processedData;

  // 4. Columnas responsivas
  const visibleColumns = columns.filter(col => !(isMobile && col.hideOnMobile));

  return (
    <Box sx={{ width: '100%' }}>
      {/* TOOLBAR SUPERIOR (Solo si hay toggle de inactivos y existen inactivos) */}
      {showInactiveToggle && inactiveCount > 0 && (
        <Stack
          direction="row"
          justifyContent="flex-end"
          sx={{ mb: 1, px: 1 }}
        >
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                color="primary" // Usamos el color de marca
              />
            }
            label={
              <Typography variant="caption" color="text.secondary">
                {inactiveLabel} ({inactiveCount})
              </Typography>
            }
          />
        </Stack>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          width: '100%',
          overflowX: 'auto', // Clave para responsive en tablas
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px', // Theme match
          ...sx
        }}
      >
        <Table size={isMobile ? 'small' : 'medium'}>
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              {visibleColumns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || 'left'}
                  sx={{
                    minWidth: column.minWidth,
                    fontWeight: 700,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap', // Evita saltos de línea feos en headers
                    py: 1.5
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
                <TableCell colSpan={visibleColumns.length} align="center" sx={{ py: 8 }}>
                  <Stack alignItems="center" spacing={1} color="text.disabled">
                    <FilterListOff fontSize="large" sx={{ opacity: 0.5 }} />
                    <Typography variant="body2">{emptyMessage}</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => {
                const rowKey = getRowKey(row);
                const isHighlighted = highlightedRowId === rowKey;
                const isActive = isRowActive ? isRowActive(row) : true;

                return (
                  <TableRow
                    key={rowKey}
                    hover={isActive && !!onRowClick} // Solo efecto hover si es clickeable
                    onClick={() => isActive && onRowClick?.(row)}
                    sx={{
                      cursor: onRowClick && isActive ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      bgcolor: isHighlighted ? alpha(theme.palette.success.main, 0.08) : 'inherit',
                      opacity: !isActive ? 0.5 : 1, // Opacidad visual para inactivos
                      // Estilo condicional para inactivos (fondo grisáceo suave)
                      ...(!isActive && {
                        bgcolor: alpha(theme.palette.action.disabledBackground, 0.1)
                      }),
                      ...(getRowSx ? getRowSx(row) : {})
                    }}
                  >
                    {visibleColumns.map((column) => {
                      // Acceso seguro sin ts-ignore
                      const cellValue = (row as any)[column.id];

                      return (
                        <TableCell
                          key={String(column.id)}
                          align={column.align || 'left'}
                          sx={{
                            // Evita que el texto se rompa en pantallas medianas si no es necesario
                            whiteSpace: 'nowrap',
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {column.render
                            ? column.render(row)
                            : column.format
                              ? column.format(cellValue, row)
                              : cellValue}
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
            count={processedData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={isMobile ? "Filas" : "Filas por página:"}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `> ${to}`}`
            }
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              // Ajustes para paginación responsive
              '.MuiTablePagination-toolbar': {
                px: { xs: 1, sm: 2 }
              },
              '.MuiTablePagination-selectLabel': {
                display: { xs: 'none', sm: 'block' }
              }
            }}
          />
        )}
      </TableContainer>
    </Box>
  );
}