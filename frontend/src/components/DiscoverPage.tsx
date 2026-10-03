"use client";
import {useEffect, useState, type ReactNode} from 'react';
import {ArrowRight, Building2, MapPin, MessageSquare, PenLine, Search, SlidersHorizontal} from 'lucide-react';
import {Link, useSearchParams} from 'react-router-dom';
import {PublicReviewFeed} from './PublicReviewFeed';
import {translateCategory} from '../i18n/dictionary';
import {discoveryPage, discoveryView, switchDiscoveryView, updateReviewFilter, type DiscoveryView} from '../lib/discoveryParams';
import './discover.css';

export type DiscoverPageProps = {lang: 'en' | 'bn'; businessView: ReactNode; onWriteReview?: () => void; onAddEntity?: () => void};
const categories = ['All Categories', 'Products', 'Businesses & Services', 'Doctors & Professionals', 'Hospitals & Clinics', 'Universities & Education', 'Courier & Digital Services'];
const locations = [['Dhaka Division', 'ঢাকা বিভাগ'], ['Chattogram Division', 'চট্টগ্রাম বিভাগ'], ['Rajshahi Division', 'রাজশাহী বিভাগ'], ['Khulna Division', 'খুলনা বিভাগ'], ['Barishal Division', 'বরিশাল বিভাগ'], ['Sylhet Division', 'সিলেট বিভাগ'], ['Rangpur Division', 'রংপুর বিভাগ'], ['Mymensingh Division', 'ময়মনসিংহ বিভাগ']];

export function DiscoverPage({lang, businessView, onWriteReview}: DiscoverPageProps) {
  const bn = lang === 'bn';
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const category = params.get('category') || 'All Categories';
  const location = params.get('location') || '';
  const page = discoveryPage(params);
  const sort = params.get('sort') === 'oldest' ? 'oldest' : 'newest';
  const view = discoveryView(params);
  const [draftQuery, setDraftQuery] = useState(query);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => setDraftQuery(query), [query]);
  const changeFilter = (name: 'q' | 'category' | 'location' | 'sort', value: string) => setParams(updateReviewFilter(params, name, value));
  const viewUrl = (nextView: DiscoveryView) => '/search?' + switchDiscoveryView(params, nextView);
  const clear = () => {const next = new URLSearchParams(); next.set('view', 'reviews'); setParams(next);};
  return <div className="discover-page">
    <header className="discover-intro"><div><span className="discover-kicker">{bn ? 'মানুষের অভিজ্ঞতা থেকে জানুন' : 'DISCOVER THROUGH EXPERIENCE'}</span><h1>{bn ? 'খোঁজ নিন। অভিজ্ঞতা জানুন।' : 'Good choices start with a story.'}</h1><p>{bn ? 'দোকান, হাসপাতাল, শিক্ষাপ্রতিষ্ঠান ও কর্মক্ষেত্র নিয়ে মানুষের অভিজ্ঞতা পড়ুন অথবা প্রতিষ্ঠানের তালিকা দেখুন।' : 'Read experiences of shops, hospitals, schools, and employers, or explore organizations across Bangladesh.'}</p></div>{onWriteReview && view === 'reviews' && <button type="button" className="discover-add-entity" onClick={onWriteReview}><PenLine size={18} aria-hidden="true"/>{bn ? 'রিভিউ লিখুন' : 'Write Review'}</button>}</header>
    <nav className="discover-view-switch" aria-label={bn ? 'খোঁজার ধরন' : 'Discovery view'}><Link to={viewUrl('reviews')} aria-current={view === 'reviews' ? 'page' : undefined}><MessageSquare size={17} aria-hidden="true"/>{bn ? 'রিভিউ' : 'Reviews'}<span>{bn ? 'মানুষের অভিজ্ঞতা' : 'Community experiences'}</span></Link><Link to={viewUrl('businesses')} aria-current={view === 'businesses' ? 'page' : undefined}><Building2 size={17} aria-hidden="true"/>{bn ? 'প্রতিষ্ঠান' : 'Organizations'}<span>{bn ? 'ঠিকানা ও তথ্য' : 'Locations & details'}</span></Link></nav>
    {view === 'businesses' ? <div className="discover-business-view">{businessView}</div> : <div className="discover-reviews-view">
      <form className="discover-review-search" role="search" onSubmit={event => {event.preventDefault(); changeFilter('q', draftQuery.trim());}}><label htmlFor="discover-review-query">{bn ? 'রিভিউ ও প্রতিষ্ঠানের মধ্যে খুঁজুন' : 'Search reviews and organization names'}</label><div><Search size={20} aria-hidden="true"/><input id="discover-review-query" type="search" maxLength={255} value={draftQuery} onChange={event => setDraftQuery(event.target.value)} placeholder={bn ? 'প্রতিষ্ঠান বা অভিজ্ঞতার শব্দ লিখুন' : 'An organization name or words from an experience'}/><button type="submit">{bn ? 'খুঁজুন' : 'Search'}<ArrowRight size={17} aria-hidden="true"/></button></div></form>
      <div className="discover-filter-heading"><button type="button" aria-expanded={filtersOpen} aria-controls="discover-review-filters" onClick={() => setFiltersOpen(value => !value)}><SlidersHorizontal size={16} aria-hidden="true"/>{bn ? 'ফিল্টার' : 'Filters'}</button><span>{bn ? 'আপনার এলাকার অভিজ্ঞতা খুঁজুন' : 'Find perspectives from your area'}</span></div>
      <div id="discover-review-filters" className={'discover-review-filters' + (filtersOpen ? ' is-open' : '')}><label><span>{bn ? 'ক্যাটাগরি' : 'Category'}</span><select value={category} onChange={event => changeFilter('category', event.target.value)}>{categories.map(item => <option key={item} value={item}>{translateCategory(item, lang)}</option>)}{!categories.includes(category) && <option value={category}>{category}</option>}</select></label><label><span><MapPin size={13} aria-hidden="true"/>{bn ? 'এলাকা' : 'Location'}</span><select value={location} onChange={event => changeFilter('location', event.target.value)}><option value="">{bn ? 'সারাদেশ' : 'All Bangladesh'}</option>{locations.map(([value, nameBn]) => <option key={value} value={value}>{bn ? nameBn : value}</option>)}{location && !locations.some(([value]) => value === location) && <option value={location}>{location}</option>}</select></label><label><span>{bn ? 'সাজান' : 'Sort by'}</span><select value={sort} onChange={event => changeFilter('sort', event.target.value)}><option value="newest">{bn ? 'নতুন রিভিউ আগে' : 'Newest first'}</option><option value="oldest">{bn ? 'পুরোনো রিভিউ আগে' : 'Oldest first'}</option></select></label>{(query || location || category !== 'All Categories') && <button type="button" className="discover-clear-filters" onClick={clear}>{bn ? 'ফিল্টার মুছুন' : 'Clear filters'}</button>}</div>
      <PublicReviewFeed filters={{query, category, location, page, sort, lang}} onClearFilters={clear} onPageChange={nextPage => {const next = new URLSearchParams(params); next.set('page', String(nextPage)); next.set('view', 'reviews'); setParams(next); document.querySelector('.discover-result-heading')?.scrollIntoView({block: 'start', behavior: 'instant'});}}/>
    </div>}
  </div>;
}
