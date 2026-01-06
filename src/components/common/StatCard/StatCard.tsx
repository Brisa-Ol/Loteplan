import React from 'react';
import { Paper, Box, Typography, LinearProgress, Avatar, alpha, useTheme } from '@mui/material';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    color = 'primary',
    loading = false
}) => {
    const theme = useTheme();
    const paletteColor = theme.palette[color];

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: paletteColor.main,
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[2]
                }
            }}
        >
            <Avatar
                variant="rounded"
                sx={{
                    bgcolor: alpha(paletteColor.main, 0.1),
                    color: paletteColor.main,
                    width: 48,
                    height: 48
                }}
            >
                {icon}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                {loading ? (
                    <Box sx={{ width: '100%', py: 1 }}>
                        <LinearProgress color={color} sx={{ borderRadius: 1 }} />
                    </Box>
                ) : (
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                        {value}
                    </Typography>
                )}
                <Typography
                    variant="caption"
                    fontWeight={600}
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                    {title}
                </Typography>
            </Box>
        </Paper>
    );
};