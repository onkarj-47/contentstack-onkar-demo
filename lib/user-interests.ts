/**
 * User Interest Detection and Management System
 * Tracks user reading behavior and manages interest-based personalization
 */

export interface UserInterest {
  tag: string;
  score: number;
  lastUpdated: string;
  viewCount: number;
}

export interface UserInterestProfile {
  interests: UserInterest[];
  totalBlogViews: number;
  lastActive: string;
  created: string;
}

const INTEREST_STORAGE_KEY = 'user_interests_profile';
const MAX_INTERESTS = 20;
const INTEREST_DECAY_DAYS = 30;

/**
 * Get the user's current interest profile
 */
export function getUserInterestProfile(): UserInterestProfile {
  if (typeof window === 'undefined') {
    return createEmptyProfile();
  }

  try {
    const stored = localStorage.getItem(INTEREST_STORAGE_KEY);
    if (!stored) {
      return createEmptyProfile();
    }

    const profile: UserInterestProfile = JSON.parse(stored);
    
    // Validate and clean up old interests
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - INTEREST_DECAY_DAYS * 24 * 60 * 60 * 1000);
    
    profile.interests = profile.interests.filter(interest => {
      const lastUpdated = new Date(interest.lastUpdated);
      return lastUpdated > cutoffDate;
    });

    return profile;
  } catch (error) {
    console.error('Error loading user interest profile:', error);
    return createEmptyProfile();
  }
}

/**
 * Create an empty interest profile
 */
function createEmptyProfile(): UserInterestProfile {
  return {
    interests: [],
    totalBlogViews: 0,
    lastActive: new Date().toISOString(),
    created: new Date().toISOString(),
  };
}

/**
 * Track user interest from blog tags
 */
export function trackInterestFromBlog(blogTags: string[], blogUid: string): void {
  if (typeof window === 'undefined' || !blogTags || blogTags.length === 0) {
    return;
  }

  console.log('🎯 UserInterests: Tracking interests from blog tags:', blogTags);

  const profile = getUserInterestProfile();
  const now = new Date().toISOString();
  
  // Increment total blog views
  profile.totalBlogViews += 1;
  profile.lastActive = now;

  // Process each tag
  blogTags.forEach(tag => {
    const cleanTag = tag.toLowerCase().trim();
    if (!cleanTag) return;

    // Find existing interest or create new one
    let interest = profile.interests.find(i => i.tag === cleanTag);
    
    if (interest) {
      // Update existing interest
      interest.score += 1;
      interest.viewCount += 1;
      interest.lastUpdated = now;
    } else {
      // Create new interest
      interest = {
        tag: cleanTag,
        score: 1,
        viewCount: 1,
        lastUpdated: now,
      };
      profile.interests.push(interest);
    }
  });

  // Sort by score (descending) and limit to max interests
  profile.interests.sort((a, b) => b.score - a.score);
  profile.interests = profile.interests.slice(0, MAX_INTERESTS);

  // Save updated profile
  try {
    localStorage.setItem(INTEREST_STORAGE_KEY, JSON.stringify(profile));
    console.log('🎯 UserInterests: Updated interest profile:', profile);
  } catch (error) {
    console.error('Error saving user interest profile:', error);
  }
}

/**
 * Get user's top interests as a simple array of strings
 */
export function getUserTopInterests(limit: number = 10): string[] {
  const profile = getUserInterestProfile();
  return profile.interests
    .slice(0, limit)
    .map(interest => interest.tag);
}

/**
 * Get user's interest score for a specific tag
 */
export function getInterestScore(tag: string): number {
  const profile = getUserInterestProfile();
  const interest = profile.interests.find(i => i.tag === tag.toLowerCase());
  return interest ? interest.score : 0;
}

/**
 * Check if user has any interests
 */
export function hasUserInterests(): boolean {
  const profile = getUserInterestProfile();
  return profile.interests.length > 0;
}

/**
 * Get personalized content score for a blog based on user interests
 */
export function calculateBlogRelevanceScore(blogTags: string[]): number {
  if (!blogTags || blogTags.length === 0) {
    return 0;
  }

  const userInterests = getUserTopInterests();
  if (userInterests.length === 0) {
    return 0;
  }

  let score = 0;
  blogTags.forEach(tag => {
    const cleanTag = tag.toLowerCase();
    const interestIndex = userInterests.indexOf(cleanTag);
    if (interestIndex !== -1) {
      // Higher score for higher-priority interests
      score += (userInterests.length - interestIndex);
    }
  });

  return score;
}

/**
 * Filter and sort blogs by user interest relevance
 */
export function personalizeContentByInterests<T extends { categories_tags?: string[] }>(
  content: T[],
  options: {
    requireMatch?: boolean;
    minScore?: number;
    maxResults?: number;
  } = {}
): T[] {
  const { requireMatch = false, minScore = 1, maxResults } = options;
  
  if (!hasUserInterests()) {
    console.log('🎯 UserInterests: No user interests found, returning original content');
    return maxResults ? content.slice(0, maxResults) : content;
  }

  console.log('🎯 UserInterests: Personalizing content based on user interests');

  // Calculate relevance scores for each item
  const scoredContent = content.map(item => ({
    item,
    score: calculateBlogRelevanceScore(item.categories_tags || [])
  }));

  // Filter by minimum score if required
  let filteredContent = requireMatch 
    ? scoredContent.filter(({ score }) => score >= minScore)
    : scoredContent;

  // Sort by relevance score (descending)
  filteredContent.sort((a, b) => b.score - a.score);

  // If no personalized content and requireMatch is true, fall back to original
  if (filteredContent.length === 0 && requireMatch) {
    console.log('🎯 UserInterests: No matching content found, falling back to original');
    filteredContent = scoredContent;
  }

  const result = filteredContent.map(({ item }) => item);
  
  console.log('🎯 UserInterests: Personalized content order:', 
    result.slice(0, 5).map(item => ({
      title: (item as any).title,
      tags: (item as any).categories_tags,
      score: calculateBlogRelevanceScore((item as any).categories_tags || [])
    }))
  );

  return maxResults ? result.slice(0, maxResults) : result;
}

/**
 * Get interest-based recommendations
 */
export function getInterestBasedRecommendations<T extends { categories_tags?: string[] }>(
  allContent: T[],
  excludeUids: string[] = [],
  maxResults: number = 6
): T[] {
  const userInterests = getUserTopInterests();
  
  if (userInterests.length === 0) {
    return allContent
      .filter(item => !excludeUids.includes((item as any).uid))
      .slice(0, maxResults);
  }

  // Filter out excluded content
  const availableContent = allContent.filter(item => 
    !excludeUids.includes((item as any).uid)
  );

  // Get personalized recommendations
  return personalizeContentByInterests(availableContent, {
    requireMatch: true,
    minScore: 1,
    maxResults
  });
}

/**
 * Clear user interest data (for privacy/reset)
 */
export function clearUserInterests(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(INTEREST_STORAGE_KEY);
    console.log('🎯 UserInterests: Cleared user interest data');
  }
}

/**
 * Get interest statistics for debugging
 */
export function getInterestStats() {
  const profile = getUserInterestProfile();
  const userInterests = getUserTopInterests();
  
  return {
    totalInterests: profile.interests.length,
    topInterests: userInterests.slice(0, 5),
    totalBlogViews: profile.totalBlogViews,
    lastActive: profile.lastActive,
    hasInterests: hasUserInterests(),
  };
}
