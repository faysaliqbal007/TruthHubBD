"use client";
import {Link} from 'react-router-dom';
import {ArrowUpRight,MapPin,ShieldCheck,ShieldAlert,Star} from 'lucide-react';
import type {Business} from '../../types';
import {useI18n} from '../../i18n/LanguageContext';
import {formatNumber,translateCategory,translateArea} from '../../i18n/dictionary';
import '../civic-community.css';
import './organization-card.css';

export function BusinessCard({business}:{business:Business}){
 const {lang,t}=useI18n();
 const fallback='/listing-placeholder.svg';
 const image=business.image?(business.image.startsWith('/')||business.image.startsWith('http')?business.image:'/'+business.image):fallback;
 const name=lang==='bn'&&business.bengaliName?business.bengaliName:business.name;
 const secondaryName=lang==='bn'&&business.bengaliName?business.name:business.bengaliName;
 return <Link to={'/business/'+business.slug} className={'entity-card civic-business-card'+(business.image?'':' no-business-photo')}>
  <div className="civic-business-image"><img src={image} alt={business.image?name:t('Illustration, not a photograph of this organization','চিত্র, এই প্রতিষ্ঠানের বাস্তব ছবি নয়')} loading="lazy" onError={event=>{event.currentTarget.onerror=null;event.currentTarget.src=fallback;event.currentTarget.alt=t('Illustration, not a photograph of this organization','চিত্র, এই প্রতিষ্ঠানের বাস্তব ছবি নয়');}}/></div>
  <div className="civic-business-content"><div className="civic-business-tags"><span>{translateCategory(business.category,lang)}</span>{business.is_demo&&<span className="community-demo-label">{t('Demo','ডেমো')}</span>}{business.verified?<><span className="civic-claimed" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#ecfdf5', color: '#047857', border: '1px solid #10b981', borderRadius: 999, padding: '2px 7px', fontSize: 10.5, fontWeight: 700 }}><ShieldCheck size={12} aria-hidden="true" color="#059669"/>{t('Verified','যাচাইকৃত')}</span>{business.userId?<span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: 999, padding: '2px 7px', fontSize: 10.5, fontWeight: 700 }}>{t('Claimed','মালিকানাধীন')}</span>:null}</>:<span className="organization-unclaimed" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#fffbeb', color: '#b45309', border: '1px solid #f59e0b', borderRadius: 999, padding: '2px 7px', fontSize: 10.5, fontWeight: 700 }}><ShieldAlert size={12} aria-hidden="true" color="#d97706"/>{t('Unverified','অযাচাইকৃত')}</span>}</div>
   <h3>{name}<ArrowUpRight size={19} aria-hidden="true"/></h3>{secondaryName&&<p className="civic-business-bangla">{secondaryName}</p>}
   <p className="civic-business-location"><MapPin size={15} aria-hidden="true"/>{translateArea(business.location,lang)||t('Address not supplied','ঠিকানা দেওয়া নেই')}</p>
   <div className="civic-business-rating">{business.reviewCount>0?<><Star size={15} aria-hidden="true"/><strong>{formatNumber(business.rating,lang,{minimumFractionDigits:1,maximumFractionDigits:1})}/{formatNumber(5,lang)}</strong><span>· {formatNumber(business.reviewCount,lang)} {lang==='bn'?'টি রিভিউ':business.reviewCount===1?'review':'reviews'}</span></>:<span>{t('No reviews yet','এখনও কোনো রিভিউ নেই')}</span>}</div>
   {business.description&&<p className="civic-business-description">{business.description}</p>}
   <div className="civic-business-footer"><span>{business.sourceUrl?.includes('openstreetmap.org')?t('OpenStreetMap listing','ওপেনস্ট্রিটম্যাপ তালিকা'):business.sourceUrl?.includes('dghs.gov.bd')?t('DGHS public directory','স্বাস্থ্য অধিদপ্তরের প্রকাশ্য ডিরেক্টরি'):business.sourceUrl?t('Public-source listing','প্রকাশ্য উৎসের তালিকা'):t('Community listing','কমিউনিটির যোগ করা তালিকা')}</span><strong>{t('View profile','প্রোফাইল দেখুন')} →</strong></div>
  </div>
 </Link>;
}

