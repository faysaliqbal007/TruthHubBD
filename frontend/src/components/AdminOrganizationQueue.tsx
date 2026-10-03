"use client";
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Image as ImageIcon, Edit3, RefreshCw, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import type { PendingBusiness } from '../types';
import { formatDate, translateCategory } from '../i18n/dictionary';
import { OrganizationImageDesk } from './OrganizationImageDesk';
import { DirectoryCorrectionAdmin } from './DirectoryCorrectionAdmin';
import { AdminOrganizationEdit } from './AdminOrganizationEdit';
import { AdminClaimsDesk } from './AdminClaimsDesk';

type QueuePage = {
  data: PendingBusiness[];
  pagination?: { current_page: number; last_page: number; total: number };
};

export function AdminOrganizationQueue() {
  const { user, checking } = useAuth();
  const { lang, t } = useI18n();
  const [activeTab, setActiveTab] = useState<'pending' | 'claims' | 'photos' | 'corrections' | 'edit'>('pending');

  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState('');
  const key = `${page}:${attempt}:${search}:${user?.id}`;
  const [snapshot, setSnapshot] = useState<{ key: string; response?: QueuePage; error?: string }>();
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number[]>([]);
  const locks = useRef(new Set<number>());
  const [notice, setNotice] = useState<{ error: boolean; text: string }>();

  useEffect(() => {
    if (checking || (user?.role !== 'admin' && user?.role !== 'moderator')) return;
    let active = true;
    const query = new URLSearchParams({
      page: String(page),
      per_page: '20',
      ...(search.trim() ? { q: search.trim() } : {})
    });

    api<QueuePage>(`/admin/pending-businesses?${query.toString()}`)
      .then((response) => {
        if (active) setSnapshot({ key, response });
      })
      .catch((error) => {
        if (active) setSnapshot({ key, error: (error as Error).message });
      });

    return () => {
      active = false;
    };
  }, [key, page, search, user?.role, checking]);

  const current = snapshot?.key === key ? snapshot : undefined;

  async function decide(id: number, decision: 'approve' | 'reject') {
    if (locks.current.has(id) || (notes[id] || '').trim().length < 10) return;
    locks.current.add(id);
    setBusy((previous) => [...previous, id]);
    setNotice(undefined);
    try {
      await api(`/admin/businesses/${id}/${decision}`, 'POST', { reason: notes[id].trim() });
      setNotice({
        error: false,
        text:
          decision === 'approve'
            ? t('Listing approved. Ownership is not claimed.', 'তালিকা অনুমোদিত হয়েছে। মালিকানা দাবি অনুমোদন করা হয়নি।')
            : t('Listing rejected.', 'তালিকা প্রত্যাখ্যাত হয়েছে।')
      });
      setAttempt((value) => value + 1);
    } catch (error) {
      setNotice({ error: true, text: (error as Error).message });
    } finally {
      locks.current.delete(id);
      setBusy((previous) => previous.filter((value) => value !== id));
    }
  }

  async function deleteListing(id: number, name: string) {
    const confirmed = window.confirm(
      lang === 'bn'
        ? `আপনি কি নিশ্চিত যে "${name}" প্রতিষ্ঠানটি স্থায়ীভাবে মুছে ফেলতে চান?\n\nএর সাথে সম্পর্কিত সমস্ত রিভিউ, কেলেঙ্কারি রিপোর্ট, দাবি ও তথ্য স্থায়ীভাবে মুছে যাবে। এই কাজটি আর ফিরিয়ে আনা যাবে না।`
        : `Are you sure you want to permanently delete "${name}"?\n\nAll associated reviews, scam reports, claims, and media will be permanently deleted. This action cannot be undone.`
    );
    if (!confirmed) return;

    if (locks.current.has(id)) return;
    locks.current.add(id);
    setBusy((previous) => [...previous, id]);
    setNotice(undefined);
    try {
      const res = await api<{ success: boolean; message: string }>(`/admin/businesses/${id}`, 'DELETE');
      setNotice({
        error: false,
        text: res?.message || (lang === 'bn' ? `"${name}" স্থায়ীভাবে মুছে ফেলা হয়েছে।` : `Organization "${name}" has been permanently deleted.`)
      });
      setAttempt((value) => value + 1);
    } catch (error) {
      setNotice({ error: true, text: (error as Error).message });
    } finally {
      locks.current.delete(id);
      setBusy((previous) => previous.filter((value) => value !== id));
    }
  }

  if (checking) return <p role="status">{t('Checking your session…', 'আপনার সেশন যাচাই হচ্ছে…')}</p>;
  if (user?.role !== 'admin' && user?.role !== 'moderator') return <p role="alert">{t('Staff access is required.', 'কর্মীদের প্রবেশাধিকার প্রয়োজন।')}</p>;

  return (
    <section className="admin-organization-queue workspace-page">
      <header className="workspace-heading">
        <span className="workspace-eyebrow">{t('STAFF / DIRECTORY', 'কর্মীদের নিয়ন্ত্রণ / ডিরেক্টরি')}</span>
        <h1>{t('Organization Operations', 'প্রতিষ্ঠানের কার্যক্রম নিয়ন্ত্রণ')}</h1>
        <p>
          {t(
            'Review listing submissions, edit information & photos, and apply directory decisions.',
            'প্রতিষ্ঠানের আবেদন পর্যালোচনা, তথ্য ও ছবি সম্পাদনা এবং ডিরেক্টরির সিদ্ধান্ত দিন।'
          )}
        </p>
      </header>

      {/* Tabs */}
      <nav className="workspace-tabs" style={{ marginBottom: '24px' }}>
        <button
          type="button"
          aria-pressed={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Building2 size={16} />
          <span>{t('Pending Listings', 'অপেক্ষমাণ তালিকা')}</span>
          {current?.response?.pagination?.total !== undefined && (
            <span style={{ fontSize: '11px', background: 'rgba(0,0,0,0.08)', padding: '1px 6px', borderRadius: '10px' }}>
              {current.response.pagination.total}
            </span>
          )}
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'claims'}
          onClick={() => setActiveTab('claims')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <AlertCircle size={16} />
          <span>{t('Claim Applications', 'মালিকানা আবেদন')}</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'edit'}
          onClick={() => setActiveTab('edit')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Edit3 size={16} />
          <span>{t('Edit Any Organization', 'প্রতিষ্ঠান তথ্য ও ছবি সম্পাদনা')}</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'photos'}
          onClick={() => setActiveTab('photos')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ImageIcon size={16} />
          <span>{t('Profile Photos', 'প্রোফাইল ছবি')}</span>
        </button>

        <button
          type="button"
          aria-pressed={activeTab === 'corrections'}
          onClick={() => setActiveTab('corrections')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Edit3 size={16} />
          <span>{t('Directory Corrections', 'তথ্য সংশোধন')}</span>
        </button>
      </nav>

      {notice && (
        <p
          role={notice.error ? 'alert' : 'status'}
          className="workspace-notice"
          style={{ color: notice.error ? '#b7362a' : '#23513d', marginBottom: '20px' }}
        >
          {notice.text}
        </p>
      )}

      {/* TAB 1: PENDING LISTINGS */}
      {activeTab === 'pending' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <input
              type="search"
              placeholder={t('Search pending listings…', 'অপেক্ষমাণ প্রতিষ্ঠান খুঁজুন…')}
              className="review-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ flex: 1, minWidth: '220px', margin: 0 }}
            />
            <button
              type="button"
              className="btn-pill-light"
              onClick={() => setAttempt((value) => value + 1)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} />
              <span>{t('Refresh queue', 'তালিকা আবার দেখুন')}</span>
            </button>
          </div>

          {!current ? (
            <p role="status">{t('Loading submitted listings…', 'জমা দেওয়া তালিকা লোড হচ্ছে…')}</p>
          ) : current.error ? (
            <div role="alert" className="workspace-notice">
              {current.error}{' '}
              <button type="button" onClick={() => setAttempt((value) => value + 1)}>
                {t('Retry', 'আবার চেষ্টা')}
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginBottom: '16px' }}>
                {t('Pending listings waiting for review', 'পর্যালোচনার জন্য অপেক্ষমাণ তালিকা')}:{' '}
                <strong>{current.response?.pagination?.total ?? current.response?.data.length ?? 0}</strong>
              </p>

              {!current.response?.data.length && (
                <div style={{ background: '#ffffff', border: '1px solid #d8cdb7', padding: '36px', borderRadius: '10px', textAlign: 'center' }}>
                  <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 10px' }} />
                  <h3>{t('Queue is clear!', 'কোনো অপেক্ষমাণ তালিকা নেই!')}</h3>
                  <p style={{ color: 'var(--slate-500)', fontSize: '13.5px' }}>
                    {t('All submitted organization profiles have been reviewed.', 'জমা দেওয়া সব প্রতিষ্ঠানের তথ্য পর্যালোচনা করা হয়েছে।')}
                  </p>
                </div>
              )}

              {current.response?.data.map((item) => (
                <article
                  key={item.id}
                  className="workspace-notice"
                  style={{
                    background: '#fffdf7',
                    border: '1px solid #d8cdb7',
                    borderRadius: '10px',
                    padding: '20px',
                    margin: '16px 0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: 'var(--ink)' }}>
                        {lang === 'bn' && item.bengaliName ? item.bengaliName : item.name}
                      </h2>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--slate-500)' }}>
                        {translateCategory(item.category, lang)} &bull; #{item.id} &bull; {formatDate(item.createdAt, lang)}
                      </p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px' }}>
                      PENDING APPROVAL
                    </span>
                  </div>

                  <dl
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
                      gap: 12,
                      marginTop: 14,
                      marginBottom: 14,
                      background: '#ffffff',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #eae0ce'
                    }}
                  >
                    <div>
                      <dt style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)' }}>{t('Submitted by', 'জমা দিয়েছেন')}</dt>
                      <dd style={{ margin: '2px 0 0', fontWeight: 600, color: 'var(--ink)' }}>
                        {item.creator?.name || t('Submitter unavailable', 'জমাদানকারীর তথ্য নেই')}
                        {item.creator?.email && <small style={{ display: 'block', color: 'var(--slate-500)', fontWeight: 400 }}>{item.creator.email}</small>}
                      </dd>
                    </div>
                    <div>
                      <dt style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)' }}>{t('Location', 'এলাকা')}</dt>
                      <dd style={{ margin: '2px 0 0', color: 'var(--ink)' }}>{item.location || '—'}</dd>
                    </div>
                    <div>
                      <dt style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)' }}>{t('Contact Details', 'যোগাযোগের তথ্য')}</dt>
                      <dd style={{ margin: '2px 0 0', color: 'var(--ink)' }}>
                        {item.phone && <div>{item.phone}</div>}
                        {item.website && <div><a href={item.website} target="_blank" rel="noreferrer" style={{ color: 'var(--teal-primary)' }}>{item.website}</a></div>}
                        {!item.phone && !item.website && '—'}
                      </dd>
                    </div>
                  </dl>

                  {item.description && (
                    <div style={{ margin: '12px 0', fontSize: '13.5px', color: 'var(--slate-700)', lineHeight: 1.5, background: '#fdfbf7', padding: '10px 14px', borderRadius: '6px' }}>
                      <strong>{t('Description:', 'বিবরণ:')}</strong> {item.description}
                    </div>
                  )}

                  <fieldset disabled={busy.includes(item.id)} style={{ border: 0, padding: 0, margin: '14px 0 0', minWidth: 0 }}>
                    <label htmlFor={`listing-reason-${item.id}`} style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--slate-700)' }}>
                      {t('Private decision reason (at least 10 characters required)', 'সিদ্ধান্তের ব্যক্তিগত কারণ (অন্তত ১০ অক্ষর আবশ্যক)')}
                    </label>
                    <textarea
                      id={`listing-reason-${item.id}`}
                      className="review-textarea"
                      placeholder={t('e.g. Verified organization registry and physical existence', 'যেমন: প্রতিষ্ঠানের নিবন্ধন ও বাস্তব উপস্থিতি যাচাই করা হয়েছে')}
                      value={notes[item.id] || ''}
                      maxLength={5000}
                      onChange={(event) =>
                        setNotes((previous) => ({ ...previous, [item.id]: event.target.value }))
                      }
                      style={{ width: '100%', margin: 0 }}
                    />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      <button
                        type="button"
                        className="btn-teal-pill"
                        disabled={(notes[item.id] || '').trim().length < 10}
                        onClick={() => void decide(item.id, 'approve')}
                      >
                        {t('Approve listing', 'তালিকা অনুমোদন')}
                      </button>
                      <button
                        type="button"
                        className="btn-pill-light"
                        disabled={(notes[item.id] || '').trim().length < 10}
                        onClick={() => void decide(item.id, 'reject')}
                      >
                        {t('Reject listing', 'তালিকা প্রত্যাখ্যান')}
                      </button>
                      <button
                        type="button"
                        className="btn-pill-light"
                        style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        disabled={busy.includes(item.id)}
                        onClick={() => void deleteListing(item.id, item.name)}
                      >
                        <Trash2 size={13} style={{ marginRight: 4 }} />
                        {t('Delete listing', 'তালিকা মুছুন')}
                      </button>
                    </div>
                  </fieldset>
                </article>
              ))}

              {Boolean(current.response?.pagination && current.response.pagination.last_page > 1) && (
                <nav
                  aria-label={t('Queue pagination', 'তালিকার পাতা')}
                  style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginTop: '20px' }}
                >
                  <button className="btn-pill-light" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                    {t('Previous', 'আগের')}
                  </button>
                  <span>
                    {page} / {current.response?.pagination?.last_page || 1}
                  </span>
                  <button
                    className="btn-pill-light"
                    disabled={page >= (current.response?.pagination?.last_page || 1)}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    {t('Next', 'পরের')}
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: CLAIMS QUEUE */}
      {activeTab === 'claims' && (
        <div>
          <AdminClaimsDesk />
        </div>
      )}

      {/* TAB 3: PROFILE PHOTOS QUEUE */}
      {activeTab === 'photos' && (
        <div>
          <OrganizationImageDesk />
        </div>
      )}

      {/* TAB 3: DIRECTORY CORRECTIONS */}
      {activeTab === 'corrections' && (
        <div>
          <DirectoryCorrectionAdmin />
        </div>
      )}

      {/* TAB 4: EDIT ANY ORGANIZATION */}
      {activeTab === 'edit' && (
        <div>
          <AdminOrganizationEdit />
        </div>
      )}
    </section>
  );
}
