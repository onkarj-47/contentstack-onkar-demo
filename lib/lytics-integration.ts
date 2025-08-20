/**
 * Lytics Integration for Insight Hub
 * Hybrid approach: Enhances existing Contentstack personalization with Lytics CDP
 */

// Lytics script loader and configuration
export interface LyticsConfig {
  accountId: string;
  domain?: string;
  cookie?: string;
  sessionTimeout?: number;
}

// Lytics user profile interface
export interface LyticsProfile {
  id: string;
  segments: string[];
  attributes: Record<string, any>;
  scores: Record<string, number>;
  lastUpdated: string;
}

// Lytics event interface
export interface LyticsEvent {
  stream: string;
  data: Record<string, any>;
  timestamp?: string;
}

declare global {
  interface Window {
    jstag: any;
    pathfora: any;
  }
}

export class LyticsIntegration {
  private config: LyticsConfig;
  private initialized: boolean = false;

  constructor(config: LyticsConfig) {
    this.config = config;
  }

  /**
   * Initialize Lytics tracking using official JStag
   */
  async initialize(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    try {
      // Initialize JStag using the official snippet
      this.initializeJStag();
      
      this.initialized = true;
      console.log('🎯 Lytics Integration: JStag initialized successfully');
      
      // Send initial page view
      this.trackPageView();
      
    } catch (error) {
      console.warn('🎯 Lytics Integration: Failed to initialize JStag, continuing without tracking:', error);
      // Still mark as initialized to prevent retries
      this.initialized = true;
    }
  }

  /**
   * Initialize JStag using TypeScript-safe approach
   */
  private initializeJStag(): void {
    if (window.jstag) {
      console.log('🎯 Lytics: JStag already initialized');
      return;
    }

    try {
      // Initialize JStag queue-based system (TypeScript compatible)
      const jstagQueue: any[] = [];
      
      // Create JStag object with queue system
      window.jstag = window.jstag || {};
      
      // Add method placeholders that queue calls
      const methods = ['send', 'mock', 'identify', 'pageView', 'unblock', 'getid', 'setid', 'loadEntity', 'getEntity', 'on', 'once', 'call'];
      
      methods.forEach(method => {
        window.jstag[method] = function(...args: any[]) {
          jstagQueue.push([method, args]);
        };
      });

      // Add script loader
      window.jstag.loadScript = function(src: string, onload?: () => void, onerror?: (error: any) => void) {
        const script = document.createElement('script');
        script.async = true;
        script.src = src;
        if (onload) script.onload = onload;
        if (onerror) script.onerror = onerror;
        
        const firstScript = document.getElementsByTagName('script')[0];
        const parent = firstScript?.parentNode || document.head || document.body;
        const target = firstScript || parent.lastChild;
        
        if (target) {
          parent.insertBefore(script, target);
        } else {
          parent.appendChild(script);
        }
        
        return window.jstag;
      };

      // Add init method
      window.jstag.init = function(config: any) {
        window.jstag.config = config;
        
        return window.jstag.loadScript(config.src, function() {
          // Process queued calls when real JStag loads
          jstagQueue.forEach(([method, args]) => {
            if (window.jstag[method]) {
              window.jstag[method].apply(window.jstag, args);
            }
          });
          // Clear queue
          jstagQueue.length = 0;
        }, function(error: any) {
          console.warn('🎯 Lytics: Script load error:', error);
        });
      };
      
      // Initialize with our account ID
      window.jstag.init({
        src: `https://c.lytics.io/api/tag/${this.config.accountId}/latest.min.js`
      });

      console.log('🎯 Lytics: JStag initialized with account:', this.config.accountId);
    } catch (error) {
      console.warn('🎯 Lytics: JStag initialization failed:', error);
      // Create a mock jstag for fallback
      window.jstag = {
        pageView: () => console.log('🎯 Lytics: Mock pageView'),
        identify: () => console.log('🎯 Lytics: Mock identify'),
        send: () => console.log('🎯 Lytics: Mock send'),
        init: () => console.log('🎯 Lytics: Mock init')
      };
    }
  }

