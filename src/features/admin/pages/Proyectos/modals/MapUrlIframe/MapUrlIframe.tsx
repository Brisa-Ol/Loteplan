import theme from "@/core/theme/globalStyles";
import { alpha, Box, Typography } from "@mui/material";
import { type FC } from "react";
import styles from './MapUrlIframe.module.css'

interface IMapUrlIframe {
	map_url: string | null;
	type_proyect?: boolean;
}

export const MapUrlIframe: FC<IMapUrlIframe> = ({ map_url, type_proyect }) => {
	
	return (

		//si tpye_proyect es true es una suscripcion, y que no se muestre la ubicacion, pero si es false es un lote o inversion y se muestra la ubicacion, pero si no hay ubicacion se muestra el mensaje de no hay ubicacion disponible
		<>
			{map_url && !type_proyect ? (
				<iframe 
					className={styles.mapContainer}
					src={map_url}
					style={{ border: 0}}
					loading="lazy"
				/>
			) : type_proyect ? (
				<Box
					sx={{
						p: 1.5,
						textAlign: "center",
						bgcolor: alpha(theme.palette.primary.main, 0.02),
						borderTop: "1px solid",
						borderColor: "divider",
					}}
				>
					<Typography variant="caption" color="primary.main" fontWeight={900}>
						Ver ubicaciones en Lotes
					</Typography>
				</Box>
			) : (
				<Box
					sx={{
						p: 1.5,
						textAlign: "center",
						bgcolor: alpha(theme.palette.primary.main, 0.02),
						borderTop: "1px solid",
						borderColor: "divider",
					}}
				>
					<Typography variant="caption" color="primary.main" fontWeight={900}>
						No hay ubicacion disponible
					</Typography>
				</Box>
			)}
		</>
	);
};
