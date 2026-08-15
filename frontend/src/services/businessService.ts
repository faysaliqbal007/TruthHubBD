import { businesses } from '../data/mock/businesses';
import { reviews } from '../data/mock/reviews';
import type { Business, Review } from '../types';

export const businessService = {
  getAll(): Business[] {
    return businesses;
  },

  getFeatured(limit = 4): Business[] {
    return [...businesses]
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, limit);
  },

  getBySlug(slug: string): Business | undefined {
    return businesses.find((business) => business.slug === slug);
  },

  getReviewsForBusiness(businessId: string): Review[] {
    return reviews.filter((review) => review.businessId === businessId);
  },

  getRecentReviews(limit = 6): Review[] {
    return [...reviews]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  },
};
