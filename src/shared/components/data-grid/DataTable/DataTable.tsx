import React, { memo, useMemo, useState } from 'react';
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

export const DataSwitch: React.FC<DataSwitchProps> = memo(({
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
));

DataSwitch.displayName = 'DataSwitch';

// ============================================================================
// TIPOS Y COMPONENTE PRINCIPAL
// ============================================================================

export interface DataTableColumn<T> {
  id: keyof T | string;
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

// ============================================================================
// FILA MEMOIZADA (Optimización de render)
// ============================================================================
interface TableRowMemoProps<T> {
  row: T;
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string | number;
  isHighlighted: boolean;
  isActive: boolean;
  onRowClick?: (row: T) => void;
  getRowSx?: (row: T) => SxProps<Theme>;
  theme: Theme;
}

const TableRowMemo = memo(<T,>({
  row,
  columns,
  isHighlighted,
  isActive,
  onRowClick,
  getRowSx,
  theme
}: TableRowMemoProps<T>) => {
  return (
    <TableRow
      hover={isActive && !!onRowClick}
      onClick={() => isActive && onRowClick?.(row)}
      sx={{
        cursor: onRowClick && isActive ? 'pointer' : 'default',
        transition: 'all 0.2s',
        bgcolor: isHighlighted ? alpha(theme.palette.success.main, 0.08) : 'inherit',
        opacity: !isActive ? 0.5 : 1,
        ...(!isActive && {
          bgcolor: alpha(theme.palette.action.disabledBackground, 0.1)
        }),
        ...(getRowSx ? getRowSx(row) : {})
      }}
    >
      {columns.map((column) => {
        const cellValue = (row as any)[column.id];

        return (
          <TableCell
            key={String(column.id)}
            align={column.align || 'left'}
            sx={{
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
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.getRowKey(prevProps.row) === nextProps.getRowKey(nextProps.row) &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isActive === nextProps.isActive
  );
}) as <T>(props: TableRowMemoProps<T>) => React.ReactElement;

(TableRowMemo as any).displayName = 'TableRowMemo';

// ============================================================================
// COMPONENTE: DATA TABLE
// ============================================================================
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
  showInactiveToggle = false,
  inactiveLabel = 'Mostrar inactivos',
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [showInactive, setShowInactive] = useState(false);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // --- LÓGICA DE FILTRADO Y ORDENAMIENTO ---
  const processedData = useMemo(() => {
    let result = [...data];

    if (isRowActive) {
      if (showInactiveToggle && !showInactive) {
        // Filtrar solo activos
        result = result.filter(row => isRowActive(row));
      } else {
        // Ordenar: activos primero
        result.sort((a, b) => {
          const aActive = isRowActive(a);
          const bActive = isRowActive(b);
          return aActive === bActive ? 0 : aActive ? -1 : 1;
        });
      }
    }
    return result;
  }, [data, isRowActive, showInactive, showInactiveToggle]);

  // --- CONTEO DE INACTIVOS ---
  const inactiveCount = useMemo(() => {
    if (!isRowActive) return 0;
    return data.filter(row => !isRowActive(row)).length;
  }, [data, isRowActive]);

  // --- PAGINACIÓN ---
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;
    return processedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [pagination, processedData, page, rowsPerPage]);

  // --- COLUMNAS RESPONSIVAS ---
  const visibleColumns = useMemo(() =>
    columns.filter(col => !(isMobile && col.hideOnMobile)),
    [columns, isMobile]
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Toggle de Inactivos */}
      {showInactiveToggle && inactiveCount > 0 && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1, px: 1 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                color="primary"
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
          overflowX: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
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
                    whiteSpace: 'nowrap',
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
                  <TableRowMemo
                    key={rowKey}
                    row={row}
                    columns={visibleColumns}
                    getRowKey={getRowKey}
                    isHighlighted={isHighlighted}
                    isActive={isActive}
                    onRowClick={onRowClick}
                    getRowSx={getRowSx}
                    theme={theme}
                  />
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
              '.MuiTablePagination-toolbar': { px: { xs: 1, sm: 2 } },
              '.MuiTablePagination-selectLabel': { display: { xs: 'none', sm: 'block' } }
            }}
          />
        )}
      </TableContainer>
    </Box>
  );
}