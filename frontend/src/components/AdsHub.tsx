"use client";

import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {useLocation} from 'react-router-dom';
import {ArrowRight, CalendarDays, ClipboardCheck, ExternalLink, Flag, Megaphone, MessageSquare, ShieldCheck} from 'lucide-react';
import {useI18n} from '../i18n/LanguageContext';
import type {Language} from '../i18n/LanguageContext';
import {formatNumber} from '../i18n/dictionary';
import {useAuth} from '../features/auth/AuthContext';
import {adBullets, adDestination, adIllustration, adImageUrl, adSectorLabel, adText, getPublicAdvertisements, getPublicAdvertisementTicker, scheduleText} from '../services/advertisements';
import type {Advertisement,AdvertisementTickerSettings} from '../services/advertisements';
import './ads-hub.css';

function useAdvertisements(ticker=false) {
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<{attempt:number;items:Advertisement[];error:boolean;settings?:AdvertisementTickerSettings}>();
  useEffect(() => {
    const controller = new AbortController();
    const request=ticker?getPublicAdvertisementTicker(controller.signal):getPublicAdvertisements(controller.signal).then(items=>({items,enabled:true,policy_en:'',policy_bn:''}));
    request.then(data => {if (!controller.signal.aborted) setSnapshot({attempt,items:data.items,error:false,settings:data});}).catch(() => {if (!controller.signal.aborted) setSnapshot({attempt,items:[],error:true});});
    return () => controller.abort();
  }, [attempt,ticker]);
  const current=snapshot?.attempt===attempt?snapshot:undefined;
  return {items:current?.items??[],settings:current?.settings, loading:!current, error:current?.error??false, retry: () => setAttempt(value => value + 1)};
}

function AdArtwork({ad, lang}: {ad: Advertisement; lang: Language}) {
  const image = adImageUrl(ad); const [failed, setFailed] = useState(false); const photo = image.photo && !failed;
  return <div className={`ad-artwork ad-artwork-${ad.sector}`}>
    <div className="ad-card-labels"><span>{adSectorLabel(ad.sector, lang)}</span><span className="ad-publication-tag">{lang === 'bn' ? 'বিজ্ঞাপন' : 'Advertisement'}</span></div>
    <span className="ad-reference">#AD-{String(ad.id).padStart(3, '0')}</span>
    <img src={failed ? adIllustration(ad.sector) : image.url} alt={photo ? (ad.image.alt || adText(ad, 'title', lang)) : !failed&&ad.image?.kind==='creative' ? `${lang==='bn'?'বিজ্ঞাপনচিত্র':'Advertisement artwork'}: ${adText(ad,'title',lang)}` : (lang === 'bn' ? 'প্রতীকী চিত্র, প্রতিষ্ঠানের বাস্তব ছবি নয়' : 'Illustration, not a photograph of the organization')} width={320} height={180} loading="lazy" onError={() => {if (!failed) setFailed(true);}}/>
    <span className="ad-artwork-caption">{photo ? (lang === 'bn' ? 'প্রকাশের অনুমোদন পাওয়া ছবি' : 'Photo approved for public display') : ad.image?.kind==='creative' ? (lang==='bn'?'সরবরাহ করা বিজ্ঞাপনচিত্র':'Supplied creative artwork') : (lang === 'bn' ? 'প্রতীকী চিত্র' : 'Original illustration')}</span>
  </div>;
}

