/**
 * Experience Manager - Handles Contentstack Personalize Experiences
 * Fetches user's active experiences and applies personalization logic
 */

import { getPersonalizationAPI } from './personalization-api';

export interface ExperienceVariant {
  experienceShortUid?: string;
  variantShortUid?: string | null;
}

export interface UserExperience {
  experienceShortUid?: string;
  variantShortUid?: string | null;
  experienceName?: string;
  variantName?: string;
}

/**
 * Get user's active experiences from personalization manifest
 */
export async function getUserExperiences(): Promise<UserExperience[]> {
  console.log('🧪 ExperienceManager: Fetching user experiences');
  
  const personalizationAPI = getPersonalizationAPI();
  if (!personalizationAPI) {
    console.log('🧪 ExperienceManager: No personalization API available');
    return [];
  }

  try {
    const manifest = await personalizationAPI.getManifest();
    console.log('🧪 ExperienceManager: Got manifest:', manifest);
    
    // Validate manifest structure
    if (!manifest || !Array.isArray(manifest.experiences)) {
      console.log('🧪 ExperienceManager: Invalid manifest structure, returning empty experiences');
      return [];
    }
    
    console.log('🧪 ExperienceManager: Raw experiences from manifest:', manifest.experiences);
    
    const experiences: UserExperience[] = manifest.experiences
      .filter(exp => {
        const isValid = exp && typeof exp.experienceShortUid === 'string' && exp.experienceShortUid.length > 0;
        if (!isValid) {
          console.log('🧪 ExperienceManager: Filtering out invalid experience:', exp);
        }
        return isValid;
      })
      .map(exp => ({
        experienceShortUid: exp.experienceShortUid,
        variantShortUid: exp.variantShortUid,
      }));
    
    console.log('🧪 ExperienceManager: Filtered valid experiences:', experiences);
    return experiences;
    
  } catch (error) {
    console.error('🧪 ExperienceManager: Error fetching experiences:', error);
    return [];
  }
}

/**
 * Check if user is in a specific experience
 */
export async function isUserInExperience(experienceShortUid: string): Promise<boolean> {
  const experiences = await getUserExperiences();
  return experiences.some(exp => exp.experienceShortUid && exp.experienceShortUid === experienceShortUid);
}

/**
 * Get user's variant for a specific experience
 */
export async function getUserVariant(experienceShortUid: string): Promise<string | null> {
  const experiences = await getUserExperiences();
  const experience = experiences.find(exp => exp.experienceShortUid && exp.experienceShortUid === experienceShortUid);
  return experience?.variantShortUid || null;
}

/**
 * Apply homepage personalization based on active experiences
 */
export async function getPersonalizedHomepageConfig(): Promise<{
  layout: 'default' | 'developer_focused' | 'design_focused' | 'beginner_friendly';
  showRecommendations: boolean;
  featuredContentStrategy: 'latest' | 'personalized' | 'trending';
  heroMessage?: string;
  experienceVariant?: string;
}> {
  console.log('🧪 ExperienceManager: Getting personalized homepage config');
  
  const experiences = await getUserExperiences();
  
  // Default configuration
  let config: {
    layout: 'default' | 'developer_focused' | 'design_focused' | 'beginner_friendly';
    showRecommendations: boolean;
    featuredContentStrategy: 'latest' | 'personalized' | 'trending';
    heroMessage?: string;
    experienceVariant?: string;
  } = {
    layout: 'default',
    showRecommendations: true,
    featuredContentStrategy: 'personalized',
  };

  // Check for any segmented experience (your javascript: true experience)
  const segmentedExperience = experiences.find(exp => 
    exp.experienceShortUid && (
      exp.experienceShortUid.includes('segment') || 
      exp.experienceShortUid.includes('javascript') ||
      exp.experienceShortUid.includes('developer') ||
      exp.experienceShortUid.includes('tech') ||
      exp.experienceShortUid.length > 0 // Any experience for now
    )
  );

  if (segmentedExperience?.variantShortUid) {
    console.log('🧪 ExperienceManager: Found segmented experience:', segmentedExperience);
    
    // For users with javascript: true and similar tech interests
    config.layout = 'developer_focused';
    config.heroMessage = '🚀 Advanced insights for JavaScript developers';
    config.featuredContentStrategy = 'personalized';
    config.showRecommendations = true;
    config.experienceVariant = segmentedExperience.variantShortUid;
    
    console.log('🧪 ExperienceManager: Applied developer-focused configuration');
  } else {
    // No active experience - use default
    config.heroMessage = 'Insights that inspire developers';
    console.log('🧪 ExperienceManager: No active experience, using default configuration');
  }

  console.log('🧪 ExperienceManager: Final homepage config:', config);
  return config;
}

