import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Paper, Chip, LinearProgress, Divider,
  Accordion, AccordionSummary, AccordionDetails, Stack, Alert
} from '@mui/material';
import { ExpandMore, ReceiptLong, LocalShipping, Assessment } from '@mui/icons-material';

// Servicios y Tipos
import ResumenCuentaService from '../../../Services/resumenCuenta.service';
import type { ResumenCuentaDto, DetalleCuotaJson } from '../../../types/dto/resumenCuenta.dto';

// Componentes Comunes
import { PageContainer, PageHeader } from '../../../components/common';
import { QueryHandler } from '../../../components/common/QueryHandler/QueryHandler';

const MisResumenes: React.FC = () => {
  
  // Query: Obtener resúmenes
  const { data: resumenes, isLoading, error } = useQuery<ResumenCuentaDto[]>({
    queryKey: ['misResumenes'],
    queryFn: async () => (await ResumenCuentaService.getMyAccountSummaries()).data
  });

  // Renderizado del detalle financiero
  const renderDetalleCuota = (detalle: DetalleCuotaJson) => (
    <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, mt: 1 }}>
      <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalShipping fontSize="small" /> Referencia de Valor (Cemento)
      </Typography>
      
      {/* 🔄 REEMPLAZO DE GRID: Usamos Box con Flexbox */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="caption" display="block" color="text.secondary">
            Producto Base
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {detalle.nombre_cemento}
          </Typography>
        </Box>
        
        <Box textAlign="right">
          <Typography variant="caption" display="block" color="text.secondary">
            Valor Unitario
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            ${detalle.valor_cemento}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
        <ReceiptLong fontSize="small" /> Composición de la Cuota
      </Typography>

      <Stack spacing={1.5}>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Valor Móvil ({detalle.valor_cemento_unidades} u.)
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            ${detalle.valor_movil.toLocaleString()}
          </Typography>
        </Box>
        
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Carga Administrativa
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            ${detalle.carga_administrativa.toLocaleString()}
          </Typography>
        </Box>
        
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            IVA s/Carga Admin
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            ${detalle.iva_carga_administrativa.toLocaleString()}
          </Typography>
        </Box>
        
        <Divider sx={{ borderStyle: 'dashed' }} />
        
        <Box display="flex" justifyContent="space-between" sx={{ color: 'primary.main' }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Valor Mensual Final
          </Typography>
          <Typography variant="subtitle1" fontWeight={700}>
            ${detalle.valor_mensual_final.toLocaleString()}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  return (
    <PageContainer maxWidth="md">
      <PageHeader 
        title="Resumen de Cuenta" 
        subtitle="Detalle de la composición de tus cuotas y progreso de tus planes." 
      />

      <QueryHandler isLoading={isLoading} error={error as Error | null}>
        {resumenes && resumenes.length > 0 ? (
          <Stack spacing={3}>
            {resumenes.map((resumen) => (
              <Paper 
                key={resumen.id} 
                elevation={0} 
                variant="outlined" 
                sx={{ 
                  overflow: 'hidden', 
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                {/* Header de la Tarjeta */}
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        {resumen.proyecto_info?.nombre_proyecto || resumen.nombre_proyecto}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Plan de {resumen.meses_proyecto} cuotas
                      </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={1}>
                      <Chip 
                        label={`${resumen.cuotas_pagadas} Pagadas`} 
                        color="success" 
                        size="small" 
                        variant="outlined" 
                      />
                      {resumen.cuotas_vencidas > 0 && (
                        <Chip 
                          label={`${resumen.cuotas_vencidas} Vencidas`} 
                          color="error" 
                          size="small" 
                        />
                      )}
                    </Stack>
                  </Box>

                  {/* Barra de Progreso */}
                  <Box mt={3}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        Progreso del Plan
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color="primary.main">
                        {resumen.porcentaje_pagado.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={resumen.porcentaje_pagado} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Box>

                {/* Acordeón de Detalles */}
                <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="button" sx={{ textTransform: 'none', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assessment fontSize="small" /> Ver composición de la cuota
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 3, pt: 0 }}>
                    {renderDetalleCuota(resumen.detalle_cuota)}
                  </AccordionDetails>
                </Accordion>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            No tienes resúmenes de cuenta activos. Suscríbete a un proyecto para ver el detalle.
          </Alert>
        )}
      </QueryHandler>
    </PageContainer>
  );
};

export default MisResumenes;