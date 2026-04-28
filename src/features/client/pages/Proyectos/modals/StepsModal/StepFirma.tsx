import { HistoryEdu } from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Fade,
	Stack,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import PDFViewerMejorado from "../../../Contratos/components/PDFViewerMejorado";
import ImagenService from "@/core/api/services/imagen.service";
import type { FC } from "react";
import { SignatureCanvas } from "./SignatureCanvas";

interface SignaturePosition {
    x: number;
    y: number;
    page: number;
}

interface IStepFirmaProps {
	codigo2FAFirma: string;
	setCodigo2FAFirma: (v: string) => void;
	plantillaActual: any;
	signatureDataUrl: string | null;
	setSignatureDataUrl: (v: string | null) => void;
	signaturePosition: SignaturePosition | null;
	setSignaturePosition: (pos: SignaturePosition | null) => void;
	isProcessing: boolean;
}

export const StepFirma: FC<IStepFirmaProps> = ({
	codigo2FAFirma,
	setCodigo2FAFirma,
	plantillaActual,
	signatureDataUrl,
	setSignatureDataUrl,
	signaturePosition,
	setSignaturePosition,
	isProcessing,
}) => {
	const theme = useTheme();

	return (
		<>
			<Alert severity="info" icon={<HistoryEdu />} sx={{ borderRadius: 2 }}>
				<Typography variant="body2" fontWeight={600} mb={0.5}>
					Paso final: firma digital del contrato
				</Typography>
				<Typography variant="caption">
					Ingresá tu código 2FA, dibujá tu firma y posicionala sobre el contrato.
				</Typography>
			</Alert>

			<TextField
				autoFocus
				label="Código 2FA para firmar"
				value={codigo2FAFirma}
				onChange={(e) =>
					setCodigo2FAFirma(e.target.value.replace(/\D/g, "").slice(0, 6))
				}
				placeholder="000 000"
				disabled={isProcessing}
				fullWidth
				inputProps={{
					maxLength: 6,
					style: {
						textAlign: "center",
						fontSize: "1.2rem",
						letterSpacing: "0.3rem",
					},
				}}
				sx={{ maxWidth: 300, mx: "auto" }}
				helperText="Código de Google Authenticator"
			/>

			<Fade in={!signatureDataUrl} unmountOnExit>
				<Box>
					<SignatureCanvas
						onSave={setSignatureDataUrl}
						onClear={() => {
							setSignatureDataUrl(null);
							setSignaturePosition(null);
						}}
						initialSignature={signatureDataUrl}
					/>
				</Box>
			</Fade>

			<Fade in={!!signatureDataUrl} unmountOnExit>
				<Box
					sx={{
						minHeight: "60vh",
						display: "flex",
						flexDirection: "column",
						gap: 2,
					}}
				>
					<Alert
						severity={signaturePosition ? "success" : "warning"}
						variant="outlined"
						sx={{ borderRadius: 2 }}
					>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Typography variant="body2">
								{signaturePosition
									? "✓ Firma posicionada"
									: "⚠ Hacé clic en el contrato para ubicar tu firma"}
							</Typography>
							<Button
								size="small"
								onClick={() => {
									setSignatureDataUrl(null);
									setSignaturePosition(null);
								}}
							>
								Cambiar Firma
							</Button>
						</Stack>
					</Alert>

					<Box
						sx={{
							flex: 1,
							border: `1px solid ${theme.palette.divider}`,
							borderRadius: 2,
							overflow: "hidden",
						}}
					>
						<PDFViewerMejorado
							pdfUrl={
								plantillaActual
									? ImagenService.resolveImageUrl(plantillaActual.url_archivo)
									: ""
							}
							signatureDataUrl={signatureDataUrl}
							onSignaturePositionSet={setSignaturePosition}
						/>
					</Box>
				</Box>
			</Fade>
		</>
	);
};
