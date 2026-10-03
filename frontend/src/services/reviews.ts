import {useEffect, useState} from 'react';
import {api} from './api';
import type {Review, ReviewReaction} from '../types';
import {useAuth} from '../features/auth/AuthContext';
import type {PublicTranslations} from '../i18n/content';

export type PublicReview = Review & {
  businessName: string;
  businessSlug: string;
  businessCategory: string;
  businessLocation: string;
  businessImage?: string | null;
  translations?: PublicTranslations;
};
export type PublicReviewPage = {success: boolean; count: number; total: number; page: number; last_page: number; data: PublicReview[]};
export type PublicReviewFilters = {query?: string; category?: string; location?: string; page?: number; sort?: 'newest' | 'oldest'; lang?: 'en' | 'bn'};
export type ReviewReactionResult = {helpful_count: number; not_helpful_count: number; viewer_reaction: ReviewReaction | null};
export function reactToReview(id: number, type: ReviewReaction) {
  return api<ReviewReactionResult>(`/reviews/${id}/reaction`, 'PUT', {type});
}

export function usePublicReviews({query = '', category = 'All', location = '', page = 1, sort = 'newest', lang = 'en'}: PublicReviewFilters) {
  const {user} = useAuth();
  const [attempt, setAttempt] = useState(0);
  const params = new URLSearchParams({page: String(page), sort, lang});
  if (query.trim()) params.set('q', query.trim());
  if (category !== 'All' && category !== 'All Categories') params.set('category', category);
  if (location && location !== 'All Bangladesh') params.set('location', location);
  const endpoint = '/reviews?' + params;
  const key = `${endpoint}:${user?.id ?? 'guest'}:${attempt}`;
  const [snapshot, setSnapshot] = useState<{key: string; reviews: PublicReview[]; total: number; lastPage: number; error: string}>();
  useEffect(() => {
    let active = true;
    api<PublicReviewPage>(endpoint).then(result => {
      if (active) setSnapshot({key, reviews: result.data, total: result.total, lastPage: result.last_page, error: ''});
    }).catch(reason => {
      if (active) setSnapshot({key, reviews: [], total: 0, lastPage: 1, error: reason instanceof Error ? reason.message : 'Reviews are unavailable.'});
    });
    return () => {active = false;};
  }, [endpoint, key]);

  useEffect(() => {
    const handleReviewCreated = () => {
      setAttempt(value => value + 1);
    };
    window.addEventListener('truthhub:review_created', handleReviewCreated);
    return () => {
      window.removeEventListener('truthhub:review_created', handleReviewCreated);
    };
  }, []);

  const current = snapshot?.key === key ? snapshot : undefined;
  return {reviews: current?.reviews ?? [], total: current?.total ?? 0, lastPage: current?.lastPage ?? 1, loading: !current, error: current?.error ?? '', retry: () => setAttempt(value => value + 1)};
}
