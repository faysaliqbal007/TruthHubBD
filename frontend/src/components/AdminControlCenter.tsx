"use client";
import React, { useEffect, useState, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2,
  ShieldAlert,
  Flag,
  ClipboardList,
  Megaphone,
  Radio,
  Users,
  Search,
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  Loader2,
  RefreshCw,
  Plus,
  Send,
  Lock,
  Star,
  FileText,
  BadgeCheck,
  Check,
  ShieldCheck,
  UploadCloud,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import { formatDate, translateCategory } from '../i18n/dictionary';
import { AdminOrganizationEdit } from './AdminOrganizationEdit';
import { BroadcastNoticePanel } from './BroadcastNoticePanel';
import { AdminUsersDesk } from './AdminUsersDesk';
import { AdminIdSearch } from './AdminIdSearch';
import { ClaimEvidenceModal } from './ClaimEvidenceModal';

type TabKey = 'organizations' | 'reviews' | 'cases' | 'claims' | 'reports' | 'broadcast' | 'users';

type OrgItem = {
  id: number;
  slug: string;
  name: string;
  bengaliName?: string;
  category: string;
  location?: string;
  phone?: string;
  website?: string;
  image?: string;
  verified: boolean;
  status: string;
  operatingStatus: string;
  rating: number;
  reviewCount: number;
  createdAt?: string;
};

type ReviewItem = {
  id: number;
  title: string;
  body: string;
  rating: number;
  status: string;
  author?: string;
  business?: { id: number; name: string; slug: string };
  linked_case?: {
    id: number;
    case_code: string;
    status: string;
    alert_enabled: boolean;
    admin_reviewed: boolean;
  } | null;
  created_at?: string;
};

type CaseItem = {
  id: number;
  case_code: string;
  title: string;
  summary: string;
  status: string;
  amount?: number;
  incident_type?: string;
  admin_reviewed?: boolean;
  alert_enabled?: boolean;
  alert_requested?: boolean;
  created_at?: string;
  business?: { id: number; name: string; slug: string };
  reporter?: { id: number; name: string; email: string };
};

type ClaimItem = {
  id: number;
  business_id: number;
  user_id: number;
  representative_name: string;
  role_title: string;
  contact_phone: string;
  contact_email: string;
  business_address: string;
  document_type: string;
  status: string;
  has_evidence: boolean;
  has_photo: boolean;
  created_at: string;
  business?: { id: number; name: string; slug: string; verified: boolean };
  user?: { id: number; name: string; email: string };
};

type ReportItem = {
  id: number;
  reporter_user_id: number;
  reportable_type: string;
  reportable_id: number;
  reason: string;
  details?: string;
  status: string;
  admin_response?: string;
  admin_responded_at?: string;
  created_at: string;
  reporter?: { id: number; name: string; email: string };
};

type AdminMetrics = {
  pending_organizations: number;
  cases_under_review: number;
  open_reports: number;
  pending_claims: number;
  total_users: number;
  total_businesses: number;
};

export function AdminControlCenter() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const bn = lang === 'bn';
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'admin' || user?.role === 'moderator';

  // Active Tab: from URL or default to 'organizations'
  const currentTab = (searchParams.get('tab') as TabKey) || 'organizations';
  const activeTab: TabKey = (!isAdmin && currentTab === 'users') ? 'organizations' : currentTab;

  const setActiveTab = (tab: TabKey) => {
    setSearchParams({ tab });
  };

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: boolean; message: string } | null>(null);

  // Edit organization modal state
  const [editingOrgId, setEditingOrgId] = useState<number | null>(null);

  // TAB 1: Organizations State
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [orgSearch, setOrgSearch] = useState('');
  const [orgStatus, setOrgStatus] = useState<string>('all');
  const [orgCategory, setOrgCategory] = useState<string>('all');
  const [orgPage, setOrgPage] = useState(1);
  const [orgTotalPages, setOrgTotalPages] = useState(1);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // TAB 2: Reviews & Alerts State
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [loadingReviews, setLoadingReviews] = useState(false);

  // TAB 3: Scam Cases State
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [caseStatusFilter, setCaseStatusFilter] = useState('all');
  const [caseSearch, setCaseSearch] = useState('');
  const [loadingCases, setLoadingCases] = useState(false);

  // TAB 4: Business Claims State
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [claimStatusFilter, setClaimStatusFilter] = useState('submitted');
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [claimNotes, setClaimNotes] = useState<Record<number, string>>({});
  const [evidenceModal, setEvidenceModal] = useState<{
    isOpen: boolean;
    claimId: number;
    kind: 'proof' | 'photo';
    businessName: string;
    representativeName?: string;
    roleTitle?: string;
    contactInfo?: string;
  }>({
    isOpen: false,
    claimId: 0,
    kind: 'proof',
    businessName: '',
  });

  const formatDocumentType = (type?: string) => {
    if (!type) return t('Official Authority Document', 'অফিসিয়াল প্রতিনিধির প্রমাণপত্র');
    const labels: Record<string, { en: string; bn: string }> = {
      trade_license: { en: 'Trade License', bn: 'ট্রেড লাইসেন্স' },
      registration: { en: 'Business Registration / Certificate', bn: 'ব্যবসা নিবন্ধন / সনদ' },
      authorization: { en: 'Official Company Authorization Letter', bn: 'কোম্পানি প্রত্যয়নপত্র / অথরাইজেশন' },
      tax_tin_bin: { en: 'TIN / BIN Registration', bn: 'টিন / বিন সনদ' },
      utility_bill: { en: 'Commercial Utility Bill', bn: 'বাণিজ্যিক ইউটিলিটি বিল' },
      national_id: { en: 'National ID / Official ID', bn: 'জাতীয় পরিচয়পত্র / অফিশিয়াল আইডি' },
    };
    const item = labels[type];
    if (item) return t(item.en, item.bn);
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // TAB 5: Citizen Reports State
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState('open');
  const [reportTypeFilter, setReportTypeFilter] = useState<'all' | 'business' | 'review' | 'scam_case' | 'comment'>('all');
  const [loadingReports, setLoadingReports] = useState(false);
  const [replyReportId, setReplyReportId] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Initial load: metrics
  const loadMetrics = () => {
    api<AdminMetrics>('/admin/metrics').then(setMetrics).catch(() => {});
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  // 1. Fetch Organizations
  const fetchOrgs = () => {
    setLoadingOrgs(true);
    const params = new URLSearchParams({
      page: String(orgPage),
      per_page: '20',
      status: orgStatus,
      category: orgCategory,
      ...(orgSearch.trim() ? { q: orgSearch.trim() } : {})
    });
    api<{ data: OrgItem[]; pagination?: { last_page: number } }>(`/admin/businesses?${params.toString()}`)
      .then((res) => {
        setOrgs(res.data || []);
        if (res.pagination) setOrgTotalPages(res.pagination.last_page);
      })
      .catch((err) => {
        // Fallback to public businesses if allBusinesses not responding
        api<{ data: any[] }>(`/businesses?limit=25`)
          .then((fallbackRes) => {
            const mapped = (fallbackRes.data || []).map((b) => ({
              id: b.id,
              slug: b.slug,
              name: b.name,
              bengaliName: b.bengaliName,
              category: b.category,
              location: b.location,
              phone: b.phone,
              website: b.website,
              image: b.image,
              verified: Boolean(b.verified),
              status: b.status || 'approved',
              operatingStatus: b.operatingStatus || 'open',
              rating: b.rating || 0,
              reviewCount: b.reviewCount || 0,
            }));
            setOrgs(mapped);
          })
          .catch(() => {});
      })
      .finally(() => setLoadingOrgs(false));
  };

  useEffect(() => {
    if (activeTab === 'organizations') {
      fetchOrgs();
    }
  }, [activeTab, orgPage, orgStatus, orgCategory, orgSearch]);

  // 2. Fetch Reviews for Alerts / Moderation
  const fetchReviews = () => {
    setLoadingReviews(true);
    api<{ data: ReviewItem[] }>(`/reviews?per_page=30`)
      .then((res) => setReviews(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  };

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab]);

  // 3. Fetch Scam Cases
  const fetchCases = () => {
    setLoadingCases(true);
    const params = new URLSearchParams({
      status: caseStatusFilter,
      per_page: '30',
      ...(caseSearch.trim() ? { q: caseSearch.trim() } : {})
    });
    api<{ data: CaseItem[] }>(`/moderation/scam-cases?${params.toString()}`)
      .then((res) => setCases(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingCases(false));
  };

  useEffect(() => {
    if (activeTab === 'cases') {
      fetchCases();
    }
  }, [activeTab, caseStatusFilter, caseSearch]);

  // 4. Fetch Claims
  const fetchClaims = () => {
    setLoadingClaims(true);
    api<{ data: ClaimItem[] }>(`/admin/business-claims?status=${claimStatusFilter}`)
      .then((res) => setClaims(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingClaims(false));
  };

  useEffect(() => {
    if (activeTab === 'claims') {
      fetchClaims();
    }
  }, [activeTab, claimStatusFilter]);

  // 5. Fetch Reports
  const fetchReports = () => {
    setLoadingReports(true);
    api<{ data: ReportItem[] }>(`/moderation/reports?status=${reportStatusFilter}`)
      .then((res) => setReports(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingReports(false));
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab, reportStatusFilter]);

  /* ================= ACTION HANDLERS ================= */

  // Delete Organization
  const handleDeleteOrganization = async (id: number, name: string) => {
    const promptText = bn
      ? `আপনি কি নিশ্চিতভাবে "${name}" প্রতিষ্ঠানটি স্থায়ীভাবে মুছে ফেলতে চান? এর সমস্ত রিভিউ, ফটো এবং রেকর্ড মুছে যাবে।`
      : `Are you sure you want to permanently delete organization "${name}" (#${id})? This cannot be undone.`;
    if (!window.confirm(promptText)) return;

    setBusy(true);
    setFeedback(null);
    try {
      const res = await api<{ message: string }>(`/admin/businesses/${id}`, 'DELETE');
      setFeedback({ error: false, message: res.message || 'Organization permanently deleted.' });
      setOrgs((prev) => prev.filter((o) => o.id !== id));
      loadMetrics();
    } catch (err) {
      setFeedback({ error: true, message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  // Delete Review
  const handleDeleteReview = async (id: number) => {
    const promptText = bn
      ? `আপনি কি নিশ্চিতভাবে রিভিউ #${id} স্থায়ীভাবে মুছে ফেলতে চান?`
      : `Permanently delete review #${id}? This action cannot be undone.`;
    if (!window.confirm(promptText)) return;

    setBusy(true);
    setFeedback(null);
    try {
      const res = await api<{ message: string }>(`/admin/reviews/${id}`, 'DELETE');
      setFeedback({ error: false, message: res.message || 'Review permanently deleted.' });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      loadMetrics();
    } catch (err) {
      setFeedback({ error: true, message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  // Toggle Alert on Review / Case
  const handleToggleAlert = async (caseId: number, enable: boolean) => {
    setBusy(true);
    setFeedback(null);
    try {
      await api(`/admin/scam-cases/${caseId}/alert`, 'PATCH', { alert_enabled: enable });
      setFeedback({
        error: false,
        message: enable
          ? t('Civic alert activated and broadcast to users.', 'সতর্কতা সক্রিয় করা হয়েছে এবং ব্যবহারকারীদের পাঠানো হয়েছে।')
          : t('Civic alert rejected / disabled.', 'সতর্কতা বাতিল বা নিষ্ক্রিয় করা হয়েছে।')
      });
      // update state
      setReviews((prev) =>
        prev.map((r) => {
          if (r.linked_case && r.linked_case.id === caseId) {
            return { ...r, linked_case: { ...r.linked_case, alert_enabled: enable } };
          }
          return r;
        })
      );
      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, alert_enabled: enable } : c))
      );
    } catch (err) {
      setFeedback({ error: true, message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  // Delete Scam Case
  const handleDeleteCase = async (id: number, code: string) => {
    const promptText = bn
      ? `আপনি কি নিশ্চিতভাবে কেস #${code || id} স্থায়ীভাবে মুছে ফেলতে চান?`
      : `Permanently delete case #${code || id}? This cannot be undone.`;
    if (!window.confirm(promptText)) return;

    setBusy(true);
    setFeedback(null);
    try {
      const res = await api<{ message: string }>(`/admin/scam-cases/${id}`, 'DELETE');
      setFeedback({ error: false, message: res.message || 'Case permanently deleted.' });
      setCases((prev) => prev.filter((c) => c.id !== id));
      loadMetrics();
    } catch (err) {
      setFeedback({ error: true, message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  // Decide Business Claim (Approve / Reject)
  const handleDecideClaim = async (claimId: number, status: 'approved' | 'rejected') => {
    const note = (claimNotes[claimId] || '').trim();
    if (note.length < 5) {
      alert(bn ? 'সিদ্ধান্তের কারণ হিসেবে অন্তত ৫টি অক্ষর লিখুন।' : 'Please provide a decision note of at least 5 characters.');
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      await api(`/admin/business-claims/${claimId}`, 'PATCH', { status, decision_note: note });
      setFeedback({
        error: false,
        message: status === 'approved'
          ? t('Claim approved! Ownership assigned and organization verified.', 'দাবি অনুমোদিত হয়েছে! মালিকানা হস্তান্তর এবং প্রতিষ্ঠান ভেরিফাই হয়েছে।')
          : t('Claim rejected.', 'দাবি প্রত্যাখ্যান করা হয়েছে।')
      });
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
      loadMetrics();
    } catch (err) {
      setFeedback({ error: true, message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  // Send Private Response to Reporter
  const handleSendReportResponse = async (reportId: number) => {
    if (!replyMessage.trim()) return;
    setBusy(true);
    setFeedback(null);
    try {
      await api(`/moderation/reports/${reportId}/respond`, 'POST', { message: replyMessage.trim() });
      setFeedback({
        error: false,
        message: t('Private response sent successfully to the reporting citizen.', 'নাগরিকের কাছে ব্যক্তিগত উত্তর সফলভাবে পাঠানো হয়েছে।')
      });
      setReplyReportId(null);
      setReplyMessage('');
      fetchReports();
    } catch (err) {
      setFeedback({ error: true, message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  // Close / Resolve Report
  const handleCloseReport = async (reportId: number, status: 'resolved' | 'dismissed') => {
    setBusy(true);
    setFeedback(null);
    try {
      await api(`/moderation/reports/${reportId}`, 'PATCH', { status, decision_note: `Report marked as ${status} by staff.` });
      setFeedback({ error: false, message: `Report #${reportId} has been marked as ${status}.` });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      loadMetrics();
    } catch (err) {
      setFeedback({ error: true, message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-control-center" style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 20px 48px' }}>
      {/* Top Banner / Heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b91c1c', display: 'block', marginBottom: 4 }}>
            {isAdmin ? t('UNIFIED ADMINISTRATOR COMMAND CENTER', 'সম্মিলিত অ্যাডমিন কমান্ড সেন্টার') : t('STAFF MODERATION COMMAND DESK', 'স্টাফ মডারেশন কমান্ড ডেস্ক')}
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {t('Control Hub & Operations', 'নিয়ন্ত্রণ হাব ও কার্যক্রম')}
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--slate-500)' }}>
            {t(
              'Manage all organizations, inspect reviews, set/reject alerts, review claims, send private replies to reports, and broadcast notices.',
              'প্রতিষ্ঠানের তথ্য সম্পাদনা ও ডিলিট, রিভিউ অ্যালার্ট চালু বা প্রত্যাখ্যান, প্রতিনিধিত্বের দাবি ও রিপোর্টের উত্তর পাঠানো নিয়ন্ত্রণ করুন।'
            )}
          </p>
        </div>

        {/* Universal ID lookup box */}
        <div style={{ minWidth: 280, maxWidth: 360, width: '100%' }}>
          <AdminIdSearch />
        </div>
      </div>

      {/* KPI Metric Overview */}
      {metrics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
            marginBottom: 20
          }}
        >
          <div
            onClick={() => setActiveTab('organizations')}
            style={{
              background: '#ffffff',
              border: activeTab === 'organizations' ? '2px solid #0f766e' : '1px solid #d8cdb7',
              borderRadius: 8,
              padding: '10px 14px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', display: 'block' }}>
              {t('Directory Listings', 'ডিরেক্টরি প্রতিষ্ঠান')}
            </span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }}>
              {metrics.total_businesses}
            </strong>
          </div>

          <div
            onClick={() => setActiveTab('cases')}
            style={{
              background: '#ffffff',
              border: activeTab === 'cases' ? '2px solid #0f766e' : '1px solid #d8cdb7',
              borderRadius: 8,
              padding: '10px 14px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', display: 'block' }}>
              {t('Cases Under Review', 'কেস পর্যালোচনা')}
            </span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: metrics.cases_under_review > 0 ? '#d97706' : 'var(--ink)' }}>
              {metrics.cases_under_review}
            </strong>
          </div>

          <div
            onClick={() => setActiveTab('claims')}
            style={{
              background: '#ffffff',
              border: activeTab === 'claims' ? '2px solid #0f766e' : '1px solid #d8cdb7',
              borderRadius: 8,
              padding: '10px 14px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', display: 'block' }}>
              {t('Pending Claims', 'অপেক্ষমাণ দাবি')}
            </span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: metrics.pending_claims > 0 ? '#b91c1c' : 'var(--ink)' }}>
              {metrics.pending_claims}
            </strong>
          </div>

          <div
            onClick={() => setActiveTab('reports')}
            style={{
              background: '#ffffff',
              border: activeTab === 'reports' ? '2px solid #0f766e' : '1px solid #d8cdb7',
              borderRadius: 8,
              padding: '10px 14px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', display: 'block' }}>
              {t('Open Reports', 'খোলা রিপোর্ট')}
            </span>
            <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: metrics.open_reports > 0 ? '#dc2626' : 'var(--ink)' }}>
              {metrics.open_reports}
            </strong>
          </div>

          {isAdmin && (
            <div
              onClick={() => setActiveTab('users')}
              style={{
                background: '#ffffff',
                border: activeTab === 'users' ? '2px solid #0f766e' : '1px solid #d8cdb7',
                borderRadius: 8,
                padding: '10px 14px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', display: 'block' }}>
                {t('Total Users', 'মোট সদস্য')}
              </span>
              <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }}>
                {metrics.total_users}
              </strong>
            </div>
          )}
        </div>
      )}

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16,
            background: feedback.error ? '#fef2f2' : '#ecfdf5',
            border: `1px solid ${feedback.error ? '#fca5a5' : '#a7f3d0'}`,
            color: feedback.error ? '#991b1b' : '#065f46',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13.5,
            fontWeight: 600
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {feedback.error ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Master Tabs Bar */}
      <nav
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          borderBottom: '2px solid #eae0ce',
          marginBottom: 20,
          background: '#ffffff',
          padding: '6px 8px 0',
          borderRadius: '8px 8px 0 0'
        }}
        aria-label="Admin Control Tabs"
      >
        <button
          type="button"
          onClick={() => setActiveTab('organizations')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'organizations' ? '3px solid #0f766e' : '3px solid transparent',
            color: activeTab === 'organizations' ? '#0f766e' : 'var(--slate-600)',
            fontWeight: activeTab === 'organizations' ? 800 : 600,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Building2 size={16} />
          <span>{t('Organizations & Edit/Delete', 'প্রতিষ্ঠান নিয়ন্ত্রণ')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'reviews' ? '3px solid #0f766e' : '3px solid transparent',
            color: activeTab === 'reviews' ? '#0f766e' : 'var(--slate-600)',
            fontWeight: activeTab === 'reviews' ? 800 : 600,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <ShieldAlert size={16} />
          <span>{t('Reviews & Alert Controls', 'রিভিউ ও অ্যালার্ট')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cases')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'cases' ? '3px solid #0f766e' : '3px solid transparent',
            color: activeTab === 'cases' ? '#0f766e' : 'var(--slate-600)',
            fontWeight: activeTab === 'cases' ? 800 : 600,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <ClipboardList size={16} />
          <span>{t('Scam Cases', 'স্ক্যাম কেস')}</span>
          {metrics && metrics.cases_under_review > 0 && (
            <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 99 }}>
              {metrics.cases_under_review}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('claims')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'claims' ? '3px solid #0f766e' : '3px solid transparent',
            color: activeTab === 'claims' ? '#0f766e' : 'var(--slate-600)',
            fontWeight: activeTab === 'claims' ? 800 : 600,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <BadgeCheck size={16} />
          <span>{t('Claims Queue', 'দাবি অনুমোদন')}</span>
          {metrics && metrics.pending_claims > 0 && (
            <span style={{ fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: 99 }}>
              {metrics.pending_claims}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'reports' ? '3px solid #0f766e' : '3px solid transparent',
            color: activeTab === 'reports' ? '#0f766e' : 'var(--slate-600)',
            fontWeight: activeTab === 'reports' ? 800 : 600,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Flag size={16} />
          <span>{t('Citizen Reports & Replies', 'রিপোর্ট ও উত্তর')}</span>
          {metrics && metrics.open_reports > 0 && (
            <span style={{ fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: 99 }}>
              {metrics.open_reports}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcast')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'broadcast' ? '3px solid #0f766e' : '3px solid transparent',
            color: activeTab === 'broadcast' ? '#0f766e' : 'var(--slate-600)',
            fontWeight: activeTab === 'broadcast' ? 800 : 600,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Radio size={16} />
          <span>{t('Broadcast Notices', 'সম্প্রচার বিজ্ঞপ্তি')}</span>
        </button>

        {/* Administrator only: Users & Permissions */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'users' ? '3px solid #b91c1c' : '3px solid transparent',
              color: activeTab === 'users' ? '#b91c1c' : 'var(--slate-600)',
              fontWeight: activeTab === 'users' ? 800 : 600,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Users size={16} />
            <span>{t('Users & Permissions', 'ব্যবহারকারী ও পদবি')}</span>
          </button>
        )}
      </nav>

      {/* ============================================================== */}
      {/* TAB 1: ORGANIZATIONS DIRECTORY & EDIT/DELETE                   */}
      {/* ============================================================== */}
      {activeTab === 'organizations' && (
        <section aria-label="Organizations Management">
          {/* Controls bar: search, category, status */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 16,
              background: '#ffffff',
              padding: '14px 16px',
              borderRadius: 8,
              border: '1px solid #d8cdb7'
            }}
          >
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--slate-400)' }} />
              <input
                type="search"
                placeholder={t('Search by organization name, slug, ID or phone…', 'প্রতিষ্ঠান নাম, আইডি বা ফোন দিয়ে খুঁজুন…')}
                value={orgSearch}
                onChange={(e) => { setOrgSearch(e.target.value); setOrgPage(1); }}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  border: '1px solid #d8cdb7',
                  borderRadius: 6,
                  fontSize: 13.5
                }}
              />
            </div>

            <select
              value={orgStatus}
              onChange={(e) => { setOrgStatus(e.target.value); setOrgPage(1); }}
              style={{ padding: '9px 12px', border: '1px solid #d8cdb7', borderRadius: 6, fontSize: 13.5, background: '#fff' }}
            >
              <option value="all">{t('All Statuses', 'সব স্ট্যাটাস')}</option>
              <option value="approved">{t('Approved', 'অনুমোদিত')}</option>
              <option value="pending">{t('Pending Submissions', 'অপেক্ষমাণ আবেদন')}</option>
              <option value="rejected">{t('Rejected', 'প্রত্যাখ্যাত')}</option>
            </select>

            <select
              value={orgCategory}
              onChange={(e) => { setOrgCategory(e.target.value); setOrgPage(1); }}
              style={{ padding: '9px 12px', border: '1px solid #d8cdb7', borderRadius: 6, fontSize: 13.5, background: '#fff' }}
            >
              <option value="all">{t('All Categories', 'সব বিভাগ')}</option>
              <option value="Products">Products</option>
              <option value="Businesses & Services">Businesses & Services</option>
              <option value="Doctors & Professionals">Doctors & Professionals</option>
              <option value="Hospitals & Clinics">Hospitals & Clinics</option>
              <option value="Universities & Education">Universities & Education</option>
              <option value="Courier & Digital Services">Courier & Digital Services</option>
            </select>

            <button
              type="button"
              className="btn-pill-light"
              onClick={fetchOrgs}
              disabled={loadingOrgs}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={loadingOrgs ? 'spin' : ''} />
              <span>{t('Refresh', 'রিফ্রেশ')}</span>
            </button>
          </div>

          {/* Organizations Table / Cards */}
          {loadingOrgs ? (
            <p role="status" style={{ textAlign: 'center', padding: 30, color: 'var(--slate-500)' }}>
              <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
              {t('Loading organizations…', 'প্রতিষ্ঠান তালিকা লোড হচ্ছে…')}
            </p>
          ) : orgs.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #d8cdb7', borderRadius: 8, padding: 36, textAlign: 'center' }}>
              <Building2 size={32} color="var(--slate-400)" style={{ margin: '0 auto 10px' }} />
              <h3>{t('No organizations found', 'কোনো প্রতিষ্ঠান পাওয়া যায়নি')}</h3>
              <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>
                {t('Try adjusting your search keyword or status filter.', 'অনুসন্ধান বা স্ট্যাটাস পরিবর্তন করে আবার চেষ্টা করুন।')}
              </p>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #d8cdb7', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#fdfbf7', borderBottom: '1px solid #eae0ce', color: 'var(--slate-500)', fontSize: 12, textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>{t('Organization', 'প্রতিষ্ঠান')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('Category & Area', 'বিভাগ ও এলাকা')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('Status', 'অবস্থা')}</th>
                      <th style={{ padding: '12px 16px' }}>{t('Reviews', 'রিভিউ')}</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>{t('Actions', 'পদক্ষেপ')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map((o) => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {/* Name & Photo */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {o.image ? (
                              <img
                                src={o.image.startsWith('http') || o.image.startsWith('/') ? o.image : '/' + o.image}
                                alt={o.name}
                                style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', border: '1px solid #eae0ce' }}
                              />
                            ) : (
                              <div style={{ width: 40, height: 40, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                <Building2 size={20} />
                              </div>
                            )}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <strong style={{ color: 'var(--ink)', fontSize: 13.5 }}>{o.name}</strong>
                                {o.verified && (
                                  <span title="Verified" style={{ color: '#0f766e', display: 'inline-flex' }}>
                                    <BadgeCheck size={14} fill="#0f766e" color="#fff" />
                                  </span>
                                )}
                              </div>
                              {o.bengaliName && (
                                <span style={{ fontSize: 12, color: 'var(--slate-500)', display: 'block' }}>
                                  {o.bengaliName}
                                </span>
                              )}
                              <small style={{ color: 'var(--slate-400)', fontSize: 11 }}>ID #{o.id}</small>
                            </div>
                          </div>
                        </td>

                        {/* Category & Location */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{translateCategory(o.category, lang)}</span>
                          <small style={{ display: 'block', color: 'var(--slate-500)', marginTop: 2 }}>
                            {o.location || '—'}
                          </small>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background:
                                o.status === 'approved' ? '#ecfdf5' : o.status === 'pending' ? '#fef3c7' : '#fee2e2',
                              color:
                                o.status === 'approved' ? '#065f46' : o.status === 'pending' ? '#92400e' : '#991b1b'
                            }}
                          >
                            {(o.status || 'approved').toUpperCase()}
                          </span>
                        </td>

                        {/* Rating & Reviews */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star size={13} fill="#f59e0b" color="#f59e0b" />
                            <strong style={{ fontSize: 13 }}>{o.rating ? o.rating.toFixed(1) : '0.0'}</strong>
                            <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>({o.reviewCount || 0})</span>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setEditingOrgId(o.id)}
                              className="btn-pill-light"
                              style={{ padding: '5px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              title={t('Edit Organization Info & Image', 'তথ্য ও ছবি সম্পাদনা করুন')}
                            >
                              <Edit size={13} />
                              <span>{t('Edit', 'সম্পাদনা')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteOrganization(o.id, o.name)}
                              disabled={busy}
                              className="btn-pill-light"
                              style={{ padding: '5px 10px', fontSize: 12, color: '#dc2626', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              title={t('Permanently Delete Organization', 'প্রতিষ্ঠান স্থায়ীভাবে ডিলিট করুন')}
                            >
                              <Trash2 size={13} />
                              <span>{t('Delete', 'ডিলিট')}</span>
                            </button>

                            <a
                              href={`/business/${o.slug || o.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-pill-light"
                              style={{ padding: '5px 8px', fontSize: 12, display: 'inline-flex', alignItems: 'center' }}
                              title={t('Open Public View', 'পাবলিক পেজ দেখুন')}
                            >
                              <ExternalLink size={13} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {orgTotalPages > 1 && (
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center', borderTop: '1px solid #eae0ce' }}>
                  <button
                    className="btn-pill-light"
                    disabled={orgPage <= 1}
                    onClick={() => setOrgPage((p) => Math.max(1, p - 1))}
                  >
                    {t('Previous', 'আগের')}
                  </button>
                  <span style={{ fontSize: 13, color: 'var(--slate-600)' }}>
                    {orgPage} / {orgTotalPages}
                  </span>
                  <button
                    className="btn-pill-light"
                    disabled={orgPage >= orgTotalPages}
                    onClick={() => setOrgPage((p) => p + 1)}
                  >
                    {t('Next', 'পরের')}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 2: REVIEWS & ALERT CONTROLS                                */}
      {/* ============================================================== */}
      {activeTab === 'reviews' && (
        <section aria-label="Reviews and Alerts">
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--slate-600)' }}>
              {t(
                'Inspect community reviews, verify and broadcast civic scam alerts, or permanently remove violating reviews.',
                'নাগরিকদের রিভিউগুলো যাচাই করুন, প্রতারণার সতর্কতা প্ল্যাটফর্মে সম্প্রচার করুন অথবা অনুপযুক্ত রিভিউ স্থায়ীভাবে মুছে ফেলুন।'
              )}
            </p>

            <button
              type="button"
              className="btn-pill-light"
              onClick={fetchReviews}
              disabled={loadingReviews}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={loadingReviews ? 'spin' : ''} />
              <span>{t('Refresh', 'রিফ্রেশ')}</span>
            </button>
          </div>

          {/* Search bar for reviews */}
          <div style={{ marginBottom: 16, background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #d8cdb7', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Search size={16} color="var(--slate-400)" />
            <input
              type="search"
              placeholder={t('Search reviews by ID, title, organization or author…', 'আইডি, শিরোনাম, প্রতিষ্ঠান বা লেখকের নাম দিয়ে রিভিউ খুঁজুন…')}
              value={reviewSearch}
              onChange={(e) => setReviewSearch(e.target.value)}
              className="review-input"
              style={{ margin: 0, flex: 1, border: 'none', padding: '4px 0', background: 'transparent' }}
            />
            {reviewSearch && (
              <button
                type="button"
                onClick={() => setReviewSearch('')}
                style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', fontSize: 12 }}
              >
                ✕ {t('Clear', 'মুছুন')}
              </button>
            )}
          </div>

          {loadingReviews ? (
            <p role="status" style={{ textAlign: 'center', padding: 30, color: 'var(--slate-500)' }}>
              <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
              {t('Loading reviews…', 'রিভিউ লোড হচ্ছে…')}
            </p>
          ) : reviews.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #d8cdb7', borderRadius: 8, padding: 36, textAlign: 'center' }}>
              <Star size={32} color="var(--slate-400)" style={{ margin: '0 auto 10px' }} />
              <h3>{t('No reviews found', 'কোনো রিভিউ পাওয়া যায়নি')}</h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {reviews
                .filter((r) => {
                  if (!reviewSearch.trim()) return true;
                  const q = reviewSearch.toLowerCase();
                  return (
                    String(r.id).includes(q) ||
                    r.title?.toLowerCase().includes(q) ||
                    r.author?.toLowerCase().includes(q) ||
                    r.business?.name?.toLowerCase().includes(q)
                  );
                })
                .map((r) => {
                const hasCase = Boolean(r.linked_case);
                const isAlertOn = Boolean(r.linked_case?.alert_enabled);

                return (
                  <article
                    key={r.id}
                    style={{
                      background: '#ffffff',
                      border: isAlertOn ? '2px solid #ef4444' : '1px solid #d8cdb7',
                      borderRadius: 10,
                      padding: '18px 22px',
                      boxShadow: isAlertOn ? '0 4px 14px rgba(239, 68, 68, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, background: '#f5eedb', padding: '3px 9px', borderRadius: 5, color: 'var(--ink)' }}>
                            Review #{r.id}
                          </span>
                          {r.business && (
                            <Link
                              to={`/business/${r.business.slug || r.business.id}`}
                              target="_blank"
                              style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal-primary)', textDecoration: 'none' }}
                            >
                              {r.business.name}
                            </Link>
                          )}
                          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#fef3c7', padding: '2px 8px', borderRadius: 4, color: '#b45309', fontWeight: 700, fontSize: 12 }}>
                            <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ marginRight: 3 }} /> {r.rating} / 5
                          </div>
                        </div>

                        <h3 style={{ margin: '8px 0 3px', fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>
                          {r.title}
                        </h3>
                        {r.author && <small style={{ color: 'var(--slate-500)', fontSize: 12 }}>{t('Author:', 'লেখক:')} {r.author}</small>}
                      </div>

                      {/* Prominent Alert Badge */}
                      {hasCase && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 800,
                              padding: '4px 12px',
                              borderRadius: 9999,
                              background: isAlertOn ? '#dc2626' : '#fffbeb',
                              color: isAlertOn ? '#ffffff' : '#b45309',
                              border: `1.5px solid ${isAlertOn ? '#b91c1c' : '#f59e0b'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              letterSpacing: '0.02em'
                            }}
                          >
                            <ShieldAlert size={14} color={isAlertOn ? '#ffffff' : '#b45309'} />
                            {isAlertOn ? t('🚨 ACTIVE SCAM ALERT', '🚨 সক্রিয় প্রতারণা সতর্কতা') : t('⚠️ ALERT REQUESTED', '⚠️ সতর্কতা আবেদন')}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                            Case: <strong>{r.linked_case?.case_code}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    <p style={{ margin: '10px 0 16px', fontSize: 13.5, lineHeight: 1.6, color: 'var(--slate-700)', background: '#fdfbf7', padding: '12px 16px', borderRadius: 8, border: '1px solid #eae0ce' }}>
                      {r.body}
                    </p>

                    {/* Bottom Actions Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Civic Alert Broadcast Controls */}
                        {hasCase && (
                          <>
                            {!isAlertOn ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleToggleAlert(r.linked_case!.id, true)}
                                style={{
                                  background: '#059669',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: 7,
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  padding: '7px 14px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                <CheckCircle2 size={14} />
                                {t('Approve & Broadcast Scam Alert', 'অনুমোদন ও সতর্কতা জারি')}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleToggleAlert(r.linked_case!.id, false)}
                                style={{
                                  background: '#ffffff',
                                  color: '#b91c1c',
                                  border: '1px solid #fca5a5',
                                  borderRadius: 7,
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  padding: '6px 14px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                <X size={14} />
                                {t('Deactivate Scam Alert', 'সতর্কতা প্রত্যাহার করুন')}
                              </button>
                            )}
                          </>
                        )}

                        <a
                          href={`/reviews/${r.id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 12.5, color: 'var(--teal-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
                        >
                          {t('Open Public View', 'পাবলিক পেজ')} <ExternalLink size={12} />
                        </a>
                      </div>

                      {/* Prominent Delete Button */}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDeleteReview(r.id)}
                        style={{
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1.5px solid #fca5a5',
                          borderRadius: 9999,
                          fontSize: 12.5,
                          fontWeight: 700,
                          padding: '7px 16px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dc2626';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fef2f2';
                          e.currentTarget.style.color = '#dc2626';
                        }}
                      >
                        <Trash2 size={14} />
                        <span>{t('Delete Review Permanently', 'রিভিউ সম্পূর্ণ মুছে ফেলুন')}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 3: SCAM CASES & MODERATION                                 */}
      {/* ============================================================== */}
      {activeTab === 'cases' && (
        <section aria-label="Scam Cases Management">
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 16,
              background: '#ffffff',
              padding: '14px 16px',
              borderRadius: 8,
              border: '1px solid #d8cdb7'
            }}
          >
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--slate-400)' }} />
              <input
                type="search"
                placeholder={t('Search by Case Code (e.g. THB-2026-...) or title…', 'কেস কোড বা শিরোনাম দিয়ে খুঁজুন…')}
                value={caseSearch}
                onChange={(e) => setCaseSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  border: '1px solid #d8cdb7',
                  borderRadius: 6,
                  fontSize: 13.5
                }}
              />
            </div>

            <select
              value={caseStatusFilter}
              onChange={(e) => setCaseStatusFilter(e.target.value)}
              style={{ padding: '9px 12px', border: '1px solid #d8cdb7', borderRadius: 6, fontSize: 13.5, background: '#fff' }}
            >
              <option value="all">{t('All Case Statuses', 'সব কেস স্ট্যাটাস')}</option>
              <option value="under_review">{t('Under Review', 'পর্যালোচনাধীন')}</option>
              <option value="disputed">{t('Disputed', 'আপত্তিকৃত')}</option>
              <option value="resolved">{t('Resolved', 'মীমাংসিত')}</option>
            </select>

            <button
              type="button"
              className="btn-pill-light"
              onClick={fetchCases}
              disabled={loadingCases}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={loadingCases ? 'spin' : ''} />
              <span>{t('Refresh', 'রিফ্রেশ')}</span>
            </button>
          </div>

          {loadingCases ? (
            <p role="status" style={{ textAlign: 'center', padding: 30, color: 'var(--slate-500)' }}>
              <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
              {t('Loading cases…', 'কেস লোড হচ্ছে…')}
            </p>
          ) : cases.length === 0 ? (
            <p>{t('No cases found matching your filter.', 'কোনো কেস পাওয়া যায়নি।')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cases.map((c) => (
                <article
                  key={c.id}
                  style={{
                    background: '#fff',
                    border: c.alert_enabled ? '1.5px solid #dc2626' : '1px solid #d8cdb7',
                    borderRadius: 8,
                    padding: '16px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 4 }}>
                          {c.case_code || `CASE #${c.id}`}
                        </span>
                        {c.business && (
                          <strong style={{ fontSize: 13.5, color: 'var(--ink)' }}>
                            {c.business.name}
                          </strong>
                        )}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: c.status === 'resolved' ? '#ecfdf5' : c.status === 'published' ? '#d1fae5' : '#fef3c7',
                            color: c.status === 'resolved' ? '#065f46' : c.status === 'published' ? '#065f46' : '#92400e'
                          }}
                        >
                          {c.status === 'published' ? '✓ LIVE' : c.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 style={{ margin: '6px 0 2px', fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>
                        {c.title}
                      </h3>
                      {c.reporter && (
                        <small style={{ color: 'var(--slate-500)' }}>
                          Reporter: {c.reporter.name} ({c.reporter.email})
                        </small>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {c.alert_requested && (
                        <span style={{ fontSize: 11, fontWeight: 800, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          🔔 {t('Alert Requested', 'অ্যালার্টের অনুরোধ')}
                        </span>
                      )}
                      {c.alert_enabled && (
                        <span style={{ fontSize: 11, fontWeight: 800, background: '#dc2626', color: '#fff', padding: '3px 8px', borderRadius: 99 }}>
                          🚨 ALERT BROADCAST ON
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{ margin: '8px 0 12px', fontSize: 13, lineHeight: 1.5, color: 'var(--slate-700)', background: '#faf7f2', padding: '10px 14px', borderRadius: 6 }}>
                    {c.summary}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleToggleAlert(c.id, !c.alert_enabled)}
                        className="btn-pill-light"
                        style={{ fontSize: 12, padding: '5px 12px', fontWeight: 700 }}
                      >
                        {c.alert_enabled ? t('Turn Alert OFF', 'অ্যালার্ট বন্ধ করুন') : t('🚨 Set Alert ON', '🚨 অ্যালার্ট চালু করুন')}
                      </button>

                      <a
                        href={`/scam-alerts/${c.case_code || c.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, color: 'var(--teal-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
                      >
                        {t('View Public Case', 'পাবলিক কেস দেখুন')} <ExternalLink size={12} />
                      </a>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDeleteCase(c.id, c.case_code)}
                      className="btn-pill-light"
                      style={{ color: '#dc2626', borderColor: '#fca5a5', fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Trash2 size={13} />
                      <span>{t('Delete Case', 'কেস ডিলিট')}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 4: ORGANIZATION CLAIMS QUEUE                               */}
      {/* ============================================================== */}
      {activeTab === 'claims' && (
        <section aria-label="Organization Representation Claims">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <select
              value={claimStatusFilter}
              onChange={(e) => setClaimStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #d8cdb7', borderRadius: 6, fontSize: 13.5, background: '#fff' }}
            >
              <option value="submitted">{t('Pending Submissions', 'অপেক্ষমাণ আবেদন')}</option>
              <option value="approved">{t('Approved Claims', 'অনুমোদিত দাবি')}</option>
              <option value="rejected">{t('Rejected Claims', 'প্রত্যাখ্যাত দাবি')}</option>
              <option value="all">{t('All Claims', 'সব দাবি')}</option>
            </select>

            <button
              type="button"
              className="btn-pill-light"
              onClick={fetchClaims}
              disabled={loadingClaims}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={loadingClaims ? 'spin' : ''} />
              <span>{t('Refresh', 'রিফ্রেশ')}</span>
            </button>
          </div>

          {loadingClaims ? (
            <p role="status" style={{ textAlign: 'center', padding: 30, color: 'var(--slate-500)' }}>
              <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
              {t('Loading claims…', 'দাবির তালিকা লোড হচ্ছে…')}
            </p>
          ) : claims.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #d8cdb7', borderRadius: 8, padding: 36, textAlign: 'center' }}>
              <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 10px' }} />
              <h3>{t('No claims waiting for review', 'কোনো অপেক্ষমাণ দাবি নেই')}</h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {claims.map((cl) => (
                <article
                  key={cl.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #d8cdb7',
                    borderRadius: 8,
                    padding: '18px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>
                          {t('Claim for:', 'মালিকানা দাবি:')} {cl.business?.name || `Business #${cl.business_id}`}
                        </h3>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <Lock size={11} />
                          {t('Private / Staff Only', 'ব্যক্তিগত / শুধুমাত্র স্টাফদের জন্য')}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-600)' }}>
                        {t('Applicant:', 'আবেদনকারী নাগরিক:')} <strong>{cl.representative_name}</strong> ({cl.role_title}) &bull; {t('Email:', 'ইমেইল:')} {cl.contact_email} &bull; {t('Phone:', 'ফোন:')} {cl.contact_phone}
                      </p>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: cl.status === 'approved' ? '#ecfdf5' : cl.status === 'submitted' ? '#fef3c7' : '#fee2e2',
                        color: cl.status === 'approved' ? '#065f46' : cl.status === 'submitted' ? '#92400e' : '#991b1b',
                        border: `1px solid ${cl.status === 'approved' ? '#a7f3d0' : cl.status === 'submitted' ? '#fde68a' : '#fecaca'}`,
                      }}
                    >
                      {cl.status === 'submitted'
                        ? t('PENDING REVIEW', 'অপেক্ষমাণ আবেদন')
                        : cl.status === 'approved'
                        ? t('APPROVED (VERIFIED)', 'অনুমোদিত ও ভেরিফাইড')
                        : t('REJECTED', 'প্রত্যাখ্যাত')}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, background: '#faf7f2', padding: '12px 16px', borderRadius: 8, border: '1px solid #ebe2d3', marginBottom: 14, fontSize: 13 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                        {t('Document Type', 'প্রমাণপত্রের ধরন')}
                      </span>
                      <strong style={{ color: 'var(--ink)' }}>{formatDocumentType(cl.document_type)}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                        {t('Business Address', 'প্রতিষ্ঠানের ঠিকানা')}
                      </span>
                      <span style={{ color: 'var(--slate-700)' }}>{cl.business_address || '—'}</span>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                        {t('Official Proof Document', 'অফিসিয়াল প্রমাণপত্র')}
                      </span>
                      {cl.has_evidence ? (
                        <button
                          type="button"
                          onClick={() => setEvidenceModal({
                            isOpen: true,
                            claimId: cl.id,
                            kind: 'proof',
                            businessName: cl.business?.name || `Business #${cl.business_id}`,
                            representativeName: cl.representative_name,
                            roleTitle: cl.role_title,
                            contactInfo: `${cl.contact_phone} • ${cl.contact_email}`,
                          })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#0f766e',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 13px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          <Eye size={14} />
                          <span>{t('View Proof Document', 'প্রমাণপত্র দেখুন')}</span>
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{t('No document uploaded', 'কোনো নথি আপলোড করা হয়নি')}</span>
                      )}
                    </div>

                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                        {t('Storefront / Office Photo', 'দোকান বা অফিসের ছবি')}
                      </span>
                      {cl.has_photo ? (
                        <button
                          type="button"
                          onClick={() => setEvidenceModal({
                            isOpen: true,
                            claimId: cl.id,
                            kind: 'photo',
                            businessName: cl.business?.name || `Business #${cl.business_id}`,
                            representativeName: cl.representative_name,
                            roleTitle: cl.role_title,
                            contactInfo: `${cl.contact_phone} • ${cl.contact_email}`,
                          })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 13px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          <Eye size={14} />
                          <span>{t('View Storefront Photo', 'প্রতিষ্ঠানের ছবি দেখুন')}</span>
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{t('No photo uploaded', 'কোনো ছবি আপলোড করা হয়নি')}</span>
                      )}
                    </div>
                  </div>

                  {cl.status === 'submitted' && (
                    <div style={{ marginTop: 10 }}>
                      <input
                        type="text"
                        placeholder={t('Reason / decision note for this claim…', 'দাবির সিদ্ধান্তের কারণ লিখুন…')}
                        value={claimNotes[cl.id] || ''}
                        onChange={(e) => setClaimNotes((prev) => ({ ...prev, [cl.id]: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d8cdb7', borderRadius: 6, fontSize: 13, marginBottom: 8 }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDecideClaim(cl.id, 'approved')}
                          className="btn-teal-pill"
                          style={{ fontSize: 12, padding: '6px 14px' }}
                        >
                          <Check size={14} />
                          <span>{t('Approve Claim (Mark Verified)', 'দাবি অনুমোদন ও ভেরিফাই')}</span>
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDecideClaim(cl.id, 'rejected')}
                          className="btn-pill-light"
                          style={{ fontSize: 12, padding: '6px 14px', color: '#dc2626' }}
                        >
                          <X size={14} />
                          <span>{t('Reject Claim', 'প্রত্যাখ্যান')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 5: CITIZEN REPORTS & PRIVATE USER RESPONSES                */}
      {/* ============================================================== */}
      {activeTab === 'reports' && (() => {
        const orgReportsCount = reports.filter((r) => r.reportable_type === 'business').length;
        const reviewReportsCount = reports.filter((r) => r.reportable_type === 'review').length;
        const scamReportsCount = reports.filter((r) => r.reportable_type === 'scam_case').length;
        const commentReportsCount = reports.filter((r) => r.reportable_type === 'comment').length;

        const displayedReports = reportTypeFilter === 'all'
          ? reports
          : reports.filter((r) => r.reportable_type === reportTypeFilter);

        return (
          <section aria-label="Citizen Reports and Private Replies">
            {/* Header Toolbar: Status Filter, Refresh & Category Pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #d8cdb7', borderRadius: 6, fontSize: 13.5, background: '#fff', fontWeight: 600 }}
                  >
                    <option value="open">{t('Open Reports', 'খোলা রিপোর্ট')}</option>
                    <option value="resolved">{t('Resolved', 'মীমাংসিত')}</option>
                    <option value="dismissed">{t('Dismissed', 'বাতিলকৃত')}</option>
                    <option value="all">{t('All Statuses', 'সব স্ট্যাটাস')}</option>
                  </select>

                  <button
                    type="button"
                    className="btn-pill-light"
                    onClick={fetchReports}
                    disabled={loadingReports}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <RefreshCw size={14} className={loadingReports ? 'spin' : ''} />
                    <span>{t('Refresh', 'রিফ্রেশ')}</span>
                  </button>
                </div>

                <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>
                  {t('Showing:', 'দেখাচ্ছে:')} <strong>{displayedReports.length}</strong> {t('of', 'এর মধ্যে')} <strong>{reports.length}</strong> {t('reports', 'রিপোর্ট')}
                </div>
              </div>

              {/* Category Sub-tabs: Organization, Review, Scam, Comment */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => setReportTypeFilter('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: reportTypeFilter === 'all' ? '1.5px solid #1e293b' : '1px solid #cbd5e1',
                    background: reportTypeFilter === 'all' ? '#1e293b' : '#fff',
                    color: reportTypeFilter === 'all' ? '#fff' : '#475569',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Flag size={13} />
                  <span>{t('All Reports', 'সব রিপোর্ট')}</span>
                  <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 999, background: reportTypeFilter === 'all' ? 'rgba(255,255,255,0.2)' : '#f1f5f9' }}>
                    {reports.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportTypeFilter('business')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: reportTypeFilter === 'business' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    background: reportTypeFilter === 'business' ? '#2563eb' : '#fff',
                    color: reportTypeFilter === 'business' ? '#fff' : '#1e40af',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Building2 size={13} />
                  <span>{t('Organization Reports', 'প্রতিষ্ঠান রিপোর্ট')}</span>
                  <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 999, background: reportTypeFilter === 'business' ? 'rgba(255,255,255,0.2)' : '#dbeafe' }}>
                    {orgReportsCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportTypeFilter('review')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: reportTypeFilter === 'review' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                    background: reportTypeFilter === 'review' ? '#d97706' : '#fff',
                    color: reportTypeFilter === 'review' ? '#fff' : '#92400e',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Star size={13} />
                  <span>{t('Review Reports', 'রিভিউ রিপোর্ট')}</span>
                  <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 999, background: reportTypeFilter === 'review' ? 'rgba(255,255,255,0.2)' : '#fef3c7' }}>
                    {reviewReportsCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportTypeFilter('scam_case')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: reportTypeFilter === 'scam_case' ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                    background: reportTypeFilter === 'scam_case' ? '#dc2626' : '#fff',
                    color: reportTypeFilter === 'scam_case' ? '#fff' : '#991b1b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ShieldAlert size={13} />
                  <span>{t('Scam Alert Reports', 'স্ক্যাম রিপোর্ট')}</span>
                  <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 999, background: reportTypeFilter === 'scam_case' ? 'rgba(255,255,255,0.2)' : '#fee2e2' }}>
                    {scamReportsCount}
                  </span>
                </button>

                {commentReportsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setReportTypeFilter('comment')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 9999,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: reportTypeFilter === 'comment' ? '1.5px solid #7c3aed' : '1px solid #cbd5e1',
                      background: reportTypeFilter === 'comment' ? '#7c3aed' : '#fff',
                      color: reportTypeFilter === 'comment' ? '#fff' : '#5b21b6',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <MessageSquare size={13} />
                    <span>{t('Comment Reports', 'মন্তব্য রিপোর্ট')}</span>
                    <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 999, background: reportTypeFilter === 'comment' ? 'rgba(255,255,255,0.2)' : '#ede9fe' }}>
                      {commentReportsCount}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {loadingReports ? (
              <p role="status" style={{ textAlign: 'center', padding: 30, color: 'var(--slate-500)' }}>
                <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
                {t('Loading reports…', 'রিপোর্ট লোড হচ্ছে…')}
              </p>
            ) : displayedReports.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #d8cdb7', borderRadius: 8, padding: 36, textAlign: 'center' }}>
                <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 10px' }} />
                <h3>
                  {reportTypeFilter === 'all'
                    ? t('No citizen reports found for this status', 'এই স্ট্যাটাসে কোনো রিপোর্ট পাওয়া যায়নি')
                    : t(`No ${reportTypeFilter.replace('_', ' ')} reports waiting`, `কোনো ${reportTypeFilter.replace('_', ' ')} রিপোর্ট নেই`)}
                </h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {displayedReports.map((rep) => {
                  const isOrg = rep.reportable_type === 'business';
                  const isReview = rep.reportable_type === 'review';
                  const isScam = rep.reportable_type === 'scam_case';
                  const isComment = rep.reportable_type === 'comment';

                  const accentColor = isOrg ? '#2563eb' : isReview ? '#d97706' : isScam ? '#dc2626' : '#7c3aed';
                  const badgeBg = isOrg ? '#eff6ff' : isReview ? '#fffbeb' : isScam ? '#fef2f2' : '#faf5ff';
                  const badgeBorder = isOrg ? '#bfdbfe' : isReview ? '#fde68a' : isScam ? '#fecaca' : '#e9d5ff';
                  const TypeIcon = isOrg ? Building2 : isReview ? Star : isScam ? ShieldAlert : MessageSquare;
                  const typeLabel = isOrg
                    ? t('ORGANIZATION REPORT', 'প্রতিষ্ঠান রিপোর্ট')
                    : isReview
                    ? t('REVIEW REPORT', 'রিভিউ রিপোর্ট')
                    : isScam
                    ? t('SCAM ALERT REPORT', 'স্ক্যাম রিপোর্ট')
                    : t('COMMENT REPORT', 'মন্তব্য রিপোর্ট');

                  const itemLink = isReview
                    ? `/reviews/${rep.reportable_id}`
                    : isScam
                    ? `/scam-alerts/${rep.reportable_id}`
                    : isOrg
                    ? `/search?view=businesses&q=${rep.reportable_id}`
                    : null;

                  return (
                    <article
                      key={rep.id}
                      style={{
                        background: '#fff',
                        border: '1px solid #d8cdb7',
                        borderLeft: `4px solid ${accentColor}`,
                        borderRadius: 8,
                        padding: '18px 20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                background: badgeBg,
                                color: accentColor,
                                border: `1px solid ${badgeBorder}`,
                                padding: '2px 8px',
                                borderRadius: 4,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <TypeIcon size={12} />
                              {typeLabel} #{rep.reportable_id}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              Report #{rep.id} &bull; {new Date(rep.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <h3 style={{ margin: '6px 0 2px', fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>
                            {t('Reason:', 'কারণ:')} {rep.reason.replace(/_/g, ' ')}
                          </h3>

                          {rep.reporter && (
                            <small style={{ color: 'var(--slate-500)', display: 'block', marginTop: 2 }}>
                              {t('Reported by:', 'রিপোর্টকারী:')} <strong>{rep.reporter.name}</strong> ({rep.reporter.email})
                            </small>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {itemLink && (
                            <a
                              href={itemLink}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: accentColor,
                                textDecoration: 'none',
                                background: badgeBg,
                                border: `1px solid ${badgeBorder}`,
                                padding: '3px 9px',
                                borderRadius: 4,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <span>{t('View Reported Item', 'আইটেমটি দেখুন')}</span>
                              <ExternalLink size={11} />
                            </a>
                          )}

                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: rep.status === 'open' ? '#fee2e2' : '#ecfdf5',
                              color: rep.status === 'open' ? '#991b1b' : '#065f46'
                            }}
                          >
                            {rep.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {rep.details && (
                        <p style={{ margin: '8px 0 12px', fontSize: 13, lineHeight: 1.5, color: 'var(--slate-700)', background: '#faf7f2', padding: '10px 14px', borderRadius: 6 }}>
                          {rep.details}
                        </p>
                      )}

                      {/* Previous Admin Response if already sent */}
                      {rep.admin_response && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: 6, marginBottom: 12 }}>
                          <strong style={{ fontSize: 12, color: '#166534', display: 'block', marginBottom: 2 }}>
                            {t('Previous Private Staff Reply to User:', 'ব্যবহারকারীকে প্রেরিত পূর্ববর্তী উত্তর:')}
                          </strong>
                          <p style={{ margin: 0, fontSize: 13, color: '#15803d' }}>{rep.admin_response}</p>
                          {rep.admin_responded_at && (
                            <small style={{ color: '#16a34a', display: 'block', marginTop: 4 }}>
                              Sent on: {new Date(rep.admin_responded_at).toLocaleString()}
                            </small>
                          )}
                        </div>
                      )}

                      {/* Action buttons & Response Form */}
                      {replyReportId === rep.id ? (
                        <div style={{ background: '#fdfbf7', padding: '12px 14px', borderRadius: 6, border: '1px solid #eae0ce', marginTop: 10 }}>
                          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                            {t('Send Private Response (Visible ONLY to the Reporting User in Notifications & Activity):', 'ব্যক্তিগত উত্তর লিখুন (শুধুমাত্র এই ব্যবহারকারী তার নোটিফিকেশন ও কার্যক্রমে দেখতে পাবেন):')}
                          </label>
                          <textarea
                            rows={3}
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder={t('Type your private message to this user…', 'এই ব্যবহারকারীর জন্য আপনার বার্তা লিখুন…')}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d8cdb7', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', marginBottom: 8 }}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              disabled={busy || !replyMessage.trim()}
                              onClick={() => handleSendReportResponse(rep.id)}
                              className="btn-teal-pill"
                              style={{ fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Send size={13} />
                              <span>{t('Send Private Response', 'ব্যক্তিগত উত্তর পাঠান')}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setReplyReportId(null); setReplyMessage(''); }}
                              className="btn-pill-light"
                              style={{ fontSize: 12, padding: '5px 12px' }}
                            >
                              {t('Cancel', 'বাতিল')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                          <button
                            type="button"
                            onClick={() => { setReplyReportId(rep.id); setReplyMessage(''); }}
                            className="btn-teal-pill"
                            style={{ fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Send size={13} />
                            <span>{t('Reply Privately to User', 'ব্যবহারকারীকে উত্তর পাঠান')}</span>
                          </button>

                          <div style={{ display: 'flex', gap: 8 }}>
                            {rep.status === 'open' && (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleCloseReport(rep.id, 'resolved')}
                                  className="btn-pill-light"
                                  style={{ fontSize: 12, padding: '5px 12px', color: '#065f46' }}
                                >
                                  <Check size={13} />
                                  <span>{t('Mark Resolved', 'মীমাংসা')}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleCloseReport(rep.id, 'dismissed')}
                                  className="btn-pill-light"
                                  style={{ fontSize: 12, padding: '5px 12px' }}
                                >
                                  <X size={13} />
                                  <span>{t('Dismiss', 'বাতিল')}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}

      {/* ============================================================== */}
      {/* TAB 6: BROADCAST NOTICES                                       */}
      {/* ============================================================== */}
      {activeTab === 'broadcast' && (
        <section aria-label="Broadcast Announcements">
          <BroadcastNoticePanel />
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 7: USERS & PERMISSIONS (STRICTLY ADMINISTRATOR ONLY)       */}
      {/* ============================================================== */}
      {activeTab === 'users' && isAdmin && (
        <section aria-label="Users and Permissions">
          <AdminUsersDesk />
        </section>
      )}

      {/* Inline Modal: Edit Organization */}
      {editingOrgId !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingOrgId(null);
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              maxWidth: 820,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <AdminOrganizationEdit
              initialOrgId={editingOrgId}
              onClose={() => setEditingOrgId(null)}
              onUpdated={() => {
                fetchOrgs();
                loadMetrics();
              }}
            />
          </div>
        </div>
      )}
      {/* Claim Evidence Lightbox Modal */}
      <ClaimEvidenceModal
        isOpen={evidenceModal.isOpen}
        claimId={evidenceModal.claimId}
        kind={evidenceModal.kind}
        businessName={evidenceModal.businessName}
        representativeName={evidenceModal.representativeName}
        roleTitle={evidenceModal.roleTitle}
        contactInfo={evidenceModal.contactInfo}
        onClose={() => setEvidenceModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
