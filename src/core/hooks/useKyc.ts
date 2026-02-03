// frontend/src/hooks/useKyc.ts
import kycService from '@/core/api/services/kyc.service';
import type { KycStatusDTO } from '@/core/types/dto';
import { useState, useEffect } from 'react';


export const useKyc = () => {
  const [status, setStatus] = useState<KycStatusDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const data = await kycService.getStatus();
      setStatus(data);
    } catch (err) {
      console.error("Error fetching KYC status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return { status, loading, refreshStatus: fetchStatus };
};