import {
  Close as CloseIcon,
  Description as ContractIcon,
  Edit as EditIcon,
  Inventory2 as InventoryIcon,
  UploadFile as UploadIcon
} from '@mui/icons-material';
import {
  Avatar, Box,
  Button,
  CircularProgress,
  Dialog, DialogContent, DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  alpha, useTheme
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useNavigate } from 'react-router-dom';


import ContratoPlantillaService from '../../../../../core/api/services/contrato-plantilla.service';
import type { ProyectoDto } from '../../../../../core/types/dto/proyecto.dto';
import ProyectoLotesManager from '../components/ProyectoLotesManager';

interface ProjectLotesModalProps {
  open: boolean;
  onClose: () => void;
  proyecto: ProyectoDto | null;
}

const ProjectLotesModal: React.FC<ProjectLotesModalProps> = ({ open, onClose, proyecto }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Query para la plantilla de contrato (esto no lo cubre el Manager de Lotes)
  const { data: plantillaAsignada, isLoading: isLoadingContrato } = useQuery({
    queryKey: ['adminPlantillas', proyecto?.id],
    queryFn: async () => (await ContratoPlantillaService.findAll()).data,
    enabled: open && !!proyecto,
    select: (allPlantillas) => allPlantillas.find(p => p.id_proyecto === proyecto?.id) || null,
  });

  if (!proyecto) return null;

  const handleGestionarContrato = () => {
    navigate(`/admin/plantillas?proyecto=${proyecto.id}`);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar variant="rounded" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <InventoryIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800}>{proyecto.nombre_proyecto}</Typography>
            <Typography variant="caption" color="text.secondary">Panel de Control de Unidades</Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
        <Stack spacing={0}>

          {/* SECCIÓN DE CONTRATO BASE (Informativa y de Acción) */}
          <Box sx={{ p: 3, pb: 0 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: plantillaAsignada ? 'success.light' : 'warning.light',
                bgcolor: plantillaAsignada ? alpha(theme.palette.success.main, 0.02) : alpha(theme.palette.warning.main, 0.02),
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <ContractIcon color={plantillaAsignada ? "success" : "warning"} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>CONTRATO MARCO</Typography>
                  {isLoadingContrato ? (
                    <CircularProgress size={12} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {plantillaAsignada ? `Asignado: ${plantillaAsignada.nombre_archivo}` : "No hay una plantilla de contrato vinculada a este proyecto"}
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Button
                size="small"
                variant="outlined"
                color={plantillaAsignada ? "primary" : "warning"}
                startIcon={plantillaAsignada ? <EditIcon /> : <UploadIcon />}
                onClick={handleGestionarContrato}
              >
                {plantillaAsignada ? "Cambiar Plantilla" : "Vincular Contrato"}
              </Button>
            </Paper>
          </Box>

          {/* RENDER DEL MANAGER PROFESIONAL */}
          <Box sx={{ py: 1 }}>
            <ProyectoLotesManager
              proyecto={proyecto}
              onAssignLotes={() => navigate(`/admin/lotes?proyecto=${proyecto.id}`)}
            />
          </Box>

        </Stack>
      </DialogContent>

      <Divider />

      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', bgcolor: 'background.paper' }}>
        <Button onClick={onClose} variant="contained" sx={{ px: 4, borderRadius: 2 }}>
          Cerrar Panel
        </Button>
      </Box>
    </Dialog>
  );
};

export default ProjectLotesModal;