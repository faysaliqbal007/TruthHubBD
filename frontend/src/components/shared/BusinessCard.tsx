import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { Business } from '../../types';
import { Card } from '../ui/Card';
import { StarRating } from '../ui/StarRating';
import { Badge } from '../ui/Badge';

export function BusinessCard({ business }: { business: Business }) {
  return (
    <Link to={`/business/${business.slug}`} className="block h-full">
      <Card hover className="h-full overflow-hidden">
        <div className="relative h-36 overflow-hidden">
          <img
            src={business.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 to-transparent" />
          <img
            src={business.logo}
            alt={business.name}
            className="absolute bottom-3 left-3 h-12 w-12 rounded-xl border-2 border-white object-cover shadow-md"
          />
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-navy-900">{business.name}</h3>
              <p className="text-sm text-slate-500">{business.category}</p>
            </div>
            {business.verified ? <Badge variant="verified">Verified</Badge> : null}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{business.location}</span>
          </div>
          <StarRating rating={business.rating} />
          <p className="text-xs text-slate-500">{business.reviewCount} community reviews</p>
        </div>
      </Card>
    </Link>
  );
}
