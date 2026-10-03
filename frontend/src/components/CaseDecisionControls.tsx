"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, Send, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../i18n/LanguageContext';
import { localizedError, translateStatus } from '../i18n/dictionary';
import { createActionLock, staffError } from './staffControlState';
import './case-decision-controls.css';

export type CaseDecisionItem = {
  id: number;
  status: string;
  case_code?: string;
  title?: string;
  summary?: string;
  published_at?: string | null;
  public_summary?: string | null;
  subject_response?: string | null;
  evidence?: { id: number }[];
  incoming_video_urls?: string[];
  public_video_urls?: string[];
  public_video_consent?: boolean;
  admin_reviewed?: boolean;
  alert_enabled?: boolean;
  alert_broadcast_completed_at?: string | null;
  review?: { id: number; title: string; body: string; status: string } | null;
  business?: { name: string };
};

export function CaseDecisionControls({ item, isAdmin, onSaved }: { item: CaseDecisionItem; isAdmin: boolean; onSaved: () => Promise<void> }) {
  const { lang, t } = useI18n();
  const id = useId();
  const errorRef = useRef<HTMLParagraphElement>(null);

  const [isVerified, setIsVerified] = useState(Boolean(item.admin_reviewed));
  const [alertEnabled, setAlertEnabled] = useState(Boolean(item.alert_enabled));
  const [isResolved, setIsResolved] = useState(item.status === 'resolved');
  const [reporterUpdate, setReporterUpdate] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const actionLock = useRef(createActionLock());

  useEffect(() => {
    setIsVerified(Boolean(item.admin_reviewed));
    setAlertEnabled(Boolean(item.alert_enabled));
    setIsResolved(item.status === 'resolved');
  }, [item.id, item.admin_reviewed, item.alert_enabled, item.status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setSuccess('');

    if (!actionLock.current.enter()) return;
    setBusy(true);

    try {
      const payload: any = {
        admin_reviewed: isVerified,
        alert_enabled: isVerified ? alertEnabled : false,
        status: isResolved ? 'resolved' : (item.status === 'resolved' ? 'published' : item.status),
      };

      if (reporterUpdate.trim()) {
        payload.reporter_update = reporterUpdate.trim();
      }
      if (isResolved && resolutionNote.trim()) {
        payload.resolution_note = resolutionNote.trim();
      }

      await api(`/moderation/scam-cases/${item.id}`, 'PATCH', payload);

      setReporterUpdate('');
      setResolutionNote('');
      setSuccess(t('Case moderation & verification saved successfully.', 'কেসের মডারেশন ও ভেরিফিকেশন সফলভাবে সংরক্ষিত হয়েছে।'));
      await onSaved();
    } catch (problem) {
      setError(localizedError(staffError(problem), lang));
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      actionLock.current.release();
      setBusy(false);
    }
  }

  return (
    <form className="case-decision-controls" onSubmit={event => void submit(event)} aria-busy={busy}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2D7C2', paddingBottom: 10, marginBottom: 14 }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
          <ShieldCheck size={20} color="var(--teal-primary, #0D7C66)" />
          {t('Admin Moderation & Verification', 'অ্যাডমিন মডারেশন ও ভেরিফিকেশন')}
        </h3>
        <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 99, background: isVerified ? '#D1FAE5' : '#FEF3C7', color: isVerified ? '#065F46' : '#92400E', fontWeight: 700 }}>
          {isVerified ? t('✓ Verified Case', '✓ ভেরিফাইড কেস') : t('Unverified', 'আনভেরিফাইড')}
        </span>
      </div>

      <p ref={errorRef} tabIndex={-1} className="workspace-notice" role="alert" hidden={!error} style={{ background: '#FEE2E2', color: '#991B1B' }}>
        {error}
      </p>
      {success && <p role="status" className="workspace-notice" style={{ background: '#D1FAE5', color: '#065F46' }}>{success}</p>}

      <fieldset className="case-decision-fields" disabled={busy} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Verification Checkbox */}
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 14px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontWeight: 600 }}>
            <input
              type="checkbox"
              style={{ marginTop: 3, width: 16, height: 16, accentColor: '#0D7C66' }}
              checked={isVerified}
              onChange={e => {
                setIsVerified(e.target.checked);
                if (!e.target.checked) setAlertEnabled(false);
              }}
            />
            <div>
              <span style={{ fontSize: 14, color: '#111827' }}>
                {t('Mark as Verified Case (TruthHubBD Official Verification)', 'ভেরিফাইড কেস হিসেবে চিহ্নিত করুন (ট্রুথহাববিডি অফিশিয়াল ভেরিফিকেশন)')}
              </span>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6B7280', fontWeight: 400 }}>
                {t('Confirms that the citizen report details and merchant identity have been checked by platform staff.', 'নিশ্চিত করে যে নাগরিক রিপোর্টের বিবরণ ও প্রতিষ্ঠানের পরিচয় প্ল্যাটফর্ম টিম দ্বারা যাচাই করা হয়েছে।')}
              </p>
            </div>
          </label>

          {isVerified && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px dashed #E5E7EB', cursor: 'pointer', fontSize: 13, color: '#374151' }}>
              <input
                type="checkbox"
                checked={alertEnabled}
                onChange={e => setAlertEnabled(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: '#0D7C66' }}
              />
              <span>{t('Enable Trending Placement & Broadcast Alert', 'ট্রেন্ডিং তালিকা ও সতর্কবার্তা পুশ চালু করুন')}</span>
            </label>
          )}
        </div>

        {/* Mark as Solved Checkbox */}
        <div style={{ background: isResolved ? '#ECFDF5' : '#F9FAFB', border: `1px solid ${isResolved ? '#A7F3D0' : '#E5E7EB'}`, borderRadius: 8, padding: '12px 14px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontWeight: 600 }}>
            <input
              type="checkbox"
              style={{ marginTop: 3, width: 16, height: 16, accentColor: '#059669' }}
              checked={isResolved}
              onChange={e => setIsResolved(e.target.checked)}
            />
            <div>
              <span style={{ fontSize: 14, color: isResolved ? '#065F46' : '#111827' }}>
                {t('Mark Case as Solved / Resolved', 'কেসটি সমাধান বা নিষ্পন্ন হিসেবে চিহ্নিত করুন')}
              </span>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6B7280', fontWeight: 400 }}>
                {t('Choose when the business has issued a refund, delivered the item, or resolved the dispute.', 'প্রতিষ্ঠান টাকা ফেরত দিলে, সমাধান দিলে বা বিরোধ নিষ্পত্তি করলে এটি নির্বাচন করুন।')}
              </p>
            </div>
          </label>

          {isResolved && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #A7F3D0' }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#065F46', marginBottom: 4 }}>
                {t('Resolution note (optional)', 'সমাধানের নোট (ঐচ্ছিক)')}
              </label>
              <textarea
                className="review-textarea"
                rows={2}
                maxLength={2000}
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                placeholder={t('e.g. Daraz refund of 4,500 BDT completed.', 'উদাঃ ৪,৫০০ টাকা ফেরত প্রদান সম্পন্ন হয়েছে।')}
              />
            </div>
          )}
        </div>

        {/* Private update to the reporter (optional) */}
        <div>
          <label htmlFor={id + '-reporter'} style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 5, color: '#374151' }}>
            {t('Private update to the reporter (optional)', 'রিপোর্টারের জন্য ব্যক্তিগত আপডেট (ঐচ্ছিক)')}
          </label>
          <textarea
            id={id + '-reporter'}
            className="review-textarea"
            rows={3}
            maxLength={2000}
            value={reporterUpdate}
            onChange={e => setReporterUpdate(e.target.value)}
            placeholder={t('Sent privately to the citizen reporter (e.g. "We contacted the merchant on your behalf, expect a response within 48h.")', 'সরাসরি নাগরিক প্রতিবেদকের কাছে পাঠানো হবে (উদাঃ "আমরা প্রতিষ্ঠানের সাথে যোগাযোগ করেছি, ৪৮ ঘণ্টার মধ্যে সমাধানের আশা করা যাচ্ছে।")')}
          />
        </div>

        <button
          type="submit"
          className="btn-teal-pill"
          disabled={busy}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px', cursor: 'pointer' }}
        >
          <Send size={15} />
          {busy ? t('Saving…', 'সংরক্ষণ করা হচ্ছে…') : t('Save Changes & Update', 'পরিবর্তন সংরক্ষণ করুন')}
        </button>
      </fieldset>

      {/* Permanent Deletion for Admins */}
      {isAdmin && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed #FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <strong style={{ color: '#991B1B', fontSize: 12.5, display: 'block' }}>
              {t('Permanent Case Deletion', 'কেস স্থায়ীভাবে মুছে ফেলা')}
            </strong>
            <small style={{ color: 'var(--slate-500)', fontSize: 11 }}>
              {t('Permanently remove this case dossier and its evidence.', 'এই কেস এবং এর সমস্ত তথ্য স্থায়ীভাবে ডিলিট করুন।')}
            </small>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm(t(`Permanently delete Case #${item.case_code || item.id}? This cannot be undone.`, 'এই কেসটি কি স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।'))) return;
              setBusy(true);
              try {
                await api(`/admin/scam-cases/${item.id}`, 'DELETE');
                setSuccess(t('Scam case permanently deleted.', 'কেসটি সফলভাবে মুছে ফেলা হয়েছে।'));
                await onSaved();
              } catch (err: any) {
                setError(err.message || t('Failed to delete scam case.', 'কেস মুছতে ব্যর্থ হয়েছে।'));
              } finally {
                setBusy(false);
              }
            }}
            style={{ background: '#DC2626', color: '#FFF', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 11.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Trash2 size={13} />
            {t('Delete Case', 'কেস মুছে ফেলুন')}
          </button>
        </div>
      )}
    </form>
  );
}
