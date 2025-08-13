/**
 * System Status Check for Insight Hub
 * Provides debugging information about personalization services
 */

declare global {
  interface Window {
    jstag: any;
    pathfora: any;
  }
}

export interface SystemStatus {
  contentstack: {
    enabled: boolean;
    apiKey: boolean;
    environment: boolean;
    deliveryToken: boolean;
  };
  lytics: {
    enabled: boolean;
    accountId: boolean;
    scriptLoaded: boolean;
    initialized: boolean;
  };
  pathfora: {
    enabled: boolean;
    scriptLoaded: boolean;
    initialized: boolean;
  };
  personalization: {
    fallbackActive: boolean;
    userDataAvailable: boolean;
    widgetsActive: boolean;
  };
}

/**
 * Check the status of all personalization systems
 */
export function getSystemStatus(): SystemStatus {
  const status: SystemStatus = {
    contentstack: {
      enabled: false,
      apiKey: false,
      environment: false,
      deliveryToken: false
    },
    lytics: {
      enabled: false,
      accountId: false,
      scriptLoaded: false,
      initialized: false
    },
    pathfora: {
      enabled: false,
      scriptLoaded: false,
      initialized: false
    },
    personalization: {
      fallbackActive: false,
      userDataAvailable: false,
      widgetsActive: false
    }
  };

  // Check Contentstack configuration
  if (typeof window !== 'undefined') {
    status.contentstack.apiKey = !!process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY;
    status.contentstack.environment = !!process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT;
    status.contentstack.deliveryToken = !!process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN;
    status.contentstack.enabled = status.contentstack.apiKey && 
                                 status.contentstack.environment && 
                                 status.contentstack.deliveryToken;

    // Check Lytics
    status.lytics.accountId = !!process.env.NEXT_PUBLIC_LYTICS_ACCOUNT_ID;
    status.lytics.scriptLoaded = !!window.jstag;
    status.lytics.initialized = status.lytics.scriptLoaded && window.jstag.pageView;
    status.lytics.enabled = status.lytics.accountId;

    // Check Pathfora
    status.pathfora.scriptLoaded = !!window.pathfora;
    status.pathfora.initialized = !!(window.pathfora && window.pathfora.initializeWidgets);
    status.pathfora.enabled = status.pathfora.initialized;

    // Check personalization status
    status.personalization.userDataAvailable = !!localStorage.getItem('userInterests');
    status.personalization.fallbackActive = document.querySelector('.pathfora-fallback-widget') !== null;
    status.personalization.widgetsActive = status.pathfora.enabled || status.personalization.fallbackActive;
  }

  return status;
}

/**
 * Log system status to console with formatting
 */
export function logSystemStatus(): void {
  if (typeof window === 'undefined') {
    console.log('🔍 System Status: Server-side, skipping status check');
    return;
  }

  const status = getSystemStatus();
  
  console.group('🔍 Insight Hub System Status');
  
  // Contentstack Status
  console.group('📚 Contentstack');
  console.log(`✅ Enabled: ${status.contentstack.enabled}`);
  console.log(`🔑 API Key: ${status.contentstack.apiKey ? '✅' : '❌'}`);
  console.log(`🌍 Environment: ${status.contentstack.environment ? '✅' : '❌'}`);
  console.log(`🎫 Delivery Token: ${status.contentstack.deliveryToken ? '✅' : '❌'}`);
  console.groupEnd();

  // Lytics Status
  console.group('🎯 Lytics');
  console.log(`✅ Enabled: ${status.lytics.enabled}`);
  console.log(`🆔 Account ID: ${status.lytics.accountId ? '✅' : '❌'}`);
  console.log(`📜 Script Loaded: ${status.lytics.scriptLoaded ? '✅' : '❌'}`);
  console.log(`🚀 Initialized: ${status.lytics.initialized ? '✅' : '❌'}`);
  console.groupEnd();

  // Pathfora Status
  console.group('🎨 Pathfora');
  console.log(`✅ Enabled: ${status.pathfora.enabled}`);
  console.log(`📜 Script Loaded: ${status.pathfora.scriptLoaded ? '✅' : '❌'}`);
  console.log(`🚀 Initialized: ${status.pathfora.initialized ? '✅' : '❌'}`);
  console.groupEnd();

  // Personalization Status
  console.group('🔮 Personalization');
  console.log(`👤 User Data: ${status.personalization.userDataAvailable ? '✅' : '❌'}`);
  console.log(`🆘 Fallback Active: ${status.personalization.fallbackActive ? '✅' : '❌'}`);
  console.log(`🎪 Widgets Active: ${status.personalization.widgetsActive ? '✅' : '❌'}`);
  console.groupEnd();

  console.groupEnd();

  // Overall assessment
  const hasErrors = !status.contentstack.enabled || 
                   (!status.lytics.initialized && status.lytics.enabled) ||
                   (!status.pathfora.enabled && !status.personalization.fallbackActive);

  if (hasErrors) {
    console.warn('⚠️ Some systems have issues but demo should still work with fallbacks');
  } else {
    console.log('🎉 All systems operational!');
  }
}

/**
 * Get a summary of system health
 */
export function getSystemHealth(): 'healthy' | 'degraded' | 'offline' {
  const status = getSystemStatus();
  
  // Check if core functionality is working
  const coreWorking = status.contentstack.enabled && 
                     (status.personalization.widgetsActive || status.personalization.fallbackActive);
  
  if (!coreWorking) {
    return 'offline';
  }
  
  // Check if all systems are optimal
  const allOptimal = status.contentstack.enabled && 
                    status.lytics.initialized && 
                    status.pathfora.enabled;
  
  if (allOptimal) {
    return 'healthy';
  }
  
  return 'degraded';
}
