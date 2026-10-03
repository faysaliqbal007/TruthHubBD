import type { Business, LinkedCase } from "../types";

export type ReviewSubmission = {id:number;status:'published'|'under_review';linked_case?:LinkedCase|null};

export class BusinessSubmissionError extends Error {
  readonly fieldErrors: Record<string, string[]>;
  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'BusinessSubmissionError';
    this.fieldErrors = fieldErrors;
  }
}

// Base API URL for backend
const API_BASE_URL = `${(process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')}/api`;

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

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
  searchPage: async (query:string,category='All Categories',minRating=0,page=1,location='',signal?:AbortSignal):Promise<{data:Business[];total:number;last_page:number;imported_count:number}> => {
    const params=new URLSearchParams({q:query,page:String(page)});
    if(!['All','All Categories',''].includes(category))params.set('category',category);
    if(minRating>0)params.set('min_rating',String(minRating));
    if(location)params.set('location',location);
    const response=await fetch(`${API_BASE_URL}/businesses?${params}`,{signal});
    if(!response.ok)throw new Error('Directory unavailable. Check the backend and retry; demo data is not substituted.');
    return response.json();
  },
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
    return [];
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
    return undefined;
  },

  /**
   * Search businesses from real backend API database.
   */
  search: async (
    query: string,
    category = "All Categories",
    minRating = 0,
    page = 1
  ): Promise<Business[]> => {
    const result=await businessService.searchPage(query,category,minRating,page);
    return result.data;
  },

  /**
   * Submit new review with optional fields and file attachment.
   */
  submitReview: async (businessId: number, formData: FormData): Promise<ReviewSubmission> => {
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
    division_id?: string;
    district_id?: string;
    upazila_id?: string;
    latitude?: number;
    longitude?: number;
    road?: string;
    area?: string;
    postcode?: string;
    detected_address?: string;
    presence?: 'physical' | 'online' | 'both';
    google_place_id?: string;
    name: string;
    bengali_name?: string;
    category: string;
    description?: string;
    location?: string;
    phone?: string;
    website?: string;
    facebook_url?: string;
    profile_image?: File;
    profile_image_consent?: boolean;
  }): Promise<Business> => {
    try {
      await csrf();
      const formData = data.profile_image ? new FormData() : null;
      if (formData) {
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) formData.append(key, value instanceof File ? value : typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
        });
        if (!formData.has('profile_image_consent')) {
          formData.append('profile_image_consent', '1');
        }
      }
      const response = await fetch(`${API_BASE_URL}/businesses`, {
        method: "POST",
        headers: {
          ...csrfHeaders(),
          ...(!formData ? { "Content-Type": "application/json" } : {}),
        },
        credentials: "include",
        body: formData ?? JSON.stringify(data),
      });

      if (response.ok) {
        const json = await response.json();
        return json.data;
      } else {
        const errJson = await response.json().catch(() => null);
        throw new BusinessSubmissionError(errJson?.message || `Server error (${response.status})`, errJson?.errors ?? {});
      }
    } catch (err: any) {
      console.error("Error creating business entity on backend API:", err);
      throw err;
    }
  },

  /**
   * Fetch recent nationwide reviews across all businesses for Homepage.
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
  updateBusiness: async (id: number, data: Partial<Business> & { file?: File; profile_image_consent?: boolean }): Promise<Business> => {
    try {
      await csrf();
      let response;
      if (data.file) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value instanceof File ? value : typeof value === 'boolean' ? (value ? '1' : '0') : value.toString());
          }
        });
        if (!formData.has('profile_image_consent')) {
          formData.append('profile_image_consent', '1');
        }
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





