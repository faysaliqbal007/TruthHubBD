"use client";
import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {ArrowRight, Building2, ChevronDown, GraduationCap, HeartPulse, MapPin, MessageSquare, Search, ShieldCheck, ShoppingBag, Star, Wrench} from 'lucide-react';
import {api} from '../services/api';
import {useCases} from '../services/cases';
import {EntitySuggestions} from './EntitySuggestions';
import {DivisionLedger} from './DivisionLedger';
import {PublicMediaGallery, type PublicMediaItem} from './ui/PublicMediaGallery';
import {ReportContentLink} from './ui/ReportContentLink';
import {PublicVideoLinks} from './PublicVideoLinks';
import {AdsStrip} from './AdsHub';
import {ScamNationalTallyWidget} from './ScamNationalTallyWidget';
import type {Business, Review} from '../types';
import './civic-community.css';
import {publicText,originalTextLabel} from '../i18n/content';
import {formatNumber,translateStatus,translateArea} from '../i18n/dictionary';

type Props = {lang:'en'|'bn'; openArea?:()=>void; selectedArea?:string; openReview:(business?:Business|null)=>void};
type RecentReview = Review & {businessName?:string; businessSlug?:string; businessImage?:string|null; business?:{name:string; slug?:string; image?:string|null}; created_at?:string; is_demo?:boolean; public_media?:PublicMediaItem[]};
const shortcuts = [['Products','Shopping',ShoppingBag,'কেনাকাটা'],['Businesses & Services','Services',Wrench,'সেবা'],['Hospitals & Clinics','Healthcare',HeartPulse,'স্বাস্থ্যসেবা'],['Universities & Education','Education',GraduationCap,'শিক্ষা']] as const;

