// src/shared/components/domain/modals/ModalMotivoAdmin.tsx

import { BaseModal } from "@/shared";
import { Box, TextField, Typography } from "@mui/material";
import React from "react";

type HeaderColor =
	| "primary"
	| "secondary"
	| "error"
	| "warning"
	| "info"
	| "success";

interface Props {
	// ─── Control del modal ───────────────────────────────
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	isLoading?: boolean;

	// ─── Configuración visual ────────────────────────────
	title: string;
	icon: React.ReactElement;
	headerColor?: HeaderColor;
	confirmText?: string;
	confirmButtonColor?: HeaderColor;

	// ─── Texto descriptivo (encima del textarea) ─────────
	description: React.ReactNode;

	// ─── Textarea de motivo ──────────────────────────────
	motivo_cambio: string;
	onMotivoChange: (value: string) => void;
	motivoLabel?: string;
	motivoPlaceholder?: string;
	motivoHelperText?: string;
}

export const ModalMotivoAdmin: React.FC<Props> = ({
	open,
	onClose,
	onConfirm,
	isLoading = false,
	title,
	icon,
	headerColor = "primary",
	confirmText = "Confirmar",
	confirmButtonColor = "primary",
	description,
	motivo_cambio,
	onMotivoChange,
	motivoLabel = "Motivo (Obligatorio)",
	motivoPlaceholder = "Ingresá el motivo...",
	motivoHelperText = "Este campo es obligatorio.",
}) => {
	return (
		<BaseModal
			open={open}
			onClose={onClose}
			title={title}
			icon={icon}
			headerColor={headerColor}
			maxWidth="sm"
			confirmText={confirmText}
			confirmButtonColor={confirmButtonColor}
			onConfirm={onConfirm}
			isLoading={isLoading}
			disableConfirm={(!motivo_cambio)} // Deshabilita el botón si el motivo está vacío o solo tiene espacios
		>
			<Box>
				<Typography variant="body2" mb={3} color="text.secondary">
					{description}
				</Typography>
				<TextField
					autoFocus
					fullWidth
					multiline
					rows={3}
					label={motivoLabel}
					value={motivo_cambio}
					onChange={(e) => onMotivoChange(e.target.value)}
					placeholder={motivoPlaceholder}
					helperText={motivoHelperText}
				/>
			</Box>
		</BaseModal>
	);
};
