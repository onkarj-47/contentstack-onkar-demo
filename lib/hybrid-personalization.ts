/**
 * Hybrid Personalization System
 * Combines Contentstack Personalize + Lytics for enhanced user experiences
 */

import { getPersonalizationAPI } from './personalization-api';
import { LyticsIntegration, getLyticsInstance } from './lytics-integration';
import { PathforaIntegration, getPathforaInstance } from './pathfora-integration';
import { getUserTopInterests, trackInterestFromBlog } from './user-interests';

export interface HybridUserData {
  contentstackUID?: string;
  lyticsSegments: string[];
  userInterests: string[];
  engagementScore: number;
  lastActivity: string;
  personalizedContent: any[];
}

export class HybridPersonalizationManager {
  private contentstackAPI: any;
  private lyticsAPI: LyticsIntegration | null;
  private pathforaAPI: PathforaIntegration | null;

  constructor() {
    this.contentstackAPI = getPersonalizationAPI();
    this.lyticsAPI = getLyticsInstance();
    this.pathforaAPI = getPathforaInstance();
  }

  /**
   * Track blog view in both systems
   */
  async trackBlogView(blogData: {
    uid: string;
    title: string;
    tags: string[];
    author?: string;
    readTime?: number;
  }): Promise<void> {
    console.log('🔀 Hybrid: Tracking blog view in both systems');

    // Track in Contentstack Personalize
    if (this.contentstackAPI) {
      try {
        await this.contentstackAPI.trackBlogView(blogData.uid, blogData.tags);
        console.log('✅ Hybrid: Contentstack blog view tracked');
      } catch (error) {
        console.error('❌ Hybrid: Contentstack blog view failed:', error);
      }
    }

    // Track in Lytics
    if (this.lyticsAPI) {
      try {
        const userInterests = getUserTopInterests();
        this.lyticsAPI.trackBlogEngagement({
          uid: blogData.uid,
          title: blogData.title,
          tags: blogData.tags,
          author: blogData.author,
          readTime: blogData.readTime,
          userInterests: userInterests
        });
        console.log('✅ Hybrid: Lytics blog engagement tracked');
      } catch (error) {
        console.error('❌ Hybrid: Lytics blog engagement failed:', error);
      }
    }

    // Update local interest tracking
    if (blogData.tags && blogData.tags.length > 0) {
      trackInterestFromBlog(blogData.tags, blogData.uid);
    }
  }

  /**
   * Track newsletter signup in both systems
   */
  async trackNewsletterSignup(email: string, source: string = 'website'): Promise<void> {
    console.log('🔀 Hybrid: Tracking newsletter signup in both systems');

    // Track in Contentstack Personalize
    if (this.contentstackAPI) {
      try {
        await this.contentstackAPI.trackNewsletterSignup(email);
        console.log('✅ Hybrid: Contentstack newsletter signup tracked');
      } catch (error) {
        console.error('❌ Hybrid: Contentstack newsletter signup failed:', error);
      }
    }

    // Track in Lytics
    if (this.lyticsAPI) {
      try {
        this.lyticsAPI.trackNewsletterSignup(email, source);
        console.log('✅ Hybrid: Lytics newsletter signup tracked');
      } catch (error) {
        console.error('❌ Hybrid: Lytics newsletter signup failed:', error);
      }
    }
  }

