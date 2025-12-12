/**
 * useOnboarding Hook
 * Manages onboarding state and completion
 */

import { useState, useEffect } from 'react';

const ONBOARDING_COMPLETE_KEY = 'betapredit_onboarding_complete';
const ONBOARDING_SKIP_KEY = 'betapredit_onboarding_skip';

export function useOnboarding() {
  const [isComplete, setIsComplete] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
    const skipped = localStorage.getItem(ONBOARDING_SKIP_KEY) === 'true';
    
    setIsComplete(completed || skipped);
    setShouldShow(!completed && !skipped);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    setIsComplete(true);
    setShouldShow(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_SKIP_KEY, 'true');
    setIsComplete(true);
    setShouldShow(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    localStorage.removeItem(ONBOARDING_SKIP_KEY);
    setIsComplete(false);
    setShouldShow(true);
  };

  return {
    isComplete,
    shouldShow,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}





