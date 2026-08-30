"use client";
import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  Globe,
  GraduationCap,
  Hospital,
  Laptop,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  Stethoscope,
  ThumbsUp,
  ThumbsDown,
  Truck,
  User,
  UserCheck,
  X
} from "lucide-react";
import { AuthProvider, useAuth } from "../src/features/auth/AuthContext";
import { authService } from "../src/services/authService";
import { businessService } from "../src/services/businessService";
import { businesses } from "../src/data/mock/businesses";
import { scamAlerts } from "../src/data/mock/scamAlerts";
import type { Business, PendingBusiness, ScamAlert } from "../src/types";
import { AddBusinessModal, BusinessCard, CategoryDropdown, ComingSoonModal, EditBusinessModal, Logo, WriteReviewModal } from "../src/components/UI";

const categories = [
  { name: "Products", icon: Laptop },
  { name: "Businesses & Services", icon: Building2 },
  { name: "Doctors & Professionals", icon: Stethoscope },
  { name: "Hospitals & Clinics", icon: Hospital },
  { name: "Universities & Education", icon: GraduationCap },
  { name: "Courier & Digital Services", icon: Truck },
];

/* ============================================================
   LAYOUT WITH CLEAN HEADER & FOOTER
============================================================ */
function Layout() {
  const { user, checking, logout } = useAuth();
  const [accountMenu, setAccountMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [soonModal, setSoonModal] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [addBusinessModalOpen, setAddBusinessModalOpen] = useState(false);
  const [reviewBusiness, setReviewBusiness] = useState<Business | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setAccountMenu(false);
    setShowNotifications(false);
    setReviewModalOpen(false);
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
    try {
      await logout();
    } catch {
      // Ignored
    }
    navigate("/");
  };

  const openReviewModal = (b?: Business | null) => {
    setReviewBusiness(b || null);
    setReviewModalOpen(true);
  };

  const toggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotifications((v) => {
      if (!v) setAccountMenu(false);
      return !v;
    });
  };

  const toggleAccountMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAccountMenu((v) => {
      if (!v) setShowNotifications(false);
      return !v;
    });
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <Logo />

          <nav className="header-nav">
            <Link to="/search" className="nav-link">
              Discover
            </Link>

            <Link to="/scam-alerts" className="nav-link" style={{ color: "#e11d48" }}>
              <AlertTriangle size={15} />
              Scam Alerts
            </Link>

            <button className="btn-teal-pill" onClick={() => openReviewModal()}>
              <Plus size={15} />
              Write Review
            </button>

            <button className="btn-pill-light" onClick={() => setSoonModal("Language Selection")}>
              🌐 বাংলা
            </button>

            {/* Notification Bell */}
            <button
              className="header-icon-btn"
              onClick={toggleNotifications}
              aria-label="View notifications"
            >
              <Bell size={17} />
              <span className="notif-dot" />
            </button>

            {/* User Account / Auth */}
            {checking ? (
              <span style={{ width: 38, height: 38, borderRadius: "50%", background: "#e2e8f0" }} />
            ) : user ? (
              <div style={{ position: "relative" }}>
                <button
                  className="user-avatar-circle"
                  onClick={toggleAccountMenu}
                  aria-label="User profile menu"
                >
                  {user.avatar_url ? (
                    <img src={"http://localhost:8001" + user.avatar_url} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    user.name.slice(0, 2).toUpperCase()
                  )}
                </button>

                {accountMenu && (
                  <div className="user-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                    <Link to="/profile" onClick={() => setAccountMenu(false)}>
                      <User size={15} />
                      My Profile ({user.name.split(" ")[0]})
                    </Link>
                    <button onClick={() => { setAccountMenu(false); setSoonModal("My Community Reviews"); }}>
                      <MessageSquare size={15} />
                      My Reviews
                    </button>
                    <button onClick={handleLogout} style={{ color: "#dc2626" }}>
                      <LogOut size={15} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <Link to="/login" className="btn-pill-light">
                  Log in
                </Link>
                <Link to="/register" className="btn-teal-pill">
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Notifications Popover */}
      {showNotifications && (
        <div className="notifications-popover" onClick={(e) => e.stopPropagation()}>
          <div className="notif-header">
            <div className="notif-header-icon">
              <Bell size={22} />
            </div>
            <div className="notif-header-text">
              <h3>Notifications</h3>
              <p>System, moderation &amp; business response alerts</p>
            </div>
          </div>

          <div className="notif-list">
            <div className="notif-card">
              <div className="notif-card-icon notif-icon-red">
                <AlertTriangle size={15} />
              </div>
              <div className="notif-card-body">
                <div className="notif-card-top">
                  <span className="notif-card-title">Case Update</span>
                  <span className="notif-card-time">2 hours ago</span>
                </div>
                <p className="notif-card-desc">
                  Case THB-2026-01842 regarding QuickTech Gadget Shop BD has been updated.
                </p>
              </div>
            </div>

            <div className="notif-card">
              <div className="notif-card-icon notif-icon-green">
                <CheckCircle2 size={15} />
              </div>
              <div className="notif-card-body">
                <div className="notif-card-top">
                  <span className="notif-card-title">Official Response</span>
                  <span className="notif-card-time">1 day ago</span>
                </div>
                <p className="notif-card-desc">
                  Star Tech &amp; Engineering posted an official response to your review.
                </p>
              </div>
            </div>

            <div className="notif-card">
              <div className="notif-card-icon notif-icon-green">
                <ShieldCheck size={15} />
              </div>
              <div className="notif-card-body">
                <div className="notif-card-top">
                  <span className="notif-card-title">Listing Approved</span>
                  <span className="notif-card-time">3 days ago</span>
                </div>
                <p className="notif-card-desc">
                  Your suggested business profile for &ldquo;Dhaka Diagnostic Center&rdquo; is now published.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<HomePage openSoon={setSoonModal} openReview={openReviewModal} />} />
          <Route path="/search" element={<DiscoverPage openSoon={setSoonModal} onOpenAddBusiness={() => setAddBusinessModalOpen(true)} />} />
          <Route path="/business/:slug" element={<BusinessDetailPage openSoon={setSoonModal} openReview={openReviewModal} />} />
          <Route path="/scam-alerts" element={<ScamAlertsIndexPage openSoon={setSoonModal} />} />
          <Route path="/scam-alerts/:slug" element={<ScamDetailPage openSoon={setSoonModal} />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin" element={<AdminProtected><AdminPage /></AdminProtected>} />
          <Route
            path="/profile"
            element={
              <Protected>
                <ProfilePage />
              </Protected>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer openSoon={setSoonModal} />

      <WriteReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        initialBusiness={reviewBusiness}
        onShowSoon={(feat) => setSoonModal(feat)}
        onOpenAddBusiness={() => setAddBusinessModalOpen(true)}
      />

      <AddBusinessModal
        open={addBusinessModalOpen}
        onClose={() => setAddBusinessModalOpen(false)}
        onBusinessAdded={(newB) => navigate(`/business/${newB.slug}`)}
      />

      <ComingSoonModal
        open={!!soonModal}
        feature={soonModal ?? "Feature"}
        onClose={useCallback(() => setSoonModal(null), [])}
      />
    </div>
  );
}

/* ============================================================
   HOMEPAGE
============================================================ */
function HomePage({
  openSoon,
  openReview,
}: {
  openSoon: (s: string) => void;
  openReview: (b?: Business | null) => void;
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadRecent() {
      setLoadingReviews(true);
      const data = await businessService.getRecentReviews();
      if (isMounted) {
        setRecentReviews(data);
        setLoadingReviews(false);
      }
    }
    loadRecent();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/search");
    }
  };

  return (
    <div>
      {/* Top Rounded Hero Box */}
      <div className="hero-wrapper">
        <div className="hero-box">
          <div className="trust-badge-pill">
            <ShieldCheck size={16} />
            Independent Community Reviews &amp; Directory in Bangladesh
          </div>

          <h1 className="hero-main-title">Search before you choose.</h1>

          <p className="hero-main-subtitle">
            Real community reviews for products, businesses, doctors, hospitals, universities, and services across Bangladesh.
          </p>

          {/* Hero Search Box */}
          <form className="hero-search-container" onSubmit={handleSearch}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Search a product, business, doctor, hospital or university..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="hero-search-btn">
              Search &rarr;
            </button>
          </form>

          {/* 6 Category Filter Pills */}
          <div className="category-pills-row">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  className="cat-filter-pill"
                  onClick={() => navigate(`/search?category=${encodeURIComponent(cat.name)}`)}
                >
                  <Icon size={15} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Split Section */}
      <div className="section-container">
        <div className="home-split-grid">
          {/* Left Column: Recent Community Reviews */}
          <div>
            <div className="split-section-header">
              <h2 className="split-section-title">
                <MessageSquare size={18} />
                Recent Community Reviews
              </h2>
              <button
                className="split-section-link"
                style={{ border: 0, background: "transparent", cursor: "pointer" }}
                onClick={() => openReview()}
              >
                + Write Review
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {loadingReviews ? (
                <div style={{ textAlign: "center", padding: "30px", color: "var(--slate-500)" }}>
                  Loading real database reviews...
                </div>
              ) : recentReviews.length > 0 ? (
                recentReviews.map((r) => (
                  <Link
                    key={r.id}
                    to={r.businessSlug ? `/business/${r.businessSlug}` : "/search"}
                    style={{
                      background: "#ffffff",
                      border: "1px solid var(--slate-200)",
                      borderRadius: "var(--radius-lg)",
                      padding: "20px",
                      display: "block",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "#e0f2fe",
                            color: "#0369a1",
                            fontWeight: "800",
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {r.initials || "AR"}
                        </span>
                        <div>
                          <strong style={{ fontSize: "0.88rem", display: "block" }}>{r.author}</strong>
                          <span style={{ fontSize: "0.72rem", color: "var(--slate-500)" }}>reviewed {r.businessName}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--slate-400)" }}>{r.date}</span>
                    </div>
                    <h4 style={{ margin: "10px 0 4px", fontSize: "0.95rem" }}>&ldquo;{r.title}&rdquo;</h4>
                    <p style={{ fontSize: "0.84rem", color: "var(--slate-600)", margin: 0 }}>{r.body}</p>
                  </Link>
                ))
              ) : (
                businesses.slice(0, 3).map((b) => (
                  <Link
                    key={b.id}
                    to={`/business/${b.slug}`}
                    style={{
                      background: "#ffffff",
                      border: "1px solid var(--slate-200)",
                      borderRadius: "var(--radius-lg)",
                      padding: "20px",
                      display: "block",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "#e0f2fe",
                            color: "#0369a1",
                            fontWeight: "800",
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {b.reviews[0]?.initials || "AR"}
                        </span>
                        <div>
                          <strong style={{ fontSize: "0.88rem", display: "block" }}>{b.reviews[0]?.author}</strong>
                          <span style={{ fontSize: "0.72rem", color: "var(--slate-500)" }}>reviewed {b.name}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--slate-400)" }}>{b.reviews[0]?.date}</span>
                    </div>
                    <h4 style={{ margin: "10px 0 4px", fontSize: "0.95rem" }}>&ldquo;{b.reviews[0]?.title}&rdquo;</h4>
                    <p style={{ fontSize: "0.84rem", color: "var(--slate-600)", margin: 0 }}>{b.reviews[0]?.body}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Scam Alerts Tracker */}
          <div>
            <div className="scam-tracker-card" style={{ textAlign: "center", padding: "36px 24px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "14px",
                  background: "var(--crimson-bg)",
                  color: "var(--crimson-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <ShieldAlert size={26} />
              </div>

              <div className="trust-badge-pill" style={{ background: "var(--crimson-bg)", color: "var(--crimson-text)", borderColor: "var(--crimson-border)", margin: "0 auto 10px" }}>
                Coming Soon
              </div>

              <h4 style={{ fontSize: "1.15rem", margin: "0 0 6px" }}>Scam Alerts Tracker</h4>
              <p style={{ fontSize: "0.84rem", color: "var(--slate-500)", margin: "0 0 18px", lineHeight: 1.5 }}>
                Moderated community evidence tracker and forensic verification pipeline will be available soon.
              </p>

              <Link to="/search" className="btn-teal-pill" style={{ width: "100%", justifyContent: "center" }}>
                Explore Discover &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DISCOVER / SEARCH PAGE
   Issue #1: Custom category dropdown UI
   Issue #2 & Issue #6: Backend search API connected to real database data
============================================================ */
function DiscoverPage({
  openSoon,
  onOpenAddBusiness,
}: {
  openSoon: (s: string) => void;
  onOpenAddBusiness?: () => void;
}) {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const selectedCat = params.get("category") ?? "All Categories";
  const [ratingFilter, setRatingFilter] = useState("Any Rating");

  // State for Issue #2 & #6: Backend search API database results
  const [results, setResults] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const minRating = ratingFilter === "Any Rating" ? 0 : parseFloat(ratingFilter);

  // Issue #2 & Issue #6: Fetch matching entities from backend database on search query change
  useEffect(() => {
    let isMounted = true;
    async function performSearch() {
      setLoading(true);
      try {
        const data = await businessService.search(query, selectedCat, minRating);
        if (isMounted) {
          setResults(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setResults([]);
          setLoading(false);
        }
      }
    }
    performSearch();
    return () => {
      isMounted = false;
    };
  }, [query, selectedCat, minRating]);

  const setQuery = (val: string) => {
    const p = new URLSearchParams(params);
    if (val) p.set("q", val);
    else p.delete("q");
    setParams(p);
  };

  const handleCategoryChange = (cat: string) => {
    const p = new URLSearchParams(params);
    if (cat !== "All Categories") p.set("category", cat);
    else p.delete("category");
    setParams(p);
  };

  return (
    <div className="discover-container">
      <div className="discover-title-box">
        <h1 className="discover-title">Discover</h1>

        <div className="discover-filters-row">
          <div className="discover-search-input">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search a product, business, doctor, hospital or university..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                style={{ border: 0, background: "transparent", cursor: "pointer", color: "#94a3b8" }}
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Issue #1 Fix: Custom category dropdown component replacing standard HTML <select> */}
          <CategoryDropdown
            selectedCategory={selectedCat}
            onSelectCategory={handleCategoryChange}
          />

          <select
            className="filter-select-pill"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="Any Rating">Any Rating</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
            <option value="3.0">3.0+ Stars</option>
          </select>
        </div>
      </div>

      <div className="add-entity-banner">
        <div className="add-entity-left">
          <Building2 size={24} />
          <div>
            <h3 className="add-entity-title">Can&apos;t find the product or business you&apos;re looking for?</h3>
            <p className="add-entity-subtitle">
              Add a new listing so you and other community members can share verified reviews.
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
          Add to TruthHubBD
        </button>
      </div>

      <div className="count-heading">
        Showing {results.length} {results.length === 1 ? "entity" : "entities"}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Clock size={32} color="#0f766e" style={{ animation: "spin 1s infinite linear", margin: "0 auto 12px" }} />
          <p style={{ color: "#64748b" }}>Searching real database entities from backend API...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="entities-grid">
          {results.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#ffffff", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
          <Search size={40} color="#0f766e" style={{ margin: "0 auto 16px" }} />
          <h3>No matching entities found</h3>
          <p style={{ color: "var(--slate-500)", marginBottom: "20px" }}>
            Try adjusting your search keyword, category, or rating filters.
          </p>
          <button
            className="btn-teal-pill"
            onClick={() => {
              setQuery("");
              handleCategoryChange("All Categories");
              setRatingFilter("Any Rating");
            }}
          >
            Reset all filters
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
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState<number | "All">("All");
  const [sortOrder, setSortOrder] = useState("Newest First");
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadBusinessDetail() {
      setLoading(true);
      const data = await businessService.getBySlug(slug ?? "");
      if (isMounted) {
        setBusiness(data || null);
        setLoading(false);
      }
    }
    loadBusinessDetail();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <Clock size={36} color="#0f766e" style={{ animation: "spin 1s infinite linear", margin: "0 auto 12px" }} />
        <p style={{ color: "#64748b" }}>Loading business profile from database...</p>
      </div>
    );
  }

  if (!business) return <EntityNotFound type="business" />;

  const isOwner = Boolean(user && business && business.userId && user.id === business.userId);

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

  return (
    <div className="biz-detail-container">
      {/* Top Hero Card */}
      <div className="biz-hero-card">
        <div className="biz-hero-left">
          {business.image ? (
            <img src={business.image.startsWith("/") ? "http://localhost:8001" + business.image : business.image} alt={business.name} className="biz-hero-photo" />
          ) : (
            <div className="biz-hero-photo" style={{ background: business.color || "#0f766e", color: "#fff", display: "grid", placeItems: "center", fontSize: "2rem", fontWeight: 900 }}>
              {business.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <div className="biz-hero-title-row">
              <h1 className="biz-hero-name">{business.name}</h1>
              {business.bengaliName && <span className="biz-bengali-name">({business.bengaliName})</span>}
              {business.verified && (
                <span className="entity-badge">
                  <ShieldCheck size={13} /> Verified Business
                </span>
              )}
              {isOwner && (
                <span className="entity-badge" style={{ background: "#ecfdf5", color: "#065f46", borderColor: "#a7f3d0" }}>
                  <UserCheck size={13} /> You Own This Account
                </span>
              )}
            </div>

            <p className="biz-hero-meta">
              {business.category} &bull; {business.location}
            </p>

            <p className="biz-hero-desc">{business.description}</p>
          </div>
        </div>

        {/* Right Big Rating Box */}
        <div className="biz-hero-right-box">
          <div className="biz-big-rating">
            {business.rating.toFixed(1)} <span>/ 5</span>
          </div>
          <div className="stars-cluster" style={{ justifyContent: "center", margin: "6px 0" }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                className={s <= Math.round(business.rating) ? "star-fill" : "star-empty"}
              />
            ))}
          </div>
          <div className="biz-rating-verified-text">{business.reviewCount} verified reviews</div>

          {isOwner ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center", marginTop: "6px" }}>
              <button className="btn-teal-pill" onClick={() => setEditModalOpen(true)}>
                <Pencil size={14} /> Edit Business Profile
              </button>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                Owner Notice: You cannot review your own business account.
              </span>
            </div>
          ) : (
            <button className="btn-teal-pill" onClick={() => openReview(business)}>
              <Plus size={14} /> Write Review
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Split */}
      <div className="biz-layout-grid">
        <aside>
          <div className="biz-sidebar-card">
            <h3 className="biz-sidebar-title">Rating Distribution</h3>
            <div className="rating-distribution-list">
              {[
                { star: 5, count: ratingCounts.star5, pct: (ratingCounts.star5 / totalRevs) * 100 },
                { star: 4, count: ratingCounts.star4, pct: (ratingCounts.star4 / totalRevs) * 100 },
                { star: 3, count: ratingCounts.star3, pct: (ratingCounts.star3 / totalRevs) * 100 },
                { star: 2, count: ratingCounts.star2, pct: (ratingCounts.star2 / totalRevs) * 100 },
                { star: 1, count: ratingCounts.star1, pct: (ratingCounts.star1 / totalRevs) * 100 },
              ].map((row) => (
                <div key={row.star} className="dist-row">
                  <span style={{ cursor: "pointer", fontWeight: starFilter === row.star ? 800 : 500 }} onClick={() => setStarFilter(row.star)}>
                    {row.star}★
                  </span>
                  <div className="dist-bar-track" style={{ cursor: "pointer" }} onClick={() => setStarFilter(row.star)}>
                    <div className="dist-bar-fill" style={{ width: `${Math.min(100, Math.max(0, row.pct))}%` }} />
                  </div>
                  <span className="dist-count">{row.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="biz-sidebar-card">
            <h3 className="biz-sidebar-title">Profile Facts</h3>
            <div className="facts-list">
              <div className="fact-item">
                <Globe size={15} />
                <a href={business.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal-primary)", fontWeight: 600 }}>
                  {business.website}
                </a>
              </div>
              <div className="fact-item">
                <Phone size={15} />
                <span>{business.phone}</span>
              </div>
              {business.branches && business.branches.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--slate-500)", display: "block", marginBottom: 4 }}>
                    Branches / Locations:
                  </span>
                  <div style={{ borderLeft: "2px solid var(--slate-200)", paddingLeft: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {business.branches.map((br) => (
                      <span key={br} style={{ fontSize: "0.8rem", color: "var(--slate-700)" }}>{br}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, paddingTop: 14, borderTop: "1px solid var(--slate-100)" }}>
              <button
                style={{ background: "transparent", border: 0, color: "var(--slate-400)", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                onClick={() => openSoon("Report Factual Error")}
              >
                <Flag size={13} /> Report profile factual error
              </button>
            </div>
          </div>
        </aside>

        <div>
          <div className="reviews-filter-bar">
            <div className="filter-stars-pills">
              <span>Filter:</span>
              <button className={`star-pill-btn ${starFilter === "All" ? "active" : ""}`} onClick={() => setStarFilter("All")}>
                All
              </button>
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  className={`star-pill-btn ${starFilter === s ? "active" : ""}`}
                  onClick={() => setStarFilter(s)}
                >
                  {s}★
                </button>
              ))}
            </div>

            <select className="sort-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="Newest First">Sort by: Newest First</option>
              <option value="Highest Rating">Sort by: Highest Rating</option>
              <option value="Most Helpful">Sort by: Most Helpful</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredReviews.length > 0 ? (
              filteredReviews.map((rev) => (
                <div key={rev.id} className="detailed-review-card">
                  <div className="review-card-top-row">
                    <div className="review-author-group">
                      <span className="review-author-name">{rev.author}</span>
                      <span className="badge-verified-experience">
                        <ShieldCheck size={12} style={{ marginRight: 3, verticalAlign: "middle" }} />
                        Verified Experience
                      </span>
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
                    Date: {rev.date} &bull; {rev.disclaimer || "No conflict of interest (Independent Customer)"}
                  </div>

                  <h4 className="review-headline">{rev.title}</h4>
                  <p className="review-body-text">{rev.body}</p>
                  {rev.imagePath && (
                    <div style={{ marginTop: "16px", marginBottom: "16px" }}>
                      <img src={"http://localhost:8001" + rev.imagePath} alt="Review attachment" style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", border: "1px solid var(--slate-200)" }} />
                    </div>
                  )}
                  {(rev.location || rev.facebookUrl) && (
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--slate-500)" }}>
                      {rev.location && <span>?? {rev.location}</span>}
                      {rev.facebookUrl && <a href={rev.facebookUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal-primary)", textDecoration: "none" }}>?? Facebook Profile</a>}
                    </div>
                  )}

                  <div className="dimension-scores-pill">
                    <span>Service: <strong>{rev.serviceRating ?? rev.rating}/5</strong></span>
                    <span>Value: <strong>{rev.valueRating ?? Math.max(3, rev.rating - 1)}/5</strong></span>
                    <span>Communication: <strong>{rev.commRating ?? rev.rating}/5</strong></span>
                  </div>

                  <div className="review-card-foot">
                    <button className="btn-helpful" onClick={() => openSoon("Vote Helpful")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", border: "1px solid var(--slate-200)", background: "transparent", borderRadius: "20px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--slate-700)" }}>
  <ThumbsUp size={14} /> Helpful ({rev.helpfulCount})
</button>
<button className="btn-helpful" onClick={() => openSoon("Vote Not Helpful")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", border: "1px solid var(--slate-200)", background: "transparent", borderRadius: "20px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--slate-700)" }}>
  <ThumbsDown size={14} /> Not Helpful (0)
</button>
<button className="btn-helpful" onClick={() => openSoon("Report Review")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", border: "1px solid var(--slate-200)", background: "transparent", borderRadius: "20px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--slate-700)" }}>
  <Flag size={14} /> Report
</button>
                    <button
                      style={{ background: "transparent", border: 0, color: "var(--teal-primary)", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem" }}
                      onClick={() => openSoon("View Discussion")}
                    >
                      View discussion ({rev.discussionCount ?? 1}) &rarr;
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ background: "#ffffff", padding: "40px", textAlign: "center", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
                <p style={{ color: "var(--slate-500)", margin: "0 0 12px" }}>No reviews match the selected star filter.</p>
                <button className="btn-pill-light" onClick={() => setStarFilter("All")}>
                  Show all reviews
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
function AdminPage() {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    const data = await businessService.getPendingBusinesses();
    setPending(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleApprove = async (id: number) => {
    setActionMsg(null);
    const ok = await businessService.approveBusiness(id);
    if (ok) {
      setActionMsg("Business account request APPROVED successfully! It is now active and public.");
      setPending((prev) => prev.filter((item) => item.id !== id));
    } else {
      setActionMsg("Failed to approve business request.");
    }
  };

  const handleReject = async (id: number) => {
    setActionMsg(null);
    const ok = await businessService.rejectBusiness(id);
    if (ok) {
      setActionMsg("Business account request REJECTED.");
      setPending((prev) => prev.filter((item) => item.id !== id));
    } else {
      setActionMsg("Failed to reject business request.");
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px", minHeight: "65vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", margin: 0, color: "var(--slate-900)" }}>Admin Console</h1>
          <p style={{ color: "var(--slate-500)", margin: "4px 0 0", fontSize: "0.9rem" }}>
            Business Account Creation Requests &amp; Approval Queue (/admin)
          </p>
        </div>
        <button onClick={loadPending} className="btn-pill-light">
          Refresh List
        </button>
      </div>

      {actionMsg && (
        <div style={{ background: "#ecfdf5", color: "#047857", padding: "14px 18px", borderRadius: "10px", marginBottom: "20px", fontSize: "0.9rem", fontWeight: 600 }}>
          ✓ {actionMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Clock size={32} color="#0f766e" style={{ animation: "spin 1s infinite linear", margin: "0 auto 12px" }} />
          <p style={{ color: "#64748b" }}>Loading pending approval requests from database...</p>
        </div>
      ) : pending.length === 0 ? (
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid var(--slate-200)", padding: "48px", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
          <ShieldCheck size={44} color="#0f766e" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ margin: "0 0 6px" }}>No Pending Business Account Requests</h3>
          <p style={{ color: "var(--slate-500)", margin: 0 }}>All submitted business creation requests have been reviewed.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {pending.map((item) => (
            <div key={item.id} style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid var(--slate-200)", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "1.25rem" }}>
                    {item.name} {item.bengaliName && <span style={{ fontSize: "1rem", color: "#64748b" }}>({item.bengaliName})</span>}
                  </h3>
                  <span style={{ display: "inline-block", background: "#f1f5f9", padding: "3px 12px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 600, color: "#475569" }}>
                    {item.category}
                  </span>
                </div>
                <span style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "4px 14px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700 }}>
                  Pending Admin Approval
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", border: "1px solid #f1f5f9", padding: "14px 18px", borderRadius: "12px", fontSize: "0.85rem", marginBottom: "16px" }}>
                <div>
                  <span style={{ color: "var(--slate-500)", display: "block", fontSize: "0.75rem" }}>Applicant Account</span>
                  <strong>{item.creator ? `${item.creator.name} (${item.creator.email})` : "Anonymous"}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--slate-500)", display: "block", fontSize: "0.75rem" }}>Location</span>
                  <strong>{item.location || "N/A"}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--slate-500)", display: "block", fontSize: "0.75rem" }}>Phone Number</span>
                  <strong>{item.phone || "N/A"}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--slate-500)", display: "block", fontSize: "0.75rem" }}>Website / Social</span>
                  <strong>{item.website || item.facebookUrl || "N/A"}</strong>
                </div>
              </div>

              {item.description && (
                <p style={{ fontSize: "0.88rem", color: "#475569", marginBottom: "18px", lineHeight: 1.5 }}>
                  {item.description}
                </p>
              )}

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => handleReject(item.id)}
                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "8px 20px", borderRadius: "20px", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}
                >
                  Reject Request
                </button>
                <button
                  onClick={() => handleApprove(item.id)}
                  className="btn-teal-pill"
                >
                  <CheckCircle2 size={16} /> Approve &amp; Open Business Account
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SCAM ALERTS INDEX PAGE (Coming Soon - Simple)
============================================================ */
function ScamAlertsIndexPage({ openSoon }: { openSoon: (s: string) => void }) {
  return (
    <div className="section-container" style={{ padding: "60px 24px 80px" }}>
      <div
        style={{
          maxWidth: "540px",
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid var(--slate-200)",
          borderRadius: "var(--radius-lg)",
          padding: "48px 32px",
          textAlign: "center",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "var(--crimson-bg)",
            color: "var(--crimson-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <ShieldAlert size={28} />
        </div>

        <div className="trust-badge-pill" style={{ background: "var(--crimson-bg)", color: "var(--crimson-text)", borderColor: "var(--crimson-border)", margin: "0 auto 12px" }}>
          Coming Soon
        </div>

        <h1 style={{ fontSize: "1.6rem", marginBottom: "8px" }}>
          Scam Alerts Index
        </h1>

        <p style={{ fontSize: "0.92rem", color: "var(--slate-600)", margin: "0 0 20px", lineHeight: 1.5 }}>
          This feature is currently under active development and will be available soon.
        </p>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <Link to="/search" className="btn-teal-pill">
            Explore Discover &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SCAM DETAIL PAGE (Coming Soon)
============================================================ */
function ScamDetailPage({ openSoon }: { openSoon: (s: string) => void }) {
  return <ScamAlertsIndexPage openSoon={openSoon} />;
}

/* ============================================================
   POLISHED AUTH PAGES (Compact & Fully Visible on Screen)
============================================================ */
function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "", remember: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [checkInbox, setCheckInbox] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const verifiedParam = searchParams.get("verified");
  const expiredEmail = searchParams.get("email") || form.email;

  if (user) return <Navigate to="/profile" replace />;
  const update = (name: string, value: string | boolean) => setForm((f) => ({ ...f, [name]: value }));

  const handleResend = async (targetEmail: string) => {
    if (!targetEmail) return;
    setResending(true);
    setResendStatus(null);
    try {
      const res = await authService.resendVerification(targetEmail);
      setResendStatus(res.message || "A new verification link has been sent! Check your inbox.");
    } catch (e: unknown) {
      setResendStatus((e as Error).message || "Could not resend email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrors({});
    setResendStatus(null);
    try {
      if (isLogin) {
        const result = await authService.login({ email: form.email, password: form.password, remember: form.remember });
        setUser(result.user);
        navigate("/profile");
      } else {
        await authService.register(form);
        setCheckInbox(true);
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
                Almost there!
              </div>
              <h2>Check your inbox to activate.</h2>
              <p>
                We sent an instant verification link to <strong>{form.email}</strong>. Click the link in the email within <strong>5 minutes</strong>.
              </p>
            </div>
            <div className="auth-side-points">
              <span><Clock size={15} /> Valid for 5 minutes</span>
              <span><Mail size={15} /> Check spam folder if not in inbox</span>
              <span><CheckCircle2 size={15} /> Instant 100% verified access</span>
            </div>
            <small style={{ color: "var(--slate-400)" }}>5-Minute Email Verification</small>
          </div>

          <div className="auth-form-panel">
            <p className="logo-subtitle">VERIFICATION DISPATCHED</p>
            <h3>Check your email!</h3>
            <div className="success-message" style={{ margin: "16px 0" }}>
              <CheckCircle2 size={20} />
              <div>
                <strong>Email sent to {form.email}</strong>
                <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "inherit" }}>
                  Click the link inside within 5 minutes to unlock your account.
                </p>
              </div>
            </div>

            {resendStatus && <div className="success-message"><CheckCircle2 size={15} />{resendStatus}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
              <button className="btn-pill-light" style={{ justifyContent: "center" }} onClick={() => handleResend(form.email)} disabled={resending}>
                {resending ? "Sending new link…" : "Resend verification link"}
              </button>
              <Link className="btn primary full" to="/login">
                Go to login &rarr;
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
              {isLogin ? "Welcome back" : "Join TruthHubBD"}
            </div>
            <h2>{isLogin ? "Welcome back to TruthHubBD" : "Join a more informed Bangladesh"}</h2>
            <p>
              {isLogin
                ? "Log in to your verified account to contribute reviews and track trusted community cases."
                : "Create your free account. Verification link will be sent directly to your inbox."}
            </p>
          </div>
          <div className="auth-side-points">
            {isLogin ? (
              <>
                <span><CheckCircle2 size={15} /> Verified accounts only</span>
                <span><Lock size={15} /> Secure HTTP-only Sanctum sessions</span>
                <span><ShieldCheck size={15} /> Real community credibility</span>
              </>
            ) : (
              <>
                <span><Clock size={15} /> 5-minute link activation</span>
                <span><ShieldCheck size={15} /> Spam-free &amp; strictly verified</span>
                <span><UserCheck size={15} /> Canonical profile ownership</span>
              </>
            )}
          </div>
          <small style={{ color: "var(--slate-400)" }}>{isLogin ? "Verified Accounts Only" : "Email Verification Required"}</small>
        </div>

        <div className="auth-form-panel">
          <p className="logo-subtitle">{isLogin ? "ACCOUNT LOGIN" : "CREATE NEW PROFILE"}</p>
          <h3>{isLogin ? "Log in" : "Create an account"}</h3>
          <p>{isLogin ? "Only verified accounts can log in." : "Verify your email within 5 minutes."}</p>

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
          {error && <div className="form-error"><AlertCircle size={16} />{error}</div>}

          <form onSubmit={submit}>
            {!isLogin && (
              <label className="field">
                <span>Full name</span>
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
              <span>Email address</span>
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
              <span>Password</span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />
              {errors.password?.[0] && <small style={{ color: "#dc2626" }}>{errors.password[0]}</small>}
            </label>

            {!isLogin && (
              <label className="field">
                <span>Confirm password</span>
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
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--teal-primary)" }}>
                  Forgot password?
                </Link>
              </div>
            )}

            <button className="btn primary full" disabled={loading}>
              {loading ? "Please wait…" : isLogin ? "Log in" : "Create account"}
            </button>
          </form>

          {isLogin && (error.toLowerCase().includes("verify") || error.toLowerCase().includes("verified")) && form.email && (
            <div style={{ marginTop: "8px", textAlign: "center" }}>
              <button
                className="btn-pill-light"
                style={{ width: "100%", justifyContent: "center" }}
                type="button"
                onClick={() => handleResend(form.email)}
                disabled={resending}
              >
                {resending ? "Sending…" : `Resend verification link to ${form.email}`}
              </button>
            </div>
          )}

          <div className="divider"><span>or</span></div>

          <a className="btn google full" href={authService.googleUrl}>
            <span>G</span> Continue with Google
          </a>

          <p className="auth-switch">
            {isLogin ? "New to TruthHubBD?" : "Already have an account?"}{" "}
            <Link to={isLogin ? "/register" : "/login"}>{isLogin ? "Create account" : "Log in"}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");
    try {
      await authService.forgotPassword(email);
      setMsg("Password reset link sent! Check your inbox (valid for 5 minutes).");
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
              Enter your registered email and we&apos;ll send you a link to choose a new password (valid for <strong>5 minutes</strong>).
            </p>
          </div>
          <div className="auth-side-points">
            <span><Clock size={15} /> Link valid for 5 minutes</span>
            <span><Mail size={15} /> Delivered to your inbox</span>
            <span><Lock size={15} /> Single-use secure token</span>
          </div>
          <small style={{ color: "var(--slate-400)" }}>TruthHubBD Security</small>
        </div>

        <div className="auth-form-panel">
          <p className="logo-subtitle">PASSWORD RECOVERY</p>
          <h3>Forgot your password?</h3>
          <p>We&apos;ll send a 5-minute reset link right away.</p>

          {msg && <div className="success-message"><CheckCircle2 size={15} />{msg}</div>}
          {error && <div className="form-error"><AlertCircle size={15} />{error}</div>}

          {!msg ? (
            <form onSubmit={submit}>
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
                {loading ? "Sending…" : "Send 5-minute reset link"}
              </button>
            </form>
          ) : (
            <div style={{ marginTop: "14px" }}>
              <button className="btn-pill-light" style={{ width: "100%", justifyContent: "center" }} onClick={() => setMsg("")}>
                Send another link
              </button>
            </div>
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
  const token = params.get("token") ?? "";
  const emailParam = params.get("email") ?? "";
  const [form, setForm] = useState({ email: emailParam, password: "", password_confirmation: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.resetPassword({ token, ...form });
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
            <span><Clock size={15} /> 5-minute link expiration</span>
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
                  Request a fresh reset link &rarr;
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
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label className="field">
                <span>New password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </label>

              <label className="field">
                <span>Confirm new password</span>
                <input
                  type="password"
                  value={form.password_confirmation}
                  onChange={(e) => update("password_confirmation", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </label>

              <button className="btn primary full" disabled={loading}>
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

function ProfilePage() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const { user: u } = await authService.updateProfile({ name, avatar: avatar || undefined });
      setUser(u);
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (e: unknown) {
      setMessage((e as Error).message);
    }
  };

  if (!user) return null;

  return (
    <div className="section-container" style={{ padding: "40px 24px 64px" }}>
      <div style={{ background: "linear-gradient(135deg, #091322, #112441)", color: "#fff", padding: "32px", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
        <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--teal-primary)", display: "grid", placeItems: "center", fontSize: "1.4rem", fontWeight: 800 }}>
          {user.avatar_url ? <img src={"http://localhost:8001" + user.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <span className="logo-subtitle" style={{ color: "#2dd4bf" }}>TRUTHUBBD MEMBER</span>
          <h1 style={{ color: "#fff", fontSize: "1.7rem", margin: "4px 0" }}>{user.name}</h1>
          <p style={{ color: "var(--slate-300)", margin: 0, fontSize: "0.85rem" }}>
            {user.email} &bull; Member since {new Date(user.created_at).toLocaleDateString("en-BD", { month: "long", year: "numeric" })}
          </p>
        </div>
        <button className="btn-pill-light" onClick={() => setEditing((v) => !v)}>
          {editing ? "Cancel" : "Edit profile"}
        </button>
      </div>

      {message && <div className="success-message"><CheckCircle2 size={16} />{message}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={{ background: "#ffffff", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-lg)", padding: "28px" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>Account Details</h3>
          {editing ? (
            <form onSubmit={save}>
              <label className="field">
                <span>Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="field" style={{ marginTop: 12 }}>
                <span>Profile Avatar (Optional)</span>
                <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
              </label>
              <button className="btn-teal-pill" style={{ marginTop: "12px" }}>Save changes</button>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ background: "var(--slate-50)", padding: "12px 16px", borderRadius: "10px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--slate-500)", display: "block" }}>Full Name</span>
                <strong>{user.name}</strong>
              </div>
              <div style={{ background: "var(--slate-50)", padding: "12px 16px", borderRadius: "10px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--slate-500)", display: "block" }}>Email</span>
                <strong>{user.email}</strong>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: "#ffffff", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-lg)", padding: "28px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <MessageSquare size={36} color="var(--teal-primary)" style={{ marginBottom: "12px" }} />
          <h3 style={{ fontSize: "1.2rem", margin: "0 0 6px" }}>Your activity starts here</h3>
          <p style={{ color: "var(--slate-500)", fontSize: "0.85rem", marginBottom: "16px" }}>
            Review activity will appear here when community reviews launch.
          </p>
          <Link to="/search" className="btn-teal-pill">
            Explore TruthHubBD
          </Link>
        </div>
      </div>
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

function AdminProtected({ children }: { children: React.ReactNode }) {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking)
    return (
      <div style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: "var(--slate-500)" }}>Checking admin access...</p>
      </div>
    );
  if (!user || user.role !== 'admin') return <Navigate to="/" replace state={{ from: location }} />;
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
function Footer({ openSoon }: { openSoon: (s: string) => void }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid-4">
          <div>
            <Logo dark />
            <p className="footer-col-desc">
              Read real customer experiences, discover verified businesses, and stay informed across Bangladesh.
            </p>
            <div className="footer-badge-gdpr">
              <ShieldCheck size={16} />
              Privacy &amp; Consumer Safety First
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Explore &amp; Discover</h4>
            <div className="footer-links-list">
              <Link to="/search?category=Products">Products</Link>
              <Link to="/search?category=Businesses%20%26%20Services">Businesses &amp; Services</Link>
              <Link to="/search?category=Doctors%20%26%20Professionals">Doctors &amp; Professionals</Link>
              <Link to="/search?category=Hospitals%20%26%20Clinics">Hospitals &amp; Clinics</Link>
              <Link to="/search?category=Universities%20%26%20Education">Universities &amp; Education</Link>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Trust &amp; Community</h4>
            <div className="footer-links-list">
              <Link to="/scam-alerts" className="footer-link-red">
                Scam Alerts Index
              </Link>
              <button onClick={() => openSoon("Review Guidelines & Rules")}>Review Guidelines &amp; Rules</button>
              <button onClick={() => openSoon("Community Standards")}>Community Standards</button>
              <button onClick={() => openSoon("Dispute Resolution Process")}>Dispute Resolution Process</button>
              <button onClick={() => openSoon("Privacy & Data Redaction")}>Privacy &amp; Data Protection</button>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">For Businesses</h4>
            <p style={{ color: "var(--slate-400)", fontSize: "0.85rem", margin: "0 0 16px", lineHeight: 1.5 }}>
              Manage a business or service in Bangladesh? Claim your profile to post official responses and verify business details.
            </p>
            <button className="btn-verified-apply" onClick={() => openSoon("Business Profile Verification")}>
              Claim Business Profile <ExternalLink size={14} />
            </button>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div>&copy; 2026 TruthHubBD. Bangladesh Trust Layer &amp; Review System</div>
          <div className="footer-legal-links">
            <button onClick={() => openSoon("Terms of Service")}>Terms of Service</button>
            <button onClick={() => openSoon("Privacy Policy")}>Privacy Policy</button>
            <button onClick={() => openSoon("Legal Snapshot")}>Legal Snapshot</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function TruthHubApp() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  );
}
