  /**
   * Sync user data between systems
   */
  async syncUserData(): Promise<HybridUserData | null> {
    try {
      console.log('🔄 Hybrid: Syncing user data between systems');

      // Get user interests from local storage
      const userInterests = getUserTopInterests();
      
      // Get Lytics segments
      let lyticsSegments: string[] = [];
      if (this.lyticsAPI) {
        lyticsSegments = await this.lyticsAPI.getUserSegments();
      }

      // Get Contentstack user UID
      let contentstackUID: string | undefined;
      if (this.contentstackAPI) {
        contentstackUID = this.contentstackAPI.getUserUid();
      }

      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(userInterests, lyticsSegments);

      // Sync data to Contentstack Personalize
      if (this.contentstackAPI && lyticsSegments.length > 0) {
        await this.contentstackAPI.setUserAttributes({
          lytics_segments: lyticsSegments,
          primary_segment: lyticsSegments[0],
          engagement_score: engagementScore,
          hybrid_sync_timestamp: new Date().toISOString()
        });
      }

      // Sync data to Lytics - ALWAYS send interests to build segments
      if (this.lyticsAPI && userInterests.length > 0) {
        // Send comprehensive user data to Lytics
        this.lyticsAPI.sendUserInterests(userInterests, {
          contentstack_uid: contentstackUID,
          engagement_score: engagementScore,
          total_blog_views: this.getTotalBlogViews(),
          user_type: this.getUserType(userInterests, engagementScore),
          skill_level: this.getSkillLevel(engagementScore),
          content_preferences: this.getContentPreferences(userInterests)
        });

        // Also set as attributes for immediate availability
        this.lyticsAPI.setUserAttributes({
          contentstack_interests: userInterests,
          primary_interest: userInterests[0],
          contentstack_uid: contentstackUID,
          engagement_score: engagementScore,
          lytics_sync_timestamp: new Date().toISOString()
        });

        console.log('🔄 Hybrid: Comprehensive user data sent to Lytics for segment creation');
      }

      const hybridData: HybridUserData = {
        contentstackUID,
        lyticsSegments,
        userInterests,
        engagementScore,
        lastActivity: new Date().toISOString(),
        personalizedContent: []
      };

      console.log('✅ Hybrid: User data synced successfully:', hybridData);
      return hybridData;

    } catch (error) {
      console.error('❌ Hybrid: Failed to sync user data:', error);
      return null;
    }
  }

