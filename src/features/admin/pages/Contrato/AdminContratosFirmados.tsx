import React, { useMemo } from 'react';
import {
  Box, Typography, Chip, IconButton, Tooltip,
  Stack, useTheme, alpha, Avatar, CircularProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  Fingerprint,
  Business,
  Person
} from '@mui/icons-material';

// Utils
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Componentes Comunes
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { FilterBar, FilterSearch } from '../../../../shared/components/forms/filters/FilterBar/FilterBar';


import type { ContratoFirmadoDto } from '../../../../core/types/dto/contrato-firmado.dto';
import { useAdminContratosFirmados } from '../../hooks/useAdminContratosFirmados';

const AdminContratosFirmados: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminContratosFirmados(); // Hook Lógica

  // Definición de Columnas
  const columns = useMemo<DataTableColumn<ContratoFirmadoDto>[]>(() => [
    {
      id: 'id',
      label: 'ID',
      minWidth: 60,
      render: (row) => <Typography variant="body2" fontWeight={700}>#{row.id}</Typography>
    },
    {
      id: 'usuario',
      label: 'Usuario Firmante',
      minWidth: 200,
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <Person fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>Usuario #{row.id_usuario_firmante}</Typography>
            <Typography variant="caption" color="text.secondary">Firmante</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'proyecto',
      label: 'Proyecto',
      minWidth: 150,
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Business color="action" fontSize="small" />
          <Typography variant="body2">Proyecto #{row.id_proyecto}</Typography>
        </Stack>
      )
    },
    {
      id: 'tipo',
      label: 'Tipo Autorización',
      render: (row) => {
        if (row.id_inversion_asociada) {
          return <Chip label={`Inversión #${row.id_inversion_asociada}`} color="primary" size="small" variant="outlined" sx={{ fontWeight: 600 }} />;
        }
        if (row.id_suscripcion_asociada) {
          return <Chip label={`Suscripción #${row.id_suscripcion_asociada}`} color="secondary" size="small" variant="outlined" sx={{ fontWeight: 600 }} />;
        }
        return <Chip label="General" size="small" />;
      }
    },
    {
      id: 'fecha',
      label: 'Fecha Firma',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {row.fecha_firma ? format(new Date(row.fecha_firma), 'dd MMM yyyy', { locale: es }) : '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.fecha_firma ? format(new Date(row.fecha_firma), 'HH:mm', { locale: es }) + ' hs' : ''}
          </Typography>
        </Box>
      )
    },
    {
      id: 'hash',
      label: 'Integridad',
      render: (row) => (
        <Tooltip title={`Hash SHA-256: ${row.hash_archivo_firmado}`}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ cursor: 'help', width: 'fit-content' }}>
            <Fingerprint color="success" fontSize="small" />
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', bgcolor: alpha(theme.palette.success.main, 0.05), px: 1, borderRadius: 1 }}>
              {row.hash_archivo_firmado ? row.hash_archivo_firmado.substring(0, 8) + '...' : 'Generando...'}
            </Typography>
          </Stack>
        </Tooltip>
      )
    },
    {
      id: 'acciones',
      label: 'Descargar',
      align: 'right',
      render: (row) => (
        <Tooltip title="Descargar PDF Firmado">
          <span>
            <IconButton
              color="primary"
              onClick={() => logic.handleDownload(row)}
              disabled={logic.downloadingId === row.id}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              {logic.downloadingId === row.id ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      )
    }
  ], [theme, logic]);

  return (
    <PageContainer maxWidth="xl">

      <PageHeader
        title="Auditoría de Contratos"
        subtitle="Visualiza y descarga los contratos legalizados por los usuarios."
      />

      {/* Toolbar Estandarizada */}
      <FilterBar>
        <FilterSearch 
            placeholder="Buscar por archivo, ID usuario o ID proyecto..." 
            value={logic.searchTerm} 
            onSearch={logic.setSearchTerm} 
            sx={{ flexGrow: 1 }}
        />
      </FilterBar>

      {/* DataTable */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
        <DataTable
          columns={columns}
          data={logic.filteredContratos}
          getRowKey={(row) => row.id}

          // ✅ Feedback Visual
          highlightedRowId={logic.highlightedId}

          emptyMessage="No se encontraron contratos firmados."
          pagination={true}
          defaultRowsPerPage={10}
        />
      </QueryHandler>

    </PageContainer>
  );
};

export default AdminContratosFirmados;