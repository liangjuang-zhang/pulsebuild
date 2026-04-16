/**
 * Use Onboarding Progress Hook
 * Determines total steps based on flow variant
 */
import { useMemo } from 'react';
import { useOnboardingStore } from '@/stores/onboarding-store';

const LEGACY_TOTAL_STEPS = 6;
const AUTHENTICATED_TOTAL_STEPS = 4;

export function useOnboardingProgress(step: number) {
  const flowVariant = useOnboardingStore((state) => state.flowVariant);

  return useMemo(() => {
    if (flowVariant === 'authenticated') {
      return {
        currentStep: step,
        totalSteps: AUTHENTICATED_TOTAL_STEPS,
      };
    }

    return {
      currentStep: step,
      totalSteps: LEGACY_TOTAL_STEPS,
    };
  }, [flowVariant, step]);
}