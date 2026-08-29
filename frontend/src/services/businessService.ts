import { businesses as mockBusinesses } from "../data/mock/businesses";
import type { Business } from "../types";

// Base API URL for backend (Laravel server default port 8001 or 8000)
const API_BASE_URL = typeof window !== "undefined" && window.location.port === "8001"
  ? "http://localhost:8001/api"
  : "http://localhost:8001/api";

const API_URL = API_BASE_URL.replace(/\/api$/, "");

function getXsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function csrf(): Promise<void> {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
}

function csrfHeaders(): HeadersInit {
  const xsrfToken = getXsrfToken();
  return {
    Accept: "application/json",
    ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
  };
}

/**
 * businessService
 * Handles communication between the frontend React application and the Laravel backend API.
 */
export const businessService = {
  /**
   * Fetch all business entities from backend API or local dataset.
   */
  getAll: async (): Promise<Business[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/businesses`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn("Backend API unavailable, using fallback dataset.", err);
    }
    return mockBusinesses;
  },

  /**
   * Fetch featured businesses for homepage.
   */
  getFeatured: async (): Promise<Business[]> => {
    const list = await businessService.getAll();
    return list.slice(0, 6);
  },

  /**
   * Get single business detail by slug.
   */
  getBySlug: async (slug: string): Promise<Business | undefined> => {
    try {
      const response = await fetch(`${API_BASE_URL}/businesses/${slug}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn("Backend API unavailable for getBySlug, using fallback dataset.", err);
    }
    return mockBusinesses.find((item) => item.slug === slug);
  },

  /**
   * Search businesses from real backend API database.
   */
  search: async (
    query: string,
    category = "All Categories",
    minRating = 0
  ): Promise<Business[]> => {
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append("q", query.trim());
      if (category && category !== "All Categories" && category !== "All") {
        params.append("category", category);
      }
      if (minRating > 0) {
        params.append("min_rating", minRating.toString());
      }

      const response = await fetch(`${API_BASE_URL}/businesses?${params.toString()}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn("Backend API offline during search, using fallback filter.", err);
    }

    // Fallback local filtering if backend API is not running
    const needle = query.trim().toLowerCase();
    return mockBusinesses.filter((item) => {
      const categoryMatch =
        category === "All" ||
        category === "All Categories" ||
        item.category.toLowerCase() === category.toLowerCase() ||
        item.category.toLowerCase().includes(category.toLowerCase());

      const ratingMatch = minRating <= 0 || item.rating >= minRating;

      const searchable = [
        item.name,
        item.bengaliName || "",
        item.category,
        item.location,
        item.description,
      ]
        .join(" ")
        .toLowerCase();

      const textMatch = !needle || searchable.includes(needle);

      return categoryMatch && ratingMatch && textMatch;
    });
  },

  /**
   * Submit new review with optional fields and file attachment.
   */
  submitReview: async (businessId: number, formData: FormData): Promise<any> => {
    try {
      await csrf();
      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/reviews`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: csrfHeaders(),
      });

      if (response.ok) {
        const json = await response.json();
        return json.data;
      } else {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.message || `Server error (${response.status})`);
      }
    } catch (err: any) {
      console.error("Error submitting review to backend API:", err);
      throw err;
    }
  },

  /**
   * Create new Business Entity (for Business Users).
   */
  createBusiness: async (data: {
    name: string;
    bengali_name?: string;
    category: string;
    description?: string;
    location?: string;
    phone?: string;
    website?: string;
    facebook_url?: string;
  }): Promise<Business> => {
    try {
      await csrf();
      const response = await fetch(`${API_BASE_URL}/businesses`, {
        method: "POST",
        headers: {
          ...csrfHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const json = await response.json();
        return json.data;
      } else {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.message || `Server error (${response.status})`);
      }
    } catch (err: any) {
      console.error("Error creating business entity on backend API:", err);
      throw err;
    }
  },

  /**
   * Fetch recent community reviews across all businesses for Homepage.
   */
  getRecentReviews: async (): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/recent`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn("Backend API unavailable for getRecentReviews.", err);
    }
    return [];
  },

  /**
   * Update Business Profile Facts (for Business Owner).
   */
  updateBusiness: async (id: number, data: Partial<Business> & { file?: File }): Promise<Business> => {
    try {
      await csrf();
      let response;
      if (data.file) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value instanceof File ? value : value.toString());
          }
        });
        formData.append('_method', 'PATCH');
        response = await fetch(`${API_BASE_URL}/businesses/${id}`, {
          method: 'POST',
          headers: { ...csrfHeaders() },
          credentials: 'include',
          body: formData,
        });
      } else {
        response = await fetch(`${API_BASE_URL}/businesses/${id}`, {
          method: 'PATCH',
          headers: { ...csrfHeaders(), 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data),
        });
      }
      if (response.ok) {
        const json = await response.json();
        return json.data;
      } else {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.message || "Server error (${response.status})");
      }
    } catch (err: any) {
      console.error('Error updating business profile on backend API:', err);
      throw err;
    }
  },


  /**
   * Fetch pending business creation requests (Admin page /admin).
   */
  getPendingBusinesses: async (): Promise<any[]> => {
    try {
      await csrf();
      const response = await fetch(`${API_BASE_URL}/admin/pending-businesses`, {
        credentials: "include",
        headers: csrfHeaders(),
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (err) {
      console.error("Error fetching pending businesses for admin:", err);
    }
    return [];
  },

  /**
   * Approve a pending business creation request (Admin).
   */
  approveBusiness: async (id: number): Promise<boolean> => {
    try {
      await csrf();
      const response = await fetch(`${API_BASE_URL}/admin/businesses/${id}/approve`, {
        method: "POST",
        credentials: "include",
        headers: csrfHeaders(),
      });
      return response.ok;
    } catch (err) {
      console.error("Error approving business:", err);
      return false;
    }
  },

  /**
   * Reject a pending business creation request (Admin).
   */
  rejectBusiness: async (id: number): Promise<boolean> => {
    try {
      await csrf();
      const response = await fetch(`${API_BASE_URL}/admin/businesses/${id}/reject`, {
        method: "POST",
        credentials: "include",
        headers: csrfHeaders(),
      });
      return response.ok;
    } catch (err) {
      console.error("Error rejecting business:", err);
      return false;
    }
  },
};





