import React, { useState } from 'react';
import {
  Button, TextField, Stack, Box, Typography,
  CircularProgress, Alert, useTheme, alpha, Paper, InputAdornment, Divider
} from '@mui/material';
import {
  CreditCard as CuotaIcon,
  Add as AddIcon,
  History as HistoryIcon,
  Calculate as CalculateIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Servicios, Componentes y Hooks
import { BaseModal } from '../../../../../components/common/BaseModal/BaseModal';
import type { CreateCuotaMensualDto } from '../../../../../types/dto/cuotaMensual.dto';
import type { ProyectoDto } from '../../../../../types/dto/proyecto.dto';
import CuotaMensualService from '../../../../../services/cuotaMensual.service';
import ProyectoPriceHistory from '../ProyectoPriceHistory';
import { useSnackbar } from '../../../../../context/SnackbarContext'; // ✅ Hook de Snackbar

interface ConfigCuotasModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto | null;
}

const validationSchema = Yup.object({
  nombre_cemento_cemento: Yup.string().nullable(),
  valor_cemento_unidades: Yup.number().min(1, 'Mínimo 1 unidad').required('Requerido'),
  valor_cemento: Yup.number().min(0.01, 'Debe ser mayor a 0').required('Requerido'),
  porcentaje_plan: Yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').required('Requerido'),
  porcentaje_administrativo: Yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').required('Requerido'),
  porcentaje_iva: Yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').required('Requerido'),
});

