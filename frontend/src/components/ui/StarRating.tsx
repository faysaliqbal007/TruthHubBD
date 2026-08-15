import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md';
  showValue?: boolean;
}

export function StarRating({ rating, size = 'sm', showValue = true }: StarRatingProps) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center" aria-label={`Rating ${rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              iconSize,
              index < Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-200 text-slate-200',
            )}
          />
        ))}
      </div>
      {showValue ? (
        <span className="text-sm font-semibold text-navy-900">{rating.toFixed(1)}</span>
      ) : null}
    </div>
  );
}
