// src/pages/public/CentroAyuda.tsx

import {
	AccountBalance,
	Assignment,
	ContactSupport,
	ExpandMore,
	Gavel,
	HelpOutline,
	Home,
	MonetizationOn,
	Payment,
	Security,
} from "@mui/icons-material";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	alpha,
	Avatar,
	Box,
	Card,
	CardContent,
	Chip,
	Container,
	Divider,
	Paper,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import React, { useState } from "react";

// ==========================================
// TIPOS
// ==========================================
interface FAQItem {
	question: string;
	answer: string;
}

interface FAQCategory {
	label: string;
	icon: React.ElementType;
	color: "primary" | "secondary" | "warning" | "error" | "info" | "success";
	items: FAQItem[];
}

// ==========================================
// DATOS
// ==========================================
const faqCategories: FAQCategory[] = [
	{
		label: "Cuenta y Registro",
		icon: Security,
		color: "primary",
		items: [
			{
				question: "¿Cómo me registro en Loteplan?",
				answer:
					'Podés registrarte desde la página de inicio haciendo clic en "Crear mi cuenta". Necesitás un email válido, una contraseña segura y completar el proceso de verificación de identidad (KYC) para operar.',
			},
			{
				question: "¿Qué es la verificación de identidad (KYC)?",
				answer:
					"KYC (Know Your Customer) es un proceso obligatorio que nos permite verificar tu identidad. Consiste en subir una foto de tu DNI (frente y dorso) y un selfie. Es requerido para poder suscribirte a proyectos e invertir.",
			},
			{
				question: "¿Qué es la autenticación de dos factores (2FA)?",
				answer:
					"Es una capa adicional de seguridad. Una vez activada, al iniciar sesión o realizar operaciones sensibles, el sistema te pedirá un código de 6 dígitos generado por una app autenticadora (como Google Authenticator o Authy). Es altamente recomendada y requerida para ciertas operaciones.",
			},
			{
				question: "¿Puedo cambiar mi email o contraseña?",
				answer:
					'Sí. Desde tu perfil en "Mi Cuenta" podés actualizar tu contraseña en cualquier momento. Para cambiar el email, contactá a nuestro equipo de soporte por razones de seguridad.',
			},
		],
	},
	{
		label: "Suscripciones y Proyectos",
		icon: Home,
		color: "info",
		items: [
			{
				question: "¿Cómo me suscribo a un proyecto?",
				answer:
					'Explorá los proyectos disponibles, elegí el que mejor se adapta a tus objetivos y hacé clic en "Suscribirse". El proceso incluye revisar el contrato, abonar la cuota de adhesión y firmar digitalmente el contrato.',
			},
			{
				question: "¿Qué es la cuota de adhesión?",
				answer:
					"Es el pago inicial para ingresar al proyecto. Representa un porcentaje del valor móvil del lote y puede abonarse en un pago único o en cuotas (3 o 6), según las opciones disponibles.",
			},
			{
				question:
					"¿Puedo suscribirme a más de un proyecto o tener más de una suscripción?",
				answer:
					"Sí. Podés tener múltiples suscripciones activas, incluso en el mismo proyecto. Cada suscripción genera un Token de Puja independiente para participar en subastas.",
			},
			{
				question: "¿Qué pasa si quiero cancelar mi suscripción?",
				answer:
					'Podés solicitar la baja desde "Mi Cuenta > Mis Suscripciones". La cancelación requiere confirmar con tu código 2FA y especificar un motivo. Se aplican las condiciones estipuladas en el contrato.',
			},
		],
	},
	{
		label: "Pagos y Cuotas",
		icon: Payment,
		color: "success",
		items: [
			{
				question: "¿Cómo se calculan las cuotas mensuales?",
				answer:
					"Las cuotas se calculan en base a un insumo de referencia (como el precio de la bolsa de cemento), multiplicado por una cantidad de unidades y ajustado por porcentajes de capital, administración e IVA. Este sistema protege el valor real de tu inversión frente a la inflación.",
			},
			{
				question: "¿Qué medios de pago se aceptan?",
				answer:
					"Los pagos se procesan a través de Mercado Pago, que admite tarjetas de crédito, débito y transferencia bancaria. Al confirmar una operación, serás redirigido al portal de pago seguro.",
			},
			{
				question: "¿Qué sucede si no pago una cuota a tiempo?",
				answer:
					'Si no abonás en el plazo estipulado, tu suscripción puede quedar en estado "mora". Te recomendamos estar al día ya que afecta tu capacidad de participar en subastas. Contactá a soporte si tenés inconvenientes.',
			},
			{
				question: "¿Dónde veo el historial de mis pagos?",
				answer:
					'En "Mi Cuenta > Mi Billetera" encontrás el historial completo de pagos, cuotas pendientes, y el estado de cada transacción.',
			},
		],
	},
	{
		label: "Contratos y Firma Digital",
		icon: Assignment,
		color: "warning",
		items: [
			{
				question: "¿Qué es la firma digital y tiene validez legal?",
				answer:
					"Sí. La firma digital realizada en nuestra plataforma tiene plena validez legal bajo la normativa argentina. El contrato firmado queda registrado con un hash criptográfico, tu geolocalización al momento de la firma y verificación de identidad mediante 2FA.",
			},
			{
				question: "¿Cómo firmo mi contrato?",
				answer:
					'Durante el proceso de suscripción, en el paso "Firma", podés dibujar tu firma sobre el contrato y posicionarla en el espacio de firma. Luego confirmás con tu código 2FA. El contrato firmado queda disponible para descargar en cualquier momento.',
			},
			{
				question: "¿Puedo ver el borrador del contrato antes de firmar?",
				answer:
					'Sí. En la página de detalle del proyecto, dentro del sidebar, encontrás el botón "Ver borrador del contrato" que te permite revisar el documento completo antes de comprometerte.',
			},
			{
				question: "¿Dónde descargo mi contrato firmado?",
				answer:
					'Desde la página del proyecto o en "Mi Cuenta > Mis Contratos". Si tenés múltiples suscripciones, podés acceder a cada contrato individualmente.',
			},
		],
	},
	{
		label: "Subastas y Tokens",
		icon: Gavel,
		color: "error",
		items: [
			{
				question: "¿Qué es un Token de Puja?",
				answer:
					"Es el derecho de participación en las subastas. Cada suscripción activa te otorga 1 Token de Puja. Si perdés la subasta, el token se devuelve automáticamente para que puedas participar en la siguiente.",
			},
			{
				question: "¿Cuándo puedo participar en subastas?",
				answer:
					'A partir de que se pague completamente la adhesion podés participar en las subastas de adjudicación anticipada del proyecto. Las subastas se realizan mensualmente y podés seguirlas en tiempo real desde la sección "Lotes y Subastas" del proyecto.',
			},
			{
				question:
					"¿Qué pasa si gano una subasta con una oferta mayor al precio base?",
				answer:
					"El excedente ofertado por sobre el precio base se aplica automáticamente a cancelar tus cuotas futuras, reduciendo el tiempo total de tu plan de ahorro.",
			},
		],
	},
	{
		label: "Seguridad y Patrimonio",
		icon: AccountBalance,
		color: "primary",
		items: [
			{
				question: "¿Qué es el fideicomiso y cómo protege mi dinero?",
				answer:
					"El fideicomiso es una figura legal que separa patrimonialmente los fondos de los inversores del patrimonio de Loteplan. Esto significa que, ante cualquier eventualidad, los activos del fideicomiso están protegidos y destinados exclusivamente a los beneficiarios del proyecto.",
			},
			{
				question: "¿Los lotes son reales y escriturables?",
				answer:
					"Sí. Todos los proyectos en Loteplan corresponden a tierras físicas urbanizadas con habilitación municipal y posibilidad de escrituración. No operamos con lotes futuros ni en desarrollo pendiente de aprobación.",
			},
			{
				question: "¿Cómo sé que la plataforma es segura?",
				answer:
					"Utilizamos cifrado SSL, almacenamiento seguro de datos, autenticación de dos factores y procesamiento de pagos a través de Mercado Pago, una de las plataformas más seguras de Latinoamérica. Todos los contratos llevan hash criptográfico para garantizar su integridad.",
			},
		],
	},
];

