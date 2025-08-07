// Importing Contentstack SDK and specific types for region and query operations
import contentstack, { QueryOperation } from "@contentstack/delivery-sdk";

// Importing Contentstack Live Preview utilities and stack SDK 
import ContentstackLivePreview, { IStackSdk } from "@contentstack/live-preview-utils";

// Importing the type definitions 
import { Page, Blog, Author } from "./types";

// Importing personalization API
import { initPersonalizationAPI, getPersonalizationAPI, PersonalizationConfig } from "./personalization-api";

// helper functions from private package to retrieve Contentstack endpoints in a convienient way
import { getContentstackEndpoints, getRegionForString } from "@timbenniks/contentstack-endpoints";

// Set the region by string value from environment variables
const region = getRegionForString(process.env.NEXT_PUBLIC_CONTENTSTACK_REGION || "EU");

// object with all endpoints for region.
const endpoints = getContentstackEndpoints(region, true)

export const stack = contentstack.stack({
  // Setting the API key from environment variables
  apiKey: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY as string,

  // Setting the delivery token from environment variables
  deliveryToken: process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN as string,

  // Setting the environment based on environment variables
  environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT as string,

  // Setting the region based on environment variables
  region: region,
  live_preview: {
    // Enabling live preview if specified in environment variables
    enable: process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === 'true',

    // Setting the preview token from environment variables
    preview_token: process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN,

    // Setting the host for live preview based on the region
    host: endpoints.preview,
  }
});

// Initialize personalization functionality
export function initPersonalization() {
  console.log('🚀 Initializing Contentstack Personalization');
  
  const projectUid = process.env.NEXT_PUBLIC_CONTENTSTACK_PERSONALIZE_PROJECT_UID;
  const region = process.env.NEXT_PUBLIC_CONTENTSTACK_REGION || "EU";
  
  if (!projectUid) {
    console.warn('⚠️ Personalization Project UID not found in environment variables');
    return null;
  }

  const config: PersonalizationConfig = {
    baseUrl: '', // Will use region-based URL
    projectUid,
    region: region.toUpperCase() as 'US' | 'EU' | 'AU',
  };

  try {
    const personalizationAPI = initPersonalizationAPI(config);
    console.log('✅ Personalization initialized successfully');
    return personalizationAPI;
  } catch (error) {
    console.error('❌ Failed to initialize personalization:', error);
    return null;
  }
}

// Initialize live preview functionality
export function initLivePreview() {
  ContentstackLivePreview.init({
    ssr: false, // Disabling server-side rendering for live preview
    enable: process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === 'true', // Enabling live preview if specified in environment variables
    mode: "builder", // Setting the mode to "builder" for visual builder
    stackSdk: stack.config as IStackSdk, // Passing the stack configuration
    stackDetails: {
      apiKey: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY as string, // Setting the API key from environment variables
      environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT as string, // Setting the environment from environment variables
    },
    clientUrlParams: {
      host: endpoints.application
    },
    editButton: {
      enable: true, // Enabling the edit button for live preview
      exclude: ["outsideLivePreviewPortal"] // Excluding the edit button from the live preview portal
    },
  });
}
// Function to fetch page data based on the URL
export async function getPage(url: string) {
  const result = await stack
    .contentType("basic") // Specifying the content type as "page"
    .entry() // Accessing the entry
    .query() // Creating a query
    .where("url", QueryOperation.EQUALS, url) // Filtering entries by URL
    .find<Page>(); // Executing the query and expecting a result of type Page

  if (result.entries) {
    const entry = result.entries[0]; // Getting the first entry from the result

    if (process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === 'true') {
      contentstack.Utils.addEditableTags(entry, 'page', true); // Adding editable tags for live preview if enabled
    }

    return entry; // Returning the fetched entry
  }
}