function AdvertisementCard({ad, lang}: {ad: Advertisement; lang: Language}) {
  const {user} = useAuth(); const bn = lang === 'bn'; const destination = adDestination(ad);
  const report = `/report?${new URLSearchParams({type: 'advertisement', id: String(ad.id)})}`;
  return <article className={`ad-showcase-card ad-sector-${ad.sector}`} id={`ad-${ad.id}`}>
    <AdArtwork key={ad.image?.url} ad={ad} lang={lang}/>
    <div className="ad-card-content"><span className="ad-card-eyebrow">{ad.organization ? (bn && ad.organization.bengali_name ? ad.organization.bengali_name : ad.organization.name) : adSectorLabel(ad.sector, lang)}</span><h3>{adText(ad, 'title', lang)}</h3><p>{adText(ad, 'body', lang)}</p>{adBullets(ad, lang).length > 0 && <ul>{adBullets(ad, lang).map((bullet, index) => <li key={index}><span aria-hidden="true"/><span>{bullet}</span></li>)}</ul>}</div>
    <footer className="ad-card-footer"><p className="ad-schedule"><CalendarDays size={16} aria-hidden="true"/><span>{scheduleText(ad, lang)}</span></p>
      {destination ? (destination.external ? <a className="ad-card-action" href={destination.url} target="_blank" rel="noopener noreferrer">{bn ? 'বিস্তারিত দেখুন' : 'View details'}<ExternalLink size={17} aria-hidden="true"/><span className="ad-sr-only">{bn ? 'নতুন ট্যাবে খুলবে' : 'Opens in a new tab'}</span></a> : <Link className="ad-card-action" to={destination.url}>{bn ? 'প্রোফাইল ও অভিজ্ঞতা দেখুন' : 'View profile & experiences'}<ArrowRight size={17} aria-hidden="true"/></Link>) : <><button className="ad-card-action" type="button" disabled aria-describedby={`ad-destination-${ad.id}`}>{bn ? 'বিস্তারিত দেখুন' : 'View details'}<ExternalLink size={17} aria-hidden="true"/></button><span className="ad-sr-only" id={`ad-destination-${ad.id}`}>{bn ? 'ওয়েবসাইট লিংক এখনো যুক্ত করা হয়নি।' : 'No website destination has been configured.'}</span></>}
      <Link className="ad-report-link" to={user ? report : '/login?next=' + encodeURIComponent(report)}><Flag size={14} aria-hidden="true"/>{user ? (bn ? 'এই বিজ্ঞাপন রিপোর্ট করুন' : 'Report this advertisement') : (bn ? 'রিপোর্ট করতে লগ ইন করুন' : 'Sign in to report')}</Link>
    </footer>
  </article>;
}

