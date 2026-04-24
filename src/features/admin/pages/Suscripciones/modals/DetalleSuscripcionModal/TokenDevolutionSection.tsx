import SuscripcionService from "@/core/api/services/suscripcion.service";
import { colors } from "@/core/theme/globalStyles";
import type { SuscripcionDto } from "@/core/types/suscripcion.dto";
import { useConfirmDialog } from "@/shared";
import { Token } from "@mui/icons-material";
import {
	Alert, alpha, Box, Button, CircularProgress,
	Dialog,
	DialogActions,
	DialogContent, DialogContentText,
	DialogTitle,
	Stack, Typography
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FC } from "react";


interface ITokenDevolutionSection {
	suscripcion: SuscripcionDto;
	onSuccess?: () => void;
}

export const TokenDevolutionSection: FC<ITokenDevolutionSection> = ({
	suscripcion,
	onSuccess,
}) => {
	const queryClient = useQueryClient();

	// Inicializamos tu hook de confirmación
	const { open, config, confirm, close } = useConfirmDialog();

	const mutation = useMutation({
		mutationFn: () =>
			SuscripcionService.updateSuscription(suscripcion.id, {
				...suscripcion,
				tokens_disponibles: 1, // Nota: Si el usuario ya tuviera tokens, considera sumar: (suscripcion.tokens_disponibles || 0) + 1
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["adminSuscripciones"] });
			onSuccess?.();
		},
	});

	// Manejador para ejecutar la mutación y cerrar el modal
	const handleConfirmDevolution = () => {
		mutation.mutate();
		close();
	};

	return (
		<>
			<Box
				sx={{
					p: 2.5,
					borderRadius: 2,
					border: `1px solid ${alpha(colors.error.main, 0.3)}`,
					bgcolor: alpha(colors.error.main, 0.05),
				}}
			>
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					spacing={2}
				>
					<Box>
						<Typography variant="subtitle2" fontWeight={700} color="error.dark">
							Devolución de Token
						</Typography>
						<Typography variant="caption" color="text.secondary">
							El suscriptor no tiene tokens disponibles. Podés devolver 1 token
							manualmente.
						</Typography>
					</Box>

					<Button
						variant="contained"
						color="warning"
						size="small"
						startIcon={
							mutation.isPending ? (
								<CircularProgress size={16} color="inherit" />
							) : (
								<Token />
							)
						}
						// En lugar de mutar directo, abrimos el modal
						onClick={() => confirm('return_token')}
						disabled={mutation.isPending || mutation.isSuccess}
						sx={{ fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}
					>
						{mutation.isSuccess ? "Token devuelto" : "Devolver Token"}
					</Button>
				</Stack>

				{mutation.isError && (
					<Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
						{(mutation.error as any)?.response?.data?.error ||
							"Error al devolver el token"}
					</Alert>
				)}

				{mutation.isSuccess && (
					<Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
						✅ Token devuelto correctamente.
					</Alert>
				)}
			</Box>

			{/* Modal de Confirmación */}
			<Dialog
				open={open}
				onClose={close}
				PaperProps={{ sx: { borderRadius: 2 } }}
			>
				<DialogTitle sx={{ fontWeight: 700 }}>
					{config?.title}
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{config?.description}
					</DialogContentText>
				</DialogContent>
				<DialogActions sx={{ p: 2, pt: 0 }}>
					<Button onClick={close} color="inherit">
						Cancelar
					</Button>
					<Button
						onClick={handleConfirmDevolution}
						color={config?.severity as any}
						variant="contained"
						disableElevation
					>
						{config?.confirmText}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};