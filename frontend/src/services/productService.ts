import { products } from '../data/mock/products';
import type { Product } from '../types';

export const productService = {
  getBySlug(slug: string): Product | undefined {
    return products.find((product) => product.slug === slug);
  },
};
