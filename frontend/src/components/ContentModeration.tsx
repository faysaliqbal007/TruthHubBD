"use client";
import { useEffect, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { Eye, ShieldAlert, CheckCircle2, Search, Star, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../i18n/LanguageContext';

type ReviewPreview = {
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
    url: string;
  } | null;
};

export function ContentModeration() {
  const { t, lang } = useI18n();
  const bn = lang === 'bn';
  const location = useLocation();

  const [contentType, setContentType] = useState<'review' | 'comment'>('review');
  const [targetId, setTargetId] = useState('');
  const [status, setStatus] = useState<'published' | 'limited' | 'removed'>('limited');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<ReviewPreview | null>(null);

  // Auto-fill ID from URL if navigated from lookup (e.g. ?id=12)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryId = params.get('id');
    if (queryId && /^\d+$/.test(queryId)) {
      setTargetId(queryId);
      loadReview(Number(queryId));
    }
  }, [location.search]);

  const loadReview = async (idNum: number) => {
    if (!idNum) return;
    setLoadingPreview(true);
    setMessage('');
    try {
      const res = await api<{ data: any }>(`/reviews/${idNum}`);
      if (res?.data) {
        setPreview({
          id: res.data.id,
          title: res.data.title || `Review #${res.data.id}`,
          body: res.data.body || '',
          rating: Number(res.data.rating || 5),
          status: res.data.status || 'published',
          author: res.data.author || 'User',
          business: res.data.business,
          linked_case: res.data.linked_case || null
        });
        setStatus(res.data.status === 'removed' ? 'published' : 'limited');
      }
    } catch {
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleToggleAlert = async (enable: boolean) => {
    if (!preview?.linked_case || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const res = await api<{ success: boolean; message: string; alert_enabled: boolean }>(
        `/admin/scam-cases/${preview.linked_case.id}/alert`,
        'PATCH',
        { alert_enabled: enable }
      );
      setMessage(enable ? t('Alert activated for this review & case.', 'এই রিভিউ ও কেসের জন্য অ্যালার্ট চালু করা হয়েছে।') : t('Alert rejected / deactivated.', 'অ্যালার্ট বাতিল করা হয়েছে।'));
      setPreview(prev => prev ? {
        ...prev,
        linked_case: prev.linked_case ? { ...prev.linked_case, alert_enabled: enable } : null
      } : null);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleIdSearch = (e: FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(targetId.trim(), 10);
    if (idNum > 0 && contentType === 'review') {
      loadReview(idNum);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetId.trim() || !reason.trim() || busy) return;

    setBusy(true);
    setMessage('');
    try {
      const r = await api<{ message: string }>(
        `/moderation/content/${contentType}/${targetId.trim()}`,
        'PATCH',
        { status, reason: reason.trim() }
      );
      setMessage(r.message || t('Visibility updated successfully.', 'দৃশ্যমানতা সফলভাবে আপডেট করা হয়েছে।'));
      if (preview) {
        setPreview((prev) => (prev ? { ...prev, status } : null));
      }
      setReason('');
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!targetId.trim() || busy) return;
    const confirmed = window.confirm(
      bn
        ? `আপনি কি নিশ্চিতভাবে এই রিভিউটি (#${targetId.trim()}) স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`
        : `Are you sure you want to permanently delete Review #${targetId.trim()}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage('');
    try {
      const res = await api<{ message: string }>(`/admin/reviews/${targetId.trim()}`, 'DELETE');
      setMessage(res.message || t('Review has been permanently deleted.', 'রিভিউটি স্থায়ীভাবে মুছে ফেলা হয়েছে।'));
      setPreview(null);
      setTargetId('');
      setReason('');
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="workspace-card" style={{ background: '#ffffff', border: '1px solid #d8cdb7', borderRadius: '12px', padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={20} color="var(--vermilion)" />
          {t('Review & Content Visibility Moderation', 'রিভিউ ও বিষয়বস্তুর দৃশ্যমানতা নিয়ন্ত্রণ')}
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--slate-500)' }}>
          {t(
            'Search any Review or Comment by ID. Inspect its full text and modify visibility (published, limited, or removed).',
            'আইডি দিয়ে রিভিউ বা মন্তব্য খুঁজুন, বিস্তারিত লেখা দেখুন এবং দৃশ্যমানতা পরিবর্তন করুন।'
          )}
        </p>
      </div>

      {/* ID Lookup Form */}
      <form onSubmit={handleIdSearch} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px', background: '#fdfbf7', padding: '14px 16px', borderRadius: '8px', border: '1px solid #eae0ce' }}>
        <div style={{ minWidth: '140px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--slate-600)', marginBottom: '4px' }}>
            {t('Content Type', 'কন্টেন্টের ধরন')}
          </label>
          <select
            className="review-input"
            value={contentType}
            onChange={(e) => {
              setContentType(e.target.value as any);
              setPreview(null);
            }}
            style={{ width: '100%', margin: 0 }}
          >
            <option value="review">{t('Review (রিভিউ)', 'রিভিউ')}</option>
            <option value="comment">{t('Comment (মন্তব্য)', 'মন্তব্য')}</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--slate-600)', marginBottom: '4px' }}>
            {t('Enter ID to Inspect', 'আইডি নম্বর লিখুন')}
          </label>
          <input
            className="review-input"
            type="number"
            min="1"
            required
            placeholder="e.g. 12"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            style={{ width: '100%', margin: 0 }}
          />
        </div>

        <button
          type="submit"
          className="btn-pill-light"
          disabled={loadingPreview || !targetId.trim()}
          style={{ height: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, cursor: 'pointer' }}
        >
          {loadingPreview ? <Loader2 size={15} className="spin" /> : <Search size={15} />}
          {t('Inspect Details', 'তথ্য দেখুন')}
        </button>
      </form>

      {/* Preview Card if review found */}
      {preview && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #d8cdb7',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, background: '#f5eedb', padding: '2px 8px', borderRadius: '4px', color: 'var(--ink)' }}>
                Review #{preview.id}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  marginLeft: '8px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: preview.status === 'published' ? '#ecfdf5' : preview.status === 'limited' ? '#fef3c7' : '#fee2e2',
                  color: preview.status === 'published' ? '#065f46' : preview.status === 'limited' ? '#92400e' : '#991b1b'
                }}
              >
                STATUS: {preview.status.toUpperCase()}
              </span>
            </div>
            {preview.business && (
              <a
                href={`/reviews/${preview.id}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '12px', fontWeight: 700, color: 'var(--vermilion)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
              >
                {t('Open public view', 'পাবলিক পেজে দেখুন')} <ExternalLink size={12} />
              </a>
            )}
          </div>

          <h3 style={{ margin: '4px 0 6px', fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
            {preview.title}
          </h3>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12.5px', color: 'var(--slate-500)', marginBottom: '10px' }}>
            <span>By: <strong>{preview.author}</strong></span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', color: '#d97706', fontWeight: 700 }}>
              <Star size={13} fill="currentColor" style={{ marginRight: 3 }} /> {preview.rating} / 5
            </span>
            {preview.business && (
              <>
                <span>·</span>
                <span>Org: <strong>{preview.business.name}</strong></span>
              </>
            )}
          </div>

          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'var(--slate-700)', background: '#faf7f2', padding: '10px 14px', borderRadius: '6px' }}>
            {preview.body}
          </p>

          {preview.linked_case && (
            <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '8px', background: preview.linked_case.alert_enabled ? '#fef2f2' : '#fffbeb', border: `1px solid ${preview.linked_case.alert_enabled ? '#fca5a5' : '#fcd34d'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={16} color={preview.linked_case.alert_enabled ? '#b91c1c' : '#b45309'} />
                  <strong style={{ fontSize: '13px', color: preview.linked_case.alert_enabled ? '#991b1b' : '#92400e' }}>
                    {t('Linked Civic Alert Case:', 'সংযুক্ত সতর্কতা কেস:')} {preview.linked_case.case_code}
                  </strong>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', background: preview.linked_case.alert_enabled ? '#dc2626' : '#d97706', color: '#ffffff' }}>
                  {preview.linked_case.alert_enabled ? t('🚨 ALERT ACTIVE', '🚨 অ্যালার্ট সক্রিয়') : t('⚠️ ALERT OFF / REQUESTED', '⚠️ অ্যালার্ট বন্ধ / অনুরোধকৃত')}
                </span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: '#4b5563' }}>
                {preview.linked_case.alert_enabled 
                  ? t('This review has a broadcast alert running publicly across the platform.', 'এই রিভিউটির জন্য প্ল্যাটফর্মব্যাপী প্রকাশ্য সতর্কতা সক্রিয় আছে।')
                  : t('A scam/civic alert was requested for this review. As admin/moderator, you can verify and set the alert ON, or reject it.', 'এই রিভিউয়ের সাথে সতর্কতার আবেদন করা হয়েছে। অ্যাডমিন বা মডারেটর হিসেবে আপনি এটি চালু বা প্রত্যাখ্যান করতে পারেন।')}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {!preview.linked_case.alert_enabled ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleToggleAlert(true)}
                    style={{ background: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle2 size={14} />
                    {t('Set Alert ON (অনুমোদন / অ্যালার্ট চালু)', 'অ্যালার্ট চালু ও অনুমোদন')}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleToggleAlert(false)}
                    style={{ background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ShieldAlert size={14} />
                    {t('Reject / Turn OFF Alert (অ্যালার্ট বাতিল)', 'অ্যালার্ট বাতিল ও বন্ধ')}
                  </button>
                )}
                <a
                  href={preview.linked_case.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', textDecoration: 'underline', marginLeft: '6px' }}
                >
                  {t('Inspect Full Case File', 'সম্পূর্ণ কেস ফাইল দেখুন')} →
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decision Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '6px' }}>
            {t('New Visibility Status', 'নতুন দৃশ্যমানতার অবস্থা')}
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { val: 'published', label: bn ? 'পাবলিক (Published)' : 'Published (Visible to all)' },
              { val: 'limited', label: bn ? 'সীমিত (Limited Review)' : 'Limited (Hidden from ranking)' },
              { val: 'removed', label: bn ? 'অপসারিত (Removed)' : 'Removed (Hidden from public)' },
            ].map((opt) => (
              <label
                key={opt.val}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: status === opt.val ? '#f5eedb' : '#ffffff',
                  border: `1px solid ${status === opt.val ? 'var(--ink)' : '#d8cdb7'}`,
                  borderRadius: '6px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: status === opt.val ? 700 : 500
                }}
              >
                <input
                  type="radio"
                  name="visibility-status"
                  value={opt.val}
                  checked={status === opt.val}
                  onChange={() => setStatus(opt.val as any)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '6px' }}>
            {t('Private Moderation Decision Reason (Audited)', 'সিদ্ধান্তের ব্যক্তিগত কারণ (নিরীক্ষার জন্য সংরক্ষিত)')}
          </label>
          <textarea
            required
            maxLength={2000}
            rows={3}
            placeholder={
              bn
                ? 'কী কারণে দৃশ্যমানতা পরিবর্তন করা হচ্ছে তা লিখুন (যেমন: নীতির লঙ্ঘন, ভুল তথ্য যাচাই ইত্যাদি)...'
                : 'Explain why visibility is changed (e.g. policy violation, evidence review, restored after verification)...'
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="review-textarea"
            style={{ width: '100%', margin: 0 }}
          />
        </div>

        {message && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              background: message.includes('failed') || message.includes('error') ? '#fee2e2' : '#ecfdf5',
              color: message.includes('failed') || message.includes('error') ? '#991b1b' : '#065f46',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <CheckCircle2 size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={busy || !targetId.trim() || !reason.trim()}
            className="btn-teal-pill"
            style={{ cursor: 'pointer', padding: '10px 20px', fontWeight: 700 }}
          >
            {busy ? t('Updating…', 'আপডেট হচ্ছে…') : t('Record Visibility Decision', 'সিদ্ধান্ত সংরক্ষণ করুন')}
          </button>

          {contentType === 'review' && targetId.trim() && (
            <button
              type="button"
              disabled={busy}
              onClick={handleDeleteReview}
              style={{
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                padding: '9px 18px',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Trash2 size={14} />
              {t('Delete Review Permanently (Admin)', 'রিভিউটি সম্পূর্ণ মুছে ফেলুন')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
