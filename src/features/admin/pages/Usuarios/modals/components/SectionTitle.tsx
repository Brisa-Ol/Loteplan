// src/features/admin/pages/Usuarios/modals/components/SectionTitle.tsx

import { Typography } from '@mui/material';
import React from 'react';

interface SectionTitleProps {
    icon: React.ReactNode;
    children: React.ReactNode;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ icon, children }) => (
    <Typography sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800,
        color: 'text.secondary', fontSize: '0.65rem', mb: 1,
    }}>
        {icon}{children}
    </Typography>
);

export default SectionTitle;