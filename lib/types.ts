// Description: Type definitions for the Contentstack API

// PublishDetails object - Represents the details of publish functionality 
export interface PublishDetails {
  environment: string;
  locale: string;
  time: string;
  user: string;
}

// Social Links for Author
export interface SocialLinks {
  linkedin?: string;
  instagram?: string;
  personal_website?: string;
}

// File object - Represents a file in Contentstack
export interface File {
  uid: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  content_type: string;
  file_size: string;
  tags: string[];
  filename: string;
  url: string;
  ACL: any[] | object;
  is_dir: boolean;
  parent_uid: string;
  _version: number;
  title: string;
  _metadata?: object;
  publish_details: PublishDetails;
  $: any;
}

// Link object - Represents a hyperlink in Contentstack
export interface Link {
  title: string;
  href: string;
}

// Taxonomy object - Represents a taxonomy in Contentstack
export interface Taxonomy {
  taxonomy_uid: string;
  max_terms?: number;
  mandatory: boolean;
  non_localizable: boolean;
}

// Block object - Represents a modular block in Contentstack
export interface Block {
  _version?: number;
  _metadata: any;
  $: any;
  title?: string;
  copy?: string;
  image?: File | null;
  layout?: ("image_left" | "image_right") | null;
}

export interface Blocks {
  block: Block;
}

// Page object - Represents a page in Contentstack
export interface Page {
  uid: string;
  $: any;
  _version?: number;
  title: string;
  url?: string;
  description?: string;
  image?: File | null;
  rich_text?: string;
  blocks?: Blocks[];
}

// Author object - Represents an author in Contentstack
export interface Author {
  uid: string;
  $: any;
  _version?: number;
  title: string;                    // Author name
  bio?: string;                     // Author biography
  profile_picture?: File | null;    // Author avatar/photo
  social_links?: SocialLinks;       // Social media links
  publish_details?: PublishDetails;
}

// Blog object - Represents a blog post in Contentstack
export interface Blog {
  uid: string;
  $: any;
  _version?: number;
  title: string;                    // Blog post title
  url: string;                      // Slug for the post URL
  author?: Author[];                // Reference to Author content type
  categories_tags?: string[];       // Multiple tags/categories
  banner_image?: File | null;       // Featured image
  summary?: string;                 // Excerpt/description
  content?: string;                 // Rich text content
  reading_time?: number;            // Reading time in minutes
  published_date?: string;          // Publication date
  personalization_tags?: string[];  // Additional tags
  publish_details?: PublishDetails;
}