"use client";
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  ExternalLink, 
  AlertTriangle, 
  Star, 
  Flag, 
  Building2, 
  User, 
  Loader2, 
  ArrowRight 
} from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../i18n/LanguageContext';

export type LookupResult = {
  type: 'case' | 'review' | 'report' | 'business' | 'user';
  id: number;
  code?: string;
  title: string;
  subtitle: string;
  status: string;
  admin_url: string;
  public_url?: string;
};

export function AdminIdSearch() {
  const { t, lang } = useI18n();
  const bn = lang === 'bn';
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      api<{ data: LookupResult[] }>(`/admin/lookup?q=${encodeURIComponent(trimmed)}`)
        .then((res) => {
          setResults(res?.data || []);
          setSelectedIndex(0);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Global Ctrl+K shortcut to focus this search box
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: LookupResult) => {
    setOpen(false);
    navigate(item.admin_url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || !results.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const getIcon = (type: LookupResult['type']) => {
    switch (type) {
      case 'case':
        return <AlertTriangle size={15} color="#b91c1c" />;
      case 'review':
        return <Star size={15} color="#d97706" />;
      case 'report':
        return <Flag size={15} color="#dc2626" />;
      case 'business':
        return <Building2 size={15} color="#0f766e" />;
      case 'user':
        return <User size={15} color="#4338ca" />;
    }
  };

  const getTypeBadge = (type: LookupResult['type']) => {
    const config = {
      case: { bg: '#fee2e2', text: '#991b1b', label: 'CASE / কেস' },
      review: { bg: '#fef3c7', text: '#92400e', label: 'REVIEW / রিভিউ' },
      report: { bg: '#ffe4e6', text: '#9f1239', label: 'REPORT / রিপোর্ট' },
      business: { bg: '#ccfbf1', text: '#115e59', label: 'ORG / প্রতিষ্ঠান' },
      user: { bg: '#e0e7ff', text: '#3730a3', label: 'USER / ব্যবহারকারী' },
    }[type];

    return (
      <span
        style={{
          fontSize: '10px',
          fontWeight: 800,
          background: config.bg,
          color: config.text,
          padding: '2px 6px',
          borderRadius: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '460px'
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 12,
            color: 'var(--slate-400)',
            pointerEvents: 'none'
          }}
        />
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              bn
                ? 'আইডি দিয়ে খুঁজুন (যেমন Case #5, Review #12, Org #3)...'
                : 'Search by ID (e.g. Case #5, Review #12, Org #3)...'
            }
            style={{
              width: '100%',
              height: '38px',
              padding: '0 40px 0 36px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #d8cdb7',
              background: '#ffffff',
              color: 'var(--ink)',
              outline: 'none',
              boxShadow: open ? '0 0 0 2px rgba(18, 18, 16, 0.1)' : 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 40,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: query ? 'none' : 'flex',
              alignItems: 'center',
              gap: '2px',
              color: 'var(--slate-400)',
            }}
          >
            <kbd style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '1px 4px', fontSize: '10px', fontWeight: 600 }}>Ctrl</kbd>
            <span>+</span>
            <kbd style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '1px 4px', fontSize: '10px', fontWeight: 600 }}>K</kbd>
          </div>
        </div>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            style={{
              position: 'absolute',
              right: 10,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--slate-400)',
              display: 'grid',
              placeItems: 'center',
              padding: 4
            }}
            aria-label="Clear search"
          >
            {loading ? <Loader2 size={14} className="spin" /> : <X size={14} />}
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {open && query.trim().length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            maxHeight: '380px',
            overflowY: 'auto',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #d8cdb7',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            zIndex: 9999,
            padding: '6px'
          }}
        >
          {loading && !results.length && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '13px' }}>
              <Loader2 size={16} className="spin" style={{ display: 'inline', marginRight: 6 }} />
              {bn ? 'আইডি ও তথ্য অনুসন্ধান করা হচ্ছে…' : 'Searching ID records…'}
            </div>
          )}

          {!loading && !results.length && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '13px' }}>
              {bn ? `"${query}" সম্পর্কিত কোনো রেকর্ড পাওয়া যায়নি।` : `No records matched "${query}".`}
            </div>
          )}

          {results.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: isSelected ? '#f5eedb' : 'transparent',
                  transition: 'background 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid #d8cdb7',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0
                  }}
                >
                  {getIcon(item.type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    {getTypeBadge(item.type)}
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)' }}>
                      #{item.id} {item.code ? `(${item.code})` : ''}
                    </span>
                  </div>
                  <strong
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
                      color: 'var(--ink)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.title}
                  </strong>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '11.5px',
                      color: 'var(--slate-500)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.subtitle}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {item.public_url && (
                    <a
                      href={item.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '4px 6px',
                        color: 'var(--slate-400)',
                        borderRadius: '4px',
                        display: 'grid',
                        placeItems: 'center'
                      }}
                      title={bn ? 'পাবলিক পেজে দেখুন' : 'View public page'}
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--vermilion)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {bn ? 'খুলুন' : 'Open'}
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
