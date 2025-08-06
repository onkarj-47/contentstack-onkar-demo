"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "dompurify";
import { getBlogBySlug } from "@/lib/contentstack";
import { Blog } from "@/lib/types";

/**
 * Individual Blog Post Page - Medium-style design
 */
export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!slug) return;
      
      try {
        const blogPost = await getBlogBySlug(slug);
        if (blogPost) {
          setBlog(blogPost);
        } else {
          setError("Blog post not found");
        }
      } catch (error) {
        console.error("Error fetching blog:", error);
        setError("Failed to load blog post");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Simple Top Navigation */}
        <nav className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <Link href="/blog" className="text-gray-600 hover:text-black transition-colors">
              ← Back to Insight Hub
            </Link>
          </div>
        </nav>
        
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-8"></div>
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {error || "Story not found"}
          </h1>
          <p className="text-gray-600 mb-8">
            The story you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            href="/blog" 
            className="inline-flex items-center px-6 py-3 text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
          >
            ← Back to all stories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Top Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/blog" className="text-gray-600 hover:text-black transition-colors">
            ← All Posts
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <article className="max-w-2xl mx-auto px-6">
        {/* Header Section */}
        <header className="py-16 border-b border-gray-100">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            {blog.title}
          </h1>

          {/* Subtitle/Summary */}
          {blog.summary && (
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
              {blog.summary}
            </p>
          )}

          {/* Author Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {blog.author?.[0]?.profile_picture && (
                <Link href={`/author/${blog.author[0].uid}`} className="mr-4">
                  <Image
                    src={blog.author[0].profile_picture.url}
                    alt={blog.author[0].title}
                    width={56}
                    height={56}
                    className="rounded-full hover:opacity-90 transition-opacity"
                  />
                </Link>
              )}
              <div>
                <Link 
                  href={`/author/${blog.author?.[0]?.uid || '#'}`}
                  className="text-lg font-medium text-gray-900 hover:underline"
                >
                  {blog.author?.[0]?.title || "Unknown Author"}
                </Link>
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
                      <span className="mx-1">·</span>
                      <span>{blog.reading_time} min read</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Social Share (placeholder) */}
            <div className="flex items-center space-x-3 text-gray-400">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.32 4.56c-.85.38-1.77.64-2.73.76 1-.6 1.75-1.54 2.11-2.67-.93.55-1.96.95-3.06 1.17-.88-.94-2.13-1.53-3.51-1.53-2.66 0-4.81 2.16-4.81 4.81 0 .38.04.75.13 1.1C7.69 8.08 4.07 6.17 1.64 3.16c-.42.72-.66 1.56-.66 2.46 0 1.67.85 3.14 2.14 4-.79-.02-1.53-.24-2.18-.6v.06c0 2.33 1.66 4.28 3.86 4.72-.4.11-.83.17-1.27.17-.31 0-.62-.03-.92-.08.62 1.94 2.42 3.35 4.55 3.39-1.67 1.31-3.77 2.09-6.05 2.09-.39 0-.78-.02-1.17-.07 2.18 1.4 4.77 2.21 7.56 2.21 9.05 0 14-7.5 14-14 0-.21 0-.41-.01-.61.96-.69 1.79-1.56 2.45-2.55l-.02-.02z"/>
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {blog.banner_image && (
          <div className="py-16">
            <div className="relative">
              <Image
                src={blog.banner_image.url}
                alt={blog.title}
                width={1200}
                height={600}
                className="w-full h-auto rounded-lg"
                priority
              />
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="py-8">
          {blog.content && (
            <div 
              className="prose prose-xl prose-gray max-w-none leading-relaxed
                prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
                prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-12
                prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-10
                prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-8
                prose-p:text-gray-800 prose-p:leading-8 prose-p:mb-6
                prose-a:text-black prose-a:underline prose-a:decoration-2 prose-a:underline-offset-2 hover:prose-a:decoration-gray-400
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-xl
                prose-ul:my-6 prose-ol:my-6 prose-li:my-2
                prose-img:rounded-lg prose-img:my-8"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(blog.content),
              }}
            />
          )}
        </div>

        {/* Tags */}
        {blog.categories_tags && blog.categories_tags.length > 0 && (
          <div className="py-8 border-t border-gray-100">
            <div className="flex flex-wrap gap-3">
              {blog.categories_tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio Section */}
        {blog.author?.[0] && (
          <div className="py-16 border-t border-gray-100">
            <div className="flex items-start space-x-6">
              {blog.author[0].profile_picture && (
                <Link href={`/author/${blog.author[0].uid}`}>
                  <Image
                    src={blog.author[0].profile_picture.url}
                    alt={blog.author[0].title}
                    width={80}
                    height={80}
                    className="rounded-full hover:opacity-90 transition-opacity"
                  />
                </Link>
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  <Link 
                    href={`/author/${blog.author[0].uid}`}
                    className="hover:underline"
                  >
                    {blog.author[0].title}
                  </Link>
                </h3>
                {blog.author[0].bio && (
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    {blog.author[0].bio}
                  </p>
                )}
                
                {/* Social Links */}
                {blog.author[0].social_links && (
                  <div className="flex space-x-4">
                    {blog.author[0].social_links.linkedin && (
                      <a
                        href={blog.author[0].social_links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                    {blog.author[0].social_links.instagram && (
                      <a
                        href={blog.author[0].social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-pink-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}
                    {blog.author[0].social_links.personal_website && (
                      <a
                        href={blog.author[0].social_links.personal_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="py-12 border-t border-gray-100">
          <Link 
            href="/blog"
            className="inline-flex items-center text-gray-600 hover:text-black transition-colors"
          >
            ← Read more stories
          </Link>
        </div>
      </article>
    </div>
  );
}