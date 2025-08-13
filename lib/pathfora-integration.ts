/**
 * Pathfora Integration for Dynamic Personalization
 * Works with Lytics segments and Contentstack personalization
 */

import { LyticsIntegration } from './lytics-integration';
import { getUserTopInterests } from './user-interests';

declare global {
  interface Window {
    pathfora: any;
  }
}

export interface PathforaWidget {
  id: string;
  type: 'slideout' | 'modal' | 'bar' | 'inline';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'bottom-left' | 'bottom-right';
  headline: string;
  message: string;
  cta?: string;
  audience?: string[];
  displayRules?: {
    pageViews?: number;
    timeOnPage?: number;
    exitIntent?: boolean;
    scrollDepth?: number;
    urlContains?: string[];
  };
}

export class PathforaIntegration {
  private initialized: boolean = false;
  private lyticsInstance: LyticsIntegration | null = null;

  constructor(lyticsInstance?: LyticsIntegration | null) {
    this.lyticsInstance = lyticsInstance || null;
  }

  /**
   * Initialize Pathfora
   */
  async initialize(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    try {
      // Load Pathfora script
      await this.loadPathforaScript();
      
      // Wait for Pathfora to be ready
      await this.waitForPathfora();
      
      this.initialized = true;
      console.log('🎨 Pathfora: Initialized successfully');
      
      // Setup default widgets
      this.setupDefaultWidgets();
      
    } catch (error) {
      console.error('🎨 Pathfora: Failed to initialize:', error);
    }
  }

  /**
   * Load Pathfora script
   */
  private loadPathforaScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="pathfora"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://c.lytics.io/static/pathfora.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Pathfora script'));
      