// Function to fetch all blog posts
export async function getAllBlogs() {
  const result = await stack
    .contentType("blog") // Specifying the content type as "blog"
    .entry() // Accessing the entry
    .query() // Creating a query
    .orderByDescending('published_date') // Sort by published date, newest first
    .find<Blog>(); // Executing the query and expecting a result of type Blog

  if (result.entries) {
    const entries = result.entries;

    // Fetch author data separately for each blog post
    for (const entry of entries) {
      if (entry.author && Array.isArray(entry.author) && entry.author.length > 0) {
        const authorUid = (entry.author[0] as any).uid || entry.author[0];
        if (typeof authorUid === 'string') {
          const authorData = await getAuthorByUid(authorUid);
          if (authorData) {
            entry.author = [authorData];
          }
        }
      }
    }

    if (process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === 'true') {
      entries.forEach((entry: Blog) => {
        contentstack.Utils.addEditableTags(entry, 'blog', true); // Adding editable tags for live preview if enabled
      });
    }

    return entries; // Returning all blog entries
  }
  
  return [];
}

// Function to fetch a single blog post by URL/slug
export async function getBlogBySlug(slug: string) {
  // Add leading slash to match Contentstack URL format
  const urlWithSlash = `/${slug}`;
  
  const result = await stack
    .contentType("blog") // Specifying the content type as "blog"
    .entry() // Accessing the entry
    .query() // Creating a query
    .where("url", QueryOperation.EQUALS, urlWithSlash) // Filtering entries by URL with leading slash
    .find<Blog>(); // Executing the query and expecting a result of type Blog

  if (result.entries && result.entries.length > 0) {
    const entry = result.entries[0]; // Getting the first entry from the result

    // Fetch author data separately
    if (entry.author && Array.isArray(entry.author) && entry.author.length > 0) {
      const authorUid = (entry.author[0] as any).uid || entry.author[0];
      if (typeof authorUid === 'string') {
        const authorData = await getAuthorByUid(authorUid);
        if (authorData) {
          entry.author = [authorData];
        }
      }
    }

    if (process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === 'true') {
      contentstack.Utils.addEditableTags(entry, 'blog', true); // Adding editable tags for live preview if enabled
    }

    return entry; // Returning the fetched entry
  }
  
  return null;
}

// Function to fetch all authors
export async function getAllAuthors() {
  const result = await stack
    .contentType("author") // Specifying the content type as "author"
    .entry() // Accessing the entry
    .query() // Creating a query
    .find<Author>(); // Executing the query and expecting a result of type Author

  if (result.entries) {
    const entries = result.entries;

    if (process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === 'true') {
      entries.forEach((entry: Author) => {
        contentstack.Utils.addEditableTags(entry, 'author', true); // Adding editable tags for live preview if enabled
      });
    }

    return entries; // Returning all author entries
  }
  
  return [];
}

// Function to fetch an author by UID
export async function getAuthorByUid(uid: string) {
  const result = await stack
    .contentType("author") // Specifying the content type as "author"
    .entry(uid) // Accessing the specific entry by UID
    .fetch<Author>(); // Fetching the entry

  if (result) {
    if (process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === 'true') {
      contentstack.Utils.addEditableTags(result, 'author', true); // Adding editable tags for live preview if enabled
    }

    return result; // Returning the author entry
  }
}

