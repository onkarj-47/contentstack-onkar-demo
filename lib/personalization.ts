// Personalization utility functions for managing user preferences and email storage

export interface PersonalizationData {
  email: string;
  consent: boolean;
  timestamp: string;
}

export interface PersonalizationPreferences {
  email?: string;
  hasConsent: boolean;
  isDismissed: boolean;
  isMaybeLater: boolean;
  timestamp?: string;
}

/**
 * Get personalization data from localStorage
 */
export function getPersonalizationData(): PersonalizationPreferences {
  console.log("📋 getPersonalizationData: Starting...");
  
  if (typeof window === 'undefined') {
    console.log("📋 getPersonalizationData: Window undefined (SSR), returning defaults");
    return {
      hasConsent: false,
      isDismissed: false,
      isMaybeLater: false,
    };
  }

  const email = localStorage.getItem('personalization_email');
  const consent = localStorage.getItem('personalization_consent') === 'true';
  const isDismissed = localStorage.getItem('personalization_banner_dismissed') === 'true';
  const timestamp = localStorage.getItem('personalization_timestamp');
  
  // Check if "maybe later" is still active
  const maybeLaterDate = localStorage.getItem('personalization_maybe_later');
  const isMaybeLater = maybeLaterDate ? new Date(maybeLaterDate) > new Date() : false;

  const result = {
    email: email || undefined,
    hasConsent: consent,
    isDismissed,
    isMaybeLater,
    timestamp: timestamp || undefined,
  };

  console.log("📋 getPersonalizationData: Raw localStorage data", {
    email,
    consent,
    isDismissed,
    maybeLaterDate,
    isMaybeLater,
    timestamp
  });
  
  console.log("📋 getPersonalizationData: Returning", result);
  return result;
}

/**
 * Store personalization email and consent
 */
export function setPersonalizationEmail(email: string): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('personalization_email', email);
  localStorage.setItem('personalization_consent', 'true');
  localStorage.setItem('personalization_timestamp', new Date().toISOString());
  
  // Remove any previous dismissals
  localStorage.removeItem('personalization_banner_dismissed');
  localStorage.removeItem('personalization_maybe_later');
}

/**
 * Clear all personalization data (opt-out)
 */
export function clearPersonalizationData(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('personalization_email');
  localStorage.removeItem('personalization_consent');
  localStorage.removeItem('personalization_timestamp');
  localStorage.removeItem('personalization_banner_dismissed');
  localStorage.removeItem('personalization_maybe_later');
  localStorage.removeItem('personalization_dismissed_timestamp');
}

/**
 * Dismiss personalization banner permanently
 */
export function dismissPersonalizationBanner(): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('personalization_banner_dismissed', 'true');
  localStorage.setItem('personalization_dismissed_timestamp', new Date().toISOString());
  localStorage.removeItem('personalization_maybe_later');
}

/**
 * Set "maybe later" for personalization (7 days)
 */
export function setPersonalizationMaybeLater(): void {
  if (typeof window === 'undefined') return;

  const dismissUntil = new Date();
  dismissUntil.setDate(dismissUntil.getDate() + 7);
  localStorage.setItem('personalization_maybe_later', dismissUntil.toISOString());
}

/**
 * Check if user should see personalization banner
 */
export function shouldShowPersonalizationBanner(): boolean {
  console.log("📋 shouldShowPersonalizationBanner: Checking...");
  const data = getPersonalizationData();
  
  console.log("📋 shouldShowPersonalizationBanner: Data", data);
  
  // Don't show if user already has email/consent
  if (data.email && data.hasConsent) {
    console.log("📋 shouldShowPersonalizationBanner: User has email and consent, returning false");
    return false;
  }
  
  // Don't show if permanently dismissed
  if (data.isDismissed) {
    console.log("📋 shouldShowPersonalizationBanner: Banner permanently dismissed, returning false");
    return false;
  }
  
  // Don't show if in "maybe later" period
  if (data.isMaybeLater) {
    console.log("📋 shouldShowPersonalizationBanner: In 'maybe later' period, returning false");
    return false;
  }
  
  console.log("📋 shouldShowPersonalizationBanner: All checks passed, returning true");
  return true;
}

/**
 * Get personalization user ID for tracking
 */
export function getPersonalizationUserId(): string | null {
  const data = getPersonalizationData();
  
  if (data.email && data.hasConsent) {
    // Create a consistent user ID based on email
    return `user_${btoa(data.email).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
  }
  
  return null;
}

/**
 * Check if personalization is active
 */
export function isPersonalizationActive(): boolean {
  const data = getPersonalizationData();
  return !!(data.email && data.hasConsent);
}

/**
 * Get personalization status for debugging
 */
export function getPersonalizationStatus() {
  const data = getPersonalizationData();
  const userId = getPersonalizationUserId();
  const shouldShow = shouldShowPersonalizationBanner();
  
  return {
    ...data,
    userId,
    shouldShowBanner: shouldShow,
    isActive: isPersonalizationActive(),
  };
}