      document.head.appendChild(script);
    });
  }

  /**
   * Wait for Pathfora to be available
   */
  private waitForPathfora(): Promise<void> {
    return new Promise((resolve) => {
      const checkPathfora = () => {
        if (window.pathfora) {
          resolve();
        } else {
          setTimeout(checkPathfora, 100);
        }
      };
      checkPathfora();
    });
  }

  /**
   * Setup default personalized widgets
   */
  setupDefaultWidgets(): void {
    if (!window.pathfora) {
      console.warn('🎨 Pathfora: Not ready for widget setup - skipping for now');
      return;
    }

    // Additional safety check for Pathfora methods
    if (!window.pathfora.Message || !window.pathfora.initializeWidgets) {
      console.warn('🎨 Pathfora: Required methods not available - skipping widget setup');
      return;
    }

    console.log('🎨 Pathfora: All checks passed, setting up widgets');

    // Get user interests for personalization
    const userInterests = getUserTopInterests(3);
    
    // Setup interest-based recommendation widget
    if (userInterests.length > 0) {
      this.createInterestBasedWidget(userInterests[0]);
    }

    // Setup newsletter widget for engaged users
    this.createNewsletterWidget();

    // Setup exit-intent widget
    this.createExitIntentWidget();
  }

  /**
   * Create interest-based recommendation widget
   */
  createInterestBasedWidget(primaryInterest: string): void {
    if (!window.pathfora || !window.pathfora.Message) {
      console.warn('🎨 Pathfora: Script not ready for createInterestBasedWidget');
      return;
    }

    const widget = new window.pathfora.Message({
      id: 'interest-recommendations',
      layout: 'slideout',
      position: 'bottom-right',
      variant: 'primary',
      headline: `🎯 More ${primaryInterest.charAt(0).toUpperCase() + primaryInterest.slice(1)} Content`,
      msg: `Discover the latest ${primaryInterest} articles and tutorials curated just for you.`,
      confirmAction: {
        name: 'Explore Now',
        callback: () => {
          // Track engagement
          if (this.lyticsInstance) {
            this.lyticsInstance.trackInterestInteraction(primaryInterest, 'widget_click');
          }
          
          // Navigate to filtered content
          window.location.href = `/blog?search=${encodeURIComponent(primaryInterest)}`;
        }
      },
      cancelAction: {
        name: 'Maybe Later',
        callback: () => {
          if (this.lyticsInstance) {
            this.lyticsInstance.trackInterestInteraction(primaryInterest, 'widget_dismiss');
          }
        }
      },
      displayConditions: {
        impressions: {
          session: 1, // Max 1 per session
          lifetime: 3  // Max 3 total
        },
        pageViews: 2, // Show after 2 page views
        hideAfter: {
          days: 7 // Don't show again for 7 days if dismissed
        }
      },
      colors: {
        background: '#4F46E5',
        header: '#4F46E5',
        text: '#FFFFFF'
      }
    });

    if (window.pathfora && window.pathfora.initializeWidgets) {
      window.pathfora.initializeWidgets([widget]);
      console.log('🎨 Pathfora: Interest-based widget created for:', primaryInterest);
    } else {
      console.warn('🎨 Pathfora: initializeWidgets not available');
    }
  }

  /**
   * Create newsletter signup widget
   */
  createNewsletterWidget(): void {
    if (!window.pathfora || !window.pathfora.Message) {
      console.warn('🎨 Pathfora: Script not ready for createNewsletterWidget');
      return;
    }

    const widget = new window.pathfora.Message({
      id: 'newsletter-signup',
      layout: 'modal',
      variant: 'primary',
      headline: '📧 Stay Updated!',
      msg: 'Get personalized insights and the latest articles delivered to your inbox weekly.',
      form: {
        email: {
          placeholder: 'Enter your email address',
          required: true,
          type: 'email'
        }
      },
      confirmAction: {
        name: 'Subscribe Now',
        callback: (formData: any) => {
          console.log('🎨 Pathfora: Newsletter signup:', formData.email);
          
          // Track with Lytics
          if (this.lyticsInstance) {
            this.lyticsInstance.trackNewsletterSignup(formData.email, 'pathfora_modal');
          }
          
          // Call existing newsletter API
          this.handleNewsletterSignup(formData.email);
        }
      },
      displayConditions: {
        impressions: {
          session: 1,
          lifetime: 2
        },
        pageViews: 4, // Show after 4 page views
        timeDelay: 30000, // Wait 30 seconds
        hideAfter: {
          days: 30 // Don't show again for 30 days if dismissed
        }
      },
      colors: {
        background: '#059669',
        header: '#059669',
        text: '#FFFFFF'
      }
    });

    if (window.pathfora && window.pathfora.initializeWidgets) {
      window.pathfora.initializeWidgets([widget]);
      console.log('🎨 Pathfora: Newsletter widget created');
    } else {
      console.warn('🎨 Pathfora: initializeWidgets not available for newsletter widget');
    }
  }

  /**
   * Create exit-intent widget
   */
  createExitIntentWidget(): void {
    if (!window.pathfora || !window.pathfora.Message) {
      console.warn('🎨 Pathfora: Script not ready for createExitIntentWidget');
      return;
    }

    const userInterests = getUserTopInterests(1);
    const primaryInterest = userInterests[0] || 'development';

    const widget = new window.pathfora.Message({
      id: 'exit-intent-offer',
      layout: 'modal',
      variant: 'primary',
      headline: '⏰ Wait! Before You Go...',
      msg: `Don't miss out on the latest ${primaryInterest} insights. Join our community!`,
      confirmAction: {
        name: 'Show Me More',
        callback: () => {
          if (this.lyticsInstance) {
            this.lyticsInstance.trackEvent('exit_intent_conversion', {
              interest: primaryInterest,
              action: 'explore_more'
            });
          }
          window.location.href = `/blog?search=${encodeURIComponent(primaryInterest)}`;
        }
      },
      cancelAction: {
        name: 'No Thanks',
        callback: () => {
          if (this.lyticsInstance) {
            this.lyticsInstance.trackEvent('exit_intent_dismiss', {
              interest: primaryInterest
            });
          }
        }
      },
      displayConditions: {
        impressions: {
          session: 1,
          lifetime: 1
        },
        exitIntent: true,
        timeOnPage: 30000, // Been on page for 30+ seconds
        hideAfter: {
          days: 14 // Don't show again for 14 days
        }
      },
      colors: {
        background: '#DC2626',
        header: '#DC2626',
        text: '#FFFFFF'
      }
    });

    if (window.pathfora && window.pathfora.initializeWidgets) {
      window.pathfora.initializeWidgets([widget]);
      console.log('🎨 Pathfora: Exit-intent widget created');
    } else {
      console.warn('🎨 Pathfora: initializeWidgets not available for exit-intent widget');
    }
  }

  /**
   * Handle newsletter signup through existing API
   */
  private async handleNewsletterSignup(email: string): Promise<void> {
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message
        this.showSuccessMessage('🎉 Successfully subscribed! Check your email.');
      } else {
        this.showErrorMessage(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('🎨 Pathfora: Newsletter signup error:', error);
      this.showErrorMessage('Something went wrong. Please try again.');
    }
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    const successWidget = new window.pathfora.Message({
      id: 'success-message',
      layout: 'bar',
      position: 'top',
      variant: 'success',
      headline: message,
      confirmAction: {
        name: 'Close',
        callback: () => {
          window.pathfora.clearAll();
        }
      },
      displayConditions: {
        hideAfter: {
          seconds: 5 // Auto-hide after 5 seconds
        }
      }
    });

    window.pathfora.initializeWidgets([successWidget]);
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    const errorWidget = new window.pathfora.Message({
      id: 'error-message',
      layout: 'bar',
      position: 'top',
      variant: 'danger',
      headline: message,
      confirmAction: {
        name: 'Close',
        callback: () => {
          window.pathfora.clearAll();
        }
      },
      displayConditions: {
        hideAfter: {
          seconds: 5
        }
      }
    });

    window.pathfora.initializeWidgets([errorWidget]);
  }

  /**
   * Create custom widget
   */
  createCustomWidget(config: PathforaWidget, callback?: () => void): void {
    if (!window.pathfora) {
      console.warn('🎨 Pathfora: Not ready for custom widget');
      return;
    }

    const widget = new window.pathfora.Message({
      id: config.id,
      layout: config.type,
      position: config.position,
      headline: config.headline,
      msg: config.message,
      confirmAction: {
        name: config.cta || 'Continue',
        callback: callback || (() => {})
      },
      displayConditions: config.displayRules || {}
    });

    window.pathfora.initializeWidgets([widget]);
    console.log('🎨 Pathfora: Custom widget created:', config.id);
  }

  /**
   * Clear all widgets
   */
  clearAllWidgets(): void {
    if (window.pathfora) {
      window.pathfora.clearAll();
      console.log('🎨 Pathfora: All widgets cleared');
    }
  }

  /**
   * Check if Pathfora is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
let pathforaInstance: PathforaIntegration | null = null;

  /**
   * Initialize Pathfora integration
   */
  export function initPathfora(lyticsInstance?: LyticsIntegration | null): PathforaIntegration | null {
    if (typeof window === 'undefined') {
      return null;
    }

    if (pathforaInstance) {
      return pathforaInstance;
    }

    const pathforaEnabled = process.env.NEXT_PUBLIC_PATHFORA_ENABLED === 'true';
    
    if (!pathforaEnabled) {
      console.log('🎨 Pathfora: Disabled in environment variables');
      return null;
    }

    // Check if we have a valid Lytics Account ID  
    const accountId = process.env.NEXT_PUBLIC_LYTICS_ACCOUNT_ID;
    if (!accountId) {
      console.warn('🎨 Pathfora: No Lytics Account ID found - Pathfora requires Lytics');
      return null;
    }

    pathforaInstance = new PathforaIntegration(lyticsInstance);
    
    // Initialize asynchronously
    pathforaInstance.initialize().catch(error => {
      console.warn('🎨 Pathfora: Failed to initialize, continuing without Pathfora widgets:', error);
    });

    return pathforaInstance;
  }

/**
 * Get Pathfora instance
 */
export function getPathforaInstance(): PathforaIntegration | null {
  return pathforaInstance;
}
