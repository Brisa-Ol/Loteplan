// src/components/common/StatCard/StatCard.tsx

import React from 'react';
import { Paper, Box, Typography, LinearProgress, Avatar, alpha, useTheme } from '@mui/material';

// Definimos los colores permitidos para asegurar que existan en el theme.palette
type StatColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color?: StatColor;
    loading?: boolean;
    onClick?: () => void; // ✅ Agregado para permitir navegación
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    color = 'primary',
    loading = false,
    onClick
}) => {
    const theme = useTheme();
    const paletteColor = theme.palette[color];

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                transition: 'all 0.2s ease-in-out',
                cursor: onClick ? 'pointer' : 'default', // ✅ Cursor interactivo si hay onClick
                userSelect: 'none',
                '&:hover': onClick ? {
                    borderColor: paletteColor.main,
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4]
                } : {},
            }}
        >
            <Avatar
                variant="rounded"
                sx={{
                    bgcolor: alpha(paletteColor.main, 0.1),
                    color: paletteColor.main,
                    width: 56,
                    height: 56,
                    borderRadius: 2
                }}
            >
                {icon}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                {loading ? (
                    <Box sx={{ width: '100%', py: 1 }}>
                        <LinearProgress color={color} sx={{ borderRadius: 1, height: 6 }} />
                    </Box>
                ) : (
                    <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                        {value}
                    </Typography>
                )}
                
                <Typography
                    variant="caption"
                    fontWeight={600}
                    color="text.secondary"
                    noWrap // ✅ Evita que el título rompa el layout
                    sx={{ 
                        textTransform: 'uppercase', 
                        letterSpacing: 0.5,
                        display: 'block' 
                    }}
                >
                    {title}
                </Typography>
            </Box>
        </Paper>
    );
};