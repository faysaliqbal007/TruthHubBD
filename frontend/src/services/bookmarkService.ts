// Unified Bookmark / Saved Items Service for TruthHubBD
// Supports Reviews, Scam Alerts, and Businesses

export interface SavedReview {
  id: number;
  title: string;
  rating: number;
  body: string;
  author: string;
  businessName: string;
  businessSlug: string;
  image?: string;
  savedAt: string;
}

export interface SavedAlert {
  id: number | string;
  slug: string;
  caseCode: string;
  title: string;
  entity: string;
  category: string;
  status: "Published" | "Resolved" | "Business Responded" | "Under Review";
  amount?: string;
  image?: string;
  savedAt: string;
}

export interface SavedBusiness {
  id: number;
  name: string;
  slug: string;
  category?: string;
  rating?: number;
  image?: string;
  savedAt: string;
}

const STORAGE_KEYS = {
  REVIEWS: "truthhub_saved_reviews",
  ALERTS: "truthhub_saved_alerts",
  BUSINESSES: "truthhub_saved_businesses",
};

function safeGet<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function safeSet<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("truthhub-bookmarks-updated", { detail: { key } }));
  } catch (e) {
    console.error("Failed to persist bookmark:", e);
  }
}

export const bookmarkService = {
  // Reviews
  getSavedReviews(): SavedReview[] {
    return safeGet<SavedReview>(STORAGE_KEYS.REVIEWS);
  },
  isReviewSaved(id: number): boolean {
    return this.getSavedReviews().some((r) => r.id === id);
  },
  toggleReview(review: Omit<SavedReview, "savedAt">): boolean {
    const list = this.getSavedReviews();
    const idx = list.findIndex((r) => r.id === review.id);
    if (idx >= 0) {
      list.splice(idx, 1);
      safeSet(STORAGE_KEYS.REVIEWS, list);
      return false;
    } else {
      list.unshift({ ...review, savedAt: new Date().toISOString() });
      safeSet(STORAGE_KEYS.REVIEWS, list);
      return true;
    }
  },
  removeReview(id: number): void {
    const list = this.getSavedReviews().filter((r) => r.id !== id);
    safeSet(STORAGE_KEYS.REVIEWS, list);
  },

  // Scam Alerts
  getSavedAlerts(): SavedAlert[] {
    return safeGet<SavedAlert>(STORAGE_KEYS.ALERTS);
  },
  isAlertSaved(identifier: number | string): boolean {
    return this.getSavedAlerts().some((a) => a.id === identifier || a.slug === identifier || a.caseCode === identifier);
  },
  toggleAlert(alert: Omit<SavedAlert, "savedAt">): boolean {
    const list = this.getSavedAlerts();
    const idx = list.findIndex((a) => a.id === alert.id || a.slug === alert.slug || a.caseCode === alert.caseCode);
    if (idx >= 0) {
      list.splice(idx, 1);
      safeSet(STORAGE_KEYS.ALERTS, list);
      return false;
    } else {
      list.unshift({ ...alert, savedAt: new Date().toISOString() });
      safeSet(STORAGE_KEYS.ALERTS, list);
      return true;
    }
  },
  removeAlert(identifier: number | string): void {
    const list = this.getSavedAlerts().filter((a) => a.id !== identifier && a.slug !== identifier && a.caseCode !== identifier);
    safeSet(STORAGE_KEYS.ALERTS, list);
  },

  // Businesses
  getSavedBusinesses(): SavedBusiness[] {
    return safeGet<SavedBusiness>(STORAGE_KEYS.BUSINESSES);
  },
  isBusinessSaved(id: number): boolean {
    return this.getSavedBusinesses().some((b) => b.id === id);
  },
  toggleBusiness(business: Omit<SavedBusiness, "savedAt">): boolean {
    const list = this.getSavedBusinesses();
    const idx = list.findIndex((b) => b.id === business.id);
    if (idx >= 0) {
      list.splice(idx, 1);
      safeSet(STORAGE_KEYS.BUSINESSES, list);
      return false;
    } else {
      list.unshift({ ...business, savedAt: new Date().toISOString() });
      safeSet(STORAGE_KEYS.BUSINESSES, list);
      return true;
    }
  },
  removeBusiness(id: number): void {
    const list = this.getSavedBusinesses().filter((b) => b.id !== id);
    safeSet(STORAGE_KEYS.BUSINESSES, list);
  },
};
