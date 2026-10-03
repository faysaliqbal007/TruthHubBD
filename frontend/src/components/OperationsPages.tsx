"use client";
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flag, 
  FileClock, 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  FileText,
  ShieldAlert,
  Trash2,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import { formatDate } from '../i18n/dictionary';
import { CaseFollowup } from './CaseFollowup';
import { ReviewEvidenceDesk } from './ReviewEvidenceDesk';
import { ContentModeration } from './ContentModeration';
import type { Business } from '../types';

type Activity = { 
  reviews: { id: number; title: string; rating: number; status: string }[]; 
  claims: { id: number; status: string; business: { name: string } }[]; 
  cases: { id: number; title: string; status: string; reporter_update?: string; resolution_note?: string; resolved_at?: string }[]; 
  saved: { id: number; name: string; slug: string }[];
  my_reports?: { id: number; reportable_type: string; reportable_id: number; reason: string; details: string; status: string; admin_response?: string; admin_responded_at?: string; created_at: string }[];
};

export function ActivityPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Activity>(); 
  const [message, setMessage] = useState('Loading your activity…');
  useEffect(() => {
    api<{ data: Activity }>('/activity')
      .then(r => { setData(r.data); setMessage(''); })
      .catch(e => setMessage(e.message));
  }, []);

  return (
    <div className="workspace-page">
      <div className="workspace-heading">
        <span className="workspace-eyebrow">YOUR CONTRIBUTIONS</span>
        <h1>My activity</h1>
        <p>Your experiences, saved places, and open requests.</p>
      </div>
      {message && <p role="status" className="workspace-notice">{message}</p>}
      {data && (
        <div className="workspace-columns">
          <section className="workspace-card">
            <h2>My reviews</h2>
            {data.reviews.length ? data.reviews.map(r => (
              <p key={r.id}>
                <Link to={`/reviews/${r.id}`}>{r.title}</Link> · {r.rating}/5 · {r.status}
              </p>
            )) : <p>Your first review belongs here.</p>}
          </section>

          <section className="workspace-card">
            <h2>Organization applications</h2>
            {data.claims.map(c => (
              <p key={c.id}>{c.business.name} · {c.status}</p>
            ))}
            {data.claims.some(c => c.status === 'approved') || user?.role === 'business' || user?.has_claimed_business ? (
              <Link to="/business-center">Open organization center →</Link>
            ) : data.claims.some(c => c.status === 'submitted') ? (
              <span style={{ fontSize: '0.9rem', color: 'var(--slate-600)' }}>Claim application submitted</span>
            ) : (
              <Link to="/claim">Claim an organization →</Link>
            )}
          </section>

          <section className="workspace-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <ShieldAlert size={20} color="#B93628" />
                My cases
              </h2>
              <Link to="/profile?tab=cases" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#B93628', textDecoration: 'none' }}>
                Track in Profile →
              </Link>
            </div>
            {data.cases.length ? (
              <>
                {data.cases.map(c => (
                  <article key={c.id}>
                    <p><strong>{c.title}</strong> · <span style={{ textTransform: 'capitalize' }}>{c.status.replaceAll('_', ' ')}</span></p>
                    {c.reporter_update && <p>Review team: {c.reporter_update}</p>}
                    {c.resolution_note && <p>Resolution: {c.resolution_note}</p>}
                    {c.resolved_at && <p>Resolved on {c.resolved_at.slice(0, 10)}</p>}
                    <CaseFollowup id={c.id} />
                  </article>
                ))}
                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                  <Link to="/profile?tab=cases" className="btn-teal-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', background: '#B93628', borderColor: '#991B1B', color: '#fff' }}>
                    <ShieldAlert size={14} /> Open Full Case Tracker & Dossier →
                  </Link>
                </div>
              </>
            ) : <p>No submitted cases.</p>}
          </section>

          <section className="workspace-card">
            <h2>Saved organizations</h2>
            {data.saved.map(b => (
              <p key={b.id}><Link to={`/business/${b.slug}`}>{b.name}</Link></p>
            ))}
            {!data.saved.length && <p>Save profiles to return to them later.</p>}
          </section>

          {data.my_reports && data.my_reports.length > 0 && (
            <section className="workspace-card">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flag size={18} color="#b93628" />
                My Reports ({data.my_reports.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                {data.my_reports.map(rep => (
                  <div key={rep.id} style={{ border: '1px solid #e2d9c5', borderRadius: 8, padding: '14px 16px', background: '#faf6eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <strong style={{ fontSize: 13 }}>Report #{rep.id} · {rep.reportable_type} #{rep.reportable_id}</strong>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: rep.status === 'open' ? '#fee2e2' : '#d1fae5', color: rep.status === 'open' ? '#991b1b' : '#065f46' }}>{rep.status.toUpperCase()}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#596273', margin: '0 0 6px' }}>{rep.reason.replace(/_/g, ' ')}</p>
                    {rep.admin_response && (
                      <div style={{ background: '#fff', border: '1px solid #d8cdb7', borderRadius: 6, padding: '10px 14px', marginTop: 8 }}>
                        <strong style={{ fontSize: 12, color: '#b93628', display: 'block', marginBottom: 4 }}>Staff Response</strong>
                        <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>{rep.admin_response}</p>
                        {rep.admin_responded_at && <small style={{ color: '#6b7283' }}>{new Date(rep.admin_responded_at).toLocaleDateString()}</small>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

type ManagedBusiness = {
  cases: { id: number; case_code: string; title: string; public_summary: string; status: string; created_at: string }[];
  id: number;
  name: string;
  slug: string;
  rating: number;
  review_count: number;
  reviews: { id: number; title: string; body: string; rating: number }[];
};

export function BusinessCenterPage() {
  const [items, setItems] = useState<ManagedBusiness[]>([]); 
  const [message, setMessage] = useState('Loading organization center…'); 
  const [reply, setReply] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'reviews' | 'cases'>('cases');

  useEffect(() => {
    api<{ data: ManagedBusiness[] }>('/business-center')
      .then(r => {
        setItems(r.data);
        setMessage(r.data.length ? '' : 'No approved organization representations yet.');
      })
      .catch(e => setMessage(e.message));
  }, []);

  return (
    <div className="workspace-page">
      <div className="workspace-heading" style={{ marginBottom: 32 }}>
        <span className="workspace-eyebrow">FOR ORGANIZATION REPRESENTATIVES</span>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={28} color="var(--teal)" />
          Organization Center
        </h1>
        <p>Listen to people’s experiences. Share your official response and proposed resolutions.</p>
      </div>
      
      {message && <p role="status" className="workspace-notice">{message}</p>}
      
      {items.map(b => (
        <section className="workspace-card" key={b.id} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '24px 32px', background: 'linear-gradient(to right, #f8fafc, #ffffff)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', margin: '0 0 8px 0', color: 'var(--ink)' }}>{b.name}</h2>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.9rem', color: 'var(--slate-600)' }}>
                <span><strong>{b.rating}/5</strong> rating</span>
                <span><strong>{b.review_count}</strong> reviews</span>
                <span><ShieldCheck size={14} style={{ display: 'inline', verticalAlign: '-2px', color: 'var(--teal)' }}/> Approved rep</span>
              </div>
            </div>
            <Link to={`/business/${b.slug}`} className="btn-pill-light" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Open profile <Eye size={16} />
            </Link>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#fcfcfc' }}>
            <button 
              onClick={() => setActiveTab('cases')}
              style={{ flex: 1, padding: '16px', background: activeTab === 'cases' ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === 'cases' ? '2px solid var(--teal)' : '2px solid transparent', fontWeight: 600, color: activeTab === 'cases' ? 'var(--teal)' : 'var(--slate-500)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <AlertCircle size={18} /> Scam Cases & Incidents
              <span style={{ background: b.cases.length > 0 ? '#fee2e2' : '#f1f5f9', color: b.cases.length > 0 ? '#991b1b' : 'var(--slate-600)', padding: '2px 8px', borderRadius: 999, fontSize: '0.75rem' }}>{b.cases.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              style={{ flex: 1, padding: '16px', background: activeTab === 'reviews' ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === 'reviews' ? '2px solid var(--teal)' : '2px solid transparent', fontWeight: 600, color: activeTab === 'reviews' ? 'var(--teal)' : 'var(--slate-500)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <FileClock size={18} /> Community Reviews
              <span style={{ background: '#f1f5f9', color: 'var(--slate-600)', padding: '2px 8px', borderRadius: 999, fontSize: '0.75rem' }}>{b.reviews.length}</span>
            </button>
          </div>

          <div style={{ padding: '32px' }}>
            {activeTab === 'cases' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {b.cases.length === 0 ? (
                  <p style={{ color: 'var(--slate-500)', textAlign: 'center', padding: '40px 0' }}>No active scam cases reported against this organization.</p>
                ) : b.cases.map(c => (
                  <article key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <span style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', background: '#fee2e2', padding: '4px 10px', borderRadius: 6, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {c.status.replace('_', ' ')}
                        </span>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem' }}>{c.title || 'Case Report'} <span style={{ color: 'var(--slate-400)', fontSize: '0.9rem', fontWeight: 500 }}>#{c.case_code}</span></h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Published {c.created_at ? c.created_at.slice(0, 10) : 'recently'}</div>
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 8, fontSize: '0.95rem', color: 'var(--slate-700)', marginBottom: 24, borderLeft: '3px solid #cbd5e1' }}>
                      {c.public_summary}
                    </div>
                    
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
                      <CaseFollowup id={c.id} subject />
                    </div>
                  </article>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {b.reviews.length === 0 ? (
                  <p style={{ color: 'var(--slate-500)', textAlign: 'center', padding: '40px 0' }}>No pending reviews to respond to.</p>
                ) : b.reviews.map(r => (
                  <form
                    className="workspace-comment"
                    key={r.id}
                    onSubmit={async e => {
                      e.preventDefault();
                      try {
                        await api(`/reviews/${r.id}/official-response`, 'PUT', { body: reply[r.id] });
                        setMessage('Official response published.');
                      } catch (e) {
                        setMessage((e as Error).message);
                      }
                    }}
                    style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, background: '#fff', margin: 0 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= r.rating ? "var(--teal)" : "#e2e8f0"} style={{ display: 'block' }}>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        ))}
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{r.title}</h3>
                    </div>
                    <p style={{ margin: '0 0 20px 0', fontSize: '0.95rem', color: 'var(--slate-700)', lineHeight: 1.6 }}>{r.body}</p>
                    
                    <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: 8, color: 'var(--ink)' }}>
                        Publish Official Response
                      </label>
                      <textarea
                        className="review-textarea"
                        required
                        maxLength={3000}
                        placeholder="Address the customer's concerns professionally..."
                        value={reply[r.id] ?? ''}
                        onChange={e => setReply({ ...reply, [r.id]: e.target.value })}
                        style={{ width: '100%', minHeight: 100, marginBottom: 16 }}
                      />
                      <button className="btn-teal-pill" style={{ width: 'auto' }}>Publish Response</button>
                    </div>
                  </form>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export function StaffRecordsPage({ kind }: { kind: 'reports' | 'audit' }) {
  const { lang, t } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; total: number }>({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [adminResponses, setAdminResponses] = useState<Record<number, string>>({});
  const [sendingResponse, setSendingResponse] = useState<number | null>(null);
  const [busyItem, setBusyItem] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('open'); // for reports: open, resolved, dismissed, all
  const [reloadToken, setReloadToken] = useState(0);

  // Tabs for reports page
  const [reportsTab, setReportsTab] = useState<'reports' | 'moderation' | 'evidence'>('reports');

  const endpoint = kind === 'reports' ? '/moderation/reports' : '/admin/audit-logs';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage('');

    const query = new URLSearchParams({
      page: String(page),
      per_page: '20',
      ...(search.trim() ? { q: search.trim() } : {}),
      ...(kind === 'reports' ? { status: statusFilter } : {})
    });

    api<{ data: any[]; pagination?: any }>(`${endpoint}?${query.toString()}`)
      .then(r => {
        if (!active) return;
        setItems(r.data || []);
        if (r.pagination) setPagination(r.pagination);
      })
      .catch(e => {
        if (!active) return;
        setMessage(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [endpoint, page, search, statusFilter, reloadToken, kind]);

  const handleReportDecision = async (id: number, status: 'resolved' | 'dismissed') => {
    const note = (notes[id] || '').trim();
    const adminResp = (adminResponses[id] || '').trim();

    setBusyItem(id);
    setMessage('');
    try {
      await api(`/moderation/reports/${id}`, 'PATCH', { 
        status, 
        ...(note ? { decision_note: note } : {}), 
        ...(adminResp ? { admin_response: adminResp } : {}) 
      });
      setItems(prev => prev.filter(i => i.id !== id));
      setMessage(`Report #${id} marked as ${status}.${adminResp ? ' Response sent to reporter.' : ''}`);
      setReloadToken(v => v + 1);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusyItem(null);
    }
  };

  const handleDeleteReportedContent = async (reportId: number, type: string, targetId: number) => {
    const isReview = type?.toLowerCase().includes('review');
    const confirmPrompt = isReview
      ? (lang === 'bn' ? `আপনি কি নিশ্চিতভাবে এই রিপোর্টকৃত রিভিউটি (#${targetId}) সম্পূর্ণ মুছে ফেলতে চান? এটি ফিরিয়ে আনা যাবে না।` : `Permanently delete this reported review (#${targetId}) and resolve this report? This cannot be undone.`)
      : (lang === 'bn' ? `আপনি কি নিশ্চিতভাবে এই রিপোর্টকৃত কনটেন্টটি মুছে ফেলতে চান?` : `Permanently delete this reported content?`);
    if (!window.confirm(confirmPrompt)) return;

    setBusyItem(reportId);
    setMessage('');
    try {
      if (isReview) {
        await api(`/admin/reviews/${targetId}`, 'DELETE');
      } else {
        await api(`/moderation/content/${type.toLowerCase()}/${targetId}`, 'PATCH', { status: 'removed', reason: 'Removed by staff upon report investigation' });
      }
      // Also automatically mark report as resolved
      await api(`/moderation/reports/${reportId}`, 'PATCH', { 
        status: 'resolved', 
        decision_note: `Reported ${type} #${targetId} was permanently deleted by moderator/admin.` 
      });
      setItems(prev => prev.filter(i => i.id !== reportId));
      setMessage(lang === 'bn' 
        ? `রিপোর্ট #${reportId} নিষ্পত্তি করা হয়েছে এবং রিভিউ #${targetId} স্থায়ীভাবে মুছে ফেলা হয়েছে।` 
        : `Report #${reportId} resolved and reported ${type} #${targetId} was permanently deleted.`);
      setReloadToken(v => v + 1);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusyItem(null);
    }
  };

  const handleSendResponse = async (id: number) => {
    const msg = (adminResponses[id] || '').trim();
    if (!msg || msg.length < 5) return;
    setSendingResponse(id);
    setMessage('');
    try {
      await api(`/moderation/reports/${id}/respond`, 'POST', { message: msg });
      setAdminResponses(prev => ({ ...prev, [id]: '' }));
      setMessage(`Response sent to reporter of Report #${id}.`);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSendingResponse(null);
    }
  };

  return (
    <div className="workspace-page">
      <div className="workspace-heading">
        <span className="workspace-eyebrow">
          {kind === 'reports' ? t('MODERATION / REPORTS', 'মডারেশন / রিপোর্ট') : t('ADMIN / AUDIT TRAIL', 'অ্যাডমিন / নিরীক্ষা ইতিহাস')}
        </span>
        <h1>{kind === 'reports' ? t('Content Reports & Policy Review', 'বিষয়বস্তুর রিপোর্ট ও পর্যালোচনার সিদ্ধান্ত') : t('System Audit Trail', 'সিস্টেম নিরীক্ষার ইতিহাস')}</h1>
        <p>
          {kind === 'reports' 
            ? t('Review community-reported reviews, comments, and scam allegations. Record an accountable decision reason.', 'নাগরিকদের রিপোর্ট করা রিভিউ, মন্তব্য ও প্রতারণার অভিযোগ দেখুন এবং কারণসহ সিদ্ধান্ত দিন।')
            : t('Inspect the immutable recorded history of sensitive administrative actions and staff decisions.', 'প্রশাসনিক কার্যক্রম, অনুমোদনের সিদ্ধান্ত ও পদবি পরিবর্তনের অপরিবর্তনীয় ইতিহাস দেখুন।')}
        </p>
      </div>

      {/* Reports Subtabs */}
      {kind === 'reports' && (
        <nav className="workspace-tabs" style={{ marginBottom: '20px' }}>
          <button 
            type="button" 
            aria-pressed={reportsTab === 'reports'} 
            onClick={() => setReportsTab('reports')}
          >
            <Flag size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t('Reported Items Queue', 'রিপোর্টের সারি')}
          </button>
          <button 
            type="button" 
            aria-pressed={reportsTab === 'moderation'} 
            onClick={() => setReportsTab('moderation')}
          >
            <Eye size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t('Direct Visibility Controls', 'দৃশ্যমানতা নিয়ন্ত্রণ')}
          </button>
          <button 
            type="button" 
            aria-pressed={reportsTab === 'evidence'} 
            onClick={() => setReportsTab('evidence')}
          >
            <FileText size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t('Review Evidence Inspection', 'রিভিউ প্রমাণ নিরীক্ষা')}
          </button>
        </nav>
      )}

      {message && (
        <p role="status" className="workspace-notice" style={{ marginBottom: '16px' }}>
          {message}
        </p>
      )}

      {/* Subtab views for reports */}
      {kind === 'reports' && reportsTab === 'moderation' && (
        <div>
          <ContentModeration />
        </div>
      )}

      {kind === 'reports' && reportsTab === 'evidence' && (
        <div>
          <ReviewEvidenceDesk />
        </div>
      )}

      {/* Main List view for Reports or Audit */}
      {(kind === 'audit' || (kind === 'reports' && reportsTab === 'reports')) && (
        <>
          {/* Toolbar: Search, Status filter, Refresh */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px', background: '#ffffff', padding: '14px 16px', borderRadius: '10px', border: '1px solid #d8cdb7' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--slate-400)' }} />
              <input
                type="search"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={kind === 'reports' ? t('Search reports by reason or item ID…', 'রিপোর্ট খুঁজুন…') : t('Search audit log by action, actor, or type…', 'নিরীক্ষা লগ খুঁজুন…')}
                className="review-input"
                style={{ width: '100%', margin: 0, paddingLeft: '34px' }}
              />
            </div>

            {kind === 'reports' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-600)' }}>Status:</label>
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                  className="review-input"
                  style={{ margin: 0, padding: '6px 12px', fontSize: '13px' }}
                >
                  <option value="open">{t('Open Reports', 'খোলা রিপোর্ট')}</option>
                  <option value="resolved">{t('Resolved', 'নিষ্পত্তিকৃত')}</option>
                  <option value="dismissed">{t('Dismissed', 'বাতিলকৃত')}</option>
                  <option value="all">{t('All Reports', 'সকল রিপোর্ট')}</option>
                </select>
              </div>
            )}

            <button
              type="button"
              className="btn-pill-light"
              onClick={() => setReloadToken(v => v + 1)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} />
              <span>{t('Refresh', 'রিফ্রেশ')}</span>
            </button>

            <span style={{ fontSize: '13px', color: 'var(--slate-500)', marginLeft: 'auto' }}>
              {pagination.total} {kind === 'reports' ? t('reports', 'রিপোর্ট') : t('audit entries', 'নিরীক্ষা রেকর্ড')}
            </span>
          </div>

          {loading ? (
            <p role="status">{t('Loading records…', 'রেকর্ড লোড হচ্ছে…')}</p>
          ) : !items.length ? (
            <div style={{ background: '#ffffff', border: '1px solid #d8cdb7', padding: '36px', borderRadius: '10px', textAlign: 'center' }}>
              <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 10px' }} />
              <h3>{kind === 'reports' ? t('No reports found', 'কোনো রিপোর্ট পাওয়া যায়নি') : t('No audit records found', 'কোনো নিরীক্ষা রেকর্ড পাওয়া যায়নি')}</h3>
              <p style={{ color: 'var(--slate-500)', fontSize: '13.5px' }}>
                {kind === 'reports' ? t('There are no content reports in this view.', 'এই তালিকায় কোনো অভিযোগ নেই।') : t('Try adjusting your search criteria.', 'অনুসন্ধানের শর্ত পরিবর্তন করে দেখুন।')}
              </p>
            </div>
          ) : kind === 'reports' ? (
            /* REPORTS LIST */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map(item => (
                <article
                  key={item.id}
                  className="workspace-card"
                  style={{ margin: 0, padding: '20px', background: '#fffdfa', border: '1px solid #d8cdb7' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>
                        REPORT #{item.id} &bull; {item.reportable_type?.toUpperCase()} #{item.reportable_id}
                      </span>
                      <h2 style={{ margin: '2px 0 0', fontSize: '1.2rem', color: 'var(--ink)' }}>
                        {item.reason}
                      </h2>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: item.status === 'open' ? '#fee2e2' : '#f1f5f9',
                        color: item.status === 'open' ? '#991b1b' : 'var(--slate-600)'
                      }}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </div>

                  {item.details && (
                    <p style={{ margin: '8px 0 12px', fontSize: '13.5px', color: 'var(--slate-700)', background: '#ffffff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #eae0ce' }}>
                      <strong>{t('Reporter details:', 'রিপোর্টারের বিবরণ:')}</strong> {item.details}
                    </p>
                  )}

                  <div style={{ fontSize: '12.5px', color: 'var(--slate-500)', marginBottom: '12px' }}>
                    {t('Submitted on', 'জমার তারিখ')}: {formatDate(item.created_at, lang)}
                    {item.decision_note && (
                      <div style={{ marginTop: '6px', color: 'var(--ink)' }}>
                        <strong>{t('Recorded decision:', 'সংরক্ষিত সিদ্ধান্ত:')}</strong> {item.decision_note}
                      </div>
                    )}
                  </div>

                  {item.status === 'open' && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #eae0ce' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Quick 1-click Resolve */}
                        <button
                          type="button"
                          disabled={busyItem === item.id}
                          className="btn-teal-pill"
                          onClick={() => handleReportDecision(item.id, 'resolved')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', fontSize: '13px', fontWeight: 700 }}
                        >
                          <CheckCircle2 size={15} />
                          {t('Resolve Report', 'রিপোর্ট নিষ্পত্তি')}
                        </button>

                        {/* Quick 1-click Dismiss */}
                        <button
                          type="button"
                          disabled={busyItem === item.id}
                          className="btn-pill-light"
                          onClick={() => handleReportDecision(item.id, 'dismissed')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', fontSize: '13px', fontWeight: 600 }}
                        >
                          <XCircle size={15} />
                          {t('Dismiss Report', 'রিপোর্ট বাতিল')}
                        </button>

                        {/* Direct Delete Review / Content button */}
                        <button
                          type="button"
                          disabled={busyItem === item.id}
                          onClick={() => handleDeleteReportedContent(item.id, item.reportable_type, item.reportable_id)}
                          style={{
                            background: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '9999px',
                            padding: '7px 16px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginLeft: 'auto'
                          }}
                        >
                          <Trash2 size={14} />
                          {item.reportable_type?.toLowerCase().includes('review')
                            ? t('Delete Reported Review', 'রিপোর্টকৃত রিভিউ ডিলিট')
                            : t('Delete Reported Content', 'রিপোর্টকৃত কনটেন্ট ডিলিট')}
                        </button>
                      </div>

                      {/* Optional note or response to reporter drawer */}
                      <details style={{ marginTop: '12px', fontSize: '12.5px', color: 'var(--slate-600)' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--teal-primary)' }}>
                          + {t('Add optional note or private reply to reporter', 'ঐচ্ছিক নোট বা রিপোর্টারকে বার্তা যোগ করুন')}
                        </summary>
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder={t('Optional decision rationale (for audit log)…', 'ঐচ্ছিক সিদ্ধান্তের কারণ (নিরীক্ষা লগের জন্য)…')}
                            value={notes[item.id] || ''}
                            onChange={e => setNotes({ ...notes, [item.id]: e.target.value })}
                            className="review-input"
                            style={{ margin: 0, width: '100%', fontSize: '13px' }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              placeholder={t('Private reply message to reporter…', 'রিপোর্টারকে ব্যক্তিগত বার্তা…')}
                              value={adminResponses[item.id] || ''}
                              onChange={e => setAdminResponses({ ...adminResponses, [item.id]: e.target.value })}
                              className="review-input"
                              style={{ margin: 0, flex: 1, fontSize: '13px' }}
                            />
                            <button
                              type="button"
                              className="btn-pill-light"
                              disabled={(adminResponses[item.id] || '').trim().length < 3 || sendingResponse === item.id}
                              onClick={() => handleSendResponse(item.id)}
                              style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
                            >
                              {sendingResponse === item.id ? t('Sending…', 'পাঠানো হচ্ছে…') : t('Send Reply', 'বার্তা পাঠান')}
                            </button>
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                  {item.status !== 'open' && item.admin_response && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: '#d1fae5', borderRadius: 7, border: '1px solid #a7f3d0', fontSize: 13 }}>
                      <strong style={{ color: '#065f46', display: 'block', marginBottom: 4 }}>{t('Admin response sent:', 'অ্যাডমিনের বার্তা:')}</strong>
                      <span>{item.admin_response}</span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            /* AUDIT TRAIL LIST */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map(item => {
                let metaParsed = null;
                if (item.metadata) {
                  try {
                    metaParsed = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
                  } catch {
                    metaParsed = item.metadata;
                  }
                }

                return (
                  <article
                    key={item.id}
                    className="workspace-card"
                    style={{ margin: 0, padding: '16px 20px', background: '#ffffff', border: '1px solid #d8cdb7' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: '#eff6ff',
                            color: '#1e40af',
                            fontFamily: 'monospace'
                          }}
                        >
                          {item.action}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                          {item.auditable_type} #{item.auditable_id}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                        {formatDate(item.created_at, lang)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px', fontSize: '12.5px', color: 'var(--slate-600)' }}>
                      <span>
                        <strong>Actor:</strong> {item.actor_name || (item.actor_user_id ? `User #${item.actor_user_id}` : 'System')}
                        {item.actor_email && <small style={{ color: 'var(--slate-400)', marginLeft: 4 }}>({item.actor_email})</small>}
                      </span>
                      {item.ip_address && (
                        <span>
                          <strong>IP:</strong> {item.ip_address}
                        </span>
                      )}
                    </div>

                    {metaParsed && (
                      <div style={{ marginTop: '8px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                        {typeof metaParsed === 'object' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {Object.entries(metaParsed).map(([k, v]) => (
                              <div key={k}>
                                <strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span>{String(metaParsed)}</span>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <nav
              aria-label={t('Pagination', 'পৃষ্ঠা')}
              style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '24px', justifyContent: 'center' }}
            >
              <button
                className="btn-pill-light"
                disabled={page <= 1}
                onClick={() => setPage(v => Math.max(1, v - 1))}
              >
                &larr; {t('Previous', 'আগের')}
              </button>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>
                {page} / {pagination.last_page}
              </span>
              <button
                className="btn-pill-light"
                disabled={page >= pagination.last_page}
                onClick={() => setPage(v => v + 1)}
              >
                {t('Next', 'পরের')} &rarr;
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
