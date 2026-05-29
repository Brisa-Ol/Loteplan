import { ROUTES } from "@/routes";
import {
	
	InfoOutlined,

} from "@mui/icons-material";
import {
	alpha,
	Box,
	Breadcrumbs,
	Container,
	Link,
	Paper,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import React from "react";
import { Link as RouterLink } from "react-router-dom";

const TermsAndConditions: React.FC = () => {
	const theme = useTheme();

	return (
		<Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
			{/* Hero Section */}
			<Box
				sx={{
					background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
					color: "white",
					py: { xs: 8, md: 10 },
					borderBottomLeftRadius: { xs: 24, md: 48 },
					borderBottomRightRadius: { xs: 24, md: 48 },
					boxShadow: theme.shadows[4],
					mb: 6,
				}}
			>
				<Container maxWidth="lg">
					<Typography variant="h1" gutterBottom sx={{ color: "white" }}>
						Términos y Condiciones
					</Typography>
					<Typography
						variant="h6"
						sx={{
							maxWidth: "md",
							opacity: 0.9,
							fontWeight: 400,
							lineHeight: 1.6,
						}}
					>
						Última actualización: 1 de mayo de 2026
					</Typography>
				</Container>
			</Box>

			<Container maxWidth="lg" sx={{ pb: 12 }}>
				{/* Breadcrumbs opcional */}
				<Breadcrumbs sx={{ mb: 4 }}>
					<Link component={RouterLink} to={ROUTES.PUBLIC.HOME} color="inherit">
						Inicio
					</Link>
					<Typography color="text.primary">Términos y Condiciones</Typography>
				</Breadcrumbs>

				<Paper
					elevation={0}
					sx={{
						p: { xs: 4, md: 6 },
						bgcolor: "background.paper",
						border: `1px solid ${theme.palette.divider}`,
						borderRadius: 2,
					}}
				>
					<Stack spacing={5}>
						{/* 1. Aceptación */}
						<Box>
							<Typography
								variant="h4"
								gutterBottom
								fontWeight={700}
								color="text.primary"
							>
								1. Aceptación de los Términos
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ lineHeight: 1.7 }}
							>
								Al acceder o utilizar la plataforma Loteplan (en adelante, “la
								Plataforma”), usted acepta quedar vinculado por estos Términos y
								Condiciones, así como por nuestra Política de Privacidad. Si no está de
								acuerdo con alguno de estos términos, no podrá utilizar nuestros
								servicios.
							</Typography>
						</Box>

						{/* 2. Objeto */}
						<Box>
							<Typography
								variant="h4"
								gutterBottom
								fontWeight={700}
								color="text.primary"
							>
								2. Objeto de la Plataforma
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ lineHeight: 1.7 }}
							>
								Loteplan es una infraestructura financiera inmobiliaria que, a través de
								un fideicomiso de administración, organiza grupos de ahorro colaborativo
								para la adquisición de lotes urbanizados y escriturables. La Plataforma
								conecta a personas físicas o jurídicas interesadas en participar bajo
								dos modalidades: <strong>Modo Ahorrista</strong> (acceso a un terreno
								para vivienda propia) y <strong>Modo Inversionista</strong>{" "}
								(rentabilidad vinculada a la comercialización).
							</Typography>
						</Box>

						{/* 3. Naturaleza del Fideicomiso */}
						<Box>
							<Typography
								variant="h4"
								gutterBottom
								fontWeight={700}
								color="text.primary"
							>
								3. Naturaleza del Fideicomiso
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ lineHeight: 1.7, mb: 2 }}
							>
								Todos los aportes económicos de los participantes serán canalizados a
								través de un contrato de fideicomiso de administración, debidamente
								inscripto, con patrimonio separado e independiente. La fiduciaria será
								responsable de:
							</Typography>
							<Stack spacing={1.5} component="ul" sx={{ pl: 2 }}>
								<Typography component="li" variant="body1" color="text.secondary">
									• Adquirir los lotes identificados en cada proyecto.
								</Typography>
								<Typography component="li" variant="body1" color="text.secondary">
									• Administrar los fondos conforme a las reglas del contrato de
									fideicomiso.
								</Typography>
								<Typography component="li" variant="body1" color="text.secondary">
									• Adjudicar los lotes a los ahorristas en tiempo y forma.
								</Typography>
								<Typography component="li" variant="body1" color="text.secondary">
									• Distribuir los retornos a los inversionistas según lo proyectado.
								</Typography>
							</Stack>
						</Box>

						{/* 4. Modalidades de Participación */}
						<Box>
							<Typography
								variant="h4"
								gutterBottom
								fontWeight={700}
								color="text.primary"
							>
								4. Modalidades de Participación
							</Typography>
							<Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2 }}>
								Modo Ahorrista
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ lineHeight: 1.7 }}
							>
								El usuario se suscribe a un fideicomiso específico, abona cuotas
								periódicas (sin interés bancario) hasta completar el precio del lote.
								Desde la cuota 12 podrá participar en subastas de adjudicación
								anticipada. Al finalizar el plan, recibe la escritura de su terreno.
							</Typography>

							<Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3 }}>
								Modo Inversionista
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ lineHeight: 1.7 }}
							>
								El inversionista aporta capital al fideicomiso para la adquisición de
								suelo. La rentabilidad estimada se genera a partir de la
								comercialización de los lotes al grupo ahorrista. La salida se produce
								de acuerdo con el cronograma de liquidación del fideicomiso.
							</Typography>
						</Box>

						{/* 5. Obligaciones y Declaraciones del Usuario */}
						<Box>
							<Typography
								variant="h4"
								gutterBottom
								fontWeight={700}
								color="text.primary"
							>
								5. Obligaciones del Usuario
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ lineHeight: 1.7, mb: 2 }}
							>
								El usuario declara bajo juramento que:
							</Typography>
							<Stack spacing={1.5} component="ul" sx={{ pl: 2 }}>
								<Typography component="li" variant="body1" color="text.secondary">
									• La información proporcionada es veraz, completa y actualizada.
								</Typography>
								<Typography component="li" variant="body1" color="text.secondary">
									• Los fondos aportados provienen de fuentes lícitas.
								</Typography>
								<Typography component="li" variant="body1" color="text.secondary">
									• No utiliza la Plataforma para fines ilegales o no autorizados.
								</Typography>
								<Typography component="li" variant="body1" color="text.secondary">
									• Cumplirá con las cuotas o aportes en los plazos establecidos en el
									contrato de fideicomiso.
								</Typography>
							</Stack>
						</Box>

						{/* 6. Riesgos */}
						<Box
							sx={{
								bgcolor: alpha(theme.palette.warning.main, 0.08),
								p: 3,
								borderRadius: 2,
							}}
						>
							<Stack direction="row" spacing={2} alignItems="flex-start">
								<InfoOutlined color="warning" />
								<Box>
									<Typography
										variant="h5"
										fontWeight={700}
										gutterBottom
										color="text.primary"
									>
										6. Factores de Riesgo
									</Typography>
									<Typography
										variant="body1"
										color="text.secondary"
										sx={{ lineHeight: 1.7 }}
									>
										La participación en proyectos inmobiliarios implica riesgos
										inherentes, tales como demoras en la urbanización, fluctuaciones del
										mercado, cambios regulatorios o macroeconómicos. Loteplan no garantiza
										plazos ni rendimientos específicos, aunque todos los proyectos se
										someten a un riguroso análisis de viabilidad. Le recomendamos leer el
										prospecto informativo de cada fideicomiso antes de realizar cualquier
										aporte.
									</Typography>
								</Box>
							</Stack>
						</Box>

						{/* 7. Comisiones y Costos */}
						<Box>
							<Typography
								variant="h4"
								gutterBottom
								fontWeight={700}
								color="text.primary"
							>
								7. Comisiones y Costos
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ lineHeight: 1.7 }}
							>
								La estructura de costos (honorarios del fiduciario, gastos de
								administración, impuestos, etc.) se detalla en el contrato de
								fideicomiso correspondiente. No existen cargos ocultos. Loteplan percibe
								una comisión por el uso de la plataforma, la cual se encuentra
								expresamente informada antes de la suscripción.
							</Typography>
						</Box>

						{/* 8. Propiedad Intelectual */}
						<Box>
							<Typography
								variant="h4"
								gutterBottom
								fontWeight={700}
								color="text.primary"
							>
								8. Propiedad Intelectual
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ lineHeight: 1.7 }}
							>
								Todo el contenido de la Plataforma (textos, logotipos, gráficos,
								software, etc.) es propiedad de Loteplan o de sus licenciantes y está
								protegido por las leyes de propiedad intelectual. Queda prohibida su
								reproducción, distribución o modificación sin autorización expresa.
							</Typography>
						</Box>

						{/* 9. Modificaciones */}
						<Box>
							<Typography
								variant="h4"
								gutterBottom
								fontWeight={700}
								color="text.primary"
							>
								9. Modificaciones de los Términos
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ lineHeight: 1.7 }}
							>
								Loteplan se reserva el derecho de actualizar estos Términos y
								Condiciones en cualquier momento. La versión modificada entrará en vigor
								a los 7 días de su publicación en la Plataforma. El uso continuado de
								los servicios implica la aceptación de los cambios.
							</Typography>
						</Box>

						{/* 10. Ley Aplicable y Jurisdicción */}
						<Box>
							<Typography
								variant="h4"
								gutterBottom
								fontWeight={700}
								color="text.primary"
							>
								10. Ley Aplicable y Jurisdicción
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{ lineHeight: 1.7 }}
							>
								Estos términos se rigen por las leyes de la República Argentina.
								Cualquier controversia será sometida a los tribunales ordinarios de la
								Ciudad Autónoma de Buenos Aires, con renuncia a cualquier otro fuero.
							</Typography>
						</Box>

						{/* 11. Contacto */}
						<Box
							sx={{
								mt: 4,
								p: 3,
								bgcolor: alpha(theme.palette.primary.main, 0.04),
								borderRadius: 2,
							}}
						>
							<Typography variant="h5" fontWeight={700} gutterBottom>
								¿Dudas o consultas?
							</Typography>
							<Typography variant="body1" color="text.secondary">
								Podés escribirnos a{" "}
								<Link href="mailto:legal@loteplan.com" color="primary.main">
									legal@loteplan.com
								</Link>{" "}
								y contactar con soporte. Estamos para ayudarte.
							</Typography>
						</Box>
					</Stack>
				</Paper>
			</Container>
		</Box>
	);
};

export default TermsAndConditions;
