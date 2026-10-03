"use client";
import React, { useState, useRef } from 'react';
import { api, resolveMediaUrl } from '../services/api';
import { useI18n } from '../i18n/LanguageContext';
import { formatNumber, localizedError } from '../i18n/dictionary';
import { PublicVideoField } from './PublicVideoLinks';
import { parsePublicVideoUrls } from '../lib/publicVideoUrls';
import { ImagePlus, Trash2, X } from 'lucide-react';

export function ReviewEditor({
  review,
  onSaved
}: {
  review: {
    id: number;
    title: string;
    body: string;
    rating: number;
    public_video_urls?: string[];
    imagePath?: string;
    images?: string[];
  };
  onSaved: () => void;
}) {
  const { lang, t } = useI18n();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [videoUrls, setVideoUrls] = useState((review.public_video_urls || []).join('\n'));
  const [videoConsent, setVideoConsent] = useState(Boolean(review.public_video_urls?.length));
  
  const existingImg = review.images?.[0] || review.imagePath;
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage(t('Attachment size must not exceed 5 MB.', 'ফাইলের আকার সর্বোচ্চ ৫ এমবি হতে পারবে।'));
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const removeNewFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const links = parsePublicVideoUrls(videoUrls);
    if (links.error) {
      setMessage(t('Use up to 3 supported public HTTPS video links.', 'সর্বোচ্চ ৩টি সমর্থিত পাবলিক HTTPS ভিডিও লিংক দিন।'));
      return;
    }
    if (links.urls.length && !videoConsent) {
      setMessage(t('Please confirm permission to display the video links.', 'ভিডিও লিংক দেখানোর অনুমতি নিশ্চিত করুন।'));
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setBusy(true);

    try {
      formData.append('_method', 'PATCH');
      links.urls.forEach((u, i) => formData.append(`public_video_urls[${i}]`, u));
      formData.append('public_video_consent', videoConsent ? '1' : '0');

      if (removeExistingImage && !selectedFile) {
        formData.append('remove_image', '1');
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await api(`/reviews/${review.id}`, 'POST', formData);
      setMessage(t('Saved. Linked allegations return to moderation; edit history is retained.', 'সংরক্ষিত হয়েছে। সংশ্লিষ্ট অভিযোগ আবার পর্যালোচনায় যায়; সম্পাদনার ইতিহাস রাখা হয়।'));
      onSaved();
    } catch (error) {
      setMessage(localizedError((error as Error).message, lang));
    } finally {
      setBusy(false);
    }
  }

  async function deleteThisReview() {
    const confirmText = lang === 'bn'
      ? 'আপনি কি নিশ্চিতভাবে এই রিভিউটি চিরতরে মুছে ফেলতে চান?'
      : 'Are you sure you want to permanently delete your review?';
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    try {
      await api(`/reviews/${review.id}`, 'DELETE');
      window.location.href = '/activity';
    } catch (err) {
      setMessage(localizedError((err as Error).message, lang));
      setBusy(false);
    }
  }

  return (
    <details className="workspace-card" style={{ border: '1px solid #d8cdb7' }}>
      <summary style={{ fontWeight: 700, cursor: 'pointer' }}>
        {t('Edit your review (Available within 3 hours)', 'আপনার রিভিউ সম্পাদনা করুন (৩ ঘণ্টার মধ্যে প্রযোজ্য)')}
      </summary>
      <div style={{ margin: '8px 0 14px', padding: '8px 12px', background: '#fdfbf7', border: '1px solid #eae0ce', borderRadius: 6, fontSize: '12.5px', color: 'var(--slate-600)' }}>
        🕒 {t('Note: Reviews can only be edited within 3 hours of submission. Once 3 hours elapse, the content becomes permanent for community trust.', 'বিশেষ দ্রষ্টব্য: জমা দেওয়ার ৩ ঘণ্টার মধ্যেই কেবল রিভিউ পরিবর্তন করা সম্ভব। এরপর এটি স্থায়ীভাবে সংরক্ষিত থাকবে।')}
      </div>
      <form className="review-form-content" onSubmit={save}>
        {message && (
          <p role="status" style={{ color: message.includes('error') || message.includes('Failed') ? '#dc2626' : '#059669', fontWeight: 600 }}>
            {message}
          </p>
        )}

        <label>
          {t('Title', 'শিরোনাম')}
          <input className="review-input" name="title" defaultValue={review.title} required maxLength={255} disabled={busy} />
        </label>

        <label>
          {t('Rating', 'রেটিং')}
          <select className="review-input" name="rating" defaultValue={review.rating} disabled={busy}>
            {[1, 2, 3, 4, 5].map(r => (
              <option key={r} value={r}>
                {formatNumber(r, lang)}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t('Experience', 'অভিজ্ঞতা')}
          <textarea className="review-textarea" name="body" defaultValue={review.body} required maxLength={5000} disabled={busy} />
        </label>

        {/* Image Attachment & Edit Section */}
        <div style={{ marginTop: 14, marginBottom: 14, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: 8 }}>
            <ImagePlus size={16} />
            <span>{t('Review Image / Evidence Attachment', 'রিভিউ ছবি / প্রমাণ সংযুক্তি')}</span>
          </div>

          {/* Existing Image Display */}
          {existingImg && !removeExistingImage && !selectedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, padding: 8, background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
              <img
                src={resolveMediaUrl(existingImg)}
                alt="Current attachment"
                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block' }}>
                  {t('Current attached image', 'বর্তমানে সংযুক্ত ছবি')}
                </span>
                <button
                  type="button"
                  onClick={() => setRemoveExistingImage(true)}
                  style={{ marginTop: 4, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Trash2 size={12} /> {t('Remove this image', 'ছবিটি সরান')}
                </button>
              </div>
            </div>
          )}

          {removeExistingImage && !selectedFile && (
            <div style={{ padding: '6px 10px', background: '#fef2f2', color: '#b91c1c', borderRadius: 6, fontSize: 12, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{t('Current image will be removed on saving.', 'সংরক্ষণ করলে বর্তমান ছবিটি মুছে যাবে।')}</span>
              <button
                type="button"
                onClick={() => setRemoveExistingImage(false)}
                style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}
              >
                {t('Undo', 'বাতিল')}
              </button>
            </div>
          )}

          {/* New Selected File Preview */}
          {selectedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: 8, background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac' }}>
              {filePreview ? (
                <img src={filePreview} alt="New attachment" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
              ) : (
                <div style={{ width: 60, height: 60, background: '#e2e8f0', borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>
                  PDF/FILE
                </div>
              )}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#166534', display: 'block' }}>
                  {selectedFile.name}
                </span>
                <span style={{ fontSize: 11, color: '#15803d' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB — {t('Ready to upload', 'আপলোডের জন্য প্রস্তুত')}
                </span>
              </div>
              <button
                type="button"
                onClick={removeNewFile}
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '50%', width: 26, height: 26, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                title="Remove"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            disabled={busy}
            style={{ fontSize: 12, width: '100%' }}
          />
          <small style={{ display: 'block', marginTop: 4, color: '#64748b', fontSize: 11 }}>
            {t('Optional: Upload a new receipt or photo (JPG, PNG, WebP, PDF up to 5 MB)', 'ঐচ্ছিক: নতুন রসিদ বা ছবি আপলোড করুন (JPG, PNG, WebP, PDF সর্বোচ্চ ৫ এমবি)')}
          </small>
        </div>

        <PublicVideoField value={videoUrls} onChange={setVideoUrls} consent={videoConsent} onConsent={setVideoConsent} disabled={busy} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 10 }}>
          <button disabled={busy} className="btn-teal-pill">
            {busy ? t('Saving…', 'সংরক্ষণ হচ্ছে…') : t('Save changes', 'পরিবর্তন সংরক্ষণ করুন')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={deleteThisReview}
            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 9999, padding: '7px 16px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
          >
            🗑️ {t('Delete My Review', 'আমার রিভিউ ডিলিট করুন')}
          </button>
        </div>
      </form>
    </details>
  );
}
