"use client";
import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Building2, CheckCircle2, MessageSquare, Share2, ShieldCheck, Search, Filter, RefreshCw } from 'lucide-react';
import { api, apiFileUrl, resolveMediaUrl } from '../services/api';
import { bookmarkService } from '../services/bookmarkService';
import { useAuth } from '../features/auth/AuthContext';
import { businessService } from '../services/businessService';
import type { Business } from '../types';
import { GoogleMap } from './GoogleMap';
import { ReviewEditor } from './ReviewEditor';
import { ThreadedComments } from './ui/ThreadedComments';
import { PublicMediaGallery } from './ui/PublicMediaGallery';
import { ReportContentLink } from './ui/ReportContentLink';
import './content-report.css';
import {useI18n} from '../i18n/LanguageContext';
import {formatNumber,formatDate,localizedError} from '../i18n/dictionary';
import {publicText,originalTextLabel,type PublicTranslations} from '../i18n/content';
import {PublicVideoLinks} from './PublicVideoLinks';
import type {LinkedCase} from '../types';
import {CaseDecisionControls,type CaseDecisionItem} from './CaseDecisionControls';
import {ReviewReactions} from './ui/ReviewReactions';
import type {ReviewReaction} from '../types';
import {OrganizationImageDesk} from './OrganizationImageDesk';
import {ShareCard} from './ShareCard';

