import { Link } from 'react-router-dom';
import { ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-navy-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 font-bold text-white">
                T
              </span>
              <span className="text-lg font-bold text-white">
                Truth<span className="text-teal-400">Hub</span>BD
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              TruthHubBD helps people in Bangladesh make better decisions using community
              experiences. Phase 1 is a product preview with real authentication and mock
              discovery content.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-teal-900/40 bg-teal-950/30 px-3 py-2 text-xs font-medium text-teal-300">
              <ShieldCheck className="h-4 w-4" />
              Phase 1 preview · mock community content
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
              Explore
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/search" className="hover:text-teal-400">Search</Link></li>
              <li><Link to="/search?cat=restaurants" className="hover:text-teal-400">Restaurants</Link></li>
              <li><Link to="/search?cat=hospitals" className="hover:text-teal-400">Hospitals</Link></li>
              <li><Link to="/scam-alerts" className="hover:text-coral-400">Scam Alerts</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
              Account
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-teal-400">Login</Link></li>
              <li><Link to="/register" className="hover:text-teal-400">Create Account</Link></li>
              <li><Link to="/profile" className="hover:text-teal-400">Profile</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>&copy; {new Date().getFullYear()} TruthHubBD. Built for community trust in Bangladesh.</span>
          <span className="inline-flex items-center gap-1">
            Made with <Heart className="h-3 w-3 fill-coral-500 text-coral-500" /> for informed choices
          </span>
        </div>
      </div>
    </footer>
  );
}
