"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllBlogs, getAllAuthors, initLivePreview } from "@/lib/contentstack";
import { useEffect, useState } from "react";
import { Blog, Author } from "@/lib/types";
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import SearchBar from "@/app/components/SearchBar";

/**
 * The `Home` component is the main landing page for the blog.
 * It displays featured content, trending posts, and author highlights.
 * Built with personalization in mind for future enhancements.
 */
export default function Home() {
  const router = useRouter();
  const [featuredBlogs, setFeaturedBlogs] = useState<Blog[]>([]);
  const [recentBlogs, setRecentBlogs] = useState<Blog[]>([]);
  const [featuredAuthors, setFeaturedAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Newsletter signup state
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

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

  const getContent = async () => {
    try {
      const [blogs, authors] = await Promise.all([
        getAllBlogs(),
        getAllAuthors()
      ]);
      
      // Featured posts (first 3)
      setFeaturedBlogs(blogs.slice(0, 3));
      
      // Recent posts (next 6)
      setRecentBlogs(blogs.slice(3, 9));
      
      // Featured authors (first 4)
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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Stories that <span className="text-blue-600">inspire</span> developers
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Discover cutting-edge development techniques, learn from industry experts, 
            and stay ahead with the latest in technology and design.
          </p>
          
          {/* Search Bar */}
          <div className="mb-12 max-w-2xl mx-auto">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search for stories, topics, or authors..."
              className="w-full"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/blog" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Reading
            </Link>
            <Link 
              href="#featured" 
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Explore Topics
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section id="featured" className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Featured Stories</h2>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Latest Stories</h2>
          
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
            Get the latest stories and insights delivered to your inbox every week.
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
          <p>&copy; 2024 DevStories. Sharing knowledge, one story at a time.</p>
        </div>
      </footer>
    </div>
  );
}