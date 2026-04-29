import { Clear, Draw, Save } from "@mui/icons-material";
import { Box, Button, Paper, Stack, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect, useRef, useState, type FC } from "react";

interface IStepFirmaProps {
	onSave: (data: string) => void;
	onClear: () => void;
	initialSignature?: string | null;
}

export const SignatureCanvas: FC<IStepFirmaProps> = ({
	onSave,
	onClear,
	initialSignature,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [hasSignature, setHasSignature] = useState(!!initialSignature);
	const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
	const theme = useTheme();

	const setupCanvas = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas?.parentElement) return;
		const parent = canvas.parentElement;
		canvas.width = parent.clientWidth;
		canvas.height = parent.clientHeight;
		const context = canvas.getContext("2d");
		if (context) {
			context.strokeStyle = theme.palette.text.primary;
			context.lineWidth = 2.5;
			context.lineCap = "round";
			context.lineJoin = "round";
			setCtx(context);
			if (initialSignature && !hasSignature) {
				const img = new Image();
				img.onload = () => {
					context.clearRect(0, 0, canvas.width, canvas.height);
					context.drawImage(img, 0, 0, canvas.width, canvas.height);
					setHasSignature(true);
				};
				img.src = initialSignature;
			}
		}
	}, [theme.palette.text.primary, initialSignature, hasSignature]);

	useEffect(() => {
		const timeoutId = setTimeout(setupCanvas, 100);
		window.addEventListener("resize", setupCanvas);
		return () => {
			window.removeEventListener("resize", setupCanvas);
			clearTimeout(timeoutId);
		};
	}, [setupCanvas]);

	const getPointerPosition = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			const canvas = canvasRef.current;
			if (!canvas) return { x: 0, y: 0 };
			const rect = canvas.getBoundingClientRect();
			const isTouchEvent = "touches" in e;
			const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
			const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;
			return { x: clientX - rect.left, y: clientY - rect.top };
		},
		[],
	);

	const startDrawing = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			if (!ctx) return;
			const { x, y } = getPointerPosition(e);
			ctx.beginPath();
			ctx.moveTo(x, y);
			setIsDrawing(true);
		},
		[ctx, getPointerPosition],
	);

	const draw = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			if (!isDrawing || !ctx) return;
			e.preventDefault();
			const { x, y } = getPointerPosition(e);
			ctx.lineTo(x, y);
			ctx.stroke();
			setHasSignature(true);
		},
		[isDrawing, ctx, getPointerPosition],
	);

	const stopDrawing = useCallback(() => {
		if (isDrawing && ctx) {
			ctx.closePath();
			setIsDrawing(false);
		}
	}, [isDrawing, ctx]);

	const handleClear = useCallback(() => {
		const canvas = canvasRef.current;
		if (ctx && canvas) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			setHasSignature(false);
			onClear();
		}
	}, [ctx, onClear]);

	const handleSave = useCallback(() => {
		const canvas = canvasRef.current;
		if (canvas && hasSignature) onSave(canvas.toDataURL("image/png"));
	}, [hasSignature, onSave]);

	return (
		<>
			<Box>
				<Paper
					variant="outlined"
					sx={{
						mb: 2,
						overflow: "hidden",
						touchAction: "none",
						bgcolor: "background.default",
						border: `2px dashed ${theme.palette.divider}`,
						borderRadius: 2,
						position: "relative",
						height: { xs: 180, sm: 220 },
						transition: "all 0.3s ease",
						"&:hover": { borderColor: "primary.main" },
					}}
				>
					{!hasSignature && !isDrawing && (
						<Box
							position="absolute"
							top="50%"
							left="50%"
							sx={{
								transform: "translate(-50%, -50%)",
								pointerEvents: "none",
								textAlign: "center",
							}}
						>
							<Draw sx={{ fontSize: 40, color: "action.disabled", mb: 1 }} />
							<Typography variant="caption" color="text.disabled">
								Firma aquí dentro
							</Typography>
						</Box>
					)}
					<canvas
						ref={canvasRef}
						onMouseDown={startDrawing}
						onMouseMove={draw}
						onMouseUp={stopDrawing}
						onMouseLeave={stopDrawing}
						onTouchStart={startDrawing}
						onTouchMove={draw}
						onTouchEnd={stopDrawing}
						style={{
							width: "100%",
							height: "100%",
							cursor: "crosshair",
							display: "block",
						}}
					/>
				</Paper>
				<Stack direction="row" spacing={2} justifyContent="center">
					<Button
						size="small"
						onClick={handleClear}
						startIcon={<Clear />}
						variant="outlined"
						color="error"
					>
						Borrar
					</Button>
					<Button
						size="small"
						variant="contained"
						onClick={handleSave}
						startIcon={<Save />}
						disabled={!hasSignature}
					>
						Usar Firma
					</Button>
				</Stack>
			</Box>
		</>
	);
};
SignatureCanvas.displayName = "SignatureCanvas";
