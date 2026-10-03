"use client";
import {useEffect, useId, useRef, useState} from 'react';
import {ChevronLeft, ChevronRight, Expand, ImageOff, Images, X} from 'lucide-react';
import '../civic-community.css';
import {formatNumber} from '../../i18n/dictionary';
import {isAiDemoIllustration,visiblePublicMedia} from '../../lib/publicMedia';

export type PublicMediaItem = {url: string; alt: string; kind?: string; caption?: string};
export type PublicMediaGalleryProps = {media?: PublicMediaItem[]; lang?: 'en' | 'bn'; label?: string; className?: string};

/** Only pass explicitly approved public_media. Private attachments are never a fallback. */
export function PublicMediaGallery({media = [], lang = 'en', label, className = ''}: PublicMediaGalleryProps) {
  const bn = lang === 'bn';
  const items = visiblePublicMedia(media);
  const [index, setIndex] = useState(-1);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const countId = useId();
  const galleryLabel = label || (bn ? 'প্রকাশ্য ছবি' : 'Public images');
  const activeItem = items[index];
  const isIllustration = (item: PublicMediaItem) => item.kind === 'illustration' || item.kind === 'demo';
  const illustrationLabel = bn ? 'ডেমো চিত্র · প্রমাণ নয়' : 'Demo illustration · not evidence';
  const aiIllustrationLabel = bn ? 'এআই-তৈরি কাল্পনিক চিত্র · প্রমাণ নয়' : 'AI-created fictional illustration · not evidence';
  const illustrationLabelFor = (item:PublicMediaItem) => isAiDemoIllustration(item) ? aiIllustrationLabel : illustrationLabel;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (index >= 0 && index < items.length) {
      if (!element.open) element.showModal();
    } else if (element.open) element.close();
  }, [index, items.length]);

  useEffect(() => {
    if (index < 0 || index >= items.length) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [index >= 0 && index < items.length]);

  if (!items.length) return null;
  const close = () => { setIndex(-1); dialog.current?.close(); trigger.current?.focus(); };
  const move = (direction: number) => setIndex(current => (current + direction + items.length) % items.length);
  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/storage/')) {
      const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
      return base ? `${base}${url}` : url;
    }
    return url;
  };
  const picture = (item: PublicMediaItem, full = false) => broken.has(item.url)
    ? <span className="public-media-missing"><ImageOff size={full ? 36 : 24} aria-hidden="true"/><span>{bn ? 'ছবি পাওয়া যাচ্ছে না' : 'Image unavailable'}</span></span>
    : <img src={resolveUrl(item.url)} alt={item.alt || (bn ? 'অনুমোদিত প্রকাশ্য ছবি' : 'Approved public image')} loading={full ? 'eager' : 'lazy'} decoding="async" onError={() => setBroken(s => { const n = new Set(s); n.add(item.url); return n; })}/>;
  const layout = items.length === 1 ? 'single' : items.length <= 3 ? 'stack' : 'grid';

  return <div className={`public-media-gallery ${className}`}>
    <button ref={trigger} type="button" className={`public-media-preview public-media-${layout}`} aria-label={`${galleryLabel}: ${bn ? 'সব ছবি দেখুন' : 'view all images'} (${formatNumber(items.length, lang)})`} aria-haspopup="dialog" onClick={() => setIndex(0)}>
      <span className="public-media-tiles" aria-hidden="true">
        {items.slice(0, 4).map((item, itemIndex) => <span className="public-media-tile" key={`${item.url}-${itemIndex}`}>{picture(item)}{itemIndex === 3 && items.length > 4 && <span className="public-media-more">+{formatNumber(items.length - 3, lang)}</span>}</span>)}
      </span>
      <span className="public-media-open"><Images size={14} aria-hidden="true"/><span>{items.length === 1 ? (bn ? 'ছবি দেখুন' : 'View image') : `${formatNumber(items.length, lang)} ${bn ? 'টি ছবি' : 'images'}`}</span><Expand size={14} aria-hidden="true"/></span>
    </button>
    {items.some(isIllustration) && <small className="public-media-caption">{items.some(isAiDemoIllustration)?aiIllustrationLabel:illustrationLabel}</small>}
    <dialog ref={dialog} className="public-media-dialog" aria-labelledby={titleId} aria-describedby={countId} onCancel={event => {event.preventDefault(); close();}} onClose={() => setIndex(-1)} onClick={event => {if (event.target === event.currentTarget) close();}} onKeyDown={event => {
      if (items.length > 1 && event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      if (items.length > 1 && event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    }}>
      <div className="public-media-dialog-heading"><div><h2 id={titleId}>{galleryLabel}</h2><p id={countId} role="status" aria-live="polite">{formatNumber(index + 1, lang)} / {formatNumber(items.length, lang)}{activeItem && isIllustration(activeItem) ? ` · ${illustrationLabelFor(activeItem)}` : ''}</p></div><button type="button" className="public-media-control" aria-label={bn ? 'ছবি বন্ধ করুন' : 'Close images'} onClick={close} autoFocus><X size={22} aria-hidden="true"/></button></div>
      {activeItem && <figure className="public-media-full">{picture(activeItem, true)}<figcaption>{isAiDemoIllustration(activeItem)?(bn?'এআই-তৈরি কাল্পনিক নমুনা চিত্র। কোনো বাস্তব প্রতিষ্ঠান, ঘটনা বা জমা দেওয়া প্রমাণ নয়।':'AI-created fictional sample illustration. No real organization, event, or submitted evidence is depicted.'):bn && isIllustration(activeItem) ? 'কাল্পনিক ডেমো চিত্র। জমা দেওয়া প্রমাণ নয়।' : activeItem.caption || activeItem.alt}</figcaption></figure>}
      {items.length > 1 && <div className="public-media-navigation"><button type="button" onClick={() => move(-1)}><ChevronLeft size={20} aria-hidden="true"/>{bn ? 'আগের ছবি' : 'Previous'}</button><span>{bn ? 'তীর বোতাম দিয়েও দেখা যায়' : 'Use ← → to browse'}</span><button type="button" onClick={() => move(1)}>{bn ? 'পরের ছবি' : 'Next'}<ChevronRight size={20} aria-hidden="true"/></button></div>}
    </dialog>
  </div>;
}
