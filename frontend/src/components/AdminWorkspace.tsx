"use client";
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { 
  ArrowRight, 
  Building2, 
  ClipboardList, 
  ExternalLink, 
  FileClock, 
  Flag, 
  LayoutDashboard, 
  LockKeyhole, 
  Megaphone, 
  Menu, 
  Radio,
  Shield, 
  SlidersHorizontal, 
  UserRound, 
  Users, 
  X, 
  CheckCircle2,
  AlertTriangle,
  type LucideIcon 
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { AdminIdSearch } from './AdminIdSearch';
import { AdminControlCenter } from './AdminControlCenter';
import './admin-workspace.css';

type StaffRole = 'admin' | 'moderator';
type WorkspaceAction = { 
  to: string; 
  title: [string, string]; 
  detail: [string, string]; 
  icon: LucideIcon; 
  adminOnly?: boolean;
  metricKey?: keyof AdminMetrics;
};

export type AdminMetrics = {
  pending_organizations: number;
  pending_images: number;
  cases_under_review: number;
  total_cases: number;
  pending_claims: number;
  open_reports: number;
  pending_appeals: number;
  active_ads: number;
  total_users: number;
  total_businesses: number;
};

const actions: WorkspaceAction[] = [
  { 
    to: '/admin/organizations', 
    title: ['Organizations', 'প্রতিষ্ঠান'], 
    detail: ['Review listing submissions, public images and directory decisions.', 'প্রতিষ্ঠানের আবেদন, প্রকাশ্য ছবি ও ডিরেক্টরির সিদ্ধান্ত পর্যালোচনা করুন।'], 
    icon: Building2, 
    metricKey: 'pending_organizations'
  },
  { 
    to: '/moderation', 
    title: ['Cases & claims', 'কেস ও প্রতিনিধিত্বের আবেদন'], 
    detail: ['Review case evidence and publication decisions. Admins and moderators review representation claims.', 'কেসের প্রমাণ ও প্রকাশের সিদ্ধান্ত পর্যালোচনা করুন। প্রতিনিধিত্বের আবেদনও দেখা যাবে।'], 
    icon: ClipboardList,
    metricKey: 'cases_under_review'
  },
  { 
    to: '/admin/ads', 
    title: ['Advertisements & ticker', 'বিজ্ঞাপন ও টিকার'], 
    detail: ['Manage advertisement content, schedules, placement and the global ticker.', 'বিজ্ঞাপনের বিষয়বস্তু, সময়সূচি, অবস্থান ও সার্বিক টিকার নিয়ন্ত্রণ করুন।'], 
    icon: Megaphone, 
    metricKey: 'active_ads'
  },
  { 
    to: '/admin/tools', 
    title: ['Appeals & merges', 'আপিল ও একত্রীকরণ'], 
    detail: ['Review appeals and merge duplicate organization profiles with a reason.', 'আপিল পর্যালোচনা করুন ও কারণ লিখে একই প্রতিষ্ঠানের প্রোফাইল একত্র করুন।'], 
    icon: SlidersHorizontal, 
    metricKey: 'pending_appeals'
  },
  { 
    to: '/admin/users', 
    title: ['Users & permissions', 'ব্যবহারকারী ও পদবি'], 
    detail: ['Manage registered members, moderator staff, roles and access permissions.', 'নিবন্ধিত সদস্য, মডারেটর দল, ভূমিকা ও প্রবেশের অনুমতি নিয়ন্ত্রণ করুন।'], 
    icon: Users, 
    adminOnly: true,
    metricKey: 'total_users'
  },
  { 
    to: '/admin/audit', 
    title: ['Audit history', 'সিদ্ধান্তের ইতিহাস'], 
    detail: ['Inspect the recorded history of sensitive actions and staff decisions.', 'সংবেদনশীল কার্যক্রম ও কর্মীদের সিদ্ধান্তের সংরক্ষিত ইতিহাস দেখুন।'], 
    icon: FileClock, 
  },
  { 
    to: '/admin/broadcast', 
    title: ['Broadcast Notices', 'সম্প্রচার বিজ্ঞপ্তি'], 
    detail: ['Send platform-wide announcements, targeted notices, and emergency alerts to user groups.', 'প্ল্যাটফর্মব্যাপী ঘোষণা ও লক্ষ্য নির্ধারিত বিজ্ঞপ্তি পাঠান।'], 
    icon: Radio, 
  },
];

function AccessState({ title, children, loading = false }: { title: string; children?: ReactNode; loading?: boolean }) {
  return (
    <main className="staff-access-state" aria-busy={loading}>
      <Shield size={28} aria-hidden="true" />
      <h1>{title}</h1>
      <div role={loading ? 'status' : undefined}>{children}</div>
    </main>
  );
}

export function StaffWorkspace() {
  const { user, checking } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const next = `${location.pathname}${location.search}${location.hash}`;

  if (checking) {
    return (
      <AccessState title={t('Opening staff workspace', 'কর্মীদের কর্মক্ষেত্র খোলা হচ্ছে')} loading>
        <p>{t('Checking your account…', 'আপনার অ্যাকাউন্ট দেখা হচ্ছে…')}</p>
      </AccessState>
    );
  }

  if (!user) return <Navigate replace to={`/login?next=${encodeURIComponent(next)}`} />;

  if (user.role !== 'admin' && user.role !== 'moderator') {
    return (
      <AccessState title={t('Staff access required', 'কর্মীদের প্রবেশাধিকার প্রয়োজন')}>
        <p>{t('This account does not have administrator or moderator access.', 'এই অ্যাকাউন্টে অ্যাডমিন বা মডারেটরের প্রবেশাধিকার নেই।')}</p>
        <Link to="/profile?personal=1">{t('Open personal account', 'ব্যক্তিগত অ্যাকাউন্ট খুলুন')}</Link>
      </AccessState>
    );
  }

  // Moderator cannot access user management & permissions (only administrators can change roles or restrict accounts)
  const denied = user.role === 'moderator' && location.pathname === '/admin/users';

  return (
    <StaffWorkspaceShell role={user.role} name={user.name}>
      {denied ? (
        <AccessState title={t('Administrator access required', 'অ্যাডমিনের প্রবেশাধিকার প্রয়োজন')}>
          <p>{t('This control is available to administrators. You can continue reviewing cases and reported content.', 'এই নিয়ন্ত্রণটি অ্যাডমিনের জন্য। আপনি কেস ও রিপোর্ট করা বিষয়বস্তু পর্যালোচনা করতে পারেন।')}</p>
          <Link to="/moderation">{t('Open casework', 'কেস পর্যালোচনা খুলুন')}</Link>
        </AccessState>
      ) : !user.email_verified_at ? (
        <AccessState title={t('Confirm your email to continue', 'চালিয়ে যেতে ইমেইল নিশ্চিত করুন')}>
          <p>{t('Confirm the email address on your account, then sign in again to open staff controls.', 'অ্যাকাউন্টের ইমেইল ঠিকানা নিশ্চিত করে কর্মীদের নিয়ন্ত্রণ খুলতে আবার সাইন ইন করুন।')}</p>
          <div className="staff-access-links">
            <Link to="/profile?personal=1">{t('Personal account', 'ব্যক্তিগত অ্যাকাউন্ট')}</Link>
            <Link to={`/login?next=${encodeURIComponent(next)}`}>{t('Sign in again', 'আবার সাইন ইন করুন')}</Link>
          </div>
        </AccessState>
      ) : (
        <Outlet />
      )}
    </StaffWorkspaceShell>
  );
}

export function StaffWorkspaceShell({ role, name, children }: { role: StaffRole; name: string; children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const location = useLocation();
  const dialog = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const admin = role === 'admin';
  const visibleActions = actions.filter((action) => !action.adminOnly || admin);
  const identity = t(admin ? 'Administrator workspace' : 'Moderation workspace', admin ? 'অ্যাডমিনের কর্মক্ষেত্র' : 'পর্যালোচনার কর্মক্ষেত্র');

  const [securityStatus, setSecurityStatus] = useState<{ required?: boolean; verified?: boolean } | null>(null);

  useEffect(() => {
    api<{ required?: boolean; verified?: boolean }>('/security/status')
      .then(setSecurityStatus)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (drawerOpen && !dialog.current?.open) dialog.current?.showModal();
    if (!drawerOpen && dialog.current?.open) dialog.current.close();
  }, [drawerOpen]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 980px)');
    const closeOnDesktop = () => {
      if (wide.matches) setDrawerOpen(false);
    };
    wide.addEventListener('change', closeOnDesktop);
    return () => wide.removeEventListener('change', closeOnDesktop);
  }, []);

  const navigation = (
    <>
      <Link to={admin ? '/admin' : '/moderation'} className="staff-brand">
        <span>
          <Shield size={22} aria-hidden="true" />
        </span>
        <div>
          <strong>HubBD</strong>
          <small>{t('STAFF WORKSPACE', 'কর্মীদের কর্মক্ষেত্র')}</small>
        </div>
      </Link>
      <div className="staff-sidebar-role">
        {t(admin ? 'Administrator' : 'Moderator', admin ? 'অ্যাডমিন' : 'মডারেটর')}
      </div>
      <nav className="staff-navigation" aria-label={t('Staff controls', 'কর্মীদের নিয়ন্ত্রণ')}>
        <NavLink to="/admin" end>
          <LayoutDashboard size={19} aria-hidden="true" />
          <span>{t('Overview', 'সারসংক্ষেপ')}</span>
        </NavLink>
        {visibleActions.map(({ to, title, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/moderation'}>
            <Icon size={19} aria-hidden="true" />
            <span>{!admin && to === '/moderation' ? t('Casework', 'কেস পর্যালোচনা') : t(...title)}</span>
          </NavLink>
        ))}
      </nav>
      <nav className="staff-account-navigation" aria-label={t('Account and public site', 'অ্যাকাউন্ট ও প্রকাশ্য সাইট')}>
        <Link to="/security">
          <LockKeyhole size={18} aria-hidden="true" />
          {t('Account security', 'অ্যাকাউন্টের সুরক্ষা')}
        </Link>
        <Link to="/profile?personal=1">
          <UserRound size={18} aria-hidden="true" />
          {t('Personal account', 'ব্যক্তিগত অ্যাকাউন্ট')}
        </Link>
        <Link to="/">
          <ExternalLink size={18} aria-hidden="true" />
          {t('Public website', 'প্রকাশ্য ওয়েবসাইট')}
        </Link>
      </nav>
      <p className="staff-sidebar-note">
        {t(
          'Private evidence stays in staff controls. Record a reason for each decision.',
          'ব্যক্তিগত প্রমাণ কর্মীদের নিয়ন্ত্রণেই থাকে। প্রতিটি সিদ্ধান্তের কারণ লিখুন।'
        )}
      </p>
    </>
  );

  const needsMfaWarning = securityStatus?.required && !securityStatus?.verified;

  return (
    <div className="staff-workspace">
      <a className="staff-skip-link" href="#staff-content">
        {t('Skip to workspace content', 'কর্মক্ষেত্রের বিষয়বস্তুতে যান')}
      </a>
      <aside className="staff-sidebar">{navigation}</aside>
      <dialog
        ref={dialog}
        className="staff-drawer"
        aria-label={t('Staff navigation', 'কর্মীদের নেভিগেশন')}
        onClose={() => {
          setDrawerOpen(false);
          menuButton.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setDrawerOpen(false);
        }}
      >
        <div className="staff-drawer-content">
          <button
            type="button"
            className="staff-drawer-close"
            aria-label={t('Close navigation', 'নেভিগেশন বন্ধ করুন')}
            onClick={() => setDrawerOpen(false)}
          >
            <X size={22} aria-hidden="true" />
          </button>
          {navigation}
        </div>
      </dialog>
      <div className="staff-workspace-main">
        <header className="staff-topbar">
          <button
            ref={menuButton}
            type="button"
            className="staff-menu-button"
            aria-label={t('Open staff navigation', 'কর্মীদের নেভিগেশন খুলুন')}
            aria-expanded={drawerOpen}
            aria-haspopup="dialog"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          <div className="staff-topbar-identity">
            <strong>{identity}</strong>
            <span>{name}</span>
          </div>
          <div style={{ flex: 1, maxWidth: '400px', margin: '0 16px' }}>
            <AdminIdSearch />
          </div>
          <button
            type="button"
            className="staff-language-button"
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            aria-label={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          >
            {lang === 'bn' ? 'English' : 'বাংলা'}
          </button>
          <Link className="staff-topbar-security" to="/security">
            <LockKeyhole size={17} aria-hidden="true" />
            <span>{t('Security', 'সুরক্ষা')}</span>
          </Link>
        </header>

        {needsMfaWarning && (
          <div className="staff-session-notice">
            <LockKeyhole size={16} aria-hidden="true" />
            <p>
              {t(
                'Sensitive controls require confirmed email and staff verification. If your session expires, verify it in Account security.',
                'সংবেদনশীল নিয়ন্ত্রণের জন্য নিশ্চিত ইমেইল ও কর্মীদের যাচাই প্রয়োজন। সেশনের মেয়াদ শেষ হলে অ্যাকাউন্টের সুরক্ষা পৃষ্ঠায় যাচাই করুন।'
              )}
            </p>
            <Link to="/security">{t('Verify session', 'সেশন যাচাই')}</Link>
          </div>
        )}

        <main id="staff-content" className="staff-workspace-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  if (user?.role !== 'admin' && user?.role !== 'moderator') return null;
  return <AdminControlCenter />;
}

export function StaffDashboardContent({ role }: { role: StaffRole }) {
  const { t, lang } = useI18n();
  const admin = role === 'admin';
  const bn = lang === 'bn';

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    setLoadingMetrics(true);
    api<AdminMetrics>('/admin/metrics')
      .then(setMetrics)
      .catch(() => {})
      .finally(() => setLoadingMetrics(false));
  }, []);

  return (
    <div className="staff-dashboard">
      <div className="staff-dashboard-heading">
        <span>{t('OPERATIONS OVERVIEW', 'কার্যক্রমের সারসংক্ষেপ')}</span>
        <h1>
          {t(
            admin ? 'All your staff controls, in one place.' : 'Your moderation controls, in one place.',
            admin ? 'কর্মীদের সব নিয়ন্ত্রণ, এক জায়গায়।' : 'পর্যালোচনার সব নিয়ন্ত্রণ, এক জায়গায়।'
          )}
        </h1>
        <p>
          {t(
            'Choose a workspace to review submissions, inspect evidence and record decisions.',
            'আবেদন পর্যালোচনা, প্রমাণ দেখা ও সিদ্ধান্ত লেখার জন্য একটি কর্মক্ষেত্র বেছে নিন।'
          )}
        </p>
      </div>

      {/* Universal Search by ID / Keyword */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #d8cdb7',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
        }}
        aria-label={t('Universal ID Search', 'সার্বজনীন আইডি অনুসন্ধান')}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
          <div>
            <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>
              {t('Search & Lookup by ID', 'আইডি দিয়ে সরাসরি অনুসন্ধান')}
            </strong>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--slate-500)' }}>
              {t(
                'Type any Case ID (e.g. 5 or THB-2026-XYZ), Review ID (e.g. 12), Report ID, or Organization ID to open immediately.',
                'যেকোনো কেস আইডি, রিভিউ আইডি, রিপোর্ট আইডি বা প্রতিষ্ঠান আইডি দিয়ে সরাসরি খুলুন।'
              )}
            </p>
          </div>
        </div>
        <AdminIdSearch />
      </section>

      {/* KPI Metric Summary Bar */}
      {metrics && (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
            gap: '12px',
            marginBottom: '28px'
          }}
          aria-label={t('Platform operational metrics', 'প্ল্যাটফর্মের কার্যক্রমের মেট্রিক')}
        >
          <div style={{ background: '#ffffff', border: '1px solid #d8cdb7', borderRadius: '10px', padding: '14px 16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)', display: 'block', textTransform: 'uppercase' }}>
              {t('Pending Approvals', 'অপেক্ষমাণ অনুমোদন')}
            </span>
            <strong style={{ fontSize: '1.65rem', fontWeight: 800, color: metrics.pending_organizations > 0 ? '#b91c1c' : 'var(--ink)' }}>
              {metrics.pending_organizations}
            </strong>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #d8cdb7', borderRadius: '10px', padding: '14px 16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)', display: 'block', textTransform: 'uppercase' }}>
              {t('Cases Under Review', 'কেস পর্যালোচনাধীন')}
            </span>
            <strong style={{ fontSize: '1.65rem', fontWeight: 800, color: metrics.cases_under_review > 0 ? '#d97706' : 'var(--ink)' }}>
              {metrics.cases_under_review}
            </strong>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #d8cdb7', borderRadius: '10px', padding: '14px 16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)', display: 'block', textTransform: 'uppercase' }}>
              {t('Open Reports', 'খোলা রিপোর্ট')}
            </span>
            <strong style={{ fontSize: '1.65rem', fontWeight: 800, color: metrics.open_reports > 0 ? '#dc2626' : 'var(--ink)' }}>
              {metrics.open_reports}
            </strong>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #d8cdb7', borderRadius: '10px', padding: '14px 16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)', display: 'block', textTransform: 'uppercase' }}>
              {t('Active Ads', 'সক্রিয় বিজ্ঞাপন')}
            </span>
            <strong style={{ fontSize: '1.65rem', fontWeight: 800, color: '#047857' }}>
              {metrics.active_ads}
            </strong>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #d8cdb7', borderRadius: '10px', padding: '14px 16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)', display: 'block', textTransform: 'uppercase' }}>
              {t('Directory Listings', 'ডিরেক্টরি প্রতিষ্ঠান')}
            </span>
            <strong style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--ink)' }}>
              {metrics.total_businesses}
            </strong>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #d8cdb7', borderRadius: '10px', padding: '14px 16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)', display: 'block', textTransform: 'uppercase' }}>
              {t('Registered Members', 'নিবন্ধিত সদস্য')}
            </span>
            <strong style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--ink)' }}>
              {metrics.total_users}
            </strong>
          </div>
        </section>
      )}

      {/* Control Cards Grid */}
      <section className="staff-control-grid" aria-label={t('Available workspaces', 'উপলব্ধ কর্মক্ষেত্র')}>
        {actions
          .filter((action) => !action.adminOnly || admin)
          .map(({ to, title, detail, icon: Icon, metricKey }) => {
            const count = metrics && metricKey ? metrics[metricKey] : undefined;

            return (
              <Link className="staff-control-card" to={to} key={to}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <span className="staff-control-icon">
                    <Icon size={23} aria-hidden="true" />
                  </span>
                  {count !== undefined && count > 0 && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: metricKey === 'pending_organizations' || metricKey === 'open_reports' ? '#fee2e2' : '#f1f5f9',
                        color: metricKey === 'pending_organizations' || metricKey === 'open_reports' ? '#991b1b' : 'var(--ink)',
                        border: '1px solid rgba(0,0,0,0.08)'
                      }}
                    >
                      {count} {bn ? 'টি' : (metricKey === 'total_users' ? 'users' : 'pending')}
                    </span>
                  )}
                </div>
                <h2>{!admin && to === '/moderation' ? t('Casework', 'কেস পর্যালোচনা') : t(...title)}</h2>
                <p>
                  {!admin && to === '/moderation'
                    ? t(
                        'Review case evidence, request updates and record moderation decisions.',
                        'কেসের প্রমাণ দেখুন, হালনাগাদ তথ্য চান ও পর্যালোচনার সিদ্ধান্ত লিখুন।'
                      )
                    : t(...detail)}
                </p>
                <span className="staff-control-open">
                  {t('Open workspace', 'কর্মক্ষেত্র খুলুন')}
                  <ArrowRight size={17} aria-hidden="true" />
                </span>
              </Link>
            );
          })}
      </section>

      <div className="staff-dashboard-bottom">
        <section className="staff-decision-note">
          <Shield size={22} aria-hidden="true" />
          <div>
            <h2>{t('Before recording a decision', 'সিদ্ধান্ত লেখার আগে')}</h2>
            <p>
              {t(
                'Review the supporting evidence, protect personal information and record a clear reason. Platform approval is not a legal finding or a guarantee of organization quality.',
                'সহায়ক প্রমাণ দেখুন, ব্যক্তিগত তথ্য সুরক্ষিত রাখুন ও স্পষ্ট কারণ লিখুন। প্ল্যাটফর্মের অনুমোদন আইনি সিদ্ধান্ত বা প্রতিষ্ঠানের মানের নিশ্চয়তা নয়।'
              )}
            </p>
          </div>
        </section>
        <section className="staff-security-card">
          <LockKeyhole size={22} aria-hidden="true" />
          <h2>{t('Account security', 'অ্যাকাউন্টের সুরক্ষা')}</h2>
          <p>
            {t(
              'Set up your authenticator or verify an expired staff session.',
              'অথেন্টিকেটর চালু করুন বা মেয়াদ শেষ হওয়া কর্মীদের সেশন যাচাই করুন।'
            )}
          </p>
          <Link to="/security">
            {t('Open account security', 'অ্যাকাউন্টের সুরক্ষা খুলুন')}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
