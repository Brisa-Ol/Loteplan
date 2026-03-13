// src/features/admin/pages/Inversiones/modals/sections/CapitalSection.tsx

import { env } from '@/core/config/env';
import type { InversionDto } from '@/core/types/inversion.dto';
import { PieChart } from '@mui/icons-material';
import { alpha, Paper, Stack, Typography } from '@mui/material';
import React from 'react';

interface Props {
  inversion: InversionDto;
  statusColor: string;
  themeColorMain: string;
  montoInvertido: number;
  montoTotalProyecto: number;
  porcentajeParticipacion: string | number;
}

export const CapitalSection: React.FC<Props> = ({
  statusColor, themeColorMain, montoInvertido, montoTotalProyecto, porcentajeParticipacion
}) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
    <Paper variant="outlined" sx={{
      flex: 2, p: 3, borderRadius: 3,
      borderColor: alpha(themeColorMain, 0.3), bgcolor: alpha(themeColorMain, 0.03),
      display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center'
    }}>
      <Typography variant="overline" color="text.secondary" fontWeight={800} letterSpacing={1.5}>
        MONTO TOTAL DE LA OPERACIÓN
      </Typography>
      <Typography variant="h2" fontWeight={900} color={`${statusColor}.main`} sx={{ my: 0.5 }}>
        ${montoInvertido.toLocaleString(env.defaultLocale, { minimumFractionDigits: 2 })}
      </Typography>
      <Typography variant="caption" color="text.disabled" fontWeight={700}>
        DIVISA: ARS (PESOS ARGENTINOS)
      </Typography>
    </Paper>

    {montoTotalProyecto > 0 && (
      <Paper variant="outlined" sx={{
        flex: 1, p: 3, borderRadius: 3,
        bgcolor: 'background.paper',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <PieChart color="action" sx={{ fontSize: 28, mb: 1, opacity: 0.6 }} />
        <Typography variant="h4" fontWeight={900} color="text.primary">{porcentajeParticipacion}%</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={800} textAlign="center" sx={{ lineHeight: 1.2 }}>
          PARTICIPACIÓN EN EL PROYECTO
        </Typography>
      </Paper>
    )}
  </Stack>
);

// ─────────────────────────────────────────────────────────────────────────────

// sections/ActorsSection.tsx

import type { InversionDto as Inv } from '@/core/types/inversion.dto';
import { AlternateEmail, Business, OpenInNew as OpenIcon, Person } from '@mui/icons-material';
import { Avatar, Box, Button, Chip, Paper as MuiPaper, Stack as MuiStack, Typography as Typo, useTheme } from '@mui/material';

interface ActorsProps {
  inversion: Inv;
  userName?: string;
  userEmail?: string;
  projectName?: string;
  onNavigate: () => void;
}

export const ActorsSection: React.FC<ActorsProps> = ({ inversion, userName, userEmail, projectName, onNavigate }) => {
  const theme = useTheme();
  return (
    <MuiStack direction={{ xs: 'column', md: 'row' }} spacing={2}>

      {/* INVERSOR */}
      <MuiPaper variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: 3 }}>
        <MuiStack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 32, height: 32 }}>
            <Person fontSize="small" />
          </Avatar>
          <Typo variant="subtitle2" fontWeight={900}>PERFIL DEL INVERSOR</Typo>
        </MuiStack>
        <MuiStack spacing={2}>
          <Box>
            <Typo variant="caption" color="text.disabled" fontWeight={800}>USERNAME</Typo>
            <MuiStack direction="row" alignItems="center" spacing={0.5}>
              <AlternateEmail sx={{ fontSize: 14, color: 'primary.main' }} />
              <Typo variant="body2" fontWeight={700} color="primary.main">@{inversion.inversor?.nombre_usuario || 'no_user'}</Typo>
            </MuiStack>
          </Box>
          <Box>
            <Typo variant="caption" color="text.disabled" fontWeight={800}>TITULAR</Typo>
            <Typo variant="body2" fontWeight={600}>{userName || `${inversion.inversor?.nombre} ${inversion.inversor?.apellido}` || 'Sin Nombre'}</Typo>
          </Box>
          <Box>
            <Typo variant="caption" color="text.disabled" fontWeight={800}>CORREO ELECTRÓNICO</Typo>
            <Typo variant="body2" color="text.secondary">{userEmail || inversion.inversor?.email || 'S/D'}</Typo>
          </Box>
        </MuiStack>
      </MuiPaper>

      {/* PROYECTO */}
      <MuiPaper variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: 3 }}>
        <MuiStack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', width: 32, height: 32 }}>
            <Business fontSize="small" />
          </Avatar>
          <Typo variant="subtitle2" fontWeight={900}>ACTIVO ASOCIADO</Typo>
        </MuiStack>
        <MuiStack spacing={2}>
          <Box>
            <Typo variant="caption" color="text.disabled" fontWeight={800}>NOMBRE DEL PROYECTO</Typo>
            <Typo variant="body2" fontWeight={700} noWrap>{inversion.proyectoInvertido?.nombre_proyecto || projectName || 'Desconocido'}</Typo>
          </Box>
          <Box>
            <Typo variant="caption" color="text.disabled" fontWeight={800} display="block" mb={0.5}>ESPECIFICACIONES</Typo>
            <MuiStack direction="row" spacing={1}>
              <Chip label={inversion.proyectoInvertido?.tipo_inversion?.toUpperCase() || 'DIRECTA'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 800 }} />
              <Chip label={inversion.proyectoInvertido?.estado_proyecto?.toUpperCase() || 'ESPERA'} size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 800 }} />
            </MuiStack>
          </Box>
          <Button variant="contained" fullWidth size="small" startIcon={<OpenIcon />} onClick={onNavigate}
            sx={{ borderRadius: 2, mt: 1, fontWeight: 800, textTransform: 'none', py: 1 }}>
            Gestionar Proyecto
          </Button>
        </MuiStack>
      </MuiPaper>

    </MuiStack>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

// sections/TrazabilidadSection.tsx

import { CalendarToday, ReceiptLong, Update as UpdateIcon } from '@mui/icons-material';
import { Divider, Paper as P2, Stack as S2, Typography as T2, useTheme as useT2 } from '@mui/material';

interface TrazabilidadProps {
  inversion: Inv;
  formatDate: (d?: string) => string;
}

export const TrazabilidadSection: React.FC<TrazabilidadProps> = ({ inversion, formatDate }) => {
  const theme = useT2();
  return (
    <P2 variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
      <S2 direction="row" alignItems="center" spacing={1.5} mb={2}>
        <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
        <T2 variant="subtitle2" fontWeight={900} color="text.secondary">CRONOLOGÍA TRANSACCIONAL</T2>
      </S2>
      <S2 direction={{ xs: 'column', sm: 'row' }} spacing={4}
        divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, opacity: 0.5 }} />}>
        <Box>
          <T2 variant="caption" color="text.disabled" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ReceiptLong sx={{ fontSize: 12 }} /> REGISTRO INICIAL
          </T2>
          <T2 variant="body2" fontWeight={700}>{formatDate(inversion.fecha_inversion || (inversion as any).createdAt)}</T2>
        </Box>
        <Box>
          <T2 variant="caption" color="text.disabled" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <UpdateIcon sx={{ fontSize: 12 }} /> ÚLTIMA ACTUALIZACIÓN
          </T2>
          <T2 variant="body2" fontWeight={700}>{formatDate((inversion as any).updatedAt)}</T2>
        </Box>
      </S2>
    </P2>
  );
};