"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAllBlogs, searchBlogs } from "@/lib/contentstack";
import { Blog } from "@/lib/types";
import SearchBar from "@/app/components/SearchBar";

/**
 * Blog Listing Page - Medium-style design
 */
export default function BlogPage() {
  const searchParams = useSearchParams();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]); // Store all blogs for resetting search
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const blogPosts = await getAllBlogs();
        setBlogs(blogPosts);
        setAllBlogs(blogPosts); // Store all blogs for search reset
        
        // Check for search parameter from URL
        const searchParam = searchParams.get('search');
        if (searchParam) {
          setSearchQuery(searchParam);
          // Don't automatically search, just populate the search field
          // User will need to click search button to see results
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [searchParams]);

  // Search handler function
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // Reset to all blogs if search is empty
      setBlogs(allBlogs);
      setHasSearched(false);
      return;
    }

    setSearchLoading(true);
    setHasSearched(true);
    
    try {
      const searchResults = await searchBlogs(query);
      setBlogs(searchResults);
    } catch (error) {
      console.error("Error searching blogs:", error);
      setBlogs([]);
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Simple Header */}
        <header className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <Link href="/" className="text-3xl font-bold text-black">
              Stories
            </Link>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-12"></div>
            <div className="space-y-12">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border-b border-gray-100 pb-12">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/" className="text-3xl font-bold text-black hover:text-gray-700 transition-colors">
            Stories
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Search Bar */}
        <div className="mb-12">
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Search stories, authors, or topics..."
            isLoading={searchLoading}
            className="max-w-md mx-auto"
            defaultValue={searchQuery}
          />
        </div>

        {/* Search Results Header */}
        {hasSearched && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {blogs.length === 0 
                ? `No results found for "${searchQuery}"` 
                : `${blogs.length} result${blogs.length !== 1 ? 's' : ''} for "${searchQuery}"`
              }
            </h2>
            {blogs.length === 0 && (
              <p className="text-gray-600">
                Try searching with different keywords or browse all stories below.
              </p>
            )}
          </div>
        )}

        {blogs.length === 0 && !hasSearched ? (
          <div className="text-center py-24">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">No stories yet</h1>
            <p className="text-xl text-gray-600 mb-8">
              Check back soon for compelling stories and insights.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        ) : blogs.length === 0 && hasSearched ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No stories found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any stories matching "{searchQuery}". Try a different search term.
            </p>
            <button
              onClick={() => handleSearch("")}
              className="inline-flex items-center px-6 py-3 text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
            >
              Show all stories
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {blogs.map((blog, index) => (
              <article key={blog.uid} className={`${index !== blogs.length - 1 ? 'border-b border-gray-100 pb-16' : ''}`}>
                <Link href={`/blog/${blog.url?.startsWith('/') ? blog.url.slice(1) : blog.url}`} className="group block">
                  {/* Author Info */}
                  <div className="flex items-center mb-6">
                    {blog.author?.[0]?.profile_picture && (
                      <Image
                        src={blog.author[0].profile_picture.url}
                        alt={blog.author[0].title}
                        width={40}
                        height={40}
                        className="rounded-full mr-4"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {blog.author?.[0]?.title || "Unknown Author"}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        {blog.published_date && (
                          <time dateTime={blog.published_date}>
                            {new Date(blog.published_date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </time>
                        )}
                        {blog.reading_time && (
                          <>
                            <span className="mx-2">·</span>
                            <span>{blog.reading_time} min read</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Title */}
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight group-hover:text-gray-700 transition-colors">
                      {blog.title}
                    </h2>

                    {/* Summary */}
                    {blog.summary && (
                      <p className="text-xl text-gray-600 leading-relaxed">
                        {blog.summary}
                      </p>
                    )}

                    {/* Featured Image */}
                    {blog.banner_image && (
                      <div className="my-8">
                        <Image
                          src={blog.banner_image.url}
                          alt={blog.title}
                          width={800}
                          height={400}
                          className="w-full h-64 md:h-80 object-cover rounded-lg group-hover:opacity-95 transition-opacity"
                        />
                      </div>
                    )}

                    {/* Tags */}
                    {blog.categories_tags && blog.categories_tags.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-4">
                        {blog.categories_tags.slice(0, 4).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Read More Hint */}
                    <div className="flex items-center text-gray-500 group-hover:text-gray-700 transition-colors pt-2">
                      <span className="text-sm font-medium">Read story</span>
                      <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        {/* Bottom Call to Action */}
        {blogs.length > 0 && (
          <div className="text-center pt-16 mt-16 border-t border-gray-100">
            {hasSearched ? (
              <div>
                <p className="text-gray-600 mb-6">
                  {blogs.length === allBlogs.length 
                    ? "That's all the stories we have!"
                    : "Want to see more stories?"
                  }
                </p>
                {blogs.length < allBlogs.length && (
                  <button
                    onClick={() => handleSearch("")}
                    className="inline-flex items-center text-gray-600 hover:text-black transition-colors mr-6"
                  >
                    ← Browse all stories
                  </button>
                )}
                <Link 
                  href="/"
                  className="inline-flex items-center text-gray-600 hover:text-black transition-colors"
                >
                  ← Explore our homepage
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-6">
                  Interested in more stories like these?
                </p>
                <Link 
                  href="/"
                  className="inline-flex items-center text-gray-600 hover:text-black transition-colors"
                >
                  ← Explore our homepage
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}