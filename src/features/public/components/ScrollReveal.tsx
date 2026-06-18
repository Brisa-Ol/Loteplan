import { Box } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

// ─── ScrollReveal ──────────────────────────────────────────────────────────
// Envuelve cualquier contenido y lo anima (fade + slide-up) cuando entra al
// viewport por primera vez. No depende de ninguna librería externa, solo usa
// la IntersectionObserver API nativa del navegador.
//
// Uso:
//   <ScrollReveal delay={index * 120}>
//     <Card>...</Card>
//   </ScrollReveal>
// ─────────────────────────────────────────────────────────────────────────

export interface ScrollRevealProps {
  children: React.ReactNode;
  /** Delay en ms antes de animar. Útil para "escalonar" items de una misma lista/grilla. */
  delay?: number;
  /** 0 a 1: qué porcentaje del elemento debe estar visible para disparar la animación. */
  threshold?: number;
  /** Distancia (en px) desde la que se desliza el contenido hacia su posición final. */
  offsetY?: number;
  /** Duración de la transición en segundos. */
  duration?: number;
  /** Si es false, la animación se repite cada vez que el elemento entra/sale del viewport. */
  once?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  threshold = 0.15,
  offsetY = 28,
  duration = 0.7,
  once = true,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Si por algún motivo no existe IntersectionObserver, mostramos el contenido directamente.
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -60px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once]);

  return (
    <Box
      ref={ref}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : `translateY(${offsetY}px)`,
        transition: `opacity ${duration}s ease-out ${delay}ms, transform ${duration}s ease-out ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Box>
  );
};

export default ScrollReveal;