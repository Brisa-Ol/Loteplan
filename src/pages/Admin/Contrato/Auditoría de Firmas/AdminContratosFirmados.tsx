import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, 
  Button, TextField, InputAdornment, Stack 
} from '@mui/material';
import { 
  Search, 
  Download as DownloadIcon, 
  Fingerprint, 
  Business, 
  Person 
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// 👇 1. Importamos format y el idioma español
import { format } from 'date-fns'; 
import { es } from 'date-fns/locale'; 


import type { ContratoFirmadoDto } from '../../../../types/dto/contrato.dto';
import { PageContainer } from '../../../../components/common/PageContainer/PageContainer';
import { QueryHandler } from '../../../../components/common/QueryHandler/QueryHandler';
import ContratoGeneralService from '../../../../Services/contrato-general.service';
import { PageHeader } from '../../../../components/common/PageHeader/PageHeader';

const AdminContratosFirmados: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // 1. Query: Obtener TODOS los contratos firmados
  const { data: contratos = [], isLoading, error } = useQuery<ContratoFirmadoDto[]>({
    queryKey: ['adminContratosFirmados'],
    queryFn: async () => {
        const res = await ContratoGeneralService.findAllSigned();
        return res.data; 
    }
  });

  // 2. Filtrado en Cliente
  const filteredContratos = useMemo(() => {
    return contratos.filter(c => {
      const term = searchTerm.toLowerCase();
      return (
        c.nombre_archivo.toLowerCase().includes(term) ||
        c.id_usuario_firmante.toString().includes(term) ||
        c.id_proyecto.toString().includes(term)
      );
    });
  }, [contratos, searchTerm]);

  // 3. Manejo de Descarga
  const handleDownload = async (contrato: ContratoFirmadoDto) => {
    try {
      setDownloadingId(contrato.id);
      await ContratoGeneralService.downloadAndSave(contrato.id, contrato.nombre_archivo);
    } catch (error) {
      alert("Error al descargar el archivo. Verifica tu conexión.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <PageContainer maxWidth="xl">

<PageHeader
              title="   Auditoría de Contratos Firmados"
              subtitle="  Visualiza y descarga los contratos legalizados por los usuarios."
            />
      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', borderRadius: 2 }} elevation={0} variant="outlined">
        <TextField 
          placeholder="Buscar por archivo, ID usuario o ID proyecto..." 
          size="small" 
          sx={{ flexGrow: 1 }}
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        />
      </Paper>

      {/* Tabla */}
      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Usuario Firmante</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Proyecto</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Tipo Autorización</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Fecha Firma</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Seguridad (Hash)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }} align="right">Descarga</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContratos.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.id}</TableCell>
                  
                  {/* Usuario */}
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Person color="action" fontSize="small" />
                        <Typography variant="body2">ID: {row.id_usuario_firmante}</Typography>
                    </Stack>
                  </TableCell>

                  {/* Proyecto */}
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Business color="action" fontSize="small" />
                        <Typography variant="body2">ID: {row.id_proyecto}</Typography>
                    </Stack>
                  </TableCell>

                  {/* Tipo Autorización */}
                  <TableCell>
                    {row.id_inversion_asociada ? (
                        <Chip label={`Inversión #${row.id_inversion_asociada}`} color="primary" size="small" variant="outlined" />
                    ) : row.id_suscripcion_asociada ? (
                        <Chip label={`Suscripción #${row.id_suscripcion_asociada}`} color="secondary" size="small" variant="outlined" />
                    ) : (
                        <Chip label="N/A" size="small" />
                    )}
                  </TableCell>

                  {/* 👇 2. AQUÍ ESTÁ EL CAMBIO: Usamos 'format' en lugar de toLocaleDateString */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                        {row.fecha_firma 
                          ? format(new Date(row.fecha_firma), 'dd MMM yyyy', { locale: es }) 
                          : '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.fecha_firma 
                          ? format(new Date(row.fecha_firma), 'HH:mm', { locale: es }) + ' hs'
                          : ''}
                    </Typography>
                  </TableCell>

                  {/* Hash / Integridad */}
                  <TableCell>
                    <Tooltip title={`Hash SHA-256: ${row.hash_archivo_firmado}`}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ cursor: 'help' }}>
                            <Fingerprint color="success" fontSize="small" />
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                {row.hash_archivo_firmado ? row.hash_archivo_firmado.substring(0, 8) + '...' : 'Generando...'}
                            </Typography>
                        </Stack>
                    </Tooltip>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell align="right">
                    <Tooltip title="Descargar PDF Firmado">
                      <span> 
                        <IconButton 
                            color="primary" 
                            onClick={() => handleDownload(row)}
                            disabled={downloadingId === row.id}
                        >
                            <DownloadIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredContratos.length === 0 && (
                 <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No hay contratos firmados registrados.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </QueryHandler>
    </PageContainer>
  );
};

export default AdminContratosFirmados;