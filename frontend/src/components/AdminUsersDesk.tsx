"use client";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  User as UserIcon, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Mail,
  Lock
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../features/auth/AuthContext";
import { useI18n } from "../i18n/LanguageContext";
import { formatDate } from "../i18n/dictionary";

type StaffRole = "admin" | "moderator" | "user" | "business";

type UserItem = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  role: StaffRole;
  is_restricted?: boolean;
  restricted_reason?: string | null;
  claim_blocked?: boolean;
  claim_blocked_reason?: string | null;
  avatar_url: string | null;
  created_at: string;
  two_factor_confirmed_at: string | null;
  business?: {
    id: number;
    name: string;
    bengali_name: string | null;
    slug: string;
    category: string;
    status: string;
  } | null;
};

type UserResponse = {
  data: UserItem[];
  pagination: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
};

export function AdminUsersDesk() {
  const { user: currentUser } = useAuth();
  const { lang, t } = useI18n();
  const bn = lang === "bn";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<UserResponse["pagination"]>({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [reloadToken, setReloadToken] = useState(0);

  // Modal / form states for changing role
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [newRole, setNewRole] = useState<StaffRole>("user");
  const [roleReason, setRoleReason] = useState("");
  const [savingRole, setSavingRole] = useState(false);

  // Fetch users
  useEffect(() => {
    if (currentUser?.role !== "admin") return;
    let active = true;
    setLoading(true);
    setError("");

    const query = new URLSearchParams({
      page: String(page),
      per_page: "20",
      ...(roleFilter !== "all" ? { role: roleFilter } : {}),
      ...(search.trim() ? { q: search.trim() } : {})
    });

    api<UserResponse>(`/admin/users?${query.toString()}`)
      .then((res) => {
        if (!active) return;
        setUsers(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError((err as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser?.role, page, roleFilter, search, reloadToken]);

  const handleRoleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser || savingRole) return;

    setSavingRole(true);
    setNotice(null);
    try {
      const res = await api<{ message: string; user: UserItem }>(
        `/admin/users/${selectedUser.id}/role`,
        "PATCH",
        {
          role: newRole,
          reason: roleReason.trim() || undefined
        }
      );

      setNotice({
        error: false,
        text: res.message || `Role updated to ${newRole}.`
      });

      // Update in local state
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, role: newRole } : u))
      );

      setSelectedUser(null);
      setRoleReason("");
    } catch (err) {
      setNotice({
        error: true,
        text: (err as Error).message
      });
    } finally {
      setSavingRole(false);
    }
  };

  const handleVerifyEmail = async (userId: number, email: string) => {
    if (!window.confirm(`Mark email ${email} as verified?`)) return;

    setNotice(null);
    try {
      const res = await api<{ message: string; user: UserItem }>(
        `/admin/users/${userId}/verify-email`,
        "POST"
      );

      setNotice({
        error: false,
        text: res.message || "Email verified."
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, email_verified_at: new Date().toISOString() } : u
        )
      );
    } catch (err) {
      setNotice({
        error: true,
        text: (err as Error).message
      });
    }
  };

  const handleToggleRestrict = async (userId: number, email: string, currentlyRestricted: boolean) => {
    const action = currentlyRestricted ? "lift restriction on" : "restrict";
    let reason: string | null = null;
    if (!currentlyRestricted) {
      reason = window.prompt(`Enter reason for restricting account ${email}:`, "Policy violation or fraud suspicion");
      if (reason === null) return;
    } else {
      if (!window.confirm(`Lift account restriction for ${email}?`)) return;
    }

    setNotice(null);
    try {
      const res = await api<{ message: string; user: UserItem }>(
        `/admin/users/${userId}/restrict`,
        "PATCH",
        { reason }
      );

      setNotice({
        error: false,
        text: res.message || `Account ${action} updated.`
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_restricted: !currentlyRestricted, restricted_reason: reason } : u
        )
      );
    } catch (err) {
      setNotice({
        error: true,
        text: (err as Error).message
      });
    }
  };

  const handleToggleClaimAccess = async (userId: number, email: string, currentlyBlocked: boolean) => {
    let reason: string | null = null;
    if (!currentlyBlocked) {
      reason = window.prompt(`Enter reason for restricting organization claims for ${email}:`, "Disputed or invalid ownership claim");
      if (reason === null) return;
    } else {
      if (!window.confirm(`Allow organization claiming for ${email}?`)) return;
    }

    setNotice(null);
    try {
      const res = await api<{ message: string; claim_blocked: boolean; claim_blocked_reason?: string }>(
        `/admin/users/${userId}/claim-access`,
        "PATCH",
        { reason }
      );

      setNotice({
        error: false,
        text: res.message || `Claim access updated.`
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, claim_blocked: !currentlyBlocked, claim_blocked_reason: reason } : u
        )
      );
    } catch (err) {
      setNotice({
        error: true,
        text: (err as Error).message
      });
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!window.confirm(`DANGER: Are you sure you want to permanently delete user account ${email}? This action CANNOT be undone.`)) return;

    setNotice(null);
    try {
      const res = await api<{ message: string }>(
        `/admin/users/${userId}`,
        "DELETE"
      );

      setNotice({
        error: false,
        text: res.message || `Account ${email} deleted.`
      });

      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setNotice({
        error: true,
        text: (err as Error).message
      });
    }
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="workspace-page">
        <p role="alert">{t("Administrator access is required.", "প্রশাসকের অনুমতি প্রয়োজন।")}</p>
      </div>
    );
  }

  const roleBadges: Record<StaffRole, { label: string; bnLabel: string; bg: string; color: string; border: string }> = {
    admin: {
      label: "ADMINISTRATOR",
      bnLabel: "অ্যাডমিনিস্ট্রেটর",
      bg: "#fef2f2",
      color: "#991b1b",
      border: "#fecaca"
    },
    moderator: {
      label: "MODERATOR",
      bnLabel: "মডারেটর",
      bg: "#ecfeff",
      color: "#155e75",
      border: "#a5f3fc"
    },
    business: {
      label: "BUSINESS / ORG",
      bnLabel: "প্রতিষ্ঠান অ্যাকাউন্ট",
      bg: "#fefce8",
      color: "#854d0e",
      border: "#fef08a"
    },
    user: {
      label: "CITIZEN USER",
      bnLabel: "নাগরিক ব্যবহারকারী",
      bg: "#f8fafc",
      color: "#475569",
      border: "#e2e8f0"
    }
  };

  return (
    <section className="workspace-page admin-users-desk">
      <header className="workspace-heading">
        <span className="workspace-eyebrow">
          {t("ADMIN / ACCESS CONTROL", "অ্যাডমিন / প্রবেশাধিকার নিয়ন্ত্রণ")}
        </span>
        <h1>{t("Users & Staff Permissions", "ব্যবহারকারী ও পদবি নিয়ন্ত্রণ")}</h1>
        <p>
          {t(
            "Manage registered community members, assign moderation roles, and inspect verification records. Every privilege change is recorded in the immutable audit log.",
            "নিবন্ধিত সদস্য পরিচালনা করুন, মডারেশন দলের পদবি নির্ধারণ করুন ও যাচাইয়ের তথ্য দেখুন। প্রতিটি পরিবর্তনের রেকর্ড নিরীক্ষা লগে সংরক্ষিত হয়।"
          )}
        </p>
      </header>

      {notice && (
        <div
          role={notice.error ? "alert" : "status"}
          className="workspace-notice"
          style={{
            background: notice.error ? "#fef2f2" : "#ecfdf5",
            color: notice.error ? "#991b1b" : "#065f46",
            border: `1px solid ${notice.error ? "#fecaca" : "#a7f3d0"}`,
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {notice.error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Toolbar: Search, Filters, Refresh */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "24px",
          background: "#ffffff",
          padding: "16px",
          borderRadius: "10px",
          border: "1px solid #d8cdb7"
        }}
      >
        <div style={{ flex: 1, minWidth: "240px", display: "flex", alignItems: "center", position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, color: "var(--slate-400)" }} />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("Search by name or email…", "নাম বা ইমেইল দিয়ে খুঁজুন…")}
            className="review-input"
            style={{ paddingLeft: "36px", width: "100%", margin: 0 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--slate-600)" }}>
            {t("Role:", "পদবি:")}
          </label>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="review-input"
            style={{ margin: 0, padding: "6px 12px", fontSize: "13px" }}
          >
            <option value="all">{t("All Roles", "সব পদবি")}</option>
            <option value="admin">{t("Administrators", "অ্যাডমিনিস্ট্রেটর")}</option>
            <option value="moderator">{t("Moderators", "মডারেটর")}</option>
            <option value="business">{t("Business / Organization Accounts", "প্রতিষ্ঠান / ব্যবসায়িক অ্যাকাউন্ট")}</option>
            <option value="user">{t("Citizen Users", "নাগরিক ব্যবহারকারী")}</option>
          </select>
        </div>

        <button
          type="button"
          className="btn-pill-light"
          onClick={() => setReloadToken((v) => v + 1)}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={14} />
          <span>{t("Refresh", "রিফ্রেশ")}</span>
        </button>

        <span style={{ fontSize: "13px", color: "var(--slate-500)", marginLeft: "auto" }}>
          {pagination.total} {t("members total", "মোট সদস্য")}
        </span>
      </div>

      {/* Role Change Modal / Card */}
      {selectedUser && (
        <div
          style={{
            background: "#fffdfa",
            border: "1.5px solid var(--teal-primary)",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "24px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>
              {t("Change Role for", "পদবি পরিবর্তন:")} {selectedUser.name} ({selectedUser.email})
            </h3>
            <button
              type="button"
              className="btn-pill-light"
              onClick={() => setSelectedUser(null)}
              style={{ fontSize: "12px", padding: "4px 10px" }}
            >
              {t("Cancel", "বাতিল")}
            </button>
          </div>

          <form onSubmit={handleRoleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={newRole === "user"}
                  onChange={() => setNewRole("user")}
                />
                <span><strong>{t("Citizen User", "নাগরিক ব্যবহারকারী")}</strong> ({t("Standard access", "সাধারণ প্রবেশাধিকার")})</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="radio"
                  name="role"
                  value="business"
                  checked={newRole === "business"}
                  onChange={() => setNewRole("business")}
                />
                <span><strong>{t("Business Owner", "প্রতিষ্ঠানের মালিক")}</strong> ({t("Organization profile management", "প্রতিষ্ঠান প্রোফাইল ব্যবস্থাপনা")})</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="radio"
                  name="role"
                  value="moderator"
                  checked={newRole === "moderator"}
                  onChange={() => setNewRole("moderator")}
                />
                <span><strong>{t("Moderator", "মডারেটর")}</strong> ({t("Casework & report moderation", "কেস ও রিপোর্ট পর্যালোচনা")})</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={newRole === "admin"}
                  onChange={() => setNewRole("admin")}
                />
                <span><strong>{t("Administrator", "অ্যাডমিনিস্ট্রেটর")}</strong> ({t("Full system control", "সম্পূর্ণ প্রশাসনিক নিয়ন্ত্রণ")})</span>
              </label>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px", color: "var(--slate-700)" }}>
                {t("Reason for role modification (recorded in audit log):", "পদবি পরিবর্তনের কারণ (নিরীক্ষা লগে সংরক্ষিত হবে):")}
              </label>
              <input
                type="text"
                className="review-input"
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
                placeholder={t("e.g., Appointed community moderator for hospital category", "যেমন: হাসপাতাল ক্যাটাগরির জন্য নিয়োগকৃত মডারেটর")}
                style={{ width: "100%", margin: 0 }}
                maxLength={500}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                type="submit"
                className="btn-teal-pill"
                disabled={savingRole || newRole === selectedUser.role}
                style={{ cursor: "pointer" }}
              >
                {savingRole ? t("Saving…", "সংরক্ষণ হচ্ছে…") : t("Confirm Role Change", "পদবি পরিবর্তন নিশ্চিত করুন")}
              </button>
              <button
                type="button"
                className="btn-pill-light"
                onClick={() => setSelectedUser(null)}
              >
                {t("Cancel", "বাতিল")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List / Cards */}
      {loading ? (
        <p role="status">{t("Loading user directory…", "ব্যবহারকারী তালিকা লোড হচ্ছে…")}</p>
      ) : error ? (
        <div role="alert" className="workspace-notice">
          {error}{" "}
          <button type="button" onClick={() => setReloadToken((v) => v + 1)}>
            {t("Retry", "আবার চেষ্টা")}
          </button>
        </div>
      ) : users.length === 0 ? (
        <p>{t("No users found matching your search.", "আপনার খোঁজার সাথে মিল রেখে কোনো ব্যবহারকারী পাওয়া যায়নি।")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {users.map((u) => {
            const badge = roleBadges[u.role] || roleBadges.user;
            const isSelf = u.id === currentUser?.id;

            return (
              <article
                key={u.id}
                className="workspace-card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                  padding: "16px 20px",
                  margin: 0
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "260px" }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                      color: "var(--ink)",
                      fontSize: "15px",
                      overflow: "hidden",
                      flexShrink: 0
                    }}
                  >
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url.startsWith('http') ? u.avatar_url : (u.avatar_url.startsWith('/') ? u.avatar_url : '/' + u.avatar_url)}
                        alt={u.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      u.name.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "15px", color: "var(--ink)" }}>{u.name}</strong>
                      <span style={{ fontSize: "11px", color: "var(--slate-500)", fontWeight: 600 }}>#{u.id}</span>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}
                      >
                        {bn ? badge.bnLabel : badge.label}
                      </span>
                      {u.business && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Link
                            to={`/business/${u.business.slug}`}
                            style={{
                              fontSize: "10.5px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              background: "#fefce8",
                              color: "#854d0e",
                              border: "1px solid #fef08a",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4
                            }}
                            title="View Business Profile"
                          >
                            🏢 {u.business.name}
                          </Link>
                          {u.business.category && (
                            <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--slate-500)", border: "1px solid #cbd5e1", borderRadius: "9999px", padding: "1px 6px", background: "#f8fafc" }}>
                              {u.business.category}
                            </span>
                          )}
                        </div>
                      )}
                      {u.is_restricted && (
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            background: "#fee2e2",
                            color: "#991b1b",
                            border: "1px solid #f87171"
                          }}
                          title={u.restricted_reason || "Restricted account"}
                        >
                          ⛔ {t("RESTRICTED", "স্থগিত")}
                        </span>
                      )}
                      {u.claim_blocked && (
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            border: "1px solid #fca5a5"
                          }}
                          title={u.claim_blocked_reason || "Claim access restricted"}
                        >
                          🚫 {t("CLAIM BLOCKED", "ক্লেম নিষিদ্ধ")}
                        </span>
                      )}
                      {isSelf && (
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "#eff6ff",
                            color: "#1d4ed8"
                          }}
                        >
                          {t("You", "আপনি")}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "2px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span>{u.email}</span>
                      <span>&bull;</span>
                      <span>#{u.id}</span>
                      <span>&bull;</span>
                      <span>{formatDate(u.created_at, lang)}</span>
                      {u.restricted_reason && (
                        <>
                          <span>&bull;</span>
                          <span style={{ color: "#dc2626", fontStyle: "italic" }}>{u.restricted_reason}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges & Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: u.email_verified_at ? "#059669" : "#d97706",
                        fontWeight: 600
                      }}
                    >
                      {u.email_verified_at ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                      {u.email_verified_at ? t("Email Confirmed", "ইমেইল নিশ্চিত") : t("Unverified Email", "ইমেইল অনশ্চিত")}
                    </span>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: u.two_factor_confirmed_at ? "#059669" : "var(--slate-400)",
                        fontWeight: 500
                      }}
                    >
                      <Lock size={13} />
                      {u.two_factor_confirmed_at ? t("2FA Active", "২-ধাপ সক্রিয়") : t("2FA Inactive", "২-ধাপ নিষ্ক্রিয়")}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {!u.email_verified_at && (
                      <button
                        type="button"
                        className="btn-pill-light"
                        onClick={() => handleVerifyEmail(u.id, u.email)}
                        style={{ fontSize: "12px", padding: "6px 12px" }}
                        title="Mark email as verified"
                      >
                        <Mail size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                        {t("Verify Email", "ইমেইল নিশ্চিত")}
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-pill-light"
                      disabled={isSelf}
                      onClick={() => {
                        setSelectedUser(u);
                        setNewRole(u.role);
                        setRoleReason("");
                      }}
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                      title={isSelf ? "You cannot modify your own role" : "Change user role"}
                    >
                      <Shield size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      {t("Change Role", "পদবি পরিবর্তন")}
                    </button>

                    {!isSelf && (
                      <button
                        type="button"
                        className="btn-pill-light"
                        onClick={() => handleToggleRestrict(u.id, u.email, !!u.is_restricted)}
                        style={{
                          fontSize: "12px",
                          padding: "6px 12px",
                          color: u.is_restricted ? "#059669" : "#b45309",
                          borderColor: u.is_restricted ? "#a7f3d0" : "#fde68a",
                          background: u.is_restricted ? "#ecfdf5" : "#fffbeb"
                        }}
                        title={u.is_restricted ? "Lift account restriction" : "Restrict this account"}
                      >
                        {u.is_restricted ? t("Unrestrict", "স্থগিতাদেশ প্রত্যাহার") : t("Restrict", "অ্যাকাউন্ট স্থগিত")}
                      </button>
                    )}

                    {!isSelf && (
                      <button
                        type="button"
                        className="btn-pill-light"
                        onClick={() => handleToggleClaimAccess(u.id, u.email, !!u.claim_blocked)}
                        style={{
                          fontSize: "12px",
                          padding: "6px 12px",
                          color: u.claim_blocked ? "#059669" : "#b91c1c",
                          borderColor: u.claim_blocked ? "#a7f3d0" : "#fca5a5",
                          background: u.claim_blocked ? "#ecfdf5" : "#fef2f2"
                        }}
                        title={u.claim_blocked ? "Allow claiming organizations" : "Block user from claiming organizations"}
                      >
                        {u.claim_blocked ? t("Allow Claims", "ক্লেম অনুমোদন") : t("Block Claims", "ক্লেম নিষিদ্ধ")}
                      </button>
                    )}

                    {!isSelf && (
                      <button
                        type="button"
                        className="btn-pill-light"
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        style={{
                          fontSize: "12px",
                          padding: "6px 12px",
                          color: "#dc2626",
                          borderColor: "#fecaca",
                          background: "#fef2f2"
                        }}
                        title="Delete user account"
                      >
                        {t("Delete", "মুছুন")}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <nav
          aria-label={t("User pagination", "ব্যবহারকারী পৃষ্ঠা")}
          style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "24px", justifyContent: "center" }}
        >
          <button
            className="btn-pill-light"
            disabled={page <= 1}
            onClick={() => setPage((v) => Math.max(1, v - 1))}
          >
            &larr; {t("Previous", "আগের")}
          </button>
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--ink)" }}>
            {page} / {pagination.last_page}
          </span>
          <button
            className="btn-pill-light"
            disabled={page >= pagination.last_page}
            onClick={() => setPage((v) => v + 1)}
          >
            {t("Next", "পরের")} &rarr;
          </button>
        </nav>
      )}
    </section>
  );
}
