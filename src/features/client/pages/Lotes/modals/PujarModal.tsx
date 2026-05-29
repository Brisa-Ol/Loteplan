// src/features/client/pages/Lotes/modals/PujarModal.tsx

import {
  Gavel,
  Timer,
  TokenOutlined
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';

import PujaService from '@/core/api/services/puja.service';
import type { LoteDto } from '@/core/types/lote.dto';
import { useCurrencyFormatter } from '@/features/client/hooks/useCurrencyFormatter';
import { useVerificarSuscripcion } from '@/features/client/hooks/useVerificarSuscripcion';
import { BaseModal } from '@/shared/components/domain/modals/BaseModal';
import useSnackbar from '@/shared/hooks/useSnackbar';

// ─── Constantes ───────────────────────────────────────────────────────────────

const INCREMENTO_PASO = 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mapearErrorBackend = (err: any): string => {
  const msg: string = err?.response?.data?.error || err?.message || '';

  if (msg.includes('mayor que la puja actual más alta'))
    return 'Tu oferta fue superada mientras confirmabas. Ingresá un monto mayor e intentá de nuevo.';
  if (msg.includes('mayor que tu puja actual'))
    return 'Tu nueva oferta debe superar tu oferta anterior.';
  if (msg.includes('token'))
    return 'No tenés tokens disponibles para pujar en este proyecto.';
  if (msg.includes('precio base') || msg.includes('base'))
    return 'La oferta debe ser mayor o igual al precio base del lote.';
  if (msg.includes('finalizada') || msg.includes('cerrada'))
    return 'La subasta ya fue cerrada.';
  if (msg.includes('activa'))
    return 'La subasta no está activa en este momento.';
  if (msg.includes('suscripcion') || msg.includes('suscripción'))
    return 'Debés estar suscripto al proyecto para poder pujar.';

  return msg || 'Ocurrió un error al procesar tu oferta. Intentá de nuevo.';
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
  /**
   * Si true: el monto del líder es conocido (o no hay ofertas).
   * Si false: hay un líder pero su monto no está disponible (usuario fue superado por otro).
   */
  montoLiderConocido?: boolean;
  /**
   * El monto del líder, si se conoce. Si soy el líder = mi propio monto.
   * Si no hay ofertas = precio_base.
   */
  montoLider?: number;
  /**
   * El monto de la puja propia del usuario en este lote (si ya participa).
   */
  miMontoActual?: number;
  soyGanador?: boolean;
  yaParticipa?: boolean;
  onSuccess?: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export const PujarModal: React.FC<Props> = ({
  open,
  onClose,
  lote,
  montoLiderConocido = true,
  montoLider = 0,
  miMontoActual,
  soyGanador = false,
  yaParticipa = false,
  onSuccess,
}) => {
  const theme = useTheme();
  const formatCurrency = useCurrencyFormatter();
  const { showSuccess, showError } = useSnackbar();

  const [monto, setMonto] = useState('');
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);
  const [minimoAlAbrir, setMinimoAlAbrir] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState<string>('');
  const [esUrgente, setEsUrgente] = useState<boolean>(false);


  const { tieneTokens, tokensDisponibles } = useVerificarSuscripcion(
    lote?.id_proyecto ?? undefined
  );



  // ─── Cálculo de precios ──────────────────────────────────────────────────
  //
  // Tenemos dos escenarios posibles:
  //
  // [Monto conocido] montoLiderConocido = true
  //   → El mínimo es montoLider + PASO
  //   → Mostramos la oferta líder con su valor exacto
  //
  // [Monto desconocido] montoLiderConocido = false
  //   → El usuario fue superado por alguien más pero no sabemos cuánto ofreció ese alguien
  //   → El mínimo lo calculamos desde la propia oferta del usuario + PASO
  //   → Avisamos que el backend puede rechazar si el líder está aún más alto
  //   → El usuario puede subir la oferta con los botones de incremento

  const { precioBase, precioMinimoRequerido, hayOfertas } = useMemo(() => {
    if (!lote) return { precioBase: 0, precioMinimoRequerido: 0, hayOfertas: false };

    const base = Number(lote.precio_base || 0);

    if (montoLiderConocido) {
      // Monto exacto disponible: base si sin ofertas, o montoLider si hay ofertas
      const actual = montoLider > base ? montoLider : base;
      return {
        precioBase: base,
        precioMinimoRequerido: actual + INCREMENTO_PASO,
        hayOfertas: actual > base,
      };
    }

    // Monto desconocido: usamos miMontoActual como referencia mínima
    // El backend validará si es suficiente para superar al líder real
    const referencia = miMontoActual && miMontoActual > base ? miMontoActual : base;
    return {
      precioBase: base,
      precioMinimoRequerido: referencia + INCREMENTO_PASO,
      hayOfertas: true,
    };
  }, [lote, montoLiderConocido, montoLider, miMontoActual]);

  // ─── Efectos ──────────────────────────────────────────────────────────────
// ─── Countdown de la Subasta ──────────────────────────────────────────────
  useEffect(() => {
    if (!lote?.fecha_fin || lote.estado_subasta === 'finalizada') {
      setTiempoRestante('SUBASTA FINALIZADA');
      setEsUrgente(true);
      return;
    }

    const calcularTiempo = () => {
      const ahora = new Date().getTime();
      const fin = new Date(lote.fecha_fin!).getTime();
      const diferencia = fin - ahora;

      if (diferencia <= 0) {
        setTiempoRestante('SUBASTA FINALIZADA');
        setEsUrgente(true);
        return;
      }

      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
      const minutos = Math.floor((diferencia / 1000 / 60) % 60);
      const segundos = Math.floor((diferencia / 1000) % 60);

      // Si falta menos de 24 horas, lo consideramos urgente (se pondrá rojo)
      setEsUrgente(dias === 0);

      if (dias > 0) {
        setTiempoRestante(`CIERRA EN ${dias}d ${horas}h ${minutos}m`);
      } else if (horas > 0) {
        setTiempoRestante(`CIERRA EN ${horas}h ${minutos}m ${segundos}s`);
      } else {
        setTiempoRestante(`¡CIERRA EN ${minutos}m ${segundos}s!`);
      }
    };

    calcularTiempo(); // Llamada inicial para que no parpadee
    const intervalo = setInterval(calcularTiempo, 1000);

    return () => clearInterval(intervalo);
  }, [lote?.fecha_fin, lote?.estado_subasta]);

  useEffect(() => {
    if (open) {
      setMonto(precioMinimoRequerido.toString());
      setMinimoAlAbrir(precioMinimoRequerido);
      setErrorSubmit(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Si el precio mínimo sube mientras el modal está abierto, ajustar automáticamente
  useEffect(() => {
    if (!open) return;
    const montoActual = parseFloat(monto);
    if (!isNaN(montoActual) && montoActual < precioMinimoRequerido) {
      setMonto(precioMinimoRequerido.toString());
    }
  }, [precioMinimoRequerido, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Mutation ─────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: () =>
      PujaService.create({ id_lote: lote!.id, monto_puja: Number(monto) }),
    onSuccess: () => {
      showSuccess(
        yaParticipa
          ? '¡Oferta mejorada con éxito!'
          : '¡Participación confirmada! Tu token fue consumido.'
      );
      handleReset();
      onSuccess?.();
      setTimeout(() => {
        window.location.reload(); // Recarga para actualizar estado 
      }, 1750);
    },
    onError: (err: any) => {
      const mensaje = mapearErrorBackend(err);
      setErrorSubmit(mensaje);
      showError(mensaje);
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleReset = () => {
    setMonto('');
    setErrorSubmit(null);
    onClose();
  };

  const handleIncrementar = (valor: number) => {
    const base = parseFloat(monto) || precioMinimoRequerido;
    setMonto((base + valor).toString());
    setErrorSubmit(null);
  };

  const handleChangeMonto = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonto(e.target.value);
    setErrorSubmit(null);
  };

  const handleConfirmPuja = async () => {
    await mutation.mutate()

  }

  // ─── Validaciones ─────────────────────────────────────────────────────────

  const montoNumerico = parseFloat(monto);
  const esMontoValido = !isNaN(montoNumerico) && montoNumerico >= precioMinimoRequerido;
  const huboCambioDePrecios = precioMinimoRequerido > minimoAlAbrir;
  const puedeConfirmar = esMontoValido && !mutation.isPending && (yaParticipa || tieneTokens);

  if (!lote) return null;
  const titulo = soyGanador ? 'Defender mi Lugar' : yaParticipa ? '¡Recuperar mi Lugar!' : 'Ofertar Ahora';
  const headerColor = soyGanador ? 'success' : yaParticipa ? 'error' : 'primary'; // Rojo para generar urgencia
  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <BaseModal
      open={open}
      onClose={handleReset}
      title={titulo}
      headerColor={headerColor}
      onConfirm={handleConfirmPuja}
      disableConfirm={!puedeConfirmar}
    >
      <Stack spacing={3}>

        {/* Urgencia */}
        {/* Urgencia / Tiempo Restante */}
        {tiempoRestante && (
          <Box
            sx={{
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 1,
              color: esUrgente ? 'error.main' : 'primary.main', 
              bgcolor: alpha(theme.palette[esUrgente ? 'error' : 'primary'].main, 0.08),
              py: 1.5, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette[esUrgente ? 'error' : 'primary'].main, 0.2),
            }}
          >
            <Timer fontSize="small" />
            <Typography variant="subtitle2" fontWeight={900} letterSpacing={0.5}>
              {tiempoRestante}
            </Typography>
          </Box>
        )}

        {/* Mensaje motivacional */}
        {/* Mensaje motivacional */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle1" fontWeight={800} color={soyGanador ? 'success.main' : yaParticipa ? 'error.main' : 'primary.main'}>
            {soyGanador
              ? '¡Vas ganando, no te relajes!'
              : yaParticipa
                ? '¡Estás perdiendo la adjudicación! Mejorá tu oferta ahora.'
                : '¡Oferta ahora y asegura el lote!'}
          </Typography>
        </Box>

        {/* ── Resumen de precios ─────────────────────────────────────────────
            Mostramos SOLO información que tenemos con certeza.
            - Precio base: siempre
            - Oferta líder: solo si la conocemos (soy el líder, o no hay ofertas)
            - Mi oferta actual: si ya participo y fui superado
            - Mínimo para pujar: siempre
        */}
        <Box p={2} bgcolor="background.paper" borderRadius={2} border="1px solid" borderColor="divider">

          {/* Precio base */}
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Typography variant="caption" color="text.secondary">
              Precio base:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(precioBase)}
            </Typography>
          </Stack>

          {/* Oferta líder */}
          {hayOfertas && montoLiderConocido && (
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary" fontWeight={yaParticipa && !soyGanador ? 700 : 400}>
                {soyGanador ? 'Tu oferta líder:' : 'Oferta a superar:'}
              </Typography>
              <Typography variant="body2" fontWeight={800} color={soyGanador ? "success.main" : "error.main"}>
                {formatCurrency(montoLider)}
              </Typography>
            </Stack>
          )}

          {/* Mi oferta actual tachada (si está perdiendo) */}
          {hayOfertas && miMontoActual && !soyGanador && (
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary">
                Tu oferta superada:
              </Typography>
              <Typography variant="body2" fontWeight={700} color="text.disabled" sx={{ textDecoration: 'line-through' }}>
                {formatCurrency(miMontoActual)}
              </Typography>
            </Stack>
          )}

          <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

          {/* Mínimo para pujar */}
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="primary.main" fontWeight={800}>
              Mínimo para pujar:
            </Typography>
            <Typography variant="body2" color="primary.main" fontWeight={900}>
              {formatCurrency(precioMinimoRequerido)}
            </Typography>
          </Stack>
        </Box>

        {/* Aviso cuando el monto del líder es desconocido */}
        {!montoLiderConocido && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={800} display="block">
              Alguien superó tu oferta
            </Typography>
            <Typography variant="caption">
              El mínimo mostrado supera tu oferta anterior. Si el líder ofertó más,
              el sistema te avisará al confirmar para que puedas ajustar el monto.
            </Typography>
          </Alert>
        )}

        {/* Alerta: subida de precios mientras estaba abierto el modal */}
        {huboCambioDePrecios && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={800} display="block">
              El mínimo subió mientras decidías
            </Typography>
            <Typography variant="caption">
              Nuevo mínimo: {formatCurrency(precioMinimoRequerido)}. Tu monto fue ajustado automáticamente.
            </Typography>
          </Alert>
        )}

        {/*
          ─── Alertas de tokens ──────────────────────────────────────────────
          A) yaParticipa  → re-oferta gratuita (token ya consumido)
          B) primera puja + tiene tokens → consumirá 1 token
          C) primera puja + sin tokens   → bloqueado
        */}

        {yaParticipa && (
          <Alert severity="success" icon={<TokenOutlined fontSize="small" />} sx={{ borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={800} display="block">Mejora gratuita</Typography>
            <Typography variant="caption">
              Tu token fue consumido en tu primera oferta. Volver a pujar no tiene costo adicional.
            </Typography>
          </Alert>
        )}

        {!yaParticipa && tieneTokens && (
          <Alert severity="warning" icon={<TokenOutlined fontSize="small" />} sx={{ borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={800} display="block">
              Tokens disponibles: {tokensDisponibles}
            </Typography>
            <Typography variant="caption">
              Esta será tu primera oferta en este lote. Consumirá 1 token.
            </Typography>
          </Alert>
        )}

        {!yaParticipa && !tieneTokens && (
          <Alert severity="error" icon={<TokenOutlined fontSize="small" />} sx={{ borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={800} display="block">Sin tokens disponibles</Typography>
            <Typography variant="caption">
              Ya utilizaste tu token en este proyecto y no estás participando en este lote.
              Recuperarás el token automáticamente si tu oferta en otro lote es superada.
            </Typography>
          </Alert>
        )}

        {/* Input */}
        <TextField
          autoFocus
          fullWidth
          label={yaParticipa && !soyGanador ? "Tu Nueva Oferta" : "Tu Monto"}
          type="number"
          value={monto}
          onChange={handleChangeMonto}
          error={monto !== '' && !esMontoValido}
          helperText={
            monto !== '' && !esMontoValido
              ? `Debe ser al menos ${formatCurrency(precioMinimoRequerido)}`
              : yaParticipa && !soyGanador
                ? `Monto mínimo calculado para volver al primer lugar.`
                : ''
          }
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
            sx: { fontWeight: 800, fontSize: '1.2rem' } // Hacemos el número más imponente
          }}
        />

        {/* Incrementos rápidos */}
        <Stack direction="row" spacing={1}>
          {[10_000, 100_000, 500_000].map((v) => (
            <Button
              key={v}
              variant="outlined"
              fullWidth
              onClick={() => handleIncrementar(v)}
              startIcon={<Gavel sx={{ fontSize: 14 }} />}
            >
              +{v / 1_000}k
            </Button>
          ))}
        </Stack>

        {/* Error de submit */}
        {errorSubmit && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={700}>
              {errorSubmit}
            </Typography>
          </Alert>
        )}

      </Stack>
    </BaseModal>
  );
};