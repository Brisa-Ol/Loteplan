import ImagenService from '@/core/api/services/imagen.service';
import { Box, CircularProgress } from '@mui/material';
import { type FC } from 'react'

interface IStepContratoProps {
    plantilla: any;
    isLoading: boolean;
}

export const StepContrato: FC<IStepContratoProps> = ({ plantilla, isLoading }) => {
  if (isLoading || !plantilla) return <CircularProgress />;
  return (
  <>
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: { xs: '70vh', md: '75vh' }, bgcolor: 'grey.100', borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
      <iframe src={ImagenService.resolveImageUrl(plantilla.url_archivo)} title="Contrato" style={{ width: '100%', height: '100%', border: 'none', flex: 1 }} />
    </Box>
  </>
  )
}

StepContrato.displayName = 'StepContrato';