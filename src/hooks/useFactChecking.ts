import { useState, useCallback } from 'react';
import { factCheckingService, FactCheckResult } from '@/lib/fact-checking';
import type { ModelSettingsState } from '@/components/ModelSettings';

interface UseFactCheckingProps {
  settings: ModelSettingsState;
}

export const useFactChecking = ({ settings }: UseFactCheckingProps) => {
  const [checkingStates, setCheckingStates] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, FactCheckResult>>({});

  const checkClaim = useCallback(async (claim: string) => {
    if (!settings.factChecking.enabled) {
      return;
    }

    setCheckingStates(prev => ({ ...prev, [claim]: true }));

    try {
      const result = await factCheckingService.verifyClaim(claim);
      
      // In strict mode, require higher confidence and multiple sources
      if (settings.factChecking.strictMode) {
        result.isVerified = result.isVerified && 
          result.confidence >= 0.8 && 
          result.sources.length >= 2;
      } else {
        result.isVerified = result.isVerified && 
          result.confidence >= settings.factChecking.minConfidence;
      }

      setResults(prev => ({ ...prev, [claim]: result }));
    } catch (error) {
      console.error('Error checking claim:', error);
      setResults(prev => ({
        ...prev,
        [claim]: {
          isVerified: false,
          confidence: 0,
          sources: [],
          explanation: 'Error occurred during verification'
        }
      }));
    } finally {
      setCheckingStates(prev => ({ ...prev, [claim]: false }));
    }
  }, [settings]);

  const findAlternativeSources = useCallback(async (claim: string) => {
    const alternativeSources = await factCheckingService.findAlternativeSources(claim);
    setResults(prev => ({
      ...prev,
      [claim]: {
        ...prev[claim],
        alternativeSources
      }
    }));
  }, []);

  return {
    checkClaim,
    findAlternativeSources,
    isChecking: checkingStates,
    results
  };
};

export default useFactChecking;
