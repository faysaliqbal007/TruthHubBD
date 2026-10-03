"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Search,
  X,
  ChevronRight,
  AlertTriangle,
  MessageSquare,
  Star,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { districts } from '../data/bd-locations';
import { useI18n } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/dictionary';

export type OmniKind = 'business' | 'case' | 'review' | 'comment';

type OmniItem = {
  id: string;
  kind: OmniKind;
  title: string;
  bengali_title?: string;
  subtitle: string;
  url: string;
  image?: string;
  verified?: boolean;
};

type Result = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  kind: OmniKind | 'location' | 'action' | 'review-action';
  image?: string;
  verified?: boolean;
};

type CategoryTab = 'all' | 'business' | 'case' | 'review' | 'comment';

export function GlobalQuickSearch({
  isOpen,
  onClose,
  initialQuery = '',
}: {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}) {
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const { lang, t } = useI18n();

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [items, setItems] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(0);

  // Suggested keywords to try
  const popularKeywords = [
    { en: 'Daraz', bn: 'দারাজ' },
    { en: 'Apex', bn: 'এপেক্স' },
    { en: 'Hospital', bn: 'হাসপাতাল' },
    { en: 'Courier', bn: 'কুরিয়ার' },
    { en: 'Refund', bn: 'রিফান্ড' },
    { en: 'Phishing', bn: 'প্রতারণা' },
  ];

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setQuery(initialQuery);
    setSelected(0);
    setActiveTab('all');
    setTimeout(() => input.current?.focus(), 50);

    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const q = query.trim();

    if (q.length < 2) {
      setItems([]);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const timer = setTimeout(async () => {
      try {
        const typeParam = activeTab !== 'all' ? `&type=${activeTab}` : '';
        const res = await api<{ success: boolean; data: OmniItem[] }>(
          `/search/omni?q=${encodeURIComponent(q)}${typeParam}`
        );
        if (!active) return;
        const found: Result[] = (res?.data || []).map((item) => ({
          id: item.id,
          title: lang === 'bn' && item.bengali_title ? item.bengali_title : item.title,
          subtitle: item.subtitle,
          url: item.url,
          kind: item.kind,
          image: item.image,
          verified: item.verified,
        }));
        setItems(found);
      } catch (err) {
        if (active) setError(t('Search is currently unavailable.', 'খোঁজা সাময়িকভাবে বন্ধ আছে।'));
      } finally {
        if (active) setLoading(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, activeTab, isOpen, lang, t]);

  if (!isOpen) return null;

  const q = query.trim();

  // District / Location matches (only when in 'all' or 'business' view)
  const locations: Result[] =
    ['all', 'business'].includes(activeTab) && q.length >= 2
      ? districts
          .filter(
            (d) =>
              d.name.toLowerCase().includes(q.toLowerCase()) || d.nameBn.includes(q)
          )
          .slice(0, 2)
          .map((d) => ({
            id: 'd_' + d.id,
            title: lang === 'bn' ? `${d.nameBn} · ${d.name}` : `${d.name} · ${d.nameBn}`,
            subtitle: t('District · browse organizations in this area', 'জেলা · এলাকার প্রতিষ্ঠানসমূহ দেখুন'),
            url: `/search?${new URLSearchParams({ location: d.name, view: 'businesses' })}`,
            kind: 'location' as const,
          }))
      : [];

  // Deep fallback navigation actions based on user query
  const actions: Result[] = q && q.length >= 2
    ? [
        ...(activeTab === 'all' || activeTab === 'business'
          ? [
              {
                id: 'action_directory',
                title: t(`Search directory for “${q}”`, `“${q}” দিয়ে ডিরেক্টরি খুঁজুন`),
                subtitle: t('Full organization and business database', 'প্রতিষ্ঠান ও সেবার সার্বিক তালিকা'),
                url: `/search?${new URLSearchParams({ q, view: 'businesses' })}`,
                kind: 'action' as const,
              },
            ]
          : []),
        ...(activeTab === 'all' || activeTab === 'case'
          ? [
              {
                id: 'action_alerts',
                title: t(`Search scam alerts for “${q}”`, `“${q}” দিয়ে স্ক্যাম অ্যালার্ট খুঁজুন`),
                subtitle: t('Public verified warnings and unresolved reports', 'প্রকাশ্য সত্যতা ও অভিযোগসমূহ'),
                url: `/scam-alerts?${new URLSearchParams({ q })}`,
                kind: 'action' as const,
              },
            ]
          : []),
        ...(activeTab === 'all' || activeTab === 'review' || activeTab === 'comment'
          ? [
              {
                id: 'action_reviews',
                title: t(`Search community reviews for “${q}”`, `“${q}” দিয়ে মানুষের অভিজ্ঞতা খুঁজুন`),
                subtitle: t('Citizen experiences and discussions', 'নাগরিক অভিজ্ঞতা ও আলোচনা'),
                url: `/search?${new URLSearchParams({ q, view: 'reviews' })}`,
                kind: 'review-action' as const,
              },
            ]
          : []),
      ]
    : [];

  const results: Result[] = [...items, ...locations, ...actions];

  const choose = (item: Result) => {
    onClose();
    navigate(item.url);
  };

  const tabs: { id: CategoryTab; labelEn: string; labelBn: string; Icon: any }[] = [
    { id: 'all', labelEn: 'All', labelBn: 'সবকিছু', Icon: Sparkles },
    { id: 'business', labelEn: 'Organizations', labelBn: 'প্রতিষ্ঠান', Icon: Building2 },
    { id: 'case', labelEn: 'Scam Alerts', labelBn: 'স্ক্যাম অ্যালার্ট', Icon: AlertTriangle },
    { id: 'review', labelEn: 'Reviews', labelBn: 'রিভিউ', Icon: Star },
    { id: 'comment', labelEn: 'Comments', labelBn: 'মন্তব্য', Icon: MessageSquare },
  ];

  return (
    <div className="quick-search-backdrop" onClick={onClose}>
      <div
        ref={panel}
        className="quick-search-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('Search TruthHubBD', 'ট্রুথহাববিডিতে খুঁজুন')}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
          if (e.key === 'Tab') {
            const controls = panel.current?.querySelectorAll<HTMLElement>('input,button,a[href]');
            if (!controls?.length) return;
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        {/* Search Input Bar */}
        <div className="quick-search-input-wrap">
          <Search size={22} aria-hidden="true" className="quick-search-icon" />
          <input
            ref={input}
            aria-label={t('Search organizations, scam alerts, reviews or comments', 'প্রতিষ্ঠান, স্ক্যাম অ্যালার্ট, রিভিউ বা মন্তব্য খুঁজুন')}
            className="quick-search-input"
            placeholder={
              activeTab === 'business'
                ? t('Search organizations: Daraz, Bata, Square Hospital…', 'প্রতিষ্ঠান খুঁজুন: দারাজ, বাটা, স্কয়ার হাসপাতাল…')
                : activeTab === 'case'
                ? t('Search scams & alerts: Case code, seller name, scheme…', 'স্ক্যাম খুঁজুন: কেস কোড, বিক্রেতার নাম, প্রতারণার ধরন…')
                : activeTab === 'review'
                ? t('Search reviews: Delivery experience, doctors, tech…', 'রিভিউ খুঁজুন: ডেলিভারি অভিজ্ঞতা, ডাক্তার, পণ্য…')
                : activeTab === 'comment'
                ? t('Search discussion comments on reviews…', 'রিভিউতে নাগরিক আলোচনা ও মন্তব্য খুঁজুন…')
                : t('Search anything: organizations, scams, reviews, comments…', 'সবকিছু খুঁজুন: প্রতিষ্ঠান, স্ক্যাম, রিভিউ, মন্তব্য…')
            }
            value={query}
            maxLength={255}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const next = (selected + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % Math.max(1, results.length);
                setSelected(next);
                panel.current?.querySelector(`[data-result="${next}"]`)?.scrollIntoView({ block: 'nearest' });
              }
              if (e.key === 'Enter' && results.length) {
                e.preventDefault();
                choose(results[Math.min(selected, results.length - 1)]);
              }
            }}
          />
          {query ? (
            <button
              type="button"
              className="quick-search-clear-btn"
              aria-label={t('Clear search text', 'লেখা মুছুন')}
              onClick={() => {
                setQuery('');
                setItems([]);
                input.current?.focus();
              }}
            >
              <X size={18} aria-hidden="true" />
            </button>
          ) : (
            <span className="quick-search-esc-badge" onClick={onClose} title="Press Escape to close">
              ESC
            </span>
          )}
        </div>

        {/* Filter Category Tabs (Organizations, Scams, Reviews, Comments) */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 16px',
            background: 'var(--tint, #F8F5EE)',
            borderBottom: '1px solid var(--line, #E5DCB)',
            overflowX: 'auto',
            alignItems: 'center',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelected(0);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 11px',
                  borderRadius: 6,
                  border: isActive ? '1px solid var(--ink, #1F2937)' : '1px solid transparent',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? 'var(--ink, #1F2937)' : 'var(--slate-600, #475569)',
                  fontSize: 12.5,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <TabIcon
                  size={14}
                  color={
                    isActive
                      ? tab.id === 'case'
                        ? '#DC2626'
                        : tab.id === 'review'
                        ? '#D97706'
                        : tab.id === 'comment'
                        ? '#0284C7'
                        : tab.id === 'business'
                        ? '#059669'
                        : 'var(--ink)'
                      : 'currentColor'
                  }
                />
                <span>{lang === 'bn' ? tab.labelBn : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="quick-search-results-list" aria-busy={loading}>
          {loading ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--slate-500)' }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: '3px solid #E2E8F0',
                  borderTopColor: 'var(--ink)',
                  borderRadius: '50%',
                  margin: '0 auto 10px',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>
                {t('Searching organizations, scams, reviews and comments…', 'প্রতিষ্ঠান, স্ক্যাম, রিভিউ ও মন্তব্য খোঁজা হচ্ছে…')}
              </p>
            </div>
          ) : error ? (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: '#B91C1C' }}>
              <AlertTriangle size={24} style={{ margin: '0 auto 6px', display: 'block' }} />
              <p style={{ margin: 0, fontSize: 13.5 }}>{error}</p>
            </div>
          ) : q.length < 2 ? (
            /* Empty State: Quick Suggestions */
            <div style={{ padding: '24px 20px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--slate-400)', margin: '0 0 10px' }}>
                {t('Popular searches & topics', 'জনপ্রিয় অনুসন্ধান ও বিষয়সমূহ')}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {popularKeywords.map((item) => (
                  <button
                    key={item.en}
                    type="button"
                    onClick={() => {
                      const text = lang === 'bn' ? item.bn : item.en;
                      setQuery(text);
                      input.current?.focus();
                    }}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #D8CDB7',
                      borderRadius: 20,
                      padding: '5px 13px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--ink)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Search size={12} color="#64748B" />
                    <span>{lang === 'bn' ? item.bn : item.en}</span>
                  </button>
                ))}
              </div>

              <div
                style={{
                  marginTop: 20,
                  padding: 14,
                  background: '#FFFFFF',
                  borderRadius: 8,
                  border: '1px dashed #D8CDB7',
                  fontSize: 12.5,
                  color: 'var(--slate-600)',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 2 }}>
                  {t('Omni-Search Covers 4 Live Sectors:', '৪টি ক্ষেত্রে সার্বিক অনুসন্ধান:')}
                </strong>
                • <strong>{t('Organizations:', 'প্রতিষ্ঠান:')}</strong> {t('Registered companies, hospitals, stores & services.', 'নিবন্ধিত প্রতিষ্ঠান, হাসপাতাল ও দোকান।')}
                <br />
                • <strong>{t('Scam Alerts:', 'স্ক্যাম অ্যালার্ট:')}</strong> {t('Community alerts, case codes & merchant disputes.', 'নাগরিক সতর্কতা, কেস কোড ও বিরোধ।')}
                <br />
                • <strong>{t('Reviews:', 'রিভিউ:')}</strong> {t('Real verified customer experiences & star ratings.', 'যাচাইকৃত গ্রাহক অভিজ্ঞতা ও রেটিং।')}
                <br />
                • <strong>{t('Comments:', 'মন্তব্য:')}</strong> {t('Threaded discussions on public reviews.', 'পাবলিক রিভিউতে নাগরিকদের আলোচনা।')}
              </div>
            </div>
          ) : results.length === 0 ? (
            /* No Results Found */
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--slate-600)' }}>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
                {t(`No matches found for “${q}”`, `“${q}” এর জন্য কোনো ফলাফল পাওয়া যায়নি`)}
              </p>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--slate-500)' }}>
                {t('Try checking spelling or browsing our main directories below:', 'বানান যাচাই করুন অথবা নিচের ডিরেক্টরিগুলোতে খুঁজুন:')}
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/search?${new URLSearchParams({ q, view: 'businesses' })}`);
                  }}
                  style={{
                    background: '#0F766E',
                    color: '#FFFFFF',
                    border: 0,
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t('Search Businesses', 'প্রতিষ্ঠান খুঁজুন')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/scam-alerts?${new URLSearchParams({ q })}`);
                  }}
                  style={{
                    background: '#B91C1C',
                    color: '#FFFFFF',
                    border: 0,
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t('Search Scam Alerts', 'স্ক্যাম অ্যালার্ট খুঁজুন')}
                </button>
              </div>
            </div>
          ) : (
            /* Results Available */
            <>
              <div
                style={{
                  padding: '6px 16px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: 'var(--slate-500)',
                  borderBottom: '1px solid #ECE5D9',
                  background: '#FCFAF6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  {formatNumber(items.length, lang)}{' '}
                  {t('matching records found', 'টি সরাসরি মিল পাওয়া গেছে')}
                </span>
                <span style={{ fontSize: 11, fontWeight: 500 }}>
                  {t('Press Enter to open', 'Enter চেপে খুলুন')}
                </span>
              </div>

              {results.map((item, i) => {
                const isSelected = i === selected;
                return (
                  <button
                    type="button"
                    key={item.id}
                    data-result={i}
                    className={`quick-search-item ${isSelected ? 'selected' : ''}`}
                    onMouseEnter={() => setSelected(i)}
                    onClick={() => choose(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 16px',
                      borderBottom: '1px solid #ECE5D9',
                      background: isSelected ? '#F3ECDF' : 'transparent',
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                      border: 0,
                    }}
                  >
                    {/* Item Thumbnail / Icon */}
                    <span
                      className="quick-search-item-icon"
                      aria-hidden="true"
                      style={{
                        width: 36,
                        height: 36,
                        minWidth: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        overflow: 'hidden',
                        background:
                          item.kind === 'business'
                            ? '#ECFDF5'
                            : item.kind === 'case'
                            ? '#FEF2F2'
                            : item.kind === 'review'
                            ? '#FFFBEB'
                            : item.kind === 'comment'
                            ? '#F0F9FF'
                            : '#F1F5F9',
                        border: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      {item.kind === 'business' ? (
                        item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Building2 size={18} color="#059669" />
                        )
                      ) : item.kind === 'case' ? (
                        <AlertTriangle size={18} color="#DC2626" />
                      ) : item.kind === 'review' ? (
                        <Star size={18} color="#D97706" />
                      ) : item.kind === 'comment' ? (
                        <MessageSquare size={18} color="#0284C7" />
                      ) : item.kind === 'location' ? (
                        <MapPin size={18} color="#475569" />
                      ) : item.kind === 'review-action' ? (
                        <MessageSquare size={18} color="#475569" />
                      ) : (
                        <Search size={18} color="#475569" />
                      )}
                    </span>

                    {/* Information column */}
                    <span className="quick-search-item-info" style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          flexWrap: 'wrap',
                          marginBottom: 2,
                        }}
                      >
                        {/* Kind Badge */}
                        {item.kind === 'business' && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: '#ECFDF5',
                              color: '#065F46',
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                            }}
                          >
                            {lang === 'bn' ? 'প্রতিষ্ঠান' : 'ORGANIZATION'}
                          </span>
                        )}
                        {item.kind === 'case' && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: '#FEF2F2',
                              color: '#991B1B',
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                            }}
                          >
                            {lang === 'bn' ? 'স্ক্যাম অ্যালার্ট' : 'SCAM ALERT'}
                          </span>
                        )}
                        {item.kind === 'review' && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: '#FFFBEB',
                              color: '#92400E',
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                            }}
                          >
                            {lang === 'bn' ? 'রিভিউ' : 'REVIEW'}
                          </span>
                        )}
                        {item.kind === 'comment' && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: '#F0F9FF',
                              color: '#075985',
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                            }}
                          >
                            {lang === 'bn' ? 'মন্তব্য' : 'COMMENT'}
                          </span>
                        )}
                        {item.kind === 'location' && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: '#F1F5F9',
                              color: '#334155',
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                            }}
                          >
                            {lang === 'bn' ? 'জেলা' : 'DISTRICT'}
                          </span>
                        )}

                        <strong
                          className="quick-search-item-title"
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--ink, #1F2937)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.title}
                        </strong>

                        {item.kind === 'business' && item.verified && (
                          <span
                            style={{
                              color: '#059669',
                              fontSize: 10.5,
                              fontWeight: 700,
                              background: '#ECFDF5',
                              padding: '1px 6px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 2,
                            }}
                          >
                            ✓ Verified
                          </span>
                        )}
                      </span>

                      <span
                        className="quick-search-item-subtitle"
                        style={{
                          fontSize: 12.5,
                          color: 'var(--slate-500, #64748B)',
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.subtitle}
                      </span>
                    </span>

                    <ChevronRight size={16} color="var(--slate-400, #94A3B8)" aria-hidden="true" />
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="quick-search-footer">
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> {t('to navigate', 'যাতায়াত')}
            </span>
            <span>
              <kbd>Enter</kbd> {t('to select', 'বাছাই')}
            </span>
            <span>
              <kbd>ESC</kbd> {t('to close', 'বন্ধ')}
            </span>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--slate-500)' }}>
            Truth<span style={{ color: '#B93628' }}>Hub</span>BD Omni-Search
          </div>
        </div>
      </div>
    </div>
  );
}
