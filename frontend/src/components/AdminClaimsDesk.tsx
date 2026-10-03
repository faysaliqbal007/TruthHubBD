"use client";
import { useEffect, useRef, useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Eye, ShieldCheck, User } from 'lucide-react';
import { api, apiFileUrl } from '../services/api';
import { ClaimEvidenceModal } from './ClaimEvidenceModal';
import { useAuth } from '../features/auth/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import { formatDate } from '../i18n/dictionary';

type ClaimUser = { id: number; name: string; email: string; role: string };
type ClaimBusiness = { id: number; name: string; category?: string; location?: string };
type Claim = {
  id: number;
  status: 'submitted' | 'approved' | 'rejected' | 'restricted';
  representative_name: string; role_title: string; contact_email: string;
  contact_phone: string; business_address: string; document_type: string;
  has_evidence: boolean; has_photo: boolean; decision_note?: string;
  created_at: string; user?: ClaimUser; business?: ClaimBusiness;
  is_dispute?: boolean;
  current_owner_name?: string | null;
  current_owner_id?: number | null;
  claimant_blocked?: boolean;
};
type ClaimsPage = { data: Claim[]; pagination: { current_page: number; per_page: number; total: number; last_page: number }; };
const DOC_LABELS: Record<string, string> = { trade_license: 'Trade Licence', registration: 'Organization Registration', authorization: 'Signed Authorization' };

