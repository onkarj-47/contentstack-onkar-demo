"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllBlogs, getAllAuthors, initLivePreview, initPersonalization } from "@/lib/contentstack";
import { getPersonalizationAPI } from "@/lib/personalization-api";
import { useEffect, useState } from "react";
import { Blog, Author } from "@/lib/types";
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import SearchBar from "@/app/components/SearchBar";
import PersonalizationBanner from "@/app/components/PersonalizationBanner";
import InterestManager from "@/app/components/InterestManager";
import DynamicHero from "@/components/DynamicHero";
import PersonalizedSections from "@/components/PersonalizedSections";
import SmartRecommendations from "@/components/SmartRecommendations";
import { 
  setPersonalizationEmail, 
  dismissPersonalizationBanner, 
  shouldShowPersonalizationBanner,
  getPersonalizationStatus 
} from "@/lib/personalization";
import { 
  personalizeContentByInterests, 
  hasUserInterests, 
  getUserTopInterests,
  getInterestStats,
  getInterestBasedRecommendations 
} from "@/lib/user-interests";
import {
  getPersonalizedHomepageConfig,
  trackExperienceImpression,
  debugUserExperiences,
  getUserExperiences
} from "@/lib/experience-manager";
import { debugBlogTags, suggestPersonalizationTags } from "@/lib/debug-interests";

/**
 * The `Home` component is the main landing page for the blog.
 * It displays featured content, trending posts, and author highlights.
 * Built with personalization in mind for future enhancements.
 */
