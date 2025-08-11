"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Blog } from '@/lib/types';
import { getUserTopInterests, getInterestBasedRecommendations } from '@/lib/user-interests';
import { getAllBlogs } from '@/lib/contentstack';

interface PersonalizedSection {
  title: string;
  description: string;
  articles: Blog[];
  interest: string;
  emoji: string;
}

const SECTION_CONFIG: { [key: string]: { emoji: string; description: string } } = {
  javascript: {
    emoji: "🚀",
    description: "Latest JavaScript techniques, ES2024 features, and performance tips"
  },
  react: {
    emoji: "⚛️", 
    description: "React hooks, state management, and modern patterns"
  },
  typescript: {
    emoji: "📘",
    description: "Advanced TypeScript patterns and type safety techniques"
  },
  backend: {
    emoji: "⚡",
    description: "API design, database optimization, and server architecture"
  },
  frontend: {
    emoji: "🎨",
    description: "CSS techniques, animations, and user interface design"
  },
  nodejs: {
    emoji: "🟢",
    description: "Node.js performance, security, and best practices"
  }
};

export default function PersonalizedSections() {
  const [sections, setSections] = useState<PersonalizedSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPersonalizedSections = async () => {
      try {
        const userInterests = getUserTopInterests();
        console.log('📚 PersonalizedSections: User interests:', userInterests);

        if (userInterests.length === 0) {
          console.log('📚 PersonalizedSections: No interests found, skipping personalization');
          setLoading(false);
          return;
        }

        // Get all blogs first
        const allBlogs = await getAllBlogs();
        if (!allBlogs || allBlogs.length === 0) {
          console.log('📚 PersonalizedSections: No blogs found');
          setLoading(false);
          return;
        }

        // Create sections for top 3 interests
        const personalizedSections: PersonalizedSection[] = [];
        
        for (let i = 0; i < Math.min(userInterests.length, 3); i++) {
          const interest = userInterests[i].toLowerCase();
          const config = SECTION_CONFIG[interest] || SECTION_CONFIG['javascript'];
          
          // Filter blogs by interest
          const interestArticles = allBlogs
            .filter(blog => {
              if (!blog.categories_tags) return false;
              return blog.categories_tags.some(tag => 
                tag.toLowerCase().includes(interest.toLowerCase())
              );
            })
            .slice(0, 6);

          if (interestArticles.length > 0) {
            personalizedSections.push({
              title: `${config.emoji} Trending in ${interest.charAt(0).toUpperCase() + interest.slice(1)}`,
              description: config.description,
              articles: interestArticles,
              interest: interest,
              emoji: config.emoji
            });
          }
        }

        setSections(personalizedSections);
        console.log('📚 PersonalizedSections: Created', personalizedSections.length, 'sections');
        
      } catch (error) {
        console.error('📚 PersonalizedSections: Error loading sections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPersonalizedSections();
  }, []);

  if (loading) {
    return (
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-64 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return null; // Don't show anything if no personalized sections
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.interest} className={sectionIndex > 0 ? "mt-16" : ""}>
            {/* Section Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-900">
                  {section.title}
                </h2>
                <Link 
                  href={`/blog?search=${encodeURIComponent(section.interest)}`}
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                >
                  <span>View All</span>
                  <span>→</span>
                </Link>
              </div>
              <p className="text-gray-600 max-w-2xl">
                {section.description}
              </p>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.articles.map((article) => (
                <PersonalizedArticleCard 
                  key={article.uid} 
                  article={article} 
                  interest={section.interest}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Call to Action */}
        <div className="mt-16 text-center bg-white rounded-2xl p-8 shadow-sm border">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Discover More Personalized Content
          </h3>
          <p className="text-gray-600 mb-6">
            Read more articles to improve your personalized recommendations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/blog"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Explore All Articles
            </Link>
            <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Manage Interests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PersonalizedArticleCardProps {
  article: Blog;
  interest: string;
}

function PersonalizedArticleCard({ article, interest }: PersonalizedArticleCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  const getRelevanceScore = () => {
    if (!article.categories_tags) return 0;
    const matchingTags = article.categories_tags.filter(tag => 
      tag.toLowerCase().includes(interest.toLowerCase())
    );
    return Math.round((matchingTags.length / article.categories_tags.length) * 100);
  };

  const relevanceScore = getRelevanceScore();

  return (
    <Link href={`/blog/${article.url}`} className="group">
      <article className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden h-full">
        {/* Banner Image */}
        {article.banner_image?.url && (
          <div className="aspect-video overflow-hidden">
            <Image
              src={article.banner_image.url}
              alt={article.title}
              width={400}
              height={225}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        <div className="p-6">
          {/* Tags and Relevance */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-wrap gap-2">
              {article.categories_tags?.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    tag.toLowerCase().includes(interest.toLowerCase())
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
            {relevanceScore > 0 && (
              <div className="text-xs text-green-600 font-medium">
                {relevanceScore}% match
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {article.title}
          </h3>

          {/* Summary */}
          {article.summary && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {article.summary}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              {article.published_date && (
                <span>{formatDate(article.published_date)}</span>
              )}
              {article.reading_time && (
                <span>{article.reading_time} min read</span>
              )}
            </div>
            <div className="flex items-center text-blue-600 group-hover:text-blue-700">
              <span className="text-sm font-medium">Read more</span>
              <span className="ml-1 transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
