export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  location: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  location: string;
  city: string;
  logo: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  claimed: boolean;
  contact: {
    phone?: string;
    email?: string;
    website?: string;
    address: string;
  };
  ratingDistribution: RatingDistribution;
  photos: string[];
  tags: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  description: string;
  image: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  helpfulCount: number;
  commentCount: number;
  images?: string[];
}

export type ScamAlertStatus =
  | 'Published'
  | 'Resolved'
  | 'Business Responded'
  | 'Under Review';

export interface ScamAlertTimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
}

export interface ScamAlert {
  id: string;
  slug: string;
  entityName: string;
  category: string;
  status: ScamAlertStatus;
  summary: string;
  reportedDate: string;
  reportedAmount?: string;
  evidenceStatus: string;
  businessResponseAvailable: boolean;
  location: string;
  timeline: ScamAlertTimelineEvent[];
  businessResponse?: string;
  notice: string;
}

export interface SearchResult {
  type: 'business' | 'product';
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  category: string;
  location?: string;
  rating?: number;
  reviewCount?: number;
  image: string;
}

export interface FieldErrors {
  [key: string]: string[];
}
