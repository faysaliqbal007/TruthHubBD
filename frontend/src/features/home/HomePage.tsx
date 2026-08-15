import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Share2,
  BadgeCheck,
  MessageSquareWarning,
  Megaphone,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useState } from 'react';
import { BusinessCard } from '../../components/shared/BusinessCard';
import { ReviewCard } from '../../components/shared/ReviewCard';
import { ScamAlertCard } from '../../components/shared/ScamAlertCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { businessService } from '../../services/businessService';
import { searchService } from '../../services/searchService';
import { scamAlertService } from '../../services/scamAlertService';

const iconMap: Record<string, keyof typeof LucideIcons> = {
  Cpu: 'Cpu',
  UtensilsCrossed: 'UtensilsCrossed',
  Hospital: 'Hospital',
  Stethoscope: 'Stethoscope',
  GraduationCap: 'GraduationCap',
  Wifi: 'Wifi',
  ShoppingBag: 'ShoppingBag',
  Truck: 'Truck',
};

export default function HomePage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const categories = searchService.getCategories();
  const featured = businessService.getFeatured(4);
  const recentReviews = businessService.getRecentReviews(3);
  const scamPreview = scamAlertService.getFeatured(2);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.12),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white/70 px-4 py-2 text-sm font-semibold text-teal-700 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Community trust for Bangladesh
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-navy-900 sm:text-5xl lg:text-6xl">
              Know before you choose.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Discover real experiences about businesses, products and services across
              Bangladesh. TruthHubBD helps you search, read, and decide with confidence.
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search businesses, products, doctors..."
                  className="w-full rounded-2xl border border-slate-200 bg-white/90 py-4 pl-12 pr-36 text-base shadow-lg shadow-slate-900/5 backdrop-blur focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
                  Search
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-navy-900">Explore categories</h2>
            <p className="mt-1 text-slate-500">Browse the kinds of experiences TruthHubBD will cover.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/search')}>
            View all <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = LucideIcons[iconMap[category.icon] ?? 'Search'];
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => navigate(`/search?cat=${category.slug}`)}
                className="text-left"
              >
                <Card hover className="h-full p-5">
                  <div className="mb-4 inline-flex rounded-2xl bg-teal-50 p-3 text-teal-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-navy-900">{category.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{category.description}</p>
                </Card>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white/50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy-900">Featured businesses</h2>
          <p className="mt-1 text-slate-500">Popular fictional profiles for the Phase 1 preview.</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-navy-900">Recent community reviews</h2>
        <p className="mt-1 text-slate-500">Mock review cards showing the future reading experience.</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {recentReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>

      <section className="border-y border-coral-100 bg-coral-50/40 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-navy-900">Scam Alert preview</h2>
              <p className="mt-1 max-w-2xl text-slate-600">
                Demonstration cases only. Fictional entities preview the moderated Scam Alert system.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/scam-alerts')}>
              Browse Scam Alerts
            </Button>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {scamPreview.map((alert) => (
              <ScamAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-navy-900">How TruthHubBD works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { icon: Search, title: 'Search', text: 'Find businesses, products, and services.' },
            { icon: BookOpen, title: 'Read experiences', text: 'Learn from structured community reviews.' },
            { icon: Sparkles, title: 'Make a better decision', text: 'Compare ratings, alerts, and context.' },
            { icon: Share2, title: 'Share your experience', text: 'Review publishing arrives in a later phase.' },
          ].map((step) => (
            <Card key={step.title} className="p-6 text-center">
              <div className="mx-auto mb-4 inline-flex rounded-2xl bg-indigo-50 p-3 text-indigo-700">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-navy-900">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{step.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-navy-950 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Future platform features</h2>
          <p className="mt-2 max-w-2xl text-slate-300">
            Phase 1 shows the vision. These capabilities are on the roadmap and marked Coming soon where visible.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BadgeCheck, label: 'Verified business profiles' },
              { icon: MessageSquareWarning, label: 'Structured reviews & business replies' },
              { icon: ShieldCheck, label: 'Moderated Scam Alerts with evidence' },
              { icon: Megaphone, label: 'Clearly labeled sponsored discovery' },
              { icon: Sparkles, label: 'Community-added products' },
              { icon: Share2, label: 'Profile claiming & contributions' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm"
              >
                <item.icon className="h-5 w-5 text-teal-400" />
                <span className="text-sm font-medium text-slate-100">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
