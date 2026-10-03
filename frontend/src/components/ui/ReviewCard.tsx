"use client";
import React, { useEffect, useState } from "react";
import type { Review } from "../../types";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Bookmark, MessageSquare, ShieldCheck, Star } from "lucide-react";
import {useAuth} from '../../features/auth/AuthContext';
import {ReviewReactions} from './ReviewReactions';
import { bookmarkService } from "../../services/bookmarkService";
import { PublicMediaGallery } from "./PublicMediaGallery";
import { ReportContentLink } from "./ReportContentLink";
import { PublicVideoLinks } from "../PublicVideoLinks";
import "../content-report.css";
import {useI18n} from '../../i18n/LanguageContext';
import {formatNumber,formatDate,translateStatus} from '../../i18n/dictionary';
import {publicText,originalTextLabel} from '../../i18n/content';
import './review-card-links.css';

export function ReviewCard({ review }: { review: Review }) {
  const {lang,t}=useI18n();
  const {user}=useAuth();
  const navigate=useNavigate();
  const location=useLocation();
  const originalLabel=originalTextLabel(review,lang,['title','body']);
  const media = review.public_media ?? [];
  const rawDate = review.experienceDate || review.date;
  const parsedDate = rawDate ? new Date(rawDate) : null;
  const date = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
  const [isSaved, setIsSaved] = useState(() => bookmarkService.isReviewSaved(review.id));
  useEffect(() => setIsSaved(bookmarkService.isReviewSaved(review.id)), [review.id]);

  const handleToggleSave = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {navigate('/login?next=' + encodeURIComponent(location.pathname + location.search)); return;}
    const next = bookmarkService.toggleReview({
      id: review.id,
      title: review.title,
      rating: review.rating,
      body: review.body,
      author: review.author,
      businessName: (review as Review & { businessName?: string }).businessName || review.author,
      businessSlug: (review as Review & { businessSlug?: string }).businessSlug || "",
      image: media[0]?.url,
    });
    setIsSaved(next);
  };

  return (
    <article className="editorial-review-card content-review-card">
      <header className="content-review-header">
        <div className="content-review-author">
          <span className="content-review-avatar" aria-hidden="true" style={{ overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {review.authorAvatar ? (
              <img
                src={review.authorAvatar.startsWith('http') ? review.authorAvatar : (review.authorAvatar.startsWith('/') ? review.authorAvatar : '/' + review.authorAvatar)}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              review.initials || review.author.slice(0, 2).toUpperCase()
            )}
          </span>
          <div className="content-review-author-text">
            <strong>{review.author}</strong>
            {review.is_demo && <span className="content-review-verification">{t('Demo review','ডেমো রিভিউ')}</span>}
            <span className="content-review-date">{date ? <>{review.experienceDate ? t('Experience','অভিজ্ঞতার তারিখ') : t('Posted','প্রকাশিত')}: <time dateTime={date.toISOString()}>{formatDate(date,lang)}</time></> : t('Date not provided','তারিখ দেওয়া নেই')}</span>
          </div>
        </div>
        <div className="content-review-rating" aria-label={t(`${review.rating} out of 5 stars`,`${formatNumber(review.rating,lang)} / ${formatNumber(5,lang)} তারকা`)}>
          <span aria-hidden="true">{[1, 2, 3, 4, 5].map(star => <Star key={star} size={14} fill={star <= review.rating ? "currentColor" : "none"} />)}</span>
          <strong>{formatNumber(Number(review.rating),lang,{minimumFractionDigits:1,maximumFractionDigits:1})}</strong>
        </div>
      </header>
      <div className="content-review-statement">
        {originalLabel&&<small className="content-review-date">{originalLabel}</small>}
        <h3><Link to={`/reviews/${review.id}`}>{publicText(review,'title',lang)}</Link></h3>
        <p>{publicText(review,'body',lang)}</p>
      </div>
      {media.length > 0 && <PublicMediaGallery media={media} lang={lang} label={t('Public review photos','রিভিউয়ের প্রকাশ্য ছবি')} />}
      <PublicVideoLinks urls={review.public_video_urls} lang={lang}/>
      {review.linked_case && <Link className="review-linked-case" to={review.linked_case.url}><span>{t('Linked public alert','যুক্ত প্রকাশ্য সতর্কতা')} · <strong>{review.linked_case.case_code}</strong></span><span>{translateStatus(review.linked_case.status,lang)}<ArrowRight size={15} aria-hidden="true"/></span></Link>}
      <footer className="content-review-footer">
        <ReviewReactions id={review.id} helpfulCount={review.helpfulCount || 0} notHelpfulCount={review.notHelpfulCount} viewerReaction={review.viewerReaction} canReact={review.canReact} lang={lang}/>
        <div className="content-review-actions">
          <button type="button" className="content-action" onClick={handleToggleSave} aria-pressed={!!user && isSaved}>
            <Bookmark size={16} aria-hidden="true" fill={user && isSaved ? "currentColor" : "none"} />{!user ? t('Sign in to save','সংরক্ষণ করতে সাইন ইন') : isSaved ? t('Saved','সংরক্ষিত') : t('Save','সংরক্ষণ')}
          </button>
          <Link className="content-action" to={`/reviews/${review.id}#discussion`}><MessageSquare size={16} aria-hidden="true" />{typeof review.discussionCount==='number'?`${formatNumber(review.discussionCount,lang)} ${t('comments','মন্তব্য')}`:t('Comments','মন্তব্য')}</Link>
          <ReportContentLink type="review" id={review.id} lang={lang} />
        </div>
      </footer>
    </article>
  );
}
