export type PublicMediaItem = {
  url: string;
  alt: string;
  kind: 'illustration' | 'photo';
  caption?: string;
};

export type PublicContentTranslations = Partial<Record<'en' | 'bn', {
  title?: string;
  body?: string;
  summary?: string;
}>>;

export type LinkedCase = {case_code: string; status: string; url: string; amount?: string};
export type LinkedReview = {id: number; title?: string; url: string};
export type ReviewReaction = 'helpful' | 'not_helpful';

export type Review = {
  public_video_urls?: string[];
  video_accessibility?: 'not_verified';
  linked_case?: LinkedCase | null;
  translations?: PublicContentTranslations;
  public_media?: PublicMediaItem[];
  is_demo?: boolean;
  id: number;
  author: string;
  authorAvatar?: string | null;
  businessImage?: string | null;
  initials: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  experienceDate?: string;
  relationshipDisclosure?: "none" | "employee" | "competitor" | "incentive" | "family" | "other";
  status?: "published" | "under_review" | "limited" | "removed";
  helpfulCount: number;
  notHelpfulCount?: number;
  viewerReaction?: ReviewReaction | null;
  canReact?: boolean;
  verifiedExperience?: boolean;
  disclaimer?: string;
  serviceRating?: number;
  valueRating?: number;
  commRating?: number;
  discussionCount?: number;
  location?: string;
  facebookUrl?: string;
  imagePath?: string;
  images?: string[];
};

export type Business = {
  is_demo?: boolean;
  operatingStatus?:'unknown'|'open'|'closed';
  sourceUrl?:string; sourceFetchedAt?:string; latitude?:number|string; longitude?:number|string;
  presence?: 'physical' | 'online' | 'both';
  googlePlaceId?: string;
  id: number;
  slug: string;
  name: string;
  bengaliName?: string;
  category: string;
  description: string;
  location: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  phone: string;
  website: string;
  color?: string;
  image?: string;
  branches?: string[];
  reviews: Review[];
  distribution: number[];
  ratingCounts?: { star5: number; star4: number; star3: number; star2: number; star1: number };
  facebookUrl?: string;
  userId?: number;
  status?: "pending" | "approved" | "rejected";
};

export type PendingBusiness = {
  id: number;
  slug: string;
  name: string;
  bengaliName?: string;
  category: string;
  description?: string;
  location?: string;
  phone?: string;
  website?: string;
  facebookUrl?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
};

export type TimelineEvent = {
  date: string;
  title: string;
  desc: string;
  done?: boolean;
};

export type ScamAlert = {
  adminReviewed?: boolean;
  alertEnabled?: boolean;
  public_video_urls?: string[];
  video_accessibility?: 'not_verified';
  linked_review?: LinkedReview | null;
  translations?: PublicContentTranslations;
  public_media?: PublicMediaItem[];
  is_demo?: boolean;
  id: number;
  caseCode?: string;
  slug: string;
  title?: string;
  entity: string;
  businessSlug?: string;
  businessImage?: string | null;
  category: string;
  incident_type?: string;
  status: "Published" | "Resolved" | "Business Responded" | "Under Review";
  summary: string;
  date: string;
  amount?: string;
  trxId?: string;
  evidence: string;
  response: boolean;
  image?: string;
  location?: string;
  reporterAlias?: string;
  merchantContact?: string;
  timeline?: TimelineEvent[];
};

export type User = {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: "user" | "moderator" | "admin" | "business";
  email_verified_at: string | null;
  created_at: string;
  unread_notifications?: number;
  has_claimed_business?: boolean;
  claim_blocked?: boolean;
  claim_blocked_reason?: string | null;
};
