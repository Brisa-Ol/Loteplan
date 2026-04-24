// src/features/client/pages/Lotes/modals/InfoTokensModal.tsx

import {
    AddCircleOutline, // <-- Nuevo ícono importado
    Gavel,
    ReplayCircleFilled,
    TokenOutlined,
} from '@mui/icons-material';
import {
    alpha,
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    useTheme
} from '@mui/material';
import React from 'react';

import { BaseModal } from '@/shared/components/domain/modals/BaseModal';

interface Props {
    open: boolean;
    onClose: () => void;
}

export const InfoTokensModal: React.FC<Props> = ({ open, onClose }) => {
    const theme = useTheme();

    return (
        <BaseModal
            open={open}
            onClose={onClose}
            title="¿Cómo funcionan las pujas y tokens?"
            headerColor="primary"
        >
            <Box sx={{ p: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Para mantener un proceso justo y ordenado, utilizamos un sistema de tokens para participar en las subastas.
                </Typography>

                <List sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
                    {/* Item 1: Uso del Token */}
                    <ListItem
                        sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: 2,
                            alignItems: 'flex-start',
                            p: 2,
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                            <TokenOutlined color="primary" />
                        </ListItemIcon>
                        <ListItemText
                            primary={<Typography fontWeight={800}>1. Tu primera oferta</Typography>}
                            secondary="Necesitás 1 token disponible para realizar tu primera oferta en cualquier lote. Al confirmar, el token quedará reservado en esa puja."
                        />
                    </ListItem>

                    {/* Item 2: Defender la oferta */}
                    <ListItem
                        sx={{
                            bgcolor: alpha(theme.palette.warning.main, 0.05),
                            borderRadius: 2,
                            alignItems: 'flex-start',
                            p: 2,
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                            <Gavel color="warning" />
                        </ListItemIcon>
                        <ListItemText
                            primary={<Typography fontWeight={800}>2. Mejorar tu oferta es gratis</Typography>}
                            secondary="Si alguien supera tu monto, podés volver a ofertar en ese mismo lote para recuperar el liderazgo sin necesidad de gastar tokens adicionales."
                        />
                    </ListItem>

                    {/* Item 3: Devolución */}
                    <ListItem
                        sx={{
                            bgcolor: alpha(theme.palette.success.main, 0.05),
                            borderRadius: 2,
                            alignItems: 'flex-start',
                            p: 2,
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                            <ReplayCircleFilled color="success" />
                        </ListItemIcon>
                        <ListItemText
                            primary={<Typography fontWeight={800}>3. Devolución garantizada</Typography>}
                            secondary="Si retirás tu puja o la subasta finaliza y no resultás ganador, tu token se devuelve automáticamente para que puedas usarlo en otro lote del proyecto."
                        />
                    </ListItem>

                    {/* Item 4: Múltiples suscripciones */}
                    <ListItem
                        sx={{
                            bgcolor: alpha(theme.palette.info.main, 0.05),
                            borderRadius: 2,
                            alignItems: 'flex-start',
                            p: 2,
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                            <AddCircleOutline color="info" />
                        </ListItemIcon>
                        <ListItemText
                            primary={<Typography fontWeight={800}>4. Ofertar en múltiples lotes</Typography>}
                            secondary={
                                <React.Fragment>
                                    Si deseás participar por más de un lote a la vez, podés volver a suscribirte al proyecto para obtener un nuevo token.
                                    <Typography component="span" variant="body2" fontWeight={700} display="block" sx={{ mt: 0.5 }}>
                                        Importante: Esto generará una nueva suscripción en paralelo, por lo que tendrás dos suscripciones activas al mismo tiempo.
                                    </Typography>
                                </React.Fragment>
                            }
                        />
                    </ListItem>
                </List>


            </Box>
        </BaseModal>
    );
};