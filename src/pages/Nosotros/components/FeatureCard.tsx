// Card de features específica para Nosotros
// ═══════════════════════════════════════════════════════════
import React from "react";
import { Card, CardMedia, CardContent, Typography } from "@mui/material";

interface Feature {
  title: string;
  image: string;
  description: string[];
}

interface FeatureCardProps {
  feature: Feature;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => (
  <Card
    sx={{
      flex: 1,
      maxWidth: 400,
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
      image={feature.image}
      alt={feature.title}
      sx={{ width: "100%", height: 220, objectFit: "cover" }}
    />
    <CardContent sx={{ width: "100%" }}>
      <Typography variant="h3" align="center" color="primary.main" sx={{ mb: 2 }}>
        {feature.title}
      </Typography>
      {feature.description.map((p, i) => (
        <Typography
          key={i}
          variant="body1"
          color="text.secondary"
          sx={{ mb: i < feature.description.length - 1 ? 2 : 0 }}
        >
          {p}
        </Typography>
      ))}
    </CardContent>
  </Card>
);