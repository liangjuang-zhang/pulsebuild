/**
 * Bottom Sheet Provider - Manages bottom sheet state
 */
import { createContext, useContext, useState, type ReactNode } from 'react';

interface BottomSheetContextValue {
  activeSheetId: string | null;
  openSheet: (sheetId: string) => void;
  closeSheet: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextValue | undefined>(undefined);

export function useBottomSheet(): BottomSheetContextValue {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error('useBottomSheet must be used within BottomSheetProvider');
  }
  return context;
}

export function BottomSheetProvider({ children }: { children: ReactNode }) {
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);

  const openSheet = (sheetId: string) => setActiveSheetId(sheetId);
  const closeSheet = () => setActiveSheetId(null);

  return (
    <BottomSheetContext.Provider value={{ activeSheetId, openSheet, closeSheet }}>
      {children}
    </BottomSheetContext.Provider>
  );
}