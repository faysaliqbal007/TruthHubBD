"use client";
import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowDownUp,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  Globe,
  GraduationCap,
  Home,
  Hospital,
  Languages,
  LayoutGrid,
  Laptop,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Stethoscope,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  BookmarkCheck,
  Tag,
  Truck,
  User,
  UserCheck,
  X
} from "lucide-react";
import { bookmarkService, SavedReview, SavedAlert, SavedBusiness } from "../src/services/bookmarkService";
import { api } from "../src/services/api";
import { AuthProvider, useAuth } from "../src/features/auth/AuthContext";
import { NotificationsPage, ReviewDetailPage, ClaimPage, ModerationPage, PoliciesPage } from '../src/components/WorkspacePages';
import { NotificationBellPopover } from '../src/components/NotificationBellPopover';
import { ActivityPage, BusinessCenterPage, StaffRecordsPage } from '../src/components/OperationsPages';
import { GoogleMap } from '../src/components/GoogleMap';
import {PublicVideoLinks} from '../src/components/PublicVideoLinks';
import {AdsHub} from '../src/components/AdsHub';
import {AdvertisementDesk} from '../src/components/AdvertisementDesk';
import { AboutPage } from '../src/components/AboutPage';
import { TrustSafetyPage } from '../src/components/TrustSafetyPage';
import { HowToUsePage } from '../src/components/HowToUsePage';
import '../src/components/auth-editorial.css';
import {OrganizationCases} from '../src/components/OrganizationCases';
import {BangladeshHelp} from '../src/components/BangladeshHelp';
import {AlertReportPlanner} from '../src/components/AlertReportPlanner';
import {AlertSafetySteps} from '../src/components/AlertSafetySteps';
import { ReportPage, SaveEntity } from '../src/components/ReportPage';
import { AdminTools } from '../src/components/AdminTools';
import { SecurityPage } from '../src/components/SecurityPage';
import {SubmitCasePage} from '../src/components/SubmitCasePage';
import { authService } from "../src/services/authService";
import { businessService } from "../src/services/businessService";
import { useCases } from '../src/services/cases';
import type { Business, ScamAlert } from "../src/types";
import {AdminDashboard,StaffWorkspace} from '../src/components/AdminWorkspace';
import {AdminOrganizationQueue} from '../src/components/AdminOrganizationQueue';
import {AdminUsersDesk} from '../src/components/AdminUsersDesk';
import {BroadcastNoticePanel} from '../src/components/BroadcastNoticePanel';
import {loginDestination,staffHome} from '../src/lib/staffDestination';
import { AddBusinessModal, BusinessCard, CategoryDropdown, ComingSoonModal, EditBusinessModal, Logo, WriteReviewModal } from "../src/components/UI";
import { LocationPicker } from "../src/components/LocationPicker";
import { formatLocation, districts } from "../src/data/bd-locations";
import { GlobalQuickSearch } from "../src/components/GlobalQuickSearch";
import { AreaPickerModal } from "../src/components/AreaPickerModal";
import { ThreadedComments } from "../src/components/ui/ThreadedComments";
import { EntitySuggestions } from '../src/components/EntitySuggestions';
import {CivicHome} from '../src/components/CivicHome';
import {PublicMediaGallery} from '../src/components/ui/PublicMediaGallery';
import {ReportContentLink} from '../src/components/ui/ReportContentLink';
import {ReviewReactions} from '../src/components/ui/ReviewReactions';
import {ShareCard} from '../src/components/ShareCard';
import './public-alert-refinement.css';
import {CommunityFooter} from '../src/components/CommunityFooter';
import {selectAlertFeedOrder} from '../src/lib/alertFeedOrder';
import {DiscoverPage as CommunityDiscover} from '../src/components/DiscoverPage';
import {LanguageContext, useLanguage} from '../src/i18n/LanguageContext';
import {publicText, originalTextLabel} from '../src/i18n/content';
import {translateCategory, translateArea, formatNumber, formatDate, translateStatus, localizedError} from '../src/i18n/dictionary';

/* ============================================================
   LANGUAGE CONTEXT — EN / BN toggle
============================================================ */
type Lang = 'en' | 'bn';
const LangContext = LanguageContext;
const useLang = useLanguage;

const t: Record<string, Record<Lang, string>> = {
  directory:   { en: 'Discover',    bn: 'খুঁজে দেখুন' },
  discover:    { en: 'Discover',    bn: 'খুঁজে দেখুন' },
  scamAlerts:  { en: 'Scam Alerts',  bn: 'প্রতারণা সতর্কতা' },
  writeReview: { en: 'Write Review', bn: 'রিভিউ লিখুন' },
  howItWorks:  { en: 'Guidelines',   bn: 'নির্দেশিকা' },
  login:       { en: 'Log in',       bn: 'লগ ইন' },
  signup:      { en: 'Sign up',      bn: 'সাইন আপ' },
  home:        { en: 'Home',         bn: 'হোম' },
  report:      { en: 'Report to Admin', bn: 'এডমিন রিপোর্ট' },
  account:     { en: 'Account',      bn: 'অ্যাকাউন্ট' },
  search:      { en: 'Search',       bn: 'অনুসন্ধান' },
  myProfile:   { en: 'My Profile',   bn: 'আমার প্রোফাইল' },
  myReviews:   { en: 'My Reviews',   bn: 'আমার রিভিউ' },
  logOut:      { en: 'Log out',      bn: 'লগ আউট' },
  signIn:      { en: 'Sign In',      bn: 'সাইন ইন' },
  allDistricts:{ en: 'All Districts',bn: 'সব জেলা' },
  filterByLoc: { en: 'Filter by location', bn: 'এলাকা অনুযায়ী ফিল্টার' },
  allCategories: { en: 'All Categories', bn: 'সকল ক্যাটাগরি' },
  recentReviewsTitle: { en: 'Recent Nationwide Reviews', bn: 'সর্বশেষ নাগরিক রিভিউ' },
  publicAlertsTitle: { en: 'Public Scam Alert Notices', bn: 'সতর্কতামূলক গণবিজ্ঞপ্তি' },
  viewAllAlerts: { en: 'View all alerts →', bn: 'সকল সতর্কতা দেখুন →' },
  exploreDirectory: { en: 'Explore Directory', bn: 'ডিরেক্টরি ব্রাউজ করুন' },
  verifiedTag: { en: 'Verified Citizen', bn: 'যাচাইকৃত নাগরিক' },
};

const categories = [
  { name: "Products", bnName: "পণ্যসামগ্রী", icon: Laptop, count: "1,240" },
  { name: "Businesses & Services", bnName: "ব্যবসা ও সেবা", icon: Building2, count: "3,890" },
  { name: "Doctors & Professionals", bnName: "ডাক্তার ও পেশাজীবী", icon: Stethoscope, count: "840" },
  { name: "Hospitals & Clinics", bnName: "হাসপাতাল ও ক্লিনিক", icon: Hospital, count: "520" },
  { name: "Universities & Education", bnName: "শিক্ষা ও বিশ্ববিদ্যালয়", icon: GraduationCap, count: "310" },
  { name: "Courier & Digital Services", bnName: "কুরিয়ার ও ডিজিটাল সেবা", icon: Truck, count: "460" },
];

/* ============================================================
   LAYOUT WITH CLEAN HEADER & FOOTER
============================================================ */
function Layout() {
  const { user, checking, logout, setUser } = useAuth();
  const [accountMenu, setAccountMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [soonModal, setSoonModal] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [addBusinessModalOpen, setAddBusinessModalOpen] = useState(false);
  const [reviewBusiness, setReviewBusiness] = useState<Business | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [selectedArea, setSelectedAreaState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('thbd_selected_area') || 'All Bangladesh';
    }
    return 'All Bangladesh';
  });
  const setSelectedArea = (area: string) => {
    setSelectedAreaState(area);
    if (typeof window !== 'undefined') {
      localStorage.setItem('thbd_selected_area', area);
    }
  };
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('thbd_lang') as Lang) || 'en';
    }
    return 'en';
  });
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem('thbd_lang', l); };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const location = useLocation();
  const navigate = useNavigate();
  const staffRoute = /^\/(?:admin|moderation)(?:\/|$)/.test(location.pathname);

  // Global Ctrl+K shortcut for file search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setGlobalSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setAccountMenu(false);
    setShowNotifications(false);
    setReviewModalOpen(false);
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleGlobalClick = () => {
      setAccountMenu(false);
      setShowNotifications(false);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const openReviewModal = (b?: Business | null) => {
    if (!user) { navigate('/login'); return; }
    setReviewBusiness(b || null);
    setReviewModalOpen(true);
  };

  const toggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotifications((prev) => !prev);
    setAccountMenu(false);
  };

  const toggleAccountMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAccountMenu((v) => {
      if (!v) setShowNotifications(false);
      return !v;
    });
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
    <div className={staffRoute?'site-shell staff-site-shell':'site-shell'}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {!staffRoute&&<header className="site-header">
        <div className="header-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />

          {/* Desktop Navigation with refined Editorial Civic links */}
          <nav className="header-nav header-nav-desktop" aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/search" className="nav-link" style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 6 }}>
              <Search size={15} />
              {t.directory[lang]}
            </Link>

            <Link to="/scam-alerts" className="nav-link header-scam-action" style={{ fontWeight: 600, fontSize: 14.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 6 }}>
              <AlertTriangle size={15} aria-hidden="true" />
              {t.scamAlerts[lang]}
            </Link>

            <button
              type="button"
              className="btn-pill-light header-write-review"
              onClick={() => openReviewModal()}
            >
              <Plus size={16} aria-hidden="true" />
              {t.writeReview[lang]}
            </button>

            {/* Quick Search Shortcut Box */}
            <button
              className="btn-pill-light"
              style={{ padding: '6px 12px', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6 }}
              onClick={() => setGlobalSearchOpen(true)}
              title={lang === 'bn' ? 'প্রতিষ্ঠান, রিভিউ বা কেস খুঁজুন (Ctrl+K)' : 'Search organizations, reviews or cases (Ctrl+K)'}
            >
              <Search size={13} color="var(--ink)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>{lang === 'bn' ? 'খুঁজুন' : 'FIND'}</span>
              <kbd style={{ fontSize: 9.5, background: 'var(--ink)', color: '#FFFFFF', padding: '1px 5px', borderRadius: 3 }}>
                Ctrl K
              </kbd>
            </button>

            {/* Language Toggle */}
            <button
              className="btn-pill-light"
              style={{ padding: '6px 14px', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, borderRadius: 6 }}
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              aria-label="Toggle language"
              title={lang === 'en' ? 'Switch to Bangla' : 'Switch to English'}
            >
              <Languages size={14} color="var(--ink)" />
              <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{lang === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* Notification Bell */}
            {user && (
              <div style={{ position: 'relative' }}>
                <button
                  className="btn-pill-light"
                  style={{ width: 38, height: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', cursor: 'pointer', position: 'relative', borderRadius: 6 }}
                  onClick={toggleNotifications}
                  aria-label={lang === 'bn' ? 'বিজ্ঞপ্তি দেখুন' : 'View notifications'}
                >
                  <Bell size={16} color="var(--ink)" />
                  {(user.unread_notifications ?? 0) > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />}
                </button>
                {showNotifications && (
                  <NotificationBellPopover
                    lang={lang}
                    onClose={() => setShowNotifications(false)}
                    onRefreshUser={() => {
                      authService.currentUser().then(({ user: u }) => u && setUser(u)).catch(() => {});
                    }}
                  />
                )}
              </div>
            )}

            {/* User Account / Auth */}
            {checking ? (
              <span style={{ width: 44, height: 44, borderRadius: "50%", background: "#e2e8f0", display: "inline-block" }} />
            ) : user ? (
              <div style={{ position: "relative" }}>
                <button className="user-avatar-circle" onClick={toggleAccountMenu} aria-label={lang === 'bn' ? 'অ্যাকাউন্টের মেনু' : 'User profile menu'} style={{ overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url.startsWith('http') ? user.avatar_url : (user.avatar_url.startsWith('/') ? user.avatar_url : '/' + user.avatar_url)}
                      alt={user.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) parent.innerText = user.name.slice(0, 2).toUpperCase();
                      }}
                    />
                  ) : (
                    user.name.slice(0, 2).toUpperCase()
                  )}
                </button>
                {accountMenu && (
                  <div className="user-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                    <Link to="/profile" onClick={() => setAccountMenu(false)}><User size={15} />{t.myProfile[lang]} ({user.name.split(" ")[0]})</Link>
                    <Link to="/profile?tab=cases" onClick={() => setAccountMenu(false)} style={{ color: "#B93628", fontWeight: 700 }}>
                      <ShieldAlert size={15} color="#B93628" />
                      {lang === 'bn' ? 'আমার স্ক্যাম কেস ও ট্র্যাকিং' : 'My Reported Cases'}
                    </Link>
                    <button onClick={() => { setAccountMenu(false); navigate('/activity'); }}><MessageSquare size={15} />{t.myReviews[lang]}</button>
                    <Link to="/notifications" onClick={() => setAccountMenu(false)}>{lang === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}</Link>
                    <Link to="/business-center" onClick={() => setAccountMenu(false)}>{lang === 'bn' ? 'প্রতিষ্ঠান ব্যবস্থাপনা' : 'Organization center'}</Link>
                    {['admin','moderator'].includes(user.role) && <Link to="/moderation" onClick={() => setAccountMenu(false)}>{lang === 'bn' ? 'পর্যালোচনা ডেস্ক' : 'Staff workspace'}</Link>}
                    <button onClick={handleLogout} style={{ color: "#dc2626" }}><LogOut size={15} />{t.logOut[lang]}</button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <Link to="/login" className="btn-pill-light">{t.login[lang]}</Link>
                <Link to="/register" className="btn-teal-pill">{t.signup[lang]}</Link>
              </div>
            )}
          </nav>


          {/* Mobile Header: Bell + Search + Hamburger */}
          <div className="header-mobile-actions">
            <button
              className="lang-toggle-btn lang-toggle-sm"
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              aria-label="Toggle language"
            >
              {lang === 'en' ? 'বাং' : 'EN'}
            </button>

            <button className="header-icon-btn" onClick={()=>setGlobalSearchOpen(true)} aria-label={lang === 'bn' ? 'প্রতিষ্ঠান, রিভিউ ও কেস খুঁজুন' : 'Search listings, reviews and cases'}>
              <Search size={17} />
            </button>

            {user && (
              <Link
                to="/notifications"
                className="header-icon-btn"
                aria-label={lang === 'bn' ? 'বিজ্ঞপ্তি দেখুন' : 'View notifications'}
                title={lang === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}
                style={{ position: 'relative' }}
              >
                <Bell size={17} />
                {(user.unread_notifications ?? 0) > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, background: '#ef4444', borderRadius: '50%' }} />}
              </Link>
            )}

            <button
              className={`hamburger-btn ${drawerOpen ? "open" : ""}`}
              onClick={() => setDrawerOpen(v => !v)}
              aria-label={lang === 'bn' ? 'মেনু খুলুন' : 'Open navigation menu'}
              aria-expanded={drawerOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>}

      {/* Mobile Nav Drawer */}
      {drawerOpen && (
        <>
          <div className="mobile-nav-drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <nav className="mobile-nav-drawer" aria-label="Mobile navigation">
            <button className="btn-pill-light" onClick={()=>{setDrawerOpen(false);setGlobalSearchOpen(true);}}><Search size={18}/> {lang === 'bn' ? 'প্রতিষ্ঠান, রিভিউ ও কেস খুঁজুন' : 'Search listings, reviews and cases'}</button>
            <div className="drawer-header">
              <Logo />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="lang-toggle-btn"
                  onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                  aria-label="Toggle language"
                >
                  <Languages size={14} />
                  <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
                </button>
                <button className="drawer-close-btn" onClick={() => setDrawerOpen(false)} aria-label={lang === 'bn' ? 'মেনু বন্ধ করুন' : 'Close menu'}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="drawer-links">
              <Link to="/" className="drawer-link">
                <span className="drawer-link-icon"><Home size={18} /></span>
                {t.home[lang]}
              </Link>
              <Link to="/search" className="drawer-link">
                <span className="drawer-link-icon"><Search size={18} /></span>
                {t.discover[lang]}
              </Link>
              <Link to="/scam-alerts" className="drawer-link drawer-scam-action">
                <span className="drawer-link-icon"><AlertTriangle size={18} aria-hidden="true" /></span>
                {t.scamAlerts[lang]}
              </Link>
              <button
                type="button"
                className="drawer-link"
                onClick={() => { setDrawerOpen(false); openReviewModal(); }}
              >
                <span className="drawer-link-icon"><Plus size={18} aria-hidden="true" /></span>
                {t.writeReview[lang]}
              </button>
              <div className="drawer-divider" />
              {user ? (
                <>
                  <Link to="/profile" className="drawer-link">
                    <span className="drawer-link-icon" style={{ overflow: 'hidden', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url.startsWith('http') ? user.avatar_url : (user.avatar_url.startsWith('/') ? user.avatar_url : '/' + user.avatar_url)}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <User size={18} />
                      )}
                    </span>
                    {t.myProfile[lang]}
                  </Link>
                  <Link to="/profile?tab=cases" className="drawer-link" onClick={() => setDrawerOpen(false)}>
                    <span className="drawer-link-icon"><ShieldAlert size={18} color="#B93628" /></span>
                    {lang === 'bn' ? 'আমার স্ক্যাম কেস ও ট্র্যাকিং' : 'My Reported Cases'}
                  </Link>
                  <Link to="/activity" className="drawer-link" onClick={() => setDrawerOpen(false)}>
                    <span className="drawer-link-icon"><MessageSquare size={18} /></span>
                    {t.myReviews[lang]}
                  </Link>
                  <Link to="/notifications" className="drawer-link" onClick={() => setDrawerOpen(false)}>
                    <span className="drawer-link-icon"><Bell size={18} /></span>
                    {lang === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}
                  </Link>
                  <Link to="/business-center" className="drawer-link" onClick={() => setDrawerOpen(false)}>
                    <span className="drawer-link-icon"><Building2 size={18} /></span>
                    {lang === 'bn' ? 'প্রতিষ্ঠান ব্যবস্থাপনা' : 'Organization center'}
                  </Link>
                  {['admin','moderator'].includes(user.role) && (
                    <Link to="/moderation" className="drawer-link">
                      <span className="drawer-link-icon"><ShieldCheck size={18} /></span>
                      Staff Workspace
                    </Link>
                  )}
                  <div className="drawer-divider" />
                  <button className="drawer-link danger" onClick={handleLogout}>
                    <span className="drawer-link-icon"><LogOut size={18} /></span>
                    {t.logOut[lang]}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="drawer-link">
                    <span className="drawer-link-icon"><User size={18} /></span>
                    {t.login[lang]}
                  </Link>
                  <Link to="/register" className="drawer-link highlight">
                    <span className="drawer-link-icon"><ShieldCheck size={18} /></span>
                    {t.signup[lang]}
                  </Link>
                </>
              )}
              <div className="drawer-divider" />
              <Link to="/policies" className="drawer-link">
                <span className="drawer-link-icon"><FileText size={18} /></span>
                {t.howItWorks[lang]}
              </Link>
            </div>
          </nav>
        </>
      )}


      {/* Main Content */}
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route
            path="/"
            element={
              <CivicHome
                lang={lang}
                openReview={openReviewModal}
                openArea={() => setAreaModalOpen(true)}
                selectedArea={selectedArea}
              />
            }
          />
          <Route
            path="/search"
            element={
              <CommunityDiscover lang={lang} onWriteReview={() => openReviewModal()} businessView={<DiscoverPage
                openSoon={setSoonModal}
                onOpenAddBusiness={() => setAddBusinessModalOpen(true)}
                selectedArea={selectedArea}
                openArea={() => setAreaModalOpen(true)}
                onSelectArea={(a) => setSelectedArea(a)}
              />} />
            }
          />
          <Route path="/business/:slug" element={<BusinessDetailPage openSoon={setSoonModal} openReview={openReviewModal} />} />
          <Route
            path="/scam-alerts"
            element={
              <ScamAlertsIndexPage
                openSoon={setSoonModal}
                selectedArea={selectedArea}
                openArea={() => setAreaModalOpen(true)}
                onSelectArea={(a) => setSelectedArea(a)}
              />
            }
          />
          <Route path="/scam-alerts/submit" element={<SubmitCasePage/>}/>
          <Route path="/scam-alerts/:slug" element={<ScamDetailPage openSoon={setSoonModal} />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/ads" element={<AdsHub />} />
          <Route path="/sponsored" element={<Navigate to="/ads" replace />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/reviews/:id" element={<ReviewDetailPage />} />
          <Route path="/claim" element={<ClaimPage />} />
          <Route path="/suggest-organization" element={<Navigate to="/claim" replace />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/trust-safety" element={<TrustSafetyPage />} />
          <Route path="/how-to-use" element={<HowToUsePage />} />
          <Route path="/report" element={<ReportPage lang={lang}/>} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/business-center" element={<BusinessCenterPage />} />
          <Route element={<StaffWorkspace/>}>
            <Route path="/admin" element={<AdminDashboard/>}/>
            <Route path="/admin/organizations" element={<AdminPage/>}/>
            <Route path="/moderation" element={<ModerationPage/>}/>
            <Route path="/admin/campaigns" element={<Navigate to="/admin/ads" replace />}/>
            <Route path="/admin/ads" element={<AdvertisementDesk/>}/>
            <Route path="/admin/tools" element={<AdminTools/>}/>
            <Route path="/admin/users" element={<AdminUsersDesk/>}/>
            <Route path="/admin/audit" element={<StaffRecordsPage kind="audit"/>}/>
            <Route path="/moderation/reports" element={<StaffRecordsPage kind="reports"/>}/>
            <Route path="/admin/broadcast" element={<BroadcastNoticePanel/>}/>
          </Route>
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/profile"
            element={
              <Protected>
                <ProfileEntry />
              </Protected>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer */}
      {!staffRoute&&<CommunityFooter lang={lang} onReview={() => openReviewModal()} />}

      {/* Bottom Tab Bar (Mobile Only) */}
      {!staffRoute&&<BottomTabBar onReport={() => navigate('/scam-alerts/submit')} onReview={() => openReviewModal()} lang={lang} />}

      <WriteReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        initialBusiness={reviewBusiness}
        onShowSoon={(feat) => setSoonModal(feat)}
        onOpenAddBusiness={() => setAddBusinessModalOpen(true)}
        onReviewSubmitted={(newRev, bizId) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('truthhub:review_created', {
                detail: { businessId: bizId, review: newRev }
              })
            );
          }
        }}
      />

      <AddBusinessModal
        open={addBusinessModalOpen}
        onClose={() => setAddBusinessModalOpen(false)}
        onBusinessAdded={(newB) => { navigate(`/business/${newB.slug}`); setReviewBusiness(newB); }}
      />

      <ComingSoonModal
        open={!!soonModal}
        feature={soonModal ?? "Feature"}
        onClose={useCallback(() => setSoonModal(null), [])}
      />

      {/* Global Instant File Search Overlay */}
      <GlobalQuickSearch
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
      />

      {/* Bangladesh Area Picker Modal */}
      <AreaPickerModal
        isOpen={areaModalOpen}
        onClose={() => setAreaModalOpen(false)}
        selectedArea={['/search','/scam-alerts'].includes(location.pathname) ? new URLSearchParams(location.search).get('location') || selectedArea : selectedArea}
        onSelectArea={(a) => {
          setSelectedArea(a);
          if (location.pathname === "/search" || location.pathname === "/scam-alerts") {
            const p = new URLSearchParams(location.search);
            if (a && !a.includes("All Bangladesh")) {
              p.set("location", a);
            } else {
              p.delete("location");
            }
            navigate(`${location.pathname}?${p.toString()}`);
          }
        }}
      />
    </div>
    </LangContext.Provider>
  );
}

