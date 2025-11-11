import React from "react";
import {
  Box,
  Typography,
  ThemeProvider,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import muiTheme from "../../theme/FormTitle";

interface Feature {
  title: string;
  image: string;
  description: string[];
}

interface Step {
  title: string;
  description: string[];
  image: string;
}

const features: Feature[] = [
  {
    title: "¿Quiénes Somos?",
    image: "manos.jpeg",
    description: [
      "Loteplan es una plataforma de crowdfunding para invertir y comprar terrenos urbanizados de manera sencilla y segura.",
      "No necesitás altos ingresos y tu participación se mantiene legalmente protegida durante todo el proceso.",
    ],
  },
  {
    title: "Nuestra Misión",
    image: "ahorrista.jpeg",
    description: [
      "Hacer más segura, accesible y colaborativa la inversión inmobiliaria en terrenos.",
      "Nuestra plataforma de crowdfunding ofrece una solución dual: para quienes buscan comprar terreno en cuotas y para quienes desean invertir en tierra y obtener una renta.",
    ],
  },
];

const steps: Step[] = [
  { title: "Invertí donde estés", description: ["Participá en proyectos inmobiliarios sin moverte de tu casa."], image: "inversion2.jpeg" },
  { title: "Comprá en cuotas", description: ["Accedé a tu terreno con pagos flexibles y sin interés."], image: "casaultima.jpeg" },
  { title: "Transparencia legal", description: ["La plataforma brinda transparencia y seguridad en todo el proceso."], image: "contrato43.jpeg" },
];

const FeatureCard: React.FC<{ feature: Feature }> = ({ feature }) => (
  <Card sx={{ flex: 1, maxWidth: 400, display: "flex", flexDirection: "column", alignItems: "center", borderRadius: 3, bgcolor: "#F2F2F2", boxShadow: 3, transition: "transform 0.3s", "&:hover": { transform: "translateY(-5px)" } }}>
    <CardMedia component="img" image={feature.image} alt={feature.title} sx={{ width: "100%", height: 214, objectFit: "cover", borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
    <CardContent sx={{ width: "100%" }}>
      <Typography variant="h3" align="center" color="text.primary" sx={{ mb: 2 }}>{feature.title}</Typography>
      {feature.description.map((p, i) => <Typography key={i} variant="body1" color="text.secondary" textAlign="justify" sx={{ mb: i < feature.description.length - 1 ? 2 : 0 }}>{p}</Typography>)}
    </CardContent>
  </Card>
);

const StepCard: React.FC<{ step: Step }> = ({ step }) => (
  <Card sx={{ flex: 1, maxWidth: 280, display: "flex", flexDirection: "column", alignItems: "center", borderRadius: 3, bgcolor: "#F2F2F2", boxShadow: 3, transition: "transform 0.3s", "&:hover": { transform: "translateY(-5px)" } }}>
    <CardMedia component="img" image={step.image} alt={step.title} sx={{ width: "100%", height: 160, objectFit: "cover", borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
    <CardContent sx={{ textAlign: "center", width: "100%" }}>
      <Typography variant="h4" color="text.primary" sx={{ mt: 2 }}>{step.title}</Typography>
      {step.description.map((p, i) => <Typography key={i} variant="body1" color="text.secondary" sx={{ mt: 1 }}>{p}</Typography>)}
    </CardContent>
  </Card>
);

const Nosotros: React.FC = () => (
  <ThemeProvider theme={muiTheme}>
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 6 } }}>
      <Typography variant="h1" align="center" sx={{ mb: { xs: 4, md: 6 }, mt: 2 }}>Sobre Nosotros</Typography>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 3, md: 4 }, justifyContent: "center", mb: { xs: 5, md: 8 } }}>
        {features.map((f, i) => <FeatureCard key={i} feature={f} />)}
      </Box>

      <Typography variant="h2" align="center" sx={{ mb: { xs: 4, md: 6 } }}>¿Qué encontrás en nuestra plataforma de crowdfunding?</Typography>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "center", alignItems: "stretch", gap: { xs: 3, md: 4 } }}>
        {steps.map((s, i) => <StepCard key={i} step={s} />)}
      </Box>
    </Box>
  </ThemeProvider>
);

export default Nosotros;