export function AdsHub() {
  const {lang} = useI18n(); const bn = lang === 'bn'; const {items, loading, error, retry} = useAdvertisements();
  const {hash}=useLocation();
  useEffect(()=>{if(!/^#ad-\d+$/.test(hash)||!items.length)return;const frame=requestAnimationFrame(()=>document.getElementById(hash.slice(1))?.scrollIntoView({block:'start',behavior:'auto'}));return()=>cancelAnimationFrame(frame);},[hash,items]);
  return <div className="ads-hub">
    <nav className="ads-breadcrumb" aria-label={bn ? 'অবস্থান' : 'Breadcrumb'}><Link to="/">{bn ? 'মূল পাতা' : 'Home'}</Link><span aria-hidden="true">/</span><span>{bn ? 'বিজ্ঞাপন ও স্বচ্ছতা' : 'Advertisements & transparency'}</span></nav>
    <section className="ads-policy-hero" aria-labelledby="ads-policy-heading">
      <div className="ads-policy-main"><span className="ads-policy-kicker"><ShieldCheck size={17} aria-hidden="true"/>{bn ? 'স্বচ্ছ বিজ্ঞাপন ও নাগরিক অংশগ্রহণ' : 'TRANSPARENT ADVERTISING. PUBLIC PARTICIPATION.'}</span><h1 id="ads-policy-heading">{bn ? 'আমাদের প্রতিশ্রুতি ও বিজ্ঞাপন নীতিমালা' : 'Our commitment. Clear advertising.'}</h1>
        <div className="ads-policy-copy"><ClipboardCheck size={24} aria-hidden="true"/><div><p><strong>{bn ? 'TruthHubBD-এর প্রতিশ্রুতি: ' : 'Our commitment: '}</strong>{bn ? 'বিজ্ঞাপনকে স্পষ্টভাবে চিহ্নিত করা এবং প্রকাশের আগে অ্যাডমিনের পর্যালোচনা। অর্থপ্রদান রেটিং, মানুষের রিভিউ বা কেসের সিদ্ধান্ত বদলায় না।' : 'Clearly labelled advertisements, reviewed by an admin before publication. Payment does not change ratings, community reviews or case decisions.'}</p><p>{bn ? 'বিজ্ঞাপন প্রকাশের অনুমোদন কোনো প্রতিষ্ঠানের লাইসেন্স, মালিকানা বা সেবার মানের নিশ্চয়তা নয়। সিদ্ধান্ত নেওয়ার আগে প্রতিষ্ঠানের তথ্য ও অফারের শর্ত পড়ুন।' : 'Publication approval is not a licence, proof of ownership or a guarantee of service quality. Read the organization’s details and the terms before acting.'}</p></div></div>
        <div className="ads-policy-pillars"><span><ClipboardCheck size={14} aria-hidden="true"/>{bn ? 'স্পষ্ট বিজ্ঞাপন পরিচয়' : 'Clearly labelled'}</span><span><MessageSquare size={14} aria-hidden="true"/>{bn ? 'স্বাধীন কমিউনিটির অভিজ্ঞতা' : 'Independent experiences'}</span><span><Flag size={14} aria-hidden="true"/>{bn ? 'উদ্বেগ জানানোর সুযোগ' : 'Report concerns'}</span></div>
        <Link className="ads-policy-link" to="/policies">{bn ? 'প্রকাশ ও কমিউনিটি নীতিমালা পড়ুন' : 'Read publication & community standards'}<ArrowRight size={15} aria-hidden="true"/></Link>
      </div>
      <aside className="ads-report-widget"><span className="ads-report-mark"><Flag size={25} aria-hidden="true"/></span><h2>{bn ? 'সন্দেহজনক বিজ্ঞাপন দেখেছেন?' : 'Something doesn’t add up?'}</h2><p>{bn ? 'বিজ্ঞাপনের রেফারেন্স ও উদ্বেগের কারণ দিয়ে অ্যাডমিনকে জানান। ব্যক্তিগত নথি প্রকাশ্য মন্তব্যে দেবেন না।' : 'Tell staff which advertisement concerns you and why. Keep private documents out of public comments.'}</p><Link to="/report?type=advertisement"><Flag size={17} aria-hidden="true"/>{bn ? 'বিজ্ঞাপন সম্পর্কে রিপোর্ট করুন' : 'Report an advertisement'}</Link><small>{bn ? 'লগ ইন প্রয়োজন · টিম পর্যালোচনা করে' : 'Sign-in required · reviewed by staff'}</small></aside>
    </section>
    <section className="ads-showcase" aria-labelledby="ads-showcase-heading"><header className="ads-showcase-heading"><div><span className="ads-eyebrow">{bn ? 'বিজ্ঞাপন ও ঘোষণা' : 'ADVERTISEMENTS & ANNOUNCEMENTS'}</span><h2 id="ads-showcase-heading">{loading ? (bn ? 'চলমান বিজ্ঞাপন' : 'Current advertisements') : `${formatNumber(items.length, lang)} ${bn ? 'টি চলমান বিজ্ঞাপন' : 'current advertisements'}`}</h2></div><p>{bn ? 'শিক্ষা, স্বাস্থ্যসেবা ও ক্যারিয়ারের তথ্য। বিস্তারিত পড়ুন এবং প্রতিষ্ঠানের সঙ্গে সরাসরি যোগাযোগ করুন।' : 'Education, healthcare and career information. Read the details and contact the organization directly.'}</p></header>
      {loading ? <p className="ads-state" role="status">{bn ? 'বিজ্ঞাপন লোড হচ্ছে…' : 'Loading advertisements…'}</p> : error ? <div className="ads-state" role="alert"><p>{bn ? 'বিজ্ঞাপন লোড করা যায়নি। আবার চেষ্টা করুন।' : 'Advertisements could not be loaded. Please try again.'}</p><button type="button" onClick={retry}>{bn ? 'আবার চেষ্টা করুন' : 'Try again'}</button></div> : items.length ? <div className="ads-card-grid">{items.map(ad => <AdvertisementCard key={ad.id} ad={ad} lang={lang}/>)}</div> : <div className="ads-state"><Megaphone size={30} aria-hidden="true"/><h3>{bn ? 'এখন কোনো চলমান বিজ্ঞাপন নেই।' : 'No current advertisements.'}</h3><p>{bn ? 'অ্যাডমিনের অনুমোদন পাওয়া বিজ্ঞাপন নির্ধারিত সময়ে এখানে দেখা যাবে।' : 'Admin-approved advertisements appear here during their scheduled dates.'}</p><Link to="/search?view=reviews">{bn ? 'মানুষের অভিজ্ঞতা পড়ুন' : 'Explore community experiences'}<ArrowRight size={16} aria-hidden="true"/></Link></div>}
    </section>
  </div>;
}

export function AdsStrip({lang}: {lang: Language}) {
  const bn=lang==='bn';const {items,settings,loading,error}=useAdvertisements(true);
  const policy=(bn?settings?.policy_bn:settings?.policy_en)||'';
  const tickerText=(ad:Advertisement)=>(bn?ad.ticker_text_bn:ad.ticker_text_en)?.trim()||adText(ad,'body',lang);
  const duration=Math.max(40,Math.ceil((policy.length+items.reduce((count,ad)=>count+adText(ad,'title',lang).length+tickerText(ad).length+20,0))*.12));
  const messages=(duplicate=false)=><ul className="ads-news-set" aria-hidden={duplicate||undefined}><li className="ads-news-policy"><span>{bn?'বিজ্ঞাপন নীতি':'Advertising policy'}</span><Link to="/ads" tabIndex={duplicate?-1:undefined}>{policy}</Link></li>{items.map(ad=><li className={`ads-news-item ads-news-${ad.sector}`} key={ad.id}><span>{adSectorLabel(ad.sector,lang)}</span><Link to={`/ads#ad-${ad.id}`} tabIndex={duplicate?-1:undefined}><img src={adImageUrl(ad).url} width={20} height={20} alt="" onError={event=>{if(!event.currentTarget.src.endsWith('.svg'))event.currentTarget.src=adIllustration(ad.sector);}}/><strong>{adText(ad,'title',lang)}:</strong><span className="ads-news-body">{tickerText(ad)}</span></Link></li>)}</ul>;
  if(settings?.enabled===false)return null;
  return <aside className="ads-strip ads-news-strip" aria-label={bn?'বিজ্ঞাপন ও বার্তা':'Advertisements and messages'}><span className="ads-strip-label"><span className="ads-live-dot" aria-hidden="true"/><span className="ads-label-desktop">{bn?'বিজ্ঞাপন ও বার্তা':'ADS & MESSAGES'}</span><span className="ads-label-mobile">{bn?'বিজ্ঞাপন':'ADS'}</span></span>
    {items.length?<div className="ads-news-viewport"><div className="ads-news-track" style={{animationDuration:`${duration}s`}}>{messages()}{messages(true)}</div></div>:<p className="ads-strip-policy">{loading?(bn?'বিজ্ঞাপন লোড হচ্ছে…':'Loading advertisements…'):error?(bn?'বিজ্ঞাপন এখন পাওয়া যাচ্ছে না।':'Advertisements are currently unavailable.'):(bn?'বিজ্ঞাপন আলাদাভাবে চিহ্নিত; কমিউনিটির সিদ্ধান্ত স্বাধীন।':'Advertisements are labelled; community decisions stay independent.')}</p>}
    <Link className="ads-strip-details" to="/ads">{bn?'বিস্তারিত':'Details'}<ArrowRight size={14} aria-hidden="true"/></Link>
  </aside>;
}
