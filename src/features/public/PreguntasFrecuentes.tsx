import {
    ContactSupport,
    ExpandMore,
    Gavel,
    HelpOutline,
    HomeWork,
    TrendingUp
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    alpha,
    Box,
    Container,
    Paper,
    Stack,
    Typography,
    useTheme
} from '@mui/material';
import React, { useState } from 'react';

// ==========================================
// DATOS DE LAS PREGUNTAS FRECUENTES
// ==========================================
const faqCategories = [
    {
        id: 'general',
        title: 'Conceptos Generales',
        icon: HelpOutline,
        faqs: [
            {
                question: '¿Qué es exactamente Loteplan?',
                answer: 'Somos una plataforma que organiza capital de forma colaborativa bajo una estructura de fideicomiso. Permitimos que personas accedan a su propio terreno en cuotas (Modo Ahorrista) o participen en el negocio inmobiliario comprando fracciones de tierra para obtener rentabilidad (Modo Inversionista).'
            },
            {
                question: '¿Cuáles son los pasos para empezar a pagar mi lote?',
                answer: 'El proceso de suscripción está diseñado para ser claro y ordenado. Primero se requiere realizar un pago inicial en concepto de adhesión al fideicomiso. Una vez que este pago se confirma y formás parte del grupo, se te habilitará en la plataforma la opción para realizar la selección y el pago de tus cuotas iniciales.'
            },
            {
                question: '¿Tienen costos ocultos o comisiones abusivas?',
                answer: 'No. La transparencia es nuestro pilar. Todos los cargos administrativos fiduciarios están detallados desde el inicio y, para garantizar la equidad, se calculan en base al valor mensual del plan y no sobre el valor total del lote o proyecto.'
            }
        ]
    },
    {
        id: 'ahorrista',
        title: 'Modo Ahorrista',
        icon: HomeWork,
        faqs: [
            {
                question: '¿Cómo se actualiza el valor de las cuotas?',
                answer: 'Para mantener el equilibrio del sistema sin cobrar intereses bancarios, las cuotas se actualizan periódicamente acompañando el Índice de la Cámara Argentina de la Construcción (CAC). Esto asegura que el capital del grupo mantenga su poder adquisitivo para la compra y desarrollo de la tierra.'
            },
            {
                question: '¿Cómo funciona la subasta para tener mi terreno antes de tiempo?',
                answer: 'A partir de la cuota 12, abrimos rondas de adjudicación. Podés ofertar un adelanto de capital en la plataforma; quien hace la mejor oferta, se adjudica el lote. Todo el dinero adelantado en la puja ganadora se aplica automáticamente para cancelar tus cuotas futuras.'
            },
            {
                question: '¿El lote que adquiero se puede escriturar?',
                answer: 'Absolutamente. Todos los proyectos que ingresan a la infraestructura de Loteplan cuentan con viabilidad legal y técnica rigurosa para ser 100% escriturables una vez finalizado el pago de tu plan y los trámites de subdivisión correspondientes.'
            }
        ]
    },
    {
        id: 'inversionista',
        title: 'Modo Inversionista',
        icon: TrendingUp,
        faqs: [
            {
                question: '¿Cuándo y cómo recupero mi inversión más las ganancias?',
                answer: 'Los retornos se distribuyen a medida que los lotes del proyecto son comercializados, adjudicados y pagados por el grupo ahorrista. Es un esquema de entrada y salida planificada con trazabilidad digital en cada etapa.'
            },
            {
                question: '¿La rentabilidad está garantizada?',
                answer: 'En el mercado inmobiliario real no existen rendimientos fijos garantizados por ley, pero sí proyecciones sólidas basadas en el valor histórico de la tierra. Tu dinero está respaldado en un activo físico real (la tierra urbanizada), lo que mitiga enormemente la volatilidad frente a inversiones puramente financieras.'
            }
        ]
    },
    {
        id: 'seguridad',
        title: 'Seguridad y Fideicomiso',
        icon: Gavel,
        faqs: [
            {
                question: '¿Qué es un Fideicomiso y cómo protege mi plata?',
                answer: 'Es una herramienta legal que crea un "patrimonio separado". Esto significa que la tierra y el dinero aportado no pertenecen al patrimonio de Loteplan, sino al Fideicomiso. Se administran de forma exclusiva e inembargable para cumplir el objetivo del proyecto.'
            },
            {
                question: '¿Qué pasa si la administradora tiene problemas financieros?',
                answer: 'Gracias a la figura jurídica del fideicomiso, tu capital y los terrenos están completamente blindados. El patrimonio del fideicomiso es independiente del patrimonio de la empresa administradora. En un caso extremo, simplemente se designaría a un nuevo administrador fiduciario y el proyecto continuaría su curso normal.'
            }
        ]
    }
];

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const PreguntasFrecuentes: React.FC = () => {
    const theme = useTheme();

    // Estado para controlar qué acordeón está abierto. 
    // 'false' significa que permite abrir múltiples a la vez. Si querés que se cierre uno al abrir otro, 
    // podés guardar el ID del panel activo en este estado.
    const [expandedPanel, setExpandedPanel] = useState<string | false>(false);

    const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedPanel(isExpanded ? panel : false);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

            {/* ==========================================
          HERO SECTION
          ========================================== */}
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: 'primary.contrastText',
                    position: 'relative',
                    overflow: 'hidden',
                    py: { xs: 8, md: 12 },
                    textAlign: 'center',
                    borderBottomLeftRadius: { xs: 24, md: 48 },
                    borderBottomRightRadius: { xs: 24, md: 48 },
                    boxShadow: `0 10px 30px ${alpha(theme.palette.primary.dark, 0.3)}`,
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.1,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />

                <Container maxWidth="md" sx={{ position: 'relative' }}>
                    <Typography variant="h3" component="h1" fontWeight={800} gutterBottom>
                        Preguntas Frecuentes
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            maxWidth: 700,
                            mx: 'auto',
                            color: alpha(theme.palette.common.white, 0.9),
                            fontWeight: 400,
                            lineHeight: 1.6,
                            mt: 2,
                        }}
                    >
                        Resolvemos todas tus dudas sobre cómo funciona nuestro modelo colaborativo, el respaldo fiduciario y los procesos de inversión.
                    </Typography>
                </Container>
            </Box>

            {/* ==========================================
          CONTENIDO FAQ
          ========================================== */}
            <Container maxWidth="md" sx={{ py: { xs: 8, md: 10 }, mt: -4 }}>
                <Stack spacing={6}>
                    {faqCategories.map((category) => (
                        <Box key={category.id}>

                            {/* Título de Categoría */}
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3, px: 1 }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: 'primary.main',
                                    }}
                                >
                                    <category.icon />
                                </Box>
                                <Typography variant="h5" fontWeight={700} color="text.primary">
                                    {category.title}
                                </Typography>
                            </Stack>

                            {/* Acordeones */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {category.faqs.map((faq, index) => {
                                    const panelId = `panel-${category.id}-${index}`;
                                    return (
                                        <Accordion
                                            key={panelId}
                                            expanded={expandedPanel === panelId}
                                            onChange={handleChange(panelId)}
                                            elevation={0}
                                            sx={{
                                                border: `1px solid ${theme.palette.divider}`,
                                                borderRadius: '12px !important',
                                                '&:before': { display: 'none' }, // Quita la línea separadora por defecto de MUI
                                                transition: 'all 0.2s ease',
                                                '&.Mui-expanded': {
                                                    borderColor: 'primary.main',
                                                    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                                                },
                                            }}
                                        >
                                            <AccordionSummary
                                                expandIcon={<ExpandMore color={expandedPanel === panelId ? "primary" : "action"} />}
                                                sx={{
                                                    py: 1,
                                                    '& .MuiAccordionSummary-content': { my: 1.5 },
                                                }}
                                            >
                                                <Typography
                                                    variant="subtitle1"
                                                    fontWeight={600}
                                                    color={expandedPanel === panelId ? 'primary.main' : 'text.primary'}
                                                >
                                                    {faq.question}
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ pt: 0, pb: 3, px: 3 }}>
                                                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                                    {faq.answer}
                                                </Typography>
                                            </AccordionDetails>
                                        </Accordion>
                                    );
                                })}
                            </Box>
                        </Box>
                    ))}

                    {/* ==========================================
              SECCIÓN DE CONTACTO
              ========================================== */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 4, md: 5 },
                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                            border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                            borderRadius: 4,
                            textAlign: 'center',
                            mt: 8,
                        }}
                    >
                        <ContactSupport sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
                            ¿Aún tenés dudas?
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                            Nuestro equipo de asesores está disponible para explicarte en detalle los procesos y ayudarte a dar el primer paso.
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyItems="center" justifyContent="center">
                            <Typography variant="h6" color="primary.main" fontWeight={700}>
                                info@loteplan.com
                            </Typography>
                            <Typography variant="h6" color="text.disabled" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                |
                            </Typography>
                            <Typography variant="h6" color="primary.main" fontWeight={700}>
                                +54 11 1234-5678
                            </Typography>
                        </Stack>
                    </Paper>

                </Stack>
            </Container>
        </Box>
    );
};

export default PreguntasFrecuentes;