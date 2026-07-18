import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, CheckCircle } from 'lucide-react';


export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & Mission */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500 text-white font-bold text-base">
                T
              </span>
              <span className="font-extrabold text-lg text-white">
                Truth<span className="text-brand-400">Hub</span>BD
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm mb-4 leading-relaxed">
              TruthHubBD is a community-driven review and transparency platform. We empower Bangladeshi citizens to share honest, proof-backed experiences about healthcare, dining, hospitality, and businesses.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-400 font-semibold bg-brand-950/40 border border-brand-900/30 p-2.5 rounded-lg max-w-xs">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand-500" />
              <span>100% Volunteer Moderated & Free Platform</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Browse Reviews</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/search?cat=doctor" className="hover:text-brand-400 transition-colors">Doctors in Dhaka</Link>
              </li>
              <li>
                <Link to="/search?cat=hospital" className="hover:text-brand-400 transition-colors">Hospitals & Clinics</Link>
              </li>
              <li>
                <Link to="/search?cat=restaurant" className="hover:text-brand-400 transition-colors">Popular Restaurants</Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-brand-400 transition-colors">All Categories</Link>
              </li>
            </ul>
          </div>

          {/* Platform Guidelines */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Trust & Guidelines</h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-1.5 hover:text-white transition-colors cursor-help group">
                <CheckCircle className="h-3.5 w-3.5 text-brand-500" />
                <span className="text-slate-400 group-hover:text-brand-400">How verification works</span>
              </li>
              <li className="hover:text-brand-400 transition-colors cursor-pointer">
                <span>Code of Conduct</span>
              </li>
              <li className="hover:text-brand-400 transition-colors cursor-pointer">
                <span>Terms of Service</span>
              </li>
              <li className="hover:text-brand-400 transition-colors cursor-pointer text-rose-400 font-medium">
                <span>Report Fake Reviews</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} TruthHubBD. Community Platform for Transparency in Bangladesh.
          </div>
          <div className="flex items-center gap-1">
            <span>Made for public welfare with</span>
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
            <span>by Bangladeshi Citizens.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