  /**
   * Track page view with enhanced context
   */
  trackPageView(additionalData?: Record<string, any>): void {
    if (!this.initialized) {
      console.warn('🎯 Lytics: Not initialized, queuing page view');
    }

    const pageData = {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    try {
      if (window.jstag && window.jstag.pageView) {
        window.jstag.pageView(pageData);
        console.log('🎯 Lytics: Page view tracked via JStag:', pageData);
      } else {
        console.warn('🎯 Lytics: JStag not available for page view tracking');
      }
    } catch (error) {
      console.warn('🎯 Lytics: Failed to track page view:', error);
    }
  }

  /**
   * Track blog engagement with rich context
   */
  trackBlogEngagement(blogData: {
    uid: string;
    title: string;
    tags: string[];
    author?: string;
    readTime?: number;
    completion?: number;
    userInterests?: string[];
  }): void {
    const eventData = {
      content_uid: blogData.uid,
      content_title: blogData.title,
      content_tags: blogData.tags,
      content_author: blogData.author,
      read_time_seconds: blogData.readTime || 0,
      completion_percentage: blogData.completion || 0,
      user_interests: blogData.userInterests || [],
      content_type: 'blog_post',
      timestamp: new Date().toISOString()
    };

    try {
      if (window.jstag && window.jstag.send) {
        window.jstag.send('blog_engagement', eventData);
        console.log('🎯 Lytics: Blog engagement tracked via JStag:', eventData);
      } else {
        console.warn('🎯 Lytics: JStag not available for blog engagement tracking');
      }
    } catch (error) {
      console.warn('🎯 Lytics: Failed to track blog engagement:', error);
    }
  }

  /**
   * Track newsletter signup
   */
  trackNewsletterSignup(email: string, source: string = 'website'): void {
    const eventData = {
      email: email,
      source: source,
      signup_timestamp: new Date().toISOString(),
      page_url: window.location.href
    };

    // Set user email attribute and track signup
    try {
      if (window.jstag) {
        if (window.jstag.identify) {
          window.jstag.identify({ email: email });
        }
        if (window.jstag.send) {
          window.jstag.send('newsletter_signup', eventData);
        }
        console.log('🎯 Lytics: Newsletter signup tracked via JStag:', eventData);
      } else {
        console.warn('🎯 Lytics: JStag not available for newsletter signup tracking');
      }
    } catch (error) {
      console.warn('🎯 Lytics: Failed to track newsletter signup:', error);
    }
  }

  /**
   * Track interest interaction
   */
  trackInterestInteraction(interest: string, action: string): void {
    const eventData = {
      interest: interest,
      action: action, // 'view', 'click', 'dismiss', etc.
      timestamp: new Date().toISOString(),
      page_context: window.location.pathname
    };

    try {
      if (window.jstag && window.jstag.send) {
        window.jstag.send('interest_interaction', eventData);
        console.log('🎯 Lytics: Interest interaction tracked via JStag:', eventData);
      } else {
        console.warn('🎯 Lytics: JStag not available for interest interaction tracking');
      }
    } catch (error) {
      console.warn('🎯 Lytics: Failed to track interest interaction:', error);
    }
  }

  /**
   * Get user profile from Lytics
   */
  async getUserProfile(): Promise<LyticsProfile | null> {
    try {
      if (!window.jstag || !window.jstag.getEntity) {
        console.warn('🎯 Lytics: JStag not ready for profile fetch');
        return null;
      }

      const profile = await window.jstag.getEntity('user');
      
      if (profile) {
        console.log('🎯 Lytics: User profile fetched via JStag:', profile);
        return {
          id: profile.id || '',
          segments: profile.segments || [],
          attributes: profile.attributes || {},
          scores: profile.scores || {},
          lastUpdated: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error('🎯 Lytics: Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Get user segments
   */
  async getUserSegments(): Promise<string[]> {
    const profile = await this.getUserProfile();
    return profile?.segments || [];
  }

  /**
   * Set user attributes
   */
  setUserAttributes(attributes: Record<string, any>): void {
    try {
      if (window.jstag) {
        // Set user attributes using identify
        if (window.jstag.identify) {
          window.jstag.identify(attributes);
          console.log('🎯 Lytics: User attributes set via identify:', attributes);
        }
        
        // Also send as a custom event to ensure Lytics processes the data
        if (window.jstag.send) {
          window.jstag.send('user_attributes_updated', {
            ...attributes,
            timestamp: new Date().toISOString(),
            source: 'hybrid_personalization'
          });
          console.log('🎯 Lytics: User attributes sent as event for processing');
        }
      } else {
        console.warn('🎯 Lytics: JStag not available for setting user attributes');
      }
    } catch (error) {
      console.warn('🎯 Lytics: Failed to set user attributes:', error);
    }
  }

  /**
   * Send user interests to Lytics for segment creation
   */
  sendUserInterests(interests: string[], additionalData: Record<string, any> = {}): void {
    if (!interests || interests.length === 0) {
      console.warn('🎯 Lytics: No interests to send');
      return;
    }

    try {
      const interestData = {
        user_interests: interests,
        primary_interest: interests[0],
        total_interests: interests.length,
        interest_categories: this.categorizeInterests(interests),
        ...additionalData,
        timestamp: new Date().toISOString(),
        source: 'interest_tracking'
      };

      if (window.jstag) {
        // Send as user attributes
        if (window.jstag.identify) {
          window.jstag.identify(interestData);
        }
        
        // Send as custom event for immediate processing
        if (window.jstag.send) {
          window.jstag.send('user_interests_updated', interestData);
        }
        
        console.log('🎯 Lytics: User interests sent successfully:', interestData);
      } else {
        console.warn('🎯 Lytics: JStag not available for sending interests');
      }
    } catch (error) {
      console.error('🎯 Lytics: Failed to send user interests:', error);
    }
  }

  /**
   * Categorize interests for better segmentation
   */
  private categorizeInterests(interests: string[]): Record<string, string[]> {
    const categories = {
      database: ['database', 'postgresdb', 'mongodb', 'redis', 'sql'],
      frontend: ['frontend', 'react', 'vue', 'angular', 'javascript', 'typescript'],
      backend: ['backend', 'node', 'python', 'java', 'api'],
      cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes'],
      tools: ['prisma', 'firebase', 'git'],
      learning: ['tutorials & learning', 'documentation', 'guides']
    };

    const result: Record<string, string[]> = {};
    
    Object.entries(categories).forEach(([category, keywords]) => {
      const matchingInterests = interests.filter(interest => 
        keywords.some(keyword => 
          interest.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      if (matchingInterests.length > 0) {
        result[category] = matchingInterests;
      }
    });

    return result;
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, eventData: Record<string, any>): void {
    const enrichedData = {
      ...eventData,
      timestamp: new Date().toISOString(),
      page_context: window.location.pathname
    };

    try {
      if (window.jstag && window.jstag.send) {
        window.jstag.send(eventName, enrichedData);
        console.log(`🎯 Lytics: Custom event '${eventName}' tracked via JStag:`, enrichedData);
      } else {
        console.warn(`🎯 Lytics: JStag not available for tracking event '${eventName}'`);
      }
    } catch (error) {
      console.warn(`🎯 Lytics: Failed to track custom event '${eventName}':`, error);
    }
  }

  /**
   * Check if Lytics is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
let lyticsInstance: LyticsIntegration | null = null;

/**
 * Initialize Lytics integration
 */
export function initLytics(): LyticsIntegration | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (lyticsInstance) {
    return lyticsInstance;
  }

  const accountId = process.env.NEXT_PUBLIC_LYTICS_ACCOUNT_ID;
  const jsToken = process.env.NEXT_PUBLIC_LYTICS_JS_TOKEN;
  const apiKey = process.env.LYTICS_API_KEY;
  
  if (!accountId) {
    console.warn('🎯 Lytics: Account ID not found in environment variables');
    return null;
  }

  // Use JS Token if available, otherwise try API Key, otherwise use Account ID only
  const token = jsToken || apiKey || null;
  
  if (!token) {
    console.warn('🎯 Lytics: No token found - trying Account ID only mode');
  }

  lyticsInstance = new LyticsIntegration({
    accountId: accountId,
    domain: window.location.hostname
  });

  // Initialize asynchronously
  lyticsInstance.initialize();

  return lyticsInstance;
}

/**
 * Get Lytics instance
 */
export function getLyticsInstance(): LyticsIntegration | null {
  return lyticsInstance;
}
