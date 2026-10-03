"use client";
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import type { Business } from '../types';
import { MultiFilePicker } from './MultiFilePicker';
import { PublicVideoField, PublicVideoLinks } from './PublicVideoLinks';
import { parsePublicVideoUrls } from '../lib/publicVideoUrls';
import { useI18n } from '../i18n/LanguageContext';
import { formatNumber, formatDate, translateCategory, translateStatus, localizedError } from '../i18n/dictionary';
import { AddBusinessModal } from './ui/AddBusinessModal';

export function SubmitCasePage() {
  const { user, checking } = useAuth();
  const { lang, t } = useI18n();
  const [entities, setEntities] = useState<Business[]>([]);
  const [entityQuery, setEntityQuery] = useState('');
  const [entityLoading, setEntityLoading] = useState(false);
  const [entityError, setEntityError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [caseStatus, setCaseStatus] = useState('published');
  const [review, setReview] = useState(false);
  const [draft, setDraft] = useState({ business_id: '', title: '', summary: '', amount: '', incident_type: 'non_delivery', incident_date: '' });
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState('');
  const [videoConsent, setVideoConsent] = useState(false);
  const [alertRequested, setAlertRequested] = useState(false);
  const [addOrgOpen, setAddOrgOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const submitting = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramBid = params.get('business_id');
    if (paramBid) {
      setDraft(d => ({ ...d, business_id: paramBid }));
      api<{ data: Business }>(`/businesses/${paramBid}`)
        .then(r => {
          if (r.data) {
            setEntities(prev => prev.some(b => b.id === r.data.id) ? prev : [r.data, ...prev]);
            setEntityQuery(r.data.name);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    let active = true;
    setEntityError('');
    if (entityQuery.trim().length < 2) {
      setEntities([]);
      setEntityLoading(false);
      return;
    }
    setEntityLoading(true);
    const timer = setTimeout(() => {
      api<{ data: Business[] }>(`/businesses?${new URLSearchParams({ q: entityQuery, limit: '20' })}`)
        .then(r => { if (active) setEntities(r.data); })
        .catch(() => {
          if (active) {
            setEntities([]);
            setEntityError(t('Organizations could not be loaded. Change your search to retry.', 'প্রতিষ্ঠানের তালিকা আসেনি। অন্য নাম লিখে আবার চেষ্টা করুন।'));
          }
        })
        .finally(() => { if (active) setEntityLoading(false); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [entityQuery]);

  useEffect(() => { heading.current?.focus(); }, [review, code]);

  // Build & revoke object URLs whenever files change
  useEffect(() => {
    const urls = files
      .filter(f => f.type.startsWith('image/'))
      .map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => { urls.forEach(u => URL.revokeObjectURL(u)); };
  }, [files]);

  const update = (field: keyof typeof draft, value: string) => setDraft(d => ({ ...d, [field]: value }));
  const selected = entities.find(b => String(b.id) === draft.business_id);
  const isOwnOrg = Boolean(user && selected && (selected as any).user_id === user.id);

  function goBack() {
    setReview(false);
    setMessage('');
  }

  async function submit() {
    if (submitting.current || isOwnOrg) return;
    const videos = parsePublicVideoUrls(videoUrls);
    if (videos.error || (videos.urls.length && !videoConsent)) {
      setMessage(t('Use up to 3 supported public HTTPS video URLs and confirm sharing permission.', 'সর্বোচ্চ ৩টি সমর্থিত প্রকাশ্য HTTPS ভিডিও লিংক দিন এবং শেয়ারের অনুমতি নিশ্চিত করুন।'));
      setReview(false);
      return;
    }
    submitting.current = true;
    setBusy(true);
    setMessage('');

    const data = new FormData();
    data.set('title', draft.title.trim());
    data.set('summary', draft.summary.trim());
    if (draft.amount) data.set('amount', draft.amount);
    data.set('incident_type', draft.incident_type);
    if (draft.incident_date) data.set('incident_date', draft.incident_date);
    data.set('alert_requested', alertRequested ? '1' : '0');
    for (const file of files) data.append('evidence[]', file);
    for (const url of videos.urls) data.append('public_video_urls[]', url);
    data.set('public_video_consent', videoConsent ? '1' : '0');

    try {
      const result = await api<{ data: { case_code: string; status?: string } }>(`/businesses/${draft.business_id}/scam-cases`, 'POST', data);
      setCode(result.data.case_code);
      setCaseStatus(result.data.status ?? 'published');
      setFiles([]);
      setVideoUrls('');
      setVideoConsent(false);
      setAlertRequested(false);
    } catch (err) {
      setMessage(localizedError((err as Error).message, lang));
      setReview(false);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="workspace-page case-submit-page">
      <header className="workspace-heading">
        <span className="alert-eyebrow">{t("PUBLIC SCAM ALERT", "পাবলিক স্ক্যাম অ্যালার্ট")}</span>
        <h1 ref={heading} tabIndex={-1}>
          {code
            ? (caseStatus === 'submitted'
                ? t("Your case has been submitted!", "আপনার কেস জমা হয়েছে!")
                : t("Your scam alert is now LIVE!", "আপনার স্ক্যাম অ্যালার্ট এখন সবার জন্য উন্মুক্ত!"))
            : review
            ? t("Check your scam alert before publishing", "প্রকাশের আগে সতর্কতা রিপোর্টটি দেখে নিন")
            : t("Report a Scam Incident", "প্রতারণার ঘটনা জানান")}
        </h1>
        <p>
          {t("Cases are published automatically to the public alert board so citizens are immediately warned. Platform admins verify authenticity, and the organization is invited to provide a solution or refund.", "কেস সরাসরি সবার দেখার জন্য উন্মুক্ত হয় যাতে অন্য নাগরিকরা সতর্ক থাকতে পারেন। অ্যাডমিনরা তথ্য যাচাই করেন এবং প্রতিষ্ঠান সমাধান বা প্রমাণ দিতে পারে।")}
        </p>
      </header>

      <nav className="workspace-tabs">
        <Link to="/scam-alerts">{t("Public cases", "পাবলিক কেস")}</Link>
        <Link to="/profile?tab=cases">{t("Track my cases", "আমার কেসগুলো ট্র্যাক করুন")}</Link>
        <Link to="/policies">{t("Evidence standards", "প্রমাণের মানদণ্ড")}</Link>
      </nav>

      {message && <p role="alert" className="workspace-notice" style={{ background: '#FEE2E2', color: '#991B1B', borderColor: '#FCA5A5' }}>{message}</p>}

      {isOwnOrg && (
        <p role="alert" className="workspace-notice" style={{ background: '#FEF2F2', color: '#B91C1C', borderColor: '#F87171' }}>
          <strong>{t("Action not permitted:", "অনুমোদন নেই:")}</strong> {t("You cannot submit a scam case against your own organization. Manage cases from Business Center.", "আপনি নিজের প্রতিষ্ঠানের বিরুদ্ধে কেস জমা দিতে পারবেন না। বিজনেস সেন্টার থেকে সমাধান দিন।")}
        </p>
      )}

      {checking ? (
        <p role="status">{t("Checking your account…", "অ্যাকাউন্ট যাচাই করা হচ্ছে…")}</p>
      ) : !user ? (
        <section className="workspace-card">
          <ShieldCheck />
          <h2>{t("Sign in before you start", "শুরু করার আগে সাইন ইন করুন")}</h2>
          <p>{t("A verified account lets you follow your case updates and mark the issue as solved once resolved. We do not save report drafts on this device.", "আপনার অ্যাকাউন্ট থেকে কেসের অগ্রগতি দেখা, প্রমাণ যোগ করা এবং সমস্যা সমাধান হলে Solved হিসেবে চিহ্নিত করা যাবে।")}</p>
          <Link to="/login?next=%2Fscam-alerts%2Fsubmit" className="btn-teal-pill">{t("Sign in to report", "রিপোর্ট করতে সাইন ইন করুন")}</Link>
        </section>
      ) : code ? (
        <section className="workspace-card case-receipt">
          <CheckCircle2 size={36} />
          <h2>{t("Reference:", "রেফারেন্স:")} {code}</h2>
          <p>{t("Your scam alert is now LIVE and published on TruthHubBD! Citizens can now view this alert immediately.", "আপনার স্ক্যাম অ্যালার্ট এখন সরাসরি পাবলিক বোর্ডের তালিকায় যুক্ত হয়েছে! নাগরিকরা তাৎক্ষণিকভাবে এটি দেখতে পাচ্ছেন।")}</p>
          <h3>{t("What happens next?", "এরপর কী হবে?")}</h3>
          <p>
            {t(
              "1. The organization has been notified to provide an official explanation, refund, or solution.\n2. TruthHubBD Admins will verify the report.\n3. As the reporter, you can mark the case as Solved at any time once resolved.",
              "১. সংশ্লিষ্ট প্রতিষ্ঠানকে আনুষ্ঠানিকভাবে সমাধান বা প্রমাণ দেওয়ার জন্য নোটিফিকেশন পাঠানো হয়েছে।\n২. ট্রুথহাববিডি অ্যাডমিন দল কেসটি ভেরিফাই করবে।\n৩. সমাধান বা টাকা ফেরত পেলে আপনি যেকোনো সময় কেসটিকে Solved হিসেবে মার্ক করতে পারবেন।"
            )}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16, alignItems: 'center' }}>
            <Link to={`/scam-alerts/${code}`} className="btn-teal-pill">
              {t("View Public Alert Now →", "সরাসরি পাবলিক অ্যালার্ট দেখুন →")}
            </Link>
            <Link to="/profile?tab=cases" className="btn-pill-light">
              {t("Track in My Profile →", "প্রোফাইলে ট্র্যাক করুন →")}
            </Link>
          </div>
        </section>
      ) : (
        <div className="alert-workspace">
          <div>
            <ol className="case-progress" aria-label={t("Report progress", "রিপোর্টের ধাপ")}>
              <li aria-current={!review ? 'step' : undefined}>{t("1. Details & evidence", "১. বিবরণ ও প্রমাণ")}</li>
              <li aria-current={review ? 'step' : undefined}>{t("2. Review & submit", "২. দেখে নিশ্চিত করুন")}</li>
            </ol>

            {!review ? (
              <form
                className="workspace-card review-form-content"
                onSubmit={e => {
                  e.preventDefault();
                  if (!draft.title.trim() || !draft.summary.trim()) {
                    setMessage(t("Enter a title and description, not only spaces.", "শিরোনাম ও ঘটনার বিবরণ লিখুন; শুধু ফাঁকা জায়গা নয়।"));
                    return;
                  }
                  if (isOwnOrg) {
                    setMessage(t("You cannot submit a scam case against your own organization.", "আপনি নিজের প্রতিষ্ঠানের বিরুদ্ধে প্রতারণার অভিযোগ জমা দিতে পারবেন না।"));
                    return;
                  }
                  setMessage('');
                  setReview(true);
                }}
              >
                <label>
                  {t("Find the organization", "প্রতিষ্ঠান খুঁজুন")}
                  <input
                    className="review-input"
                    value={entityQuery}
                    maxLength={255}
                    placeholder={t("Search by organization name or area", "প্রতিষ্ঠানের নাম বা এলাকা দিয়ে খুঁজুন")}
                    onChange={e => { setEntityQuery(e.target.value); update('business_id', ''); }}
                  />
                </label>

                <fieldset className="civic-entity-fieldset">
                  <legend>{t("Choose the organization concerned", "সংশ্লিষ্ট প্রতিষ্ঠান নির্বাচন করুন")}</legend>
                  <div className="civic-entity-options">
                    {entityQuery.trim().length < 2 ? (
                      <p>{t("Type at least two characters above to find the correct branch.", "সঠিক শাখা খুঁজতে উপরে অন্তত দুটি অক্ষর লিখুন।")}</p>
                    ) : entityLoading ? (
                      <p role="status">{t('Searching organizations…', 'প্রতিষ্ঠান খোঁজা হচ্ছে…')}</p>
                    ) : entityError ? (
                      <p role="alert">{entityError}</p>
                    ) : entities.length ? (
                      entities.slice(0, 8).map(b => (
                        <button
                          key={b.id}
                          type="button"
                          className="civic-entity-option"
                          aria-pressed={draft.business_id === String(b.id)}
                          onClick={() => update('business_id', String(b.id))}
                        >
                          <strong>{lang === 'bn' && b.bengaliName ? b.bengaliName : b.name}</strong>
                          <small>{b.location || t("Address not supplied", "ঠিকানা দেওয়া নেই")} · {translateCategory(b.category, lang)}</small>
                          {draft.business_id === String(b.id) && <span>{t("✓ Selected", "✓ নির্বাচিত")}</span>}
                        </button>
                      ))
                    ) : (
                      <p>{t("No matches. Try a different name or area.", "কোনো প্রতিষ্ঠান পাওয়া যায়নি। অন্য নাম বা এলাকা দিয়ে খুঁজুন।")}</p>
                    )}
                  </div>
                </fieldset>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, margin: '8px 0 16px' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
                    {t("Not listed?", "তালিকায় নেই?")} <Link to="/search">{t("Search and add the entity first", "আগে খুঁজে প্রতিষ্ঠানটি যোগ করুন")}</Link>{t(". Choose the correct branch.", ". সঠিক শাখাটি নির্বাচন করুন।")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddOrgOpen(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#e11d48', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <span style={{ fontSize: 17, lineHeight: 1 }}>⊕</span>
                    {t('Organization missing? Add it', 'প্রতিষ্ঠান নেই? যোগ করুন')}
                  </button>
                </div>

                <label>
                  {t("Scam alert title", "স্ক্যাম অ্যালার্টের শিরোনাম")}
                  <input
                    className="review-input"
                    value={draft.title}
                    onChange={e => update('title', e.target.value)}
                    required
                    maxLength={255}
                    placeholder={t("A short, factual description of the incident", "ঘটনার সংক্ষিপ্ত ও তথ্যভিত্তিক শিরোনাম")}
                  />
                </label>

                <label>
                  {t("What happened?", "কী ঘটেছে?")}
                  <textarea
                    className="review-textarea"
                    value={draft.summary}
                    onChange={e => update('summary', e.target.value)}
                    required
                    maxLength={5000}
                    rows={8}
                    placeholder={t("Include dates, what was promised, what happened, and attempts to resolve it.", "তারিখ, কী প্রতিশ্রুতি ছিল, কী ঘটেছে এবং সমাধানের জন্য কী চেষ্টা করেছেন লিখুন।")}
                  />
                </label>
                <small>{formatNumber(draft.summary.length, lang)}/{formatNumber(5000, lang)} {t("characters", "অক্ষর")}</small>

                <label>
                  {t("Incident type", "ঘটনার ধরন")}
                  <select className="review-input" value={draft.incident_type} onChange={e => update('incident_type', e.target.value)}>
                    <option value="non_delivery">{t("Goods or service not delivered", "পণ্য বা সেবা পাওয়া যায়নি")}</option>
                    <option value="bribery">{t("Bribery", "ঘুষ দেওয়া/নেওয়া")}</option>
                    <option value="payment">{t("Payment concern", "অর্থ পরিশোধের সমস্যা")}</option>
                    <option value="impersonation">{t("Impersonation", "পরিচয় নকল")}</option>
                    <option value="misleading_offer">{t("Misleading offer", "বিভ্রান্তিকর অফার")}</option>
                    <option value="other">{t("Other / unsure", "অন্য / নিশ্চিত নই")}</option>
                  </select>
                </label>

                <label>
                  {t("Incident date (optional)", "ঘটনার তারিখ (ঐচ্ছিক)")}
                  <input className="review-input" type="date" value={draft.incident_date} max={new Date().toLocaleDateString('en-CA')} onChange={e => update('incident_date', e.target.value)} />
                </label>

                <label>
                  {t("Amount involved (BDT, optional)", "সংশ্লিষ্ট টাকার পরিমাণ (ঐচ্ছিক)")}
                  <input className="review-input" value={draft.amount} onChange={e => update('amount', e.target.value)} type="number" min="0" step="0.01" />
                </label>

                <MultiFilePicker files={files} onChange={setFiles} maxFiles={20} disabled={busy} label={t("Supporting evidence (optional)", "সহায়ক প্রমাণ (ঐচ্ছিক)")} />
                <PublicVideoField value={videoUrls} onChange={setVideoUrls} consent={videoConsent} onConsent={setVideoConsent} privateIntake disabled={busy} />

                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 8,
                  padding: '14px 16px',
                  marginTop: 14,
                  marginBottom: 16
                }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', margin: 0, fontWeight: 600, color: '#92400e' }}>
                    <input
                      type="checkbox"
                      checked={alertRequested}
                      onChange={e => setAlertRequested(e.target.checked)}
                      style={{ marginTop: 3, width: 18, height: 18, accentColor: '#d97706' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={16} color="#d97706" />
                        <span>{t("Request admin to turn on alert notice for this case", "এই কেসটির জন্য জরুরি পাবলিক অ্যালার্ট নোটিশ চালুর অনুরোধ")}</span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 12.5, fontWeight: 'normal', color: '#78350f', lineHeight: 1.4 }}>
                        {t(
                          "Check this if this scam represents an ongoing widespread threat or major financial loss. This alerts platform admins to prioritize activating an official public alert notice.",
                          "যদি এই ঘটনাটি চলমান প্রতারণা বা ব্যাপক ক্ষতি নির্দেশ করে, তবে এটি সিলেক্ট করুন। এতে প্ল্যাটফর্ম অ্যাডমিনদের কাছে জরুরি অ্যালার্ট নোটিশ সক্রিয় করার অগ্রাধিকার অনুরোধ পৌঁছাবে।"
                        )}
                      </p>
                    </div>
                  </label>
                </div>

                <button className="btn-teal-pill" disabled={!draft.business_id || isOwnOrg}>{t("Review my report →", "আমার রিপোর্ট দেখে নিই →")}</button>
              </form>
            ) : (
              /* ── Step 2: Check & publish ── */
              <form className="workspace-card review-form-content" onSubmit={e => { e.preventDefault(); void submit(); }}>
                <dl className="case-review">
                  <dt>{t("Entity", "প্রতিষ্ঠান")}</dt>
                  <dd>{selected?.name}<small>{selected?.location}</small></dd>
                  <dt>{t("Alert title", "অ্যালার্টের শিরোনাম")}</dt>
                  <dd>{draft.title}</dd>
                  <dt>{t("Incident type", "ঘটনার ধরন")}</dt>
                  <dd>{translateStatus(draft.incident_type, lang)}</dd>
                  <dt>{t("Incident date", "ঘটনার তারিখ")}</dt>
                  <dd>{draft.incident_date ? formatDate(draft.incident_date, lang) : t("Not provided", "দেওয়া নেই")}</dd>
                  <dt>{t("What happened", "ঘটনার বিবরণ")}</dt>
                  <dd className="case-review-summary">{draft.summary}</dd>
                  <dt>{t("Amount (BDT)", "টাকার পরিমাণ")}</dt>
                  <dd>{draft.amount ? formatNumber(Number(draft.amount), lang) : t("Not provided", "দেওয়া নেই")}</dd>
                  <dt>{t("Alert Notice", "জরুরি অ্যালার্ট")}</dt>
                  <dd>{alertRequested ? (
                    <span style={{ color: '#b45309', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <AlertTriangle size={14} />
                      {t("Urgent public notice requested from Admin", "অ্যাডমিনের কাছে জরুরি অ্যালার্ট নোটিশের অনুরোধ করা হয়েছে")}
                    </span>
                  ) : t("Standard report", "সাধারণ রিপোর্ট")}</dd>
                </dl>

                {/* Evidence section */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 8px' }}>
                    {t("Evidence", "প্রমাণ")} {files.length > 0 && `(${files.length})`}
                  </p>
                  {files.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                      {t("No files attached. Supporting receipts or chats can be added later.", "কোনো ফাইল যোগ করা হয়নি। পরবর্তীতেও রশিদ বা চ্যাট যোগ করা যাবে।")}
                    </p>
                  ) : (
                    <>
                      {/* Image thumbnails */}
                      {previewUrls.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                          {previewUrls.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Evidence image ${i + 1}`}
                              style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 8, border: '1px solid #CBD5E1' }}
                            />
                          ))}
                        </div>
                      )}
                      {/* File list */}
                      <div style={{ fontSize: 13, color: '#475569', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {files.map((file, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                            <span>{file.name}</span>
                            <span style={{ color: '#94A3B8', fontSize: 12 }}>({(file.size / 1024).toFixed(0)} KB)</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <PublicVideoLinks urls={parsePublicVideoUrls(videoUrls).urls} lang={lang} />

                {/* Back button */}
                <button
                  type="button"
                  className="btn-pill-light"
                  disabled={busy}
                  onClick={goBack}
                  style={{ marginBottom: 12 }}
                >
                  ← {t("Back to Details & evidence", "বিবরণ ও প্রমাণ-এ ফিরুন")}
                </button>

                <label>
                  <input required type="checkbox" /> {t("This report is accurate to the best of my knowledge. I understand it will be listed on the public scam board to protect consumers.", "আমার জানা অনুযায়ী রিপোর্টটি সঠিক। ভোক্তাদের সচেতন করতে এটি অবিলম্বে পাবলিক স্ক্যাম বোর্ডে যুক্ত হবে।")}
                </label>
                <button disabled={busy || isOwnOrg} className="btn-teal-pill">
                  {busy ? t("Submitting alert…", "জমা দেওয়া হচ্ছে…") : t("Submit Scam Alert", "স্ক্যাম অ্যালার্ট জমা দিন")}
                </button>
              </form>
            )}
          </div>

          <aside className="alert-help">
            <section className="workspace-card">
              <ShieldCheck size={26} />
              <h2>{t("Automatic Publication & Community Trust", "স্বয়ংক্রিয় প্রকাশ ও ভোক্তা সুরক্ষা")}</h2>
              <p>{t("Your scam alert is published immediately to ensure no other citizen falls victim. The merchant is notified and can post an official solution, delivery proof, or refund. Platform admins verify reports and ensure factual integrity.", "অন্য কোনো নাগরিক যাতে প্রতারিত না হন, সেজন্য আপনার রিপোর্ট সঙ্গে সঙ্গে প্রকাশিত হয়। প্রতিষ্ঠানকে জানানো হয় যাতে তারা সমাধান বা টাকা ফেরত দিতে পারে। অ্যাডমিনরা তথ্য ভেরিফাই করেন।")}</p>
              <p>{t("Both you as the reporter and platform administrators can mark the case as Solved once an outcome is reached.", "সমস্যা সমাধান বা টাকা ফেরত পেলে আপনি নিজে এবং অ্যাডমিন যেকোনো সময় কেসটি Solved চিহ্নিত করতে পারবেন।")}</p>
            </section>
            <section className="workspace-card">
              <h2>{t("Make your report useful", "রিপোর্টে প্রয়োজনীয় তথ্য দিন")}</h2>
              <p>{t("Be specific about dates and the business involved. Separate what you observed from what you suspect.", "তারিখ ও সংশ্লিষ্ট প্রতিষ্ঠান স্পষ্টভাবে লিখুন। যা নিজে দেখেছেন ও যা সন্দেহ করছেন তা আলাদা করুন।")}</p>
              <p>{t("For a routine customer experience,", "সাধারণ গ্রাহক অভিজ্ঞতার জন্য")} <Link to="/search">{t("write a review on the business profile", "প্রতিষ্ঠানের প্রোফাইলে রিভিউ লিখুন")}</Link>.</p>
            </section>
          </aside>
        </div>
      )}

      <AddBusinessModal
        open={addOrgOpen}
        onClose={() => setAddOrgOpen(false)}
        onBusinessAdded={(newBiz) => {
          setEntities(prev => prev.some(b => b.id === newBiz.id) ? prev : [newBiz, ...prev]);
          setEntityQuery(newBiz.name);
          update('business_id', String(newBiz.id));
          setAddOrgOpen(false);
        }}
      />
    </div>
  );
}
