// src/components/common/SectionTitle/SectionTitle.tsx

import { Box, Typography, type TypographyProps, type TypographyVariant, keyframes, useTheme } from "@mui/material";
import React from "react";

const expandLine = keyframes`
  from { width: 0; opacity: 0; }
  to { width: 100%; opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface SectionTitleProps extends Omit<TypographyProps, 'align' | 'variant'> {
    children: React.ReactNode;
    subtitle?: string;
    align?: "left" | "center" | "right";
    variant?: TypographyVariant;
    lineWidth?: number | string;
    lineColor?: string;
    useGradient?: boolean;
    component?: React.ElementType;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
    children,
    subtitle,
    align = "center",
    variant = "h2",
    component,
    lineWidth = 80,
    lineColor = "secondary.main",
    useGradient = false,
    sx,
    ...rest
}) => {
    const theme = useTheme();

    const mapVariantToTag = (v: string): React.ElementType => {
        const validTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        return validTags.includes(v) ? (v as React.ElementType) : 'h2';
    };

    const semanticTag = component || mapVariantToTag(variant);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
                // Corregido: El margen suele aumentar en pantallas grandes, no disminuir
                mb: { xs: 2, md: 3 },
                textAlign: align,
                ...sx
            }}
        >
            <Typography
                variant={variant}
                component={semanticTag}
                sx={{
                    fontWeight: 700,
                    color: "primary.main",
                    position: "relative",
                    pb: 1.5,
                    mb: subtitle ? 1 : 0,
                    display: 'inline-block', // Asegura que la línea no mida más que el texto si no quieres
                }}
                {...rest}
            >
                {children}

                {/* Línea Decorativa Dinámica */}
                <Box
                    component="span"
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        left: align === "center" ? "50%" : align === "right" ? "100%" : 0,
                        transform: align === "center" ? "translateX(-50%)" : align === "right" ? "translateX(-100%)" : "none",
                        height: 4,
                        width: lineWidth,
                        maxWidth: '100%',
                        borderRadius: 2,
                        // ✅ Ahora usa el color del theme automáticamente
                        background: useGradient
                            ? `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`
                            : (t) => {
                                const parts = lineColor.split('.');
                                return parts.length === 2
                                    ? (t.palette as any)[parts[0]]?.[parts[1]]
                                    : lineColor;
                            },
                        animation: `${expandLine} 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                    }}
                />
            </Typography>

            {subtitle && (
                <Typography
                    variant="body1" // Cambiado de h5 a body1 para mejor jerarquía visual
                    color="text.secondary"
                    sx={{
                        maxWidth: 'md',
                        lineHeight: 1.6,
                        fontWeight: 400,
                        mt: 1,
                        opacity: 0,
                        animation: `${fadeIn} 0.5s ease-out 0.3s forwards`,
                    }}
                >
                    {subtitle}
                </Typography>
            )}
        </Box>
    );
};