import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Globe,
  Mail,
  BadgeCheck,
  PenLine,
  Building2,
} from 'lucide-react';
import { businessService } from '../../services/businessService';
import { ReviewCard } from '../../components/shared/ReviewCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StarRating } from '../../components/ui/StarRating';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../auth/AuthContext';
import { useComingSoon } from '../shared/ComingSoonContext';

type Tab = 'overview' | 'reviews' | 'photos' | 'about';

export default function BusinessDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openComingSoon } = useComingSoon();
  const [tab, setTab] = useState<Tab>('overview');

  const business = slug ? businessService.getBySlug(slug) : undefined;
  const reviews = business ? businessService.getReviewsForBusiness(business.id) : [];

  if (!business) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Building2 className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 text-2xl font-bold text-navy-900">Business not found</h1>
        <p className="mt-2 text-slate-500">This profile is not part of the Phase 1 mock catalog.</p>
        <Link to="/search" className="mt-6 inline-block text-teal-700 hover:underline">
          Back to search
        </Link>
      </div>
    );
  }

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    openComingSoon('Review publishing');
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'photos', label: 'Photos' },
    { id: 'about', label: 'About' },
  ];

  const distributionTotal = Object.values(business.ratingDistribution).reduce((a, b) => a + b, 0);

  return (
    <div>
      <section className="relative h-56 overflow-hidden sm:h-72">
        <img src={business.coverImage} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/30 to-transparent" />
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-16 relative z-10 flex flex-col gap-6 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-end gap-4">
            <img
              src={business.logo}
              alt={business.name}
              className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-white drop-shadow-sm">{business.name}</h1>
                {business.verified ? <Badge variant="verified">Verified</Badge> : null}
                {!business.claimed ? <Badge variant="muted">Unclaimed profile</Badge> : null}
              </div>
              <p className="mt-1 text-white/90">{business.category}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
                <MapPin className="h-4 w-4" />
                {business.location}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleWriteReview}>
              <PenLine className="h-4 w-4" />
              Write Review
            </Button>
            {!business.claimed ? (
              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => openComingSoon('Business claiming')}
              >
                Claim this business · Coming soon
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
                    tab === item.id
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-navy-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <StarRating rating={business.rating} size="md" />
                  <p className="mt-2 text-sm text-slate-500">{business.reviewCount} reviews</p>
                  <p className="mt-4 leading-relaxed text-slate-600">{business.description}</p>
                </Card>
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-navy-900">Recent reviews</h2>
                  {reviews.slice(0, 3).map((review) => (
                    <ReviewCard key={review.id} review={review} showBusiness={false} />
                  ))}
                </div>
              </div>
            )}

            {tab === 'reviews' && (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} showBusiness={false} />
                ))}
              </div>
            )}

            {tab === 'photos' && (
              <div className="grid gap-4 sm:grid-cols-2">
                {business.photos.map((photo) => (
                  <img
                    key={photo}
                    src={photo}
                    alt={`${business.name} photo`}
                    className="h-56 w-full rounded-2xl object-cover"
                  />
                ))}
              </div>
            )}

            {tab === 'about' && (
              <Card className="space-y-4 p-6">
                <h2 className="text-lg font-bold text-navy-900">Contact & location</h2>
                <p className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  {business.contact.address}
                </p>
                {business.contact.phone ? (
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4" /> {business.contact.phone}
                  </p>
                ) : null}
                {business.contact.email ? (
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4" /> {business.contact.email}
                  </p>
                ) : null}
                {business.contact.website ? (
                  <p className="flex items-center gap-2 text-sm text-teal-700">
                    <Globe className="h-4 w-4" /> {business.contact.website}
                  </p>
                ) : null}
              </Card>
            )}
          </div>

          <aside className="space-y-6">
            <Card className="p-6">
              <h2 className="font-bold text-navy-900">Rating breakdown</h2>
              <div className="mt-4 space-y--2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = business.ratingDistribution[stars as keyof typeof business.ratingDistribution];
                  const width = distributionTotal ? (count / distributionTotal) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-sm">
                      <span className="w-8 text-slate-500">{stars}★</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${width}%` }} />
                      </div>
                      <span className="w-8 text-right text-slate-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {!business.claimed ? (
              <Card className="border-dashed p-6">
                <BadgeCheck className="h-6 w-6 text-indigo-600" />
                <h3 className="mt-3 font-bold text-navy-900">Unclaimed profile</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Business claiming and verification will arrive in a future phase.
                </p>
              </Card>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
