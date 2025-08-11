"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Blog } from '@/lib/types';
import { getAllBlogs } from '@/lib/contentstack';
import { 
  getUserTopInterests, 
  calculateBlogRelevanceScore,
  trackInteraction 
} from '@/lib/user-interests';

interface SmartRecommendationsProps {
  /**
   * Current article context - used for "related articles" recommendations
   */
  currentArticle?: Blog;
  
  /**
   * Widget placement affects layout and behavior
   */
  placement?: 'sidebar' | 'inline' | 'bottom' | 'floating';
  
  /**
   * Maximum number of recommendations to show
   */
  maxRecommendations?: number;
  
  /**
   * Widget title (can be customized)
   */
  title?: string;
  
  /**
   * Show user interests as chips
   */
  showInterests?: boolean;
  
  /**
   * Compact mode for smaller spaces
   */
  compact?: boolean;
  
  /**
   * Custom CSS classes
   */
  className?: string;
}

interface RecommendedArticle extends Blog {
  recommendationScore: number;
  recommendationType: 'similar' | 'trending' | 'interest' | 'recent';
  matchedTags: string[];
}

interface RecommendationSection {
  title: string;
  articles: RecommendedArticle[];
  type: 'similar' | 'trending' | 'interest' | 'recent';
  icon: string;
}

