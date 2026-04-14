import { useRef, useState, useEffect } from 'react';           // ← agrega useRef
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import kycService from '@/core/api/services/kyc.service';
import useSnackbar from '@/shared/hooks/useSnackbar';
import type { KycStatusWithRecord } from '@/core/types/kyc.dto';
import type { StepDataRef, StepDataValues } from '../components/StepData'; // ← import

export const useKYCLogic = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const stepDataRef = useRef<StepDataRef>(null);               // ← ref al form del paso 0

  const [activeStep, setActiveStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const [personalData, setPersonalData] = useState<StepDataValues>({
    tipo_documento: 'DNI',
    numero_documento: '',
    nombre_completo: '',
    fecha_nacimiento: '',
  });

  const [files, setFiles] = useState({
    frente: null as File | null,
    dorso: null as File | null,
    selfie: null as File | null,
    video: null as File | null,
  });

  const { data: kycStatus, isLoading, error } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: kycService.getStatus,
    retry: false,
  });

  useEffect(() => {
    if (kycStatus && 'tipo_documento' in kycStatus && kycStatus.estado_verificacion === 'RECHAZADA') {
      const record = kycStatus as KycStatusWithRecord;
      setPersonalData({
        tipo_documento: record.tipo_documento || 'DNI',
        numero_documento: record.numero_documento || '',
        nombre_completo: record.nombre_completo || '',
        fecha_nacimiento: record.fecha_nacimiento?.split('T')[0] || '',
      });
    }
  }, [kycStatus]);

  const uploadMutation = useMutation({
    mutationFn: async () =>
      kycService.submit({
        ...personalData,
        documento_frente: files.frente!,
        documento_dorso: files.dorso || undefined,
        selfie_con_documento: files.selfie!,
        video_verificacion: files.video || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycStatus'] });
      showSuccess('Enviado a revisión');
      setActiveStep(0);
    },
    onError: (err: any) => showError(err.response?.data?.mensaje || 'Error al enviar'),
  });

  // ← handleNext ahora es async
  const handleNext = async () => {
    if (activeStep === 0) {
      const isValid = await stepDataRef.current?.validate();
      if (!isValid) return;                                     // los errores se muestran inline
      // Sincroniza los valores finales desde Formik hacia el estado del hook
      const values = stepDataRef.current?.getValues();
      if (values) setPersonalData(values);
    }

    if (activeStep === 1 && (!files.frente || !files.selfie))
      return setFormError('Sube los documentos obligatorios.');

    setFormError(null);
    setActiveStep(prev => prev + 1);
  };

  return {
    kycStatus, isLoading, error,
    activeStep, personalData, setPersonalData,
    files, setFiles,
    formError, setFormError,
    uploadMutation,
    handleNext,
    handleBack: () => setActiveStep(prev => prev - 1),
    stepDataRef,                                             // ← expuesto al componente padre
  };
};