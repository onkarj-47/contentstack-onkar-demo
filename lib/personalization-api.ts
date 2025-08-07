/**
 * Contentstack Personalization Edge API Service
 * Handles user attributes, manifest, and event tracking
 */

export interface PersonalizationConfig {
  baseUrl: string;
  projectUid: string;
  region?: 'US' | 'EU' | 'AU';
}

export interface UserAttribute {
  [key: string]: string | number | boolean;
}

export interface ExperienceVariant {
  experienceShortUid: string;
  variantShortUid: string | null;
}

export interface PersonalizationManifest {
  experiences: ExperienceVariant[];
  userUid?: string;
}

export interface TrackEventPayload {
  type: 'IMPRESSION' | 'EVENT';
  experienceShortUid?: string;
  variantShortUid?: string;
  eventKey?: string;
  userUid?: string;
}

class PersonalizationAPI {
  private config: PersonalizationConfig;
  private userUid?: string;

  constructor(config: PersonalizationConfig) {
    this.config = config;
    // Load existing user UID from localStorage if available
    this.loadUserUidFromStorage();
  }

  /**
   * Get the appropriate base URL for the region
   */
  private getBaseUrl(): string {
    if (this.config.baseUrl) return this.config.baseUrl;
    
    switch (this.config.region) {
      case 'EU':
        return 'https://eu-personalize-edge.contentstack.com';
      case 'AU':
        return 'https://au-personalize-edge.contentstack.com';
      default:
        return 'https://personalize-edge.contentstack.com';
    }
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-project-uid': this.config.projectUid,
    };

    if (this.userUid) {
      headers['x-cs-personalize-user-uid'] = this.userUid;
    }

