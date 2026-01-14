// src/components/common/StatCard/StatCard.tsx

import React from 'react';
// ✅ CORRECCIÓN: Se eliminó 'LinearProgress' de los imports
import { Paper, Box, Typography, Avatar, alpha, useTheme, Skeleton } from '@mui/material';

// Definimos los colores permitidos para asegurar que existan en el theme.palette
type StatColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color?: StatColor;
    loading?: boolean;
    onClick?: () => void;
    subtitle?: string; 
    trend?: {          
        value: number;
        isPositive?: boolean;
    };
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    color = 'primary',
    loading = false,
    onClick,
    subtitle,
    trend
}) => {
    const theme = useTheme();
    const paletteColor = theme.palette[color];

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: { xs: 2, sm: 2.5 }, 
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1.5, sm: 2 }, 
                borderRadius: { xs: 2, sm: 3 }, 
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                transition: 'all 0.2s ease-in-out',
                cursor: onClick ? 'pointer' : 'default',
                userSelect: 'none',
                position: 'relative', 
                overflow: 'hidden', 
                '&:hover': onClick ? {
                    borderColor: paletteColor.main,
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                    '&::before': {
                        opacity: 1
                    }
                } : {},
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(135deg, transparent 0%, ${alpha(paletteColor.main, 0.05)} 100%)`,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none'
                }
            }}
        >
            <Avatar
                variant="rounded"
                sx={{
                    bgcolor: alpha(paletteColor.main, 0.1),
                    color: paletteColor.main,
                    width: { xs: 48, sm: 56 }, 
                    height: { xs: 48, sm: 56 },
                    borderRadius: 2,
                    transition: 'transform 0.2s ease',
                    ...(onClick && {
                        '&:hover': {
                            transform: 'scale(1.1)'
                        }
                    })
                }}
            >
                {icon}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                {loading ? (
                    <Box sx={{ width: '100%' }}>
                        <Skeleton 
                            variant="text" 
                            width="60%" 
                            height={40} 
                            sx={{ mb: 0.5 }}
                        />
                        <Skeleton 
                            variant="text" 
                            width="80%" 
                            height={20} 
                        />
                    </Box>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            <Typography 
                                variant="h4" 
                                fontWeight={700} 
                                color="text.primary" 
                                sx={{ 
                                    lineHeight: 1.2,
                                    fontSize: { xs: '1.5rem', sm: '2rem' } 
                                }}
                            >
                                {value}
                            </Typography>
                            
                            {trend && (
                                <Typography
                                    variant="caption"
                                    fontWeight={700}
                                    sx={{
                                        color: trend.isPositive === false 
                                            ? 'error.main' 
                                            : 'success.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.25
                                    }}
                                >
                                    {trend.isPositive === false ? '↓' : '↑'} {Math.abs(trend.value)}%
                                </Typography>
                            )}
                        </Box>
                        
                        <Typography
                            variant="caption"
                            fontWeight={600}
                            color="text.secondary"
                            noWrap
                            sx={{ 
                                textTransform: 'uppercase', 
                                letterSpacing: 0.5,
                                display: 'block',
                                fontSize: { xs: '0.6875rem', sm: '0.75rem' } 
                            }}
                        >
                            {title}
                        </Typography>

                        {subtitle && (
                            <Typography
                                variant="caption"
                                color={paletteColor.main}
                                fontWeight={600}
                                sx={{ 
                                    display: 'block',
                                    mt: 0.5,
                                    fontSize: { xs: '0.6875rem', sm: '0.75rem' }
                                }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </>
                )}
            </Box>
        </Paper>
    );
};