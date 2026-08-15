import { Link } from 'react-router-dom';
import { MessageCircle, ThumbsUp } from 'lucide-react';
import type { Review } from '../../types';
import { Card } from '../ui/Card';
import { StarRating } from '../ui/StarRating';
import { formatDate } from '../../lib/utils';

export function ReviewCard({ review, showBusiness = true }: { review: Review; showBusiness?: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <img
          src={review.avatar}
          alt=""
          className="h-11 w-11 rounded-full bg-slate-100"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-navy-900">{review.author}</p>
              <p className="text-xs text-slate-500">{formatDate(review.date)}</p>
            </div>
            <StarRating rating={review.rating} showValue={false} />
          </div>
          <h3 className="mt-3 text-base font-bold text-navy-900">{review.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.body}</p>
          {showBusiness ? (
            <Link
              to={`/business/${review.businessSlug}`}
              className="mt-3 inline-block text-sm font-medium text-teal-700 hover:text-teal-800"
            >
              {review.businessName}
            </Link>
          ) : null}
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />
              {review.helpfulCount} helpful
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {review.commentCount} comments
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
