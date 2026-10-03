"use client";
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, CheckCircle2, AlertCircle, ArrowRight, Search, RefreshCw, Bell, Megaphone, Send } from 'lucide-react';
import { api } from '../services/api';
import { businessService } from '../services/businessService';
import { useAuth } from '../features/auth/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import type { Business } from '../types';

type AppealItem = {
  id: number;
  scam_case_id: number;
  reason: string;
  status: string;
  created_at: string;
};

export function AdminTools() {
  const { user } = useAuth();
  const { lang, t } = useI18n();

  const [appeals, setAppeals] = useState<AppealItem[]>([]);
  const [loadingAppeals, setLoadingAppeals] = useState(true);
  const [decisions, setDecisions] = useState<Record<number, string>>({});
  const [busyAppeal, setBusyAppeal] = useState<number | null>(null);

  const [message, setMessage] = useState('');
  const [noticeError, setNoticeError] = useState(false);

  // Merge tool state
  const [sourceQuery, setSourceQuery] = useState('');
  const [targetQuery, setTargetQuery] = useState('');
  const [sourceResults, setSourceResults] = useState<Business[]>([]);
  const [targetResults, setTargetResults] = useState<Business[]>([]);
  const [selectedSource, setSelectedSource] = useState<Business | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<Business | null>(null);
  const [mergeReason, setMergeReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [merging, setMerging] = useState(false);

  // Broadcast notification state
  const [bTitle, setBTitle] = useState('');
  const [bMessage, setBMessage] = useState('');
  const [bRole, setBRole] = useState<string>('all');
  const [bSpecificUser, setBSpecificUser] = useState('');
  const [bUrl, setBUrl] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [bFeedback, setBFeedback] = useState('');
  const [bError, setBError] = useState(false);

  const loadAppeals = () => {
    setLoadingAppeals(true);
    api<{ data: AppealItem[] }>('/admin/appeals')
      .then((r) => setAppeals(r.data))
      .catch((e) => {
        setMessage(e.message);
        setNoticeError(true);
      })
      .finally(() => setLoadingAppeals(false));
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAppeals();
    }
  }, [user]);

  // Source entity search
  useEffect(() => {
    if (sourceQuery.trim().length < 2) {
      setSourceResults([]);
      return;
    }
    const timer = setTimeout(() => {
      businessService.searchPage(sourceQuery.trim(), 'All Categories', 0, 1, '')
        .then((res) => setSourceResults(res.data))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [sourceQuery]);

  // Target entity search
  useEffect(() => {
    if (targetQuery.trim().length < 2) {
      setTargetResults([]);
      return;
    }
    const timer = setTimeout(() => {
      businessService.searchPage(targetQuery.trim(), 'All Categories', 0, 1, '')
        .then((res) => setTargetResults(res.data.filter((b) => b.status === 'approved')))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [targetQuery]);

  const handleAppealDecision = async (appealId: number, status: 'affirmed' | 'reversed') => {
    const note = (decisions[appealId] || '').trim();
    if (!note) return;

    setBusyAppeal(appealId);
    setMessage('');
    try {
      await api(`/admin/appeals/${appealId}`, 'PATCH', { status, decision_note: note });
      setAppeals((prev) => prev.filter((i) => i.id !== appealId));
      setMessage(`Appeal #${appealId} ${status === 'affirmed' ? 'affirmed' : 'reversed'}. Decision recorded in audit history.`);
      setNoticeError(false);
    } catch (e) {
      setMessage((e as Error).message);
      setNoticeError(true);
    } finally {
      setBusyAppeal(null);
    }
  };

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSource || !selectedTarget || !mergeReason.trim() || !confirmed || merging) return;

    if (selectedSource.id === selectedTarget.id) {
      setMessage('Cannot merge an entity into itself.');
      setNoticeError(true);
      return;
    }

    setMerging(true);
    setMessage('');
    try {
      const res = await api<{ message: string }>(
        `/admin/businesses/${selectedSource.id}/merge`,
        'POST',
        {
          target_id: selectedTarget.id,
          reason: mergeReason.trim()
        }
      );
      setMessage(res.message || 'Entities merged successfully. Reviews and cases transferred.');
      setNoticeError(false);
      setSelectedSource(null);
      setSelectedTarget(null);
      setMergeReason('');
      setConfirmed(false);
      setSourceQuery('');
      setTargetQuery('');
    } catch (e) {
      setMessage((e as Error).message);
      setNoticeError(true);
    } finally {
      setMerging(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle.trim() || !bMessage.trim() || broadcasting) return;

    setBroadcasting(true);
    setBFeedback('');
    setBError(false);

    try {
      const res = await api<{ message: string; count?: number }>('/admin/broadcast-notification', 'POST', {
        title: bTitle.trim(),
        message: bMessage.trim(),
        target_role: bRole === 'specific' ? bSpecificUser.trim() : bRole,
        action_url: bUrl.trim() || undefined
      });
      setBFeedback(res.message || t('Broadcast notification sent successfully.', 'বিজ্ঞপ্তি সফলভাবে সব ব্যবহারকারীকে পাঠানো হয়েছে।'));
      setBTitle('');
      setBMessage('');
      setBUrl('');
      setBSpecificUser('');
    } catch (err: any) {
      setBFeedback(err.message || t('Failed to broadcast notification.', 'বিজ্ঞপ্তি পাঠাতে ব্যর্থ হয়েছে।'));
      setBError(true);
    } finally {
      setBroadcasting(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="workspace-page">
        <p role="alert">{t('Sign in as Admin to access these tools.', 'এই নিয়ন্ত্রণ ব্যবহারের জন্য অ্যাডমিন হিসেবে সাইন ইন করুন।')}</p>
      </div>
    );
  }

  return (
    <div className="workspace-page">
      <div className="workspace-heading">
        <span className="workspace-eyebrow">{t('ADMIN / DECISIONS', 'অ্যাডমিন / সিদ্ধান্ত')}</span>
        <h1>{t('Appeals, Announcements & Merges', 'আপিল, ঘোষণা ও প্রতিষ্ঠান একত্রীকরণ')}</h1>
        <p>
          {t(
            'Broadcast platform alerts to users, review appeals against scam case findings, and merge duplicate organization profiles.',
            'ব্যবহারকারীদের সার্বিক বিজ্ঞপ্তি পাঠান, কেসের সিদ্ধান্তের বিরুদ্ধে আপিল বিবেচনা করুন এবং ডুপ্লিকেট প্রতিষ্ঠান একত্র করুন।'
          )}
        </p>
      </div>

      {/* SECTION 0: BROADCAST ANNOUNCEMENT */}
      <section className="workspace-card" style={{ background: '#ffffff', border: '1px solid #d8cdb7', borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone size={20} color="var(--vermilion)" />
            {t('Broadcast Global Notification', 'সার্বিক নোটিফিকেশন / ঘোষণা পাঠান')}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--slate-500)' }}>
            {t(
              'Instantly send an in-app notification bell update to all registered accounts or targeted groups across web and mobile devices.',
              'ওয়েব ও মোবাইল সকল নিবন্ধিত ব্যবহারকারীর নোটিফিকেশন বক্সে তাৎক্ষণিকভাবে নোটিফিকেশন পাঠান।'
            )}
          </p>
        </div>

        {bFeedback && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: bError ? '#fee2e2' : '#ecfdf5',
              color: bError ? '#991b1b' : '#065f46',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {bError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {bFeedback}
          </div>
        )}

        <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '680px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '4px' }}>
                {t('Notification Title', 'বিজ্ঞপ্তির শিরোনাম')}
              </label>
              <input
                type="text"
                className="review-input"
                required
                maxLength={255}
                placeholder={t('e.g. Critical Safety Alert or Platform Update', 'যেমন: জরুরি সতর্কবার্তা বা নতুন ফিচার')}
                value={bTitle}
                onChange={(e) => setBTitle(e.target.value)}
                style={{ width: '100%', margin: 0 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '4px' }}>
                {t('Target Audience', 'প্রাপক নির্বাচন')}
              </label>
              <select
                className="review-input"
                value={bRole}
                onChange={(e) => setBRole(e.target.value)}
                style={{ width: '100%', margin: 0, marginBottom: bRole === 'specific' ? '8px' : 0 }}
              >
                <option value="all">{t('All Registered Accounts (সকল ব্যবহারকারী)', 'সকল ব্যবহারকারী')}</option>
                <option value="citizen">{t('Citizen Users Only (নাগরিক অ্যাকাউন্ট)', 'নাগরিক অ্যাকাউন্ট')}</option>
                <option value="business">{t('Business Accounts Only (ব্যবসা প্রতিষ্ঠান)', 'ব্যবসা প্রতিষ্ঠান')}</option>
                <option value="specific">{t('Specific User ID', 'নির্দিষ্ট ব্যবহারকারী আইডি')}</option>
              </select>
              {bRole === 'specific' && (
                <input
                  type="text"
                  className="review-input"
                  required
                  placeholder={t('Enter User ID', 'ইউজার আইডি লিখুন')}
                  value={bSpecificUser}
                  onChange={(e) => setBSpecificUser(e.target.value)}
                  style={{ width: '100%', margin: 0 }}
                />
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '4px' }}>
              {t('Notification Message', 'বিজ্ঞপ্তির বিবরণ')}
            </label>
            <textarea
              className="review-textarea"
              required
              rows={3}
              maxLength={1000}
              placeholder={t('Write the announcement text that appears in user notification feed…', 'ব্যবহারকারীদের নোটিফিকেশনে যা প্রদর্শিত হবে তা লিখুন…')}
              value={bMessage}
              onChange={(e) => setBMessage(e.target.value)}
              style={{ width: '100%', margin: 0 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '4px' }}>
              {t('Optional Action Link (URL)', 'ঐচ্ছিক লিঙ্ক')}
            </label>
            <input
              type="text"
              className="review-input"
              maxLength={255}
              placeholder="/scam-alerts or /search or /business/..."
              value={bUrl}
              onChange={(e) => setBUrl(e.target.value)}
              style={{ width: '100%', margin: 0 }}
            />
          </div>

          <button
            type="submit"
            disabled={broadcasting || !bTitle.trim() || !bMessage.trim()}
            className="btn-teal-pill"
            style={{ alignSelf: 'flex-start', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Send size={15} />
            {broadcasting ? t('Broadcasting…', 'পাঠানো হচ্ছে…') : t('Send Notification to Everyone', 'সকলের কাছে নোটিফিকেশন পাঠান')}
          </button>
        </form>
      </section>

      {message && (
        <p
          role={noticeError ? 'alert' : 'status'}
          className="workspace-notice"
          style={{
            background: noticeError ? '#fef2f2' : '#ecfdf5',
            color: noticeError ? '#991b1b' : '#065f46',
            border: `1px solid ${noticeError ? '#fecaca' : '#a7f3d0'}`,
            marginBottom: '20px'
          }}
        >
          {message}
        </p>
      )}

      {/* SECTION 1: APPEALS */}
      <section className="workspace-card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{t('Appeals Awaiting Review', 'পর্যালোচনার অপেক্ষমাণ আপিল')}</h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--slate-500)' }}>
              {t('Subject organizations or reporters requesting an independent admin reconsideration.', 'প্রতিষ্ঠান বা রিপোর্টার কর্তৃক পুনরায় বিবেচনার আবেদন।')}
            </p>
          </div>
          <button type="button" className="btn-pill-light" onClick={loadAppeals} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} />
            <span>{t('Refresh', 'রিফ্রেশ')}</span>
          </button>
        </div>

        {loadingAppeals ? (
          <p role="status">{t('Loading appeals…', 'আপিল লোড হচ্ছে…')}</p>
        ) : !appeals.length ? (
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <CheckCircle2 size={24} color="#059669" style={{ margin: '0 auto 6px' }} />
            <p style={{ margin: 0, color: 'var(--slate-600)', fontSize: '13.5px' }}>{t('No pending appeals waiting for decision.', 'কোনো অপেক্ষমাণ আপিল নেই।')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {appeals.map((a) => (
              <article key={a.id} className="workspace-notice" style={{ background: '#fffdfa', border: '1px solid #d8cdb7', padding: '16px 20px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>
                    Appeal #{a.id} &bull; Scam Case #{a.scam_case_id}
                  </strong>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', background: '#fef3c7', color: '#92400e', borderRadius: '4px' }}>
                    PENDING
                  </span>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #eae0ce', fontSize: '13.5px', color: 'var(--slate-700)', marginBottom: '12px' }}>
                  <strong>Appeal statement:</strong> {a.reason}
                </div>

                <fieldset disabled={busyAppeal === a.id} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--slate-700)' }}>
                    {t('Admin Decision Rationale (required):', 'সিদ্ধান্তের কারণ (আবশ্যক):')}
                  </label>
                  <textarea
                    className="review-textarea"
                    placeholder={t('Explain the rationale for affirming or reversing this decision…', 'সিদ্ধান্তের বিস্তারিত কারণ লিখুন…')}
                    value={decisions[a.id] || ''}
                    onChange={(e) => setDecisions({ ...decisions, [a.id]: e.target.value })}
                    style={{ width: '100%', margin: '0 0 10px' }}
                    rows={2}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn-teal-pill"
                      disabled={!(decisions[a.id] || '').trim()}
                      onClick={() => handleAppealDecision(a.id, 'affirmed')}
                    >
                      {t('Affirm Case Decision', 'কেসের সিদ্ধান্ত বহাল রাখুন')}
                    </button>
                    <button
                      type="button"
                      className="btn-pill-light"
                      disabled={!(decisions[a.id] || '').trim()}
                      onClick={() => handleAppealDecision(a.id, 'reversed')}
                    >
                      {t('Reverse Decision (Restrict Case)', 'সিদ্ধান্ত পরিবর্তন করুন (কেস সীমিত)')}
                    </button>
                  </div>
                </fieldset>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: DUPLICATE ENTITY MERGER */}
      <section className="workspace-card">
        <h2 style={{ margin: '0 0 6px', fontSize: '1.25rem' }}>{t('Merge Duplicate Organizations', 'ডুপ্লিকেট প্রতিষ্ঠান একত্রীকরণ')}</h2>
        <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'var(--slate-500)', lineHeight: 1.5 }}>
          {t(
            'Reviews and scam cases are atomically moved to the canonical profile. The duplicate profile will redirect with a 301 alias and the action is permanently audited.',
            'সকল রিভিউ ও কেস মূল প্রোফাইলে স্থানান্তরিত হবে। ডুপ্লিকেট প্রোফাইলটি রিডাইরেক্ট হবে এবং সকল তথ্য নিরীক্ষা লগে থাকবে।'
          )}
        </p>

        <form onSubmit={handleMergeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '16px' }}>
            {/* Source Entity Selection */}
            <div style={{ background: '#fdfbf7', padding: '16px', borderRadius: '8px', border: '1px solid #eae0ce' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                1. {t('Duplicate Entity (To be merged & retired)', 'ডুপ্লিকেট প্রতিষ্ঠান (যা বিলীন হবে)')}
              </label>
              {selectedSource ? (
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--teal-primary)', marginBottom: '8px' }}>
                  <strong style={{ display: 'block', color: 'var(--ink)' }}>{selectedSource.name}</strong>
                  <small style={{ color: 'var(--slate-500)' }}>ID #{selectedSource.id} &bull; {selectedSource.location}</small>
                  <button
                    type="button"
                    onClick={() => setSelectedSource(null)}
                    style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: '#b91c1c', border: 0, background: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Change selection &times;
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="search"
                    placeholder={t('Type name to search duplicate…', 'ডুপ্লিকেট প্রতিষ্ঠানের নাম লিখুন…')}
                    className="review-input"
                    value={sourceQuery}
                    onChange={(e) => setSourceQuery(e.target.value)}
                    style={{ width: '100%', margin: '0 0 6px' }}
                  />
                  {sourceResults.length > 0 && (
                    <div style={{ maxHeight: '160px', overflowY: 'auto', background: '#ffffff', border: '1px solid #d8cdb7', borderRadius: '6px' }}>
                      {sourceResults.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedSource(b);
                            setSourceResults([]);
                          }}
                          style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 0, borderBottom: '1px solid #f1f5f9', background: 'none', cursor: 'pointer' }}
                        >
                          <strong style={{ display: 'block', fontSize: '13px' }}>{b.name}</strong>
                          <small style={{ color: 'var(--slate-500)', fontSize: '11px' }}>#{b.id} &bull; {b.location || 'No location'}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Target Entity Selection */}
            <div style={{ background: '#fdfbf7', padding: '16px', borderRadius: '8px', border: '1px solid #eae0ce' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                2. {t('Canonical Destination (Primary profile)', 'মূল প্রতিষ্ঠান (যাতে যুক্ত হবে)')}
              </label>
              {selectedTarget ? (
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--teal-primary)', marginBottom: '8px' }}>
                  <strong style={{ display: 'block', color: 'var(--ink)' }}>{selectedTarget.name}</strong>
                  <small style={{ color: 'var(--slate-500)' }}>ID #{selectedTarget.id} &bull; {selectedTarget.location}</small>
                  <button
                    type="button"
                    onClick={() => setSelectedTarget(null)}
                    style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: '#b91c1c', border: 0, background: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Change selection &times;
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="search"
                    placeholder={t('Type name to search primary entity…', 'মূল প্রতিষ্ঠানের নাম লিখুন…')}
                    className="review-input"
                    value={targetQuery}
                    onChange={(e) => setTargetQuery(e.target.value)}
                    style={{ width: '100%', margin: '0 0 6px' }}
                  />
                  {targetResults.length > 0 && (
                    <div style={{ maxHeight: '160px', overflowY: 'auto', background: '#ffffff', border: '1px solid #d8cdb7', borderRadius: '6px' }}>
                      {targetResults.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedTarget(b);
                            setTargetResults([]);
                          }}
                          style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 0, borderBottom: '1px solid #f1f5f9', background: 'none', cursor: 'pointer' }}
                        >
                          <strong style={{ display: 'block', fontSize: '13px' }}>{b.name}</strong>
                          <small style={{ color: 'var(--slate-500)', fontSize: '11px' }}>#{b.id} &bull; {b.location || 'No location'}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--slate-700)' }}>
              {t('Merge Rationale (recorded in audit log):', 'একত্রীকরণের কারণ (নিরীক্ষা লগে সংরক্ষিত হবে):')}
            </label>
            <textarea
              className="review-textarea"
              required
              maxLength={2000}
              placeholder={t('e.g. Confirmed duplicate profile of the same branch with identical phone/trade license.', 'যেমন: একই শাখার পুনরাবৃত্ত প্রোফাইল, ফোন ও লাইসেন্স এক।')}
              value={mergeReason}
              onChange={(e) => setMergeReason(e.target.value)}
              style={{ width: '100%', margin: 0 }}
              rows={2}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              required
            />
            <span>{t('I verified these profiles represent the exact same entity.', 'আমি নিশ্চিত হয়েছি যে এই দুটি প্রোফাইল একই সত্তাকে নির্দেশ করে।')}</span>
          </label>

          <button
            type="submit"
            className="btn-teal-pill"
            disabled={!selectedSource || !selectedTarget || !mergeReason.trim() || !confirmed || merging}
            style={{ alignSelf: 'flex-start', cursor: 'pointer' }}
          >
            {merging ? t('Merging entities…', 'একত্রীকরণ হচ্ছে…') : t('Execute Entity Merge', 'প্রতিষ্ঠান একত্রীকরণ সম্পন্ন করুন')}
          </button>
        </form>
      </section>
    </div>
  );
}

export function AppealForm({ caseId }: { caseId: number }) {
  const [message, setMessage] = useState('');
  return (
    <details>
      <summary>Appeal a case decision</summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          try {
            const r = await api<{ message: string }>(`/scam-cases/${caseId}/appeals`, 'POST', {
              reason: data.get('reason')
            });
            setMessage(r.message);
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        <label>
          Why should the Admin review this decision?
          <textarea className="review-textarea" name="reason" required maxLength={3000} />
        </label>
        <button className="btn-pill-light">Submit appeal</button>
        <p role="status">{message}</p>
      </form>
    </details>
  );
}