export default function SmartRecommendations({
  currentArticle,
  placement = 'sidebar',
  maxRecommendations = 6,
  title,
  showInterests = true,
  compact = false,
  className = ""
}: SmartRecommendationsProps) {
  const [sections, setSections] = useState<RecommendationSection[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Helper function for image gradients based on recommendation type
  const getImageGradient = (type: string): string => {
    switch (type) {
      case 'interest':
        return 'bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700';
      case 'similar':
        return 'bg-gradient-to-br from-green-500 via-teal-600 to-cyan-700';
      case 'trending':
        return 'bg-gradient-to-br from-orange-500 via-red-600 to-pink-700';
      default:
        return 'bg-gradient-to-br from-gray-500 via-slate-600 to-gray-700';
    }
  };

  // Helper function for match badge colors
  const getMatchBadgeColor = (score: number): string => {
    if (score >= 0.7) return 'bg-green-500';    // 70%+ = green
    if (score >= 0.5) return 'bg-yellow-500';   // 50-69% = yellow
    if (score >= 0.3) return 'bg-orange-500';   // 30-49% = orange
    return 'bg-red-500';                        // <30% = red
  };

  // Helper function to apply the 70%+ random trick
  const applyScoreTrick = (calculatedScore: number): number => {
    if (calculatedScore >= 0.7) {
      // If score is 70%+, generate random between 70-90%
      return 0.7 + Math.random() * 0.2; // 70% + (0-20%) = 70-90%
    }
    return calculatedScore;
  };

  // Generate intelligent recommendations
  const generateRecommendations = useCallback(async (): Promise<RecommendationSection[]> => {
    try {
      const allBlogs = await getAllBlogs();
      const topInterests = getUserTopInterests();
      
      if (!allBlogs || allBlogs.length === 0) {
        return [];
      }

      // Filter out current article if provided
      const availableBlogs = currentArticle 
        ? allBlogs.filter(blog => blog.uid !== currentArticle.uid)
        : allBlogs;

      const recommendationSections: RecommendationSection[] = [];

              // 1. SIMILAR ARTICLES (if current article exists)
        if (currentArticle && currentArticle.categories_tags) {
          const similarArticles: RecommendedArticle[] = availableBlogs
            .map(blog => {
              const matchedTags = blog.categories_tags?.filter(tag =>
                currentArticle.categories_tags?.includes(tag)
              ) || [];
              
              // More realistic scoring: max 85% for similar articles
              const rawScore = matchedTags.length / (currentArticle.categories_tags?.length || 1);
              const baseScore = rawScore * 0.8 + 0.1; // Scale to 10%-90%
              const score = applyScoreTrick(baseScore);
              
              return {
                ...blog,
                recommendationScore: score,
                recommendationType: 'similar' as const,
                matchedTags
              };
            })
            .filter(article => article.recommendationScore > 0.1)
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, 3);

        if (similarArticles.length > 0) {
          recommendationSections.push({
            title: '🔗 Related Articles',
            articles: similarArticles,
            type: 'similar',
            icon: '🔗'
          });
        }
      }

              // 2. INTEREST-BASED RECOMMENDATIONS
        if (topInterests.length > 0) {
          const interestArticles: RecommendedArticle[] = availableBlogs
            .map(blog => {
              const matchedInterests = blog.categories_tags?.filter(tag =>
                topInterests.some(interest => 
                  tag.toLowerCase().includes(interest.toLowerCase())
                )
              ) || [];
              
              const relevanceScore = calculateBlogRelevanceScore(blog.categories_tags || []);
              const interestScore = matchedInterests.length / topInterests.length;
              
              // More realistic scoring for interest-based
              const rawScore = (relevanceScore + interestScore * 2) / 3;
              const baseScore = rawScore * 0.6 + 0.15; // Scale to 15%-75%
              const score = applyScoreTrick(baseScore);
              
              return {
                ...blog,
                recommendationScore: score,
                recommendationType: 'interest' as const,
                matchedTags: matchedInterests
              };
            })
            .filter(article => article.recommendationScore > 0.2)
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, 4);

        if (interestArticles.length > 0) {
          recommendationSections.push({
            title: '🎯 For You',
            articles: interestArticles,
            type: 'interest',
            icon: '🎯'
          });
        }
      }

              // 3. TRENDING ARTICLES (based on engagement simulation)
        const trendingArticles: RecommendedArticle[] = availableBlogs
          .map(blog => {
            // More realistic trending scores
            const baseScore = Math.random() * 0.5 + 0.25; // 25%-75% random base
            const score = applyScoreTrick(baseScore);
            
            return {
              ...blog,
              recommendationScore: score,
              recommendationType: 'trending' as const,
              matchedTags: blog.categories_tags?.slice(0, 2) || []
            };
          })
          .sort((a, b) => b.recommendationScore - a.recommendationScore)
          .slice(0, 3);

      if (trendingArticles.length > 0) {
        recommendationSections.push({
          title: '🔥 Trending Now',
          articles: trendingArticles,
          type: 'trending',
          icon: '🔥'
        });
      }

              // 4. RECENT ARTICLES (fallback)
        if (recommendationSections.length === 0) {
          const recentArticles: RecommendedArticle[] = availableBlogs
            .slice(0, 4)
            .map((blog, index) => {
              // Recent articles get modest scores: 20%-45% range
              const baseScore = 0.45 - (index * 0.05); // Decreasing score for older articles
              const score = Math.max(0.20, applyScoreTrick(baseScore));
              
              return {
                ...blog,
                recommendationScore: score,
                recommendationType: 'recent' as const,
                matchedTags: []
              };
            });

        recommendationSections.push({
          title: '📚 Latest Articles',
          articles: recentArticles,
          type: 'recent',
          icon: '📚'
        });
      }

      // Limit total recommendations
      let totalCount = 0;
      return recommendationSections.map(section => ({
        ...section,
        articles: section.articles.slice(0, Math.min(
          section.articles.length,
          maxRecommendations - totalCount
        ))
      })).filter(section => {
        totalCount += section.articles.length;
        return section.articles.length > 0 && totalCount <= maxRecommendations;
      });

    } catch (error) {
      console.error('🤖 SmartRecommendations: Error generating recommendations:', error);
      throw error;
    }
  }, [currentArticle, maxRecommendations]);

  // Load recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [recommendations, interests] = await Promise.all([
          generateRecommendations(),
          Promise.resolve(getUserTopInterests())
        ]);
        
        setSections(recommendations);
        setUserInterests(interests);
        
        console.log('🤖 SmartRecommendations: Generated', recommendations.length, 'sections');
      } catch (err) {
        setError('Failed to load recommendations');
        console.error('🤖 SmartRecommendations: Load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [generateRecommendations]);

  // Handle recommendation click
  const handleRecommendationClick = useCallback((article: RecommendedArticle) => {
    // Track interaction for learning
    trackInteraction('recommendation_click', {
      articleUid: article.uid,
      recommendationType: article.recommendationType,
      score: article.recommendationScore,
      matchedTags: article.matchedTags,
      placement
    });

    // Navigate to article
    router.push(`/blog/${article.url}`);
  }, [router, placement]);

  // Handle interest chip click
  const handleInterestClick = useCallback((interest: string) => {
    trackInteraction('interest_click', { interest, source: 'recommendations' });
    router.push(`/blog?search=${encodeURIComponent(interest)}`);
  }, [router]);

  // Render loading state
  if (loading) {
    return (
      <div className={`smart-recommendations ${placement} ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex space-x-3">
              <div className="w-16 h-16 bg-gray-200 rounded"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error || sections.length === 0) {
    return (
      <div className={`smart-recommendations ${placement} ${className}`}>
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">🤖</div>
          <p className="text-sm">
            {error || 'No recommendations available right now'}
          </p>
        </div>
      </div>
    );
  }

  // Determine layout classes based on placement
  const getLayoutClasses = () => {
    switch (placement) {
      case 'sidebar':
        return 'w-full max-w-sm';
      case 'inline':
        return 'w-full max-w-4xl mx-auto';
      case 'bottom':
        return 'w-full';
      case 'floating':
        return 'fixed bottom-4 right-4 max-w-sm z-50 shadow-2xl';
      default:
        return 'w-full';
    }
  };

  return (
    <div className={`smart-recommendations ${placement} ${getLayoutClasses()} ${className}`}>
      <div className={`bg-white rounded-lg ${placement === 'floating' ? 'border shadow-lg' : 'border-0'} ${compact ? 'p-4' : 'p-6'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {title || '🤖 Smart Recommendations'}
          </h2>
          {placement === 'floating' && (
            <button 
              onClick={() => setSections([])}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* User Interests */}
        {showInterests && userInterests.length > 0 && (
          <div className="mb-6">
            <p className="text-gray-600 mb-4 text-lg">Your interests:</p>
            <div className="flex flex-wrap gap-2">
              {userInterests.slice(0, 4).map(interest => (
                <button
                  key={interest}
                  onClick={() => handleInterestClick(interest)}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  #{interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation Sections */}
        <div className="space-y-8">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              
              {/* Section Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{section.icon}</span>
                    <h4 className={`font-bold text-gray-900 ${compact ? 'text-lg' : 'text-2xl'}`}>
                      {section.title}
                    </h4>
                  </div>
                  {placement === 'inline' && (
                    <p className="text-gray-600 text-sm">
                      {section.type === 'interest' ? 'Personalized picks based on your reading interests' :
                       section.type === 'similar' ? 'Articles related to what you\'re currently reading' :
                       section.type === 'trending' ? 'Popular articles trending right now' :
                       'Latest articles from our writers'}
                    </p>
                  )}
                </div>
                {placement === 'inline' && (
                  <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex-shrink-0 mt-1">
                    View All →
                  </button>
                )}
              </div>

              {/* Articles Grid for inline, stack for others */}
              <div className={placement === 'inline' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
                {section.articles.map((article) => (
                  <div
                    key={article.uid}
                    onClick={() => handleRecommendationClick(article)}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group border border-gray-100 hover:border-gray-200"
                  >
                    
                    {/* Article Image */}
                    <div className={`relative overflow-hidden ${placement === 'inline' ? 'h-48' : 'h-32'}`}>
                      {article.banner_image?.url ? (
                        <img 
                          src={article.banner_image.url} 
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${getImageGradient(article.recommendationType)}`}>
                          <div className={`font-bold text-white opacity-90 ${placement === 'inline' ? 'text-6xl' : 'text-4xl'}`}>
                            {article.title.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      
                      {/* Match percentage badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`${getMatchBadgeColor(article.recommendationScore)} text-white text-xs font-semibold px-2 py-1 rounded-full`}>
                          {Math.round(article.recommendationScore * 100)}% match
                        </span>
                      </div>
                      
                      {/* Recommendation type badge */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
                          {article.recommendationType === 'interest' ? '🎯 For You' :
                           article.recommendationType === 'similar' ? '🔗 Related' :
                           article.recommendationType === 'trending' ? '🔥 Trending' : '📚 Recent'}
                        </span>
                      </div>
                    </div>

                    {/* Article Content */}
                    <div className="p-4">
                      
                      {/* Tags */}
                      {article.matchedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {article.matchedTags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Title */}
                      <h5 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-lg mb-2 line-clamp-2">
                        {article.title}
                      </h5>
                      
                      {/* Summary */}
                      {article.summary && (
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                          {article.summary}
                        </p>
                      )}

                      {/* Footer with date and read time */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          {article.published_date && (
                            <span>
                              {new Date(article.published_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )}
                          {article.reading_time && (
                            <>
                              <span>•</span>
                              <span>{article.reading_time} min read</span>
                            </>
                          )}
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          Read more →
                        </button>
                      </div>

                      {/* Recommendation Score (for debugging) */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-400">
                            Score: {article.recommendationScore.toFixed(2)} | Type: {article.recommendationType}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <button
            onClick={() => router.push('/blog')}
            className={`text-blue-600 hover:text-blue-800 font-medium transition-colors ${compact ? 'text-sm' : 'text-base'}`}
          >
            Explore All Articles →
          </button>
        </div>
      </div>
    </div>
  );
}
