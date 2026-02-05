import {
    Business,
    EmojiEvents,
    Handshake,
    VerifiedUser,
} from '@mui/icons-material';
import {
    alpha,
    Avatar,
    Box,
    Card,
    CardContent,
    Container,
    Paper,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import React from 'react';

const Nosotros: React.FC = () => {
    const theme = useTheme();

    const values = [
        {
            icon: VerifiedUser,
            title: 'Transparencia',
            description:
                'Toda la información es clara y accesible. Sin letras chicas ni sorpresas. Sabés exactamente dónde está tu dinero.',
        },
        {
            icon: Handshake,
            title: 'Colaboración',
            description:
                'Creemos en el poder de las personas unidas. Juntos logramos objetivos que individualmente serían imposibles.',
        },
        {
            icon: Business,
            title: 'Seguridad Jurídica',
            description:
                'Todos los proyectos están respaldados por fideicomiso y escritura pública, garantizando tu tranquilidad.',
        },
        {
            icon: EmojiEvents,
            title: 'Compromiso',
            description:
                'Trabajamos cada día para que más familias accedan a su terreno propio y los inversores maximicen sus retornos.',
        },
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* ==========================================
                 HERO SECTION
            ========================================== */}
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: 'primary.contrastText',
                    py: { xs: 10, md: 12 },
                    textAlign: 'center',
                    mb: 10,
                    // Aplicamos los bordes redondeados del estilo global
                    borderBottomLeftRadius: { xs: 24, md: 48 },
                    borderBottomRightRadius: { xs: 24, md: 48 },
                    boxShadow: theme.shadows[4]
                }}
            >
                <Container maxWidth="lg">
                    {/* h1 según typography del theme (2.25rem) */}
                    <Typography variant="h1" gutterBottom sx={{ color: 'white' }}>
                        Acerca de Nosotros
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            maxWidth: 'md',
                            mx: 'auto',
                            opacity: 0.9,
                            fontWeight: 400,
                            lineHeight: 1.7
                        }}
                    >
                        Conocé más sobre quiénes somos y qué nos impulsa a transformar el mercado inmobiliario.
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ pb: 14 }}>
                {/* ==========================================
                    NUESTRA HISTORIA
                ========================================== */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 5, md: 7 },
                        mb: 10,
                        bgcolor: 'secondary.light', // #F6F6F6 del theme
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2, // 16px (2 * 8px)
                    }}
                >
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={7} alignItems="center">
                        <Box flex={1}>
                            <Typography
                                variant="overline"
                                color="primary"
                                sx={{ display: 'block', mb: 1, fontWeight: 700, letterSpacing: 1.5 }}
                            >
                                NUESTRO ORIGEN
                            </Typography>
                            {/* h2 según typography (1.875rem) */}
                            <Typography variant="h2" gutterBottom sx={{ mb: 4, mt: 1 }} color="text.primary">
                                Democratizando el acceso a la tierra
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mb: 3, fontSize: '1.1rem' }}
                            >
                                Loteplan nace de la visión de democratizar el acceso a la tierra urbanizada, haciendo
                                posible que cualquier persona, sin importar si es un gran inversor o una familia buscando su primer hogar,
                                pueda participar en el mercado inmobiliario.
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ fontSize: '1.1rem' }}
                            >
                                Entendimos que la unión hace la fuerza. Al agrupar a ahorristas e inversores mediante tecnología,
                                eliminamos las barreras de entrada tradicionales, bajamos los costos y generamos valor real y tangible para todos los involucrados.
                            </Typography>
                        </Box>

                        <Box flex={1} sx={{ width: '100%' }}>
                            <Box
                                component="img"
                                src="/nosotros/Nosotros_2a.jpg"
                                alt="Equipo Loteplan"
                                sx={{
                                    width: '100%',
                                    borderRadius: 2,
                                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'
                                }}
                            />
                        </Box>
                    </Stack>
                </Paper>

                {/* ==========================================
                    NUESTROS VALORES
                ========================================== */}
                <Box sx={{ mb: 10 }}>
                    {/* h3 según typography (1.5rem) */}
                    <Typography
                        variant="h3"
                        textAlign="center"
                        gutterBottom
                        sx={{ mb: 8 }}
                        color="text.primary"
                    >
                        Nuestros Valores
                    </Typography>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                            gap: 4,
                        }}
                    >
                        {values.map((value, index) => (
                            <Card
                                key={index}
                                sx={{
                                    height: '100%',
                                    // El estilo global de MuiCard ya maneja borderRadius, sombras y hover
                                    border: `1px solid ${theme.palette.divider}`,
                                    bgcolor: 'background.paper'
                                }}
                            >
                                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                    <Avatar
                                        sx={{
                                            width: 64,
                                            height: 64,
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            color: 'primary.main',
                                            mx: 'auto',
                                            mb: 3,
                                        }}
                                    >
                                        <value.icon fontSize="large" />
                                    </Avatar>
                                    <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                                        {value.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                        {value.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Box>

                {/* ==========================================
                    ESTADÍSTICAS / CIERRE
                ========================================== */}
                <Box
                    sx={{
                        py: 8,
                        px: 5,
                        borderRadius: 2,
                        // Degradado sutil con colores secundarios del theme
                        background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
                        border: `1px solid ${theme.palette.divider}`,
                        textAlign: 'center',
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={7}
                        justifyContent="center"
                        alignItems="center"
                        divider={
                            <Box
                                sx={{
                                    width: { xs: '60px', md: '1px' },
                                    height: { xs: '1px', md: '60px' },
                                    bgcolor: 'divider'
                                }}
                            />
                        }
                    >
                        <Box>
                            <Typography variant="h2" color="primary.main">
                                +400
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={600} color="text.secondary" sx={{ mt: 1 }}>
                                Hectáreas desarrolladas
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="h2" color="primary.main">
                                +15%
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={600} color="text.secondary" sx={{ mt: 1 }}>
                                Rentabilidad anual promedio
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="h2" color="primary.main">
                                100%
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={600} color="text.secondary" sx={{ mt: 1 }}>
                                Seguridad Jurídica
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
};

export default Nosotros;