"use client";
import {ArrowRight, Building2, MapPin, MessageSquare, ShieldCheck, Star} from 'lucide-react';
import {Link} from 'react-router-dom';
import {PublicMediaGallery} from './ui/PublicMediaGallery';
import {ReportContentLink} from './ui/ReportContentLink';
import {ReviewReactions} from './ui/ReviewReactions';
import {PublicVideoLinks} from './PublicVideoLinks';
import {formatDate, formatNumber, localizedError, translateArea, translateCategory, translateStatus} from '../i18n/dictionary';
import {originalTextLabel, publicText} from '../i18n/content';
import {usePublicReviews, type PublicReview, type PublicReviewFilters} from '../services/reviews';
import './discover.css';
import './ui/review-card-links.css';

export function ReviewStoryCard({review, lang}: {review: PublicReview; lang: 'en' | 'bn'}) {
  const bn = lang === 'bn';
  const title = publicText(review, 'title', lang);
  const body = publicText(review, 'body', lang);
  const original = originalTextLabel(review, lang, ['title', 'body']);
  const author = review.author === 'Guest' ? (bn ? 'অতিথি' : 'Guest') : review.author || (bn ? 'কমিউনিটি সদস্য' : 'Community member');
  const rating = Math.min(5, Math.max(0, review.rating));
    const businessImgUrl = review.businessImage
      ? (review.businessImage.startsWith('http')
          ? review.businessImage
          : (review.businessImage.startsWith('http') || review.businessImage.startsWith('/') ? review.businessImage : '/' + review.businessImage))
      : null;
    return <article className={'discover-story' + (review.public_media?.length ? ' discover-story-with-media' : '')}>
    <header className="discover-story-heading"><div className="discover-story-author"><span className="discover-story-avatar" aria-hidden="true" style={{ overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{review.authorAvatar ? <img src={review.authorAvatar.startsWith('http') ? review.authorAvatar : (review.authorAvatar.startsWith('/') ? review.authorAvatar : '/' + review.authorAvatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} /> : (review.initials || author.slice(0, 2))}</span><div><strong>{author}</strong><span>{formatDate(review.date, lang)}</span></div></div><div className="discover-story-stars" aria-label={bn ? `৫ তারকার মধ্যে ${formatNumber(rating, lang)}` : `${rating} out of 5 stars`}><span aria-hidden="true">{[1, 2, 3, 4, 5].map(star => <Star key={star} size={13} fill={star <= rating ? 'currentColor' : 'none'}/>)}</span><strong>{formatNumber(rating, lang, {maximumFractionDigits: 1})} / {formatNumber(5, lang)}</strong></div></header>
    <div className="discover-story-context">{review.is_demo && <span className="discover-demo-label">{bn ? 'ডেমো রিভিউ' : 'Demo review'}</span>}<span>{translateCategory(review.businessCategory, lang)}</span></div>
    <div className="discover-story-copy"><Link className="discover-story-title" to={'/reviews/' + review.id}><h2>{title}<ArrowRight size={18} aria-hidden="true"/></h2></Link><p>{body.slice(0, 280)}{body.length > 280 ? '…' : ''}</p>{original && <span className="discover-original-text">{original}</span>}<Link className="discover-business-link" to={'/business/' + review.businessSlug} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="discover-business-thumbnail-wrap" aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, minWidth: 18, borderRadius: 4, overflow: 'hidden', verticalAlign: 'middle', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>{businessImgUrl ? <img src={businessImgUrl} alt={review.businessName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; const fb = e.currentTarget.parentElement?.querySelector('.business-thumb-fallback') as HTMLElement; if (fb) fb.style.display = 'inline-flex'; }} /> : null}<span className="business-thumb-fallback" style={{ display: businessImgUrl ? 'none' : 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#0f766e' }}><Building2 size={11} /></span></span><span>{review.businessName}</span><ArrowRight size={13} aria-hidden="true"/></Link>{review.businessLocation && <span className="discover-story-location"><MapPin size={12} aria-hidden="true"/>{translateArea(review.businessLocation, lang)}</span>}</div>
    {review.public_media?.length ? <PublicMediaGallery className="discover-story-gallery" media={review.public_media} lang={lang} label={title}/> : null}
    {review.imagePath && (
      <div className="review-feed-images" style={{ display: 'flex', gap: 8, margin: '8px 0', flexWrap: 'wrap' }}>
        {(() => {
          const resolved = review.imagePath!.startsWith('http') ? review.imagePath! : (review.imagePath!.startsWith('/') ? review.imagePath! : '/' + review.imagePath!);
          return (
            <a href={resolved} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: 8, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
              <img src={resolved} alt={bn ? 'রিভিউয়ের ছবি' : 'Review photo'} style={{ width: 80, height: 80, objectFit: 'cover', display: 'block' }} />
            </a>
          );
        })()}
      </div>
    )}
    <PublicVideoLinks urls={review.public_video_urls} lang={lang}/>
    {review.linked_case && <Link className="review-linked-case" to={review.linked_case.url}><span>{bn?'যুক্ত প্রকাশ্য সতর্কতা':'Linked public alert'} · <strong>{review.linked_case.case_code}</strong></span><span>{translateStatus(review.linked_case.status,lang)}<ArrowRight size={15} aria-hidden="true"/></span></Link>}
    <ReviewReactions id={review.id} helpfulCount={review.helpfulCount} notHelpfulCount={review.notHelpfulCount} viewerReaction={review.viewerReaction} canReact={review.canReact} lang={lang}/>
    <footer className="discover-story-footer"><Link to={'/reviews/' + review.id + '#discussion'}><MessageSquare size={15} aria-hidden="true"/>{bn ? 'মন্তব্য' : 'Comments'} <span>({formatNumber(review.discussionCount ?? 0, lang)})</span></Link><Link className="discover-read-review" to={'/reviews/' + review.id}>{bn ? 'রিভিউ পড়ুন' : 'Read review'}<ArrowRight size={14} aria-hidden="true"/></Link><ReportContentLink type="review" id={review.id} lang={lang}/></footer>
  </article>;
}

export function PublicReviewFeed({filters, onPageChange, onClearFilters}: {filters: PublicReviewFilters; onPageChange: (page: number) => void; onClearFilters: () => void}) {
  const {reviews, total, lastPage, loading, error, retry} = usePublicReviews(filters);
  const lang = filters.lang || 'en';
  const bn = lang === 'bn';
  const page = filters.page || 1;
  const outsideResultPages = page > lastPage;
  const hasFilters = !!filters.query || !!filters.location || !!filters.category && !['All', 'All Categories'].includes(filters.category);
  return <section className="discover-review-feed" aria-label={bn ? 'কমিউনিটি রিভিউ' : 'Community reviews'} aria-busy={loading}>
    <div className="discover-result-heading"><span role="status">{loading ? (bn ? 'রিভিউ খোঁজা হচ্ছে…' : 'Finding community experiences…') : error ? (bn ? 'রিভিউ পাওয়া যাচ্ছে না' : 'Reviews unavailable') : `${formatNumber(total, lang)} ${bn ? 'টি প্রকাশ্য রিভিউ' : 'public reviews'}`}</span><span>{bn ? 'প্রকাশিত অভিজ্ঞতা · ডেমো চিহ্নিত' : 'Published experiences · demos labeled'}</span></div>
    {loading ? <div className="discover-loading" aria-hidden="true">{[1, 2, 3].map(item => <div className="discover-skeleton" key={item}><span/><div/><div/><div/></div>)}</div> : error ? <div className="discover-empty" role="alert"><ShieldCheck size={29} aria-hidden="true"/><h2>{bn ? 'রিভিউ লোড করা যায়নি।' : 'The review feed is unavailable.'}</h2><p>{localizedError(error, lang)}</p><button type="button" onClick={retry}>{bn ? 'আবার চেষ্টা করুন' : 'Try again'}</button></div> : reviews.length ? <div className="discover-stories">{reviews.map(review => <ReviewStoryCard key={review.id} review={review} lang={lang}/>)}</div> : <div className="discover-empty"><MessageSquare size={30} aria-hidden="true"/><h2>{outsideResultPages ? (bn ? 'এই পৃষ্ঠায় কোনো রিভিউ নেই।' : 'There are no reviews on this page.') : (bn ? 'এখানে এখনও কোনো অভিজ্ঞতা নেই।' : 'No experiences found here yet.')}</h2><p>{outsideResultPages ? (bn ? 'প্রথম পৃষ্ঠায় ফিরে বর্তমান রিভিউ দেখুন।' : 'Return to the first page to see the current reviews.') : hasFilters ? (bn ? 'অন্য এলাকা, বিভাগ বা খোঁজার শব্দ ব্যবহার করুন।' : 'Try another location, category, or search term.') : (bn ? 'কোনো প্রতিষ্ঠান খুঁজে নিজের অভিজ্ঞতা লিখুন।' : 'Find an organization and share your own experience.')}</p>{outsideResultPages ? <button type="button" onClick={() => onPageChange(1)}>{bn ? 'প্রথম পৃষ্ঠায় যান' : 'Go to first page'}</button> : hasFilters ? <button type="button" onClick={onClearFilters}>{bn ? 'ফিল্টার মুছুন' : 'Clear filters'}</button> : <Link to="/search?view=businesses">{bn ? 'প্রতিষ্ঠান খুঁজুন' : 'Find an organization'}<ArrowRight size={16} aria-hidden="true"/></Link>}</div>}
    {!loading && !error && lastPage > 1 && !outsideResultPages && <nav className="discover-pagination" aria-label={bn ? 'রিভিউয়ের পৃষ্ঠা' : 'Review pages'}><button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>{bn ? 'আগের পৃষ্ঠা' : 'Previous'}</button><span>{bn ? `${formatNumber(page, lang)} / ${formatNumber(lastPage, lang)} পৃষ্ঠা` : `Page ${page} of ${lastPage}`}</span><button type="button" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>{bn ? 'পরের পৃষ্ঠা' : 'Next'}</button></nav>}
  </section>;
}
