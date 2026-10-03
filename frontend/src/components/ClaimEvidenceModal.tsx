"use client";
import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Download, AlertTriangle, Loader2, FileText, Image as ImageIcon, Shield } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';

export interface ClaimEvidenceModalProps {
  isOpen: boolean;
  claimId: number;
  kind: 'proof' | 'photo';
  businessName: string;
  representativeName?: string;
  roleTitle?: string;
  contactInfo?: string;
  onClose: () => void;
}

export function ClaimEvidenceModal({
  isOpen,
  claimId,
  kind,
  businessName,
  representativeName,
  roleTitle,
  contactInfo,
  onClose,
}: ClaimEvidenceModalProps) {
  const { t, lang } = useI18n();
  const bn = lang === 'bn';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');

  const isPhoto = kind === 'photo';
  const title = isPhoto
    ? t('Physical Storefront / Office Photo', 'প্রতিষ্ঠানের দোকান বা অফিসের ছবি')
    : t('Official Authority Proof / Trade License', 'অফিসিয়াল প্রতিনিধির প্রমাণপত্র / ট্রেড লাইসেন্স');

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    let createdUrl: string | null = null;

    setLoading(true);
    setError(null);
    setBlobUrl(null);

    const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
    const token = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)?.[1];

    fetch(`${base}/api/admin/claim-evidence/${claimId}?kind=${kind}`, {
      credentials: 'include',
      headers: {
        Accept: '*/*',
        ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}),
      },
    })
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(bn ? 'ফাইলটি সিস্টেমে পাওয়া যায়নি বা ফাইল পাথ মুছে গেছে।' : 'The evidence file could not be found in secure storage.');
          } else if (res.status === 403) {
            throw new Error(bn ? 'অনুমতি নেই। শুধুমাত্র অ্যাডমিন ও মডারেটর এই প্রমাণ দেখতে পারেন।' : 'Access denied. Only administrators and moderators may view private claim documents.');
          } else {
            throw new Error(bn ? `নথি লোড করা সম্ভব হয়নি (স্ট্যাটাস: ${res.status})` : `Failed to load evidence file (Status ${res.status})`);
          }
        }

        const type = res.headers.get('content-type') || '';
        const blob = await res.blob();
        if (!active) return;

        createdUrl = URL.createObjectURL(blob);
        setMimeType(type || blob.type);
        setBlobUrl(createdUrl);
        setLoading(false);
      })
      .catch((err: any) => {
        if (!active) return;
        setLoading(false);
        setError(err?.message || (bn ? 'নথি প্রদর্শন করা সম্ভব হয়নি।' : 'Failed to display document.'));
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, claimId, kind, bn]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 12,
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: isPhoto ? '#e0f2fe' : '#ccfbf1',
                color: isPhoto ? '#0284c7' : '#0f766e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isPhoto ? <ImageIcon size={20} /> : <FileText size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  {title}
                </h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: '#fef3c7',
                    color: '#92400e',
                  }}
                >
                  <Shield size={12} /> {t('Staff Eyes Only', 'শুধুমাত্র স্টাফদের জন্য')}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>
                <strong>{businessName}</strong>
                {representativeName && (
                  <span>
                    {' '}• {t('Claimant:', 'আবেদনকারী:')} {representativeName} {roleTitle ? `(${roleTitle})` : ''}
                  </span>
                )}
                {contactInfo && <span> • {contactInfo}</span>}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {blobUrl && (
              <>
                <a
                  href={blobUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <ExternalLink size={13} />
                  <span>{t('Open New Tab', 'নতুন ট্যাবে খুলুন')}</span>
                </a>
                <a
                  href={blobUrl}
                  download={`claim-${claimId}-${kind}.${mimeType.includes('pdf') ? 'pdf' : 'jpg'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #0f766e',
                    background: '#0f766e',
                    color: '#ffffff',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={13} />
                  <span>{t('Download', 'ডাউনলোড')}</span>
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 6,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={t('Close (Esc)', 'বন্ধ করুন (Esc)')}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            background: '#0f172a08',
          }}
        >
          {loading && (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
              <Loader2 size={36} className="spin" style={{ margin: '0 auto 12px', color: '#0f766e' }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                {t('Securing connection and loading document…', 'নিরাপদ সংযোগ স্থাপন ও নথি লোড করা হচ্ছে…')}
              </p>
              <small style={{ color: '#94a3b8', fontSize: 12 }}>
                {t('Verifying administrative authorization', 'প্রশাসনিক অনুমতি যাচাই করা হচ্ছে')}
              </small>
            </div>
          )}

          {error && (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 24px',
                background: '#fef2f2',
                borderRadius: 10,
                border: '1px solid #fee2e2',
                maxWidth: 480,
              }}
            >
              <AlertTriangle size={36} color="#dc2626" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#991b1b' }}>
                {t('Could not load file', 'নথি প্রদর্শন করা সম্ভব হয়নি')}
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#b91c1c' }}>{error}</p>
            </div>
          )}

          {!loading && !error && blobUrl && (
            mimeType.includes('pdf') ? (
              <iframe
                src={blobUrl}
                title={title}
                style={{
                  width: '100%',
                  height: '72vh',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: '#ffffff',
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', width: '100%' }}>
                <img
                  src={blobUrl}
                  alt={title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '74vh',
                    objectFit: 'contain',
                    borderRadius: 8,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    background: '#fff',
                  }}
                />
              </div>
            )
          )}
        </div>

        {/* Footer Note */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: '#64748b',
          }}
        >
          <span>
            {t(
              '⚠️ This document contains confidential organization & citizen verification data.',
              '⚠️ এই নথিতে গোপনীয় ব্যবসায়িক ও নাগরিক সত্যতা যাচাইকরণ তথ্য রয়েছে।'
            )}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '4px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            {t('Close', 'বন্ধ করুন')}
          </button>
        </div>
      </div>
    </div>
  );
}
