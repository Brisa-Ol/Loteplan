// src/features/admin/pages/Inversiones/modals/DetalleInversionModal.tsx

import { env } from '@/core/config/env';
import type { InversionDto } from '@/core/types/inversion.dto';
import { BaseModal } from '@/shared';

type ThemeColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
import { ReceiptLong } from '@mui/icons-material';
import { Alert, Chip, Stack, useTheme } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActorsSection, CapitalSection, TrazabilidadSection } from './InversionSections';


interface Props {
  open: boolean;
  onClose: () => void;
  inversion: InversionDto | null;
  userName?: string;
  userEmail?: string;
  projectName?: string;
}

const STATUS_COLOR_MAP: Record<InversionDto['estado'], ThemeColor> = {
  pagado: 'success', pendiente: 'warning', fallido: 'error', reembolsado: 'info',
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'No registrada';
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString(env.defaultLocale, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const DetalleInversionModal: React.FC<Props> = ({ open, onClose, inversion, userName, userEmail, projectName }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  if (!inversion) return null;

  const statusColor = STATUS_COLOR_MAP[inversion.estado] ?? 'primary';
  const themeColorMain = theme.palette[statusColor].main;
  const montoInvertido = Number(inversion.monto) || 0;
  const montoTotalProyecto = Number(inversion.proyectoInvertido?.monto_inversion) || 0;
  const porcentajeParticipacion = montoTotalProyecto > 0 ? ((montoInvertido / montoTotalProyecto) * 100).toFixed(2) : 0;

  const handleNavigate = () => { onClose(); navigate(`/admin/proyectos?highlight=${inversion.id_proyecto}`); };

  return (
    <BaseModal open={open} onClose={onClose}
      title="Expediente de Inversión" subtitle={`Referencia técnica: #INV-${inversion.id}`}
      icon={<ReceiptLong />} headerColor={statusColor} maxWidth="md"
      headerExtra={<Chip label={inversion.estado.toUpperCase()} color={statusColor} sx={{ fontWeight: 800, borderRadius: 1.5, px: 1 }} />}
    >
      <Stack spacing={3}>

        {inversion.estado === 'pendiente'    && <Alert severity="warning" sx={{ borderRadius: 2 }}>Operación en espera: Requiere confirmación de fondos o validación 2FA.</Alert>}
        {inversion.estado === 'fallido'      && <Alert severity="error"   sx={{ borderRadius: 2 }}>Operación rechazada: Los fondos no fueron acreditados o el tiempo de espera expiró.</Alert>}
        {inversion.estado === 'reembolsado'  && <Alert severity="info"    sx={{ borderRadius: 2 }}>Capital devuelto: Los fondos han sido reintegrados a la cuenta del inversor.</Alert>}

        <CapitalSection
          inversion={inversion} statusColor={statusColor} themeColorMain={themeColorMain}
          montoInvertido={montoInvertido} montoTotalProyecto={montoTotalProyecto}
          porcentajeParticipacion={porcentajeParticipacion}
        />

        <ActorsSection
          inversion={inversion} userName={userName} userEmail={userEmail}
          projectName={projectName} onNavigate={handleNavigate}
        />

        <TrazabilidadSection inversion={inversion} formatDate={formatDate} />

      </Stack>
    </BaseModal>
  );
};

export default DetalleInversionModal;