    return headers;
  }

  /**
   * Set user UID for subsequent requests and persist to localStorage
   */
  setUserUid(userUid: string) {
    this.userUid = userUid;
    // Persist to localStorage for cross-page sharing
    if (typeof window !== 'undefined') {
      localStorage.setItem('contentstack_personalize_user_uid', userUid);
      console.log('🔮 PersonalizationAPI: User UID saved to localStorage:', userUid);
    }
  }

  /**
   * Get the current user UID
   */
  getUserUid(): string | undefined {
    return this.userUid;
  }

  /**
   * Load user UID from localStorage if available
   */
  private loadUserUidFromStorage(): void {
    if (typeof window !== 'undefined') {
      const storedUid = localStorage.getItem('contentstack_personalize_user_uid');
      if (storedUid) {
        this.userUid = storedUid;
        console.log('🔮 PersonalizationAPI: User UID loaded from localStorage:', storedUid);
      }
    }
  }

  /**
   * Get personalization manifest - returns active experiences and variants for user
   */
  async getManifest(): Promise<PersonalizationManifest> {
    console.log('🔮 PersonalizationAPI: Fetching manifest for project:', this.config.projectUid);
    
    const url = `${this.getBaseUrl()}/manifest`;
    const headers = this.getHeaders();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.status}`);
      }

      // Extract user UID from response headers if not set
      const responseUserUid = response.headers.get('x-cs-personalize-user-uid');
      if (responseUserUid && !this.userUid) {
        console.log('🔮 PersonalizationAPI: Got new user UID from response:', responseUserUid);
        this.setUserUid(responseUserUid);
      }

      const data = await response.json();
      console.log('🔮 PersonalizationAPI: Manifest response:', data);

      return {
        experiences: data.experiences || [],
        userUid: this.userUid,
      };
    } catch (error) {
      console.error('🔮 PersonalizationAPI: Error fetching manifest:', error);
      return {
        experiences: [],
        userUid: this.userUid,
      };
    }
  }

  /**
   * Set user attributes for personalization
   */
  async setUserAttributes(attributes: UserAttribute): Promise<boolean> {
    console.log('🔮 PersonalizationAPI: Setting user attributes:', attributes);
    
    if (!this.userUid) {
      console.warn('🔮 PersonalizationAPI: No user UID set, cannot set attributes');
      return false;
    }

    const url = `${this.getBaseUrl()}/user-attributes`;
    const headers = this.getHeaders();

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(attributes),
      });

      if (!response.ok) {
        throw new Error(`Failed to set user attributes: ${response.status}`);
      }

      console.log('🔮 PersonalizationAPI: User attributes set successfully');
      return true;
    } catch (error) {
      console.error('🔮 PersonalizationAPI: Error setting user attributes:', error);
      return false;
    }
  }

  /**
   * Track an event (impression or custom event)
   */
  async trackEvent(payload: TrackEventPayload): Promise<boolean> {
    console.log('🔮 PersonalizationAPI: Tracking event via server API:', payload);
    
    if (!this.userUid) {
      console.warn('🔮 PersonalizationAPI: No user UID set, cannot track event');
      return false;
    }

    try {
      // Use our server-side API route to avoid CORS issues
      const response = await fetch('/api/personalization/track-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([payload]), // Keep array format as expected by Contentstack
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('🔮 PersonalizationAPI: Event tracking failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          endpoint: '/api/personalization/track-event',
          payload: payload
        });
        
        // Log helpful debugging info
        if (response.status === 500) {
          console.error('🔮 PersonalizationAPI: Server error - check personalization configuration');
          console.error('🔮 PersonalizationAPI: Visit /api/personalization/debug for configuration details');
        }
        
        return false;
      }

      const result = await response.json();
      console.log('🔮 PersonalizationAPI: Event tracked successfully via server API:', result);
      return true;
    } catch (error) {
      console.error('🔮 PersonalizationAPI: Error tracking event:', error);
      return false;
    }
  }

  /**
   * Track a blog view impression
   */
  async trackBlogView(blogUid: string, tags: string[] = []): Promise<boolean> {
    console.log('🔮 PersonalizationAPI: Tracking blog view:', { blogUid, tags });
    
    // First, try to set user attributes based on blog tags (this is more likely to work)
    if (tags.length > 0) {
      const attributes: UserAttribute = {};
      tags.forEach(tag => {
        // Convert tag to clean attribute name (e.g., "JavaScript" -> "javascript")
        const attributeKey = tag.toLowerCase().replace(/[^a-z0-9]/g, '_');
        attributes[attributeKey] = true;
      });

      console.log('🔮 PersonalizationAPI: Setting user attributes for blog tags:', attributes);
      try {
        await this.setUserAttributes(attributes);
        console.log('🔮 PersonalizationAPI: Successfully set user attributes for blog tags');
      } catch (error) {
        console.error('🔮 PersonalizationAPI: Error setting user attributes:', error);
      }
    }

    // Try to track custom event for blog view (this might fail if event not configured)
    try {
      console.log('🔮 PersonalizationAPI: Attempting to track blog_view event...');
      const success = await this.trackEvent({
        type: 'EVENT',
        eventKey: 'blog_view',
      });
      
      if (success) {
        console.log('🔮 PersonalizationAPI: Successfully tracked blog_view event');
      }
      return success;
    } catch (error) {
      console.warn('🔮 PersonalizationAPI: Could not track blog_view event (may need to be configured in Contentstack):', error);
      
      // Even if event tracking fails, we still set attributes, so return true
      return true;
    }
  }

  /**
   * Track newsletter signup
   */
  async trackNewsletterSignup(email: string): Promise<boolean> {
    console.log('🔮 PersonalizationAPI: Tracking newsletter signup for:', email);
    
    // Set user email attribute (this is more likely to work)
    try {
      console.log('🔮 PersonalizationAPI: Setting user email attribute');
      await this.setUserAttributes({
        email: email,
        newsletter_subscriber: true,
      });
      console.log('🔮 PersonalizationAPI: Successfully set user email attribute');
    } catch (error) {
      console.error('🔮 PersonalizationAPI: Error setting user email attribute:', error);
    }

    // Track newsletter signup event (this might fail if event not configured)
    try {
      const success = await this.trackEvent({
        type: 'EVENT',
        eventKey: 'newsletter_signup',
      });
      
      if (success) {
        console.log('🔮 PersonalizationAPI: Successfully tracked newsletter_signup event');
      }
      return success;
    } catch (error) {
      console.warn('🔮 PersonalizationAPI: Could not track newsletter_signup event (may need to be configured in Contentstack):', error);
      
      // Even if event tracking fails, we still set attributes, so return true
      return true;
    }
  }
}

// Create singleton instance
let personalizationAPI: PersonalizationAPI | null = null;

/**
 * Initialize personalization API (singleton - reuses existing instance if available)
 */
export function initPersonalizationAPI(config: PersonalizationConfig): PersonalizationAPI {
  console.log('🔮 PersonalizationAPI: Initializing with config:', config);
  
  // If we already have an instance, just return it (singleton pattern)
  if (personalizationAPI) {
    console.log('🔮 PersonalizationAPI: Reusing existing instance');
    return personalizationAPI;
  }
  
  personalizationAPI = new PersonalizationAPI(config);
  console.log('🔮 PersonalizationAPI: Created new instance');
  return personalizationAPI;
}

/**
 * Get personalization API instance
 */
export function getPersonalizationAPI(): PersonalizationAPI | null {
  return personalizationAPI;
}

/**
 * Check if personalization is enabled
 */
export function isPersonalizationEnabled(): boolean {
  return personalizationAPI !== null;
}