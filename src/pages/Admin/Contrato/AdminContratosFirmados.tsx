// src/pages/Admin/Contratos/AdminContratosFirmados.tsx

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, IconButton, Tooltip,
  TextField, InputAdornment, Stack, useTheme, alpha, Avatar,
  CircularProgress
} from '@mui/material';
import {
  Search,
  Download as DownloadIcon,
  Fingerprint,
  Business,
  Person,
  Description as ContractIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// Utils
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Servicios y Tipos
import ContratoService from '../../../services/contrato.service';
import type { ContratoFirmadoDto } from '../../../types/dto/contrato.dto';

// Componentes Comunes
import { PageContainer } from '../../../components/common/PageContainer/PageContainer';
import { PageHeader } from '../../../components/common/PageHeader/PageHeader';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';
import { DataTable, type DataTableColumn } from '../../../components/common/DataTable/DataTable';
import { useSnackbar } from '../../../context/SnackbarContext';

const AdminContratosFirmados: React.FC = () => {
  const theme = useTheme();
  const { showError } = useSnackbar();

  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // ✅ Feedback Visual: Flash verde al terminar descarga
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // 1. Query: Obtener TODOS los contratos firmados
  const { data: contratos = [], isLoading, error } = useQuery<ContratoFirmadoDto[]>({
    queryKey: ['adminContratosFirmados'],
    queryFn: async () => {
      const res = await ContratoService.findAllSigned();
      return res.data;
    }
  });

  // 2. Filtrado en Cliente (Memoizado)
  const filteredContratos = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return contratos.filter(c =>
      c.nombre_archivo.toLowerCase().includes(term) ||
      c.id_usuario_firmante.toString().includes(term) ||
      c.id_proyecto.toString().includes(term)
    );
  }, [contratos, searchTerm]);

  // 3. Manejo de Descarga (Callback)
  const handleDownload = useCallback(async (contrato: ContratoFirmadoDto) => {
    try {
      setDownloadingId(contrato.id);
      await ContratoService.downloadAndSave(contrato.id, contrato.nombre_archivo);

      // ✅ Feedback Visual: Flash de éxito
      setHighlightedId(contrato.id);
      setTimeout(() => setHighlightedId(null), 2500);

    } catch (error) {
      showError("Error al descargar el archivo. Verifica tu conexión.");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  // 4. Definición de Columnas
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
              onClick={() => handleDownload(row)}
              disabled={downloadingId === row.id}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              {downloadingId === row.id ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      )
    }
  ], [theme, downloadingId, handleDownload]);

  return (
    <PageContainer maxWidth="xl">

      <PageHeader
        title="Auditoría de Contratos"
        subtitle="Visualiza y descarga los contratos legalizados por los usuarios."
      />

      {/* Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: 2, mb: 3,
          borderRadius: 2,
          border: '1px solid', borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.paper, 0.6)
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <ContractIcon color="action" />
          <TextField
            placeholder="Buscar por archivo, ID usuario o ID proyecto..."
            size="small"
            sx={{ flexGrow: 1 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
              sx: { borderRadius: 2 }
            }}
          />
        </Stack>
      </Paper>

      {/* DataTable */}
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <DataTable
          columns={columns}
          data={filteredContratos}
          getRowKey={(row) => row.id}

          // ✅ Feedback Visual al descargar
          highlightedRowId={highlightedId}

          emptyMessage="No se encontraron contratos firmados."
          pagination={true}
          defaultRowsPerPage={10}
        />
      </QueryHandler>

    </PageContainer>
  );
};

export default AdminContratosFirmados;