export function CivicHome({lang,openArea,selectedArea='All Bangladesh',openReview}:Props) {
 const navigate=useNavigate(); const bn=lang==='bn';
 const [query,setQuery]=useState(''); const [reviewAttempt,setReviewAttempt]=useState(0);
 const [reviewSnapshot,setReviewSnapshot]=useState<{attempt:number;reviews:RecentReview[];error:string}>();
 const currentReviews=reviewSnapshot?.attempt===reviewAttempt?reviewSnapshot:undefined;
 const reviews=currentReviews?.reviews??[]; const loading=!currentReviews; const reviewError=currentReviews?.error??'';
 const {cases,loading:loadingCases,error:caseError,retry}=useCases();
 useEffect(()=>{
  let active=true;
  api<{success:boolean;data:RecentReview[]}>('/reviews/recent').then(result=>{if(active)setReviewSnapshot({attempt:reviewAttempt,reviews:result.data,error:''});})
   .catch(reason=>{if(active)setReviewSnapshot({attempt:reviewAttempt,reviews:[],error:reason instanceof Error?reason.message:'Recent reviews are unavailable.'});});
  return()=>{active=false;};
 },[reviewAttempt]);
 useEffect(()=>{
  const handleReviewCreated=()=>{setReviewAttempt(value=>value+1);};
  window.addEventListener('truthhub:review_created',handleReviewCreated);
  return()=>{window.removeEventListener('truthhub:review_created',handleReviewCreated);};
 },[]);
 const search=()=>{const params=new URLSearchParams({view:'businesses'});if(query.trim())params.set('q',query.trim());if(!selectedArea.includes('All Bangladesh'))params.set('location',selectedArea);navigate('/search?'+params);};
 const date=(value:string)=>{const parsed=new Date(value);return Number.isNaN(parsed.getTime())?(bn?'তারিখ দেওয়া নেই':'Date not available'):parsed.toLocaleDateString(bn?'bn-BD':'en-GB',{day:'numeric',month:'short'});};
 const paths=[
  {n:'01',title:bn?'জানুন, তারপর সিদ্ধান্ত নিন':'Make your next choice a better one.',text:bn?'রিভিউ, ঠিকানা ও প্রতিষ্ঠানের তথ্য এক জায়গায়।':'Find the facts, the location, and the experiences that matter.',to:'/search?view=businesses',label:bn?'প্রতিষ্ঠান খুঁজুন':'Explore organizations',Icon:Search},
  {n:'02',title:bn?'আপনার অভিজ্ঞতা জানান':'Your experience belongs here.',text:bn?'সৎ অভিজ্ঞতা অন্য কাউকে ভালো সিদ্ধান্ত নিতে সাহায্য করে।':'A helpful service. A disappointing purchase. Tell the next person.',label:bn?'রিভিউ লিখুন':'Write a review',Icon:Star},
  {n:'03',title:bn?'সমস্যা? নিরাপদে জানান':'A concern deserves a closer look.',text:bn?'ব্যক্তিগত রিপোর্ট পাঠান অথবা ভুল তথ্য জানান।':'Send a private report or flag content that needs a review.',to:'/report',label:bn?'সমস্যা জানান':'Report a concern',Icon:ShieldCheck}
 ];
 const questions=[
  {q:bn?'রিপোর্টের অর্থ কী? কোন প্রমাণ প্রকাশিত হয়?':'What does a report mean, and what evidence is public?',a:bn?'রিপোর্ট একটি অভিযোগ, অপরাধের রায় নয়। মূল সংযুক্তি ব্যক্তিগত থাকে। শুধুমাত্র অনুমোদিত সারাংশ ও প্রকাশের অনুমতি পাওয়া ছবি দেখানো হয়। ডেমো ছবিগুলো উদাহরণ, প্রমাণ নয়।':'A report is an allegation, not a finding of guilt. Original attachments stay private. Only approved summaries and explicitly approved public images are shown. Demo illustrations are examples, not evidence.'},
  {q:bn?'বিভাগের সংখ্যা ও ঠিকানার তথ্য কোথা থেকে আসে?':'Where do the division counts and directory records come from?',a:bn?'তালিকার সংখ্যায় উৎস থেকে আমদানি করা ও কমিউনিটির যোগ করা প্রতিষ্ঠান থাকে। ডেমো তালিকা আলাদাভাবে জানানো হয়। যেসব ঠিকানায় বিভাগ নির্ধারণ করা যায়নি, সেগুলো জাতীয় মোট সংখ্যায় থাকে; অনুমান করে বিভাগ যোগ করা হয় না।':'Listing counts include imported and community entries, with demo entries disclosed separately. Addresses without enough information to assign a division remain in the national total; their division is not guessed.'},
  {q:bn?'মালিকানা অনুমোদন কি ভালো সেবার নিশ্চয়তা?':'Does ownership approval guarantee a good service?',a:bn?'মালিকানা অনুমোদনের মাধ্যমে প্রতিষ্ঠানের প্রতিনিধি তথ্য হালনাগাদ ও গ্রাহককে উত্তর দিতে পারেন। এটি সেবার মানের নিশ্চয়তা বা অনুমোদন নয়। সিদ্ধান্ত নেওয়ার আগে তথ্য ও মানুষের অভিজ্ঞতা পড়ুন।':'Ownership approval lets a business representative maintain their listing and respond to customers. It is not an endorsement or a guarantee of quality. Read the facts and community experiences before deciding.'}
 ];
 return <><AdsStrip lang={lang}/><div className="civic-home community-home">
  <section className="civic-hero community-hero">
   <div className="civic-hero-copy">
    <span className="civic-kicker"><span aria-hidden="true"/>{bn?'সচেতন সিদ্ধান্ত, সবার জন্য':'LOCAL KNOWLEDGE. BETTER DECISIONS.'}</span>
    <h1>{bn?'বিশ্বাস করার আগে':'Check before'}<br/><span>{bn?'খোঁজ নিন।':'you trust.'}</span></h1>
    <p className="civic-intro">{bn?'প্রতিষ্ঠান খুঁজুন। মানুষের অভিজ্ঞতা পড়ুন। সমস্যার কথা নিরাপদে জানান। বাংলাদেশের প্রতিদিনের জীবনের জন্য।':'From your neighbourhood shop to healthcare and education. Find an organization, hear from the community, and make an informed choice.'}</p>
    <form className="civic-search" onSubmit={event=>{event.preventDefault();search();}} role="search">
     <label htmlFor="civic-search-input">{bn?'কী খুঁজছেন?':'What are you looking for?'}</label>
     <div className="civic-search-row"><Search size={22} aria-hidden="true"/><input id="civic-search-input" value={query} maxLength={255} onChange={event=>setQuery(event.target.value)} placeholder={bn?'প্রতিষ্ঠান, দোকান বা সেবার নাম':'Organization, shop or service name'} autoComplete="off"/><button className="civic-primary" type="submit"><span>{bn?'খুঁজুন':'Search'}</span><ArrowRight size={18} aria-hidden="true"/></button></div>
     <button type="button" className="civic-area" onClick={openArea}><MapPin size={17} aria-hidden="true"/><span>{bn?'এলাকা: ':'Area: '}{translateArea(selectedArea,lang)}</span><ChevronDown size={16} aria-hidden="true"/></button>
    </form>
    <EntitySuggestions query={query} category="All" location={selectedArea}/>
    <div className="civic-quick-categories" aria-label={bn?'ক্যাটাগরি':'Popular categories'}>{shortcuts.map(([category,label,Icon,bnLabel])=><Link key={category} to={'/search?'+new URLSearchParams({view:'businesses',category})}><Icon size={16} aria-hidden="true"/>{bn?bnLabel:label}</Link>)}</div>
    <p className="civic-trust-note" style={{ margin: '14px 0 6px' }}><ShieldCheck size={17} aria-hidden="true"/>{bn?'বাংলাদেশজুড়ে নাগরিক অভিজ্ঞতা, সত্যানুসন্ধান ও জনস্বার্থে যাচাইকৃত স্বাধীন তথ্যভাণ্ডার।':'Nationwide public reviews, civic accountability, and community trust across Bangladesh.'}</p>
    <div style={{ marginTop: '14px' }}>
      <ScamNationalTallyWidget lang={lang} />
    </div>
   </div>
   <DivisionLedger lang={lang}/>
  </section>
  <section className="civic-paths" aria-label={bn?'কীভাবে সাহায্য পেতে পারেন':'Ways to use TruthHubBD'}>{paths.map(item=><article key={item.n}><div className="civic-path-top"><span>{item.n}</span><item.Icon size={22} aria-hidden="true"/></div><h2>{item.title}</h2><p>{item.text}</p>{item.to?<Link to={item.to}>{item.label}<ArrowRight size={17} aria-hidden="true"/></Link>:<button type="button" onClick={()=>openReview()}>{item.label}<ArrowRight size={17} aria-hidden="true"/></button>}</article>)}</section>
  <div className="civic-community-grid community-desks">
   <section className="civic-feed community-feed"><header><div><span className="civic-kicker">{bn?'মানুষের অভিজ্ঞতা':'THE COMMUNITY DESK'}</span><h2>{bn?'ছোট অভিজ্ঞতা। বড় সাহায্য।':'Small stories. Real perspective.'}</h2></div><Link to="/search?view=reviews" aria-label={bn?'সব রিভিউ দেখুন':'Read all reviews'}><ArrowRight size={20} aria-hidden="true"/></Link></header>
    {loading?<p className="community-feed-status" role="status">{bn?'সাম্প্রতিক অভিজ্ঞতা লোড হচ্ছে…':'Loading recent experiences…'}</p>:reviewError?<div className="community-feed-status" role="alert"><p>{reviewError}</p><button type="button" onClick={()=>setReviewAttempt(value=>value+1)}>{bn?'আবার চেষ্টা করুন':'Try again'}</button></div>:reviews.length?reviews.slice(0,3).map(review=>{
      const bName = review.businessName || review.business?.name || (bn ? 'কমিউনিটি রিভিউ' : 'Community review');
      const bSlug = review.businessSlug || (review.business as any)?.slug;
      const bImg = review.businessImage || (review.business as any)?.image;
      const bImgUrl = bImg
        ? (bImg.startsWith('http')
            ? bImg
            : (bImg.startsWith('http') || bImg.startsWith('/') ? bImg : '/' + bImg))
        : null;
      return <article className={'community-story'+(review.public_media?.length?' community-story-with-media':'')} key={review.id}>
        <div className="community-story-copy">
          <div className="community-story-meta">
            {review.is_demo&&<span className="community-demo-label">{bn?'ডেমো':'Demo'}</span>}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="civic-review-thumb-wrap" aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, minWidth: 18, borderRadius: 4, overflow: 'hidden', verticalAlign: 'middle', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                {bImgUrl ? (
                  <img
                    src={bImgUrl}
                    alt={bName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const fb = e.currentTarget.parentElement?.querySelector('.civic-review-thumb-fb') as HTMLElement;
                      if (fb) fb.style.display = 'inline-flex';
                    }}
                  />
                ) : null}
                <span className="civic-review-thumb-fb" style={{ display: bImgUrl ? 'none' : 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#0f766e' }}>
                  <Building2 size={11} />
                </span>
              </span>
              {bSlug ? (
                <Link to={'/business/' + bSlug} style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span>{bName}</span>
                </Link>
              ) : (
                <span>{bName}</span>
              )}
            </span>
          </div>
          <Link className="community-story-main" to={'/reviews/'+review.id}>
            <h3>{publicText(review,'title',lang)}<ArrowRight size={16} aria-hidden="true"/></h3>
            <p>{publicText(review,'body',lang).slice(0,160)}{publicText(review,'body',lang).length>160?'…':''}</p>
          </Link>
          {originalTextLabel(review,lang,['title','body'])&&<small className="content-language-note">{originalTextLabel(review,lang,['title','body'])}</small>}
          <span className="community-review-rating"><Star size={14} fill="currentColor" aria-hidden="true"/>{formatNumber(review.rating,lang)} / {formatNumber(5,lang)}<span>{bn?'অভিজ্ঞতার রেটিং':'experience rating'}</span></span>
        </div>
        <PublicMediaGallery media={review.public_media} lang={lang} label={publicText(review,'title',lang)}/>
        <div className="community-story-footer"><span>{review.authorAvatar ? <img src={review.authorAvatar.startsWith('http') ? review.authorAvatar : (review.authorAvatar.startsWith('/') ? review.authorAvatar : '/' + review.authorAvatar)} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', display: 'inline-block', marginRight: 6 }} onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} /> : <span className="community-author-dot" aria-hidden="true">{review.author?.slice(0,1)||'R'}</span>}{review.author||(bn?'কমিউনিটি সদস্য':'Community member')}<span className="community-story-date">· {date(review.date||review.created_at||'')}</span></span><Link className="community-comments-link" to={'/reviews/'+review.id+'#discussion'}><MessageSquare size={16} aria-hidden="true"/>{formatNumber(review.discussionCount??0,lang)} {bn?'মন্তব্য':'comments'}</Link><ReportContentLink type="review" id={review.id} lang={lang}/></div>
      </article>;
    }):<div className="civic-empty"><h3>{bn?'আপনার অভিজ্ঞতা দিয়ে শুরু হোক।':'A good experience starts a conversation.'}</h3><p>{bn?'একটি সহায়ক সেবা পেয়েছেন? কমিউনিটিকে জানান।':'Found a helpful service? Tell your community about it.'}</p><button type="button" onClick={()=>openReview()}>{bn?'রিভিউ লিখুন':'Write a review'}<ArrowRight size={16} aria-hidden="true"/></button></div>}
    <div className="community-feed-more"><Link className="civic-text-link" to="/search?view=reviews">{bn?'সব রিভিউ দেখুন':'See all reviews'}<ArrowRight size={16} aria-hidden="true"/></Link><button className="civic-text-link" type="button" onClick={()=>openReview()}>{bn?'রিভিউ লিখুন':'Write a review'}</button></div>
    </section>
    <section className="civic-feed community-feed civic-case-feed"><header><div><span className="civic-kicker">{bn?'সচেতন থাকুন':'THE PUBLIC CASEBOOK'}</span><h2>{bn?'জানুন। প্রশ্ন করুন। সতর্ক থাকুন।':'Stay informed. Stay aware.'}</h2></div><Link to="/scam-alerts" aria-label={bn?'সব প্রকাশ্য কেস আপডেট দেখুন':'Read all public case updates'}><ArrowRight size={20} aria-hidden="true"/></Link></header>
     {loadingCases?<p className="community-feed-status" role="status">{bn?'কেস আপডেট লোড হচ্ছে…':'Loading public case updates…'}</p>:caseError?<div className="community-feed-status" role="alert"><p>{caseError}</p><button onClick={retry} type="button">{bn?'আবার চেষ্টা করুন':'Try again'}</button></div>:cases.slice(0,3).map(caseItem=><article className={'community-story'+(caseItem.public_media?.length?' community-story-with-media':'')} key={caseItem.id}>
      <div className="community-story-copy"><div className="community-story-meta">{caseItem.is_demo&&<span className="community-demo-label">{bn?'ডেমো':'Demo'}</span>}{caseItem.status && caseItem.status.toLowerCase().trim() !== 'published' && <span>{translateStatus(caseItem.status,lang)}</span>}</div><Link className="community-story-main" to={'/scam-alerts/'+caseItem.caseCode}><h3 style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="civic-entity-thumb-wrap" aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, minWidth: 18, borderRadius: 4, overflow: 'hidden', verticalAlign: 'middle', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>{caseItem.businessImage ? <img src={caseItem.businessImage.startsWith('http') ? caseItem.businessImage : (caseItem.businessImage.startsWith('/') ? caseItem.businessImage : '/' + caseItem.businessImage)} alt={caseItem.entity} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }} /> : null}<span style={{ display: caseItem.businessImage ? 'none' : 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#0f766e' }}><Building2 size={11} /></span></span><span>{caseItem.entity}</span><ArrowRight size={16} aria-hidden="true"/></h3><p>{publicText(caseItem,'summary',lang).slice(0,160)}{publicText(caseItem,'summary',lang).length>160?'…':''}</p></Link>{originalTextLabel(caseItem,lang,['summary'])&&<small className="content-language-note">{originalTextLabel(caseItem,lang,['summary'])}</small>}<span className="community-case-code">{caseItem.caseCode}</span></div>
      <PublicMediaGallery media={caseItem.public_media} lang={lang} label={publicText(caseItem,'title',lang)||caseItem.entity}/>
      <PublicVideoLinks urls={caseItem.public_video_urls} lang={lang}/>
      <div className="community-story-footer"><span><MapPin size={13} aria-hidden="true"/>{translateArea(caseItem.location,lang)||(bn?'ঠিকানা দেওয়া নেই':'Location not supplied')}<span className="community-story-date">· {date(caseItem.date)}</span></span><ReportContentLink type="scam_case" id={caseItem.id} lang={lang}/></div>
     </article>)}
     {!loadingCases&&!caseError&&!cases.length&&<p className="community-feed-status">{bn?'এখনও প্রকাশ্য আপডেট নেই। অনুমোদিত সারাংশ প্রকাশ না হওয়া পর্যন্ত রিপোর্ট ব্যক্তিগত থাকে।':'No public updates yet. Reports stay private until an approved summary is published.'}</p>}
     <Link className="civic-text-link" to="/scam-alerts">{bn?'সব কেস আপডেট দেখুন':'Browse the casebook'}<ArrowRight size={16} aria-hidden="true"/></Link>
    </section>
  </div>
  <section className="community-faq" aria-labelledby="community-faq-heading"><div><span className="civic-kicker">{bn?'পরিষ্কার তথ্য। ন্যায্য প্রক্রিয়া।':'CLEAR INFORMATION. A FAIR PROCESS.'}</span><h2 id="community-faq-heading">{bn?'জেনে রাখা ভালো।':'A few things worth knowing.'}</h2><p>{bn?'আপনার সিদ্ধান্তে স্বচ্ছ তথ্য সাহায্য করে।':'Good decisions start with knowing what you’re reading.'}</p></div><div className="community-faq-questions">{questions.map(item=><details key={item.q}><summary>{item.q}<ChevronDown size={18} aria-hidden="true"/></summary><p>{item.a}</p></details>)}</div></section>
 </div></>;
}
