import {
  alpha,
  Box,
  Card,
  CardContent,
  Collapse,
  Divider,
  FormControlLabel,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
  useMediaQuery,
  useTheme,
  type SxProps,
  type Theme,
} from '@mui/material';
import React, { memo, useEffect, useMemo, useState } from 'react';
import EmptyState from './Emptystate';

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

type SortDirection = 'asc' | 'desc';

interface SortState {
  columnId: string;
  direction: SortDirection;
}

// ============================================================================
// COMPONENTE: DATA SWITCH
// ============================================================================

interface DataSwitchProps {
  active: boolean;
  onChange: () => void;
  disabled?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export const DataSwitch: React.FC<DataSwitchProps> = memo(
  ({
    active,
    onChange,
    disabled = false,
    activeLabel = 'Visible',
    inactiveLabel = 'Oculto',
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
        <Typography
          variant="caption"
          fontWeight={500}
          color={active ? 'text.primary' : 'text.disabled'}
        >
          {active ? activeLabel : inactiveLabel}
        </Typography>
      }
      labelPlacement="end"
      sx={{ margin: 0, '& .MuiTypography-root': { minWidth: 45 } }}
    />
  ),
);

DataSwitch.displayName = 'DataSwitch';

// ============================================================================
// SKELETON DE TABLA
// FIX #1: anchos fijos predefinidos — evita Math.random() que causa
// re-renders innecesarios y posibles hydration warnings en SSR.
// El índice combinado (i * columns + j) garantiza variedad visual
// sin aleatoriedad en cada render.
// ============================================================================

const SKELETON_WIDTHS = ['75%', '60%', '85%', '65%', '70%', '80%', '55%', '90%'];

const TableSkeleton: React.FC<{ columns: number; rows?: number }> = ({
  columns,
  rows = 5,
}) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRow key={i}>
        {Array.from({ length: columns }).map((_, j) => (
          <TableCell key={j}>
            <Skeleton
              variant="text"
              animation="wave"
              width={SKELETON_WIDTHS[(i * columns + j) % SKELETON_WIDTHS.length]}
            />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

// ============================================================================
// SKELETON MÓVIL
// ============================================================================

const MobileSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <Stack spacing={1.5}>
    {Array.from({ length: rows }).map((_, i) => (
      <Card
        key={i}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <CardContent sx={{ p: '12px !important' }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={18} sx={{ mt: 0.5 }} />
        </CardContent>
      </Card>
    ))}
  </Stack>
);

// ============================================================================
// TIPOS Y PROPS PRINCIPALES
// ============================================================================

export interface DataTableColumn<T> {
  id: keyof T | string;
  label: string;
  align?: 'left' | 'right' | 'center';
  minWidth?: number;
  sortable?: boolean;
  format?: (value: any, row: T) => React.ReactNode;
  render?: (row: T) => React.ReactNode;
  /** Ocultar columna en móvil (tabla) */
  hideOnMobile?: boolean;
  /** Ocultar también en la vista de tarjeta móvil */
  hideOnCard?: boolean;
  /** Mostrar como fila primaria destacada en la tarjeta */
  cardPrimary?: boolean;
  /** Mostrar como fila secundaria/subtítulo en la tarjeta */
  cardSecondary?: boolean;
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
  loading?: boolean;
  skeletonRows?: number;
  /**
   * Columna que se usa como título principal en la vista de tarjeta.
   * Si no se especifica, se usa la primera columna con cardPrimary=true.
   */
  cardTitleColumn?: keyof T | string;
}


// ============================================================================
// FILA MEMOIZADA (vista tabla)
// ============================================================================

interface TableRowMemoProps<T> {
  row: T;
  columns: DataTableColumn<T>[];
  rowKey: string | number;
  isHighlighted: boolean;
  isActive: boolean;
  onRowClick?: (row: T) => void;
  getRowSx?: (row: T) => SxProps<Theme>;
  theme: Theme;
}

const TableRowMemo = memo(
  <T,>({
    row,
    columns,
    isHighlighted,
    isActive,
    onRowClick,
    getRowSx,
    theme,
  }: TableRowMemoProps<T>) => (
    <TableRow
      hover={isActive && !!onRowClick}
      onClick={() => isActive && onRowClick?.(row)}
      sx={{
        cursor: onRowClick && isActive ? 'pointer' : 'default',
        transition: 'background-color 0.15s',
        bgcolor: isHighlighted ? alpha(theme.palette.success.main, 0.08) : 'inherit',
        opacity: !isActive ? 0.5 : 1,
        ...(!isActive && { bgcolor: alpha(theme.palette.action.disabledBackground, 0.1) }),
        ...(getRowSx ? getRowSx(row) : {}),
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
              textOverflow: 'ellipsis',
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
  ),
  // FIX #2: comparador simplificado — se eliminó la lógica que invalidaba memo
  // cuando había columnas con render/format (que es prácticamente siempre).
  // memo ahora funciona correctamente: solo re-renderiza cuando cambia la
  // identidad de row, el estado highlight o el estado activo.
  (prev, next) =>
    prev.rowKey === next.rowKey &&
    prev.isHighlighted === next.isHighlighted &&
    prev.isActive === next.isActive,
) as <T>(props: TableRowMemoProps<T>) => React.ReactElement;

(TableRowMemo as any).displayName = 'TableRowMemo';

// ============================================================================
// TARJETA MÓVIL
// ============================================================================

interface MobileCardProps<T> {
  row: T;
  columns: DataTableColumn<T>[];
  rowKey: string | number;
  isHighlighted: boolean;
  isActive: boolean;
  onRowClick?: (row: T) => void;
  getRowSx?: (row: T) => SxProps<Theme>;
  theme: Theme;
  titleColumnId?: string;
  resetKey?: number;
}

const MobileCard = memo(
  <T,>({
    row,
    columns,
    isHighlighted,
    isActive,
    onRowClick,
    getRowSx,
    theme,
    titleColumnId,
    resetKey,
  }: MobileCardProps<T>) => {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
      setExpanded(false);
    }, [resetKey]);

    const primaryCol =
      columns.find((c) =>
        titleColumnId ? String(c.id) === titleColumnId : c.cardPrimary,
      ) ?? columns[0];

    const secondaryCol = columns.find((c) => c.cardSecondary);

    const detailCols = columns.filter(
      (c) =>
        c !== primaryCol &&
        c !== secondaryCol &&
        !c.hideOnCard &&
        String(c.id) !== 'actions' &&
        String(c.id) !== 'acciones',
    );

    const actionsCol = columns.find(
      (c) => String(c.id) === 'actions' || String(c.id) === 'acciones',
    );

    const getCellContent = (col: DataTableColumn<T>) => {
      const val = (row as any)[col.id];
      if (col.render) return col.render(row);
      if (col.format) return col.format(val, row);
      return val;
    };

    const customSx = getRowSx ? getRowSx(row) : {};

    return (
      <Card
        elevation={0}
        onClick={() => isActive && onRowClick?.(row)}
        sx={{
          border: '1px solid',
          borderColor: isHighlighted
            ? alpha(theme.palette.success.main, 0.5)
            : 'divider',
          borderRadius: 2,
          cursor: onRowClick && isActive ? 'pointer' : 'default',
          opacity: isActive ? 1 : 0.55,
          bgcolor: isHighlighted
            ? alpha(theme.palette.success.main, 0.05)
            : !isActive
              ? alpha(theme.palette.action.disabledBackground, 0.08)
              : 'background.paper',
          transition: 'all 0.2s',
          '&:hover':
            onRowClick && isActive
              ? {
                borderColor: 'primary.main',
                boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
              }
              : {},
          ...customSx,
        }}
      >
        <CardContent sx={{ p: '12px !important' }}>
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={1}
          >
            <Box flex={1} minWidth={0}>
              {getCellContent(primaryCol)}
              {secondaryCol && <Box mt={0.5}>{getCellContent(secondaryCol)}</Box>}
            </Box>
            {actionsCol && (
              <Box flexShrink={0} onClick={(e) => e.stopPropagation()}>
                {getCellContent(actionsCol)}
              </Box>
            )}
          </Stack>

          {detailCols.length > 0 && (
            <>
              <Box
                mt={1}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
              >
                <Typography variant="caption" fontWeight={600} color="primary.main">
                  {expanded ? 'Ver menos ▲' : 'Ver más ▼'}
                </Typography>
              </Box>

              <Collapse in={expanded} unmountOnExit>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={1}>
                  {detailCols.map((col) => (
                    <Stack
                      key={String(col.id)}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        sx={{ minWidth: 90, flexShrink: 0, pt: '2px' }}
                      >
                        {col.label}
                      </Typography>
                      <Box
                        flex={1}
                        minWidth={0}
                        sx={{ textAlign: col.align === 'right' ? 'right' : 'left' }}
                      >
                        {getCellContent(col)}
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Collapse>
            </>
          )}
        </CardContent>
      </Card>
    );
  },
  // FIX #2: mismo comparador simplificado que TableRowMemo
  (prev, next) =>
    prev.rowKey === next.rowKey &&
    prev.isHighlighted === next.isHighlighted &&
    prev.isActive === next.isActive &&
    prev.resetKey === next.resetKey,
) as <T>(props: MobileCardProps<T>) => React.ReactElement;

(MobileCard as any).displayName = 'MobileCard';

// ============================================================================
// COMPONENTE PRINCIPAL: DATA TABLE
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
  loading = false,
  skeletonRows = 5,
  cardTitleColumn,
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [showInactive, setShowInactive] = useState(false);
  const [sort, setSort] = useState<SortState | null>(null);

  useEffect(() => {
    setPage(0);
  }, [data]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleSort = (columnId: string) => {
    setSort((prev) => {
      if (prev?.columnId === columnId) {
        return prev.direction === 'asc' ? { columnId, direction: 'desc' } : null;
      }
      return { columnId, direction: 'asc' };
    });
    setPage(0);
  };

  const filteredData = useMemo(() => {
    if (!isRowActive) return data;

    if (showInactiveToggle && !showInactive) {
      return data.filter((row) => isRowActive(row));
    }

    return [...data].sort((a, b) => {
      const aActive = isRowActive(a);
      const bActive = isRowActive(b);
      return aActive === bActive ? 0 : aActive ? -1 : 1;
    });
  }, [data, isRowActive, showInactive, showInactiveToggle]);

  const processedData = useMemo(() => {
    if (!sort) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = (a as any)[sort.columnId];
      const bVal = (b as any)[sort.columnId];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), 'es', { sensitivity: 'base' });

      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sort]);

  const inactiveCount = useMemo(() => {
    if (!isRowActive) return 0;
    return data.filter((row) => !isRowActive(row)).length;
  }, [data, isRowActive]);

  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;
    return processedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [pagination, processedData, page, rowsPerPage]);

  const visibleColumnsTable = useMemo(
    () =>
      columns.filter(
        (col) => !(isMobile && col.hideOnMobile) && !(isTablet && col.hideOnMobile),
      ),
    [columns, isMobile, isTablet],
  );

  const responsiveRowsPerPageOptions = isMobile ? [5, 10, 25] : rowsPerPageOptions;

  const paginationNode = pagination && !loading && data.length > 0 && (
    <TablePagination
      rowsPerPageOptions={responsiveRowsPerPageOptions}
      component="div"
      count={processedData.length}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      labelRowsPerPage={isTablet || isMobile ? 'Filas' : 'Filas por página:'}
      labelDisplayedRows={({ from, to, count }) =>
        `${from}–${to} de ${count !== -1 ? count : `> ${to}`}`
      }
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        '.MuiTablePagination-toolbar': { px: { xs: 1, sm: 2 } },
        '.MuiTablePagination-selectLabel': { display: { xs: 'none', sm: 'block' } },
      }}
    />
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

      {/* ── VISTA MÓVIL ─────────────────────────────────────────────────── */}
      {isMobile ? (
        <Box>
          {loading ? (
            <MobileSkeleton rows={skeletonRows} />
          ) : paginatedData.length === 0 ? (
            <Paper
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <EmptyState
                message={emptyMessage}
                variant="compact" // O "default" según prefieras en móvil
              />
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {paginatedData.map((row) => {
                const rowKey = getRowKey(row);
                return (
                  <MobileCard
                    key={rowKey}
                    row={row}
                    columns={columns}
                    rowKey={rowKey}
                    isHighlighted={highlightedRowId === rowKey}
                    isActive={isRowActive ? isRowActive(row) : true}
                    onRowClick={onRowClick}
                    getRowSx={getRowSx}
                    theme={theme}
                    titleColumnId={cardTitleColumn ? String(cardTitleColumn) : undefined}
                    resetKey={page}
                  />
                );
              })}
            </Stack>
          )}

          {pagination && !loading && data.length > 0 && (
            <Paper
              elevation={0}
              sx={{ mt: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <TablePagination
                rowsPerPageOptions={responsiveRowsPerPageOptions}
                component="div"
                count={processedData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} / ${count !== -1 ? count : `> ${to}`}`
                }
                sx={{
                  '.MuiTablePagination-selectLabel': { display: 'none' },
                  '.MuiTablePagination-toolbar': { px: 1, minHeight: 44 },
                  fontSize: '0.75rem',
                }}
              />
            </Paper>
          )}
        </Box>
      ) : (
        /* ── VISTA TABLET / DESKTOP ────────────────────────────────────── */
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            width: '100%',
            overflowX: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            WebkitOverflowScrolling: 'touch',
            tableLayout: 'auto',
            ...sx,
          }}
        >
          <Table
            size={isTablet ? 'small' : 'medium'}
            sx={{ minWidth: isTablet ? 480 : 600, width: '100%', tableLayout: 'auto' }}
          >
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                {visibleColumnsTable.map((column) => (
                  <TableCell
                    key={String(column.id)}
                    align={column.align || 'left'}
                    sortDirection={
                      sort?.columnId === String(column.id) ? sort.direction : false
                    }
                    sx={{
                      minWidth: column.minWidth,
                      fontWeight: 700,
                      color: 'text.secondary',
                      fontSize: isTablet ? '0.7rem' : '0.75rem',
                      whiteSpace: 'nowrap',
                      py: isTablet ? 1 : 1.5,
                      width: column.minWidth ? column.minWidth : 'auto',
                    }}
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={sort?.columnId === String(column.id)}
                        direction={
                          sort?.columnId === String(column.id) ? sort.direction : 'asc'
                        }
                        onClick={() => handleSort(String(column.id))}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableSkeleton columns={visibleColumnsTable.length} rows={skeletonRows} />
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumnsTable.length}
                    align="center"
                    sx={{ py: 6, border: 0 }}
                  >
                    <EmptyState
                      title="Sin registros"
                      message={emptyMessage}
                    // Aquí podrías incluso pasarle una acción si la DataTable tuviera una prop 'onAdd'
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => {
                  const rowKey = getRowKey(row);
                  return (
                    <TableRowMemo
                      key={rowKey}
                      row={row}
                      columns={visibleColumnsTable}
                      rowKey={rowKey}
                      isHighlighted={highlightedRowId === rowKey}
                      isActive={isRowActive ? isRowActive(row) : true}
                      onRowClick={onRowClick}
                      getRowSx={getRowSx}
                      theme={theme}
                    />
                  );
                })
              )}
            </TableBody>
          </Table>

          {paginationNode}
        </TableContainer>
      )}
    </Box>
  );
}