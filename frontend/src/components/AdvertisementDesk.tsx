"use client";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, RefreshCw, Upload, Image as ImageIcon, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import {
  AdvertisementApiError,
  adSectorLabel,
  adText,
  adImageUrl,
  adWritePayload,
  blankAdDraft,
  draftFromAdvertisement,
  getManagedAdvertisements,
  saveAdvertisement,
  scheduleText,
  uploadAdvertisementImage,
  validateAdDraft,
  type AdStatus,
  type AdvertisementDraft,
  type ManagedAdvertisement
} from '../services/advertisements';
import './advertisement-desk.css';
import { AdvertisementTickerControls} from './AdvertisementTickerControls';

const statuses: AdStatus[] = ['draft', 'published', 'paused', 'archived'];
const commonCategories = [
  { id: 'healthcare', labelEn: 'Healthcare', labelBn: 'স্বাস্থ্যসেবা' },
  { id: 'education', labelEn: 'Education', labelBn: 'শিক্ষা ও দক্ষতা' },
  { id: 'recruitment', labelEn: 'Recruitment', labelBn: 'নিয়োগ বিজ্ঞপ্তি' },
  { id: 'general', labelEn: 'General / Services', labelBn: 'সাধারণ / প্রতিষ্ঠান' },
];

function statusText(status: AdStatus, bn: boolean) {
  return bn
    ? ({ draft: 'খসড়া', published: 'প্রকাশিত', paused: 'বিরত', archived: 'আর্কাইভ' }[status])
    : status.charAt(0).toUpperCase() + status.slice(1);
}

export function AdvertisementDesk() {
  const { user, checking } = useAuth();
  const { t } = useI18n();

  return (
    <section className="workspace-page advertisement-desk">
      <header className="workspace-heading">
        <span className="workspace-eyebrow">{t('ADMIN / ADVERTISEMENTS', 'অ্যাডমিন / বিজ্ঞাপন')}</span>
        <h1>{t('Advertisement desk', 'বিজ্ঞাপন নিয়ন্ত্রণ')}</h1>
        <p>
          {t(
            'Create simple, effective advertisements with image uploads, homepage ticker text, and serial ordering.',
            'সহজে ছবি আপলোড, মূল পাতার টিকার বার্তা ও সিরিয়াল ক্রম দিয়ে বিজ্ঞাপন তৈরি ও নিয়ন্ত্রণ করুন।'
          )}
        </p>
      </header>

      <nav className="ad-desk-nav">
        <Link to="/admin">{t('Admin dashboard', 'অ্যাডমিন ড্যাশবোর্ড')}</Link>
        <Link to="/moderation">{t('Casework', 'কেস পর্যালোচনা')}</Link>
        <Link to="/ads">
          {t('Public ads page', 'প্রকাশ্য বিজ্ঞাপন পাতা')}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </nav>

      {checking ? (
        <p role="status">{t('Checking account…', 'অ্যাকাউন্ট দেখা হচ্ছে…')}</p>
      ) : !user ? (
        <div className="ad-desk-card">
          <h2>{t('Admin sign-in required', 'অ্যাডমিন হিসেবে সাইন ইন প্রয়োজন')}</h2>
          <p>
            {t(
              'Public advertisements are readable without signing in. Management needs an admin account, confirmed email and staff MFA.',
              'লগ ইন ছাড়াই প্রকাশ্য বিজ্ঞাপন পড়তে পারবেন। নিয়ন্ত্রণের জন্য অ্যাডমিন অ্যাকাউন্ট, নিশ্চিত ইমেইল ও কর্মীদের MFA প্রয়োজন।'
            )}
          </p>
          <Link className="ad-desk-primary" to="/login?next=%2Fadmin%2Fads">
            {t('Sign in', 'সাইন ইন')}
          </Link>
        </div>
      ) : user.role !== 'admin' ? (
        <div className="ad-desk-card">
          <h2>{t('Admin access only', 'শুধু অ্যাডমিনের জন্য')}</h2>
          <Link to="/ads">{t('Browse advertisements', 'বিজ্ঞাপন দেখুন')}</Link>
        </div>
      ) : (
        <AdManager key={user.id} />
      )}
    </section>
  );
}

