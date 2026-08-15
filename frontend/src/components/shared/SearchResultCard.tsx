import { Link } from 'react-router-dom';
import { Package, Store } from 'lucide-react';
import type { SearchResult } from '../../types';
import { Card } from '../ui/Card';
import { StarRating } from '../ui/StarRating';

export function SearchResultCard({ result }: { result: SearchResult }) {
  const href =
    result.type === 'business'
      ? `/business/${result.slug}`
      : `/product/${result.slug}`;

  return (
    <Link to={href} className="block">
      <Card hover className="flex gap-4 p-4">
        <img
          src={result.image}
          alt=""
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {result.type === 'business' ? (
              <Store className="h-4 w-4 text-teal-600" />
            ) : (
              <Package className="h-4 w-4 text-indigo-600" />
            )}
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {result.type}
            </span>
          </div>
          <h3 className="mt-1 font-bold text-navy-900">{result.name}</h3>
          <p className="text-sm text-slate-500">{result.subtitle}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-teal-700">{result.category}</span>
            {result.rating ? <StarRating rating={result.rating} size="sm" /> : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