export default function Home() {
  const router = useRouter();
  const [featuredBlogs, setFeaturedBlogs] = useState<Blog[]>([]);
  const [recentBlogs, setRecentBlogs] = useState<Blog[]>([]);
  const [recommendedBlogs, setRecommendedBlogs] = useState<Blog[]>([]);
  const [featuredAuthors, setFeaturedAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Newsletter signup state
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  
  // Personalization state
  const [showPersonalizationBanner, setShowPersonalizationBanner] = useState(false);
  const [showInterestManager, setShowInterestManager] = useState(false);
  
  // Experience state
  const [homepageConfig, setHomepageConfig] = useState<any>(null);
  const [userExperiences, setUserExperiences] = useState<any[]>([]);

  // Search handler - redirect to blog page with search
  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/blog?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/blog');
    }
  };

  // Email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Validate email function
  const validateEmail = (email: string): boolean => {
    return emailRegex.test(email);
  };

  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError("");
    setSubscriptionSuccess(false);
  };

  // Handle newsletter subscription
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setEmailError("");
    setSubscriptionSuccess(false);
    
    // Validate email
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    
    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    setIsSubscribing(true);
    
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubscriptionSuccess(true);
        setEmail("");
        
        // Track newsletter signup with personalization API
        const personalizationAPI = getPersonalizationAPI();
        if (personalizationAPI) {
          console.log('🏠 Homepage: Tracking newsletter signup with personalization API');
          try {
            await personalizationAPI.trackNewsletterSignup(email.trim());
            console.log('🏠 Homepage: Successfully tracked newsletter signup with personalization');
          } catch (error) {
            console.error('🏠 Homepage: Error tracking newsletter signup with personalization:', error);
          }
        }
        
        // Show success for a few seconds then hide
        setTimeout(() => {
          setSubscriptionSuccess(false);
        }, 5000);
      } else {
        setEmailError(data.error || "Failed to subscribe. Please try again.");
      }
      
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  // Personalization handlers
  const handlePersonalizationEmailSubmit = async (personalizationEmail: string) => {
    console.log('🏠 Homepage: handlePersonalizationEmailSubmit called with:', personalizationEmail);
    
    // Set local storage (existing functionality)
    setPersonalizationEmail(personalizationEmail);
    setShowPersonalizationBanner(false);
    
    console.log('🏠 Homepage: Personalization enabled for:', personalizationEmail);
    
    // Track with Contentstack Personalization API
    const personalizationAPI = getPersonalizationAPI();
    if (personalizationAPI) {
      console.log('🏠 Homepage: Tracking personalization signup with API');
      try {
        await personalizationAPI.trackNewsletterSignup(personalizationEmail);
        console.log('🏠 Homepage: Successfully tracked personalization signup');
      } catch (error) {
        console.error('🏠 Homepage: Error tracking personalization signup:', error);
      }
    } else {
      console.log('🏠 Homepage: Personalization API not available for tracking');
    }
    
    console.log('🏠 Homepage: Banner hidden, personalization active');
  };

  const handlePersonalizationDismiss = () => {
    console.log('🏠 Homepage: handlePersonalizationDismiss called');
    dismissPersonalizationBanner();
    setShowPersonalizationBanner(false);
    console.log('🏠 Homepage: Banner dismissed permanently');
  };

  // Load user experiences and homepage configuration
  const loadUserExperiences = async () => {
    try {
      console.log("🏠 Homepage: Loading user experiences...");
      
      // Get user's active experiences
      const experiences = await getUserExperiences();
      setUserExperiences(experiences);
      
      // Get personalized homepage configuration
      const config = await getPersonalizedHomepageConfig();
      setHomepageConfig(config);
      
      // Debug experiences in development
      if (process.env.NODE_ENV === 'development') {
        await debugUserExperiences();
      }
      
      // Track impressions for active experiences
      experiences.forEach(exp => {
        if (exp.variantShortUid && exp.experienceShortUid) {
          trackExperienceImpression(exp.experienceShortUid, exp.variantShortUid);
        }
      });
      
      console.log("🏠 Homepage: Experiences loaded:", experiences);
      console.log("🏠 Homepage: Homepage config:", config);
      
    } catch (error) {
      console.error("🏠 Homepage: Error loading experiences:", error);
    }
  };

  const getContent = async () => {
    try {
      const [blogs, authors] = await Promise.all([
        getAllBlogs(),
        getAllAuthors()
      ]);
      
      // Log current user interest stats
      const interestStats = getInterestStats();
      console.log('🏠 Homepage: User interest stats:', interestStats);
      
      // Check if user is in a segmented experience for enhanced personalization
      const hasExperience = homepageConfig?.experienceVariant;
      
      // Personalize content based on user interests and experience
      if (hasUserInterests() || hasExperience) {
        console.log('🏠 Homepage: User has interests or active experience, personalizing content');
        
        let personalizedFeatured, personalizedRecent, recommendations;
        
        if (hasExperience) {
          // Enhanced personalization for users in segmented experience
          console.log('🏠 Homepage: Applying experience-based content filtering');
          
          // Prioritize JavaScript/tech content more heavily
          const jsBlogs = blogs.filter(blog => 
            blog.categories_tags?.some(tag => 
              ['javascript', 'react', 'typescript', 'node', 'frontend', 'backend', 'api', 'tutorial'].includes(tag.toLowerCase())
            )
          );
          
          // Get personalized featured posts with JS bias
          personalizedFeatured = jsBlogs.length >= 3 
            ? personalizeContentByInterests(jsBlogs, { maxResults: 3 })
            : personalizeContentByInterests(blogs, { maxResults: 3 });
            
          // Get personalized recent posts (excluding featured ones)
          const excludeFeaturedUids = personalizedFeatured.map(blog => blog.uid);
          const remainingBlogs = blogs.filter(blog => !excludeFeaturedUids.includes(blog.uid));
          const remainingJsBlogs = remainingBlogs.filter(blog => 
            blog.categories_tags?.some(tag => 
              ['javascript', 'react', 'typescript', 'node', 'frontend', 'backend', 'api', 'tutorial'].includes(tag.toLowerCase())
            )
          );
          
          personalizedRecent = remainingJsBlogs.length >= 6
            ? personalizeContentByInterests(remainingJsBlogs, { maxResults: 6 })
            : personalizeContentByInterests(remainingBlogs, { maxResults: 6 });
            
          console.log('🏠 Homepage: Applied JavaScript-focused filtering for experience');
        } else {
          // Standard interest-based personalization
          personalizedFeatured = personalizeContentByInterests(blogs, {
            requireMatch: false,
            maxResults: 3
          });
          
          const excludeFeaturedUids = personalizedFeatured.map(blog => blog.uid);
          const remainingBlogs = blogs.filter(blog => !excludeFeaturedUids.includes(blog.uid));
          personalizedRecent = personalizeContentByInterests(remainingBlogs, {
            requireMatch: false,
            maxResults: 6
          });
        }
        
        setFeaturedBlogs(personalizedFeatured);
        setRecentBlogs(personalizedRecent);
        
        // Get recommendations (excluding already shown content)
        const excludeUids = [...personalizedFeatured.map(b => b.uid), ...personalizedRecent.map(b => b.uid)];
        recommendations = getInterestBasedRecommendations([], {
          maxResults: 4,
          excludeUids,
          requireMatch: false
        });
        setRecommendedBlogs(recommendations);
        
        console.log('🏠 Homepage: Personalized content set');
        console.log('🏠 Homepage: Featured blogs:', personalizedFeatured.map(b => b.title));
        console.log('🏠 Homepage: Recommended blogs count:', recommendations.length);
        console.log('🏠 Homepage: User top interests:', getUserTopInterests(5));
        if (hasExperience) {
          console.log('🏠 Homepage: Experience variant active:', homepageConfig.experienceVariant);
        }
        
      } else {
        console.log('🏠 Homepage: No user interests, using default content');
        
        // Default content (no personalization)
        setFeaturedBlogs(blogs.slice(0, 3));
        setRecentBlogs(blogs.slice(3, 9));
        setRecommendedBlogs([]); // No recommendations without interests
      }
      
      // Authors are not personalized (yet)
      setFeaturedAuthors(authors.slice(0, 4));
      
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initLivePreview();
    ContentstackLivePreview.onEntryChange(getContent);
    getContent(); // Initial content fetch

    // Initialize personalization
    console.log("🏠 Homepage: Initializing personalization");
    const personalizationAPI = initPersonalization();
    
    if (personalizationAPI) {
      console.log("🏠 Homepage: Personalization API initialized, fetching manifest");
      
      // Fetch initial manifest to get/generate user UID
      personalizationAPI.getManifest().then(manifest => {
        console.log("🏠 Homepage: Initial manifest fetched:", manifest);
        console.log("🏠 Homepage: User UID after manifest:", personalizationAPI.getUserUid());
        
        // Now that we have a user UID, the API is ready for tracking
        if (manifest.userUid) {
          console.log("🏠 Homepage: Personalization fully initialized with user UID:", manifest.userUid);
          
          // Load user experiences and homepage configuration
          loadUserExperiences();
        }
      }).catch(error => {
        console.error("🏠 Homepage: Error fetching initial manifest:", error);
      });
    } else {
      console.log("🏠 Homepage: Personalization API not available");
    }

    // Check if personalization banner should be shown
    const checkPersonalizationBanner = () => {
      console.log("🏠 Homepage: Checking if personalization banner should show");
      const shouldShow = shouldShowPersonalizationBanner();
      console.log("🏠 Homepage: shouldShowPersonalizationBanner result:", shouldShow);
      
      if (shouldShow) {
        console.log("🏠 Homepage: Setting showPersonalizationBanner to true");
        setShowPersonalizationBanner(true);
      } else {
        console.log("🏠 Homepage: Not showing personalization banner");
      }
    };

    console.log("🏠 Homepage: Setting timeout for personalization banner check");
    // Delay banner check to ensure localStorage is available
    setTimeout(checkPersonalizationBanner, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-end items-center">
              <Link 
                href="/blog" 
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                All Stories
              </Link>
            </div>
          </div>
        </nav>
        
        {/* Loading State */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-8 w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-end items-center space-x-4">
            {hasUserInterests() && (
              <button
                onClick={() => setShowInterestManager(true)}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-1"
                title="Manage your reading interests"
              >
                <span>🎯</span>
                <span className="hidden sm:inline">Interests</span>
              </button>
            )}
            {/* Show active experiences indicator */}
            {userExperiences.length > 0 && (
              <div className="text-sm text-purple-600 flex items-center space-x-1" title="Active personalization experiences">
                <span>🧪</span>
                <span className="hidden sm:inline">{userExperiences.length} Active</span>
              </div>
            )}
            {/* Debug button for development */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={async () => {
                  console.log('🔍 DEBUG: Analyzing blog tags...');
                  console.log('=' .repeat(50));
                  await debugBlogTags();
                  console.log('\n');
                  suggestPersonalizationTags();
                  console.log('=' .repeat(50));
                  console.log('🔍 DEBUG: Analysis complete! Check console above for detailed results.');
                }}
                className="text-sm text-gray-500 hover:text-orange-600 transition-colors flex items-center space-x-1"
                title="Analyze blog tags for personalization"
              >
                <span>🔍</span>
                <span className="hidden sm:inline">Debug Tags</span>
              </button>
            )}
            <Link 
              href="/blog" 
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              All Stories
            </Link>
          </div>
        </div>
      </nav>

      {/* Dynamic Hero Section */}
      <DynamicHero onSearch={handleSearch} />

      {/* Personalized Content Sections */}
      <PersonalizedSections />

      {/* Recommended for You Section - Only show if user has interests */}
      {hasUserInterests() && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <SmartRecommendations 
              placement="inline"
              maxRecommendations={6}
              showInterests={true}
              title="📚 Recommended for You"
              className="max-w-4xl mx-auto"
            />
          </div>
        </section>
      )}

      {/* Featured Stories */}
      <section id="featured" className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Featured Insights</h2>
            <Link href="/blog" className="text-blue-600 hover:text-blue-800 font-medium">
              View all →
            </Link>
          </div>
          
          {featuredBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredBlogs.map((blog) => (
                <article key={blog.uid} className="group">
                  <Link href={`/blog/${blog.url?.startsWith('/') ? blog.url.slice(1) : blog.url}`}>
                    {blog.banner_image && (
                      <div className="relative overflow-hidden rounded-lg mb-4">
                        <Image
                          src={blog.banner_image.url}
                          alt={blog.title}
                          width={400}
                          height={240}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      {blog.categories_tags && blog.categories_tags[0] && (
                        <span className="text-sm text-blue-600 font-medium">
                          {blog.categories_tags[0]}
                        </span>
                      )}
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      {blog.summary && (
                        <p className="text-gray-600 line-clamp-3">
                          {blog.summary}
                        </p>
                      )}
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        {blog.author?.[0] && (
                          <>
                            <span>{blog.author[0].title}</span>
                            <span>•</span>
                          </>
                        )}
                        {blog.reading_time && <span>{blog.reading_time} min read</span>}
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No featured stories available.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recommended for You - Only show if user has interests */}
      {hasUserInterests() && recommendedBlogs.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Recommended for You</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Based on your reading interests: {getUserTopInterests(3).map(interest => 
                  <span key={interest} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-2 capitalize">
                    {interest}
                  </span>
                )}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedBlogs.map((blog) => (
                <article key={blog.uid} className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300">
                  <Link href={`/blog/${blog.url?.startsWith('/') ? blog.url.slice(1) : blog.url}`}>
                    {blog.banner_image && (
                      <div className="relative overflow-hidden rounded-t-lg">
                        <Image
                          src={blog.banner_image.url}
                          alt={blog.title}
                          width={300}
                          height={160}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      {blog.categories_tags && blog.categories_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {blog.categories_tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm">
                        {blog.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {blog.author?.[0] && (
                          <>
                            <span>{blog.author[0].title}</span>
                            <span>•</span>
                          </>
                        )}
                        {blog.reading_time && <span>{blog.reading_time} min read</span>}
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Authors Spotlight */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Featured Authors</h2>
          
          {featuredAuthors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {featuredAuthors.map((author) => (
                <div key={author.uid} className="text-center">
                  <Link href={`/author/${author.uid}`} className="group">
                    {author.profile_picture && (
                      <Image
                        src={author.profile_picture.url}
                        alt={author.title}
                        width={120}
                        height={120}
                        className="w-24 h-24 rounded-full mx-auto mb-4 group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {author.title}
                    </h3>
                    {author.bio && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {author.bio}
                      </p>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No featured authors available.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Stories */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
                      <h2 className="text-3xl font-bold text-gray-900 mb-12">Latest Insights</h2>
          
          {recentBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentBlogs.map((blog) => (
                <article key={blog.uid} className="group">
                  <Link href={`/blog/${blog.url?.startsWith('/') ? blog.url.slice(1) : blog.url}`}>
                    {blog.banner_image && (
                      <div className="relative overflow-hidden rounded-lg mb-4">
                        <Image
                          src={blog.banner_image.url}
                          alt={blog.title}
                          width={300}
                          height={200}
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        {blog.author?.[0] && (
                          <>
                            <span>{blog.author[0].title}</span>
                            <span>•</span>
                          </>
                        )}
                        {blog.reading_time && <span>{blog.reading_time} min read</span>}
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No recent stories available.</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay in the loop</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Get the latest insights and updates delivered to your inbox every week.
          </p>
          
          {subscriptionSuccess ? (
            <div className="max-w-md mx-auto">
              <div className="bg-green-600 text-white px-6 py-4 rounded-lg flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Successfully subscribed! Check your email for confirmation.</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div className="flex-1">
                  <input 
                    type="email" 
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Enter your email"
                    className={`w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 border focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      emailError 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={isSubscribing}
                  />
                  {emailError && (
                    <p className="text-red-400 text-sm mt-2 text-left">{emailError}</p>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={isSubscribing}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
                >
                  {isSubscribing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <span>Subscribe</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 Insight Hub. Sharing knowledge, one insight at a time.</p>
        </div>
      </footer>

      {/* Personalization Banner */}
      {showPersonalizationBanner && (
        <PersonalizationBanner
          onEmailSubmit={handlePersonalizationEmailSubmit}
          onDismiss={handlePersonalizationDismiss}
        />
      )}

      {showInterestManager && (
        <InterestManager onClose={() => setShowInterestManager(false)} />
      )}
    </div>
  );
}