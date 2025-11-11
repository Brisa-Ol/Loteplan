import React from "react";
import {
  FactCheck as FactCheckIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Groups as GroupsIcon,
} from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";

interface StepData {
  title: string;
  description: string;
  image: string;
}

interface FeatureData {
  title: string;
  description: React.ReactNode;
  icon: SvgIconComponent;
}

interface ModalityData {
  title: string;
  description: string;
  image: string;
}

export const processSteps: StepData[] = [
  {
    title: "Únete a la comunidad",
    description:
      "Regístrate y elige el plan de ahorro que mejor se adapte a tus necesidades.",
    image: "/Comofunciona/Ahorrista/CómofuncionaAhorrista_1a.jpg",
  },
  {
    title: "Ahorra sin esfuerzo",
    description:
      "Paga cuotas mensuales sin interés y ve cómo crece tu inversión.",
    image: "/Comofunciona/Ahorrista/CómofuncionaAhorrista_2b.jpg",
  },
  {
    title: "Elige y adjudica tu lote",
    description:
      "Selecciona el terreno que más te guste, oferta y hazlo tuyo.",
    image: "/Comofunciona/Ahorrista/CómofuncionaAhorrista_3a.jpg",
  },
];

export const advantageFeatures: FeatureData[] = [
  {
    title: "Ahorro accesible",
    description: React.createElement(React.Fragment, null,
      "Pagás cuotas ", React.createElement("strong", null, "mensuales y sin interés")
    ),
    icon: CurrencyExchangeIcon,
  },
  {
    title: "Proceso 100% digital",
    description: "Todo desde la comodidad de tu hogar, sin papeleo.",
    icon: FactCheckIcon,
  },
  {
    title: "Inversión segura",
    description: "Tu dinero está respaldado y protegido en todo momento.",
    icon: AdminPanelSettingsIcon,
  },
  {
    title: "Comunidad colaborativa",
    description: "Únete a otros ahorristas y alcancen su sueño juntos.",
    icon: GroupsIcon,
  },
];

export const modalityFeatures: ModalityData[] = [
  {
    title: "Para tu Casa, primero el terreno.",
    description: "Sumáte y comprálo con una cuota mensual.",
    image: "/Comofunciona/Ahorrista/CómofuncionaAhorrista_2b.jpg",
  },
  {
    title: "Dejá de alquilar, planeá construir.",
    description: "Da el primer paso para tu casa propia.",
    image: "/Comofunciona/Ahorrista/CómofuncionaAhorrista_2a.jpg",
  },
];