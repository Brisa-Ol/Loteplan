import React, { memo, useMemo, useState } from 'react';
import { FilterListOff } from '@mui/icons-material';
import {
  alpha,
  Box,
  Card,
  CardContent,
  Collapse,
  Divider,
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
  /**
   * Columna que se usa como título principal en la vista de tarjeta.
   * Si no se especifica, se usa la primera columna con cardPrimary=true,
   * o si ninguna lo tiene, la primera columna visible.
   */
  cardTitleColumn?: keyof T | string;
}

// ============================================================================
// FILA MEMOIZADA (Optimización de render — vista tabla)
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
        ...(!isActive && { bgcolor: alpha(theme.palette.action.disabledBackground, 0.1) }),
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
  return (
    prevProps.getRowKey(prevProps.row) === nextProps.getRowKey(nextProps.row) &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isActive === nextProps.isActive
  );
}) as <T>(props: TableRowMemoProps<T>) => React.ReactElement;

(TableRowMemo as any).displayName = 'TableRowMemo';

// ============================================================================
// TARJETA MÓVIL MEMOIZADA
// ============================================================================
interface MobileCardProps<T> {
  row: T;
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string | number;
  isHighlighted: boolean;
  isActive: boolean;
  onRowClick?: (row: T) => void;
  theme: Theme;
  titleColumnId?: string;
}

const MobileCard = memo(<T,>({
  row,
  columns,
  isHighlighted,
  isActive,
  onRowClick,
  theme,
  titleColumnId,
}: MobileCardProps<T>) => {
  const [expanded, setExpanded] = useState(false);

  // Columna principal (encabezado de la tarjeta)
  const primaryCol = columns.find(c =>
    titleColumnId
      ? String(c.id) === titleColumnId
      : c.cardPrimary
  ) ?? columns[0];

  // Columna secundaria (subtítulo)
  const secondaryCol = columns.find(c => c.cardSecondary);

  // Columnas que van en la sección colapsable (todas menos primary/secondary/hideOnCard/actions)
  const detailCols = columns.filter(c =>
    c !== primaryCol &&
    c !== secondaryCol &&
    !c.hideOnCard &&
    String(c.id) !== 'actions' &&
    String(c.id) !== 'acciones'
  );

  // Columna de acciones
  const actionsCol = columns.find(c =>
    String(c.id) === 'actions' || String(c.id) === 'acciones'
  );

  const getCellContent = (col: DataTableColumn<T>) => {
    const val = (row as any)[col.id];
    if (col.render) return col.render(row);
    if (col.format) return col.format(val, row);
    return val;
  };

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
        '&:hover': onRowClick && isActive ? {
          borderColor: 'primary.main',
          boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
        } : {},
      }}
    >
      <CardContent sx={{ p: '12px !important' }}>
        {/* Fila superior: Primary + Acciones */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box flex={1} minWidth={0}>
            {getCellContent(primaryCol)}
            {secondaryCol && (
              <Box mt={0.5}>
                {getCellContent(secondaryCol)}
              </Box>
            )}
          </Box>
          {actionsCol && (
            <Box
              flexShrink={0}
              onClick={(e) => e.stopPropagation()} // evitar que el click en acciones dispare onRowClick
            >
              {getCellContent(actionsCol)}
            </Box>
          )}
        </Stack>

        {/* Detalles colapsables */}
        {detailCols.length > 0 && (
          <>
            <Box
              mt={1}
              onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                color: 'text.secondary',
              }}
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
                    <Box flex={1} minWidth={0} sx={{ textAlign: col.align === 'right' ? 'right' : 'left' }}>
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
}, (prev, next) => {
  return (
    prev.getRowKey(prev.row) === next.getRowKey(next.row) &&
    prev.isHighlighted === next.isHighlighted &&
    prev.isActive === next.isActive
  );
}) as <T>(props: MobileCardProps<T>) => React.ReactElement;

(MobileCard as any).displayName = 'MobileCard';

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
  cardTitleColumn,
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Vista tipo tabla compacta para tablets
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

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
        result = result.filter(row => isRowActive(row));
      } else {
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
    columns.filter(col => !(isMobile && col.hideOnMobile) && !(isTablet && col.hideOnMobile)),
    [columns, isMobile, isTablet]
  );

  // --- PAGINACIÓN RESPONSIVA ---
  const responsiveRowsPerPageOptions = isMobile ? [5, 10, 25] : rowsPerPageOptions;

  // ── Estado vacío compartido ──────────────────────────────────────────────
  const emptyState = (
    <Stack alignItems="center" spacing={1} color="text.disabled" py={6}>
      <FilterListOff fontSize="large" sx={{ opacity: 0.5 }} />
      <Typography variant="body2">{emptyMessage}</Typography>
    </Stack>
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

      {/* ════════════════════════════════════════════════════
          VISTA MÓVIL → Tarjetas apiladas
      ════════════════════════════════════════════════════ */}
      {isMobile ? (
        <Box>
          {paginatedData.length === 0 ? (
            <Paper
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              {emptyState}
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
                    getRowKey={getRowKey}
                    isHighlighted={highlightedRowId === rowKey}
                    isActive={isRowActive ? isRowActive(row) : true}
                    onRowClick={onRowClick}
                    theme={theme}
                    titleColumnId={cardTitleColumn ? String(cardTitleColumn) : undefined}
                  />
                );
              })}
            </Stack>
          )}

          {/* Paginación móvil simplificada */}
          {pagination && data.length > 0 && (
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
        /* ════════════════════════════════════════════════════
           VISTA TABLET / DESKTOP → Tabla
        ════════════════════════════════════════════════════ */
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            width: '100%',
            overflowX: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            // Scroll horizontal suave en tablet
            WebkitOverflowScrolling: 'touch',
            ...sx
          }}
        >
          <Table size={isTablet ? 'small' : 'medium'} sx={{ minWidth: isTablet ? 500 : 650 }}>
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
                      fontSize: isTablet ? '0.7rem' : '0.75rem',
                      whiteSpace: 'nowrap',
                      py: isTablet ? 1 : 1.5,
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
                    {emptyState}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => {
                  const rowKey = getRowKey(row);
                  return (
                    <TableRowMemo
                      key={rowKey}
                      row={row}
                      columns={visibleColumns}
                      getRowKey={getRowKey}
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

          {pagination && data.length > 0 && (
            <TablePagination
              rowsPerPageOptions={responsiveRowsPerPageOptions}
              component="div"
              count={processedData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={isTablet ? 'Filas' : 'Filas por página:'}
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
      )}
    </Box>
  );
}