/* ============================================================
   BOTTOM TAB BAR (Mobile Only)
============================================================ */
function BottomTabBar({ onReport, onReview, lang }: { onReport: () => void; onReview: () => void; lang: Lang }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const path = location.pathname;

  return (
    <div className="bottom-tab-bar" role="navigation" aria-label="Mobile navigation">
      <Link to="/" className={`bottom-tab-item ${path === '/' ? 'active' : ''}`} aria-label={t.home[lang]}>
        <Home size={22} />
        <span className={lang === 'bn' ? 'bangla' : ''}>{t.home[lang]}</span>
      </Link>
      <Link to="/search" className={`bottom-tab-item ${path.startsWith('/search') || path.startsWith('/business/') || path.startsWith('/reviews/') ? 'active' : ''}`} aria-label={t.directory[lang]}>
        <Search size={22} />
        <span className={lang === 'bn' ? 'bangla' : ''}>{t.directory[lang]}</span>
      </Link>
      <Link
        to="/scam-alerts"
        className={`bottom-tab-item tab-report ${path.startsWith('/scam-alerts') ? 'active' : ''}`}
        aria-label={lang === 'bn' ? 'সতর্কবার্তা' : 'Alerts'}
      >
        <AlertTriangle size={22} />
        <span className={lang === 'bn' ? 'bangla' : ''}>{lang === 'bn' ? 'সতর্কতা' : 'Alerts'}</span>
      </Link>
      {user ? (
        <Link to={staffHome(user?.role)} className={`bottom-tab-item ${path === '/profile' || path === '/activity' ? 'active' : ''}`} aria-label={t.account[lang]}>
          <User size={22} />
          <span className={lang === 'bn' ? 'bangla' : ''}>{t.account[lang]}</span>
        </Link>
      ) : (
        <Link to="/login" className={`bottom-tab-item ${path === '/login' || path === '/register' ? 'active' : ''}`} aria-label={t.signIn[lang]}>
          <User size={22} />
          <span className={lang === 'bn' ? 'bangla' : ''}>{t.signIn[lang]}</span>
        </Link>
      )}
    </div>
  );
}

function ScamStatus({ status }: { status?: string | null }) {
  const { lang } = useLang();
  if (!status) return null;
  const normalized = status.toLowerCase().trim().replace(/\s+/g, '_');
  // All scam alerts are public by default; do not show redundant "Published" badge
  if (normalized === 'published' || normalized === '') return null;

  const labels: Record<string, string> = {
    resolved: 'Resolved',
    disputed: 'Organization responded',
    business_responded: 'Organization responded',
    organization_responded: 'Organization responded',
    under_review: 'Under Review',
    submitted: 'Submitted',
    needs_evidence: 'Needs evidence',
    restricted: 'Restricted',
    not_enough_evidence: 'Not enough evidence'
  };

  const resolved = labels[normalized] || (normalized === 'resolved' ? 'Resolved' : status);
  if (!resolved || resolved.toLowerCase().trim() === 'published') return null;

  const className = resolved.toLowerCase().includes('resolved') ? "badge-scam-resolved" : "badge-scam-review";
  return <span className={className}>{resolved === "Under Review" && <Clock size={12} />}{translateStatus(resolved, lang)}</span>;
}

