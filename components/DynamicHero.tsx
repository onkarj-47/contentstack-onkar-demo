"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserTopInterests } from '@/lib/user-interests';

interface HeroVariant {
  title: string;
  subtitle: string;
  background: string;
  description: string;
  cta: string;
  emoji: string;
}

const HERO_VARIANTS: { [key: string]: HeroVariant } = {
  javascript: {
    title: "Master Modern JavaScript Development",
    subtitle: "ES2024 • React • TypeScript • Performance",
    background: "linear-gradient(135deg, #f7df1e 20%, #ff6b35 80%)",
    description: "Dive deep into cutting-edge JavaScript techniques, frameworks, and best practices that power modern web development.",
    cta: "Explore JavaScript Articles",
    emoji: "🚀"
  },
  
  react: {
    title: "React Development Excellence",
    subtitle: "Hooks • Server Components • State Management • Testing",
    background: "linear-gradient(135deg, #61dafb 20%, #21759b 80%)",
    description: "Master React 18+ features, performance optimization, and modern patterns for building scalable applications.",
    cta: "Discover React Guides",
    emoji: "⚛️"
  },
  
  typescript: {
    title: "TypeScript for Scale",
    subtitle: "Advanced Types • Patterns • Performance • Integration",
    background: "linear-gradient(135deg, #3178c6 20%, #1e40af 80%)",
    description: "Learn advanced TypeScript techniques for building type-safe, maintainable, and scalable applications.",
    cta: "TypeScript Deep Dives",
    emoji: "📘"
  },
  
  backend: {
    title: "Build Scalable Backend Systems",
    subtitle: "APIs • Microservices • Databases • Cloud Architecture",
    background: "linear-gradient(135deg, #2d3748 20%, #4a5568 80%)",
    description: "Design and implement robust backend solutions with modern architectures, best practices, and performance optimization.",
    cta: "Backend Architecture Guides",
    emoji: "⚡"
  },
  
  frontend: {
    title: "Frontend Development Mastery",
    subtitle: "CSS Grid • Animations • Web APIs • Performance",
    background: "linear-gradient(135deg, #667eea 20%, #764ba2 80%)",
    description: "Create stunning, performant user interfaces with modern CSS, JavaScript APIs, and optimization techniques.",
    cta: "Frontend Techniques",
    emoji: "🎨"
  },
  
  nodejs: {
    title: "Node.js Server Excellence",
    subtitle: "Express • Performance • Security • Deployment",
    background: "linear-gradient(135deg, #8cc84b 20%, #5d7f37 80%)",
    description: "Build high-performance Node.js applications with enterprise-grade patterns, security, and scalability.",
    cta: "Node.js Best Practices",
    emoji: "🟢"
  },
  
  default: {
    title: "Insights that Inspire Developers",
    subtitle: "Technology • Tutorials • Best Practices • Innovation",
    background: "linear-gradient(135deg, #667eea 20%, #764ba2 80%)",
    description: "Discover cutting-edge development techniques, learn from industry experts, and stay ahead with the latest in technology.",
    cta: "Explore All Content",
    emoji: "💡"
  }
};

interface DynamicHeroProps {
  onSearch: (query: string) => void;
  className?: string;
}

export default function DynamicHero({ onSearch, className = "" }: DynamicHeroProps) {
  const router = useRouter();
  const [heroVariant, setHeroVariant] = useState<HeroVariant>(HERO_VARIANTS.default);
  const [primaryInterest, setPrimaryInterest] = useState<string>('');
  const [isPersonalized, setIsPersonalized] = useState(false);

  useEffect(() => {
    const loadPersonalizedHero = async () => {
      try {
        const topInterests = getUserTopInterests();
        
        if (topInterests.length > 0) {
          const primary = topInterests[0].toLowerCase();
          setPrimaryInterest(primary);
          
          // Find matching hero variant
          const variant = HERO_VARIANTS[primary] || 
                         HERO_VARIANTS[primary.replace(/[^a-z]/g, '')] || 
                         HERO_VARIANTS.default;
          
          setHeroVariant(variant);
          setIsPersonalized(primary !== 'default' && topInterests.length > 0);
          
          console.log('🎨 DynamicHero: Personalized for', primary, 'interest');
        } else {
          console.log('🎨 DynamicHero: No interests found, using default');
        }
      } catch (error) {
        console.error('🎨 DynamicHero: Error loading personalization:', error);
      }
    };

    loadPersonalizedHero();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    if (query?.trim()) {
      onSearch(query.trim());
    }
  };

  const handleMainCTA = () => {
    if (primaryInterest) {
      // Navigate to blog with interest filter
      router.push(`/blog?search=${encodeURIComponent(primaryInterest)}`);
    } else {
      // Navigate to all blog posts
      router.push('/blog');
    }
  };

  const handleBrowseAllTopics = () => {
    router.push('/blog');
  };

  return (
    <section 
      className={`relative py-20 px-4 text-white overflow-hidden ${className}`}
      style={{ background: heroVariant.background }}
    >
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <svg className="absolute bottom-0 left-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.1)"/>
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto text-center">
        {/* Personalization Indicator */}
        {isPersonalized && (
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 text-sm">
            <span>✨</span>
            <span>Personalized for {primaryInterest} developers</span>
          </div>
        )}

        {/* Hero Content */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            <span className="inline-block mr-3 text-5xl md:text-7xl">
              {heroVariant.emoji}
            </span>
            {heroVariant.title}
          </h1>
          
          <p className="text-xl md:text-2xl font-medium text-white/90 max-w-4xl mx-auto">
            {heroVariant.subtitle}
          </p>
          
          <p className="text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
            {heroVariant.description}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-12">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                name="search"
                placeholder={`Search ${primaryInterest || 'articles'}, tutorials, guides...`}
                className="w-full px-6 py-4 text-lg text-gray-900 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30 placeholder-gray-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-6 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                Search
              </button>
            </form>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button 
              onClick={handleMainCTA}
              className="bg-white text-gray-900 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              {heroVariant.cta}
            </button>
            <button 
              onClick={handleBrowseAllTopics}
              className="border-2 border-white/30 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              Browse All Topics
            </button>
          </div>

          {/* Interest Tags */}
          {isPersonalized && (
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {['Latest', 'Trending', 'Advanced', 'Tutorials'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => router.push(`/blog?search=${encodeURIComponent(primaryInterest + ' ' + tag)}`)}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium hover:bg-white/30 transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
