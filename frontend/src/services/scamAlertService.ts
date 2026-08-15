import { scamAlerts } from '../data/mock/scamAlerts';
import type { ScamAlert } from '../types';

export const scamAlertService = {
  getAll(): ScamAlert[] {
    return scamAlerts;
  },

  getFeatured(limit = 3): ScamAlert[] {
    return scamAlerts.slice(0, limit);
  },

  getBySlug(slug: string): ScamAlert | undefined {
    return scamAlerts.find((alert) => alert.slug === slug);
  },
};