const ConfigCuotasModal: React.FC<ConfigCuotasModalProps> = ({ open, onClose, proyecto }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  // ✅ Usamos el hook de Snackbar
  const { showSuccess, showError } = useSnackbar();

  const createMutation = useMutation({
    mutationFn: async (data: CreateCuotaMensualDto) => (await CuotaMensualService.create(data)).data,
    onSuccess: () => {
      if (proyecto) {
        queryClient.invalidateQueries({ queryKey: ['cuotasByProyecto', proyecto.id] });
        queryClient.invalidateQueries({ queryKey: ['proyecto', String(proyecto.id)] });
      }
      queryClient.invalidateQueries({ queryKey: ['adminProyectos'] });

      // ✅ Mensaje de éxito visual
      showSuccess('Cuota configurada y guardada correctamente.');

      formik.resetForm();
      setShowHistory(true);
    },
    onError: (err: any) => {
      console.error(err);
      // Opcional: mostrar error con snackbar también si se desea
      // showError('Error al guardar la configuración');
    }
  });

  const formik = useFormik<CreateCuotaMensualDto>({
    initialValues: {
      id_proyecto: proyecto?.id || 0,
      nombre_proyecto: proyecto?.nombre_proyecto || '',
      total_cuotas_proyecto: proyecto?.plazo_inversion || 0,
      nombre_cemento_cemento: '',
      valor_cemento_unidades: 1,
      valor_cemento: 0,
      porcentaje_plan: 70,
      porcentaje_administrativo: 10,
      porcentaje_iva: 21,
    },
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!proyecto) return;
      try {
        await createMutation.mutateAsync({
          ...values,
          id_proyecto: proyecto.id,
          nombre_proyecto: proyecto.nombre_proyecto,
          total_cuotas_proyecto: proyecto.plazo_inversion || 12,
          porcentaje_administrativo: values.porcentaje_administrativo,
          porcentaje_iva: values.porcentaje_iva,
        });
      } catch (error) {
        console.error('Error al crear cuota:', error);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setShowHistory(false);
    onClose();
  };

  if (!proyecto) return null;

  // CASO 1: Proyecto no mensual (Advertencia)
  if (proyecto.tipo_inversion !== 'mensual') {
    return (
      <BaseModal
        open={open}
        onClose={handleClose}
        title="Configuración No Disponible"
        headerColor="warning"
        icon={<WarningIcon />}
        hideConfirmButton
        cancelText="Cerrar"
        maxWidth="sm"
      >
        <Typography>
          Este proyecto es de tipo <strong>Inversión (Directo)</strong> y no requiere configuración de cuotas mensuales.
        </Typography>
      </BaseModal>
    );
  }

  // 1. Valor Base Total (Cemento * Unidades)
  const valorMovil = formik.values.valor_cemento_unidades * formik.values.valor_cemento;

  // 2. Total del Plan (Capital a financiar)
  const totalDelPlan = valorMovil * (formik.values.porcentaje_plan / 100);

  // 3. Valor Mensual PURO (Capital / Meses)
  const plazo = proyecto.plazo_inversion || 1;
  const valorMensual = totalDelPlan / plazo;

  // 4. Carga Administrativa (Sobre la Cuota Mensual Pura) 🟢 CORRECCIÓN AQUI
  // Se aplica el porcentaje sobre lo que paga por mes
  const cargaAdministrativa = valorMensual * (formik.values.porcentaje_administrativo / 100);

  // 5. IVA (Sobre la Carga Administrativa)
  const ivaCarga = cargaAdministrativa * (formik.values.porcentaje_iva / 100);

  // 6. Total Final
  const valorMensualFinal = valorMensual + cargaAdministrativa + ivaCarga;

  const sectionTitleSx = {
    fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2,
    display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.75rem', letterSpacing: 0.5
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Configurar Cuota Mensual"
      subtitle="Defina los valores base para el cálculo automático"
      icon={<CuotaIcon />}
      headerColor="primary"
      maxWidth="md"
      isLoading={createMutation.isPending}
      // Usamos customActions para mantener el botón de historial a la izquierda
      customActions={
        <>
          <Button
            onClick={() => setShowHistory(!showHistory)}
            startIcon={<HistoryIcon />}
            color="inherit"
            disabled={createMutation.isPending}
            sx={{ mr: 'auto', borderRadius: 2 }}
          >
            {showHistory ? 'Ocultar' : 'Ver'} Historial
          </Button>

          <Button onClick={handleClose} color="inherit" disabled={createMutation.isPending} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>

          <Button
            onClick={formik.submitForm}
            variant="contained"
            disabled={createMutation.isPending || !formik.isValid}
            startIcon={createMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            sx={{ px: 3, borderRadius: 2, fontWeight: 700 }}
          >
            {createMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </>
      }
    >
      <Stack spacing={4}>

        {/* RESUMEN DEL PROYECTO */}
        <Paper
          elevation={0}
          sx={{
            p: 2, borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="primary.main" fontWeight={700} textTransform="uppercase" gutterBottom>
                PROYECTO SELECCIONADO
              </Typography>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                {proyecto.nombre_proyecto}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" display="block">Plazo Total</Typography>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {proyecto.plazo_inversion} Meses
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* 1. DATOS DE CONFIGURACIÓN */}
        <Box>
          <Typography variant="subtitle2" sx={sectionTitleSx}>
            <DescriptionIcon fontSize="inherit" /> Datos Base
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Referencia del Valor (Opcional)"
              placeholder="Ej: Bolsa de Cemento Avellaneda 50kg"
              {...formik.getFieldProps('nombre_cemento_cemento')}
              disabled={createMutation.isPending}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Cantidad de Unidades"
                type="number"
                {...formik.getFieldProps('valor_cemento_unidades')}
                error={formik.touched.valor_cemento_unidades && Boolean(formik.errors.valor_cemento_unidades)}
                helperText={formik.touched.valor_cemento_unidades && formik.errors.valor_cemento_unidades}
                disabled={createMutation.isPending}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="Precio por Unidad"
                type="number"
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                {...formik.getFieldProps('valor_cemento')}
                error={formik.touched.valor_cemento && Boolean(formik.errors.valor_cemento)}
                helperText={formik.touched.valor_cemento && formik.errors.valor_cemento}
                disabled={createMutation.isPending}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          </Stack>
        </Box>

        {/* 2. PORCENTAJES DE CÁLCULO */}
        <Box>
          <Typography variant="subtitle2" sx={sectionTitleSx}>
            <CalculateIcon fontSize="inherit" /> Porcentajes de Cálculo
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth label="% Plan" type="number"
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              {...formik.getFieldProps('porcentaje_plan')}
              error={formik.touched.porcentaje_plan && Boolean(formik.errors.porcentaje_plan)}
              disabled={createMutation.isPending}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth label="% Administrativo" type="number"
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              {...formik.getFieldProps('porcentaje_administrativo')}
              error={formik.touched.porcentaje_administrativo && Boolean(formik.errors.porcentaje_administrativo)}
              disabled={createMutation.isPending}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth label="% IVA" type="number"
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              {...formik.getFieldProps('porcentaje_iva')}
              error={formik.touched.porcentaje_iva && Boolean(formik.errors.porcentaje_iva)}
              disabled={createMutation.isPending}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
        </Box>

        {/* 3. RESULTADO PRELIMINAR */}
        <Alert
          severity="info"
          icon={false}
          sx={{
            bgcolor: alpha(theme.palette.info.main, 0.05),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" color="info.main" fontWeight={700}>
                NUEVA CUOTA ESTIMADA
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Basado en los valores ingresados
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={800} color="primary.main">
              ${valorMensualFinal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>{proyecto.moneda}</Typography>
            </Typography>
          </Stack>
        </Alert>

        {createMutation.isError && (
          <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
            Error: {(createMutation.error as any).response?.data?.error || (createMutation.error as Error).message}
          </Alert>
        )}

        {/* HISTORIAL */}
        {showHistory && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon fontSize="small" /> HISTORIAL DE VALORES
            </Typography>
            <ProyectoPriceHistory proyectoId={proyecto.id} />
          </Box>
        )}

      </Stack>
    </BaseModal>
  );
};

export default ConfigCuotasModal;