/**
 * Track experience impression (when user sees the experience)
 */
export async function trackExperienceImpression(
  experienceShortUid: string, 
  variantShortUid: string
): Promise<void> {
  console.log('🧪 ExperienceManager: Tracking impression:', { experienceShortUid, variantShortUid });
  
  const personalizationAPI = getPersonalizationAPI();
  if (!personalizationAPI) {
    console.log('🧪 ExperienceManager: No personalization API for tracking impression');
    return;
  }

  try {
    await personalizationAPI.trackEvent({
      type: 'IMPRESSION',
      experienceShortUid,
      variantShortUid,
    });
    console.log('🧪 ExperienceManager: Successfully tracked impression');
  } catch (error) {
    console.error('🧪 ExperienceManager: Error tracking impression:', error);
  }
}

/**
 * Get personalized content filtering based on experiences
 */
export async function getPersonalizedContentStrategy(): Promise<{
  strategy: 'interests' | 'trending' | 'latest' | 'mixed';
  boostFactors: { [tag: string]: number };
}> {
  const experiences = await getUserExperiences();
  
  // Default strategy
  let strategy: 'interests' | 'trending' | 'latest' | 'mixed' = 'interests';
  let boostFactors: { [tag: string]: number } = {};

  // Check for content personalization experience
  const contentPersonalizationExperience = experiences.find(exp => 
    exp.experienceShortUid && exp.experienceShortUid.includes('content_personalization')
  );

  if (contentPersonalizationExperience?.variantShortUid) {
    switch (contentPersonalizationExperience.variantShortUid) {
      case 'trending_focus':
        strategy = 'trending';
        break;
      case 'latest_focus':
        strategy = 'latest';
        break;
      case 'javascript_boost':
        strategy = 'mixed';
        boostFactors = { javascript: 2.0, react: 1.5, typescript: 1.5 };
        break;
      case 'design_boost':
        strategy = 'mixed';
        boostFactors = { design: 2.0, ui: 1.5, ux: 1.5 };
        break;
    }
  }

  return { strategy, boostFactors };
}

/**
 * Debug function to log all active experiences
 */
export async function debugUserExperiences(): Promise<void> {
  console.log('🧪 ExperienceManager: === DEBUG USER EXPERIENCES ===');
  
  const experiences = await getUserExperiences();
  
  if (experiences.length === 0) {
    console.log('🧪 ExperienceManager: No active experiences for this user');
    return;
  }

  console.log('🧪 ExperienceManager: Active experiences:');
  experiences.forEach((exp, index) => {
    console.log(`🧪 ExperienceManager: ${index + 1}. Experience: ${exp.experienceShortUid}`);
    console.log(`🧪 ExperienceManager:    Variant: ${exp.variantShortUid || 'No variant (control group)'}`);
  });

  const homepageConfig = await getPersonalizedHomepageConfig();
  console.log('🧪 ExperienceManager: Homepage configuration:', homepageConfig);

  const contentStrategy = await getPersonalizedContentStrategy();
  console.log('🧪 ExperienceManager: Content strategy:', contentStrategy);
  
  console.log('🧪 ExperienceManager: === END DEBUG ===');
}