/* ============================================================
   HOMEPAGE
============================================================ */
function DiscoverPage({
  openSoon,
  onOpenAddBusiness,
  selectedArea,
  openArea,
  onSelectArea,
}: {
  openSoon: (s: string) => void;
  onOpenAddBusiness?: () => void;
  selectedArea?: string;
  openArea?: () => void;
  onSelectArea?: (area: string) => void;
}) {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const selectedCat = params.get("category") ?? "All Categories";
  const urlLocation = params.get("location") ?? "";
  const resultPage = Math.max(1, Number(params.get('page')) || 1);
  const ratingFilter = params.get('min_rating') || 'Any Rating';
  const [locationFilter, setLocationFilter] = useState(urlLocation || "");
  const [searchError, setSearchError] = useState('');
  const [directoryMeta, setDirectoryMeta] = useState({ total: 0, last_page: 1, imported_count: 0 });
  const [retrySearch, setRetrySearch] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Sync with URL parameter
  useEffect(() => {
    if (urlLocation !== undefined) {
      setLocationFilter(urlLocation);
    }
  }, [urlLocation]);

  // State for Issue #2 & #6: Backend search API database results
  const [results, setResults] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const minRating = ratingFilter === "Any Rating" ? 0 : parseFloat(ratingFilter);
  const { lang } = useLang();

  useEffect(() => {
    let isMounted = true;
    async function performSearch() {
      setLoading(true);
      try {
        const response = await businessService.searchPage(query, selectedCat, minRating, resultPage, locationFilter);
        if (isMounted) {
          setResults(response.data);
          setDirectoryMeta(response);
          setSearchError('');
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setSearchError((err as Error).message);
          setResults([]);
          setLoading(false);
        }
      }
    }
    const timer = setTimeout(performSearch, 300);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [query, selectedCat, minRating, resultPage, retrySearch, locationFilter]);

  const setQuery = (val: string) => {
    const p = new URLSearchParams(params);
    p.delete('page');
    if (val) p.set("q", val);
    else p.delete("q");
    setParams(p);
  };

  const handleCategoryChange = (cat: string) => {
    const p = new URLSearchParams(params);
    p.delete('page');
    if (cat !== "All Categories") p.set("category", cat);
    else p.delete("category");
    setParams(p);
  };

  const handleClearLocation = () => {
    setLocationFilter("");
    const p = new URLSearchParams(params);
    p.delete("location");
    setParams(p);
  };

  return (
    <div className="discover-container" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>
      {/* Editorial Civic Hero Card (Screenshot 2) */}
      <div className="editorial-hero-banner-card">

        {/* Filter Inputs Grid (Compact and elegant as shown in Screenshot 2) */}
        <div className="directory-filter-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#FFFFFF', border: '1px solid #D8CDB7', borderRadius: '9999px', flex: '1 1 280px', minHeight: 44, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <Search size={16} color="#64748B" />
            <input
              type="text"
              aria-label={lang === 'bn' ? 'প্রতিষ্ঠানের তালিকায় খুঁজুন' : 'Search the directory'}
              placeholder={lang === 'bn' ? 'পণ্য, প্রতিষ্ঠান, ডাক্তার বা সেবা খুঁজুন...' : 'Search an organization, product, doctor, hospital or university...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ border: 0, outline: 'none', background: 'transparent', width: '100%', fontSize: 13.5, color: 'var(--ink)' }}
            />
            {query && (
              <button style={{ border: 0, background: "transparent", cursor: "pointer", color: "#64748b" }} onClick={() => setQuery("")} aria-label={lang === 'bn' ? 'খোঁজার লেখা মুছুন' : 'Clear search'}>
                <X size={15} />
              </button>
            )}
          </div>

          <button type="button" className="directory-filter-toggle btn-pill-light" aria-expanded={filtersOpen} aria-controls="directory-filters" onClick={()=>setFiltersOpen(value=>!value)}><Tag size={18}/> {lang==='bn'?'ফিল্টার':'Filters'}{locationFilter?` · ${locationFilter}`:''} <ChevronDown size={16}/></button>
          <div id="directory-filters" className={`directory-filter-group ${filtersOpen?'is-open':''}`}>
          <CategoryDropdown selectedCategory={selectedCat} onSelectCategory={handleCategoryChange} />

          {/* Area / Thana Filter (Screenshot 2) */}
          <button
            type="button"
            onClick={openArea}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: '8px 18px', background: '#FFFFFF', border: '1px solid #D8CDB7', borderRadius: '9999px', cursor: 'pointer', minHeight: 44, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
            title={lang === 'bn' ? 'বিভাগ, জেলা বা উপজেলা/থানা বাছুন' : 'Choose division, district or thana'}
          >
            <MapPin size={16} color="var(--vermilion)" />
            <span>{translateArea(locationFilter,lang) || (lang === 'bn' ? 'এলাকা / থানা' : 'Area / Thana')}</span>
            <ChevronDown size={14} color="#64748B" />
          </button>
          {locationFilter && (
            <button
              type="button"
              onClick={handleClearLocation}
              style={{ background: '#FFF1F2', color: '#B93628', border: '1px solid #FECDD3', padding: '6px 12px', fontSize: 12, borderRadius: '9999px', cursor: 'pointer', fontWeight: 600 }}
              title={lang === 'bn' ? 'এলাকার ফিল্টার মুছুন' : 'Clear location filter'}
            >
              <X size={12} style={{ display: 'inline', marginRight: 4 }} /> {lang === 'bn' ? 'মুছুন' : 'Clear'}
            </button>
          )}

          {/* Rating Dropdown (Screenshot 2) */}
          <select
            style={{ padding: '8px 18px', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', background: '#FFFFFF', border: '1px solid #D8CDB7', borderRadius: '9999px', cursor: 'pointer', outline: 'none', minHeight: 44, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
            aria-label={lang === 'bn' ? 'ন্যূনতম রেটিং' : 'Minimum review rating'}
            value={ratingFilter}
            onChange={(e) => {const p=new URLSearchParams(params); p.delete('page'); if(e.target.value==='Any Rating')p.delete('min_rating');else p.set('min_rating',e.target.value); setParams(p);}}
          >
            <option value="Any Rating">{lang === 'bn' ? 'সব রেটিং' : 'Any rating'}</option>
            {['4.5','4.0','3.5','3.0'].map(value => <option key={value} value={value}>★ {formatNumber(Number(value),lang,{minimumFractionDigits:1})}+ {lang === 'bn' ? 'রেটিং' : 'rating'}</option>)}
          </select>
          </div>
        </div>
      </div>

      {/* Missing business disclosure (Screenshot 2 bottom) */}
      <section className="directory-add-disclosure" aria-label={lang === 'bn' ? 'নতুন প্রতিষ্ঠান যোগ করুন' : 'Add a missing entity'} style={{ margin: '16px 0 20px' }}>
        <div className="add-entity-banner" style={{ marginTop: 12 }}>
          <div className="add-entity-left">
            <Building2 size={24} />
            <div>
              <h3 className="add-entity-title">{lang === 'bn' ? 'আপনার কাঙ্ক্ষিত প্রতিষ্ঠান খুঁজে পাচ্ছেন না?' : "Can't find the organization or product you're looking for?"}</h3>
              <p className="add-entity-subtitle">
                {lang === 'bn' ? 'নতুন এন্ট্রি যোগ করে আপনার নাগরিক অভিজ্ঞতা প্রকাশ করুন।' : 'Check possible matches or add a missing entity to share your experience.'}
              </p>
            </div>
          </div>
          <button
            className="btn-teal-pill"
            onClick={() => {
              if (onOpenAddBusiness) {
                onOpenAddBusiness();
              } else {
                openSoon("Add Business or Product");
              }
            }}
          >
            <Plus size={15} />
            {lang === 'bn' ? 'যোগ করুন' : 'Add to TruthHubBD'}
          </button>
        </div>
      </section>


      <div className="count-heading">
        {formatNumber(directoryMeta.total,lang)} {lang === 'bn' ? 'টি ফলাফল' : 'results'}
      </div>

      {searchError&&<div role="alert" className="workspace-notice">{localizedError(searchError,lang)} <button onClick={()=>setRetrySearch(n=>n+1)}>{lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry directory'}</button></div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Clock size={32} color="#0f766e" style={{ animation: "spin 1s infinite linear", margin: "0 auto 12px" }} />
          <p style={{ color: "#64748b" }}>{lang === 'bn' ? 'প্রতিষ্ঠান খোঁজা হচ্ছে…' : 'Finding organizations…'}</p>
        </div>
      ) : searchError ? null : results.length > 0 ? (
        <>
          <div className="entities-grid">
            {results.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>

          {/* Bottom Right Pagination Bar */}
          <div
            className="directory-pagination-bottom"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "10px",
              marginTop: "28px",
              paddingTop: "16px",
              borderTop: "1px solid var(--line)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "13px", color: "var(--mut)", fontWeight: 500, marginRight: "4px" }}>
              {lang === 'bn' ? 'পৃষ্ঠা' : 'Page'} <strong>{formatNumber(resultPage,lang)}</strong> / {formatNumber(Math.max(1, directoryMeta.last_page),lang)} · {formatNumber(directoryMeta.total,lang)} {lang === 'bn' ? 'টি প্রতিষ্ঠান' : 'listings'}
            </span>
            <button
              className="btn-paper-outline"
              style={{
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                opacity: (loading || resultPage <= 1) ? 0.45 : 1,
                cursor: (loading || resultPage <= 1) ? "not-allowed" : "pointer",
              }}
              disabled={loading || resultPage <= 1}
              onClick={() => {
                const p = new URLSearchParams(params);
                p.set('page', String(resultPage - 1));
                setParams(p);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
            >
              ← {lang === 'bn' ? 'আগের পৃষ্ঠা' : 'Previous'}
            </button>
            <button
              className="btn-paper-outline"
              style={{
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                opacity: (loading || !!searchError || resultPage >= directoryMeta.last_page) ? 0.45 : 1,
                cursor: (loading || !!searchError || resultPage >= directoryMeta.last_page) ? "not-allowed" : "pointer",
              }}
              disabled={loading || !!searchError || resultPage >= directoryMeta.last_page}
              onClick={() => {
                const p = new URLSearchParams(params);
                p.set('page', String(resultPage + 1));
                setParams(p);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
            >
              {lang === 'bn' ? 'পরের পৃষ্ঠা' : 'Next'} →
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#ffffff", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
          <Search size={40} color="#0f766e" style={{ margin: "0 auto 16px" }} />
          <h3>{lang === 'bn' ? 'কোনো প্রতিষ্ঠান পাওয়া যায়নি' : 'No matching entities found'}</h3>
          <p style={{ color: "var(--slate-500)", marginBottom: "20px" }}>
            {lang === 'bn' ? 'খোঁজার শব্দ, ক্যাটাগরি বা রেটিংয়ের ফিল্টার বদলে দেখুন।' : 'Try adjusting your search keyword, category, or rating filters.'}
          </p>
          <button
            className="btn-teal-pill"
            onClick={() => {
              setQuery("");
              setParams(new URLSearchParams({view:'businesses'}));
            }}
          >
            {lang === 'bn' ? 'সব ফিল্টার মুছুন' : 'Reset all filters'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   BUSINESS DETAIL PAGE (With Dynamic Review Star Filter & Sorting)
============================================================ */
function BusinessDetailPage({
  openSoon,
  openReview,
}: {
  openSoon: (s: string) => void;
  openReview: (b?: Business | null) => void;
}) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLang();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState<number | "All">("All");
  const [sortOrder, setSortOrder] = useState("Newest First");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [expandedReviewComments, setExpandedReviewComments] = useState<Record<string | number, boolean>>({});

  const loadBusinessDetail = useCallback(async (showSpinner = false) => {
    if (!slug) return;
    if (showSpinner) setLoading(true);
    try {
      const data = await businessService.getBySlug(slug);
      setBusiness(data || null);
    } catch (e) {
      console.error("Failed to load organization detail:", e);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadBusinessDetail(true);
  }, [loadBusinessDetail, user?.id]);

  useEffect(() => {
    const handleReviewCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (!customEvent.detail?.businessId || (business && customEvent.detail.businessId === business.id)) {
        loadBusinessDetail(false);
      }
    };
    window.addEventListener('truthhub:review_created', handleReviewCreated);
    return () => {
      window.removeEventListener('truthhub:review_created', handleReviewCreated);
    };
  }, [business?.id, loadBusinessDetail]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <Clock size={36} color="#0f766e" style={{ animation: "spin 1s infinite linear", margin: "0 auto 12px" }} />
        <p style={{ color: "#64748b" }}>{lang === 'bn' ? 'প্রতিষ্ঠানের প্রোফাইল লোড হচ্ছে…' : 'Loading organization profile…'}</p>
      </div>
    );
  }

  if (!business) return <EntityNotFound type="business" />;

  const isOwner = Boolean(user && business && business.verified && business.userId && user.id === business.userId);

  // Dynamic review star filtering
  const filteredReviews = business.reviews
    .filter((r) => {
      if (starFilter === "All") return true;
      return r.rating === starFilter;
    })
    .sort((a, b) => {
      if (sortOrder === "Highest Rating") return b.rating - a.rating;
      if (sortOrder === "Most Helpful") return b.helpfulCount - a.helpfulCount;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Dynamic Rating Counts & Distribution
  const revList = business.reviews || [];
  const totalRevs = Math.max(1, business.reviewCount || revList.length);
  const ratingCounts = business.ratingCounts || {
    star5: revList.filter((r) => r.rating === 5).length,
    star4: revList.filter((r) => r.rating === 4).length,
    star3: revList.filter((r) => r.rating === 3).length,
    star2: revList.filter((r) => r.rating === 2).length,
    star1: revList.filter((r) => r.rating === 1).length,
  };

  const defaultCategoryImages: Record<string, string> = {
    "E-commerce": "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80",
    "IT & Software": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
    "Healthcare": "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80",
    "Education": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80",
    "Financial Services": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80",
    "Logistics": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
    "Businesses & Services": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
    "Doctors & Professionals": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80",
    "Hospitals & Clinics": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80",
    "Universities & Education": "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80",
  };
  const heroPhoto = business.image ? (business.image.startsWith("/") || business.image.startsWith("http") ? business.image : '/' + business.image) : '/listing-placeholder.svg';

  return (
    <div className="biz-detail-container">
      {/* Back to Directory Navigation */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/search?view=businesses" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, textDecoration: 'none', color: '#121210' }} className="btn-press">
          ← {lang === 'bn' ? 'প্রতিষ্ঠানের তালিকায় ফিরুন' : 'Back to organizations'}
        </Link>
      </div>

      {/* Top Hero Card */}
      <div className="biz-hero-card">
        <div className="biz-hero-left">
          <img
            src={heroPhoto}
            alt={business.image ? business.name : (lang==='bn'?'তালিকার প্রতীকী ছবি; প্রতিষ্ঠানের ছবি দেওয়া হয়নি':'Listing illustration; no organization photograph supplied')}
            className="biz-hero-photo"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/listing-placeholder.svg';
            }}
          />

          <div>
            <div className="biz-hero-title-row">
              <h1 className="biz-hero-name font-display">{lang === 'bn' && business.bengaliName ? business.bengaliName : business.name}</h1>
              {business.bengaliName && <span className="font-display font-bold text-lg" style={{ color: "#475569" }}>({lang === 'bn' ? business.name : business.bengaliName})</span>}
              {business.verified ? (
                <>
                  <span className="stamp stamp-verified" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ecfdf5', color: '#047857', border: '1px solid #10b981', borderRadius: 999, padding: '2px 8px', fontSize: 11.5, fontWeight: 700 }}>
                    <ShieldCheck size={13} color="#059669" />
                    {lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}
                  </span>
                  {business.userId && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: 999, padding: '2px 8px', fontSize: 11.5, fontWeight: 700 }}>
                      {lang === 'bn' ? 'মালিকানা দাবি করা' : 'Owner Claimed'}
                    </span>
                  )}
                </>
              ) : (
                <span className="stamp stamp-unverified" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fffbeb', color: '#b45309', border: '1px solid #f59e0b', borderRadius: 999, padding: '2px 8px', fontSize: 11.5, fontWeight: 700 }}>
                  <ShieldAlert size={13} color="#d97706" />
                  {lang === 'bn' ? 'অযাচাইকৃত' : 'Unverified'}
                </span>
              )}
              {isOwner && (
                <span className="tag bg-[#CFE8D6] font-mono">
                  {lang === 'bn' ? 'আপনি এই প্রতিষ্ঠানের প্রতিনিধি' : 'YOU OWN THIS ACCOUNT'}
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", margin: "10px 0 14px" }}>
              <span className="tag tag-sage" style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
                {translateCategory(business.category, lang)}
              </span>
              {business.location && (
                <span
                  className="tag bg-white font-mono"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid #d8cdb7",
                    background: "#ffffff",
                    fontSize: "12px",
                    color: "var(--ink)",
                    lineHeight: "1.4",
                    maxWidth: "100%",
                  }}
                >
                  <MapPin size={13} style={{ flexShrink: 0, color: "#c2410c", verticalAlign: "middle" }} aria-hidden="true" />
                  <span style={{ wordBreak: "break-word", display: "inline" }}>{translateArea(business.location, lang)}</span>
                </span>
              )}
            </div>

            {business.operatingStatus === 'closed' && (
              <div className="brut-sm bg-[#fee2e2] p-2 text-xs font-mono font-bold text-[#b91c1c] mb-3">
                {lang === 'bn' ? 'নোটিশ: তালিকার তথ্য পর্যালোচনার পর বন্ধ চিহ্নিত করা হয়েছে। আগের রিভিউগুলো পড়া যাবে।' : 'Notice: Marked closed after directory review. Historical reviews remain available.'}
              </div>
            )}

            <p className="biz-hero-desc">{business.description}</p>
          </div>
        </div>

        {/* Right Big Rating Box */}
        <div className="biz-hero-right-box">
          <div className="biz-big-rating">
            {business.reviewCount > 0 ? <>{formatNumber(business.rating,lang,{minimumFractionDigits:1,maximumFractionDigits:1})} <span>/ {formatNumber(5,lang)}</span></> : <span style={{ fontSize: "1.1rem" }}>{lang === 'bn' ? 'এখনও রিভিউ নেই' : 'No reviews'}</span>}
          </div>
          {business.reviewCount > 0 && (
            <div className="stars-cluster" style={{ justifyContent: "center", margin: "6px 0", color: "#f59e0b", letterSpacing: 2 }}>
              {'★'.repeat(Math.round(business.rating))}{'☆'.repeat(5 - Math.round(business.rating))}
            </div>
          )}
          <div className="biz-rating-verified-text">{formatNumber(business.reviewCount,lang)} {lang === 'bn' ? 'টি প্রকাশিত রিভিউ' : 'PUBLISHED REVIEWS'}</div>

          {isOwner ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center", width: "100%" }}>
              <button className="stamp-btn btn-press w-full" style={{ background: "#121210", color: "#FFFFFF", padding: "12px 14px" }} onClick={() => setEditModalOpen(true)}>
                <Pencil size={14} /> {lang === 'bn' ? 'প্রোফাইল সম্পাদনা' : 'EDIT PROFILE'}
              </button>
            </div>
          ) : (
            <button className="stamp-btn btn-press w-full" style={{ background: "var(--vermilion)", color: "#FFFFFF", padding: "12px 14px" }} onClick={() => openReview(business)}>
              <Plus size={16} /> {lang === 'bn' ? 'রিভিউ লিখুন' : 'WRITE REVIEW'}
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Split */}
      <div className="biz-layout-grid">
        <aside>
          {/* Organization Verification Status Banner (Compact & Minimal) */}
          <section className="biz-sidebar-card" style={{ padding: '10px 14px', borderLeft: business.verified ? '3px solid #10b981' : '3px solid #f59e0b', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {business.verified ? <ShieldCheck size={15} color="#059669" /> : <ShieldAlert size={15} color="#d97706" />}
                <strong style={{ fontSize: 12.5, color: business.verified ? '#047857' : '#b45309' }}>
                  {business.verified ? (business.userId ? (lang === 'bn' ? 'যাচাইকৃত ও মালিকানাধীন' : 'Verified & Claimed') : (lang === 'bn' ? 'যাচাইকৃত প্রতিষ্ঠান' : 'Verified Organization')) : (lang === 'bn' ? 'অযাচাইকৃত তালিকা' : 'Unverified Listing')}
                </strong>
              </div>
              {!business.verified && (
                <Link to={`/claim?q=${encodeURIComponent(business.name)}`} style={{ fontSize: 11.5, fontWeight: 700, color: '#b45309', textDecoration: 'underline' }}>
                  {lang === 'bn' ? 'দাবি করুন' : 'Claim'} →
                </Link>
              )}
            </div>
          </section>

          <section className="biz-sidebar-card">
            <h3 className="biz-sidebar-title">{lang === 'bn' ? 'দ্রুত পদক্ষেপ' : 'QUICK ACTIONS'}</h3>
            <p style={{ fontSize: 13, color: "#475569", margin: "0 0 14px", lineHeight: 1.5 }}>
              {lang === 'bn' ? 'প্রতিষ্ঠানটি সংরক্ষণ করুন অথবা প্রমাণসহ মালিকানা দাবি করুন।' : 'Save this organization or apply to represent it with ownership evidence.'}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SaveEntity id={business.id}/>
              <ShareCard
                url={`/business/${business.slug}`}
                title={lang === 'bn' && business.bengaliName ? business.bengaliName : business.name}
                description={business.description?.slice(0, 320)}
                businessName={business.name}
                rating={business.rating}
                organizationImage={business.image}
                category={business.category}
                compact={false}
              />
              {!business.verified && (
                <Link className="stamp-btn btn-press" style={{ background: "var(--paper)", color: "var(--ink)", textDecoration: "none", padding: "12px 14px" }} to={`/claim?q=${encodeURIComponent(business.name)}`}>
                  {lang === 'bn' ? 'প্রতিষ্ঠান দাবি করুন' : 'Claim organization'} →
                </Link>
              )}
            </div>
          </section>

          {business.sourceUrl && (
            <section className="biz-sidebar-card">
              <h3 className="biz-sidebar-title">{lang === 'bn' ? 'তথ্যের উৎস' : 'DIRECTORY SOURCE'}</h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px", lineHeight: 1.5 }}>
                {lang === 'bn' ? 'উন্মুক্ত ডেটাবেসের তালিকা। এখানে তালিকাভুক্ত হওয়া মানের নিশ্চয়তা নয়।' : 'Open database directory record. Platform listing is not an endorsement.'}
              </p>
              <a href={business.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: "#121210", textDecoration: "underline" }}>
                {lang === 'bn' ? 'OpenStreetMap-এ উৎস দেখুন' : 'View OpenStreetMap source'} →
              </a>
            </section>
          )}

          <GoogleMap lang={lang} name={lang==='bn'&&business.bengaliName?business.bengaliName:business.name} location={business.location} placeId={business.googlePlaceId} latitude={business.latitude} longitude={business.longitude} administrativeOnly={business.sourceUrl?.startsWith('https://hris.mohfw.gov.bd/')}/>
          <OrganizationCases slug={business.slug} businessId={business.id}/>

          {business.reviewCount>=3&&<div className="biz-sidebar-card">
            <h3 className="biz-sidebar-title">{lang === 'bn' ? 'রেটিংয়ের হিসাব' : 'Rating breakdown'}</h3>
            <div className="rating-distribution-list">
              {[
                { star: 5, count: ratingCounts.star5, pct: (ratingCounts.star5 / totalRevs) * 100 },
                { star: 4, count: ratingCounts.star4, pct: (ratingCounts.star4 / totalRevs) * 100 },
                { star: 3, count: ratingCounts.star3, pct: (ratingCounts.star3 / totalRevs) * 100 },
                { star: 2, count: ratingCounts.star2, pct: (ratingCounts.star2 / totalRevs) * 100 },
                { star: 1, count: ratingCounts.star1, pct: (ratingCounts.star1 / totalRevs) * 100 },
              ].map((row) => (
                <div key={row.star} className="dist-row">
                  <button type="button" className="rating-filter-control" aria-label={`${lang === 'bn' ? 'রেটিং বাছুন' : 'Filter by rating'} ${formatNumber(row.star,lang)}`} style={{ fontWeight: starFilter === row.star ? 800 : 500 }} onClick={() => setStarFilter(row.star)}>
                    {formatNumber(row.star,lang)}★
                  </button>
                  <div className="dist-bar-track">
                    <div className="dist-bar-fill" style={{ width: `${Math.min(100, Math.max(0, row.pct))}%` }} />
                  </div>
                  <span className="dist-count">{formatNumber(row.count,lang)}</span>
                </div>
              ))}
            </div>
          </div>

          }
          <div className="biz-sidebar-card">
            <h3 className="biz-sidebar-title">{lang === 'bn' ? 'যোগাযোগ ও তথ্য' : 'Contact & details'}</h3>
            <div className="facts-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {business.website && (
                <div className="fact-item" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Globe size={16} />
                  <a href={business.website} target="_blank" rel="noopener noreferrer" style={{ color: "#121210", fontWeight: 700, textDecoration: "underline", fontSize: 13 }}>
                    {business.website}
                  </a>
                </div>
              )}
              {business.phone && (
                <div className="fact-item" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontFamily: 'Space Mono, monospace' }}>
                  <Phone size={16} />
                  <span>{business.phone}</span>
                </div>
              )}
              {business.branches && business.branches.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#121210", display: "block", marginBottom: 6, textTransform: "uppercase" }}>
                    {lang === 'bn' ? 'শাখা:' : 'Branch offices:'}
                  </span>
                  <div style={{ borderLeft: "3px solid #121210", paddingLeft: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {business.branches.map((br) => (
                      <span key={br} style={{ fontSize: "12px", color: "#121210", fontFamily: 'Space Mono, monospace' }}>{br}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        <div>
          <div className="reviews-filter-bar">
            <div className="filter-stars-pills">
              <span>{lang === 'bn' ? 'বাছুন:' : 'Filter:'}</span>
              <button className={`star-pill-btn ${starFilter === "All" ? "active" : ""}`} onClick={() => setStarFilter("All")}>
                {lang === 'bn' ? 'সব' : 'All'}
              </button>
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  className={`star-pill-btn ${starFilter === s ? "active" : ""}`}
                  onClick={() => setStarFilter(s)}
                >
                  {formatNumber(s,lang)}★
                </button>
              ))}
            </div>

            <select aria-label={lang === 'bn' ? 'রিভিউ সাজান' : 'Sort reviews'} className="sort-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="Newest First">{lang === 'bn' ? 'নতুন রিভিউ আগে' : 'Newest first'}</option>
              <option value="Highest Rating">{lang === 'bn' ? 'বেশি রেটিং আগে' : 'Highest rating'}</option>
              <option value="Most Helpful">{lang === 'bn' ? 'সবচেয়ে সহায়ক আগে' : 'Most helpful'}</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredReviews.length > 0 ? (
              filteredReviews.map((rev) => (
                <div key={rev.id} className="detailed-review-card">
                  <div className="review-card-top-row">
                    <div className="review-author-group">
                      <span className="review-author-name">{rev.author}</span>
                    </div>

                    <div className="stars-cluster">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <Star
                          key={st}
                          size={14}
                          className={st <= rev.rating ? "star-fill" : "star-empty"}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="review-submeta">
                    {formatDate(rev.date,lang)} · {rev.disclaimer || (lang === 'bn' ? 'সম্পর্কের ঘোষণা দেওয়া নেই' : 'No relationship disclosure provided')}
                  </div>

                  <h4 className="review-headline">{publicText(rev,'title',lang)}</h4>
                  <p className="review-body-text">{publicText(rev,'body',lang)}</p>
                  {rev.images && rev.images.length > 0 ? (
                    <div className="review-attached-images" style={{ display: "flex", gap: "10px", margin: "12px 0", flexWrap: "wrap" }}>
                      {rev.images.map((imgUrl: string, idx: number) => {
                        const resolved = imgUrl.startsWith('http') ? imgUrl : (imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl);
                        return (
                          <a key={idx} href={resolved} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                            <img src={resolved} alt="Review attachment" style={{ width: "90px", height: "90px", objectFit: "cover", display: "block" }} />
                          </a>
                        );
                      })}
                    </div>
                  ) : rev.imagePath ? (
                    <div className="review-attached-images" style={{ display: "flex", gap: "10px", margin: "12px 0", flexWrap: "wrap" }}>
                      {(() => {
                        const resolved = rev.imagePath.startsWith('http') ? rev.imagePath : (rev.imagePath.startsWith('/') ? rev.imagePath : '/' + rev.imagePath);
                        return (
                          <a href={resolved} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                            <img src={resolved} alt="Review attachment" style={{ width: "90px", height: "90px", objectFit: "cover", display: "block" }} />
                          </a>
                        );
                      })()}
                    </div>
                  ) : null}
                  <PublicVideoLinks urls={rev.public_video_urls} lang={lang}/>
                  {rev.linked_case&&<Link className="content-action" to={rev.linked_case.url}>{lang==='bn'?'সংশ্লিষ্ট প্রকাশ্য রিপোর্ট':'Linked public report'} · {rev.linked_case.case_code}</Link>}
                  {(rev.location || rev.facebookUrl) && (
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap", fontSize: "0.85rem", color: "#475569", alignItems: "center" }}>
                      {rev.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {rev.location}</span>}
                      {rev.facebookUrl && <a href={rev.facebookUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#121210", fontWeight: 700, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 }}><Globe size={13} /> Facebook Profile</a>}
                    </div>
                  )}

                  {(rev.serviceRating != null || rev.valueRating != null || rev.commRating != null) && (
                    <div className="dimension-scores-pill">
                      {rev.serviceRating != null && <span>Service: <strong>{rev.serviceRating}/5</strong></span>}
                      {rev.valueRating != null && <span>Value: <strong>{rev.valueRating}/5</strong></span>}
                      {rev.commRating != null && <span>Communication: <strong>{rev.commRating}/5</strong></span>}
                    </div>
                  )}

                  <div className="review-card-foot" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginTop: 12 }}>
                    <ReviewReactions id={rev.id} helpfulCount={rev.helpfulCount} notHelpfulCount={rev.notHelpfulCount} viewerReaction={rev.viewerReaction} canReact={rev.canReact} lang={lang} onChange={result => setBusiness(previous => previous ? {...previous, reviews: previous.reviews.map(review => review.id === rev.id ? {...review, helpfulCount:result.helpful_count, notHelpfulCount:result.not_helpful_count, viewerReaction:result.viewer_reaction} : review)} : previous)}/>
                    <button
                      className="btn-pill-light"
                      onClick={() => setExpandedReviewComments(prev => ({ ...prev, [rev.id]: !prev[rev.id] }))}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 14px",
                        background: expandedReviewComments[rev.id] ? "#F5EEDB" : "#FFFFFF",
                        border: "1px solid #D8CDB7",
                        borderRadius: "9999px",
                        cursor: "pointer",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      <MessageSquare size={14} aria-hidden="true"/> {lang==='bn'?'মন্তব্য':'Comments'} ({rev.discussionCount === undefined ? '—' : formatNumber(rev.discussionCount,lang)}) <ChevronDown size={14} aria-hidden="true" style={{transform:expandedReviewComments[rev.id]?'rotate(180deg)':undefined}}/>
                    </button>
                    <ReportContentLink type="review" id={rev.id} lang={lang} />
                    <button
                      className="btn-press"
                      style={{ background: "transparent", border: 0, color: "var(--vermilion)", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", marginLeft: "auto", textDecoration: "none" }}
                      onClick={() => navigate(`/reviews/${rev.id}`)}
                    >
                      {lang === 'bn' ? 'রিভিউ পড়ুন' : 'Read review'} →
                    </button>
                  </div>

                  {/* Per-Review Facebook-Style Commenting Section */}
                  {expandedReviewComments[rev.id] && <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                      <MessageSquare size={14} color="#0f766e" />
                      <span>{lang === 'bn' ? 'মন্তব্য ও আলোচনা' : 'Comments & discussion'} · {rev.author}</span>
                    </div>
                    <ThreadedComments
                      reviewId={rev.id}
                      compact={true}
                      hideHeader={true}
                      title={lang === 'bn' ? `${rev.author}-এর রিভিউতে মন্তব্য` : `Comments on ${rev.author}’s review`}
                      onCountChange={count => setBusiness(previous => previous ? {...previous,reviews:previous.reviews.map(review => review.id===rev.id && review.discussionCount!==count ? {...review,discussionCount:count}:review)} : previous)}
                    />
                  </div>}
                </div>
              ))
            ) : (
              <div style={{ background: "#ffffff", padding: "40px", textAlign: "center", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
                <p style={{ color: "var(--slate-500)", margin: "0 0 12px" }}>{business.reviewCount===0?(lang === 'bn' ? 'এখনও রিভিউ নেই। নিজের অভিজ্ঞতা জানিয়ে অন্যদের সাহায্য করুন।' : 'No reviews yet. Share a first-hand experience to help the next person.'):(lang === 'bn' ? 'এই রেটিংয়ে রিভিউ পাওয়া যায়নি।' : 'No reviews match the selected star filter.')}</p>
                <button className="btn-pill-light" onClick={() => business.reviewCount===0?openReview(business):setStarFilter("All")}>
                  {business.reviewCount===0?(lang === 'bn' ? 'প্রথম রিভিউ লিখুন' : 'Write the first review'):(lang === 'bn' ? 'সব রিভিউ দেখুন' : 'Show all reviews')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <EditBusinessModal
        open={editModalOpen}
        business={business}
        onClose={() => setEditModalOpen(false)}
        onUpdated={(updated) => setBusiness(updated)}
      />
    </div>
  );
}

/* ============================================================
   ADMIN PAGE (/admin)
   Displays pending business account creation requests for approval.
============================================================ */
function AdminPage() { return <AdminOrganizationQueue/>; }

/* ============================================================
   CASE TRACKING CARD & DOSSIER MODAL
   Citizen real-time moderation status, forensic timeline, and review team notes
============================================================ */
/* ─── Reporter inline Resolve widget ─── */
function ReporterResolveInline({ caseId, caseCode, lang, onResolved }: { caseId: number; caseCode: string; lang: string; onResolved?: () => void }) {
  const isBn = lang === "bn";
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleResolve = async () => {
    setSaving(true); setErr("");
    try {
      await api(`/scam-cases/${caseId}/resolve`, "POST", { resolution_note: note || "Resolved by reporter." });
      onResolved?.();
      window.location.reload();
    } catch(e: any) {
      setErr(e?.message || "Failed to mark as solved.");
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#065F46", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "center" }}
        >
          <CheckCircle2 size={16} /> {isBn ? "✓ এই কেসটি সমাধান হয়েছে — সম্পন্ন হিসেবে চিহ্নিত করুন" : "✓ Issue resolved — Mark this case as Solved"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "16px", marginBottom: 18 }}>
      <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "#065F46" }}>
        {isBn ? "কেস সমাধান হিসেবে চিহ্নিত করুন" : "Mark Case as Solved"}
      </h4>
      <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#047857" }}>
        {isBn ? "সমাধানের একটি সংক্ষিপ্ত বিবরণ লিখুন (ঐচ্ছিক):" : "Briefly describe how the issue was resolved (optional):"}
      </p>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={3}
        placeholder={isBn ? "যেমন: প্রতিষ্ঠান রিফান্ড দিয়েছে / পণ্য পেয়েছি..." : "e.g. Company issued a full refund / Product was delivered..."}
        style={{ width: "100%", borderRadius: 8, border: "1px solid #A7F3D0", padding: "10px 12px", fontSize: 13, lineHeight: 1.5, resize: "vertical", background: "#FFFFFF", boxSizing: "border-box" }}
      />
      {err && <p style={{ color: "#DC2626", fontSize: 12, margin: "6px 0 0" }}>{err}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          type="button"
          disabled={saving}
          onClick={handleResolve}
          style={{ background: "#059669", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
        >
          {saving ? (isBn ? "সম্পন্ন করা হচ্ছে…" : "Saving…") : (isBn ? "✓ সমাধান নিশ্চিত করুন" : "✓ Confirm Resolved")}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{ background: "#FFFFFF", border: "1px solid #A7F3D0", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", color: "#065F46" }}>
          {isBn ? "বাতিল" : "Cancel"}
        </button>
      </div>
    </div>
  );
}

function CaseDossierModal({
  item,
  onClose,
  lang,
}: {
  item: any;
  onClose: () => void;
  lang: string;
}) {
  if (!item) return null;
  const isBn = lang === "bn";
  const amountFormatted = item.amount ? Number(item.amount).toLocaleString("en-BD") : null;
  const isResolved = item.status === "resolved";
  const isPublished = ["published", "disputed", "resolved"].includes(item.status);
  const isUnderReview = ["under_review", "published", "disputed", "resolved"].includes(item.status);
  const isAdminVerified = !!(item.admin_reviewed || item.admin_reviewed_at);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(18, 18, 16, 0.75)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          maxWidth: 680,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "28px 30px",
          border: "1px solid #D8CDB7",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, borderBottom: "1px solid var(--rule, #E2D7C2)", paddingBottom: 16, marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, background: "#F5EEDB", border: "1px solid #D8CDB7", padding: "2px 8px", borderRadius: "9999px", color: "var(--ink)" }}>
                {item.case_code}
              </span>
              <ScamStatus status={item.status} />
              {item.incident_type && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", padding: "2px 8px", borderRadius: "9999px" }}>
                  {translateStatus(item.incident_type, lang as 'en'|'bn')}
                </span>
              )}
              {isAdminVerified && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0", padding: "2px 8px", borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <ShieldCheck size={12} /> {isBn ? "অ্যাডমিন যাচাইকৃত" : "Admin Verified"}
                </span>
              )}
            </div>
            <h2 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--ink)" }}>
              {item.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "#F5EEDB",
              border: "1px solid #D8CDB7",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Security / Privacy Protection Reassurance Banner */}
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 14px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldCheck size={20} color="#16A34A" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 12.5, color: "#15803D", lineHeight: 1.4 }}>
            {isBn
              ? "নাগরিক গোপনীয়তা সুরক্ষা: আপনার ব্যক্তিগত ব্যাংক তথ্য, পিন এবং এনআইডি নম্বর কঠোরভাবে সুরক্ষিত। এগুলো কখনও জনসমক্ষে প্রকাশ করা হয় না।"
              : "Citizen Privacy Protection: Your private banking credentials, PINs, and NID are securely quarantined and never exposed publicly."}
          </p>
        </div>

        {/* Target Entity Box */}
        {item.business && (
          <div style={{ background: "#FDFBF7", border: "1px solid #EAE0CE", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {isBn ? "অভিযোগপ্রাপ্ত প্রতিষ্ঠান" : "Reported Organization"}
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              <div>
                <strong style={{ fontSize: 15, color: "var(--ink)", display: "block" }}>
                  {isBn && item.business.bengali_name ? item.business.bengali_name : item.business.name}
                </strong>
                <span style={{ fontSize: 12.5, color: "var(--slate-500)" }}>
                  {item.business.category} {item.business.location ? `· ${item.business.location}` : ""}
                </span>
              </div>
              <Link
                to={`/business/${item.business.slug}`}
                style={{ fontSize: 12.5, fontWeight: 700, color: "var(--vermilion, #C03A3A)", textDecoration: "none" }}
              >
                {isBn ? "প্রতিষ্ঠান দেখুন →" : "View Business →"}
              </Link>
            </div>
          </div>
        )}

        {/* 4-Step Interactive Progress Tracker */}
        <div style={{ marginBottom: 24, padding: "16px", background: "#FAF7EE", borderRadius: 10, border: "1px solid #E5DEC9" }}>
          <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 14px", color: "var(--ink)" }}>
            {isBn ? "লাইভ কেস ট্র্যাকিং ও অগ্রগতি" : "Live Case Tracking & Moderation Pipeline"}
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, position: "relative" }}>
            {/* Step 1: Submitted */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#16A34A", color: "#FFFFFF", display: "grid", placeItems: "center", margin: "0 auto 6px", fontSize: 13, fontWeight: 800 }}>
                ✓
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)", display: "block" }}>
                {isBn ? "রিপোর্ট জমা" : "Submitted"}
              </span>
              <small style={{ fontSize: 10, color: "var(--slate-500)" }}>
                {item.created_at ? new Date(item.created_at).toLocaleDateString("en-BD", { month: "short", day: "numeric" }) : ""}
              </small>
            </div>

            {/* Step 2: Investigation */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: isAdminVerified ? "#16A34A" : "#F59E0B", color: "#FFFFFF", display: "grid", placeItems: "center", margin: "0 auto 6px", fontSize: 13, fontWeight: 800 }}>
                {isAdminVerified ? "✓" : "⏳"}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)", display: "block" }}>
                {isBn ? "প্রমাণ যাচাই" : "Verification"}
              </span>
              <small style={{ fontSize: 10, color: isAdminVerified ? "#16A34A" : "#D97706", fontWeight: 600 }}>
                {isAdminVerified ? (isBn ? "যাচাইকৃত" : "Verified") : (isBn ? "চলমান" : "In Progress")}
              </small>
            </div>

            {/* Step 3: Public Broadcast */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: isPublished ? "#DC2626" : "#E2E8F0", color: isPublished ? "#FFFFFF" : "#64748B", display: "grid", placeItems: "center", margin: "0 auto 6px", fontSize: 13, fontWeight: 800 }}>
                {isPublished ? "✓" : "3"}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: isPublished ? "#DC2626" : "#64748B", display: "block" }}>
                {isBn ? "পাবলিক অ্যালার্ট" : "Public Alert"}
              </span>
              <small style={{ fontSize: 10, color: isPublished ? "#DC2626" : "var(--slate-400)", fontWeight: 600 }}>
                {isPublished ? (isBn ? "সরাসরি সম্প্রচার" : "Live Alert") : (isBn ? "অপেক্ষমান" : "Pending")}
              </small>
            </div>

            {/* Step 4: Resolution */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: isResolved ? "#16A34A" : "#E2E8F0", color: isResolved ? "#FFFFFF" : "#64748B", display: "grid", placeItems: "center", margin: "0 auto 6px", fontSize: 13, fontWeight: 800 }}>
                {isResolved ? "✓" : "4"}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: isResolved ? "#16A34A" : "#64748B", display: "block" }}>
                {isBn ? "সমাধান" : "Resolved"}
              </span>
              <small style={{ fontSize: 10, color: isResolved ? "#16A34A" : "var(--slate-400)", fontWeight: 600 }}>
                {isResolved ? (isBn ? "সম্পন্ন" : "Concluded") : (isBn ? "অপেক্ষমান" : "Pending")}
              </small>
            </div>
          </div>
        </div>

        {/* Incident Particulars Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
          {amountFormatted && (
            <div style={{ background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 8, padding: "10px 14px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9F1239", textTransform: "uppercase" }}>
                {isBn ? "দাবিকৃত ক্ষতির পরিমাণ" : "Reported Loss"}
              </span>
              <strong style={{ fontSize: 16, color: "#BE123C", display: "block", marginTop: 2 }}>
                ৳ {amountFormatted}
              </strong>
            </div>
          )}

          {item.incident_date && (
            <div style={{ background: "#FDFBF7", border: "1px solid #EAE0CE", borderRadius: 8, padding: "10px 14px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase" }}>
                {isBn ? "ঘটনার তারিখ" : "Incident Date"}
              </span>
              <strong style={{ fontSize: 14, color: "var(--ink)", display: "block", marginTop: 2 }}>
                {new Date(item.incident_date).toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}
              </strong>
            </div>
          )}

          <div style={{ background: "#FDFBF7", border: "1px solid #EAE0CE", borderRadius: 8, padding: "10px 14px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase" }}>
              {isBn ? "সংযুক্ত প্রমাণপত্র" : "Evidence Files"}
            </span>
            <strong style={{ fontSize: 14, color: "var(--ink)", display: "block", marginTop: 2 }}>
              {item.evidence_count || 0} {isBn ? "টি ফাইল সংযুক্ত" : "file(s) attached"}
            </strong>
          </div>
        </div>

        {/* Incident Narrative */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "var(--ink)", margin: "0 0 8px" }}>
            {isBn ? "ঘটনার বিবরণ (আপনার জমা দেওয়া বর্ণনা)" : "Incident Narrative (Your Submission)"}
          </h4>
          <div style={{ background: "#FDFBF7", border: "1px solid #EAE0CE", borderRadius: 8, padding: "14px 16px", fontSize: 13.5, lineHeight: 1.6, color: "var(--slate-800)", whiteSpace: "pre-wrap" }}>
            {item.summary || item.public_summary}
          </div>
        </div>
        
        {/* Organization Official Response */}
        {item.subject_response && (
          <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderLeft: "4px solid #0284C7", borderRadius: 8, padding: "14px 16px", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Building2 size={16} color="#0284C7" />
              <strong style={{ fontSize: 13, color: "#075985" }}>
                {isBn ? "প্রতিষ্ঠানের আনুষ্ঠানিক জবাব ও সমাধান প্রস্তাব:" : "Official Response & Solution from the Organization:"}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#0C4A6E", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {item.subject_response}
            </p>
          </div>
        )}

        {/* Review Team Updates if present */}
        {item.reporter_update && (
          <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderLeft: "4px solid #059669", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <CheckCircle2 size={16} color="#059669" />
              <strong style={{ fontSize: 13, color: "#065F46" }}>
                {isBn ? "পর্যালোচনা দলের বার্তা / অগ্রগতি:" : "Trust & Review Team Assessment:"}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#047857", lineHeight: 1.5 }}>
              {item.reporter_update}
            </p>
          </div>
        )}

        {/* Resolution note if present */}
        {item.resolution_note && (
          <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderLeft: "4px solid #D97706", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <FileText size={16} color="#D97706" />
              <strong style={{ fontSize: 13, color: "#92400E" }}>
                {isBn ? "কেসের চূড়ান্ত সমাধান:" : "Official Resolution Note:"}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#78350F", lineHeight: 1.5 }}>
              {item.resolution_note}
            </p>
          </div>
        )}
        
        {/* Inline Resolve by Reporter */}
        {!isResolved && (
          <ReporterResolveInline caseId={item.id} caseCode={item.case_code} lang={lang} onResolved={onClose} />
        )}

        {/* Modal Action Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--rule, #E2D7C2)", flexWrap: "wrap" }}>
          {isPublished ? (
            <Link
              to={`/scam-alerts/${item.case_code}`}
              className="btn-teal-pill"
              onClick={onClose}
              style={{ textDecoration: "none", fontSize: 13, padding: "8px 18px", background: "#B93628", borderColor: "#B93628" }}
            >
              {isBn ? "পাবলিক অ্যালার্ট দেখুন →" : "View Live Public Alert →"}
            </Link>
          ) : (
            <span style={{ fontSize: 12.5, color: "var(--slate-500)", fontStyle: "italic" }}>
              {isBn ? "অনুমোদনের পর এটি পাবলিক স্ক্যাম অ্যালার্টে প্রকাশ পাবে।" : "Once approved by staff, this case will be published on the Scam Alerts board."}
            </span>
          )}

          <button
            type="button"
            className="btn-pill-light"
            onClick={onClose}
            style={{ padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            {isBn ? "বন্ধ করুন" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CaseTrackingCard({
  item,
  lang,
  onOpenDossier,
}: {
  item: any;
  lang: string;
  onOpenDossier: (item: any) => void;
}) {
  const isBn = lang === "bn";
  const amountFormatted = item.amount ? Number(item.amount).toLocaleString("en-BD") : null;
  const isResolved = item.status === "resolved";
  const isPublished = ["published", "disputed", "resolved"].includes(item.status);
  const isAdminVerified = !!(item.admin_reviewed || item.admin_reviewed_at);

  return (
    <article
      style={{
        background: "#FFFFFF",
        border: isPublished ? "1px solid #FECDD3" : "1px solid #D8CDB7",
        borderLeft: isPublished ? "4px solid #B93628" : "4px solid #D8CDB7",
        borderRadius: 12,
        padding: "20px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: 14
      }}
    >
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderBottom: "1px solid var(--rule, #E2D7C2)", paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 800, background: "#F5EEDB", border: "1px solid #D8CDB7", padding: "3px 9px", borderRadius: "9999px", color: "var(--ink)" }}>
            {item.case_code}
          </span>
          <ScamStatus status={item.status} />
          {item.incident_type && (
            <span style={{ fontSize: 11, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", padding: "2px 8px", borderRadius: "9999px" }}>
              {translateStatus(item.incident_type, lang as 'en'|'bn')}
            </span>
          )}
          {isAdminVerified && (
            <span style={{ fontSize: 11, fontWeight: 700, background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0", padding: "2px 8px", borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: 3 }}>
              <ShieldCheck size={11} /> {isBn ? "অ্যাডমিন যাচাই" : "Admin Verified"}
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: "var(--slate-500)", fontWeight: 600 }}>
          {isBn ? "জমা: " : "Filed: "}
          {item.created_at ? new Date(item.created_at).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }) : ""}
        </span>
      </div>

      {/* Target Business & Title */}
      <div>
        {item.business && (
          <div style={{ fontSize: 12.5, color: "var(--slate-500)", marginBottom: 4 }}>
            <span>{isBn ? "অভিযোগপ্রাপ্ত প্রতিষ্ঠান: " : "Reported Entity: "}</span>
            <Link to={`/business/${item.business.slug}`} style={{ fontWeight: 700, color: "var(--ink)", textDecoration: "none" }}>
              {isBn && item.business.bengali_name ? item.business.bengali_name : item.business.name}
            </Link>
            {item.business.location && <span style={{ marginLeft: 6 }}>· {item.business.location}</span>}
          </div>
        )}
        <h3 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.2rem", fontWeight: 800, margin: "2px 0 6px", color: "var(--ink)" }}>
          {item.title}
        </h3>
        {amountFormatted && (
          <div style={{ fontSize: 13, color: "#BE123C", fontWeight: 700, marginBottom: 4 }}>
            {isBn ? "দাবিকৃত আর্থিক ক্ষতি: " : "Reported Financial Loss: "}
            <span>৳ {amountFormatted}</span>
          </div>
        )}
        <p style={{ margin: 0, fontSize: 13, color: "var(--slate-700)", lineHeight: 1.5 }}>
          {(item.summary || item.public_summary || "").slice(0, 180)}
          {(item.summary || item.public_summary || "").length > 180 ? "…" : ""}
        </p>
      </div>

      {/* 4-Step Progress Stepper */}
      <div style={{ background: "#FAF7EE", borderRadius: 10, padding: "12px 14px", border: "1px solid #E5DEC9" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, textAlign: "center" }}>
          {[
            { label: isBn ? "১. জমা" : "1. Filed", done: true, color: "#16A34A" },
            { label: isBn ? "২. যাচাই" : "2. Verified", done: isAdminVerified, color: isAdminVerified ? "#16A34A" : "#F59E0B" },
            { label: isBn ? "৩. অ্যালার্ট" : "3. Alert", done: isPublished, color: isPublished ? "#DC2626" : "#94A3B8" },
            { label: isBn ? "৪. সমাধান" : "4. Solved", done: isResolved, color: isResolved ? "#16A34A" : "#94A3B8" },
          ].map((step, i) => (
            <div key={i}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: step.done ? step.color : "#E2E8F0", color: step.done ? "#FFFFFF" : "#64748B", display: "grid", placeItems: "center", margin: "0 auto 4px", fontSize: 11, fontWeight: 800 }}>
                {step.done ? "✓" : (i + 1)}
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: step.done ? step.color : "#64748B", display: "block" }}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Org response preview if present */}
      {item.subject_response && (
        <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderLeft: "3px solid #0284C7", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#075985" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
            <Building2 size={13} color="#0284C7" />
            <strong style={{ fontSize: 12, color: "#0284C7" }}>{isBn ? "প্রতিষ্ঠানের জবাব এসেছে:" : "Organization responded:"}</strong>
          </div>
          <p style={{ margin: 0, lineHeight: 1.4, color: "#0C4A6E" }}>
            {item.subject_response.slice(0, 120)}{item.subject_response.length > 120 ? "…" : ""}
          </p>
        </div>
      )}

      {/* Staff Note */}
      {item.reporter_update && (
        <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderLeft: "4px solid #059669", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#065F46" }}>
          <strong>{isBn ? "স্টাফ বার্তা: " : "Staff Note: "}</strong>{item.reporter_update}
        </div>
      )}

      {/* Resolution note */}
      {item.resolution_note && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderLeft: "4px solid #D97706", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#92400E" }}>
          <strong>{isBn ? "সমাধান: " : "Resolution: "}</strong>{item.resolution_note}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, paddingTop: 10, borderTop: "1px solid var(--rule, #E2D7C2)", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => onOpenDossier(item)}
          className="btn-teal-pill"
          style={{ cursor: "pointer", fontSize: 12.5, padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <MessageSquare size={13} />
          <span>{isBn ? "সম্পূর্ণ ডসিয়ার দেখুন" : "View Full Dossier"}</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {isPublished && (
            <Link
              to={`/scam-alerts/${item.case_code}`}
              style={{ fontSize: 12, fontWeight: 700, color: "#B93628", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <ShieldAlert size={13} />
              {isBn ? "লাইভ অ্যালার্ট →" : "Live Alert →"}
            </Link>
          )}
          {!isResolved && (
            <button
              type="button"
              onClick={() => onOpenDossier(item)}
              style={{ fontSize: 12, fontWeight: 700, color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, padding: "4px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <CheckCircle2 size={13} />
              {isBn ? "সমাধান চিহ্নিত করুন" : "Mark Solved"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   SCAM ALERTS INDEX — neutral status language, case-first layout
============================================================ */
function ScamAlertsIndexPage({
  openSoon,
  selectedArea,
  openArea,
  onSelectArea,
}: {
  openSoon: (s: string) => void;
  selectedArea?: string;
  openArea?: () => void;
  onSelectArea?: (area: string) => void;
}) {
  const [alertParams, setAlertParams] = useSearchParams();
  const query = alertParams.get('q') || '';
  const areaFilter = alertParams.get('location') || selectedArea;
  const setQuery = (value: string) => {const next=new URLSearchParams(alertParams);if(value)next.set('q',value);else next.delete('q');setAlertParams(next,{replace:true});};
  const [incidentType, setIncidentType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [period, setPeriod] = useState('all');
  const [sort, setSort] = useState('newest');
  const filterKey = JSON.stringify([query, incidentType, period, sort, areaFilter || '', selectedCategory]);
  const [pagination, setPagination] = useState({filterKey, page: 1});
  const page = pagination.filterKey === filterKey ? pagination.page : 1;
  const setPage = (next: React.SetStateAction<number>) => setPagination(previous => {
    const currentPage = previous.filterKey === filterKey ? previous.page : 1;
    return {filterKey, page: typeof next === 'function' ? next(currentPage) : next};
  });
  const { cases: visibleCases, demo, loading, error, retry, total, lastPage } = useCases(undefined, query, 'All cases', page, period, sort, areaFilter, selectedCategory, undefined, incidentType);
  const { lang } = useLang();
  const [, setBookmarkTick] = useState(0);
  const {user} = useAuth();
  const navigate = useNavigate();

  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter cases by keyword, incident type, category (Default: All), and Area / Upazila / Thana
  const filteredCases = visibleCases;

  const activeFilterCount = (selectedCategory !== 'All' ? 1 : 0) +
    (incidentType !== 'all' ? 1 : 0) +
    (areaFilter && !areaFilter.includes('All Bangladesh') ? 1 : 0) +
    (sort !== 'newest' ? 1 : 0);

  return (
    <div className="scam-index-container public-alert-index" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>
      <section className="compact-alert-hero" aria-labelledby="public-alert-title" style={{ padding: '18px 20px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '16px' }}>
        <div className="alert-search-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'nowrap', gap: 12 }}>
          <div className="compact-alert-heading" style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <span aria-hidden="true" style={{ background: '#FFF1F0', color: '#C03A3A', width: 42, height: 42, minWidth: 42, borderRadius: 12, border: '1.5px solid #FFD8D6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={20}/>
            </span>
            <div style={{ minWidth: 0 }}>
              <h1 id="public-alert-title" style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#0F172A', fontFamily: 'var(--serif, Georgia, serif), serif', lineHeight: 1.25 }}>
                {lang==='bn'?'সতর্কতা ও কেস আপডেট':'Scam alerts & case updates'}
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748B', lineHeight: 1.35 }}>
                {lang==='bn'?'নাগরিক রিপোর্ট ও প্রকাশ্য অনুসন্ধান।':'Citizen reports & public summaries.'}
              </p>
            </div>
          </div>
          <Link to={user?'/scam-alerts/submit':'/login?next=%2Fscam-alerts%2Fsubmit'} className="compact-alert-submit" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#C03A3A', color: '#FFFFFF', padding: '9px 16px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 2px 4px rgba(192, 58, 58, 0.2)', flexShrink: 0, whiteSpace: 'nowrap' }} title={!user?(lang==='bn'?'কেস জমা দিতে সাইন ইন করুন':'Sign in to submit a case'):undefined}>
            <Plus size={15} aria-hidden="true"/>{lang==='bn'?'কেস জমা দিন':'Submit a case'}
          </Link>
        </div>

        {/* Pill Search Input & Filters Button matching Screenshot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
          {/* Search Pill Input */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              background: '#FFFFFF',
              border: '1.5px solid #94A3B8',
              borderRadius: '12px',
              padding: '0 14px',
              height: '44px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              transition: 'border-color 0.2s',
            }}
          >
            <Search size={17} color="#64748B" style={{ flexShrink: 0, marginRight: 8 }} aria-hidden="true" />
            <input
              type="search"
              value={query}
              maxLength={255}
              onChange={event => setQuery(event.target.value)}
              placeholder={lang === 'bn' ? 'প্রতিষ্ঠান, বিষয় বা কেস কোড খুঁজুন...' : 'Search organization, topic or...'}
              aria-label={lang === 'bn' ? 'প্রকাশ্য কেস খুঁজুন' : 'Search public cases'}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '14px',
                color: '#0F172A',
                fontFamily: 'inherit',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={lang === 'bn' ? 'মুছুন' : 'Clear'}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#E2E8F0',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter Pill Button (Matches Screenshot) */}
          <button
            type="button"
            onClick={() => setFiltersOpen(prev => !prev)}
            aria-expanded={filtersOpen}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: '44px',
              padding: '0 16px',
              background: filtersOpen ? '#FFF5F3' : '#FFFFFF',
              border: filtersOpen ? '1.5px solid #C03A3A' : '1.5px solid #FFD8D6',
              borderRadius: '12px',
              color: '#C03A3A',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease',
            }}
          >
            <SlidersHorizontal size={17} color="#C03A3A" aria-hidden="true" />
            <span>{lang === 'bn' ? 'ফিল্টার' : 'Filters'}</span>
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: '#C03A3A',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {filtersOpen && (
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '14px 16px',
              marginTop: 12,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 12,
              alignItems: 'center',
            }}
          >
            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>
                {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
              </label>
              <select
                value={selectedCategory}
                onChange={event => setSelectedCategory(event.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFFFFF', color: '#0F172A' }}
              >
                <option value="All">{lang === 'bn' ? 'সব ক্যাটাগরি' : 'All categories'}</option>
                {['Products','Businesses & Services','Doctors & Professionals','Hospitals & Clinics','Universities & Education','Courier & Digital Services','Online Electronics Shop','Overseas Education Consultancy','E-Commerce Marketplace'].map(value => (
                  <option key={value} value={value}>{translateCategory(value, lang)}</option>
                ))}
              </select>
            </div>

            {/* Location / Area */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>
                {lang === 'bn' ? 'এলাকা / বিভাগ' : 'Location / Area'}
              </label>
              <button
                type="button"
                onClick={openArea}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFFFFF', color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {translateArea(areaFilter, lang) || (lang === 'bn' ? 'সারাদেশ' : 'All Bangladesh')}
                </span>
                <ChevronDown size={14} color="#64748B" />
              </button>
            </div>

            {/* Incident Type */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>
                {lang === 'bn' ? 'ঘটনার ধরন' : 'Incident Type'}
              </label>
              <select
                value={incidentType}
                onChange={event => setIncidentType(event.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFFFFF', color: '#0F172A' }}
              >
                <option value="all">{lang === 'bn' ? 'সব ঘটনার ধরন' : 'All incident types'}</option>
                <option value="bribery">{lang === 'bn' ? 'ঘুষ দেওয়া/নেওয়া' : 'Bribery'}</option>
                <option value="non_delivery">{lang === 'bn' ? 'পণ্য বা সেবা পাওয়া যায়নি' : 'Goods or service not delivered'}</option>
                <option value="payment">{lang === 'bn' ? 'অর্থ পরিশোধের সমস্যা' : 'Payment concern'}</option>
                <option value="impersonation">{lang === 'bn' ? 'পরিচয় নকল' : 'Impersonation'}</option>
                <option value="misleading_offer">{lang === 'bn' ? 'বিভ্রান্তিকর অফার' : 'Misleading offer'}</option>
                <option value="other">{lang === 'bn' ? 'অন্য / নিশ্চিত নই' : 'Other / unsure'}</option>
              </select>
            </div>

            {/* Sort / Order */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>
                {lang === 'bn' ? 'ক্রম' : 'Order'}
              </label>
              <select
                value={sort}
                onChange={event => setSort(event.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFFFFF', color: '#0F172A' }}
              >
                <option value="trending">{lang === 'bn' ? 'আলোচিত' : 'Trending'}</option>
                <option value="newest">{lang === 'bn' ? 'নতুন আগে' : 'Newest first'}</option>
                <option value="oldest">{lang === 'bn' ? 'পুরোনো আগে' : 'Oldest first'}</option>
              </select>
            </div>

            {/* Reset */}
            {activeFilterCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingTop: 18 }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setIncidentType('all');
                    setSort('newest');
                    setPeriod('all');
                    const next = new URLSearchParams(alertParams);
                    next.delete('location');
                    setAlertParams(next, { replace: true });
                    onSelectArea?.('All Bangladesh (সারাদেশ)');
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  ✕ {lang === 'bn' ? 'ফিল্টার মুছুন' : 'Clear filters'}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

          {/* Advisory Banner */}
          <div className="compact-alert-help">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={15} color="#059669" aria-hidden="true" />
              <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>
                {lang === 'bn' ? 'ভোক্তা সহায়তা: ' : 'Consumer help: '}<a href="tel:16121">{lang === 'bn' ? '১৬১২১' : '16121'}</a> · <a href="https://dncrp.gov.bd/" target="_blank" rel="noopener noreferrer">{lang === 'bn' ? 'সরকারি যোগাযোগ' : 'Official contacts'}</a>
              </span>
            </div>
            <Link to="/policies" style={{ fontSize: 12, fontWeight: 700, color: 'var(--vermilion)', textDecoration: 'none' }}>
              {lang === 'bn' ? 'প্রমাণের নীতিমালা' : 'Evidence standards'} →
            </Link>
          </div>

          {loading && (
            <div className="entity-card" style={{ padding: 40, textAlign: 'center', borderRadius: 10 }}>
              <div className="loading-spinner-teal" style={{ margin: '0 auto 12px' }} />
              <span style={{ fontSize: 14, color: 'var(--slate-500)' }}>{lang === 'bn' ? 'কেস আপডেট লোড হচ্ছে…' : 'Loading public case updates…'}</span>
            </div>
          )}

          {error && (
            <div className="entity-card" style={{ padding: 20, textAlign: 'center', borderColor: '#B93628', borderRadius: 10 }}>
              <p style={{ color: '#B93628', fontWeight: 700 }}>{localizedError(error,lang)}</p>
              <button className="btn-pill-light" onClick={retry} style={{ margin: '8px auto 0' }}>
                {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry loading'}
              </button>
            </div>
          )}

          {/* Public summaries list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!loading&&filteredCases.map(item=>{
              const saved=!!user&&bookmarkService.isAlertSaved(item.slug||item.caseCode);
              const saveLabel=!user?(lang==='bn'?'সংরক্ষণ করতে সাইন ইন করুন':'Sign in to save'):saved?(lang==='bn'?'সংরক্ষণ সরান':'Remove saved case'):(lang==='bn'?'কেস সংরক্ষণ করুন':'Save case');
              const itemImgUrl = item.businessImage
                ? (item.businessImage.startsWith('http')
                    ? item.businessImage
                    : (item.businessImage.startsWith('http') || item.businessImage.startsWith('/') ? item.businessImage : '/' + item.businessImage))
                : (item.image && (item.image.startsWith('http') || item.image.startsWith('/')) ? item.image : null);
              return <article key={item.id} className="entity-card public-case-card compact-case-card">
                <header className="compact-case-meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span className="compact-case-code">{item.caseCode}</span>
                    <ScamStatus status={item.status}/>
                  </div>
                  <time className="public-alert-date" dateTime={item.date}>{formatDate(item.date,lang)}</time>
                </header>
                <div className="compact-case-main"><div className="compact-case-copy">
                  <h2><Link to={'/scam-alerts/'+(item.slug||item.caseCode)}>{publicText(item,'title',lang)}</Link></h2>
                  <p>{publicText(item,'summary',lang)}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '4px 0 2px' }}>
                    <span className="scam-entity-thumb-wrap" aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, minWidth: 18, borderRadius: 4, overflow: 'hidden', verticalAlign: 'middle', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                      {itemImgUrl ? (
                        <img
                          src={itemImgUrl}
                          alt={item.entity}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={e => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fb = e.currentTarget.parentElement?.querySelector('.scam-thumb-fallback') as HTMLElement;
                            if (fb) fb.style.display = 'inline-flex';
                          }}
                        />
                      ) : null}
                      <span className="scam-thumb-fallback" style={{ display: itemImgUrl ? 'none' : 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#0f766e' }}>
                        <Building2 size={11} />
                      </span>
                    </span>
                    {item.businessSlug ? (
                      <Link to={'/business/' + item.businessSlug} style={{ color: 'var(--ink)', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {item.entity}
                      </Link>
                    ) : (
                      <small title={item.entity} style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>{item.entity}</small>
                    )}
                  </div>
                  {originalTextLabel(item,lang,['title','summary'])&&<small className="public-original-label">{originalTextLabel(item,lang,['title','summary'])}</small>}
                </div>{item.public_media?.length?<PublicMediaGallery className="compact-case-media" media={item.public_media} lang={lang} label={publicText(item,'title',lang)}/>:null}</div>
                <footer className="public-alert-actions compact-case-actions">
                  <span className="compact-case-category">{translateCategory(item.category,lang)}</span>
                  <button type="button" className="compact-case-icon" aria-label={saveLabel} title={saveLabel} aria-pressed={saved} onClick={()=>{
                    if(!user){navigate('/login?next='+encodeURIComponent('/scam-alerts'+(alertParams.size?'?'+alertParams.toString():'')));return;}
                    bookmarkService.toggleAlert({id:item.id,slug:item.slug||item.caseCode,caseCode:item.caseCode,title:item.title,entity:item.entity,category:item.category,status:item.status,amount:item.amount,image:item.public_media?.[0]?.url});
                    setBookmarkTick(tick=>tick+1);
                  }}><Bookmark size={14} aria-hidden="true" fill={saved?'currentColor':'none'}/></button>
                  <ReportContentLink type="scam_case" id={item.id} lang={lang} iconOnly className="compact-case-icon"/>
                  <Link to={'/scam-alerts/'+(item.slug||item.caseCode)} className="public-case-read-link">{lang==='bn'?'বিস্তারিত':'Read case'}<ArrowRight size={14} aria-hidden="true"/></Link>
                </footer>
              </article>;
            })}

            {!loading && !error && !filteredCases.length && (
              <div className="entity-card" style={{ padding: 32, textAlign: 'center', borderRadius: 10 }}>
                <h2 style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: '1.2rem', fontWeight: 800 }}>{lang === 'bn' ? 'এই ফিল্টারে কোনো পাবলিক কেস পাওয়া যায়নি' : 'No public cases match your filter'}</h2>
                <p style={{ color: '#64748b', fontSize: 14 }}>{lang === 'bn' ? 'এলাকা বদলে বা খোঁজার লেখা মুছে আবার দেখুন।' : 'Try switching location or clearing the keyword search.'}</p>
                <button
                  className="btn-pill-light"
                  style={{ margin: '10px auto 0' }}
                  onClick={() => { setAlertParams(new URLSearchParams()); setIncidentType('all'); setSelectedCategory('All'); setPeriod('all'); setSort('newest'); onSelectArea?.('All Bangladesh (সারাদেশ)'); }}
                >
                  {lang === 'bn' ? 'ফিল্টার মুছুন' : 'Reset filters'}
                </button>
              </div>
            )}
          </div>

          {/* Pagination in Bottom Right */}
          {!error && (
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", marginTop: "24px", paddingTop: "16px", borderTop: "2px solid #121210", flexWrap: "wrap" }}>
              <span className="font-mono" style={{ fontSize: "12px", color: "#475569", fontWeight: 600, marginRight: "6px" }}>
                {lang === 'bn' ? 'পৃষ্ঠা' : 'Page'} {formatNumber(page,lang)} / {formatNumber(lastPage,lang)} · {formatNumber(total,lang)} {lang === 'bn' ? 'টি কেস' : 'cases'}
              </span>
              <button
                className="stamp-btn btn-press"
                style={{ background: '#FFFFFF', color: '#121210', padding: '6px 14px', fontSize: 12, opacity: (loading || page <= 1) ? 0.45 : 1 }}
                disabled={loading || page <= 1}
                onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 120, behavior: 'smooth' }); }}
              >
                ← {lang === 'bn' ? 'আগের পৃষ্ঠা' : 'Previous'}
              </button>
              <button
                className="stamp-btn btn-press"
                style={{ background: '#FFFFFF', color: '#121210', padding: '6px 14px', fontSize: 12, opacity: (loading || page >= lastPage) ? 0.45 : 1 }}
                disabled={loading || page >= lastPage}
                onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 120, behavior: 'smooth' }); }}
              >
                {lang === 'bn' ? 'পরের পৃষ্ঠা' : 'Next'} →
              </button>
            </div>
          )}
    </div>
  );
}

function ScamDetailPage({ openSoon }: { openSoon: (s: string) => void }) {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { cases, loading, demo, error, retry } = useCases(slug);
  const alert = cases.find((item) => item.slug === slug || item.caseCode === slug) || cases[0];
  const { lang } = useLang();
  const [isSaved, setIsSaved] = useState(() => alert ? bookmarkService.isAlertSaved(alert.slug || alert.caseCode) : false);
  const {user} = useAuth();
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [resolveSaving, setResolveSaving] = useState(false);
  const [resolveErr, setResolveErr] = useState("");
  const [orgResponseOpen, setOrgResponseOpen] = useState(false);
  const [orgResponse, setOrgResponse] = useState("");
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgErr, setOrgErr] = useState("");

  const [reporterResponseOpen, setReporterResponseOpen] = useState(false);
  const [reporterResponseText, setReporterResponseText] = useState("");
  const [reporterSaving, setReporterSaving] = useState(false);
  const [reporterErr, setReporterErr] = useState("");

  useEffect(() => {
    setIsSaved(alert ? bookmarkService.isAlertSaved(alert.slug || alert.caseCode) : false);
  }, [alert?.slug, alert?.caseCode]);

  const toggleSaveAlert = () => {
    if (!alert) return;
    if (!user) {navigate('/login?next=' + encodeURIComponent(`/scam-alerts/${alert.slug || alert.caseCode}`)); return;}
    const next = bookmarkService.toggleAlert({
      id: alert.id || alert.caseCode,
      slug: alert.slug || alert.caseCode,
      caseCode: alert.caseCode,
      title: alert.title,
      entity: alert.entity,
      category: alert.category,
      status: alert.status,
      amount: alert.amount,
      image: alert.public_media?.[0]?.url,
    });
    setIsSaved(next);
  };

  const isReporter = !!(user && alert && ((alert as any).reporter_user_id === user.id || (alert as any).reporterUserId === user.id));
  const isOrgRep = !!(user && alert && ((alert as any).business_user_id === user.id || (alert as any).business?.user_id === user.id));
  const isStaff = !!(user && ['admin', 'moderator'].includes(user.role));
  const isAdminVerified = !!(alert && (alert as any).adminReviewed);
  const isResolved = !!(alert && alert.rawStatus === 'resolved');
  const isPublished = !!(alert && ['published', 'disputed', 'resolved'].includes(alert.rawStatus || alert.status));
  const [alertToggling, setAlertToggling] = useState(false);

  const handleToggleAlert = async () => {
    if (!alert) return;
    setAlertToggling(true);
    try {
      await api(`/admin/scam-cases/${alert.id}/alert`, 'PATCH', { alert_enabled: !alert.alertEnabled });
      window.location.reload();
    } catch (err: any) {
      window.alert(err?.message || 'Failed to toggle alert status.');
      setAlertToggling(false);
    }
  };

  const handleDeleteCase = async () => {
    if (!alert) return;
    if (!window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে এই স্ক্যাম কেসটি মুছে ফেলতে চান?' : 'Are you sure you want to permanently delete this scam case?')) return;
    try {
      await api(`/admin/scam-cases/${alert.id}`, 'DELETE');
      navigate('/scam-alerts');
    } catch (err: any) {
      window.alert(err?.message || 'Failed to delete case.');
    }
  };

  const handleResolve = async () => {
    if (!alert) return;
    setResolveSaving(true); setResolveErr("");
    try {
      await api(`/scam-cases/${alert.id}/resolve`, "POST", { resolution_note: resolveNote || (isStaff ? "Marked as resolved by administrator." : "Marked as resolved by reporter.") });
      setResolveOpen(false);
      window.location.reload();
    } catch(e: any) {
      setResolveErr(e?.message || "Failed to mark as solved.");
      setResolveSaving(false);
    }
  };

  const handleOrgResponse = async () => {
    if (!alert || !orgResponse.trim()) return;
    setOrgSaving(true); setOrgErr("");
    try {
      await api(`/scam-cases/${alert.id}/subject-response`, "POST", { subject_response: orgResponse });
      setOrgResponseOpen(false);
      window.location.reload();
    } catch(e: any) {
      setOrgErr(e?.message || "Failed to submit response.");
      setOrgSaving(false);
    }
  };

  const handleReporterResponse = async () => {
    if (!alert || !reporterResponseText.trim()) return;
    setReporterSaving(true); setReporterErr("");
    try {
      await api(`/scam-cases/${alert.id}/reporter-response`, "POST", { reporter_response: reporterResponseText });
      setReporterResponseOpen(false);
      window.location.reload();
    } catch(e: any) {
      setReporterErr(e?.message || "Failed to submit update.");
      setReporterSaving(false);
    }
  };

  if (loading) return <div style={{ maxWidth: 960, margin: '60px auto', textAlign: 'center' }} className="font-mono">{lang === 'bn' ? 'কেসের তথ্য লোড হচ্ছে…' : 'Loading case details…'}</div>;
  if (error) return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: 24 }} className="brut bg-white">
      <p style={{ color: '#C03A3A', fontWeight: 700 }}>{localizedError(error,lang)}</p>
      <button onClick={retry} className="stamp-btn btn-press" style={{ background: '#121210', color: '#FFFFFF' }}>{lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}</button>
      <Link to="/scam-alerts" style={{ marginLeft: 12, color: '#121210', fontWeight: 700 }}>{lang === 'bn' ? 'সতর্কতায় ফিরুন' : 'Back to alerts'}</Link>
    </div>
  );
  if (!alert) return <Navigate to="/scam-alerts" replace />;

  const alertImgUrl = alert.businessImage
    ? (alert.businessImage.startsWith('http')
        ? alert.businessImage
        : (alert.businessImage.startsWith('http') || alert.businessImage.startsWith('/') ? alert.businessImage : '/' + alert.businessImage))
    : (alert.image && (alert.image.startsWith('http') || alert.image.startsWith('/')) ? alert.image : null);

  return (
    <div className="scam-index-container public-alert-detail" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px', minHeight: '80vh' }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/scam-alerts" style={{ fontWeight: 700, fontSize: 13, textDecoration: 'none', color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> {lang === 'bn' ? 'সব পাবলিক সতর্কতা' : 'All public alerts'}
        </Link>
      </div>

      {/* Staff Control Panel */}
      {isStaff && (
        <div style={{ background: '#FEF3C7', border: '1.5px solid #F59E0B', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={20} color="#B45309" />
            <div>
              <strong style={{ fontSize: 13.5, color: '#92400E', display: 'block' }}>
                {lang === 'bn' ? 'অ্যাডমিন ও মডারেশন নিয়ন্ত্রণ' : 'Staff Moderation Actions'}
              </strong>
              <span style={{ fontSize: 12, color: '#78350F' }}>
                {(alert as any).alertRequested
                  ? (lang === 'bn' ? '🔔 রিপোর্টার নাগরিক এই কেসের জন্য জরুরি পাবলিক অ্যালার্ট নোটিশের অনুরোধ করেছেন।' : '🔔 Reporter requested an urgent nationwide public alert notice.')
                  : (lang === 'bn' ? 'স্ট্যান্ডার্ড নাগরিক কেস রেকর্ড।' : 'Standard citizen scam report.')}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              disabled={alertToggling}
              onClick={handleToggleAlert}
              style={{
                background: alert.alertEnabled ? '#FFFFFF' : '#DC2626',
                color: alert.alertEnabled ? '#DC2626' : '#FFFFFF',
                border: alert.alertEnabled ? '1.5px solid #DC2626' : 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: alertToggling ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {alert.alertEnabled
                ? (lang === 'bn' ? '🚨 অ্যালার্ট নোটিশ বন্ধ করুন' : 'Turn Alert OFF')
                : (lang === 'bn' ? '🚨 জরুরি অ্যালার্ট নোটিশ চালু করুন' : '🚨 Turn Alert ON')}
            </button>
            <button
              type="button"
              onClick={handleDeleteCase}
              style={{
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1.5px solid #FCA5A5',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {lang === 'bn' ? '🗑 কেস মুছে ফেলুন' : '🗑 Delete Case'}
            </button>
            <Link
              to="/admin?tab=cases"
              style={{ fontSize: 12.5, color: '#92400E', textDecoration: 'underline', fontWeight: 700 }}
            >
              {lang === 'bn' ? 'অ্যাডমিন কিউ →' : 'Admin Queue →'}
            </Link>
          </div>
        </div>
      )}

      {/* Resolved banner */}
      {isResolved && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderLeft: '5px solid #16A34A', borderRadius: 10, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <CheckCircle2 size={24} color="#16A34A" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: 15, color: '#065F46', display: 'block', marginBottom: 2 }}>
              {lang === 'bn' ? '✓ এই কেসটি সমাধান হয়েছে' : '✓ This case has been resolved'}
            </strong>
            {(alert as any).resolution_note && <p style={{ margin: 0, fontSize: 13, color: '#047857' }}>{(alert as any).resolution_note}</p>}
          </div>
        </div>
      )}

      <div className="case-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: 24, alignItems: 'flex-start' }}>
        {/* Main Dossier Card */}
        <article className="editorial-dossier-card" style={{ display: 'block', width: '100%', padding: '28px 32px', position: 'relative', borderRadius: 12, background: '#FFFFFF', border: '1px solid #D8CDB7', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {/* Top Bar with Code & Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{
                  background: alert.alertEnabled ? '#DC2626' : '#FFF1F2',
                  color: alert.alertEnabled ? '#FFFFFF' : '#B93628',
                  border: alert.alertEnabled ? '1px solid #B91C1C' : '1px solid #FECDD3',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: '9999px',
                  padding: '2px 8px'
                }}>
                  {alert.alertEnabled ? (lang === 'bn' ? '🚨 জরুরি পাবলিক সতর্কতা নোটিশ' : '🚨 PUBLIC ALERT NOTICE') : (lang === 'bn' ? 'পাবলিক সতর্কতা' : 'PUBLIC ALERT NOTICE')}
                </span>
                <span style={{ background: '#F5EEDB', border: '1px solid #D8CDB7', borderRadius: '9999px', fontSize: 10, fontWeight: 700, padding: '2px 8px', color: 'var(--ink)' }}>{alert.caseCode}</span>
                <ScamStatus status={alert.status} />
                {isAdminVerified && (
                  <span style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', fontSize: 10, fontWeight: 700, borderRadius: '9999px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={11} /> {lang === 'bn' ? 'অ্যাডমিন যাচাইকৃত' : 'Verified by TruthHub Admin'}
                  </span>
                )}

              </div>
              <h1 style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, margin: '6px 0', color: 'var(--ink)' }}>
                {publicText(alert,'title',lang) || alert.title || (lang === 'bn' ? `${alert.entity} সংক্রান্ত কেস` : `Case concerning ${alert.entity}`)}
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--slate-500)', display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span>{lang === 'bn' ? 'উল্লিখিত প্রতিষ্ঠান' : 'Entity reported'}:</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="scam-detail-thumb-wrap" aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, minWidth: 18, borderRadius: 4, overflow: 'hidden', verticalAlign: 'middle', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                    {alertImgUrl ? (
                      <img
                        src={alertImgUrl}
                        alt={alert.entity}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                          const fb = e.currentTarget.parentElement?.querySelector('.scam-detail-thumb-fallback') as HTMLElement;
                          if (fb) fb.style.display = 'inline-flex';
                        }}
                      />
                    ) : null}
                    <span className="scam-detail-thumb-fallback" style={{ display: alertImgUrl ? 'none' : 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#0f766e' }}>
                      <Building2 size={11} />
                    </span>
                  </span>
                  {alert.businessSlug ? (
                    <Link to={'/business/' + alert.businessSlug} style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {alert.entity} <ArrowRight size={12} />
                    </Link>
                  ) : (
                    <strong style={{ color: 'var(--ink)' }}>{alert.entity}</strong>
                  )}
                </span>
                <span style={{ margin: '0 2px', color: 'var(--slate-400)' }}>·</span>
                <span>{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}:</span>
                <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontSize: 10, fontWeight: 700, borderRadius: '9999px', padding: '1px 7px' }}>{translateCategory(alert.category,lang)}</span>
              </p>
            </div>
            <div className="public-alert-actions public-alert-detail-actions">
              <button
                type="button"
                onClick={toggleSaveAlert}
                aria-pressed={!!user && isSaved}
              >
                <Bookmark size={15} aria-hidden="true" fill={user && isSaved ? 'currentColor' : 'none'} />
                <span>{!user ? (lang === 'bn' ? 'সংরক্ষণ করতে সাইন ইন' : 'Sign in to save') : isSaved ? (lang === 'bn' ? 'সংরক্ষিত' : 'Saved') : (lang === 'bn' ? 'সংরক্ষণ' : 'Save')}</span>
              </button>
              <ReportContentLink type="scam_case" id={alert.id} lang={lang} />
              <ShareCard
                url={`/scam-alerts/${alert.slug || alert.caseCode}`}
                title={lang === 'bn' && alert.title?.startsWith('Case concerning') ? `${alert.entity} সংক্রান্ত কেস` : (publicText(alert, 'title', lang) || alert.title)}
                description={publicText(alert, 'summary', lang) || alert.summary}
                businessName={alert.entity}
                organizationImage={alert.businessImage || (alert as any).organization_image || (alert as any).business?.image || (alert as any).business_image}
                mediaImage={alert.public_media?.[0]?.url}
                amount={alert.amount}
                status={alert.status}
                category={alert.category || alert.incident_type}
                isAlert={true}
                caseCode={alert.caseCode}
                compact
              />
              <span className="public-alert-date">{lang === 'bn' ? 'তারিখ:' : 'Filed:'} {formatDate(alert.date,lang)}</span>
            </div>
          </div>

          <PublicMediaGallery media={alert.public_media || []} lang={lang} />
          <PublicVideoLinks urls={alert.public_video_urls} lang={lang}/>
          <div className="case-related-links">{alert.linked_review&&<Link className="content-action" to={alert.linked_review.url}>{lang==='bn'?'সংশ্লিষ্ট রিভিউ পড়ুন':'Read the linked review'} <ArrowRight size={16} aria-hidden="true"/></Link>}{alert.businessSlug&&<Link className="content-action" to={'/business/'+alert.businessSlug+'#organization-reports'}>{lang==='bn'?'প্রতিষ্ঠানের প্রোফাইল ও রিপোর্ট':'Organization profile & reports'} <ArrowRight size={16} aria-hidden="true"/></Link>}</div>

          {/* Case Narrative */}
          <div style={{ margin: '22px 0', fontSize: '1.02rem', lineHeight: 1.75, color: 'var(--ink)' }}>
            <h3 style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 10px', color: 'var(--ink)' }}>
              {lang === 'bn' ? 'রিপোর্টের বিস্তারিত বিবরণ' : 'Report Details & Description'}
            </h3>
            <p style={{ margin: 0, color: 'var(--slate-800)', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {publicText(alert,'summary',lang) || alert.summary || (alert as any).description}
            </p>
            {originalTextLabel(alert,lang,['title','summary']) && <p className="public-original-label">{originalTextLabel(alert,lang,['title','summary'])}</p>}
          </div>

          {/* Organization Official Response Box */}
          {(alert as any).subject_response && (
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderLeft: '4px solid #0284C7', borderRadius: 10, padding: '16px 20px', margin: '20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Building2 size={18} color="#0284C7" />
                <strong style={{ fontSize: 14, color: '#075985' }}>
                  {lang === 'bn' ? 'প্রতিষ্ঠানের আনুষ্ঠানিক জবাব ও সমাধান' : 'Official Response & Proposed Solution from the Organization'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: '#0C4A6E', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {(alert as any).subject_response}
              </p>
            </div>
          )}

          {/* Reporter Public Follow-up / Response Box */}
          {(alert as any).reporter_update && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderLeft: '4px solid #D97706', borderRadius: 10, padding: '16px 20px', margin: '20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <MessageSquare size={18} color="#D97706" />
                <strong style={{ fontSize: 14, color: '#92400E' }}>
                  {lang === 'bn' ? 'অভিযোগকারী নাগরিকের আপডেট ও প্রতিক্রিয়া' : 'Citizen Reporter Follow-up & Response'}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: '#78350F', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {(alert as any).reporter_update}
              </p>
            </div>
          )}

          {/* Case Disclaimer Stamp */}
          <div style={{ background: '#FFFDF7', border: '1px solid #E2D7C2', borderLeft: '4px solid #D97706', padding: '16px 20px', borderRadius: 8, fontSize: 13, lineHeight: 1.6, color: 'var(--slate-700)', margin: '22px 0' }}>
            <strong style={{ color: 'var(--ink)' }}>{lang === 'bn' ? 'প্ল্যাটফর্মের নোটিশ: ' : 'Platform notice: '}</strong>{lang === 'bn' ? 'রিপোর্ট একটি নাগরিক অভিযোগ, অপরাধের প্রমাণ নয়। মডারেশনের অবস্থা আদালতের রায় নয়।' : 'A report is an allegation, not a finding of guilt. Moderation status is not a court judgment.'}
          </div>

          {/* Organization Rep: Submit Response */}
          {isOrgRep && !isResolved && (
            <div style={{ margin: '22px 0', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Building2 size={18} color="#0284C7" />
                <strong style={{ fontSize: 14, color: '#075985' }}>
                  {lang === 'bn' ? 'আনুষ্ঠানিক জবাব ও সমাধান প্রস্তাব দিন' : 'Submit Official Response & Solution'}
                </strong>
              </div>
              {!(alert as any).subject_response && !orgResponseOpen && (
                <button
                  type="button"
                  onClick={() => setOrgResponseOpen(true)}
                  style={{ background: '#0284C7', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <MessageSquare size={15} /> {lang === 'bn' ? 'জবাব ও সমাধান লিখুন' : 'Write Response & Solution'}
                </button>
              )}
              {((alert as any).subject_response || orgResponseOpen) && (
                <div>
                  {(alert as any).subject_response && (
                    <div style={{ background: '#E0F2FE', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#0C4A6E' }}>
                      <strong>{lang === 'bn' ? 'আপনার বর্তমান জবাব:' : 'Your current response:'}</strong>
                      <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{(alert as any).subject_response}</p>
                    </div>
                  )}
                  {!orgResponseOpen && (
                    <button type="button" onClick={() => { setOrgResponse((alert as any).subject_response || ""); setOrgResponseOpen(true); }} style={{ background: '#FFFFFF', border: '1px solid #BAE6FD', color: '#0284C7', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      {lang === 'bn' ? 'জবাব আপডেট করুন' : 'Update Response'}
                    </button>
                  )}
                  {orgResponseOpen && (
                    <div>
                      <textarea
                        value={orgResponse}
                        onChange={e => setOrgResponse(e.target.value)}
                        rows={5}
                        placeholder={lang === 'bn' ? 'আপনার প্রতিষ্ঠানের পক্ষে আনুষ্ঠানিক ব্যাখ্যা, সমাধানের প্রস্তাব বা প্রমাণ লিখুন...' : 'Write your official explanation, proposed resolution, and evidence details here...'}
                        style={{ width: '100%', border: '1px solid #BAE6FD', borderRadius: 8, padding: '12px', fontSize: 13, lineHeight: 1.6, resize: 'vertical', background: '#FFFFFF', boxSizing: 'border-box' }}
                      />
                      {orgErr && <p style={{ color: '#DC2626', fontSize: 12, margin: '6px 0 0' }}>{orgErr}</p>}
                      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        <button type="button" disabled={orgSaving || !orgResponse.trim()} onClick={handleOrgResponse} style={{ background: '#0284C7', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: orgSaving ? 'wait' : 'pointer' }}>
                          {orgSaving ? (lang === 'bn' ? 'সাবমিট হচ্ছে…' : 'Submitting…') : (lang === 'bn' ? 'জবাব সাবমিট করুন' : 'Submit Response')}
                        </button>
                        <button type="button" onClick={() => setOrgResponseOpen(false)} style={{ background: '#FFFFFF', border: '1px solid #BAE6FD', color: '#0284C7', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer' }}>
                          {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Citizen Reporter: Submit Follow-up Response */}
          {isReporter && !isResolved && (
            <div style={{ margin: '22px 0', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <MessageSquare size={18} color="#D97706" />
                <strong style={{ fontSize: 14, color: '#92400E' }}>
                  {lang === 'bn' ? 'আপনার প্রতিক্রিয়া বা ফলো-আপ আপডেট জানান' : 'Post Reporter Follow-up / Response'}
                </strong>
              </div>
              {!(alert as any).reporter_update && !reporterResponseOpen && (
                <button
                  type="button"
                  onClick={() => setReporterResponseOpen(true)}
                  style={{ background: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <MessageSquare size={15} /> {lang === 'bn' ? 'প্রতিক্রিয়া বা আপডেট লিখুন' : 'Write Follow-up Response'}
                </button>
              )}
              {((alert as any).reporter_update || reporterResponseOpen) && (
                <div>
                  {(alert as any).reporter_update && (
                    <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#78350F' }}>
                      <strong>{lang === 'bn' ? 'আপনার বর্তমান প্রতিক্রিয়া:' : 'Your current update:'}</strong>
                      <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{(alert as any).reporter_update}</p>
                    </div>
                  )}
                  {!reporterResponseOpen && (
                    <button type="button" onClick={() => { setReporterResponseText((alert as any).reporter_update || ""); setReporterResponseOpen(true); }} style={{ background: '#FFFFFF', border: '1px solid #FDE68A', color: '#B45309', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      {lang === 'bn' ? 'প্রতিক্রিয়া আপডেট করুন' : 'Update Your Follow-up'}
                    </button>
                  )}
                  {reporterResponseOpen && (
                    <div>
                      <textarea
                        value={reporterResponseText}
                        onChange={e => setReporterResponseText(e.target.value)}
                        rows={4}
                        placeholder={lang === 'bn' ? 'প্রতিষ্ঠানের জবাবের প্রেক্ষিতে আপনার বক্তব্য, বর্তমান অবস্থা বা সমাধান হয়েছে কি না লিখুন...' : 'Write your response to the organization, current status, or further clarification...'}
                        style={{ width: '100%', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px', fontSize: 13, lineHeight: 1.6, resize: 'vertical', background: '#FFFFFF', boxSizing: 'border-box' }}
                      />
                      {reporterErr && <p style={{ color: '#DC2626', fontSize: 12, margin: '6px 0 0' }}>{reporterErr}</p>}
                      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        <button type="button" disabled={reporterSaving || !reporterResponseText.trim()} onClick={handleReporterResponse} style={{ background: '#D97706', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: reporterSaving ? 'wait' : 'pointer' }}>
                          {reporterSaving ? (lang === 'bn' ? 'সাবমিট হচ্ছে…' : 'Submitting…') : (lang === 'bn' ? 'প্রতিক্রিয়া সাবমিট করুন' : 'Submit Follow-up')}
                        </button>
                        <button type="button" onClick={() => setReporterResponseOpen(false)} style={{ background: '#FFFFFF', border: '1px solid #FDE68A', color: '#B45309', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer' }}>
                          {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reporter or Staff: Mark as Solved */}
          {(isReporter || isStaff) && !isResolved && isPublished && (
            <div style={{ margin: '22px 0', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <CheckCircle2 size={18} color="#059669" />
                <strong style={{ fontSize: 14, color: '#065F46' }}>
                  {isStaff
                    ? (lang === 'bn' ? 'অ্যাডমিন রেজোলিউশন: কেস সমাধান চিহ্নিত করুন' : 'Admin Resolution: Mark Case as Resolved')
                    : (lang === 'bn' ? 'বিষয়টি কি সমাধান হয়ে গেছে?' : 'Has your issue been resolved?')}
                </strong>
              </div>
              {!resolveOpen ? (
                <button
                  type="button"
                  onClick={() => setResolveOpen(true)}
                  style={{ background: '#059669', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <CheckCircle2 size={15} /> {lang === 'bn' ? 'হ্যাঁ, সমাধান হয়েছে — চিহ্নিত করুন' : 'Yes, mark as Solved'}
                </button>
              ) : (
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: '#047857' }}>
                    {lang === 'bn' ? 'সমাধানের বিবরণ (ঐচ্ছিক):' : 'Describe the resolution (optional):'}
                  </p>
                  <textarea
                    value={resolveNote}
                    onChange={e => setResolveNote(e.target.value)}
                    rows={3}
                    placeholder={lang === 'bn' ? 'যেমন: কোম্পানি সম্পূর্ণ রিফান্ড দিয়েছে / পণ্য পেয়েছি...' : 'e.g. Company issued full refund / Product was delivered...'}
                    style={{ width: '100%', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 12px', fontSize: 13, lineHeight: 1.5, resize: 'vertical', background: '#FFFFFF', boxSizing: 'border-box' }}
                  />
                  {resolveErr && <p style={{ color: '#DC2626', fontSize: 12, margin: '6px 0 0' }}>{resolveErr}</p>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button type="button" disabled={resolveSaving} onClick={handleResolve} style={{ background: '#059669', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: resolveSaving ? 'wait' : 'pointer' }}>
                      {resolveSaving ? (lang === 'bn' ? 'সাবমিট হচ্ছে…' : 'Saving…') : (lang === 'bn' ? '✓ সমাধান নিশ্চিত করুন' : '✓ Confirm Resolved')}
                    </button>
                    <button type="button" onClick={() => setResolveOpen(false)} style={{ background: '#FFFFFF', border: '1px solid #A7F3D0', color: '#065F46', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer' }}>
                      {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Forensic Timeline Stepper */}
          <div style={{ marginTop: 28, borderTop: '1px solid var(--rule)', paddingTop: 20 }}>
            <h3 style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 16px', color: 'var(--ink)' }}>
              {lang === 'bn' ? 'কেসের আপডেট ও সমাধান' : 'Case updates and resolution'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!alert.timeline?.length && <p>{lang === 'bn' ? 'এখনও কোনো পাবলিক ইতিহাস প্রকাশ করা হয়নি।' : 'No public history has been published yet.'}</p>}
              {alert.timeline?.map((event, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: event.done ? '#059669' : '#FFFFFF', border: '1px solid #D8CDB7', color: event.done ? '#FFFFFF' : 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                    {event.done ? '✓' : '·'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 14, color: 'var(--ink)' }}>{translateStatus(event.title,lang)}</strong>
                      <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>{formatDate(event.date,lang)}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--slate-600)', lineHeight: 1.5 }}>{event.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* Side Summary & Policy Checks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <aside style={{ display: 'block', padding: 22, borderRadius: 10, background: '#FFFFFF', border: '1px solid #D8CDB7', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 15, fontWeight: 800, margin: '0 0 12px', borderBottom: '1px solid var(--rule)', paddingBottom: 8, color: 'var(--ink)' }}>
              {lang === 'bn' ? 'কেসের সংক্ষিপ্ত তথ্য' : 'CASE SUMMARY & FACTS'}
            </h3>
            <dl style={{ fontSize: 12.5, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <dt style={{ color: 'var(--slate-500)' }}>{lang === 'bn' ? 'ক্যাটাগরি:' : 'CATEGORY:'}</dt>
                <dd style={{ fontWeight: 700, color: 'var(--ink)' }}>{translateCategory(alert.category,lang)}</dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <dt style={{ color: 'var(--slate-500)' }}>{lang === 'bn' ? 'উল্লিখিত ক্ষতি:' : 'REPORTED LOSS:'}</dt>
                <dd style={{ fontWeight: 800, color: 'var(--vermilion)' }}>{alert.amount && alert.amount !== 'Not publicly disclosed' ? alert.amount : (lang === 'bn' ? 'প্রকাশ করা হয়নি' : 'Not publicly disclosed')}</dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <dt style={{ color: 'var(--slate-500)' }}>{lang === 'bn' ? 'যাচাই অবস্থা:' : 'VERIFICATION:'}</dt>
                <dd style={{ fontWeight: 700, color: isAdminVerified ? '#059669' : '#D97706' }}>
                  {isAdminVerified ? (lang === 'bn' ? '✓ অ্যাডমিন যাচাইকৃত' : '✓ Admin Verified') : (lang === 'bn' ? 'যাচাই অপেক্ষমান' : 'Pending Verification')}
                </dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <dt style={{ color: 'var(--slate-500)' }}>{lang === 'bn' ? 'অ্যালার্ট নোটিশ:' : 'ALERT NOTICE:'}</dt>
                <dd style={{ fontWeight: 700, color: alert.alertEnabled ? '#DC2626' : (alert as any).alertRequested ? '#B45309' : '#059669' }}>
                  {alert.alertEnabled
                    ? (lang === 'bn' ? '🚨 সক্রিয় অ্যালার্ট' : '🚨 Active Notice')
                    : (alert as any).alertRequested
                    ? (lang === 'bn' ? '🔔 অনুরোধ করা হয়েছে' : '🔔 Requested by Citizen')
                    : (lang === 'bn' ? 'সাধারণ পাবলিক কেস' : 'Standard Case')}
                </dd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <dt style={{ color: 'var(--slate-500)' }}>{lang === 'bn' ? 'ভোক্তা অধিকার হটলাইন:' : 'DNCRP HOTLINE:'}</dt>
                <dd style={{ fontWeight: 800, color: '#059669' }}>{lang === 'bn' ? '১৬১২১' : '16121'}</dd>
              </div>
            </dl>
          </aside>

          <div style={{ display: 'block', padding: 20, borderRadius: 10, background: '#FFFFFF', border: '1px solid #D8CDB7', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3>{lang === 'bn' ? 'এই কেস কীভাবে পড়বেন' : 'How to read this case'}</h3>
            <p>{lang === 'bn' ? 'এটি নাগরিকদের দাখিলকৃত তথ্যপ্রমাণ ও পর্যালোচিত পাবলিক রেকর্ড।' : 'This is a verified citizen report and public record.'}</p>
            <p>{lang === 'bn' ? 'স্ট্যাটাস প্ল্যাটফর্মের সিদ্ধান্ত বোঝায়, আইনি রায় নয়।' : 'The status describes a platform decision, not a legal judgment.'}</p>
            <Link className="public-case-read-link" to="/policies">{lang === 'bn' ? 'প্রকাশনা ও নীতি' : 'Publication standards'} →</Link>
          </div>
        </div>
      </div>

      <section className="case-correction-callout"><Flag size={22} aria-hidden="true"/><div><h2>{lang === 'bn' ? 'এই আপডেটে ভুল আছে?' : 'Something inaccurate in this update?'}</h2><p>{lang === 'bn' ? 'উপরের রিপোর্ট বাটনে এই কেসের নির্দিষ্ট তথ্য পর্যালোচনার জন্য পাঠান। এখানে ব্যক্তিগত প্রমাণ প্রকাশ করবেন পণ্ডিত করবেন না।' : 'Use the Report action above to send a specific correction. Do not post private evidence publicly.'}</p></div></section>
    </div>
  );
}

/* ============================================================
   POLISHED AUTH PAGES (Compact & Fully Visible on Screen)
============================================================ */
function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialVerifyEmail = searchParams.get("verify_email") || searchParams.get("email") || "";
  const initialCode = searchParams.get("code") || "";
  const [form, setForm] = useState({
    name: "",
    email: initialVerifyEmail,
    password: "",
    password_confirmation: "",
    remember: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [checkInbox, setCheckInbox] = useState(!!initialVerifyEmail && !!initialCode);
  const [verificationCode, setVerificationCode] = useState(initialCode);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeSuccess, setCodeSuccess] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const {lang}=useLang();
  const bn=lang==='bn';
  const [showPassword,setShowPassword]=useState(false);

  const verifiedParam = searchParams.get("verified");
  const expiredEmail = searchParams.get("email") || form.email;
  const requestedNext = searchParams.get('next');
  const nextPath = loginDestination(requestedNext,user?.role);

  if (user) return <Navigate to={nextPath} replace />;
  const update = (name: string, value: string | boolean) => setForm((f) => ({ ...f, [name]: value }));

  const handleResend = async (targetEmail: string) => {
    if (!targetEmail) return;
    setResending(true);
    setResendStatus(null);
    setError("");
    try {
      const res = await authService.resendVerification(targetEmail);
      setResendStatus(res.message || "A new 6-digit verification code has been sent! Check your inbox.");
    } catch (e: unknown) {
      setResendStatus((e as Error).message || "Could not resend email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    const cleanCode = verificationCode.trim();
    if (verifyingCode || cleanCode.length < 6) return;
    setVerifyingCode(true);
    setError("");
    setCodeSuccess("");
    setResendStatus(null);
    try {
      const res = await authService.verifyCode({ email: form.email, code: cleanCode });
      setCodeSuccess(res.message || "Email verified successfully! Logging you in...");
      if (res.user) {
        setUser(res.user);
        setTimeout(() => {
          navigate(loginDestination(requestedNext, res.user?.role));
        }, 1200);
      } else {
        setTimeout(() => {
          navigate("/login?verified=1");
        }, 1200);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? "The verification code is invalid or has expired. Please check your inbox and try again.");
    } finally {
      setVerifyingCode(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if(loading)return;
    setLoading(true);
    setError("");
    setErrors({});
    setResendStatus(null);
    try {
      if (isLogin) {
        const result = await authService.login({ email: form.email, password: form.password, remember: form.remember });
        setUser(result.user);
        navigate(loginDestination(requestedNext,result.user.role));
      } else {
        const res = await authService.register(form);
        setCheckInbox(true);
        if (res.message) {
          setResendStatus(res.message);
        }
      }
    } catch (e: unknown) {
      const err = e as { message?: string; errors?: Record<string, string[]> };
      setError(err.message ?? "We couldn't complete that request.");
      setErrors(err.errors ?? {});
    } finally {
      setLoading(false);
    }
  };

  if (checkInbox)
    return (
      <div className="auth-page-container">
        <div className="auth-card-dual">
          <div className="auth-side-banner">
            <div>
              <Logo dark />
              <div className="trust-badge-pill" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.2)", marginTop: 16 }}>
                {bn ? 'ইমেইল যাচাইকরণ' : 'EMAIL VERIFICATION'}
              </div>
              <h2>{bn ? '৬-সংখ্যার কোড দিয়ে নিশ্চিত করুন।' : 'Verify your account with 6-digit code.'}</h2>
              <p>
                {bn
                  ? `আমরা ${form.email} ঠিকানায় একটি ৬-সংখ্যার যাচাইকরণ কোড পাঠিয়েছি। অ্যাকাউন্ট সক্রিয় করতে নিচের বক্সে কোডটি লিখুন।`
                  : `We sent a 6-digit verification code to ${form.email}. Enter the code below to instantly activate your TruthHubBD account.`}
              </p>
            </div>
            <div className="auth-side-points">
              <span><Clock size={15} /> {bn ? 'কোডের মেয়াদ ১৫ মিনিট' : 'Code valid for 15 minutes'}</span>
              <span><Mail size={15} /> {bn ? 'ইনবক্সে না পেলে স্প্যাম ফোল্ডার দেখুন' : 'Check Spam or Promotions if not in Inbox'}</span>
              <span><CheckCircle2 size={15} /> {bn ? 'কোড যাচাইয়ের পর সরাসরি লগ ইন হবে' : 'Immediate login upon verification'}</span>
            </div>
            <small style={{ color: "var(--slate-400)" }}>{bn ? 'নিরাপদ অ্যাকাউন্ট অ্যাক্টিভেশন' : 'Secure Email Verification'}</small>
          </div>

          <div className="auth-form-panel">
            <p className="logo-subtitle">{bn ? 'যাচাইকরণ প্রক্রিয়া' : 'SECURITY VERIFICATION'}</p>
            <h3>{bn ? 'যাচাইকরণ কোড দিন' : 'Enter Verification Code'}</h3>
            <p style={{ margin: "4px 0 16px", color: "var(--slate-600)" }}>
              {bn ? 'কোড পাঠানো হয়েছে:' : 'A 6-digit code was sent to:'} <strong>{form.email}</strong>
            </p>

            <form onSubmit={handleVerifyCode}>
              <div className="verification-code-box">
                <label htmlFor="verify-code-input" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginBottom: 10 }}>
                  {bn ? '৬-সংখ্যার কোডটি লিখুন:' : 'Enter 6-Digit Code:'}
                </label>
                <input
                  id="verify-code-input"
                  className="verification-code-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  placeholder="------"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={verifyingCode || !!codeSuccess}
                  required
                />
                <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#64748b' }}>
                  ⏱️ {bn ? 'মেয়াদ ১৫ মিনিট' : 'Valid for 15 minutes'}
                </div>
              </div>

              {error && <div className="form-error" role="alert" style={{ marginBottom: 14 }}><AlertCircle size={16} />{error}</div>}
              {codeSuccess && <div className="success-message" role="status" style={{ marginBottom: 14 }}><CheckCircle2 size={16} />{codeSuccess}</div>}

              <button
                type="submit"
                className="btn primary full"
                style={{ minHeight: 48, fontSize: '1rem', fontWeight: 700 }}
                disabled={verifyingCode || verificationCode.length < 6 || !!codeSuccess}
              >
                {verifyingCode
                  ? (bn ? 'যাচাই করা হচ্ছে…' : 'Verifying Code…')
                  : (bn ? 'কোড যাচাই করুন' : 'Verify Code & Activate Account')}
              </button>
            </form>

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 10px' }}>
                {bn ? 'কোড পাননি? স্প্যাম ফোল্ডার খুঁজুন অথবা নতুন কোড চান:' : "Didn't receive the email? Check spam or request a new code:"}
              </p>
              <button
                type="button"
                className="btn-pill-light"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => handleResend(form.email)}
                disabled={resending || !!codeSuccess}
              >
                {resending ? (bn ? 'কোড পাঠানো হচ্ছে…' : 'Sending new code…') : (bn ? 'নতুন কোড পাঠান' : 'Resend 6-Digit Code')}
              </button>
              {resendStatus && <div className="success-message" style={{ marginTop: 10 }}><CheckCircle2 size={15} />{resendStatus}</div>}
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--teal-primary, #0d9488)', cursor: 'pointer', padding: 0, fontWeight: 700, textDecoration: 'underline' }}
                onClick={() => {
                  setCheckInbox(false);
                  setError("");
                }}
              >
                &larr; {bn ? 'ইমেইল পরিবর্তন করুন' : 'Change email address'}
              </button>
              <Link to="/login" style={{ color: 'var(--teal-primary, #0d9488)', fontWeight: 700, textDecoration: 'underline' }}>
                {bn ? 'লগ ইন পেজে যান' : 'Go to login'} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="auth-page-container">
      <div className="auth-card-dual">
        <div className="auth-side-banner">
          <div>
            <Logo dark />
            <div className="trust-badge-pill" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.2)", marginTop: 14 }}>
              {isLogin ? (bn?'স্বাগতম':'YOUR COMMUNITY, ONE ACCOUNT') : (bn?'TruthHubBD-তে যোগ দিন':'Join TruthHubBD')}
            </div>
            <h2>{isLogin ? (bn?'আপনার অভিজ্ঞতা অন্যকে সাহায্য করুক।':'Your experience can help someone else.') : (bn?'সচেতন বাংলাদেশের পাশে থাকুন।':'Join a more informed Bangladesh')}</h2>
            <p>
              {isLogin
                ? (bn?'সব রিভিউ ও প্রকাশ্য কেস লগ ইন ছাড়াই পড়ুন। অভিজ্ঞতা লেখা, প্রতিক্রিয়া ও বিজ্ঞপ্তির জন্য লগ ইন করুন।':'Reviews and public cases are open to everyone. Sign in to contribute, react, save updates and receive public alerts.')
                : (bn?'বিনামূল্যে অ্যাকাউন্ট খুলুন। ইমেইলে নিশ্চিতকরণের লিংক পাবেন।':'Create your free account. A confirmation link will be sent to your inbox.')}
            </p>
          </div>
          <div className="auth-side-points">
            {isLogin ? (
              <>
                <span><CheckCircle2 size={18} aria-hidden="true" /> {bn?'অংশ নিতে ইমেইল নিশ্চিত করুন':'Confirm your email to participate'}</span>
                <span><Lock size={18} aria-hidden="true" /> {bn?'মূল প্রমাণ ব্যক্তিগত থাকে':'Original evidence stays private'}</span>
                <span><Bell size={18} aria-hidden="true" /> {bn?'অ্যাডমিনের প্রকাশ্য সতর্কতার বিজ্ঞপ্তি':'Receive admin-issued public alerts'}</span>
              </>
            ) : (
              <>
                <span><Clock size={15} /> 5-minute link activation</span>
                <span><ShieldCheck size={15} /> Email confirmation and moderation safeguards</span>
                <span><UserCheck size={15} /> Canonical profile ownership</span>
              </>
            )}
          </div>
          <Link className="auth-browse-link" to="/search?view=reviews">{bn?'লগ ইন ছাড়াই ঘুরে দেখুন':'Keep exploring without an account'} <ArrowRight size={17} aria-hidden="true"/></Link>
        </div>

        <div className="auth-form-panel">
          <p className="logo-subtitle">{isLogin ? (bn?'আপনার অ্যাকাউন্ট':'WELCOME BACK') : (bn?'নতুন অ্যাকাউন্ট':'CREATE YOUR ACCOUNT')}</p>
          <h3>{isLogin ? (bn?'লগ ইন করুন':'Make yourself at home.') : (bn?'অ্যাকাউন্ট তৈরি করুন':'Be part of the community.')}</h3>
          <p>{isLogin ? (bn?'অংশ নিতে ইমেইল নিশ্চিত করা অ্যাকাউন্ট ব্যবহার করুন।':'Use your email-confirmed account to participate.') : (bn?'ইমেইলের লিংক দিয়ে ৫ মিনিটের মধ্যে নিশ্চিত করুন।':'Confirm your email using the link within 5 minutes.')}</p>

          {verifiedParam === "1" && <div className="success-message"><CheckCircle2 size={15} /> Email verified! You can now log in.</div>}
          {verifiedParam === "already" && <div className="success-message"><CheckCircle2 size={15} /> Email already verified. Log in below.</div>}

          {verifiedParam === "expired" && (
            <div className="form-error" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={16} />
                <strong>Verification link expired (5-min limit).</strong>
              </div>
              <div style={{ display: "flex", gap: 6, width: "100%", marginTop: 2 }}>
                <input
                  type="email"
                  placeholder="Your registered email"
                  value={form.email || expiredEmail}
                  onChange={(e) => update("email", e.target.value)}
                  style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--slate-300)" }}
                />
                <button
                  className="btn-teal-pill"
                  type="button"
                  onClick={() => handleResend(form.email || expiredEmail)}
                  disabled={resending || !(form.email || expiredEmail)}
                >
                  {resending ? "Sending…" : "Resend"}
                </button>
              </div>
            </div>
          )}

          {resendStatus && <div className="success-message"><CheckCircle2 size={15} />{resendStatus}</div>}
          {error && <div className="form-error" role="alert"><AlertCircle size={16} aria-hidden="true"/>{error}</div>}

          <form onSubmit={submit}>
            {!isLogin && (
              <label className="field">
                <span>{bn?'পূর্ণ নাম':'Full name'}</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Faysal Ahmed"
                  autoComplete="name"
                  required
                />
                {errors.name?.[0] && <small style={{ color: "#dc2626" }}>{errors.name[0]}</small>}
              </label>
            )}

            <label className="field">
              <span>{bn?'ইমেইল ঠিকানা':'Email address'}</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              {errors.email?.[0] && <small style={{ color: "#dc2626" }}>{errors.email[0]}</small>}
            </label>

            <label className="field">
              <span>{bn?'পাসওয়ার্ড':'Password'}</span>
              <input
                name="password"
                id="auth-password"
                aria-label={bn?'পাসওয়ার্ড':'Password'}
                type={showPassword?'text':'password'}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />
              {errors.password?.[0] && <small style={{ color: "#dc2626" }}>{errors.password[0]}</small>}
              <button className="auth-password-toggle" type="button" aria-controls="auth-password" aria-pressed={showPassword} onClick={()=>setShowPassword(value=>!value)}>{showPassword?(bn?'পাসওয়ার্ড লুকান':'Hide password'):(bn?'পাসওয়ার্ড দেখুন':'Show password')}</button>
            </label>

            {!isLogin && (
              <label className="field">
                <span>{bn?'পাসওয়ার্ড আবার লিখুন':'Confirm password'}</span>
                <input
                  name="password_confirmation"
                  type="password"
                  value={form.password_confirmation}
                  onChange={(e) => update("password_confirmation", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </label>
            )}

            {isLogin && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 12px" }}>
                <label className="check" style={{ margin: 0 }}>
                  <input type="checkbox" checked={form.remember} onChange={(e) => update("remember", e.target.checked)} />
                  <span>{bn?'লগ ইন অবস্থায় রাখুন':'Remember me'}</span>
                </label>
                <Link to="/forgot-password" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--teal-primary)" }}>
                  {bn?'পাসওয়ার্ড ভুলে গেছেন?':'Forgot password?'}
                </Link>
              </div>
            )}

            <button className="btn primary full" disabled={loading}>
              {loading ? (bn?'অপেক্ষা করুন…':'Please wait…') : isLogin ? (bn?'লগ ইন করুন':'Log in') : (bn?'অ্যাকাউন্ট তৈরি করুন':'Create account')}
            </button>
          </form>

          {isLogin && (error.toLowerCase().includes("verify") || error.toLowerCase().includes("verified")) && form.email && (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                className="btn primary full"
                type="button"
                onClick={() => {
                  setCheckInbox(true);
                  handleResend(form.email);
                }}
              >
                {bn ? '৬-সংখ্যার কোড দিয়ে যাচাই করুন' : 'Enter 6-Digit Verification Code'}
              </button>
              <button
                className="btn-pill-light"
                style={{ width: "100%", justifyContent: "center" }}
                type="button"
                onClick={() => handleResend(form.email)}
                disabled={resending}
              >
                {resending ? (bn ? "পাঠানো হচ্ছে…" : "Sending…") : (bn ? `পুনরায় কোড পাঠান (${form.email})` : `Resend 6-Digit Code to ${form.email}`)}
              </button>
            </div>
          )}

          <div className="divider"><span>{bn?'অথবা':'or'}</span></div>

          <a className="btn google full" href={authService.googleUrl}>
            <span aria-hidden="true">G</span> {bn?'Google দিয়ে চালিয়ে যান':'Continue with Google'}
          </a>

          <p className="auth-switch">
            {isLogin ? (bn?'TruthHubBD-তে নতুন?':'New to TruthHubBD?') : (bn?'আগেই অ্যাকাউন্ট আছে?':'Already have an account?')}{" "}
            <Link to={(isLogin?'/register':'/login')+'?next='+encodeURIComponent(nextPath)}>{isLogin ? (bn?'অ্যাকাউন্ট তৈরি করুন':'Create account') : (bn?'লগ ইন করুন':'Log in')}</Link>
          </p>
          <Link className="auth-guest-browse" to="/search?view=reviews">{bn?'লগ ইন ছাড়াই রিভিউ ও প্রকাশ্য কেস পড়ুন':'Browse reviews and public cases without signing in'} →</Link>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");
    try {
      await authService.forgotPassword(email);
      setStep("verify");
      setMsg(`We've sent a 6-digit verification code to ${email}. Check your inbox!`);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetWithCode = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.resetPassword({
        email,
        token: code.trim(),
        code: code.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword(email);
      setMsg(`Fresh 6-digit code resent to ${email}!`);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-dual">
        <div className="auth-side-banner">
          <div>
            <Logo dark />
            <div className="trust-badge-pill" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.2)", marginTop: 14 }}>
              Account recovery
            </div>
            <h2>Reset your password</h2>
            <p>
              Enter your registered email and we&apos;ll send you a 6-digit verification code to choose a new password (valid for <strong>15 minutes</strong>).
            </p>
          </div>
          <div className="auth-side-points">
            <span><Clock size={15} /> 6-digit code valid for 15 minutes</span>
            <span><Mail size={15} /> Delivered to your email inbox</span>
            <span><Lock size={15} /> Secure verification encryption</span>
          </div>
          <small style={{ color: "var(--slate-400)" }}>TruthHubBD Security</small>
        </div>

        <div className="auth-form-panel">
          <p className="logo-subtitle">PASSWORD RECOVERY</p>
          <h3>{step === "request" ? "Forgot your password?" : "Verify code & reset password"}</h3>
          <p>
            {step === "request"
              ? "We'll send a 6-digit verification code to your email."
              : `Enter the 6-digit code sent to ${email} and your new password.`}
          </p>

          {msg && <div className="success-message"><CheckCircle2 size={15} />{msg}</div>}
          {error && <div className="form-error"><AlertCircle size={15} />{error}</div>}
          {success && <div className="success-message"><CheckCircle2 size={15} /> Password reset! Redirecting to login…</div>}

          {!success && step === "request" && (
            <form onSubmit={handleRequestCode}>
              <label className="field">
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <button className="btn primary full" disabled={loading}>
                {loading ? "Sending code…" : "Send 6-digit verification code"}
              </button>
            </form>
          )}

          {!success && step === "verify" && (
            <form onSubmit={handleResetWithCode}>
              <label className="field">
                <span>6-Digit Verification Code</span>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  style={{
                    letterSpacing: "6px",
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "20px",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                  required
                />
              </label>

              <label className="field">
                <span>New password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </label>

              <label className="field">
                <span>Confirm new password</span>
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </label>

              <button className="btn primary full" disabled={loading || code.trim().length !== 6}>
                {loading ? "Verifying & resetting…" : "Verify code & reset password"}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  style={{ background: "none", border: "none", color: "#059669", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                >
                  Resend 6-digit code
                </button>
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer" }}
                >
                  Change email
                </button>
              </div>
            </form>
          )}

          <p className="auth-switch">
            Remembered it? <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tokenParam = params.get("token") ?? "";
  const codeParam = params.get("code") ?? tokenParam;
  const emailParam = params.get("email") ?? "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(codeParam);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.resetPassword({
        email,
        token: code.trim(),
        code: code.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-dual">
        <div className="auth-side-banner">
          <div>
            <Logo dark />
            <div className="trust-badge-pill" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.2)", marginTop: 14 }}>
              Set password
            </div>
            <h2>Choose a new password</h2>
            <p>Your password must be at least 8 characters with a mix of letters and numbers.</p>
          </div>
          <div className="auth-side-points">
            <span><Clock size={15} /> 15-minute code expiration</span>
            <span><Lock size={15} /> Securely hashed and salted</span>
          </div>
          <small style={{ color: "var(--slate-400)" }}>TruthHubBD Security</small>
        </div>

        <div className="auth-form-panel">
          <p className="logo-subtitle">CREATE NEW PASSWORD</p>
          <h3>Reset password</h3>

          {success && <div className="success-message"><CheckCircle2 size={15} /> Password reset! Redirecting to login…</div>}

          {error && (
            <div className="form-error" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
              {error.includes("expired") && (
                <Link className="btn-pill-light" to="/forgot-password" style={{ marginTop: 4 }}>
                  Request a fresh reset code &rarr;
                </Link>
              )}
            </div>
          )}

          {!success && (
            <form onSubmit={submit}>
              <label className="field">
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label className="field">
                <span>6-Digit Verification Code</span>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  style={{
                    letterSpacing: "6px",
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "20px",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                  required
                />
              </label>

              <label className="field">
                <span>New password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </label>

              <label className="field">
                <span>Confirm new password</span>
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </label>

              <button className="btn primary full" disabled={loading || code.trim().length !== 6}>
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </form>
          )}

          <p className="auth-switch">
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileEntry(){
  const {user}=useAuth();const location=useLocation();
  const search = new URLSearchParams(location.search);
  if(user&&['admin','moderator'].includes(user.role)&&search.get('personal')!=='1'&&search.get('tab')!=='cases')return <Navigate to={staffHome(user.role)} replace/>;
  return <ProfilePage/>;
}
function ProfilePage() {
  const { user, setUser } = useAuth();
  const { lang } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"cases" | "saved" | "activity" | "settings">(() => {
    const tab = searchParams.get("tab");
    if (tab === "cases" || tab === "scams" || tab === "scam") return "cases";
    if (tab === "saved") return "saved";
    if (tab === "activity" || tab === "ledger") return "activity";
    if (tab === "settings") return "settings";
    return "cases";
  });
  const [caseFilterStatus, setCaseFilterStatus] = useState<string>("all");
  const [selectedCase, setSelectedCase] = useState<any | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "cases" || tab === "scams" || tab === "scam") {
      setActiveTab("cases");
    } else if (tab === "saved") {
      setActiveTab("saved");
    } else if (tab === "activity") {
      setActiveTab("activity");
    } else if (tab === "settings") {
      setActiveTab("settings");
    }
  }, [searchParams]);

  const switchTab = (tab: "cases" | "saved" | "activity" | "settings") => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const [savedSubTab, setSavedSubTab] = useState<"reviews" | "alerts" | "businesses">("reviews");

  const [savedReviews, setSavedReviews] = useState<SavedReview[]>(() => bookmarkService.getSavedReviews());
  const [savedAlerts, setSavedAlerts] = useState<SavedAlert[]>(() => bookmarkService.getSavedAlerts());
  const [savedBusinesses, setSavedBusinesses] = useState<SavedBusiness[]>(() => bookmarkService.getSavedBusinesses());

  const [activityData, setActivityData] = useState<{
    reviews: { id: number; title: string; rating: number; status: string; business?: { name: string; slug: string } }[];
    cases: any[];
    claims: { id: number; status: string; business: { name: string } }[];
    saved: { id: number; name: string; slug: string }[];
  } | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  const refreshBookmarks = useCallback(() => {
    setSavedReviews(bookmarkService.getSavedReviews());
    setSavedAlerts(bookmarkService.getSavedAlerts());
    setSavedBusinesses(bookmarkService.getSavedBusinesses());
  }, []);

  useEffect(() => {
    window.addEventListener("truthhub-bookmarks-updated", refreshBookmarks);
    return () => window.removeEventListener("truthhub-bookmarks-updated", refreshBookmarks);
  }, [refreshBookmarks]);

  useEffect(() => {
    if (user) {
      setLoadingActivity(true);
      api<{ data: any }>("/activity")
        .then((res) => {
          if (res?.data) {
            setActivityData(res.data);
            // sync saved businesses with backend if returned
            if (res.data.saved && Array.isArray(res.data.saved)) {
              res.data.saved.forEach((b: any) => {
                if (!bookmarkService.isBusinessSaved(b.id)) {
                  bookmarkService.toggleBusiness({
                    id: b.id,
                    name: b.name,
                    slug: b.slug,
                    category: b.category,
                    rating: b.rating
                  });
                }
              });
              setSavedBusinesses(bookmarkService.getSavedBusinesses());
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoadingActivity(false));
    }
  }, [user]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const { user: u } = await authService.updateProfile({ name, avatar: avatar || undefined });
      setUser(u);
      setEditing(false);
      setAvatar(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
      setMessage({
        text: lang === "bn" ? "প্রোফাইল সফলভাবে আপডেট করা হয়েছে।" : "Profile updated successfully.",
        type: "success",
      });
    } catch (e: unknown) {
      setMessage({
        text: (e as Error).message || "Failed to update profile",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveReview = (id: number) => {
    bookmarkService.removeReview(id);
    setSavedReviews(bookmarkService.getSavedReviews());
  };

  const handleRemoveAlert = (identifier: number | string) => {
    bookmarkService.removeAlert(identifier);
    setSavedAlerts(bookmarkService.getSavedAlerts());
  };

  const handleRemoveBusiness = (id: number) => {
    bookmarkService.removeBusiness(id);
    setSavedBusinesses(bookmarkService.getSavedBusinesses());
  };

  if (!user) return null;

  const totalSavedCount = savedReviews.length + savedAlerts.length + savedBusinesses.length;

  return (
    <div style={{ maxWidth: "1060px", margin: "32px auto", padding: "0 20px 64px" }}>
      {/* Editorial Member Dossier Header Card */}
      <div
        className="editorial-dossier-card"
        style={{
          background: "#FFFFFF",
          padding: "28px 32px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          marginBottom: "24px",
          flexWrap: "wrap",
          borderRadius: 12,
          border: "1px solid #D8CDB7",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#F5EEDB",
            border: "1px solid #D8CDB7",
            display: "grid",
            placeItems: "center",
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "var(--ink)",
            overflow: "hidden",
            flexShrink: 0
          }}
        >
          {user.avatar_url ? (
            <img src={user.avatar_url.startsWith('http') ? user.avatar_url : (user.avatar_url.startsWith('/') ? user.avatar_url : '/' + user.avatar_url)} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            user.name.slice(0, 2).toUpperCase()
          )}
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ background: "#F5EEDB", border: "1px solid #D8CDB7", fontSize: 10, fontWeight: 700, borderRadius: "9999px", padding: "2px 8px", color: "var(--ink)" }}>
              CITIZEN CONSUMER
            </span>
            <span style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", fontSize: 10, fontWeight: 700, borderRadius: "9999px", padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ShieldCheck size={11} /> {user.email_verified_at ? 'EMAIL CONFIRMED' : 'EMAIL NOT CONFIRMED'}
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.85rem", fontWeight: 800, margin: "2px 0 4px", color: "var(--ink)" }}>
            {user.name}
          </h1>
          <p style={{ margin: 0, color: "var(--slate-500)", fontSize: 13 }}>
            {user.email} &bull; Member since {new Date(user.created_at).toLocaleDateString("en-BD", { month: "long", year: "numeric" })}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="btn-pill-light"
            style={{ padding: "8px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            onClick={() => {
              setActiveTab("settings");
              setEditing(true);
            }}
          >
            {editing && activeTab === "settings" ? "Editing Particulars" : "Edit Profile"}
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            background: message.type === "error" ? "#FFF1F2" : "#ECFDF5",
            color: message.type === "error" ? "#B91C1C" : "#065F46",
            border: `1px solid ${message.type === "error" ? "#FECDD3" : "#A7F3D0"}`,
            padding: "12px 18px",
            marginBottom: 20,
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13.5,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {message.type === "error" ? (
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div style={{ display: "flex", gap: 10, borderBottom: "1px solid var(--rule)", paddingBottom: 14, marginBottom: 24, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => switchTab("cases")}
          style={{
            padding: "8px 18px",
            borderRadius: "9999px",
            fontSize: "13.5px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "cases" ? "1.5px solid #B93628" : "1px solid #D8CDB7",
            background: activeTab === "cases" ? "#B93628" : "#FFFFFF",
            color: activeTab === "cases" ? "#FFFFFF" : "var(--ink)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: activeTab === "cases" ? "0 2px 6px rgba(185,54,40,0.25)" : "none",
            transition: "all 0.15s ease"
          }}
        >
          <ShieldAlert size={14} color={activeTab === "cases" ? "#FFFFFF" : "#B93628"} />
          <span>{lang === "bn" ? "আমার স্ক্যাম কেস ও ট্র্যাকিং" : "My Reported Cases"}</span>
          <span
            style={{
              fontSize: 11,
              background: activeTab === "cases" ? "rgba(255,255,255,0.25)" : ((activityData?.cases?.length || 0) > 0 ? "#FEE2E2" : "#F1EBDD"),
              color: activeTab === "cases" ? "#FFFFFF" : ((activityData?.cases?.length || 0) > 0 ? "#B93628" : "var(--ink)"),
              padding: "1px 7px",
              borderRadius: "9999px",
              fontWeight: 800
            }}
          >
            {activityData?.cases?.length ?? 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("saved")}
          style={{
            padding: "8px 18px",
            borderRadius: "9999px",
            fontSize: "13.5px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "saved" ? "1.5px solid var(--ink)" : "1px solid #D8CDB7",
            background: activeTab === "saved" ? "var(--ink)" : "#FFFFFF",
            color: activeTab === "saved" ? "#FFFFFF" : "var(--ink)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <Bookmark size={14} fill={activeTab === "saved" ? "#FFFFFF" : "none"} />
          <span>{lang === "bn" ? "সংরক্ষিত আইটেম" : "Saved Items"}</span>
          <span style={{ fontSize: 11, background: activeTab === "saved" ? "rgba(255,255,255,0.2)" : "#F1EBDD", padding: "1px 7px", borderRadius: "9999px" }}>
            {totalSavedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("activity")}
          style={{
            padding: "8px 18px",
            borderRadius: "9999px",
            fontSize: "13.5px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "activity" ? "1.5px solid var(--ink)" : "1px solid #D8CDB7",
            background: activeTab === "activity" ? "var(--ink)" : "#FFFFFF",
            color: activeTab === "activity" ? "#FFFFFF" : "var(--ink)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <Clock size={14} />
          <span>{lang === "bn" ? "আমার কার্যক্রম লেজার" : "My Activity Ledger"}</span>
          {activityData && (
            <span style={{ fontSize: 11, background: activeTab === "activity" ? "rgba(255,255,255,0.2)" : "#F1EBDD", padding: "1px 7px", borderRadius: "9999px" }}>
              {(activityData.reviews?.length || 0) + (activityData.cases?.length || 0)}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => switchTab("settings")}
          style={{
            padding: "8px 18px",
            borderRadius: "9999px",
            fontSize: "13.5px",
            fontWeight: 700,
            cursor: "pointer",
            border: activeTab === "settings" ? "1.5px solid var(--ink)" : "1px solid #D8CDB7",
            background: activeTab === "settings" ? "var(--ink)" : "#FFFFFF",
            color: activeTab === "settings" ? "#FFFFFF" : "var(--ink)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <User size={14} />
          <span>{lang === "bn" ? "অ্যাকাউন্ট বিবরণী" : "Account Settings"}</span>
        </button>
      </div>

      {/* TAB: MY REPORTED SCAM CASES & TRACKING */}
      {activeTab === "cases" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Header Card */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #D8CDB7",
              borderRadius: 12,
              padding: "24px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
            }}
          >
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA", fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <ShieldAlert size={12} color="#991B1B" />
                  {lang === "bn" ? "নাগরিক প্রতারণা ট্র্যাকিং লেজার" : "CITIZEN CASE TRACKING LEDGER"}
                </span>
                <span style={{ fontSize: 11, color: "var(--slate-500)", fontWeight: 600 }}>
                  {lang === "bn" ? "গোপনীয় ও সুরক্ষিত প্রমাণ" : "Confidential & Staff Protected"}
                </span>
              </div>
              <h2 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 6px", color: "var(--ink)" }}>
                {lang === "bn" ? "আমার স্ক্যাম ও প্রতারণা অভিযোগসমূহ" : "My Reported Scam Cases & Tracking"}
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--slate-600)", lineHeight: 1.5, maxWidth: 640 }}>
                {lang === "bn"
                  ? "আপনার জমা দেওয়া সমস্ত প্রতারণা সংক্রান্ত কেসের রিয়েল-টাইম অগ্রগতি, স্টাফ যাচাইকরণ অবস্থা এবং সমাধান ট্র্যাক করুন। প্রতিটি কেসের বিস্তারিত দেখতে 'কেস ট্র্যাকার ও সম্পূর্ণ ডসিয়ার' এ ক্লিক করুন।"
                  : "Track real-time review stages, forensic notes, merchant updates, and resolution status for all scam cases you have submitted. Click on any case to open its comprehensive dossier."}
              </p>
            </div>

            <Link
              to="/scam-alerts/submit"
              className="btn-teal-pill"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                textDecoration: "none",
                fontSize: 13.5,
                fontWeight: 700,
                whiteSpace: "nowrap",
                background: "#B93628",
                borderColor: "#991B1B",
                color: "#FFFFFF"
              }}
            >
              <Plus size={16} />
              <span>{lang === "bn" ? "নতুন প্রতারণা রিপোর্ট করুন" : "+ Report New Scam"}</span>
            </Link>
          </div>

          {/* Metrics KPIs Bar */}
          {(() => {
            const allCases = activityData?.cases || [];
            const underReview = allCases.filter(c => ["submitted", "under_review"].includes(c.status)).length;
            const published = allCases.filter(c => ["published", "disputed"].includes(c.status)).length;
            const resolved = allCases.filter(c => c.status === "resolved").length;

            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <div style={{ background: "#FFFFFF", border: "1px solid #D8CDB7", borderRadius: 10, padding: "16px 20px", borderLeft: "4px solid #1E293B" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--slate-500)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                    {lang === "bn" ? "মোট জমা দেওয়া কেস" : "Total Filed Cases"}
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>
                    {allCases.length}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--slate-400)", marginTop: 6 }}>
                    {lang === "bn" ? "আপনার অ্যাকাউন্ট থেকে নিবন্ধিত" : "Registered under your account"}
                  </div>
                </div>

                <div style={{ background: "#FFFFFF", border: "1px solid #D8CDB7", borderRadius: 10, padding: "16px 20px", borderLeft: "4px solid #D97706" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                    {lang === "bn" ? "যাচাই ও পর্যালোচনায়" : "Under Review"}
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#B45309", lineHeight: 1 }}>
                    {underReview}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--slate-400)", marginTop: 6 }}>
                    {lang === "bn" ? "স্টাফ টিম কর্তৃক প্রমাণ পর্যালোচনাধীন" : "Staff forensic verification active"}
                  </div>
                </div>

                <div style={{ background: "#FFFFFF", border: "1px solid #D8CDB7", borderRadius: 10, padding: "16px 20px", borderLeft: "4px solid #B93628" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#B93628", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                    {lang === "bn" ? "সক্রিয় পাবলিক অ্যালার্ট" : "Active Public Alerts"}
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#B93628", lineHeight: 1 }}>
                    {published}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--slate-400)", marginTop: 6 }}>
                    {lang === "bn" ? "নাগরিক সচেতনতায় লাইভ অ্যালার্ট" : "Public consumer warnings live"}
                  </div>
                </div>

                <div style={{ background: "#FFFFFF", border: "1px solid #D8CDB7", borderRadius: 10, padding: "16px 20px", borderLeft: "4px solid #059669" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                    {lang === "bn" ? "সমাধানকৃত বা নিষ্পত্তি" : "Resolved / Settled"}
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#059669", lineHeight: 1 }}>
                    {resolved}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--slate-400)", marginTop: 6 }}>
                    {lang === "bn" ? "রিফান্ড বা আনুষ্ঠানিক মীমাংসা" : "Closed with resolution record"}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--slate-600)", marginRight: 4 }}>
              {lang === "bn" ? "ফিল্টার করুন:" : "Filter:"}
            </span>
            {[
              { id: "all", labelEn: "All Cases", labelBn: "সব কেস" },
              { id: "under_review", labelEn: "Under Review", labelBn: "যাচাই প্রক্রিয়াধীন" },
              { id: "published", labelEn: "Active Alerts", labelBn: "সক্রিয় অ্যালার্ট" },
              { id: "resolved", labelEn: "Resolved", labelBn: "সমাধানকৃত" },
            ].map(f => {
              const count = (() => {
                const list = activityData?.cases || [];
                if (f.id === "all") return list.length;
                if (f.id === "under_review") return list.filter(c => ["submitted", "under_review"].includes(c.status)).length;
                if (f.id === "published") return list.filter(c => ["published", "disputed"].includes(c.status)).length;
                if (f.id === "resolved") return list.filter(c => c.status === "resolved").length;
                return 0;
              })();

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCaseFilterStatus(f.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "9999px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: caseFilterStatus === f.id ? "1.5px solid var(--ink)" : "1px solid #D8CDB7",
                    background: caseFilterStatus === f.id ? "var(--ink)" : "#FFFFFF",
                    color: caseFilterStatus === f.id ? "#FFFFFF" : "var(--ink)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>{lang === "bn" ? f.labelBn : f.labelEn}</span>
                  <span style={{ fontSize: 11, background: caseFilterStatus === f.id ? "rgba(255,255,255,0.2)" : "#F1EBDD", padding: "1px 6px", borderRadius: "9999px" }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cases List */}
          {loadingActivity ? (
            <div style={{ background: "#FFFFFF", padding: 48, textAlign: "center", borderRadius: 12, border: "1px solid #D8CDB7" }}>
              <div className="loading-spinner-teal" style={{ margin: "0 auto 12px" }} />
              <span style={{ fontSize: 13, color: "var(--slate-500)" }}>
                {lang === "bn" ? "কেস তালিকা লোড হচ্ছে…" : "Loading your reported cases…"}
              </span>
            </div>
          ) : (() => {
            const allCases = activityData?.cases || [];
            const filteredCases = allCases.filter(c => {
              if (caseFilterStatus === "under_review") return ["submitted", "under_review"].includes(c.status);
              if (caseFilterStatus === "published") return ["published", "disputed"].includes(c.status);
              if (caseFilterStatus === "resolved") return c.status === "resolved";
              return true;
            });

            if (allCases.length === 0) {
              return (
                <div style={{ background: "#FFFFFF", padding: "56px 24px", textAlign: "center", borderRadius: 12, border: "1px solid #D8CDB7" }}>
                  <ShieldAlert size={40} color="#B93628" style={{ margin: "0 auto 14px" }} />
                  <h3 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>
                    {lang === "bn" ? "কোন প্রতারণা কেস জমা দেওয়া হয়নি" : "No reported scam cases under your account"}
                  </h3>
                  <p style={{ color: "var(--slate-600)", fontSize: 13.5, maxWidth: 520, margin: "0 auto 20px", lineHeight: 1.6 }}>
                    {lang === "bn"
                      ? "অনলাইন প্রতারণা, ভুয়া মার্চেন্ট, আর্থিক লেনদেন বিষয়ক জালিয়াতি বা ডেলিভারি না পাওয়ার ঘটনা ঘটলে আপনি ব্যক্তিগতভাবে রিপোর্ট করতে পারেন। আমাদের মডারেশন টিম প্রমাণ যাচাই করে প্রয়োজনীয় ব্যবস্থা গ্রহণ করে।"
                      : "If you have experienced fake merchant deliveries, advance payment fraud, impersonation, or deceptive business practices, submit a private report. Our staff verifies evidence before issuing alerts."}
                  </p>
                  <Link
                    to="/scam-alerts/submit"
                    className="btn-teal-pill"
                    style={{
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 22px",
                      background: "#B93628",
                      borderColor: "#991B1B",
                      color: "#FFFFFF",
                      fontWeight: 700
                    }}
                  >
                    <Plus size={16} />
                    <span>{lang === "bn" ? "নতুন প্রতারণা অভিযোগ জমা দিন" : "Submit a Scam Alert Report"}</span>
                  </Link>
                </div>
              );
            }

            if (filteredCases.length === 0) {
              return (
                <div style={{ background: "#FFFFFF", padding: "36px 20px", textAlign: "center", borderRadius: 12, border: "1px solid #D8CDB7" }}>
                  <p style={{ margin: 0, color: "var(--slate-500)", fontSize: 13.5 }}>
                    {lang === "bn" ? "নির্বাচিত ফিল্টারের আওতায় কোন কেস পাওয়া যায়নি।" : "No cases match the selected filter."}
                  </p>
                </div>
              );
            }

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filteredCases.map(c => (
                  <CaseTrackingCard
                    key={c.id}
                    item={c}
                    lang={lang}
                    onOpenDossier={(item) => setSelectedCase(item)}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 1: SAVED ITEMS (REVIEWS, SCAM ALERTS, BUSINESSES) */}
      {activeTab === "saved" && (
        <div>
          {/* Sub-tab Pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setSavedSubTab("reviews")}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                border: "1px solid #D8CDB7",
                background: savedSubTab === "reviews" ? "#FFFDF7" : "#FFFFFF",
                color: savedSubTab === "reviews" ? "var(--vermilion)" : "var(--ink)",
                boxShadow: savedSubTab === "reviews" ? "0 1px 3px rgba(0,0,0,0.06)" : "none"
              }}
            >
              {lang === "bn" ? "সংরক্ষিত রিভিউ" : "Saved Reviews"} ({savedReviews.length})
            </button>

            <button
              type="button"
              onClick={() => setSavedSubTab("alerts")}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                border: "1px solid #D8CDB7",
                background: savedSubTab === "alerts" ? "#FFFDF7" : "#FFFFFF",
                color: savedSubTab === "alerts" ? "var(--vermilion)" : "var(--ink)",
                boxShadow: savedSubTab === "alerts" ? "0 1px 3px rgba(0,0,0,0.06)" : "none"
              }}
            >
              {lang === "bn" ? "সংরক্ষিত সতর্কতা ডসিয়ার" : "Saved Scam Alerts"} ({savedAlerts.length})
            </button>

            <button
              type="button"
              onClick={() => setSavedSubTab("businesses")}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                border: "1px solid #D8CDB7",
                background: savedSubTab === "businesses" ? "#FFFDF7" : "#FFFFFF",
                color: savedSubTab === "businesses" ? "var(--vermilion)" : "var(--ink)",
                boxShadow: savedSubTab === "businesses" ? "0 1px 3px rgba(0,0,0,0.06)" : "none"
              }}
            >
              {lang === "bn" ? "সংরক্ষিত প্রতিষ্ঠান" : "Saved Places"} ({savedBusinesses.length})
            </button>
          </div>

          {/* Sub-tab: Saved Reviews */}
          {savedSubTab === "reviews" && (
            <div>
              {savedReviews.length === 0 ? (
                <div style={{ background: "#FFFFFF", padding: "48px 24px", textAlign: "center", borderRadius: 12, border: "1px solid #D8CDB7" }}>
                  <Bookmark size={32} color="#94A3B8" style={{ margin: "0 auto 12px" }} />
                  <h3 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.2rem", fontWeight: 700, color: "var(--ink)", margin: "0 0 6px" }}>
                    {lang === "bn" ? "কোন সংরক্ষিত রিভিউ পাওয়া যায়নি" : "No saved reviews yet"}
                  </h3>
                  <p style={{ color: "var(--slate-500)", fontSize: 13.5, maxWidth: 440, margin: "0 auto 18px", lineHeight: 1.5 }}>
                    {lang === "bn"
                      ? "যেকোনো রিভিউ কার্ড বা বিস্তারিত পাতায় গিয়ে 'Save Review' বাটনে ক্লিক করলে তা এখানে সরাসরি জমা থাকবে।"
                      : "Click 'Save Review' on any verified review to bookmark and reference it anytime."}
                  </p>
                  <Link to="/search" className="btn-teal-pill" style={{ textDecoration: "none" }}>
                    {lang === "bn" ? "ডিরেক্টরি রিভিউ এক্সপ্লোর করুন" : "Explore Reviews in Directory"}
                  </Link>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%,320px), 1fr))", gap: 16 }}>
                  {savedReviews.map((r) => (
                    <div
                      key={r.id}
                      className="editorial-dossier-card"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #D8CDB7",
                        borderRadius: 10,
                        padding: 18,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={12} fill={s <= r.rating ? "#f59e0b" : "#e2e8f0"} color={s <= r.rating ? "#f59e0b" : "#cbd5e1"} />
                            ))}
                            <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 4 }}>{r.rating}.0</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveReview(r.id)}
                            style={{ border: 0, background: "none", cursor: "pointer", color: "#94A3B8", fontSize: 11, fontWeight: 600 }}
                            title="Remove bookmark"
                          >
                            Remove &times;
                          </button>
                        </div>

                        <h4 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.05rem", fontWeight: 700, margin: "0 0 6px", color: "var(--ink)" }}>
                          &ldquo;{r.title}&rdquo;
                        </h4>

                        <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "var(--slate-500)" }}>
                          Entity: <strong style={{ color: "var(--ink)" }}>{r.businessName}</strong> &bull; By {r.author}
                        </p>

                        <p style={{ margin: 0, fontSize: 13, color: "var(--slate-700)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {r.body}
                        </p>
                      </div>

                      <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--slate-400)" }}>
                          Saved {new Date(r.savedAt).toLocaleDateString("en-BD", { month: "short", day: "numeric" })}
                        </span>
                        <Link to={`/reviews/${r.id}`} style={{ fontSize: 12.5, fontWeight: 700, color: "var(--vermilion)", textDecoration: "none" }}>
                          View Review &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab: Saved Scam Alerts */}
          {savedSubTab === "alerts" && (
            <div>
              {savedAlerts.length === 0 ? (
                <div style={{ background: "#FFFFFF", padding: "48px 24px", textAlign: "center", borderRadius: 12, border: "1px solid #D8CDB7" }}>
                  <AlertTriangle size={32} color="#94A3B8" style={{ margin: "0 auto 12px" }} />
                  <h3 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.2rem", fontWeight: 700, color: "var(--ink)", margin: "0 0 6px" }}>
                    {lang === "bn" ? "কোন সংরক্ষিত সতর্কতা নেই" : "No saved scam alerts"}
                  </h3>
                  <p style={{ color: "var(--slate-500)", fontSize: 13.5, maxWidth: 440, margin: "0 auto 18px", lineHeight: 1.5 }}>
                    {lang === "bn"
                      ? "পাবলিক প্রতারণা সতর্কতা পাতায় গিয়ে যেকোনো কেস ডসিয়ার সংরক্ষণ করে তদন্ত ও ফলো-আপ আপডেট ট্র্যাক করতে পারেন।"
                      : "Bookmark public scam alert dossiers to track forensic updates, merchant notices, and resolution statuses."}
                  </p>
                  <Link to="/scam-alerts" className="btn-teal-pill" style={{ textDecoration: "none" }}>
                    {lang === "bn" ? "পাবলিক সতর্কতা দেখুন" : "Browse Public Scam Alerts"}
                  </Link>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%,320px), 1fr))", gap: 16 }}>
                  {savedAlerts.map((a) => (
                    <div
                      key={a.id || a.slug}
                      className="editorial-dossier-card"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #D8CDB7",
                        borderRadius: 10,
                        padding: 18,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ background: "#F5EEDB", border: "1px solid #D8CDB7", borderRadius: "9999px", fontSize: 10, fontWeight: 700, padding: "2px 7px" }}>
                              {a.caseCode}
                            </span>
                            <ScamStatus status={a.status} />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAlert(a.id || a.slug)}
                            style={{ border: 0, background: "none", cursor: "pointer", color: "#94A3B8", fontSize: 11, fontWeight: 600 }}
                            title="Remove bookmark"
                          >
                            Remove &times;
                          </button>
                        </div>

                        <h4 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.05rem", fontWeight: 700, margin: "0 0 6px", color: "var(--ink)" }}>
                          {a.title}
                        </h4>

                        <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "var(--slate-500)" }}>
                          Reported entity: <strong style={{ color: "var(--ink)" }}>{a.entity}</strong> &bull; Category: {a.category}
                        </p>

                        {a.amount && (
                          <div style={{ fontSize: 12.5, color: "var(--vermilion)", fontWeight: 700, margin: "4px 0" }}>
                            Reported loss: {a.amount}
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--slate-400)" }}>
                          Saved {new Date(a.savedAt).toLocaleDateString("en-BD", { month: "short", day: "numeric" })}
                        </span>
                        <Link to={`/scam-alerts/${a.slug || a.caseCode}`} style={{ fontSize: 12.5, fontWeight: 700, color: "var(--vermilion)", textDecoration: "none" }}>
                          Open Case Dossier &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab: Saved Places */}
          {savedSubTab === "businesses" && (
            <div>
              {savedBusinesses.length === 0 ? (
                <div style={{ background: "#FFFFFF", padding: "48px 24px", textAlign: "center", borderRadius: 12, border: "1px solid #D8CDB7" }}>
                  <Building2 size={32} color="#94A3B8" style={{ margin: "0 auto 12px" }} />
                  <h3 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.2rem", fontWeight: 700, color: "var(--ink)", margin: "0 0 6px" }}>
                    {lang === "bn" ? "কোন সংরক্ষিত প্রতিষ্ঠান নেই" : "No saved places yet"}
                  </h3>
                  <p style={{ color: "var(--slate-500)", fontSize: 13.5, maxWidth: 440, margin: "0 auto 18px", lineHeight: 1.5 }}>
                    Save verified businesses, hospitals, universities, or services to easily navigate back to their profile pages.
                  </p>
                  <Link to="/search" className="btn-teal-pill" style={{ textDecoration: "none" }}>
                    {lang === "bn" ? "ডিরেক্টরি ব্রাউজ করুন" : "Browse Directory"}
                  </Link>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%,300px), 1fr))", gap: 16 }}>
                  {savedBusinesses.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #D8CDB7",
                        borderRadius: 10,
                        padding: 18,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <h4 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
                            {b.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveBusiness(b.id)}
                            style={{ border: 0, background: "none", cursor: "pointer", color: "#94A3B8", fontSize: 11, fontWeight: 600 }}
                          >
                            Remove &times;
                          </button>
                        </div>
                        {b.category && <span style={{ fontSize: 11.5, color: "var(--slate-500)" }}>{b.category}</span>}
                      </div>
                      <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--rule)" }}>
                        <Link to={`/business/${b.slug}`} style={{ fontSize: 12.5, fontWeight: 700, color: "var(--vermilion)", textDecoration: "none" }}>
                          View Entity Profile &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ACTIVITY LEDGER */}
      {activeTab === "activity" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {loadingActivity ? (
            <div style={{ background: "#FFFFFF", padding: 36, textAlign: "center", borderRadius: 12, border: "1px solid #D8CDB7" }}>
              <div className="loading-spinner-teal" style={{ margin: "0 auto 12px" }} />
              <span style={{ fontSize: 13, color: "var(--slate-500)" }}>Loading citizen activity ledger…</span>
            </div>
          ) : (
            <>
              {/* My Submitted Reviews */}
              <div style={{ background: "#FFFFFF", padding: 24, borderRadius: 12, border: "1px solid #D8CDB7" }}>
                <h3 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.2rem", fontWeight: 800, margin: "0 0 16px", borderBottom: "1px solid var(--rule)", paddingBottom: 10, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageSquare size={18} color="var(--vermilion)" />
                  {lang === "bn" ? "আমার রিভিউসমূহ" : "My Reviews"}
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--slate-500)", marginLeft: "auto" }}>
                    {activityData?.reviews?.length || 0} submitted
                  </span>
                </h3>

                {activityData?.reviews?.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {activityData.reviews.map((r) => (
                      <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, padding: "10px 14px", background: "#FDFBF7", border: "1px solid #EAE0CE", borderRadius: 8 }}>
                        <div>
                          <Link to={`/reviews/${r.id}`} style={{ fontWeight: 700, color: "var(--ink)", textDecoration: "none", fontSize: 14 }}>
                            &ldquo;{r.title}&rdquo;
                          </Link>
                          <div style={{ fontSize: 12, color: "var(--slate-500)", marginTop: 2 }}>
                            {r.business?.name && <span>{r.business.name} &bull; </span>}
                            <span>Rating: {r.rating}/5</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ background: r.status === "published" ? "#ecfdf5" : "#FFF1F2", color: r.status === "published" ? "#065f46" : "#B93628", fontSize: 10.5, fontWeight: 700, borderRadius: "9999px", padding: "2px 8px" }}>
                            {r.status === "published" ? "LIVE" : (r.status?.toUpperCase() || "PENDING")}
                          </span>
                          <Link to={`/reviews/${r.id}`} style={{ fontSize: 12, fontWeight: 700, color: "var(--vermilion)", textDecoration: "none" }}>
                            View &rarr;
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13.5, color: "var(--slate-500)" }}>
                    You haven’t submitted any reviews yet. Share an experience about a hospital, university, product, or shop.
                  </p>
                )}
              </div>

              {/* My Scam Case Submissions */}
              <div style={{ background: "#FFFFFF", padding: 24, borderRadius: 12, border: "1px solid #D8CDB7" }}>
                <h3 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.2rem", fontWeight: 800, margin: "0 0 16px", borderBottom: "1px solid var(--rule)", paddingBottom: 10, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldAlert size={18} color="#B93628" />
                  {lang === "bn" ? "আমার রিপোর্টকৃত প্রতারণা কেস" : "My Reported Scam Cases"}
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--slate-500)", marginLeft: "auto" }}>
                    {activityData?.cases?.length || 0} reported
                  </span>
                </h3>

                {activityData?.cases?.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {activityData.cases.map((c) => (
                      <CaseTrackingCard
                        key={c.id}
                        item={c}
                        lang={lang}
                        onOpenDossier={(item) => setSelectedCase(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13.5, color: "var(--slate-500)" }}>
                    No reported scam or fraud cases under your account.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: ACCOUNT PARTICULAR SETTINGS */}
      {activeTab === "settings" && (
        <div style={{ background: "#FFFFFF", padding: "28px", borderRadius: 12, border: "1px solid #D8CDB7" }}>
          <h3 style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: "1.2rem", fontWeight: 800, margin: "0 0 16px", borderBottom: "1px solid var(--rule)", paddingBottom: 10, color: "var(--ink)" }}>
            {lang === "bn" ? "অ্যাকাউন্ট বিবরণ ও সেটিংস" : "Account Particulars & Settings"}
          </h3>

          {editing ? (
            <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12.5, fontWeight: 700, color: "var(--slate-700)" }}>
                  Full Legal / Display Name
                </label>
                <input className="editorial-filter-input" style={{ width: "100%", borderRadius: 6 }} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12.5, fontWeight: 700, color: "var(--slate-700)" }}>
                  {lang === "bn" ? "প্রোফাইল ছবি (ঐচ্ছিক)" : "Profile Avatar (Optional)"}
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "#F5EEDB",
                      border: "1px solid #D8CDB7",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : user.avatar_url ? (
                      <img
                        src={user.avatar_url.startsWith("http") ? user.avatar_url : (user.avatar_url.startsWith('/') ? user.avatar_url : '/' + user.avatar_url)}
                        alt="Current avatar"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setAvatar(f);
                        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                        setAvatarPreview(f ? URL.createObjectURL(f) : null);
                      }}
                      style={{ padding: "6px", width: "100%", fontSize: 13 }}
                    />
                    {avatar && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>{avatar.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAvatar(null);
                            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                            setAvatarPreview(null);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#DC2626",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            textDecoration: "underline",
                            padding: 0,
                          }}
                        >
                          {lang === "bn" ? "ছবি বাতিল করুন" : "Remove"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="submit" className="btn-teal-pill" style={{ cursor: "pointer" }} disabled={saving}>
                  {saving ? (lang === "bn" ? "সংরক্ষণ করা হচ্ছে..." : "Saving...") : (lang === "bn" ? "সংরক্ষণ করুন" : "Save Changes")}
                </button>
                <button
                  type="button"
                  className="btn-pill-light"
                  onClick={() => {
                    setEditing(false);
                    setAvatar(null);
                    if (avatarPreview) {
                      URL.revokeObjectURL(avatarPreview);
                      setAvatarPreview(null);
                    }
                  }}
                >
                  {lang === "bn" ? "বাতিল" : "Cancel"}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: 520 }}>
              <div style={{ background: "#FDFBF7", border: "1px solid #EAE0CE", borderRadius: 8, padding: "12px 16px" }}>
                <span style={{ fontSize: 11, color: "var(--slate-400)", fontWeight: 700, display: "block" }}>FULL NAME</span>
                <strong style={{ fontSize: 15, color: "var(--ink)" }}>{user.name}</strong>
              </div>
              <div style={{ background: "#FDFBF7", border: "1px solid #EAE0CE", borderRadius: 8, padding: "12px 16px" }}>
                <span style={{ fontSize: 11, color: "var(--slate-400)", fontWeight: 700, display: "block" }}>AUTHENTICATED EMAIL</span>
                <strong style={{ fontSize: 14, color: "var(--ink)" }}>{user.email}</strong>
              </div>
              <button
                type="button"
                className="btn-pill-light"
                style={{ alignSelf: "flex-start", marginTop: 8 }}
                onClick={() => setEditing(true)}
              >
                Edit Particulars
              </button>

              {/* Security & Password Management */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--rule)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Lock size={16} color="var(--teal-primary)" />
                  <strong style={{ fontSize: 14, color: "var(--ink)" }}>
                    {lang === "bn" ? "নিরাপত্তা ও পাসওয়ার্ড ব্যবস্থাপনা" : "Security & Password Management"}
                  </strong>
                </div>
                <p style={{ fontSize: 13, color: "var(--slate-500)", margin: "0 0 14px", lineHeight: 1.5, maxWidth: 520 }}>
                  {lang === "bn"
                    ? "অ্যাকাউন্টের সর্বোচ্চ নিরাপত্তা নিশ্চিত করতে প্রোফাইল থেকে সরাসরি পাসওয়ার্ড পরিবর্তন বন্ধ রাখা হয়েছে। পাসওয়ার্ড পরিবর্তনের জন্য নিবন্ধিত ইমেইলে যাচাইকরণ কোড/লিংক ব্যবহার করুন।"
                    : "For enhanced account integrity and security, direct in-profile password changes are disabled. To update your password, use the verified email reset flow."}
                </p>
                <Link
                  to="/forgot-password"
                  className="btn-pill-light"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12.5 }}
                >
                  <Lock size={14} />
                  {lang === "bn" ? "ভেরিফিকেশন কোডের মাধ্যমে পাসওয়ার্ড রিসেট করুন" : "Reset Password via Email Verification"}
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Case Dossier Modal */}
      {selectedCase && (
        <CaseDossierModal
          item={selectedCase}
          onClose={() => setSelectedCase(null)}
          lang={lang}
        />
      )}
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking)
    return (
      <div style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: "var(--slate-500)" }}>Checking your session…</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

function EntityNotFound({ type }: { type: string }) {
  return (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", textAlign: "center", padding: "40px" }}>
      <div>
        <AlertCircle size={48} color="#dc2626" style={{ margin: "0 auto 16px" }} />
        <h1>{type === "case" ? "Case" : "Business"} not found</h1>
        <p style={{ color: "var(--slate-500)", marginBottom: 20 }}>The item you are looking for does not exist or may have been updated.</p>
        <Link to={type === "case" ? "/scam-alerts" : "/search"} className="btn-teal-pill">
          Browse {type === "case" ? "Scam Alerts" : "Discover"}
        </Link>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", textAlign: "center", padding: "40px" }}>
      <div>
        <span style={{ fontSize: "6rem", fontWeight: 900, color: "var(--slate-300)", lineHeight: 1 }}>404</span>
        <h1>Page not found</h1>
        <p style={{ color: "var(--slate-500)", marginBottom: 20 }}>Let&apos;s get you back to trustworthy ground.</p>
        <Link to="/" className="btn-teal-pill">
          Return home &rarr;
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
   FOOTER
============================================================ */
export default function TruthHubApp() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  );
}















