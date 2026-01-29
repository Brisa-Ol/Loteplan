import React, { useMemo } from 'react';
import {
  Box, Typography, Chip, IconButton, Tooltip,
  Stack, useTheme, alpha, Avatar, CircularProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  Fingerprint,
  Business,
  Person,
  Description as DescriptionIcon
} from '@mui/icons-material';

// Utils
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Componentes Comunes
import { PageContainer } from '../../../../shared/components/layout/containers/PageContainer/PageContainer';
import { PageHeader } from '../../../../shared/components/layout/headers/PageHeader';
import { QueryHandler } from '../../../../shared/components/data-grid/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../../shared/components/data-grid/DataTable/DataTable';
import { FilterBar, FilterSearch } from '../../../../shared/components/forms/filters/FilterBar';

import type { ContratoFirmadoDto } from '../../../../core/types/dto/contrato-firmado.dto';
import { useAdminContratosFirmados } from '../../hooks/useAdminContratosFirmados';

const AdminContratosFirmados: React.FC = () => {
  const theme = useTheme();
  const logic = useAdminContratosFirmados();

  // DEFINICIÓN DE COLUMNAS
  const columns = useMemo<DataTableColumn<ContratoFirmadoDto>[]>(() => [
    {
      id: 'id',
      label: 'Contrato / ID',
      minWidth: 120,
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                <DescriptionIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Typography variant="body2" fontWeight={700}>#{row.id}</Typography>
        </Stack>
      )
    },
    {
      id: 'usuario',
      label: 'Firmante',
      minWidth: 220,
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ 
            width: 32, height: 32, 
            bgcolor: alpha(theme.palette.secondary.main, 0.1), 
            color: theme.palette.secondary.main,
            fontSize: 14, fontWeight: 800
          }}>
            <Person fontSize="inherit" />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>Usuario #{row.id_usuario_firmante}</Typography>
            <Typography variant="caption" color="text.secondary">ID Legal verificado</Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'proyecto',
      label: 'Proyecto Asociado',
      minWidth: 180,
      render: (row) => (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
          <Business fontSize="small" />
          <Typography variant="body2" fontWeight={600}>Proyecto #{row.id_proyecto}</Typography>
        </Stack>
      )
    },
    {
      id: 'tipo',
      label: 'Relación',
      render: (row) => {
        if (row.id_inversion_asociada) {
          return <Chip label="INVERSIÓN" color="primary" size="small" variant="filled" sx={{ fontWeight: 800, fontSize: '0.6rem' }} />;
        }
        if (row.id_suscripcion_asociada) {
          return <Chip label="SUSCRIPCIÓN" color="secondary" size="small" variant="filled" sx={{ fontWeight: 800, fontSize: '0.6rem' }} />;
        }
        return <Chip label="GENERAL" size="small" sx={{ fontWeight: 800, fontSize: '0.6rem' }} />;
      }
    },
    {
      id: 'fecha',
      label: 'Fecha de Firma',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {row.fecha_firma ? format(new Date(row.fecha_firma), 'dd/MM/yyyy', { locale: es }) : '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.fecha_firma ? format(new Date(row.fecha_firma), 'HH:mm', { locale: es }) + ' hs' : ''}
          </Typography>
        </Box>
      )
    },
    {
      id: 'hash',
      label: 'Certificación Hash',
      render: (row) => (
        <Tooltip title={`SHA-256: ${row.hash_archivo_firmado}`}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ cursor: 'help' }}>
            <Fingerprint color="success" fontSize="small" />
            <Typography 
                variant="caption" 
                sx={{ 
                    fontFamily: 'monospace', 
                    color: 'success.main', 
                    bgcolor: alpha(theme.palette.success.main, 0.05), 
                    px: 0.8, py: 0.2, borderRadius: 1,
                    fontWeight: 700
                }}
            >
              {row.hash_archivo_firmado ? row.hash_archivo_firmado.substring(0, 8).toUpperCase() : 'PEND...'}
            </Typography>
          </Stack>
        </Tooltip>
      )
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (row) => (
        <Tooltip title="Descargar Copia Legal">
          <span>
            <IconButton
              color="primary"
              onClick={() => logic.handleDownload(row)}
              disabled={logic.downloadingId === row.id}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
              }}
            >
              {logic.downloadingId === row.id 
                ? <CircularProgress size={18} color="inherit" /> 
                : <DownloadIcon fontSize="small" />
              }
            </IconButton>
          </span>
        </Tooltip>
      )
    }
  ], [theme, logic]);

  return (
    <PageContainer maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader
        title="Auditoría de Contratos"
        subtitle="Registro histórico de acuerdos legales y contratos digitalizados por los usuarios."
      />

      {/* BARRA DE BÚSQUEDA */}
      <FilterBar>
        <FilterSearch 
            placeholder="Buscar por ID, Usuario o Hash..." 
            value={logic.searchTerm} 
            onSearch={logic.setSearchTerm} 
            sx={{ flexGrow: 1 }}
        />
      </FilterBar>

      {/* TABLA DE AUDITORÍA */}
      <QueryHandler isLoading={logic.isLoading} error={logic.error as Error | null}>
        <DataTable
          columns={columns}
          data={logic.filteredContratos}
          getRowKey={(row) => row.id}

          // ✅ INTEGRACIÓN: Fila activa si tiene el hash generado (contrato válido)
          isRowActive={(row) => !!row.hash_archivo_firmado}
          highlightedRowId={logic.highlightedId}

          emptyMessage="No se han encontrado registros de contratos firmados."
          pagination={true}
          defaultRowsPerPage={10}
        />
      </QueryHandler>

    </PageContainer>
  );
};

export default AdminContratosFirmados;