export function AdminClaimsDesk() {
  const { user, checking } = useAuth(); const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState<'submitted' | 'approved' | 'rejected' | 'restricted' | 'all'>('submitted');
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [attempt, setAttempt] = useState(0);
  const key = statusFilter + ':' + search + ':' + page + ':' + attempt + ':' + user?.id;
  const [snapshot, setSnapshot] = useState<{ key: string; data?: ClaimsPage; error?: string }>();
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number[]>([]); const [notice, setNotice] = useState<{ error: boolean; text: string }>();
  const locks = useRef(new Set<number>()); const isStaff = user?.role === 'admin' || user?.role === 'moderator';
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

  useEffect(() => {
    if (checking || !isStaff) return; let active = true;
    const params = new URLSearchParams({ status: statusFilter, page: String(page), per_page: '20', ...(search.trim() ? { q: search.trim() } : {}) });
    api<ClaimsPage>('/admin/business-claims?' + params.toString())
      .then(res => { if (active) setSnapshot({ key, data: res }); })
      .catch(err => { if (active) setSnapshot({ key, error: (err as Error).message }); });
    return () => { active = false; };
  }, [key, checking, isStaff]);

  const current = snapshot?.key === key ? snapshot : undefined;

  async function decide(claim: Claim, status: 'approved' | 'rejected' | 'restricted') {
    const rawNote = notes[claim.id] !== undefined ? notes[claim.id] : (claim.decision_note || '');
    const note = rawNote.trim(); if (note.length < 10 || locks.current.has(claim.id)) return;
    locks.current.add(claim.id); setBusy(p => [...p, claim.id]); setNotice(undefined);
    try {
      await api('/admin/business-claims/' + claim.id, 'PATCH', { status, decision_note: note });
      setNotice({ error: false, text: status === 'approved' ? 'Claim #' + claim.id + ' approved. The citizen account is now an organization account.' : 'Claim #' + claim.id + ' ' + status + '.' });
      setAttempt(v => v + 1);
    } catch (err) { setNotice({ error: true, text: (err as Error).message }); }
    finally { locks.current.delete(claim.id); setBusy(p => p.filter(id => id !== claim.id)); }
  }

  if (checking) return <p role="status">Checking session...</p>;
  if (!isStaff)  return <p role="alert">Staff access required.</p>;
  const claims = current?.data?.data ?? []; const pagination = current?.data?.pagination;
  const statusStyle = (s: string): React.CSSProperties => {
    if (s === 'approved')   return { background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' };
    if (s === 'rejected')   return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
    if (s === 'restricted') return { background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db' };
    return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' };
  };
  return (
    <div>
      <div style={{ background: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontSize: 13.5 }}>
        <strong>Claim Review Policy:</strong>{' '}Only admin and moderator can view claim documents. Approving converts the citizen account to an organization account. They cannot post reviews or scam cases on their own organization.
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <input type="search" className="review-input" placeholder="Search by name, org, or ID..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: 180, margin: 0 }} />
        <select className="review-input" value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }} style={{ margin: 0, minWidth: 140 }}>
          <option value="submitted">Pending review</option><option value="approved">Approved</option>
          <option value="rejected">Rejected</option><option value="restricted">Restricted</option><option value="all">All</option>
        </select>
        <button type="button" className="btn-pill-light" onClick={() => setAttempt(v => v + 1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      {notice && <p role={notice.error ? 'alert' : 'status'} className="workspace-notice" style={{ color: notice.error ? '#991b1b' : '#065f46', marginBottom: 16 }}>{notice.text}</p>}
      {!current ? <p role="status">Loading claim applications...</p>
        : current.error ? <div role="alert" className="workspace-notice">{current.error} <button type="button" onClick={() => setAttempt(v => v + 1)}>Retry</button></div>
        : <>
          <p style={{ fontSize: 13.5, color: 'var(--slate-500)', marginBottom: 16 }}>
            Claim applications: <strong>{pagination?.total ?? claims.length}</strong>
          </p>
          {claims.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #d8cdb7', padding: 36, borderRadius: 10, textAlign: 'center' }}>
              <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ margin: '0 0 6px' }}>No claims in this queue</h3>
            </div>
          )}
          {claims.map(claim => (
            <article key={claim.id} style={{ background: '#fffdf7', border: '1px solid #d8cdb7', borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                <div>
                  <h2 style={{ margin: '0 0 3px', fontSize: '1.1rem', color: 'var(--ink)' }}>Claim #{claim.id}: <strong>{claim.business?.name ?? '-'}</strong></h2>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--slate-500)' }}>{claim.business?.category} &middot; {claim.business?.location ?? '-'} &middot; {formatDate(claim.created_at, 'en')}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {claim.is_dispute && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>OWNERSHIP DISPUTE</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, ...statusStyle(claim.status) }}>{claim.status.toUpperCase()}</span>
                </div>
              </div>
              {claim.is_dispute && (
                <div style={{ background: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#991b1b', fontSize: 13, lineHeight: 1.5 }}>
                  <strong>⚠️ Ownership Dispute:</strong> This organization is currently represented by <strong>{claim.current_owner_name || `User #${claim.current_owner_id}`}</strong>. Approving this claim will revoke the current representative's access and transfer verified ownership to this applicant.
                </div>
              )}
              {claim.claimant_blocked && (
                <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: '#991b1b', fontSize: 12.5 }}>
                  <strong>⛔ Restricted User:</strong> This user has been restricted from claiming organizations due to previous invalid or disputed representation.
                </div>
              )}
              <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px,100%), 1fr))', gap: 12, background: '#fff', border: '1px solid #eae0ce', borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
                <div>
                  <dt style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)' }}>Citizen account (private &mdash; admin only)</dt>
                  <dd style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <User size={14} color="#64748b" />
                    <span style={{ fontWeight: 600 }}>{claim.user?.name ?? '-'}</span>
                    <small style={{ color: 'var(--slate-500)' }}>{claim.user?.email}</small>
                    <span style={{ fontSize: 10, background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: 4 }}>{claim.user?.role}</span>
                  </dd>
                </div>
                <div><dt style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)' }}>Representative</dt><dd style={{ margin: '4px 0 0', fontWeight: 600 }}>{claim.representative_name}</dd><small style={{ color: 'var(--slate-500)' }}>{claim.role_title}</small></div>
                <div><dt style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)' }}>Contact</dt><dd style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.5 }}>{claim.contact_email}<br />{claim.contact_phone}</dd></div>
                <div><dt style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)' }}>Document type</dt><dd style={{ margin: '4px 0 0', fontWeight: 600 }}>{DOC_LABELS[claim.document_type] ?? claim.document_type}</dd></div>
                <div style={{ gridColumn: '1/-1' }}><dt style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)' }}>Registered address</dt><dd style={{ margin: '4px 0 0', fontSize: 13 }}>{claim.business_address}</dd></div>
              </dl>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                {claim.has_evidence && (
                  <button
                    type="button"
                    onClick={() => setEvidenceModal({
                      isOpen: true,
                      claimId: claim.id,
                      kind: 'proof',
                      businessName: claim.business?.name ?? ('Organization #' + claim.id),
                      representativeName: claim.representative_name,
                      roleTitle: claim.role_title,
                      contactInfo: `${claim.contact_phone} • ${claim.contact_email}`,
                    })}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#fff', background: '#0f766e', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                  >
                    <Eye size={15} /> View authority document
                  </button>
                )}
                {claim.has_photo && (
                  <button
                    type="button"
                    onClick={() => setEvidenceModal({
                      isOpen: true,
                      claimId: claim.id,
                      kind: 'photo',
                      businessName: claim.business?.name ?? ('Organization #' + claim.id),
                      representativeName: claim.representative_name,
                      roleTitle: claim.role_title,
                      contactInfo: `${claim.contact_phone} • ${claim.contact_email}`,
                    })}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#fff', background: '#0284c7', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                  >
                    <Eye size={15} /> View business storefront photo
                  </button>
                )}
                {!claim.has_evidence && !claim.has_photo && <span style={{ fontSize: 12.5, color: '#ef4444' }}>No evidence files attached</span>}
              </div>
              {claim.decision_note && (<div style={{ fontSize: 13, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}><strong>Decision note:</strong> {claim.decision_note}</div>)}
              <fieldset disabled={busy.includes(claim.id)} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                <label htmlFor={'claim-note-' + claim.id} style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--slate-700)' }}>
                  Decision note (at least 10 characters required)
                </label>
                <textarea
                  id={'claim-note-' + claim.id}
                  className="review-textarea"
                  placeholder="e.g. Trade licence verified and address confirmed."
                  value={notes[claim.id] !== undefined ? notes[claim.id] : (claim.decision_note || '')}
                  maxLength={2000}
                  onChange={e => setNotes(p => ({ ...p, [claim.id]: e.target.value }))}
                  style={{ width: '100%', margin: '0 0 10px' }}
                />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {/* Approve / Restore Button (Available when not currently approved) */}
                  {claim.status !== 'approved' && (
                    <button
                      type="button"
                      className="btn-teal-pill"
                      disabled={((notes[claim.id] !== undefined ? notes[claim.id] : (claim.decision_note || '')).trim().length < 10)}
                      onClick={() => void decide(claim, 'approved')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <ShieldCheck size={15} />{' '}
                      {claim.status === 'restricted'
                        ? 'Restore & Approve Representation'
                        : claim.status === 'rejected'
                        ? 'Reconsider & Approve Claim'
                        : claim.is_dispute
                        ? 'Approve & Transfer Representation (Revoke Previous)'
                        : 'Approve & Convert to Organization Account'}
                    </button>
                  )}

                  {/* Restrict Button (Available when approved) */}
                  {claim.status === 'approved' && (
                    <button
                      type="button"
                      className="btn-pill-light"
                      disabled={((notes[claim.id] !== undefined ? notes[claim.id] : (claim.decision_note || '')).trim().length < 10)}
                      onClick={() => void decide(claim, 'restricted')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d97706' }}
                    >
                      <XCircle size={15} /> Restrict temporarily
                    </button>
                  )}

                  {/* Reject / Revoke Button (Available when not currently rejected) */}
                  {claim.status !== 'rejected' && (
                    <button
                      type="button"
                      className="btn-pill-light"
                      disabled={((notes[claim.id] !== undefined ? notes[claim.id] : (claim.decision_note || '')).trim().length < 10)}
                      onClick={() => void decide(claim, 'rejected')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        ...(claim.status === 'approved' || claim.status === 'restricted'
                          ? { color: '#b91c1c', borderColor: '#fca5a5', background: '#fee2e2' }
                          : {})
                      }}
                    >
                      <XCircle size={15} />{' '}
                      {claim.status === 'approved' || claim.status === 'restricted'
                        ? 'Fully Revoke Claim & Block From Organization Creation'
                        : 'Reject claim'}
                    </button>
                  )}

                  {/* Update Decision Note button if modifying note without changing status */}
                  {(claim.status === 'approved' || claim.status === 'restricted' || claim.status === 'rejected') && (
                    <button
                      type="button"
                      className="btn-pill-light"
                      disabled={
                        ((notes[claim.id] !== undefined ? notes[claim.id] : (claim.decision_note || '')).trim().length < 10) ||
                        (notes[claim.id] === undefined || notes[claim.id] === claim.decision_note)
                      }
                      onClick={() => void decide(claim, claim.status as any)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      Update Decision Note
                    </button>
                  )}
                </div>
              </fieldset>
            </article>
          ))}
          {pagination && pagination.last_page > 1 && (
            <nav style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
              <button className="btn-pill-light" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span>{page} / {pagination.last_page}</span>
              <button className="btn-pill-light" disabled={page >= pagination.last_page} onClick={() => setPage(p => p + 1)}>Next</button>
            </nav>
          )}
        </>
      }
      {/* Claim Evidence Lightbox Modal */}
      <ClaimEvidenceModal
        isOpen={evidenceModal.isOpen}
        claimId={evidenceModal.claimId}
        kind={evidenceModal.kind}
        businessName={evidenceModal.businessName}
        representativeName={evidenceModal.representativeName}
        roleTitle={evidenceModal.roleTitle}
        contactInfo={evidenceModal.contactInfo}
        onClose={() => setEvidenceModal(p => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