function Notice({ text }: { text: string }) { return text ? <p className="workspace-notice" role="status">{text}</p> : null; }
function Page({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <div className="workspace-page"><div className="workspace-heading"><span className="workspace-eyebrow">TRUTHHUBBD / YOUR TRUST WORKSPACE</span><h1>{title}</h1><p>{intro}</p></div>{children}</div>;
}

export {NotificationsPage} from './NotificationsPage';

type ReviewDetail = {
  public_video_urls?:string[];
  linked_case?:LinkedCase|null;
  can_edit?: boolean;
  edited_at?: string;
  official_response?: { body: string; updated_at: string };
  id: number;
  title: string;
  body: string;
  author: string;
  authorAvatar?: string | null;
  rating: number;
  helpful_count: number;
  not_helpful_count?: number;
  viewer_reaction?: ReviewReaction | null;
  canReact?: boolean;
  translations?: PublicTranslations;
  public_media?: { url: string; alt: string; kind?: string }[];
  is_demo?: boolean;
  imagePath?: string;
  images?: string[];
  business: { name: string; slug: string; image?: string; category?: string };
  comments: { id: number; author: string; body: string }[];
};

export function ReviewDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const {lang,t}=useI18n();
  const { user } = useAuth();
  const [review, setReview] = useState<ReviewDetail>();
  const [message, setMessage] = useState(t("Loading review…","রিভিউ লোড হচ্ছে…"));
  const [isSaved, setIsSaved] = useState(() => bookmarkService.isReviewSaved(Number(id)));
  const [copied, setCopied] = useState(false);
  const requestVersion = useRef(0);
  const discussion = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const request = ++requestVersion.current;
    try {
      const result = await api<{ data: ReviewDetail }>(`/reviews/${id}`);
      if (request !== requestVersion.current) return;
      setReview(result.data);
      setMessage("");
    } catch (error) { if (request === requestVersion.current) setMessage(localizedError((error as Error).message,lang)); }
  }, [id,lang,user?.id]);

  useEffect(() => {
    setReview(undefined);
    setMessage(t("Loading review…","রিভিউ লোড হচ্ছে…"));
    setIsSaved(bookmarkService.isReviewSaved(Number(id)));
    setCopied(false);
    void refresh();
    return () => { requestVersion.current += 1; };
  }, [id, refresh]);

  useEffect(() => {
    if (!review || String(review.id) !== id || location.hash !== '#discussion') return;
    // The hash target appears only after the asynchronous review request completes.
    const frame = window.requestAnimationFrame(() => {
      discussion.current?.scrollIntoView({block: 'start', behavior: 'auto'});
    });
    return () => window.cancelAnimationFrame(frame);
  }, [id, review?.id, location.hash, location.key]);

  const toggleSave = () => {
    if (!review || !user) return;
    const next = bookmarkService.toggleReview({
      id: review.id, title: review.title, rating: review.rating, body: review.body,
      author: review.author, businessName: review.business.name,
      businessSlug: review.business.slug, image: review.public_media?.[0]?.url,
    });
    setIsSaved(next);
    setMessage(next ? t("Review saved to your Profile bookmarks.","রিভিউটি আপনার প্রোফাইলে সংরক্ষিত হয়েছে।") : t("Review removed from your saved items.","রিভিউটি সংরক্ষিত তালিকা থেকে সরানো হয়েছে।"));
  };

  const share = async () => {
    try {
      if (!navigator.clipboard) throw new Error(t("Copy the page address from your browser to share this review.","রিভিউটি শেয়ার করতে ব্রাউজার থেকে পেজের ঠিকানা কপি করুন।"));
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setMessage(t("Could not copy the link. Copy the page address to share it.","লিংক কপি করা যায়নি। শেয়ার করতে পেজের ঠিকানা কপি করুন।")); }
  };

  return (
    <div className="content-review-detail">
      <Link className="content-review-back" to="/search?view=reviews">{t("← Back to community reviews","← মানুষের রিভিউতে ফিরে যান")}</Link>
      <Notice text={message} />
      {review && <div className="content-review-detail-stack">
        <article className="editorial-dossier-card content-review-dossier">
          <header className="content-review-detail-header">
            <div className="content-review-heading-copy">
              <div className="content-review-records"><span>{t("Review","রিভিউ")} #{formatNumber(review.id,lang,{useGrouping:false})}</span><span>{t("Rating:","রেটিং:")} {formatNumber(Number(review.rating),lang,{minimumFractionDigits:1,maximumFractionDigits:1})} / {formatNumber(5,lang)}</span>{review.is_demo && <span>{t("Demo review","ডেমো রিভিউ")}</span>}</div>
              {originalTextLabel(review,lang,['title','body'])&&<small className="content-review-date">{originalTextLabel(review,lang,['title','body'])}</small>}
              <h1>{publicText(review,'title',lang)}</h1>
              <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '4px 0 0' }}>
                <span>{t("Reviewed organization:","রিভিউ দেওয়া প্রতিষ্ঠান:")}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {(() => {
                    const rawImg = review.business?.image || (review as any).businessImage;
                    const orgImgUrl = rawImg ? resolveMediaUrl(rawImg) : null;
                    return (
                      <span className="scam-detail-thumb-wrap" aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, minWidth: 20, borderRadius: 4, overflow: 'hidden', verticalAlign: 'middle', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                        {orgImgUrl ? (
                          <img
                            src={orgImgUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={e => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              const fb = e.currentTarget.parentElement?.querySelector('.review-org-thumb-fallback') as HTMLElement;
                              if (fb) fb.style.display = 'inline-flex';
                            }}
                          />
                        ) : null}
                        <span className="review-org-thumb-fallback" style={{ display: orgImgUrl ? 'none' : 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#0f766e' }}>
                          <Building2 size={12} />
                        </span>
                      </span>
                    );
                  })()}
                  <Link to={`/business/${review.business.slug}`} style={{ fontWeight: 700 }}>{review.business.name}</Link>
                </span>
              </p>
            </div>
            <div className="content-review-actions">
              {user ? <button className="content-action" type="button" onClick={toggleSave} aria-pressed={isSaved}>
                <Bookmark size={17} aria-hidden="true" fill={isSaved ? "currentColor" : "none"} />{isSaved ? t("Saved","সংরক্ষিত") : t("Save review","রিভিউ সংরক্ষণ")}
              </button> : <Link className="content-action" to={'/login?next=' + encodeURIComponent(`/reviews/${review.id}`)}><Bookmark size={17} aria-hidden="true"/>{t('Sign in to save','সংরক্ষণ করতে সাইন ইন')}</Link>}
              <ShareCard
                url={`/reviews/${review.id}`}
                title={review.title}
                description={review.body}
                rating={review.rating}
                author={review.author}
                businessName={review.business.name}
                organizationImage={review.business.image}
                mediaImage={review.imagePath}
                amount={review.linked_case?.amount}
                status={review.linked_case?.status}
                category={review.business.category}
                isAlert={Boolean(review.linked_case)}
                caseCode={review.linked_case?.case_code}
                compact
              />
              <ReportContentLink type="review" id={review.id} lang={lang} />
            </div>
          </header>
          <div className="content-review-author">
            <span className="content-review-avatar" aria-hidden="true" style={{ overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {review.authorAvatar ? (
                <img
                  src={review.authorAvatar.startsWith('http') ? review.authorAvatar : (review.authorAvatar.startsWith('/') ? review.authorAvatar : '/' + review.authorAvatar)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                review.author.slice(0, 2).toUpperCase()
              )}
            </span>
            <div className="content-review-author-text"><strong>{review.author}</strong><span className="content-review-date">{review.is_demo ? t("Sample content for demonstration","প্রদর্শনের জন্য নমুনা লেখা") : t("Community reviewer","কমিউনিটির রিভিউদাতা")}</span></div>
          </div>
          {(review.public_media?.length ?? 0) > 0 && <PublicMediaGallery media={review.public_media!} lang={lang} label={t("Public review photos","রিভিউয়ের প্রকাশ্য ছবি")} />}
          {review.images && review.images.length > 0 ? (
            <div className="review-attached-images" style={{ display: "flex", gap: "12px", margin: "16px 0", flexWrap: "wrap" }}>
              {review.images.map((imgUrl, idx) => {
                const resolved = resolveMediaUrl(imgUrl);
                return (
                  <a key={idx} href={resolved} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: "10px", overflow: "hidden", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                    <img src={resolved} alt={t("Review attachment", "রিভিউয়ের সংযুক্ত ছবি")} style={{ width: "120px", height: "120px", objectFit: "cover", display: "block" }} />
                  </a>
                );
              })}
            </div>
          ) : review.imagePath ? (
            <div className="review-attached-images" style={{ display: "flex", gap: "12px", margin: "16px 0", flexWrap: "wrap" }}>
              {(() => {
                const resolved = resolveMediaUrl(review.imagePath!);
                return (
                  <a href={resolved} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: "10px", overflow: "hidden", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                    <img src={resolved} alt={t("Review attachment", "রিভিউয়ের সংযুক্ত ছবি")} style={{ width: "120px", height: "120px", objectFit: "cover", display: "block" }} />
                  </a>
                );
              })()}
            </div>
          ) : null}
          <PublicVideoLinks urls={review.public_video_urls} lang={lang}/>
          {review.linked_case&&<Link className="content-action" to={review.linked_case.url}>{t('Linked public report','সংশ্লিষ্ট প্রকাশ্য রিপোর্ট')} · {review.linked_case.case_code}</Link>}
          <div className="content-review-detail-body">{publicText(review,'body',lang)}</div>
          {review.edited_at && <p className="content-review-date">{t("Last edited:","সর্বশেষ সম্পাদনা:")} {formatDate(review.edited_at,lang)}</p>}
          <footer className="content-review-detail-footer">
            <ReviewReactions id={review.id} helpfulCount={review.helpful_count} notHelpfulCount={review.not_helpful_count} viewerReaction={review.viewer_reaction} canReact={review.canReact} lang={lang} onChange={result => setReview(current => current?.id === review.id ? {...current, ...result} : current)}/>
            <Link className="content-action" to={`/business/${review.business.slug}`}>{t("View organization profile →","প্রতিষ্ঠানের প্রোফাইল দেখুন →")}</Link>
          </footer>
        </article>
        {review.official_response && <article className="content-official-response">
          <h2><ShieldCheck size={20} aria-hidden="true" />{t("Official response from","প্রতিষ্ঠানের আনুষ্ঠানিক উত্তর:")} {review.business.name}</h2>
          <p>{review.official_response.body}</p>{lang==='bn'&&<small className="content-review-date">{t("Original response","মূল উত্তর · অনুমোদিত বাংলা অনুবাদ নেই")}</small>}
          <span className="content-review-date">{t("Responded:","উত্তরের তারিখ:")} {formatDate(review.official_response.updated_at,lang)}</span>
        </article>}
        {review.can_edit && <ReviewEditor review={review} onSaved={refresh} />}
        <div ref={discussion} id="discussion" className="entity-card content-review-discussion"><ThreadedComments reviewId={review.id} title={t(`Discussion on ${review.author}’s review`,`${review.author}-এর রিভিউ নিয়ে আলোচনা`)} /></div>
      </div>}
    </div>
  );
}
export { BusinessClaimForm as ClaimPage } from './BusinessClaimForm';

type QueueItem = CaseDecisionItem & { has_photo?: boolean; contact_email?: string; contact_phone?: string; business_address?: string; document_type?: string; has_evidence?: boolean; representative_name?: string; role_title?: string };

export function ModerationPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const bn = lang === 'bn';
  const location = useLocation();

  const [tab, setTab] = useState('scam-cases');
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(location.search).get('q') || '');
  const [statusFilter, setStatusFilter] = useState('actionable');
  const [alertFilter, setAlertFilter] = useState('all');
  const [togglingAlert, setTogglingAlert] = useState<number | null>(null);
  const [queue, setQueue] = useState<{ endpoint: string; items: QueueItem[] }>();
  const [message, setMessage] = useState('');
  const [claimNote, setClaimNote] = useState('');
  const [claimBusy, setClaimBusy] = useState(false);
  const queueRequest = useRef(0);

  const isStaff = user && ['admin', 'moderator'].includes(user.role);
  const claimsTab = tab === 'claims';
  const endpoint = claimsTab ? '/admin/business-claims' : '/moderation/scam-cases';
  const items = queue?.endpoint === endpoint ? queue.items : [];

  // Sync search term if location.search changes
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q');
    if (q !== null && q !== searchTerm) {
      setSearchTerm(q);
    }
  }, [location.search]);

  const refresh = useCallback(() => {
    const requestId = ++queueRequest.current;
    setMessage(t('Loading queue…', 'সারি লোড হচ্ছে…'));

    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (!claimsTab && statusFilter) params.set('status', statusFilter);
    if (!claimsTab && alertFilter !== 'all') params.set('alert', alertFilter);

    const url = `${endpoint}${params.toString() ? '?' + params.toString() : ''}`;

    return api<{ data: QueueItem[] }>(url)
      .then((r) => {
        if (requestId !== queueRequest.current) return;
        setQueue({ endpoint, items: r.data });
        setMessage(r.data.length ? '' : t('No cases or claims found matching this criteria.', 'এই শর্তের কোনো কেস পাওয়া যায়নি।'));
      })
      .catch((e) => {
        if (requestId === queueRequest.current) setMessage(e.message);
      });
  }, [endpoint, searchTerm, statusFilter, alertFilter, claimsTab, t]);

  useEffect(() => {
    if (isStaff) void refresh();
  }, [refresh, isStaff]);

  async function toggleAlertStatus(caseId: number, nextAlert: boolean) {
    if (togglingAlert === caseId) return;
    setTogglingAlert(caseId);
    try {
      await api(`/admin/scam-cases/${caseId}/alert`, 'PATCH', { alert_enabled: nextAlert });
      await refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setTogglingAlert(null);
    }
  }

  async function decideClaim(id: number, status: string) {
    if (claimBusy || !claimNote.trim() || !claimsTab) return;
    setClaimBusy(true);
    try {
      await api(`/admin/business-claims/${id}`, 'PATCH', { status, decision_note: claimNote.trim() });
      setClaimNote('');
      await refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setClaimBusy(false);
    }
  }

  return (
    <Page
      title={t('Moderation workspace', 'পর্যালোচনার কর্মক্ষেত্র')}
      intro={t(
        'Review evidence, search cases by ID, record accountability reasons, and make decisions.',
        'প্রমাণ পর্যালোচনা করুন, আইডি দিয়ে কেস অনুসন্ধান করুন এবং কারণসহ সিদ্ধান্ত নিন।'
      )}
    >
      {!isStaff ? (
        <p>{t('Sign in with a moderator or admin account to access casework.', 'কেস পর্যালোচনা করতে মডারেটর বা প্রশাসকের অ্যাকাউন্টে সাইন ইন করুন।')}</p>
      ) : (
        <>
          <nav className="workspace-tabs" style={{ marginBottom: '16px' }}>
            <button
              type="button"
              aria-pressed={!claimsTab}
              onClick={() => {
                setTab('scam-cases');
                setSearchTerm('');
              }}
            >
              {t('Scam Alert queue', 'প্রতারণা সতর্কতার সারি')}
            </button>
            <button
              type="button"
              aria-pressed={claimsTab}
              onClick={() => {
                setTab('claims');
                setSearchTerm('');
              }}
            >
              {t('Organization claims', 'প্রতিষ্ঠানের প্রতিনিধিত্বের আবেদন')}
            </button>
          </nav>

          {/* Search & Filter Toolbar */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '20px',
              background: '#ffffff',
              padding: '14px 18px',
              borderRadius: '10px',
              border: '1px solid #d8cdb7'
            }}
          >
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--slate-400)' }} />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  claimsTab
                    ? t('Search claims by organization name…', 'প্রতিষ্ঠান দিয়ে আবেদন খুঁজুন…')
                    : t('Search by Case ID (#5), Code (THB-...), or Business name…', 'কেস আইডি (#5), কোড বা প্রতিষ্ঠান দিয়ে খুঁজুন…')
                }
                className="review-input"
                style={{ width: '100%', margin: 0, paddingLeft: '34px' }}
              />
            </div>

            {!claimsTab && (
              <div style={{ minWidth: '180px' }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="review-input"
                  style={{ width: '100%', margin: 0 }}
                >
                  <option value="actionable">{t('Actionable (Needs Review)', 'পর্যালোচনাযোগ্য কেস')}</option>
                  <option value="all">{t('All Statuses (সব কেস)', 'সব কেস')}</option>
                  <option value="submitted">{t('Submitted (নতুন জমা)', 'নতুন জমা')}</option>
                  <option value="under_review">{t('Under Review (পর্যালোচনাধীন)', 'পর্যালোচনাধীন')}</option>
                  <option value="needs_evidence">{t('Needs Evidence (প্রমাণ প্রয়োজন)', 'প্রমাণ প্রয়োজন')}</option>
                  <option value="disputed">{t('Disputed (আপত্তি এসেছে)', 'আপত্তি এসেছে')}</option>
                  <option value="resolved">{t('Resolved (নিষ্পত্তিকৃত)', 'নিষ্পত্তিকৃত')}</option>
                </select>
              </div>
            )}

            {!claimsTab && (
              <div style={{ minWidth: '180px' }}>
                <select
                  value={alertFilter}
                  onChange={(e) => setAlertFilter(e.target.value)}
                  className="review-input"
                  style={{ width: '100%', margin: 0 }}
                >
                  <option value="all">{t('All Alert States (সকল সতর্কতা)', 'সকল সতর্কতা অবস্থা')}</option>
                  <option value="on">{t('🔥 Trending Alert ON (সতর্কতা চালু)', '🔥 সতর্কতা চালু (ট্রেন্ডিং)')}</option>
                  <option value="off">{t('⚪ Alert OFF (সতর্কতা বন্ধ)', '⚪ সতর্কতা বন্ধ')}</option>
                </select>
              </div>
            )}

            <button
              type="button"
              className="btn-pill-light"
              onClick={() => void refresh()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', height: '38px', padding: '0 16px', fontWeight: 700 }}
            >
              <RefreshCw size={14} />
              {t('Refresh', 'রিফ্রেশ')}
            </button>
          </div>

          <Notice text={message} />

          {claimsTab && (
            <label className="workspace-card">
              {t('Private claim decision reason', 'প্রতিনিধিত্বের সিদ্ধান্তের ব্যক্তিগত কারণ')}
              <textarea
                className="review-textarea"
                maxLength={5000}
                value={claimNote}
                onChange={(event) => setClaimNote(event.target.value)}
                placeholder={t('Record the basis for this representation decision.', 'প্রতিনিধিত্বের এই সিদ্ধান্তের ভিত্তি লিখুন।')}
              />
            </label>
          )}

          {items.map((item) => (
            <article className="workspace-card" key={(claimsTab ? 'claim-' : 'case-') + item.id} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ background: '#f5eedb', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', color: 'var(--ink)' }}>
                    {claimsTab ? `CLAIM #${item.id}` : `CASE #${item.id}`}
                  </strong>
                  {item.case_code && (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-500)' }}>
                      ({item.case_code})
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {!claimsTab && (
                    <button
                      type="button"
                      disabled={togglingAlert === item.id}
                      onClick={() => void toggleAlertStatus(item.id, !item.alert_enabled)}
                      title={item.alert_enabled ? t('Click to turn alert OFF', 'সতর্কতা বন্ধ করতে ক্লিক করুন') : t('Click to turn alert ON (Trending)', 'সতর্কতা চালু (ট্রেন্ডিং) করতে ক্লিক করুন')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        border: item.alert_enabled ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        background: item.alert_enabled ? '#fef2f2' : '#f8fafc',
                        color: item.alert_enabled ? '#b91c1c' : '#475569',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {togglingAlert === item.id ? (
                        t('Updating…', 'আপডেট হচ্ছে…')
                      ) : item.alert_enabled ? (
                        <>🔥 {t('Trending Alert: ON', 'সতর্কতা চালু (ট্রেন্ডিং)')}</>
                      ) : (
                        <>⚪ {t('Alert: OFF (Turn ON)', 'সতর্কতা বন্ধ (চালু করুন)')}</>
                      )}
                    </button>
                  )}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      background:
                        item.status === 'published'
                          ? '#ecfdf5'
                          : item.status === 'resolved'
                          ? '#f0fdf4'
                          : item.status === 'under_review'
                          ? '#fef3c7'
                          : '#f1f5f9',
                      color:
                        item.status === 'published'
                          ? '#065f46'
                          : item.status === 'resolved'
                          ? '#14532d'
                          : item.status === 'under_review'
                          ? '#92400e'
                          : 'var(--ink)'
                    }}
                  >
                    {item.status === 'published' ? '✓ LIVE' : item.status.replaceAll('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 10px', color: 'var(--ink)' }}>
                {item.title ?? item.business?.name}
              </h2>

              {item.business?.name && (
                <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--slate-600)' }}>
                  <strong>{t('Organization', 'প্রতিষ্ঠান')}:</strong> {item.business.name}
                </p>
              )}

              <div style={{ background: '#faf7f2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eae0ce', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--slate-700)', margin: '0 0 4px', textTransform: 'uppercase' }}>
                  {claimsTab ? t('Private representative details', 'প্রতিনিধির ব্যক্তিগত তথ্য') : t('Private submitted report', 'ব্যক্তিগত জমা দেওয়া রিপোর্ট')}
                </h3>
                <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.5, color: 'var(--slate-800)' }}>
                  {item.summary ?? `${item.representative_name} · ${item.role_title}`}
                </p>
              </div>

              {item.subject_response && (
                <section style={{ background: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#065f46', margin: '0 0 4px' }}>
                    {t('Private subject response', 'সংশ্লিষ্ট ব্যক্তির ব্যক্তিগত উত্তর')}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#065f46' }}>{item.subject_response}</p>
                </section>
              )}

              {!claimsTab && (item.evidence?.length ?? 0) > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '12.5px', color: 'var(--slate-700)', display: 'block', marginBottom: '6px' }}>
                    {t('Attached Private Evidence Files:', 'সংযুক্ত প্রমাণাদি:')}
                  </strong>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {item.evidence?.map((evidence) => (
                      <a
                        key={evidence.id}
                        href={apiFileUrl(`/moderation/evidence/${evidence.id}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-pill-light"
                        style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                      >
                        📄 {t('Open Evidence', 'প্রমাণ খুলুন')} #{evidence.id}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {claimsTab ? (
                <>
                  <p style={{ fontSize: '13px', color: 'var(--slate-600)' }}>
                    {item.contact_email} · {item.contact_phone}
                    <br />
                    {item.business_address}
                    <br />
                    {t('Document:', 'নথি:')} {item.document_type || t('Legacy application', 'আগের আবেদন')}
                  </p>
                  {item.has_photo && (
                    <p>
                      <a href={apiFileUrl(`/admin/claim-evidence/${item.id}?kind=photo`)} target="_blank" rel="noopener noreferrer">
                        {t('Open private organization photo', 'প্রতিষ্ঠানের ব্যক্তিগত ছবি খুলুন')}
                      </a>
                    </p>
                  )}
                  {item.has_evidence && (
                    <p>
                      <a href={apiFileUrl(`/admin/claim-evidence/${item.id}?kind=proof`)} target="_blank" rel="noopener noreferrer">
                        {t('Open private proof of authority', 'প্রতিনিধিত্বের ব্যক্তিগত প্রমাণ খুলুন')}
                      </a>
                    </p>
                  )}
                  <div className="workspace-tabs">
                    {(item.status === 'submitted'
                      ? ['approved', 'rejected']
                      : item.status === 'approved'
                      ? ['restricted']
                      : item.status === 'restricted'
                      ? ['approved']
                      : []
                    ).map((status) => (
                      <button disabled={claimBusy || !claimNote.trim()} key={status} onClick={() => void decideClaim(item.id, status)}>
                        {status.replaceAll('_', ' ')}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <CaseDecisionControls item={item} isAdmin={user.role === 'admin'} onSaved={refresh} />
              )}
            </article>
          ))}
        </>
      )}
    </Page>
  );
}

export function PoliciesPage() {
  return <Page title="Trust is built in the details." intro="Our product standards for reviews, representation, evidence, and paid visibility."><div className="workspace-columns">{[
    ['Review guidelines', 'Write about your own experience. Use a 1–5 rating, a factual description, and an experience date. Disclose employment, family relationships, competing interests, or incentives. Do not post threats, private identifiers, or coordinated reviews.'],
    ['Scam Alert standard', 'Scam alerts are published publicly to warn the community and hold entities accountable. Reports are verified by moderators before publishing to protect privacy and prevent false claims.'],
    ['Business representation', 'An approved representative can maintain profile facts and respond to experiences. Verification proves authorization, not quality. Representatives cannot remove criticism or change ratings.'],
    ['Privacy and evidence', 'Keep receipts, IDs, payment references, and private messages out of public review text. Sensitive documents are reviewed securely by staff so private information is not leaked into public case summaries.'],
    ['Reports and disputes', 'Use the report action on a review to explain a policy issue. Moderation assesses the context and evidence. High-impact decisions and appeals require admin review.'],
    ['Advertisements', 'Advertisements are clearly labelled and kept separate from community discovery. Advertising never changes ratings, ownership, criticism or moderation decisions.']
  ].map(([title, text]) => <article className="workspace-card" key={title}><CheckCircle2 color="#0f766e" /><h2>{title}</h2><p>{text}</p></article>)}</div></Page>;
}
