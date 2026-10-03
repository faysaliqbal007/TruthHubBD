"use client";
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, Search, ShieldCheck, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import { GoogleMap } from './GoogleMap';
import { PrivateFileInput } from './PrivateFileInput';
import { useI18n } from '../i18n/LanguageContext';
import { formatNumber, localizedError, translateArea, translateCategory } from '../i18n/dictionary';
import type { Business } from '../types';
import './business-claim.css';

export function BusinessClaimForm() {
  const { user, checking } = useAuth(); const [params] = useSearchParams(); const { lang, t } = useI18n();
  const [query, setQuery] = useState(params.get('q') || ''); const [selected, setSelected] = useState<Business>(); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false);
  const [searchAttempt, setSearchAttempt] = useState(0); const [searchResult, setSearchResult] = useState<{ query: string; userId: number; attempt: number; items: Business[]; error: string }>();
  const proofCard = useRef<HTMLElement>(null); const selectedId = selected?.id;
  const claimReturnPath = '/claim' + (params.size ? '?' + params : '');
  const businessName = (business: Business) => lang === 'bn' && business.bengaliName ? business.bengaliName : business.name;
  useEffect(() => {
    if (selectedId == null || !window.matchMedia('(max-width: 767px)').matches || !proofCard.current) return;
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 96;
    proofCard.current.style.scrollMarginTop = String(headerHeight + 20) + 'px';
    proofCard.current.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [selectedId]);
  useEffect(() => {
    let active = true;
    if (!user || query.trim().length < 2) return;
    const searchQuery = query.trim(); const userId = user.id;
    const timer = setTimeout(() => {
      api<{ data: Business[] }>('/businesses?' + new URLSearchParams({ q: searchQuery, limit: '20' }))
        .then(r => { if (active) setSearchResult({ query: searchQuery, userId, attempt: searchAttempt, items: r?.data || [], error: '' }); })
        .catch(error => { if (active) setSearchResult({ query: searchQuery, userId, attempt: searchAttempt, items: [], error: (error as Error).message }); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [query, searchAttempt, user]);
  const matchesCurrentSearch = searchResult?.query === query.trim() && searchResult?.userId === user?.id && searchResult?.attempt === searchAttempt;
  const items = matchesCurrentSearch ? searchResult?.items || [] : [];
  const searchError = matchesCurrentSearch ? searchResult?.error || '' : '';
  const searching = !!user && query.trim().length >= 2 && !matchesCurrentSearch;
  const availableItems = items.filter(item => item.id !== selected?.id);
  return <div className="workspace-page organization-claim-page">
    <header className="workspace-heading"><span className="alert-eyebrow">{t('FOR ORGANIZATION REPRESENTATIVES', 'প্রতিষ্ঠানের প্রতিনিধিদের জন্য')}</span><h1>{t('Claim your organization', 'আপনার প্রতিষ্ঠানের প্রতিনিধিত্ব দাবি করুন')}</h1><p>{t('Represent a shop, hospital, school, employer, or other organization. Find its existing profile and submit your authority for admin review. Community experiences stay with the profile. Each account may represent only 1 organization.', 'দোকান, হাসপাতাল, শিক্ষাপ্রতিষ্ঠান, কর্মক্ষেত্র বা অন্য প্রতিষ্ঠানের প্রতিনিধি হোন। বিদ্যমান প্রোফাইল খুঁজে প্রশাসকের পর্যালোচনার জন্য প্রতিনিধিত্বের প্রমাণ দিন। নীতি অনুযায়ী একটি অ্যাকাউন্ট দিয়ে কেবল একটি প্রতিষ্ঠানের প্রতিনিধিত্ব করা যায়।')}</p></header>
    {user?.claim_blocked && (
      <div style={{ background: '#fef2f2', border: '1.5px solid #f87171', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', color: '#991b1b' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800 }}>
          {t('Organization Claiming Restricted', 'প্রতিষ্ঠান প্রতিনিধিত্ব সীমাবদ্ধ')}
        </h3>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
          {user.claim_blocked_reason || t(
            'Your account has been restricted from claiming organizations due to previous invalid or disputed representation. You may continue to use TruthHub as a community member.',
            'পূর্ববর্তী ভুল বা বিতর্কিত তথ্যের কারণে আপনার অ্যাকাউন্ট থেকে প্রতিষ্ঠানের প্রতিনিধিত্ব দাবি করার সুবিধা স্থগিত করা হয়েছে। তবে সাধারণ কমিউনিটি সদস্য হিসেবে আপনি TruthHub ব্যবহার করতে পারবেন।'
          )}
        </p>
      </div>
    )}
    {user?.role === 'business' && (
      <div style={{ background: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', color: '#92400e' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800 }}>
          {t('Single Organization Account Policy', 'এক অ্যাকাউন্ট এক প্রতিষ্ঠান নীতি')}
        </h3>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
          {t(
            'Your user account is already representing a registered organization. Each account can only claim and represent 1 organization account. To claim or represent another organization, please register a separate account or visit the Business Center.',
            'আপনার অ্যাকাউন্টটি ইতিমধ্যে একটি প্রতিষ্ঠানের প্রতিনিধি হিসেবে নিবন্ধিত। নীতি অনুযায়ী একটি অ্যাকাউন্ট দিয়ে কেবল একটি প্রতিষ্ঠানের প্রতিনিধিত্ব দাবি করা যায়। অন্য কোনো প্রতিষ্ঠানের জন্য আলাদা অ্যাকাউন্ট ব্যবহার করুন অথবা বিজনেস সেন্টারে যান।'
          )}
        </p>
        <div style={{ marginTop: '10px' }}>
          <Link to="/business-center" style={{ fontWeight: 700, color: 'var(--teal-primary)', textDecoration: 'underline' }}>
            {t('Go to Business Center →', 'বিজনেস সেন্টারে যান →')}
          </Link>
        </div>
      </div>
    )}
    {message && <p role="status" className="workspace-notice">{localizedError(message, lang)}</p>}
    {checking ? <p role="status">{t('Checking your account…', 'আপনার অ্যাকাউন্ট যাচাই করা হচ্ছে…')}</p> : !user ? <section className="workspace-card"><h2>{t('Sign in to claim a listing', 'তালিকার প্রতিনিধিত্ব দাবি করতে সাইন ইন করুন')}</h2><p>{t('Your account lets you submit private proof and track the review.', 'আপনার অ্যাকাউন্ট থেকে ব্যক্তিগত প্রমাণ জমা দিতে ও পর্যালোচনার অগ্রগতি দেখতে পারবেন।')}</p><Link className="btn-teal-pill" to={'/login?next=' + encodeURIComponent(claimReturnPath)}>{t('Sign in', 'সাইন ইন করুন')}<ArrowRight size={17} aria-hidden="true" /></Link></section> : sent ? <section className="workspace-card organization-claim-success" role="status"><Check size={26} aria-hidden="true" /><h2>{t('Claim received for', 'প্রতিনিধিত্বের আবেদন পাওয়া গেছে:')} {selected ? businessName(selected) : ''}</h2><p>{t('Your documents are private. An administrator will approve or reject the application after review. No ownership badge is granted automatically.', 'আপনার নথি ব্যক্তিগত থাকবে। পর্যালোচনার পর প্রশাসক আবেদন অনুমোদন বা প্রত্যাখ্যান করবেন। মালিকানার ব্যাজ স্বয়ংক্রিয়ভাবে দেওয়া হয় না।')}</p><Link to="/activity">{t('Track your application', 'আবেদনের অগ্রগতি দেখুন')} →</Link></section> : <div className="workspace-columns organization-claim-columns">
      <section className="workspace-card organization-claim-search" aria-labelledby="claim-find-title"><span className="claim-step">{t('STEP', 'ধাপ')} {formatNumber(1, lang)}</span><h2 id="claim-find-title">{t('Find your organization', 'আপনার প্রতিষ্ঠান খুঁজুন')}</h2><label htmlFor="claim-organization-query">{t('Organization name, area, or category', 'প্রতিষ্ঠানের নাম, এলাকা বা ক্যাটাগরি')}</label><div className="claim-search-input"><Search size={20} aria-hidden="true" /><input id="claim-organization-query" type="search" className="review-input" value={query} maxLength={255} aria-describedby="claim-search-help" onChange={e => { setQuery(e.target.value); setSelected(undefined); setMessage(''); }} placeholder={t('Name and branch or area', 'নাম ও শাখা বা এলাকা')} /></div>
        <p id="claim-search-help" className="claim-search-help">{t('Search by name or branch. If an organization has an existing representative, your claim will be reviewed by admin as an ownership challenge with your submitted proof.', 'নাম বা শাখা দিয়ে খুঁজুন। প্রতিষ্ঠানে ইতিমধ্যে অন্য কোনো প্রতিনিধি থাকলে আপনার জমা দেওয়া বৈধ প্রমাণের ভিত্তিতে প্রশাসক তা যাচাই করবেন।')}</p>
        {selected && <div className="claim-selected-summary"><span><Check size={17} aria-hidden="true" />{t('Selected', 'নির্বাচিত')}</span><strong>{businessName(selected)}</strong>{selected.userId ? <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{t('Disputed Claim', 'মালিকানা বিতর্ক')}</span> : null}<button type="button" onClick={() => { setSelected(undefined); document.getElementById('claim-organization-query')?.focus(); }}><X size={16} aria-hidden="true" />{t('Change organization', 'অন্য প্রতিষ্ঠান বাছুন')}</button></div>}
        <div className="claim-search-status" role="status" aria-live="polite">{query.trim().length < 2 ? t('Enter at least two characters to search.', 'খোঁজার জন্য অন্তত দুইটি অক্ষর লিখুন।') : searching ? t('Finding available profiles…', 'উপলব্ধ প্রোফাইল খোঁজা হচ্ছে…') : !searchError && availableItems.length ? `${formatNumber(availableItems.length, lang)} ${t('available matches shown', 'টি উপলব্ধ ফলাফল দেখানো হচ্ছে')}` : null}</div>
        {searchError ? <div className="claim-search-empty" role="alert"><p>{localizedError(searchError, lang)}</p><button type="button" className="btn-pill-light" onClick={() => setSearchAttempt(value => value + 1)}>{t('Try search again', 'আবার খুঁজুন')}</button></div> : !searching && query.trim().length >= 2 && !availableItems.length && !selected ? <div className="claim-search-empty"><h3>{t('No available profile matches', 'উপলব্ধ প্রোফাইল পাওয়া যায়নি')}</h3><p>{t('Try a shorter name or another area. An existing profile may already have an approved representative.', 'ছোট নাম বা অন্য এলাকা দিয়ে খুঁজুন। বিদ্যমান প্রোফাইলে ইতিমধ্যে অনুমোদিত প্রতিনিধি থাকতে পারেন।')}</p></div> : null}
        <ul className="claim-search-results" aria-busy={searching}>{availableItems.map(b => <li key={b.id}><button type="button" className="claim-search-result" onClick={() => setSelected(b)}><span><strong>{businessName(b)}</strong><span>{translateCategory(b.category, lang)}</span><span>{b.location ? translateArea(b.location, lang) : t('No physical address listed', 'কোনো সরাসরি ঠিকানা দেওয়া নেই')}</span>{b.userId && <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>{t('Currently represented · Dispute', 'বর্তমানে প্রতিনিধি রয়েছে · বিতর্ক')}</span>}{b.is_demo && <small>{t('Demo organization', 'ডেমো প্রতিষ্ঠান')}</small>}</span><ChevronRight size={20} aria-hidden="true" /></button></li>)}</ul>
        <div className="claim-recovery"><p>{t('Already represented?', 'ইতিমধ্যে প্রতিনিধি আছে?')} <Link to="/business-center">{t('Open your center', 'আপনার কেন্দ্র খুলুন')}</Link> {t('or', 'অথবা')} <Link to="/report">{t('contact the review team', 'পর্যালোচনা দলের সঙ্গে যোগাযোগ করুন')}</Link>.</p><p>{t('Missing from the directory?', 'ডিরেক্টরিতে নেই?')} <Link to="/search?view=businesses">{t('Add an organization', 'প্রতিষ্ঠান যোগ করুন')}</Link>. {t('Avoid creating a duplicate profile.', 'একই প্রতিষ্ঠানের একাধিক প্রোফাইল তৈরি করবেন না।')}</p></div>
      </section>
      <section className="workspace-card organization-claim-proof" ref={proofCard}><span className="claim-step">{t('STEP', 'ধাপ')} {formatNumber(2, lang)}</span><h2>{t('Submit private proof', 'ব্যক্তিগত প্রমাণ জমা দিন')}</h2>{!selected ? <div className="claim-proof-placeholder"><ShieldCheck size={32} aria-hidden="true" /><h3>{t('Choose a profile to continue', 'এগিয়ে যেতে প্রোফাইল বাছুন')}</h3><p>{t('Select your organization on the left. On a phone, the form opens below your selection.', 'পাশের তালিকা থেকে আপনার প্রতিষ্ঠান বাছুন। ফোনে নির্বাচন করার নিচে ফর্মটি খুলবে।')}</p><small>{t('Proof is private and reviewed by an administrator.', 'প্রমাণ ব্যক্তিগত থাকে এবং প্রশাসক পর্যালোচনা করেন।')}</small></div> : <><h3>{businessName(selected)}</h3><GoogleMap lang={lang} name={selected.name} location={selected.location} placeId={selected.googlePlaceId} latitude={selected.latitude} longitude={selected.longitude} /><form className="review-form-content" onSubmit={async e => { e.preventDefault(); if (busy) return; setBusy(true); const form = new FormData(e.currentTarget); try { await api('/businesses/' + selected.id + '/claims', 'POST', form); setSent(true); setMessage(''); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); } }}>
        <label>{t("Representative's full name", 'প্রতিনিধির পূর্ণ নাম')}<input className="review-input" name="representative_name" required maxLength={255} /></label>
        <label>{t('Role or job title', 'দায়িত্ব বা পদবি')}<input className="review-input" name="role_title" required maxLength={255} /></label>
        <label>{t('Organization contact email', 'প্রতিষ্ঠানের যোগাযোগের ইমেইল')}<input className="review-input" name="contact_email" type="email" required maxLength={255} /></label>
        <label>{t('Organization contact phone', 'প্রতিষ্ঠানের যোগাযোগের ফোন')}<input className="review-input" name="contact_phone" type="tel" required minLength={7} maxLength={40} pattern="[+0-9() -]{7,40}" title={t('Enter a contact number using digits and an optional country code', 'সংখ্যা দিয়ে যোগাযোগের নম্বর লিখুন; প্রয়োজনে দেশের কোড যোগ করুন')} /></label>
        <label>{t('Organization or registered address', 'প্রতিষ্ঠান বা নিবন্ধিত ঠিকানা')}<textarea className="review-textarea" name="business_address" required maxLength={500} /></label>
        <label>{t('Authority evidence type', 'প্রতিনিধিত্বের প্রমাণের ধরন')}<select className="review-input" name="document_type" required><option value="trade_license">{t('Trade licence', 'ট্রেড লাইসেন্স')}</option><option value="registration">{t('Organization registration', 'প্রতিষ্ঠানের নিবন্ধন')}</option><option value="authorization">{t('Signed authorization from the organization', 'প্রতিষ্ঠানের স্বাক্ষরিত অনুমতিপত্র')}</option></select></label>
        <PrivateFileInput name="evidence" label={t('Ownership / authorization document (private)', 'মালিকানা বা অনুমতির নথি (ব্যক্তিগত)')} required />
        <PrivateFileInput name="business_photo" label={t('Organization photo or website screenshot (private)', 'প্রতিষ্ঠানের ছবি বা ওয়েবসাইটের স্ক্রিনশট (ব্যক্তিগত)')} imageOnly required />
        <p>{t('Maximum 10 MB per file. Show the organization name and your authority. Redact unrelated personal information; do not upload passwords, PINs, or unnecessary national IDs. These files are not your public profile photo.', 'প্রতিটি ফাইল সর্বোচ্চ ১০ মেগাবাইট। প্রতিষ্ঠানের নাম ও আপনার প্রতিনিধিত্বের অধিকার দেখান। অপ্রাসঙ্গিক ব্যক্তিগত তথ্য ঢেকে দিন; পাসওয়ার্ড, পিন বা অপ্রয়োজনীয় জাতীয় পরিচয়পত্র জমা দেবেন না। এই ফাইলগুলো আপনার প্রকাশ্য প্রোফাইলের ছবি নয়।')}</p>
        <label><input type="checkbox" required /> {t('I am authorized to represent this entity and the submitted information is accurate.', 'আমি এই প্রতিষ্ঠানের অনুমোদিত প্রতিনিধি এবং জমা দেওয়া তথ্য সঠিক।')}</label>
        <button className="btn-teal-pill" disabled={busy || user?.role === 'business' || user?.claim_blocked}>{busy ? t('Submitting…', 'জমা দেওয়া হচ্ছে…') : user?.claim_blocked ? t('Account restricted from claiming', 'প্রতিনিধিত্ব দাবি স্থগিত') : user?.role === 'business' ? t('Already representing an organization', 'ইতিমধ্যে একটি প্রতিষ্ঠানের প্রতিনিধি আছেন') : selected?.userId ? t('Submit ownership dispute claim', 'মালিকানা বিতর্ক আবেদন পাঠান') : t('Send claim for admin review', 'প্রশাসকের পর্যালোচনার জন্য আবেদন পাঠান')}</button>
      </form></>}</section>
    </div>}
  </div>;
}
