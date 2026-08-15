import { businesses } from '../data/mock/businesses';
import { products } from '../data/mock/products';
import { categories } from '../data/mock/categories';
import type { SearchResult } from '../types';
import { normalizeQuery } from '../lib/utils';

export const searchService = {
  search(query: string, categorySlug?: string): SearchResult[] {
    const normalized = normalizeQuery(query);
    const results: SearchResult[] = [];

    businesses.forEach((business) => {
      if (categorySlug && business.categorySlug !== categorySlug) return;

      const haystack = [
        business.name,
        business.category,
        business.location,
        business.city,
        business.description,
        ...business.tags,
      ]
        .join(' ')
        .toLowerCase();

      if (!normalized || haystack.includes(normalized)) {
        results.push({
          type: 'business',
          id: business.id,
          slug: business.slug,
          name: business.name,
          subtitle: business.location,
          category: business.category,
          location: business.location,
          rating: business.rating,
          reviewCount: business.reviewCount,
          image: business.logo,
        });
      }
    });

    products.forEach((product) => {
      if (categorySlug && product.categorySlug !== categorySlug) return;

      const haystack = [product.name, product.brand, product.category, product.description]
        .join(' ')
        .toLowerCase();

      if (!normalized || haystack.includes(normalized)) {
        results.push({
          type: 'product',
          id: product.id,
          slug: product.slug,
          name: product.name,
          subtitle: product.brand,
          category: product.category,
          rating: product.rating,
          reviewCount: product.reviewCount,
          image: product.image,
        });
      }
    });

    return results;
  },

  getCategories() {
    return categories;
  },
};