// Function to fetch blogs by a specific author
export async function getBlogsByAuthor(authorUid: string) {
  console.log("🔍 Looking for blogs by author:", authorUid);
  
  // Get all blogs and manually filter to understand the structure better
  const allBlogs = await stack
    .contentType("blog")
    .entry()
    .query()
    .find<Blog>();
    
  console.log("📊 Total blogs in system:", allBlogs.entries?.length || 0);
  
  if (allBlogs.entries && allBlogs.entries.length > 0) {
    // Log all unique author UIDs found in blogs
    const authorUids = allBlogs.entries.map(blog => {
      if (blog.author && Array.isArray(blog.author) && blog.author.length > 0) {
        return blog.author[0].uid;
      }
      return null;
    }).filter(Boolean);
    
    console.log("🔍 All author UIDs in blogs:", [...new Set(authorUids)]);
    console.log("🎯 Looking for author UID:", authorUid);
    
    // Check if any blogs match our author
    const matchingBlogs = allBlogs.entries.filter(blog => {
      if (blog.author && Array.isArray(blog.author) && blog.author.length > 0) {
        return blog.author[0].uid === authorUid;
      }
      return false;
    });
    
    console.log("✅ Manual filter found:", matchingBlogs.length, "blogs");
    
    if (matchingBlogs.length > 0) {
      // Return the manually filtered results
      const entries = matchingBlogs;
      
      // Fetch author data separately for each blog post
      const authorData = await getAuthorByUid(authorUid);
      if (authorData) {
        entries.forEach(entry => {
          entry.author = [authorData];
        });
      }

      if (process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === 'true') {
        entries.forEach((entry: Blog) => {
          contentstack.Utils.addEditableTags(entry, 'blog', true); // Adding editable tags for live preview if enabled
        });
      }

      return entries; // Returning blog entries by author
    }
  }
  
  return [];
}

// Function to search blogs based on a search query
export async function searchBlogs(searchQuery: string) {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return [];
  }

  const trimmedQuery = searchQuery.trim();
  console.log("🔍 Searching for:", trimmedQuery);
  
  // Get all blogs and filter manually for more reliable search
  const allBlogsResult = await stack
    .contentType("blog")
    .entry()
    .query()
    .orderByDescending('published_date')
    .find<Blog>();

  if (!allBlogsResult.entries) {
    return [];
  }

  const allBlogs = allBlogsResult.entries;
  console.log("📊 Total blogs to search:", allBlogs.length);

  // Manual search through blog content
  const matchingBlogs = allBlogs.filter(blog => {
    const query = trimmedQuery.toLowerCase();
    
    // Search in title
    if (blog.title && blog.title.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in summary
    if (blog.summary && blog.summary.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in content
    if (blog.content && blog.content.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in tags
    if (blog.categories_tags && Array.isArray(blog.categories_tags)) {
      return blog.categories_tags.some(tag => 
        tag.toLowerCase().includes(query)
      );
    }
    
    return false;
  });

  console.log("✅ Content search found:", matchingBlogs.length, "blogs");

  // Search for blogs by author name
  const allAuthors = await getAllAuthors();
  const matchingAuthors = allAuthors.filter(author => 
    author.title.toLowerCase().includes(trimmedQuery.toLowerCase())
  );

  console.log("👤 Found", matchingAuthors.length, "matching authors");

  const blogsByAuthors = [];
  for (const author of matchingAuthors) {
    const authorBlogs = await getBlogsByAuthor(author.uid);
    blogsByAuthors.push(...authorBlogs);
  }

  console.log("📝 Author blogs found:", blogsByAuthors.length);

  // Combine and deduplicate results
  const allResults = [...matchingBlogs, ...blogsByAuthors];
  const uniqueResults = allResults.filter((blog, index, self) => 
    index === self.findIndex(b => b.uid === blog.uid)
  );

  console.log("🎯 Final unique results:", uniqueResults.length);

  // Enrich with author data
  const enrichedResults = [];
  for (const blog of uniqueResults) {
    if (blog.author && Array.isArray(blog.author) && blog.author.length > 0) {
      const authorUid = (blog.author[0] as any).uid || blog.author[0];
      if (typeof authorUid === 'string') {
        const authorData = await getAuthorByUid(authorUid);
        if (authorData) {
          blog.author = [authorData];
        }
      }
    }
    enrichedResults.push(blog);
  }

  // Sort by published date
  enrichedResults.sort((a, b) => {
    const dateA = new Date(a.published_date || 0).getTime();
    const dateB = new Date(b.published_date || 0).getTime();
    return dateB - dateA;
  });

  if (process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW === 'true') {
    enrichedResults.forEach((entry: Blog) => {
      contentstack.Utils.addEditableTags(entry, 'blog', true);
    });
  }

  return enrichedResults;
}