const contactChannels = [
	{
		icon: ContactSupport,
		title: "Soporte por Email",
		description: "Respondemos en menos de 24 horas hábiles.",
		value: "soporte@loteplan.com",
		color: "primary" as const,
	},
	{
		icon: MonetizationOn,
		title: "Consultas Comerciales",
		description: "Para consultas sobre proyectos e inversiones.",
		value: "ventas@loteplan.com",
		color: "success" as const,
	},
	{
		icon: HelpOutline,
		title: "Ayuda Urgente",
		description: "Lunes a viernes de 9 a 18 hs.",
		value: "+54 11 1234-5678",
		color: "warning" as const,
	},
];

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const CentroAyuda: React.FC = () => {
	const theme = useTheme();
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<string | false>(false);

	const handleAccordion =
		(panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
			setExpanded(isExpanded ? panel : false);
		};

	const filteredCategories = activeCategory
		? faqCategories.filter((c) => c.label === activeCategory)
		: faqCategories;

	return (
		<Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
			{/* Hero */}
			<Box
				sx={{
					background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
					color: "white",
					py: { xs: 10, md: 12 },
					textAlign: "center",
					borderBottomLeftRadius: { xs: 24, md: 48 },
					borderBottomRightRadius: { xs: 24, md: 48 },
					boxShadow: `0 10px 30px ${alpha(theme.palette.primary.dark, 0.3)}`,
				}}
			>
				<Container maxWidth="lg">
					<Avatar
						sx={{
							width: 72,
							height: 72,
							bgcolor: alpha(theme.palette.common.white, 0.2),
							color: "white",
							mx: "auto",
							mb: 3,
						}}
					>
						<HelpOutline sx={{ fontSize: 36 }} />
					</Avatar>
					<Typography variant="h3" component="h1" fontWeight={800} gutterBottom>
						Centro de Ayuda
					</Typography>
					<Typography
						variant="h6"
						sx={{
							maxWidth: 600,
							mx: "auto",
							opacity: 0.85,
							fontWeight: 400,
							lineHeight: 1.6,
						}}
					>
						Encontrá respuestas a las preguntas más frecuentes sobre nuestra
						plataforma.
					</Typography>
				</Container>
			</Box>

			<Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, pb: 14 }}>
				{/* Filtros de categoría */}
				<Box sx={{ mb: 6 }}>
					<Typography
						variant="subtitle2"
						color="text.secondary"
						fontWeight={700}
						sx={{ mb: 2, textTransform: "uppercase", letterSpacing: 1 }}
					>
						Filtrar por categoría
					</Typography>
					<Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
						<Chip
							label="Todas"
							onClick={() => setActiveCategory(null)}
							color={activeCategory === null ? "primary" : "default"}
							variant={activeCategory === null ? "filled" : "outlined"}
							sx={{ fontWeight: 700 }}
						/>
						{faqCategories.map((cat) => (
							<Chip
								key={cat.label}
								label={cat.label}
								icon={<cat.icon style={{ fontSize: 16 }} />}
								onClick={() =>
									setActiveCategory(activeCategory === cat.label ? null : cat.label)
								}
								color={activeCategory === cat.label ? cat.color : "default"}
								variant={activeCategory === cat.label ? "filled" : "outlined"}
								sx={{ fontWeight: 600 }}
							/>
						))}
					</Stack>
				</Box>

				{/* FAQ por categoría */}
				<Stack spacing={6}>
					{filteredCategories.map((category) => {
						const Icon = category.icon;
						return (
							<Box key={category.label}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
									<Avatar
										sx={{
											bgcolor: alpha(theme.palette[category.color].main, 0.12),
											color: `${category.color}.main`,
											width: 44,
											height: 44,
										}}
									>
										<Icon fontSize="small" />
									</Avatar>
									<Typography variant="h5" fontWeight={700} color="text.primary">
										{category.label}
									</Typography>
									<Chip
										label={`${category.items.length} preguntas`}
										size="small"
										variant="outlined"
										sx={{ color: "text.secondary", fontWeight: 600 }}
									/>
								</Stack>

								<Stack spacing={1}>
									{category.items.map((item, idx) => {
										const panelId = `${category.label}-${idx}`;
										return (
											<Accordion
												key={panelId}
												expanded={expanded === panelId}
												onChange={handleAccordion(panelId)}
												elevation={0}
												sx={{
													border: `1px solid ${theme.palette.divider}`,
													borderRadius: "12px !important",
													"&:before": { display: "none" },
													"&.Mui-expanded": {
														borderColor: alpha(theme.palette[category.color].main, 0.4),
														bgcolor: alpha(theme.palette[category.color].main, 0.02),
													},
												}}
											>
												<AccordionSummary
													expandIcon={<ExpandMore />}
													sx={{
														px: 3,
														py: 1.5,
														"& .MuiAccordionSummary-content": { my: 1 },
													}}
												>
													<Typography variant="body1" fontWeight={600} color="text.primary">
														{item.question}
													</Typography>
												</AccordionSummary>
												<AccordionDetails sx={{ px: 3, pb: 3 }}>
													<Divider sx={{ mb: 2 }} />
													<Typography
														variant="body2"
														color="text.secondary"
														sx={{ lineHeight: 1.8 }}
													>
														{item.answer}
													</Typography>
												</AccordionDetails>
											</Accordion>
										);
									})}
								</Stack>
							</Box>
						);
					})}
				</Stack>

				{/* Canales de contacto */}
				<Paper
					elevation={0}
					sx={{
						mt: 10,
						p: { xs: 4, md: 6 },
						border: `1px solid ${theme.palette.divider}`,
						borderRadius: 3,
						bgcolor: alpha(theme.palette.primary.main, 0.03),
					}}
				>
					<Typography
						variant="h4"
						fontWeight={700}
						textAlign="center"
						gutterBottom
						color="text.primary"
					>
						¿No encontraste lo que buscabas?
					</Typography>
					<Typography
						variant="body1"
						color="text.secondary"
						textAlign="center"
						sx={{ mb: 5 }}
					>
						Nuestro equipo está disponible para ayudarte.
					</Typography>
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
							gap: 3,
						}}
					>
						{contactChannels.map((channel) => {
							const Icon = channel.icon;
							return (
								<Card
									key={channel.title}
									elevation={0}
									sx={{
										border: `1px solid ${theme.palette.divider}`,
										borderRadius: 3,
										textAlign: "center",
										p: 1,
										transition: "all 0.2s ease",
										"&:hover": {
											borderColor: alpha(theme.palette[channel.color].main, 0.4),
											boxShadow: theme.shadows[3],
											transform: "translateY(-2px)",
										},
									}}
								>
									<CardContent>
										<Avatar
											sx={{
												bgcolor: alpha(theme.palette[channel.color].main, 0.1),
												color: `${channel.color}.main`,
												width: 52,
												height: 52,
												mx: "auto",
												mb: 2,
											}}
										>
											<Icon />
										</Avatar>
										<Typography
											variant="subtitle1"
											fontWeight={700}
											gutterBottom
											color="text.primary"
										>
											{channel.title}
										</Typography>
										<Typography
											variant="caption"
											color="text.secondary"
											display="block"
											sx={{ mb: 1 }}
										>
											{channel.description}
										</Typography>
										<Typography
											variant="body2"
											fontWeight={700}
											color={`${channel.color}.main`}
										>
											{channel.value}
										</Typography>
									</CardContent>
								</Card>
							);
						})}
					</Box>
				</Paper>
			</Container>
		</Box>
	);
};

export default CentroAyuda;