  /**
   * Calculate engagement score based on multiple factors
   */
  private calculateEngagementScore(interests: string[], segments: string[]): number {
    let score = 0;

    // Base score from interests
    score += interests.length * 10;

    // Bonus for segment membership
    score += segments.length * 15;

    // Bonus for specific high-value segments
    const highValueSegments = ['javascript_developers', 'content_creators', 'enterprise_users'];
    const hasHighValueSegment = segments.some(segment => 
      highValueSegments.some(hvs => segment.toLowerCase().includes(hvs))
    );
    
    if (hasHighValueSegment) {
      score += 25;
    }

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Get enhanced recommendations using both systems
   */
  async getEnhancedRecommendations(excludeUids: string[] = []): Promise<any[]> {
    try {
      console.log('🎯 Hybrid: Getting enhanced recommendations');

      // Get user data from both systems
      const hybridData = await this.syncUserData();
      if (!hybridData) {
        return [];
      }

      // Use Lytics segments to enhance Contentstack personalization
      const recommendations: any[] = [];

      // Add segment-specific logic here
      if (hybridData.lyticsSegments.includes('javascript_developers')) {
        console.log('🎯 Hybrid: Applying JavaScript developer recommendations');
        // Enhanced JS content recommendation logic
      }

      if (hybridData.lyticsSegments.includes('high_engagement')) {
        console.log('🎯 Hybrid: Applying high engagement user recommendations');
        // Premium content recommendations
      }

      return recommendations;

    } catch (error) {
      console.error('❌ Hybrid: Failed to get enhanced recommendations:', error);
      return [];
    }
  }

  /**
   * Trigger personalized Pathfora experiences based on hybrid data
   */
  async triggerPersonalizedExperiences(): Promise<void> {
    try {
      if (!this.pathforaAPI || !this.lyticsAPI) {
        return;
      }

      console.log('🎨 Hybrid: Triggering personalized Pathfora experiences');

      // Get user segments and interests
      const segments = await this.lyticsAPI.getUserSegments();
      const interests = getUserTopInterests(3);

      // Create personalized experiences based on segments
      if (segments.includes('javascript_developers') && interests.includes('javascript')) {
        this.pathforaAPI.createCustomWidget({
          id: 'js-dev-special-offer',
          type: 'slideout',
          position: 'bottom-right',
          headline: '🚀 JavaScript Developer Resources',
          message: 'Exclusive tutorials and tools for serious JavaScript developers',
          cta: 'Access Now',
          displayRules: {
            pageViews: 3,
            timeOnPage: 60000 // 1 minute
          }
        }, () => {
          window.location.href = '/blog?search=javascript&level=advanced';
        });
      }

      if (segments.includes('newsletter_subscribers') && interests.length > 2) {
        this.pathforaAPI.createCustomWidget({
          id: 'subscriber-content-update',
          type: 'bar',
          position: 'top',
          headline: '📚 New Content in Your Interests!',
          message: `We've added new ${interests[0]} articles just for you`,
          cta: 'Explore',
          displayRules: {
            pageViews: 1
          }
        }, () => {
          window.location.href = `/blog?search=${encodeURIComponent(interests[0])}`;
        });
      }

    } catch (error) {
      console.error('❌ Hybrid: Failed to trigger personalized experiences:', error);
    }
  }

  /**
   * Track custom event in both systems
   */
  async trackCustomEvent(eventName: string, eventData: Record<string, any>): Promise<void> {
    console.log(`🔀 Hybrid: Tracking custom event '${eventName}' in both systems`);

    // Track in Contentstack (if supported)
    if (this.contentstackAPI) {
      try {
        await this.contentstackAPI.trackEvent({
          type: 'EVENT',
          eventKey: eventName,
          ...eventData
        });
        console.log(`✅ Hybrid: Contentstack custom event '${eventName}' tracked`);
      } catch (error) {
        console.error(`❌ Hybrid: Contentstack custom event '${eventName}' failed:`, error);
      }
    }

    // Track in Lytics
    if (this.lyticsAPI) {
      try {
        this.lyticsAPI.trackEvent(eventName, eventData);
        console.log(`✅ Hybrid: Lytics custom event '${eventName}' tracked`);
      } catch (error) {
        console.error(`❌ Hybrid: Lytics custom event '${eventName}' failed:`, error);
      }
    }
  }

  /**
   * Get total blog views from local storage
   */
  private getTotalBlogViews(): number {
    try {
      const profile = JSON.parse(localStorage.getItem('user_interest_profile') || '{}');
      return profile.totalBlogViews || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Determine user type based on interests and engagement
   */
  private getUserType(interests: string[], engagementScore: number): string {
    const hasDatabase = interests.some(i => ['database', 'postgresdb', 'mongodb', 'redis', 'sql'].includes(i.toLowerCase()));
    const hasFrontend = interests.some(i => ['frontend', 'react', 'vue', 'angular', 'javascript'].includes(i.toLowerCase()));
    const hasBackend = interests.some(i => ['backend', 'node', 'python', 'java', 'api'].includes(i.toLowerCase()));
    
    if (hasDatabase && hasFrontend && hasBackend) return 'fullstack_developer';
    if (hasDatabase || hasBackend) return 'backend_developer';
    if (hasFrontend) return 'frontend_developer';
    if (interests.some(i => i.toLowerCase().includes('learning'))) return 'learning_focused';
    
    return 'general_developer';
  }

  /**
   * Determine skill level based on engagement score
   */
  private getSkillLevel(engagementScore: number): string {
    if (engagementScore >= 80) return 'advanced';
    if (engagementScore >= 60) return 'intermediate';
    return 'beginner';
  }

  /**
   * Get content preferences based on interests
   */
  private getContentPreferences(interests: string[]): string[] {
    const preferences = [];
    
    if (interests.some(i => i.toLowerCase().includes('tutorial'))) preferences.push('tutorials');
    if (interests.some(i => ['database', 'sql'].includes(i.toLowerCase()))) preferences.push('database_content');
    if (interests.some(i => ['frontend', 'react'].includes(i.toLowerCase()))) preferences.push('frontend_content');
    if (interests.some(i => ['backend', 'api'].includes(i.toLowerCase()))) preferences.push('backend_content');
    
    return preferences.length > 0 ? preferences : ['general_tech'];
  }

  /**
   * Get system status
   */
  getSystemStatus(): {
    contentstack: boolean;
    lytics: boolean;
    pathfora: boolean;
  } {
    return {
      contentstack: !!this.contentstackAPI,
      lytics: !!this.lyticsAPI && this.lyticsAPI.isInitialized(),
      pathfora: !!this.pathforaAPI && this.pathforaAPI.isInitialized()
    };
  }
}

// Singleton instance
let hybridManager: HybridPersonalizationManager | null = null;

/**
 * Get hybrid personalization manager
 */
export function getHybridPersonalizationManager(): HybridPersonalizationManager {
  if (!hybridManager) {
    hybridManager = new HybridPersonalizationManager();
  }
  return hybridManager;
}

/**
 * Initialize hybrid personalization system
 */
export function initHybridPersonalization(): HybridPersonalizationManager {
  console.log('🔀 Initializing Hybrid Personalization System');
  
  const manager = getHybridPersonalizationManager();
  
  // Sync user data on initialization
  setTimeout(() => {
    manager.syncUserData();
    manager.triggerPersonalizedExperiences();
  }, 2000); // Wait 2 seconds for all systems to initialize

  return manager;
}
