"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Facebook, 
  Twitter, 
  Link as LinkIcon, 
  MessageCircle, 
  Download, 
  Smartphone, 
  Image as ImageIcon, 
  Sparkles, 
  X, 
  Send
} from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { translateStatus, translateCategory, formatNumber } from '../i18n/dictionary';
import { resolveMediaUrl } from '../services/api';

type ShareTarget = {
  label: string;
  labelBn: string;
  href: (url: string, text: string) => string;
  icon: React.ElementType;
  color: string;
};

const SHARE_TARGETS: ShareTarget[] = [
  {
    label: 'WhatsApp',
    labelBn: 'হোয়াটসঅ্যাপ',
    href: (url, text) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
    icon: MessageCircle,
    color: '#25d366',
  },
  {
    label: 'Facebook',
    labelBn: 'ফেসবুক',
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    icon: Facebook,
    color: '#1877f2',
  },
  {
    label: 'Twitter / X',
    labelBn: 'টুইটার / এক্স',
    href: (url, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    icon: Twitter,
    color: '#000000',
  },
  {
    label: 'Telegram',
    labelBn: 'টেলিগ্রাম',
    href: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    icon: Send,
    color: '#229ED9',
  },
];

type ShareCardProps = {
  url: string;
  title: string;
  description?: string;
  compact?: boolean;
  rating?: number;
  author?: string;
  businessName?: string;
  isAlert?: boolean;
  caseCode?: string;
  organizationImage?: string;
  mediaImage?: string;
  amount?: string | number;
  status?: string;
  category?: string;
};

export function ShareCard({
  url,
  title,
  description = '',
  compact = false,
  rating,
  author,
  businessName,
  isAlert = false,
  caseCode,
  organizationImage,
  mediaImage,
  amount,
  status,
  category,
}: ShareCardProps) {
  const { t, lang } = useI18n();
  const bn = lang === 'bn';
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'card'>('link');
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [cardFormat, setCardFormat] = useState<'story' | 'post'>('story'); // 'story' = 9:16 (1080x1920), 'post' = 1:1 (1080x1080)
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fullUrl = url.startsWith('http') 
    ? url 
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`;

  const shareText = isAlert
    ? bn 
      ? `🚨 [সতর্কতা] ${title} — TruthHubBD নাগরিক প্ল্যাটফর্মে যাচাইকৃত কেস দেখুন` 
      : `🚨 [ALERT] ${title} — Verified civic case on TruthHubBD`
    : bn
      ? `${title} — TruthHubBD-এ রিভিউটি দেখুন`
      : `${title} — Read this community review on TruthHubBD`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = fullUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Render the Visual Card onto Canvas (high resolution for crystal clear sharing)
  useEffect(() => {
    if (!modalOpen || activeTab !== 'card') return;

    let cancelled = false;
    const width = 1080;
    const height = cardFormat === 'story' ? 1920 : 1080;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loadImg = (src?: string | null): Promise<HTMLImageElement | null> => {
      if (!src) return Promise.resolve(null);
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          // If crossOrigin anonymous fails, attempt direct loading
          const fallback = new Image();
          fallback.onload = () => resolve(fallback);
          fallback.onerror = () => resolve(null);
          fallback.src = src;
        };
        img.src = src;
      });
    };

    Promise.all([
      loadImg('/brand-logo.png'),
      organizationImage ? loadImg(resolveMediaUrl(organizationImage)) : Promise.resolve(null),
      mediaImage ? loadImg(resolveMediaUrl(mediaImage)) : Promise.resolve(null),
    ]).then(([brandLogoImg, orgImg, mediaImg]) => {
      if (cancelled) return;

      // 1. Background gradient (Deep Midnight / Slate Navy) with rich atmospheric glow
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (isAlert) {
        bgGrad.addColorStop(0, '#1c0d0d');
        bgGrad.addColorStop(0.35, '#2b1013');
        bgGrad.addColorStop(0.75, '#190a0f');
        bgGrad.addColorStop(1, '#090c15');
      } else {
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(0.4, '#1e293b');
        bgGrad.addColorStop(0.8, '#131b2e');
        bgGrad.addColorStop(1, '#090d16');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient radial glow behind central content
      const radialGlow = ctx.createRadialGradient(width / 2, height * 0.38, 50, width / 2, height * 0.38, 500);
      radialGlow.addColorStop(0, isAlert ? 'rgba(239, 68, 68, 0.16)' : 'rgba(56, 189, 248, 0.12)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Editorial borders & Decorative corner notches
      ctx.strokeStyle = isAlert ? 'rgba(239, 68, 68, 0.25)' : 'rgba(216, 205, 183, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(36, 36, width - 72, height - 72);

      const notchSize = 26;
      ctx.fillStyle = isAlert ? '#ef4444' : '#059669';
      // Corners
      ctx.fillRect(36, 36, notchSize, 4);
      ctx.fillRect(36, 36, 4, notchSize);
      ctx.fillRect(width - 36 - notchSize, 36, notchSize, 4);
      ctx.fillRect(width - 40, 36, 4, notchSize);
      ctx.fillRect(36, height - 40, notchSize, 4);
      ctx.fillRect(36, height - 36 - notchSize, 4, notchSize);
      ctx.fillRect(width - 36 - notchSize, height - 40, notchSize, 4);
      ctx.fillRect(width - 40, height - 36 - notchSize, 4, notchSize);

      // 3. Top Header: Brand Logo & Wordmark
      const startY = cardFormat === 'story' ? 105 : 55;
      const headerBoxW = bn ? 490 : 470;
      const headerBoxH = 64;
      const headerBoxX = width / 2 - headerBoxW / 2;

      ctx.fillStyle = isAlert ? 'rgba(239, 68, 68, 0.16)' : 'rgba(30, 41, 59, 0.7)';
      ctx.beginPath();
      ctx.roundRect(headerBoxX, startY, headerBoxW, headerBoxH, 32);
      ctx.fill();
      ctx.strokeStyle = isAlert ? 'rgba(239, 68, 68, 0.45)' : 'rgba(216, 205, 183, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Shield logo icon on the left of header pill
      const shieldSize = 44;
      const shieldX = headerBoxX + 14;
      const shieldY = startY + (headerBoxH - shieldSize) / 2;

      if (brandLogoImg && brandLogoImg.width > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(shieldX, shieldY, shieldSize, shieldSize, 10);
        ctx.clip();
        ctx.drawImage(brandLogoImg, shieldX, shieldY, shieldSize, shieldSize);
        ctx.restore();
      }

      // Brand text next to the shield icon
      const textStartX = shieldX + shieldSize + 12;
      const textCenterY = startY + headerBoxH / 2 + 8;

      ctx.textAlign = 'left';
      ctx.font = 'bold 27px Georgia, serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Truth', textStartX, textCenterY);

      const truthWidth = ctx.measureText('Truth').width;
      ctx.fillStyle = '#ea580c'; // Terracotta red 'Hub'
      ctx.fillText('Hub', textStartX + truthWidth, textCenterY);

      const hubWidth = ctx.measureText('Hub').width;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('BD', textStartX + truthWidth + hubWidth, textCenterY);

      const bdWidth = ctx.measureText('BD').width;
      ctx.font = '700 13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(bn ? '· নাগরিক ট্রাস্ট' : '· CIVIC TRUST', textStartX + truthWidth + hubWidth + bdWidth + 10, textCenterY - 3);

      // 4. Organization Image OR Crisp Fallback Institution Symbol
      let currentY = startY + headerBoxH + (cardFormat === 'story' ? 24 : 14);
      const orgImgSize = cardFormat === 'story' ? 104 : 76;
      const orgImgX = width / 2 - orgImgSize / 2;

      if (orgImg && orgImg.width > 0) {
        // Clean white background surface so any logo stands out crisply
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(orgImgX, currentY, orgImgSize, orgImgSize, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Subtle outer border ring
        ctx.strokeStyle = isAlert ? 'rgba(239, 68, 68, 0.85)' : 'rgba(234, 88, 12, 0.85)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Clip and draw image with aspect-ratio containment (no distortion/squashing)
        ctx.beginPath();
        ctx.roundRect(orgImgX, currentY, orgImgSize, orgImgSize, 20);
        ctx.clip();

        const pad = 8;
        const maxW = orgImgSize - pad * 2;
        const maxH = orgImgSize - pad * 2;
        const scale = Math.min(maxW / orgImg.width, maxH / orgImg.height, 1);
        const drawW = orgImg.width * scale;
        const drawH = orgImg.height * scale;
        const drawX = orgImgX + (orgImgSize - drawW) / 2;
        const drawY = currentY + (orgImgSize - drawH) / 2;
        ctx.drawImage(orgImg, drawX, drawY, drawW, drawH);
        ctx.restore();
      } else {
        // Fallback Institution Emblem with classical columns & TruthHub seal
        ctx.save();
        ctx.fillStyle = isAlert ? 'rgba(239, 68, 68, 0.18)' : 'rgba(30, 41, 59, 0.8)';
        ctx.beginPath();
        ctx.roundRect(orgImgX, currentY, orgImgSize, orgImgSize, 18);
        ctx.fill();
        ctx.strokeStyle = isAlert ? '#ef4444' : '#ea580c';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        const cx = width / 2;
        const cy = currentY + orgImgSize / 2;
        ctx.strokeStyle = isAlert ? '#fca5a5' : '#fed7aa';
        ctx.fillStyle = isAlert ? '#fca5a5' : '#fed7aa';
        ctx.lineWidth = 2.5;

        // Pediment (triangle roof)
        ctx.beginPath();
        ctx.moveTo(cx - 24, cy - 7);
        ctx.lineTo(cx, cy - 22);
        ctx.lineTo(cx + 24, cy - 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Architrave beam
        ctx.fillRect(cx - 26, cy - 5, 52, 4);

        // 4 Columns
        const colW = 5;
        const colH = 20;
        const colTop = cy - 1;
        ctx.fillRect(cx - 22, colTop, colW, colH);
        ctx.fillRect(cx - 9, colTop, colW, colH);
        ctx.fillRect(cx + 4, colTop, colW, colH);
        ctx.fillRect(cx + 17, colTop, colW, colH);

        // Base pedestal steps
        ctx.fillRect(cx - 28, cy + 19, 56, 4);
        ctx.fillRect(cx - 31, cy + 23, 62, 4);
        ctx.restore();
      }
      currentY += orgImgSize + 14;

      if (businessName) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(businessName.toUpperCase(), width / 2, currentY);
        currentY += 26;

        ctx.font = '600 12.5px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#94a3b8';
        const subtitleText = isAlert
          ? (bn ? 'পাবলিক ভোক্তা রিপোর্টের নিবন্ধিত প্রতিষ্ঠান' : 'REGISTERED SUBJECT OF PUBLIC CONSUMER REPORT')
          : (bn ? 'যাচাইকৃত নাগরিক ডিরেক্টরি তালিকাভুক্ত প্রতিষ্ঠান' : 'VERIFIED CITIZEN DIRECTORY LISTING');
        ctx.fillText(subtitleText, width / 2, currentY);
        currentY += 22;
      }

      // 5. Badges: Pills Row (Alert / Rating / Case Code / Amount / Status / Category)
      const pills: { label: string; bg: string; color: string; border?: string }[] = [];
      if (isAlert) {
        pills.push({ label: bn ? '🚨 প্রতারণা সতর্কতা' : '🚨 SCAM ALERT', bg: '#dc2626', color: '#ffffff' });
        if (caseCode) pills.push({ label: `#${caseCode}`, bg: '#1e293b', border: '#475569', color: '#93c5fd' });
        if (amount) {
          const isUndisclosed = String(amount).toLowerCase().includes('not publicly') || String(amount).toLowerCase().includes('undisclosed');
          const amtLabel = isUndisclosed
            ? (bn ? 'পরিমাণ অপ্রকাশিত' : 'Not disclosed')
            : String(amount).startsWith('৳') ? String(amount) : `৳ ${amount}`;
          pills.push({ label: amtLabel, bg: '#7f1d1d', border: '#b91c1c', color: '#fecaca' });
        }
        if (status) {
          const statText = translateStatus(status, lang);
          pills.push({ label: statText.toUpperCase(), bg: '#14532d', border: '#15803d', color: '#bbf7d0' });
        }
      } else {
        if (rating) pills.push({ label: `★ ${rating.toFixed(1)} / 5.0`, bg: '#78350f', border: '#b45309', color: '#fde68a' });
        if (category) {
          const catText = translateCategory(category, lang);
          pills.push({ label: catText.toUpperCase(), bg: '#1e293b', border: '#334155', color: '#e2e8f0' });
        }
      }

      const pillHeight = 36;
      const pillGap = 10;
      const pillPadX = 14;
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      let totalPillsWidth = 0;
      const pillMetrics = pills.map((p) => {
        const textW = ctx.measureText(p.label).width;
        const w = textW + pillPadX * 2;
        totalPillsWidth += w;
        return { ...p, width: w };
      });
      totalPillsWidth += Math.max(0, pills.length - 1) * pillGap;

      let curPillX = (width - totalPillsWidth) / 2;
      for (const p of pillMetrics) {
        ctx.fillStyle = p.bg;
        ctx.beginPath();
        ctx.roundRect(curPillX, currentY, p.width, pillHeight, 18);
        ctx.fill();
        if (p.border) {
          ctx.strokeStyle = p.border;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.fillText(p.label, curPillX + p.width / 2, currentY + 23);
        curPillX += p.width + pillGap;
      }
      currentY += pillHeight + (cardFormat === 'story' ? 24 : 16);

      // Wrap text helper
      const wrapText = (text: string, maxWidth: number) => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const w = ctx.measureText(currentLine + ' ' + word).width;
          if (w < maxWidth) {
            currentLine += ' ' + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      // 6. Central Card Box: Dynamic Content Sizing & Editorial Layout
      const isStory = cardFormat === 'story';
      const boxMargin = isStory ? 64 : 54;
      const boxWidth = width - boxMargin * 2;
      const boxInnerPad = isStory ? 32 : 24;
      const contentInnerW = boxWidth - boxInnerPad * 2;

      // Render Title (localized if case concerning)
      let displayTitle = title;
      if (bn && title.startsWith('Case concerning') && businessName) {
        displayTitle = `${businessName} সংক্রান্ত কেস`;
      }

      ctx.font = 'bold 32px Georgia, serif';
      const titleLines = wrapText(displayTitle, contentInnerW - 20).slice(0, 3);
      const titleBlockHeight = titleLines.length * 42 + 24; // text + separator

      const hasMedia = !!(mediaImg && mediaImg.width > 0);
      const mediaH = hasMedia ? (isStory ? 400 : 220) : 0;
      const mediaBlockHeight = hasMedia ? mediaH + 26 : 0;

      const cleanDesc = (description || '').replace(/\s+/g, ' ').trim();
      const descFontSize = isStory 
        ? (cleanDesc.length > 550 ? 21 : cleanDesc.length > 300 ? 23 : 25)
        : (cleanDesc.length > 300 ? 17 : 19);
      const descLineHeight = descFontSize + (isStory ? 14 : 9);

      ctx.font = `${descFontSize}px Georgia, serif`;
      const quoteBarPadLeft = 26;
      const descContentW = contentInnerW - quoteBarPadLeft - 10;
      const maxDescLines = isStory ? (hasMedia ? 13 : 20) : (hasMedia ? 4 : 7);
      const descLines = wrapText(cleanDesc, descContentW).slice(0, maxDescLines);
      const descTotalTextH = descLines.length * descLineHeight;
      const statementHeaderH = 34; // header kicker "CITIZEN STATEMENT · নাগরিক বিবরণ"
      const descBlockHeight = statementHeaderH + descTotalTextH + 24;
      const tagBlockHeight = 44;

      // Calculate dynamic card height to fit content without large empty void
      const totalContentH = boxInnerPad * 2 + titleBlockHeight + mediaBlockHeight + descBlockHeight + tagBlockHeight;
      const footerY = height - (isStory ? 95 : 48);
      const maxAvailableBoxH = footerY - currentY - (isStory ? 55 : 25);
      const boxHeight = Math.min(maxAvailableBoxH, Math.max(totalContentH, isStory ? 500 : 360));

      // Balance vertical space nicely between badges and footer
      const remainingSpace = maxAvailableBoxH - boxHeight;
      const boxY = currentY + (isStory ? Math.min(30, Math.floor(remainingSpace * 0.35)) : 10);

      // Box Glassmorphism
      ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
      ctx.beginPath();
      ctx.roundRect(boxMargin, boxY, boxWidth, boxHeight, 22);
      ctx.fill();
      ctx.strokeStyle = isAlert ? 'rgba(239, 68, 68, 0.38)' : 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Draw Title
      ctx.font = 'bold 32px Georgia, serif';
      let lineY = boxY + boxInnerPad + 20;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      for (const tLine of titleLines) {
        ctx.fillText(tLine, width / 2, lineY);
        lineY += 42;
      }

      // Separator Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(boxMargin + 36, lineY + 4);
      ctx.lineTo(width - boxMargin - 36, lineY + 4);
      ctx.stroke();
      lineY += 24;

      // Media Image Rendering if present
      if (hasMedia && mediaImg) {
        const mediaW = contentInnerW;
        const mediaX = width / 2 - mediaW / 2;
        const mediaY = lineY;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(mediaX, mediaY, mediaW, mediaH, 14);
        ctx.clip();

        // Calculate aspect cover
        const imgRatio = mediaImg.width / mediaImg.height;
        const boxRatio = mediaW / mediaH;
        let renderW = mediaW;
        let renderH = mediaH;
        let offX = 0;
        let offY = 0;
        if (imgRatio > boxRatio) {
          renderW = mediaH * imgRatio;
          offX = (mediaW - renderW) / 2;
        } else {
          renderH = mediaW / imgRatio;
          offY = (mediaH - renderH) / 2;
        }
        ctx.drawImage(mediaImg, mediaX + offX, mediaY + offY, renderW, renderH);
        ctx.restore();

        // Border around media photo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(mediaX, mediaY, mediaW, mediaH, 14);
        ctx.stroke();

        // Badge on photo
        const photoBadgeText = bn ? '📷 প্রমাণ ও রেকর্ড ছবি' : '📷 EVIDENCE / RECORD PHOTO';
        ctx.font = '600 12px system-ui, sans-serif';
        const badgeW = ctx.measureText(photoBadgeText).width + 24;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(mediaX + 14, mediaY + mediaH - 36, badgeW, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'left';
        ctx.fillText(photoBadgeText, mediaX + 26, mediaY + mediaH - 20);

        lineY += mediaH + 26;
      }

      // Render Description / Citizen Statement with Editorial Accent Bar
      let textTopY = lineY;

      // 1. Kicker above the narrative
      ctx.font = '700 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = isAlert ? '#f87171' : '#38bdf8';
      ctx.textAlign = 'left';
      const statementKicker = isAlert
        ? (bn ? 'নাগরিক বিবৃতি ও ঘটনার বিবরণ' : 'VERIFIED CITIZEN REPORT & INCIDENT SUMMARY')
        : (bn ? 'নাগরিক অভিজ্ঞতা ও কমিউনিটি মতামত' : 'COMMUNITY CITIZEN EXPERIENCE');
      ctx.fillText(statementKicker, boxMargin + boxInnerPad + quoteBarPadLeft, textTopY + 10);
      textTopY += 28;

      // 2. Vertical accent quote bar along the left of the text
      const quoteBarX = boxMargin + boxInnerPad + 6;
      const quoteBarStartY = textTopY - 10;
      const quoteBarEndY = textTopY + descTotalTextH - 4;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(quoteBarX, quoteBarStartY, 4, Math.max(20, quoteBarEndY - quoteBarStartY), 2);
      ctx.fillStyle = isAlert ? '#ef4444' : '#38bdf8';
      ctx.fill();
      ctx.restore();

      // 3. Render Narrative lines in high-contrast readable font
      ctx.font = `${descFontSize}px Georgia, serif`;
      ctx.fillStyle = '#f1f5f9';
      ctx.textAlign = 'left';
      let currentDescY = textTopY + descFontSize * 0.78;
      for (const dLine of descLines) {
        ctx.fillText(dLine, boxMargin + boxInnerPad + quoteBarPadLeft, currentDescY);
        currentDescY += descLineHeight;
      }
      lineY = currentDescY + 16;

      // Author / Verification Tag placed right inside the bottom of the card box
      const tagY = Math.min(boxY + boxHeight - 24, lineY + 16);
      ctx.textAlign = 'center';
      if (author) {
        ctx.font = '600 19px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(bn ? `— রিপোর্টার: ${author}` : `— Attributed: ${author}`, width / 2, tagY);
      } else if (isAlert) {
        ctx.font = '600 18px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#f87171';
        ctx.fillText(bn ? '✓ TruthHubBD-এ যাচাইকৃত নাগরিক সতর্কতা' : '✓ Verified Citizen Alert on TruthHubBD', width / 2, tagY);
      }

      // 7. Footer: Brand seal and link anchored at bottom of canvas
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 23px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        bn ? '🔗  truthhub.bd  ·  অনলাইনে সম্পূর্ণ নাগরিক প্রমাণ দেখুন' : '🔗  truthhub.bd  ·  Read Full Citizen Evidence Online',
        width / 2,
        footerY
      );

      ctx.fillStyle = '#64748b';
      ctx.font = '500 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        bn ? 'স্বতন্ত্র বাংলাদেশ নাগরিক যাচাইকরণ প্ল্যাটফর্ম · উন্মুক্ত পাবলিক রেকর্ড' : 'Independent Bangladesh Citizen Verification Layer · Public Record',
        width / 2,
        footerY + 28
      );

      // Save blob for download / copy
      canvas.toBlob((blob) => {
        if (!cancelled) setCardBlob(blob);
      }, 'image/png');
    });

    return () => {
      cancelled = true;
    };
  }, [modalOpen, activeTab, cardFormat, title, description, rating, author, businessName, isAlert, caseCode, organizationImage, mediaImage, amount, status, category]);

  const downloadCardImage = () => {
    if (!cardBlob) return;
    const blobUrl = URL.createObjectURL(cardBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `truthhub-${isAlert ? 'alert' : 'review'}-${cardFormat}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  const copyCardImage = async () => {
    if (!cardBlob) return;
    try {
      if (typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': cardBlob })]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        alert(bn ? 'আপনার ব্রাউজার সরাসরি ইমেজ কপি সাপোর্ট করে না। অনুগ্রহ করে ইমেজটি ডাউনলোড করুন।' : 'Browser does not support direct image copying. Please download the image.');
      }
    } catch {
      alert(bn ? 'ইমেজ কপি করা যায়নি। ডাউনলোড বাটন ব্যবহার করুন।' : 'Could not copy image. Please use Download.');
    }
  };

  const shareViaApps = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        if (cardBlob && navigator.canShare && navigator.canShare({ files: [new File([cardBlob], 'card.png', { type: 'image/png' })] })) {
          const file = new File([cardBlob], 'card.png', { type: 'image/png' });
          await navigator.share({
            title,
            text: shareText,
            url: fullUrl,
            files: [file],
          });
          return;
        }
        await navigator.share({ title, text: shareText, url: fullUrl });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      copyLink();
    }
  };

  const nativeShareLink = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: fullUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      copyLink();
    }
  };

  return (
    <>
      {/* Trigger Button: Only a clean Share button, NO separate story card button beside it */}
      {compact ? (
        <button
          type="button"
          onClick={() => { setModalOpen(true); setActiveTab('link'); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 8,
            border: '1px solid #d8cdb7',
            background: '#faf6eb',
            color: '#596273',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          aria-label={t('Share', 'শেয়ার')}
        >
          <Share2 size={14} />
          {t('Share', 'শেয়ার')}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => { setModalOpen(true); setActiveTab('link'); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #d8cdb7',
            background: '#faf6eb',
            color: '#1e293b',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Share2 size={15} color="#059669" />
          {t('Share', 'শেয়ার করুন')}
        </button>
      )}

      {/* Unified Share Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 18,
              maxWidth: 580,
              width: '100%',
              padding: '24px 26px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Share2 size={18} color="#059669" />
                  {bn ? 'শেয়ার অপশন' : 'Share Options'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  {bn ? 'ওয়েব লিঙ্ক অথবা দৃষ্টিনন্দন ভিজ্যুয়াল কার্ড হিসেবে শেয়ার করুন।' : 'Share as a web link or create an aesthetic visual story card.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Segmented Tab Navigation: Link vs Visual Card */}
            <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
              <button
                type="button"
                onClick={() => setActiveTab('link')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: activeTab === 'link' ? '#ffffff' : 'transparent',
                  color: activeTab === 'link' ? '#0f172a' : '#64748b',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'link' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <LinkIcon size={15} color={activeTab === 'link' ? '#059669' : '#64748b'} />
                {bn ? 'লিঙ্ক ও সোশ্যাল মিডিয়া' : 'Link & Social Apps'}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('card')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: activeTab === 'card' ? '#ffffff' : 'transparent',
                  color: activeTab === 'card' ? '#0f172a' : '#64748b',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'card' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sparkles size={15} color={activeTab === 'card' ? '#4f46e5' : '#64748b'} />
                {bn ? 'ভিজ্যুয়াল স্টোরি ও পোস্ট কার্ড' : 'Visual Story & Post Card'}
              </button>
            </div>

            {/* TAB 1: Link & Social Share */}
            {activeTab === 'link' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* URL Copy Bar */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {bn ? 'সরাসরি লিঙ্ক' : 'Direct Link'}
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      padding: '6px 8px 6px 14px',
                      gap: 8,
                    }}
                  >
                    <input
                      type="text"
                      readOnly
                      value={fullUrl}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: '#334155',
                        fontSize: 13,
                        outline: 'none',
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    />
                    <button
                      type="button"
                      onClick={copyLink}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: copied ? '#059669' : '#0f172a',
                        color: '#ffffff',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? (bn ? 'কপি হয়েছে!' : 'Copied!') : (bn ? 'কপি লিঙ্ক' : 'Copy Link')}
                    </button>
                  </div>
                </div>

                {/* Social Share Buttons */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {bn ? 'সামাজিক যোগাযোগ মাধ্যমে শেয়ার' : 'Share Directly to Apps'}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: 10 }}>
                    {SHARE_TARGETS.map(target => {
                      const Icon = target.icon;
                      return (
                        <a
                          key={target.label}
                          href={target.href(fullUrl, shareText)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: '11px 12px',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            color: '#1e293b',
                            textDecoration: 'none',
                            fontSize: 13,
                            fontWeight: 700,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Icon size={17} color={target.color} />
                          <span>{bn ? target.labelBn : target.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* Native App Share Button */}
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    type="button"
                    onClick={nativeShareLink}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '11px 16px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Share2 size={16} color="#059669" />
                    {bn ? 'অন্যান্য ডিভাইসের অ্যাপে পাঠান' : 'Share via Device Share Sheet…'}
                  </button>
                )}
              </div>
            )}

            {/* TAB 2: Visual Story & Post Card */}
            {activeTab === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Format Picker */}
                <div style={{ display: 'flex', gap: 8, background: '#f8fafc', padding: 4, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => setCardFormat('story')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      borderRadius: 7,
                      border: 'none',
                      background: cardFormat === 'story' ? '#0f172a' : 'transparent',
                      color: cardFormat === 'story' ? '#ffffff' : '#64748b',
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <Smartphone size={14} />
                    {bn ? 'স্টোরি ফরম্যাট (৯:১৬)' : 'Story Card (9:16)'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCardFormat('post')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      borderRadius: 7,
                      border: 'none',
                      background: cardFormat === 'post' ? '#0f172a' : 'transparent',
                      color: cardFormat === 'post' ? '#ffffff' : '#64748b',
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    <ImageIcon size={14} />
                    {bn ? 'স্কয়ার পোস্ট (১:১)' : 'Square Post (1:1)'}
                  </button>
                </div>

                {/* Live Canvas Preview */}
                <div style={{
                  background: '#090d16',
                  borderRadius: 14,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  minHeight: 280,
                  maxHeight: 380,
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
                }}>
                  <canvas
                    ref={canvasRef}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 340,
                      borderRadius: 8,
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      display: 'block',
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={downloadCardImage}
                    style={{
                      flex: '1 1 170px',
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '11px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={15} />
                    {bn ? 'কার্ড ডাউনলোড (PNG)' : 'Download PNG'}
                  </button>

                  <button
                    type="button"
                    onClick={copyCardImage}
                    style={{
                      flex: '1 1 150px',
                      background: copiedImage ? '#d1fae5' : '#f1f5f9',
                      color: copiedImage ? '#065f46' : '#0f172a',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      padding: '11px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    {copiedImage ? <Check size={15} /> : <Copy size={15} />}
                    {copiedImage ? (bn ? 'ইমেজ কপি হয়েছে!' : 'Image Copied!') : (bn ? 'ইমেজ কপি করুন' : 'Copy Image')}
                  </button>

                  <button
                    type="button"
                    onClick={shareViaApps}
                    style={{
                      flex: '1 1 150px',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '11px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={15} />
                    {bn ? 'অ্যাপে কার্ড শেয়ার' : 'Share Card to Apps'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