function AdManager() {
  const { lang, t } = useI18n();
  const bn = lang === 'bn';
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<{ revision: number; items: ManagedAdvertisement[]; error?: string }>();
  const [editor, setEditor] = useState<ManagedAdvertisement | null | undefined>();
  const [filter, setFilter] = useState<AdStatus | ''>('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getManagedAdvertisements(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setSnapshot({ revision, items });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setSnapshot({ revision, items: [], error: (error as Error).message });
      });
    return () => controller.abort();
  }, [revision]);

  const current = snapshot?.revision === revision ? snapshot : undefined;
  const loading = !current;
  const items = current?.items ?? [];

  return (
    <>
      <AdvertisementTickerControls />

      <div className="ad-desk-toolbar">
        <label>
          {t('Show', 'দেখুন')}
          <select value={filter} onChange={(e) => setFilter(e.target.value as AdStatus | '')}>
            <option value="">{t('All advertisements', 'সব বিজ্ঞাপন')}</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusText(status, bn)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" disabled={loading} onClick={() => setRevision((value) => value + 1)}>
          <RefreshCw size={15} aria-hidden="true" />
          {t('Refresh', 'আবার দেখুন')}
        </button>
        <button
          type="button"
          className="ad-desk-primary"
          disabled={editor !== undefined}
          onClick={() => setEditor(null)}
        >
          <Plus size={15} aria-hidden="true" />
          {t('Create advertisement', 'বিজ্ঞাপন তৈরি')}
        </button>
      </div>

      {message && <p className="ad-desk-message" role="status">{message}</p>}

      {editor !== undefined && (
        <AdEditor
          key={editor?.id ?? 'new'}
          item={editor}
          onCancel={() => setEditor(undefined)}
          onSaved={() => {
            setEditor(undefined);
            setMessage(
              t(
                'Saved on the server. The public page shows published advertisements in their serial order.',
                'সার্ভারে সংরক্ষিত হয়েছে। সিরিয়াল ক্রম অনুযায়ী বিজ্ঞাপন প্রকাশ্য পাতায় দেখানো হবে।'
              )
            );
            setRevision((value) => value + 1);
          }}
        />
      )}

      {loading ? (
        <p role="status">{t('Loading advertisements…', 'বিজ্ঞাপন লোড হচ্ছে…')}</p>
      ) : current?.error ? (
        <div className="ad-desk-card" role="alert">
          <p>{current.error}</p>
          <Link to="/security">{t('Check staff MFA', 'কর্মীদের MFA পরীক্ষা করুন')}</Link>
          <button type="button" onClick={() => setRevision((value) => value + 1)}>
            {t('Retry', 'আবার চেষ্টা করুন')}
          </button>
        </div>
      ) : (
        <div className="ad-desk-list">
          {items
            .filter((item) => !filter || item.status === filter)
            .map((item) => {
              const img = adImageUrl(item);
              return (
                <article className="ad-desk-card" key={item.id}>
                  <header>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ background: '#f5eedb', padding: '2px 8px', borderRadius: '4px', color: 'var(--ink)' }}>
                        #{bn ? 'সিরিয়াল' : 'Serial'}: {item.display_order}
                      </strong>
                      <span>AD-{item.id} · {statusText(item.status, bn)}</span>
                    </span>
                    {item.show_in_ticker ? (
                      <span className="ad-ticker-pill ad-ticker-on">{bn ? '✓ টপ-বারে সক্রিয়' : '✓ In Top Bar'}</span>
                    ) : (
                      <span className="ad-ticker-pill ad-ticker-off">{bn ? 'টপ-বারে বন্ধ' : 'Top Bar Off'}</span>
                    )}
                  </header>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', margin: '10px 0' }}>
                    {img.url && (
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '8px',
                          border: '1px solid #d8cdb7',
                          overflow: 'hidden',
                          background: '#faf7f2',
                          flexShrink: 0,
                          display: 'grid',
                          placeItems: 'center'
                        }}
                      >
                        <img
                          src={img.url}
                          alt={item.title_en}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <h2 style={{ margin: '0 0 6px', fontSize: '1.25rem' }}>{adText(item, 'title', lang)}</h2>
                      <p className="ad-desk-meta" style={{ margin: 0 }}>
                        <span style={{ fontWeight: 700, color: 'var(--slate-700)' }}>
                          {t('Category', 'ক্যাটাগরি')}: {adSectorLabel(item.sector, lang)}
                        </span>
                        {' · '}
                        {scheduleText(item, lang)}
                        {item.destination_url ? ` · 🔗 ${item.destination_url}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="ad-desk-card-snippets">
                    <div className="ad-desk-snippet">
                      <span className="ad-field-badge ad-field-badge-ticker">
                        {bn ? '📢 টপ-বার বার্তা (সংক্ষিপ্ত)' : '📢 Top-Bar Message (Short)'}
                      </span>
                      <p>
                        {((bn ? item.ticker_text_bn : item.ticker_text_en) || '').trim() || (
                          <em>{bn ? '(খালি — পেজের বিবরণ প্রদর্শিত হবে)' : '(Empty — falling back to ad page description)'}</em>
                        )}
                      </p>
                    </div>
                    <div className="ad-desk-snippet">
                      <span className="ad-field-badge ad-field-badge-page">
                        {bn ? '📄 পেজের পূর্ণ বিবরণ (বিস্তারিত)' : '📄 Ad Page Description (Full)'}
                      </span>
                      <p>{adText(item, 'body', lang)}</p>
                    </div>
                  </div>

                  <button type="button" disabled={editor !== undefined} onClick={() => setEditor(item)}>
                    {t('Edit / change / order', 'সম্পাদনা / পরিবর্তন / ক্রম')}
                  </button>
                </article>
              );
            })}
          {!items.some((item) => !filter || item.status === filter) && (
            <p>{t('No advertisements match this view.', 'এই তালিকায় কোনো বিজ্ঞাপন নেই।')}</p>
          )}
        </div>
      )}
    </>
  );
}

function AdEditor({
  item,
  onCancel,
  onSaved
}: {
  item: ManagedAdvertisement | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { lang, t } = useI18n();
  const bn = lang === 'bn';
  const [draft, setDraft] = useState<AdvertisementDraft>(() =>
    item ? draftFromAdvertisement(item) : blankAdDraft()
  );
  const [status, setStatus] = useState<AdStatus>(item?.status ?? 'draft');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  const active = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  function change<K extends keyof AdvertisementDraft>(key: K, value: AdvertisementDraft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setDirty(true);
  }

  const field = (key: keyof AdvertisementDraft) => ({
    id: 'ad-' + key,
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? 'ad-error-' + key : undefined
  });

  const error = (key: keyof AdvertisementDraft) =>
    errors[key] ? <small className="ad-desk-error" id={'ad-error-' + key}>{errors[key]}</small> : null;

  async function handleImageFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage('');
    try {
      const url = await uploadAdvertisementImage(file);
      change('creative_image_path', url);
      change('image_source', 'creative_image');
      setMessage(t('Image uploaded successfully!', 'ছবি সফলভাবে আপলোড হয়েছে!'));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    const validation = validateAdDraft(draft, lang);
    setErrors(validation);
    if (Object.keys(validation).length) {
      setMessage(t('Check the highlighted fields before saving.', 'সংরক্ষণের আগে চিহ্নিত ঘরগুলো ঠিক করুন।'));
      return;
    }
    pending.current = true;
    setBusy(true);
    setMessage('');
    try {
      const saved = await saveAdvertisement(item?.id ?? null, adWritePayload(draft, status));
      if (!saved?.id) throw Error('Server confirmation was missing.');
      if (active.current) onSaved();
    } catch (reason) {
      if (active.current) {
        setMessage((reason as Error).message);
        if (reason instanceof AdvertisementApiError) {
          setErrors(
            Object.fromEntries(
              Object.entries(reason.fieldErrors).map(([key, values]) => [key.split('.')[0], values.join(' ')])
            )
          );
        }
      }
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  }

  // Determine current image preview URL
  const previewImgUrl = draft.creative_image_path
    ? (draft.creative_image_path.startsWith('http') || draft.creative_image_path.startsWith('/')
        ? draft.creative_image_path
        : '/' + draft.creative_image_path)
    : `/advertisement-media/${commonCategories.some((c) => c.id === draft.sector) ? draft.sector : 'general'}.svg`;

  return (
    <form className="ad-desk-card ad-desk-editor" onSubmit={submit} aria-busy={busy} noValidate>
      <h2>{item ? t('Edit advertisement', 'বিজ্ঞাপন সম্পাদনা') : t('New advertisement', 'নতুন বিজ্ঞাপন')}</h2>
      <p>
        {t(
          'Fast & simple advertisement setup. Configure title, topbar ticker text, ad details, serial order, and upload an image.',
          'সহজ ও সুবিধাজনকভাবে বিজ্ঞাপন সাজান: শিরোনাম, টপ-বার টিকার বার্তা, বিস্তারিত বিবরণ, সিরিয়াল নং ও ছবি যুক্ত করুন।'
        )}
      </p>

      <fieldset disabled={busy || uploading}>
        {/* Top-Bar Ticker Checkbox */}
        <div className="ad-desk-ticker-callout">
          <label className="ad-desk-checkbox">
            <input
              type="checkbox"
              checked={draft.show_in_ticker}
              onChange={(event) => change('show_in_ticker', event.target.checked)}
            />
            <strong>
              {t(
                'Show this advertisement in the homepage top bar (ticker)',
                'এই বিজ্ঞাপনটি মূল পাতার ওপরের বিজ্ঞাপনবারে (টিকারে) দেখান'
              )}
            </strong>
          </label>
          <small>
            {t(
              'Control 2 texts: a short punchy announcement for the homepage top bar ticker, and comprehensive details for the ad page.',
              '২টি আলাদা বার্তা: মূল পাতার ওপরের রানিং টিকারে সংক্ষিপ্ত বার্তা এবং বিস্তারিত বিজ্ঞাপন পেজে পূর্ণাঙ্গ বিবরণ।'
            )}
          </small>
        </div>

        {/* 1. TITLE & TEXT CONTENT (English & Bangla) */}
        <div className="ad-desk-columns">
          {(['en', 'bn'] as const).map((locale) => (
            <div key={locale} className="ad-locale-column">
              <h3>{locale === 'en' ? 'English' : 'বাংলা'}</h3>

              <label htmlFor={'ad-title_' + locale}>
                {t('Title', 'শিরোনাম')}
                <input
                  {...field(`title_${locale}` as const)}
                  value={draft[`title_${locale}` as const]}
                  maxLength={140}
                  placeholder={locale === 'en' ? 'e.g. Master Full-Stack Web Development' : 'যেমন: ফুল-স্ট্যাক ওয়েব ডেভেলপমেন্ট বুটক্যাম্প'}
                  onChange={(e) => change(`title_${locale}` as const, e.target.value)}
                />
                {error(`title_${locale}` as const)}
              </label>

              <div className="ad-field-group">
                <div className="ad-field-header">
                  <label htmlFor={'ad-ticker_text_' + locale}>
                    <span>{t('1. Homepage Top-Bar Text (Short Message)', '১. মূল পাতার টপ-বার বার্তা (সংক্ষিপ্ত টিকার)')}</span>
                  </label>
                  <span className="ad-field-badge ad-field-badge-ticker">{bn ? 'টপ-বার · সংক্ষিপ্ত' : 'Top Bar · Short'}</span>
                </div>
                <p className="ad-field-help">
                  {locale === 'en'
                    ? 'Short announcement for the running homepage top ticker (brief & punchy).'
                    : 'মূল পাতার ওপরের রানিং টিকারে দেখানোর সংক্ষিপ্ত বার্তা (৫০–১৫০ অক্ষর)।'}
                </p>
                <textarea
                  {...field(`ticker_text_${locale}` as const)}
                  rows={2}
                  maxLength={500}
                  placeholder={
                    locale === 'en'
                      ? 'e.g. 🎓 Admission Open: Full-Stack Web Bootcamp — 40% Merit Scholarship this week!'
                      : 'যেমন: 🎓 ভর্তি চলছে: ফুল-স্ট্যাক ওয়েব ডেভেলপমেন্টে ৪০% মেধা স্কলারশিপ!'
                  }
                  value={draft[`ticker_text_${locale}`]}
                  onChange={(event) => change(`ticker_text_${locale}`, event.target.value)}
                />
                {error(`ticker_text_${locale}`)}
                <small className="ad-char-count">{draft[`ticker_text_${locale}`].length} / 500</small>
              </div>

              <div className="ad-field-group">
                <div className="ad-field-header">
                  <label htmlFor={'ad-body_' + locale}>
                    <span>{t('2. Advertisement Page Description (Full Details)', '২. বিজ্ঞাপন পেজের পূর্ণ বিবরণ (বিস্তারিত)')}</span>
                  </label>
                  <span className="ad-field-badge ad-field-badge-page">{bn ? 'বিজ্ঞাপন পেজ · বিস্তারিত' : 'Ad Page · Details'}</span>
                </div>
                <p className="ad-field-help">
                  {locale === 'en'
                    ? 'Comprehensive text shown on the ad details page (/ads) with complete offerings, contact and terms.'
                    : 'বিজ্ঞাপন পেজে (/ads) দেখানোর পূর্ণাঙ্গ বিবরণ (অফার, সুবিধা, ঠিকানা ও ফোন নম্বরসহ)।'}
                </p>
                <textarea
                  {...field(`body_${locale}` as const)}
                  rows={6}
                  maxLength={1000}
                  placeholder={
                    locale === 'en'
                      ? 'Write the full advertisement text with features, hotline, address and course/service breakdown…'
                      : 'সম্পূর্ণ অফার, সুবিধা, যোগাযোগের ঠিকানা ও শর্তাদির পূর্ণ বিবরণ লিখুন…'
                  }
                  value={draft[`body_${locale}` as const]}
                  onChange={(e) => change(`body_${locale}` as const, e.target.value)}
                />
                {error(`body_${locale}` as const)}
                <small className="ad-char-count">{draft[`body_${locale}` as const].length} / 1000</small>
              </div>
            </div>
          ))}
        </div>

        {/* 2. IMAGE UPLOAD & PREVIEW (Simple & Direct) */}
        <div style={{ background: '#ffffff', border: '1px solid #d8cdb7', borderRadius: '10px', padding: '18px 20px', margin: '20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <strong style={{ fontSize: '15px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={18} color="var(--vermilion)" />
                {t('Advertisement Image', 'বিজ্ঞাপনের ছবি')}
              </strong>
            </div>
            {draft.creative_image_path && (
              <button
                type="button"
                className="btn-pill-light"
                style={{ padding: '6px 12px', fontSize: '12px', color: '#b91c1c' }}
                onClick={() => {
                  change('creative_image_path', '');
                  change('image_source', 'illustration');
                }}
              >
                <Trash2 size={13} style={{ marginRight: 4 }} />
                {t('Remove image', 'ছবি মুছুন')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Live Preview Thumbnail */}
            <div
              style={{
                width: '130px',
                height: '130px',
                borderRadius: '10px',
                border: '2px dashed #d8cdb7',
                background: '#faf7f2',
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              <img
                src={previewImgUrl}
                alt="Ad preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                onChange={handleImageFile}
                style={{ display: 'none' }}
                id="ad-image-file-input"
              />
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="ad-desk-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload size={15} />
                  {uploading
                    ? t('Uploading image…', 'ছবি আপলোড হচ্ছে…')
                    : t('Upload image from device', 'ডিভাইস থেকে ছবি আপলোড করুন')}
                </button>
              </div>
              <small style={{ color: 'var(--slate-500)' }}>{t('Simple image upload for your ad.', 'আপনার বিজ্ঞাপনের জন্য সাধারণ ছবি আপলোড।')}</small>
              {error('creative_image_path')}
            </div>
          </div>
        </div>

        {/* 3. CATEGORY & SERIAL ORDER & STATUS */}
        <div className="ad-desk-columns">
          {/* Two Category Inputs: Preset Dropdown and Free-write text input */}
          <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label htmlFor="ad-preset-sector">
              <strong>{t('Category / Sector (ক্যাটাগরি)', 'ক্যাটাগরি / খাত')}</strong>
              <select
                id="ad-preset-sector"
                className="review-input"
                value={commonCategories.some(c => c.id === draft.sector) ? draft.sector : 'other'}
                onChange={(e) => {
                  if (e.target.value !== 'other') {
                    change('sector', e.target.value);
                  } else {
                    change('sector', '');
                  }
                }}
                style={{ width: '100%', marginTop: '6px' }}
              >
                {commonCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{bn ? cat.labelBn : cat.labelEn}</option>
                ))}
                <option value="other">{t('Other / Custom', 'অন্যান্য / কাস্টম')}</option>
              </select>
            </label>

            <label htmlFor="ad-custom-sector" style={{ display: (!commonCategories.some(c => c.id === draft.sector) || draft.sector === '') ? 'block' : 'none' }}>
              <strong>{t('Free write category', 'মুক্ত ক্যাটাগরি লিখুন')}</strong>
              <input
                id="ad-custom-sector"
                className="review-input"
                type="text"
                placeholder={t('Write any category name…', 'যেকোনো ক্যাটাগরির নাম লিখুন…')}
                value={commonCategories.some(c => c.id === draft.sector) ? '' : draft.sector}
                onChange={(e) => change('sector', e.target.value)}
                style={{ width: '100%', marginTop: '6px' }}
              />
            </label>
          </div>

          {/* Serial / Display Order */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label htmlFor="ad-display_order">
              <strong>{t('Ad Serial / Order (সিরিয়াল নং)', 'বিজ্ঞাপনের সিরিয়াল / ক্রম নং')}</strong>
              <input
                {...field('display_order')}
                type="number"
                min={0}
                max={10000}
                value={draft.display_order}
                onChange={(e) => change('display_order', e.target.value)}
                style={{ width: '100%', marginTop: '6px' }}
              />
              {error('display_order')}
            </label>
            <small style={{ color: 'var(--slate-500)', display: 'block', marginTop: '4px' }}>
              {t('Order of appearance (1 appears first, then 2, 3...)', 'ছোট সংখ্যা সবার আগে প্রদর্শিত হবে (১ সবার আগে, তারপর ২, ৩...)')}
            </small>
          </div>

          {/* Publication State */}
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label>
              <strong>{t('Publication state', 'প্রকাশের অবস্থা')}</strong>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as AdStatus);
                  setDirty(true);
                }}
                style={{ width: '100%', marginTop: '6px' }}
              >
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {statusText(value, bn)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* 4. OPTIONAL DESTINATION & SCHEDULE */}
        <div style={{ marginTop: '16px' }}>
          <label htmlFor="ad-destination_url">
            {t('Destination link (optional)', 'বিজ্ঞাপনের ওয়েব লিংক (ঐচ্ছিক)')}
            <input
              {...field('destination_url')}
              type="url"
              value={draft.destination_url}
              placeholder="https://example.com/offer"
              maxLength={2048}
              onChange={(e) => change('destination_url', e.target.value)}
              style={{ marginTop: '6px' }}
            />
            {error('destination_url')}
          </label>
          <small>{t('Optional HTTPS link where users are taken upon clicking the ad.', 'ব্যবহারকারী বিজ্ঞাপনে ক্লিক করলে যে ওয়েবসাইটে যাবে (ঐচ্ছিক)।')}</small>
        </div>

        <div className="ad-desk-columns" style={{ marginTop: '14px' }}>
          {(['starts_at', 'ends_at'] as const).map((key) => (
            <label key={key} htmlFor={'ad-' + key}>
              {key === 'starts_at'
                ? t('Starts (optional)', 'শুরু (ঐচ্ছিক)')
                : t('Ends (optional)', 'শেষ (ঐচ্ছিক)')}
              <input
                {...field(key)}
                type="datetime-local"
                value={draft[key]}
                onChange={(e) => change(key, e.target.value)}
                style={{ marginTop: '6px' }}
              />
              {error(key)}
            </label>
          ))}
        </div>
      </fieldset>

      {message && <p className="ad-desk-error" role="alert">{message}</p>}

      <div className="ad-desk-actions" style={{ marginTop: '24px' }}>
        <button className="ad-desk-primary" type="submit" disabled={busy || uploading}>
          {busy ? t('Saving…', 'সংরক্ষণ হচ্ছে…') : t('Save advertisement', 'বিজ্ঞাপন সংরক্ষণ করুন')}
        </button>
        <button
          type="button"
          disabled={busy || uploading}
          onClick={() => {
            if (!dirty || window.confirm(t('Discard unsaved changes?', 'সংরক্ষণ না করা পরিবর্তন বাদ দেবেন?'))) {
              onCancel();
            }
          }}
        >
          {t('Cancel', 'বাতিল')}
        </button>
      </div>
    </form>
  );
}
