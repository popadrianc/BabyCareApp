import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { babyApi } from '../services/api';
import { Baby, BabyCreate } from '../types';
import { useAuth } from './AuthContext';

interface BabyContextType {
  baby: Baby | null;
  babies: Baby[];
  isLoading: boolean;
  setBaby: (baby: Baby | null) => void;
  createBaby: (data: BabyCreate) => Promise<Baby>;
  updateBaby: (babyId: string, data: Partial<BabyCreate>) => Promise<Baby>;
  deleteBaby: (babyId: string) => Promise<void>;
  refreshBabies: () => Promise<void>;
}

const BabyContext = createContext<BabyContextType | undefined>(undefined);

export const useBaby = () => {
  const context = useContext(BabyContext);
  if (!context) {
    throw new Error('useBaby must be used within a BabyProvider');
  }
  return context;
};

interface BabyProviderProps {
  children: ReactNode;
}

export const BabyProvider: React.FC<BabyProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [baby, setBaby] = useState<Baby | null>(null);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshBabies = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const data = await babyApi.getAll();
      setBabies(data);
      
      // Auto-select first baby if none selected
      if (data.length > 0 && !baby) {
        setBaby(data[0]);
      } else if (baby) {
        // Refresh current baby data
        const updated = data.find(b => b.baby_id === baby.baby_id);
        if (updated) {
          setBaby(updated);
        } else if (data.length > 0) {
          setBaby(data[0]);
        } else {
          setBaby(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch babies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshBabies();
    } else {
      setBabies([]);
      setBaby(null);
    }
  }, [isAuthenticated]);

  const createBaby = async (data: BabyCreate): Promise<Baby> => {
    const newBaby = await babyApi.create(data);
    await refreshBabies();
    setBaby(newBaby);
    return newBaby;
  };

  const updateBaby = async (babyId: string, data: Partial<BabyCreate>): Promise<Baby> => {
    const updated = await babyApi.update(babyId, data);
    await refreshBabies();
    return updated;
  };

  const deleteBaby = async (babyId: string): Promise<void> => {
    await babyApi.delete(babyId);
    await refreshBabies();
  };

  return (
    <BabyContext.Provider
      value={{
        baby,
        babies,
        isLoading,
        setBaby,
        createBaby,
        updateBaby,
        deleteBaby,
        refreshBabies,
      }}
    >
      {children}
    </BabyContext.Provider>
  );
};
