import SuscripcionService from "@/core/api/services/suscripcion.service";
import { colors } from "@/core/theme/globalStyles";
import type { SuscripcionDto } from "@/core/types/suscripcion.dto";
import { Token } from "@mui/icons-material";
import { Alert, alpha, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
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

	const mutation = useMutation({
		mutationFn: () =>
			SuscripcionService.updateSuscription(suscripcion.id, {
				...suscripcion,
				tokens_disponibles: 1,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["adminSuscripciones"] });
			onSuccess?.();
		},
	});

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
						onClick={() => mutation.mutate()}
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
		</>
	);
};
