import { createContext, useContext, useState, type ReactNode } from 'react';
import { ComingSoonModal } from '../../components/shared/ComingSoonModal';

interface ComingSoonContextValue {
  openComingSoon: (feature: string, description?: string) => void;
}

const ComingSoonContext = createContext<ComingSoonContextValue | undefined>(undefined);

export function ComingSoonProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState('This feature');
  const [description, setDescription] = useState<string | undefined>();

  const openComingSoon = (nextFeature: string, nextDescription?: string) => {
    setFeature(nextFeature);
    setDescription(nextDescription);
    setOpen(true);
  };

  return (
    <ComingSoonContext.Provider value={{ openComingSoon }}>
      {children}
      <ComingSoonModal
        open={open}
        feature={feature}
        description={description}
        onClose={() => setOpen(false)}
      />
    </ComingSoonContext.Provider>
  );
}

export function useComingSoon() {
  const context = useContext(ComingSoonContext);
  if (!context) {
    throw new Error('useComingSoon must be used within ComingSoonProvider');
  }
  return context;
}
