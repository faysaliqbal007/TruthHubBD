import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Menu, X, ShieldAlert } from 'lucide-react';


interface NavbarProps {
  currentUser: { name: string; email: string; role: 'user' | 'admin' } | null;
  onLogout: () => void;
}

export default function Navbar({ currentUser, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-600 text-white font-bold text-lg shadow-sm">
                T
              </span>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Truth<span className="text-brand-600">Hub</span><span className="text-xs font-semibold px-1 py-0.5 rounded-sm bg-brand-50 text-brand-700 ml-1 border border-brand-100">BD</span>
              </span>
            </Link>
          </div>

          {/* Inline Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 items-center justify-center max-w-md mx-8">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Search doctors, hospitals, restaurants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-full text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-slate-400"
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            </form>
          </div>

          {/* Right Action Menu (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/search?cat=doctor" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Doctors</Link>
            <Link to="/search?cat=hospital" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Hospitals</Link>
            <Link to="/search?cat=restaurant" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Restaurants</Link>

            <span className="h-4 w-px bg-slate-200"></span>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link 
                  to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} 
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-brand-600 transition-colors"
                >
                  {currentUser.role === 'admin' ? (
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                  ) : (
                    <User className="h-4 w-4 text-slate-500" />
                  )}
                  <span>{currentUser.name}</span>
                </Link>
                <button
                  onClick={() => {
                    onLogout();
                    navigate('/');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-rose-600 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-brand-600 px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 shadow-sm hover:shadow-md transition-all"
                >
                  Join TruthHub
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger Menu Icon (Mobile) */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-brand-500"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative mt-1">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </form>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              to="/search?cat=doctor"
              onClick={() => setIsOpen(false)}
              className="text-base font-medium text-slate-700 hover:text-brand-600 py-1"
            >
              Doctors Category
            </Link>
            <Link
              to="/search?cat=hospital"
              onClick={() => setIsOpen(false)}
              className="text-base font-medium text-slate-700 hover:text-brand-600 py-1"
            >
              Hospitals Category
            </Link>
            <Link
              to="/search?cat=restaurant"
              onClick={() => setIsOpen(false)}
              className="text-base font-medium text-slate-700 hover:text-brand-600 py-1"
            >
              Restaurants Category
            </Link>
          </div>

          <div className="border-t border-slate-100 pt-3">
            {currentUser ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-900">
                  Signed in as <span className="text-brand-600">{currentUser.name}</span>
                </div>
                <Link
                  to={currentUser.role === 'admin' ? '/admin' : '/dashboard'}
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  My Dashboard
                </Link>
                <button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                    navigate('/');
                  }}
                  className="block w-full text-center px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
