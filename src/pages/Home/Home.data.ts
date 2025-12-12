// src/pages/Home/Home.data.ts
// Datos separados para mejor organización
// ═══════════════════════════════════════════════════════════
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
} from "@mui/icons-material";

export const features = [
  {
    title: "Modalidad ahorrista",
    image: "/Home/Home1b_modoahorrista.jpg",
    description: "Comprá el lote para tu casa propia en cuotas sin interés.",
  },
  {
    title: "Modo inversionista",
    image: "/Home/Home2a_modoinversionista.jpg",
    description: "Podés ganar con la revalorización de tu inversión en tierra.",
  },
];

export const steps = [
  { title: "Elegís tu modo de invertir", icon: TrendingUpIcon },
  { title: "Hacés tu inversión", icon: AttachMoneyIcon },
  { title: "Revalorizás tu capital", icon: TrendingUpIcon },
];

export const benefits = [
  "Porque a medida que las ciudades crecen y la demanda aumenta, el valor de la tierra también.",
  "Porque puede generar rendimientos altos para quienes buscan reducir el riesgo.",
  "Porque nuestra tecnología brinda transparencia y nuestra modalidad jurídica seguridad.",
  "Porque tenemos contratos para urbanizar más de 400 hectáreas y trabajamos para más opciones.",
];