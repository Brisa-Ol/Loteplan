import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const Preguntas: React.FC = () => {
  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Preguntas Frecuentes
      </Typography>
      <Typography variant="body1" paragraph>
        Aquí encontrarás respuestas a las preguntas más comunes sobre nuestros servicios.
      </Typography>
      {/* Agrega más contenido relevante sobre preguntas frecuentes */}
    </Box>
  );
  };

export default Preguntas;