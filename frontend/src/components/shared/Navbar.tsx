import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  PenLine,
  ShieldAlert,
  Bookmark,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { useComingSoon } from '../../features/shared/ComingSoonContext';
import { Button } from '../ui/Button';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { openComingSoon } = useComingSoon();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileOpen(false);
    }
  };

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    openComingSoon(
      'Review publishing',
      "We're currently building the review publishing system. For Phase 1 you can explore TruthHubBD and create your account.",
    );
  };

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-sm font-bold text-white shadow-sm">
            T
          </span>
          <span className="text-lg font-extrabold tracking-tight text-navy-900">
            Truth<span className="text-teal-600">Hub</span>
            <span className="ml-1 rounded-md bg-teal-50 px-1.5 py-0.5 text-xs font-semibold text-teal-700">
              BD
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-teal-700">
            Home
          </Link>
          <Link to="/search" className="text-sm font-medium text-slate-600 hover:text-teal-700">
            Explore
          </Link>
          <Link
            to="/scam-alerts"
            className="text-sm font-medium text-slate-600 hover:text-coral-700"
          >
            Scam Alerts
          </Link>
        </nav>

        <form onSubmit={handleSearch} className="hidden max-w-sm flex-1 lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search businesses, products, doctors..."
              className="w-full rounded-full border border-slate-200 bg-slate-50/80 py-2 pl-10 pr-4 text-sm focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </form>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="outline" size="sm" onClick={handleWriteReview}>
            <PenLine className="h-4 w-4" />
            Write Review
          </Button>

          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-navy-900 hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <User className="h-4 w-4" />
                  </span>
                )}
                <span className="max-w-[120px] truncate">{user.name}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {dropdownOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10"
                >
                  <Link
                    to="/profile"
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="h-4 w-4" /> My Profile
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setDropdownOpen(false);
                      openComingSoon('My Reviews');
                    }}
                  >
                    <PenLine className="h-4 w-4" /> My Reviews · Coming soon
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setDropdownOpen(false);
                      openComingSoon('Saved items');
                    }}
                  >
                    <Bookmark className="h-4 w-4" /> Saved · Coming soon
                  </button>
                  <Link
                    to="/profile"
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-coral-700 hover:bg-coral-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:text-teal-700"
              >
                Login
              </Link>
              <Link to="/register">
                <Button size="sm">Create Account</Button>
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <form onSubmit={handleSearch} className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm"
            />
          </form>
          <div className="space-y-2">
            <Link to="/" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
              Home
            </Link>
            <Link to="/search" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
              Explore
            </Link>
            <Link
              to="/scam-alerts"
              className="flex items-center gap-2 py-2 text-sm font-medium text-coral-700"
              onClick={() => setMobileOpen(false)}
            >
              <ShieldAlert className="h-4 w-4" /> Scam Alerts
            </Link>
            <Button className="mt-2 w-full" variant="outline" onClick={handleWriteReview}>
              Write Review
            </Button>
            {isAuthenticated && user ? (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <Link to="/profile" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
                  My Profile
                </Link>
                <button type="button" className="w-full py-2 text-left text-sm text-coral-700" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2 border-t border-slate-100 pt-3">
                <Link to="/login" className="flex-1 rounded-xl border py-2 text-center text-sm" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="flex-1 rounded-xl bg-navy-900 py-2 text-center text-sm text-white" onClick={() => setMobileOpen(false)}>
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
