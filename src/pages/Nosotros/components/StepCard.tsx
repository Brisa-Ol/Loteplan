// Card de pasos específica para Nosotros
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Card, CardMedia, CardContent, Typography } from "@mui/material";

interface Step {
  title: string;
  description: string[];
  image: string;
}

interface StepCardProps {
  step: Step;
}

export const StepCard: React.FC<StepCardProps> = ({ step }) => (
  <Card
    sx={{
      flex: 1,
      maxWidth: 280,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      borderRadius: 4,
      bgcolor: "#F2F2F2",
      boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
      transition: "all 0.3s ease",
      "&:hover": {
        transform: "translateY(-5px) scale(1.03)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
      },
      overflow: "hidden",
    }}
  >
    <CardMedia
      component="img"
      image={step.image}
      alt={step.title}
      sx={{ width: "100%", height: 160, objectFit: "cover" }}
    />
    <CardContent sx={{ textAlign: "center", width: "100%" }}>
      <Typography variant="h4" color="primary.main" sx={{ mt: 2, mb: 1 }}>
        {step.title}
      </Typography>
      {step.description.map((p, i) => (
        <Typography key={i} variant="body1" color="text.secondary">
          {p}
        </Typography>
      ))}
    </CardContent>
  </Card>
);