import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Box, Typography, TextField, CircularProgress, 
  Alert, Stack, Divider 
} from '@mui/material';
import { GppGood, Lock } from '@mui/icons-material';
import ContratoPlantillaService from '../../../../Services/contrato-plantilla.service';
import ContratoFirmadoService from '../../../../Services/contrato-firmado.service';



interface Props {
  open: boolean;
  onClose: () => void;
  idProyecto: number;
  idUsuario: number;
  onFirmaExitosa: () => void; // Callback para refrescar la UI padre tras firmar
}

const ModalFirmaContrato: React.FC<Props> = ({ 
  open, onClose, idProyecto, idUsuario, onFirmaExitosa 
}) => {
  // Estados de carga
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [signing, setSigning] = useState(false);
  
  // Datos del contrato
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [idPlantilla, setIdPlantilla] = useState<number | null>(null);
  
  // Inputs del usuario
  const [codigo2FA, setCodigo2FA] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Al abrir el modal, buscamos la plantilla activa del proyecto
  useEffect(() => {
    if (open && idProyecto) {
      cargarPlantilla();
    }
    // Limpieza al cerrar
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [open, idProyecto]);

  const cargarPlantilla = async () => {
    setLoadingTemplate(true);
    setErrorMsg(null);
    try {
      // A. Buscamos la info de la plantilla (necesitamos el ID)
      const resInfo = await ContratoPlantillaService.findByProject(idProyecto);
      
      // Asumimos que el backend devuelve un array ordenado por versión, tomamos la primera (más reciente)
      const plantillaActiva = resInfo.data[0];

      if (!plantillaActiva) {
        throw new Error("No hay un contrato activo configurado para este proyecto.");
      }

      setIdPlantilla(plantillaActiva.id);

      // B. Descargamos el PDF binario para mostrarlo y luego hashearlo
      // Nota: Usamos una ruta que nos devuelva el BLOB de la plantilla. 
      // Si no tienes una ruta directa 'download', puedes usar la URL pública si es accesible, 
      // pero por seguridad es mejor pedirla al endpoint seguro.
      // *Asumiremos que usas una función que devuelve el Blob basada en la URL o un endpoint específico*
      
      // ⚠️ SIMULACIÓN: Si tu backend requiere autenticación para ver la plantilla, 
      // deberías tener un endpoint tipo GET /contratos/plantilla/{id}/descargar
      // Aquí usaremos fetch directo a la url_archivo si es pública, o el servicio si es privada.
      
      // Opción A: Si la URL es pública/estática:
      const response = await fetch(process.env.REACT_APP_API_URL + plantillaActiva.url_archivo);
      const blob = await response.blob();
      
      setPdfBlob(blob);
      setPdfUrl(URL.createObjectURL(blob));

    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error al cargar el contrato. Intente nuevamente.");
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleFirmar = async () => {
    if (!pdfBlob || !idPlantilla || !codigo2FA) return;
    
    setSigning(true);
    setErrorMsg(null);

    try {
      // 1. Convertir Blob a File para el servicio
      const file = new File([pdfBlob], "contrato_firmado.pdf", { type: "application/pdf" });

      // 2. Obtener Geolocalización (Opcional, pero recomendado por tu backend)
      const coords = await ContratoFirmadoService.getCurrentPosition();

      // 3. Enviar Firma
      await ContratoFirmadoService.registrarFirma({
        file: file,
        id_contrato_plantilla: idPlantilla,
        id_proyecto: idProyecto,
        id_usuario_firmante: idUsuario,
        codigo_2fa: codigo2FA,
        latitud_verificacion: coords?.lat,
        longitud_verificacion: coords?.lng
      });

      // 4. Éxito
      onFirmaExitosa();
      onClose();
      alert("✅ Contrato firmado correctamente. Tu inversión ha sido procesada.");

    } catch (err: any) {
      console.error(err);
      // Extraer mensaje de error del backend
      const serverMsg = err.response?.data?.message || err.message;
      setErrorMsg(`Error al firmar: ${serverMsg}`);
    } finally {
      setSigning(false);
    }
  };

  return (
    <Dialog open={open} onClose={!signing ? onClose : undefined} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #eee' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">Firma de Contrato Digital</Typography>
          <GppGood color="success" />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: '70vh', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        
        {/* LADO IZQUIERDO: VISOR PDF */}
        <Box sx={{ flex: 2, bgcolor: '#f5f5f5', borderRight: '1px solid #ddd', overflow: 'hidden', position: 'relative' }}>
          {loadingTemplate ? (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <CircularProgress />
              <Typography ml={2}>Cargando documento...</Typography>
            </Box>
          ) : pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              width="100%" 
              height="100%" 
              title="Visor Contrato"
              style={{ border: 'none' }}
            />
          ) : (
            <Box p={4} textAlign="center">
              <Typography color="error">No se pudo cargar el documento.</Typography>
            </Box>
          )}
        </Box>

        {/* LADO DERECHO: PANEL DE FIRMA */}
        <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Instrucciones
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              1. Lee atentamente el contrato en el panel izquierdo.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              2. Al firmar, se generará un hash criptográfico único que vincula tu identidad con este documento.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              3. Para validar tu identidad, ingresa el código de tu aplicación de autenticación (Google Authenticator).
            </Typography>
          </Box>

          <Divider />

          <Box>
             <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <Lock fontSize="small" color="primary" /> Código de Seguridad (2FA)
             </Typography>
             <TextField 
               fullWidth
               placeholder="Ej: 123456"
               value={codigo2FA}
               onChange={(e) => setCodigo2FA(e.target.value.replace(/\D/g,'').slice(0,6))} // Solo números, max 6
               disabled={signing}
               inputProps={{ style: { textAlign: 'center', letterSpacing: 4, fontWeight: 'bold' } }}
             />
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ mt: 1 }}>{errorMsg}</Alert>
          )}

          <Box mt="auto">
            <Button 
              fullWidth 
              variant="contained" 
              size="large"
              onClick={handleFirmar}
              disabled={signing || loadingTemplate || !codigo2FA || codigo2FA.length < 6}
            >
              {signing ? <CircularProgress size={24} color="inherit" /> : "FIRMAR Y ACEPTAR"}
            </Button>
            <Button 
              fullWidth 
              color="inherit" 
              sx={{ mt: 1 }} 
              onClick={onClose}
              disabled={signing}
            >
              Cancelar
            </Button>
          </Box>
        </Box>

      </DialogContent>
    </Dialog>
  );
};

export default ModalFirmaContrato;