import React from 'react';
import { Stack, Typography, Alert, Box } from '@mui/material';
import { PlayCircleFilled, StopCircle, Gavel } from '@mui/icons-material';
import { BaseModal } from '../../../../components/common/BaseModal/BaseModal';
import type { LoteDto } from '../../../../types/dto/lote.dto';

interface Props {
  open: boolean;
  onClose: () => void;
  lote: LoteDto | null;
  onStart: (id: number) => void;
  onEnd: (id: number) => void;
  isLoading: boolean;
}

const AuctionControlModal: React.FC<Props> = ({ open, onClose, lote, onStart, onEnd, isLoading }) => {
  if (!lote) return null;

  const isPending = lote.estado_subasta === 'pendiente';
  const isActive = lote.estado_subasta === 'activa';
  const isFinished = lote.estado_subasta === 'finalizada';

  const handleConfirm = () => {
    if (isPending) onStart(lote.id);
    else if (isActive) onEnd(lote.id);
  };

  const getModalConfig = () => {
    if (isPending) return {
        title: `Iniciar Subasta: ${lote.nombre_lote}`,
        icon: <PlayCircleFilled />,
        color: 'success',
        btnText: 'Iniciar Ahora',
        desc: 'Al confirmar, la subasta se activará INMEDIATAMENTE. Los usuarios recibirán una notificación y podrán empezar a pujar.'
    };
    if (isActive) return {
        title: `Finalizar Subasta: ${lote.nombre_lote}`,
        icon: <StopCircle />,
        color: 'error',
        btnText: 'Finalizar Ahora',
        desc: 'Al confirmar, se cerrará la subasta y se determinará el ganador automáticamente.'
    };
    return { title: 'Subasta Finalizada', icon: <Gavel />, color: 'primary', btnText: 'Cerrar', desc: 'Esta subasta ya terminó.' };
  };

  const config = getModalConfig();

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={config.title}
      subtitle={`ID: ${lote.id}`}
      icon={config.icon}
      headerColor={config.color as any}
      confirmText={config.btnText}
      confirmButtonColor={config.color as any}
      onConfirm={isFinished ? undefined : handleConfirm}
      isLoading={isLoading}
      maxWidth="sm"
      hideConfirmButton={isFinished}
      cancelText="Cerrar"
    >
      <Stack spacing={2}>
        <Alert severity={config.color as any} variant="filled">{config.desc}</Alert>
        <Box bgcolor="background.paper" p={2} borderRadius={2} border="1px solid #eee">
             <Typography variant="caption" color="text.secondary" fontWeight={700}>PRECIO BASE</Typography>
             <Typography variant="h4" fontWeight={700}>${Number(lote.precio_base).toLocaleString()}</Typography>
        </Box>
      </Stack>
    </BaseModal>
  );
};

export default AuctionControlModal;