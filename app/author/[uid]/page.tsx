"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAuthorByUid, getBlogsByAuthor } from "@/lib/contentstack";
import { Author, Blog } from "@/lib/types";

/**
 * Author Profile Page - Displays author information and their blog posts
 */
export default function AuthorPage() {
  const params = useParams();
  const uid = params.uid as string;
  
  const [author, setAuthor] = useState<Author | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthorData = async () => {
      if (!uid) return;
      
      try {
        const [authorData, authorBlogs] = await Promise.all([
          getAuthorByUid(uid),
          getBlogsByAuthor(uid)
        ]);
        
        if (authorData) {
          setAuthor(authorData);
          setBlogs(authorBlogs);
        } else {
          setError("Author not found");
        }
      } catch (error) {
        console.error("Error fetching author data:", error);
        setError("Failed to load author information");
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData();
  }, [uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-32 w-32 bg-gray-200 rounded-full mb-6 mx-auto"></div>
            <div className="h-8 bg-gray-200 rounded mb-4 w-64 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded mb-8 w-96 mx-auto"></div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {error || "Author not found"}
          </h1>
          <Link 
            href="/blog" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Insight Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/blog" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Insight Hub
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Author Info */}
        <div className="text-center mb-12">
          {author.profile_picture && (
            <Image
              src={author.profile_picture.url}
              alt={author.title}
              width={128}
              height={128}
              className="rounded-full mx-auto mb-6"
            />
          )}
          
          <h1 className="text-4xl font-bold text-black mb-4">
            {author.title}
          </h1>
          
          {author.bio && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              {author.bio}
            </p>
          )}

          {/* Social Links */}
          {author.social_links && (
            <div className="flex justify-center space-x-6">
              {author.social_links.linkedin && (
                <a
                  href={author.social_links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span>LinkedIn</span>
                </a>
              )}
              {author.social_links.instagram && (
                <a
                  href={author.social_links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-pink-600 hover:text-pink-800 font-medium transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Instagram</span>
                </a>
              )}
              {author.social_links.personal_website && (
                <a
                  href={author.social_links.personal_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  <span>Website</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Author's Blog Posts */}
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-black mb-8">
            Posts by {author.title} ({blogs.length})
          </h2>
          
          {blogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No blog posts found for this author.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {blogs.map((blog) => (
                <article key={blog.uid} className="border-b border-gray-100 pb-8 last:border-b-0">
                  <Link href={`/blog/${blog.url}`} className="group block">
                    <div className="lg:flex lg:items-start lg:space-x-8">
                      <div className="flex-1">
                        {/* Title */}
                        <h3 className="text-xl font-bold text-black mb-2 group-hover:text-gray-700 transition-colors">
                          {blog.title}
                        </h3>

                        {/* Summary */}
                        {blog.summary && (
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {blog.summary}
                          </p>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          {blog.published_date && (
                            <time dateTime={blog.published_date}>
                              {new Date(blog.published_date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
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

                        {/* Tags */}
                        {blog.categories_tags && blog.categories_tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {blog.categories_tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Featured Image */}
                      {blog.banner_image && (
                        <div className="mt-4 lg:mt-0 lg:w-48 lg:flex-shrink-0">
                          <Image
                            src={blog.banner_image.url}
                            alt={blog.title}
                            width={192}
                            height={108}
                            className="w-full lg:w-48 h-24 lg:h-24 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}