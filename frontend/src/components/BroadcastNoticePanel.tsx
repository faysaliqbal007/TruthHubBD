"use client";
import { useEffect, useState, type FormEvent } from 'react';
import { Megaphone, Send, Users, Bell, CheckCircle2, AlertTriangle, BarChart3, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../i18n/LanguageContext';

type BroadcastTarget = 'all' | 'user' | 'moderator' | 'admin' | 'business';

const TARGETS: { value: BroadcastTarget; label: string; bn: string; desc: string }[] = [
  { value: 'all', label: 'All Users', bn: 'সকল ব্যবহারকারী', desc: 'Send to every registered member' },
  { value: 'user', label: 'Regular Users', bn: 'সাধারণ ব্যবহারকারী', desc: 'Send to standard user accounts only' },
  { value: 'business', label: 'Business Owners', bn: 'ব্যবসার মালিক', desc: 'Send to verified business accounts' },
  { value: 'moderator', label: 'Moderators', bn: 'মডারেটর', desc: 'Send to moderator staff only' },
  { value: 'admin', label: 'Admins', bn: 'অ্যাডমিন', desc: 'Send to admin accounts only' },
];

export function BroadcastNoticePanel() {
  const { t, lang } = useI18n();
  const bn = lang === 'bn';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [target, setTarget] = useState<BroadcastTarget>('all');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    setLoadingHistory(true);
    api<{ data: any[] }>('/admin/audit-logs?per_page=20')
      .then(r => {
        const broadcastLogs = (r.data || []).filter((l: any) => l.action === 'admin.notification_broadcast');
        setHistory(broadcastLogs);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [result]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || busy) return;

    const confirmed = window.confirm(
      bn
        ? `"${target === 'all' ? 'সকল ব্যবহারকারী' : target}"-কে এই বার্তা পাঠাবেন?\n\nশিরোনাম: ${title}`
        : `Send this broadcast to "${target}"?\n\nTitle: ${title}`
    );
    if (!confirmed) return;

    setBusy(true);
    setResult(null);
    try {
      const res = await api<{ success: boolean; count: number; message: string }>(
        '/admin/broadcast-notification',
        'POST',
        { title: title.trim(), body: body.trim(), url: url.trim() || undefined, target_role: target }
      );
      setResult({ success: true, message: res.message, count: res.count });
      setTitle('');
      setBody('');
      setUrl('');
    } catch (err) {
      setResult({ success: false, message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="workspace-page">
      <div className="workspace-heading">
        <span className="workspace-eyebrow">
          {t('ADMIN / COMMUNICATIONS', 'অ্যাডমিন / যোগাযোগ')}
        </span>
        <h1>{t('Broadcast Notice', 'সম্প্রচার বিজ্ঞপ্তি')}</h1>
        <p>
          {t(
            'Send a platform-wide announcement or targeted notice to specific user groups. Each message appears in their notification inbox.',
            'প্ল্যাটফর্মব্যাপী ঘোষণা বা নির্দিষ্ট গ্রুপে বার্তা পাঠান। প্রতিটি বার্তা তাদের বিজ্ঞপ্তি ইনবক্সে দেখাবে।'
          )}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 24, alignItems: 'start' }}>
        {/* Compose Panel */}
        <div>
          <form
            onSubmit={handleSubmit}
            className="workspace-card"
            style={{ background: '#fff', border: '1px solid #d8cdb7', borderRadius: 12, padding: '24px 28px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <div style={{ width: 40, height: 40, borderRadius: 9, background: '#fef3c7', display: 'grid', placeItems: 'center' }}>
                <Megaphone size={20} color="#92400e" />
              </div>
              <strong style={{ fontSize: 16 }}>{t('Compose Broadcast', 'বার্তা রচনা করুন')}</strong>
            </div>

            {/* Target Audience */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 10 }}>
                {t('Target Audience', 'প্রাপক নির্বাচন')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {TARGETS.map(tgt => (
                  <button
                    key={tgt.value}
                    type="button"
                    onClick={() => setTarget(tgt.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `2px solid ${target === tgt.value ? '#18243e' : '#d8cdb7'}`,
                      background: target === tgt.value ? '#18243e' : '#faf6eb',
                      color: target === tgt.value ? '#fff' : '#18243e',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all .15s',
                    }}
                  >
                    <div>{bn ? tgt.bn : tgt.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 400, marginTop: 2 }}>{tgt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                {t('Notification Title', 'বিজ্ঞপ্তির শিরোনাম')} *
              </span>
              <input
                className="review-input"
                type="text"
                value={title}
                maxLength={150}
                required
                onChange={e => setTitle(e.target.value)}
                placeholder={bn ? 'সর্বোচ্চ ১৫০ অক্ষর' : 'Up to 150 characters'}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <small style={{ color: '#6b7283', fontSize: 11 }}>{title.length}/150</small>
            </label>

            {/* Body */}
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                {t('Message Body', 'বার্তার মূল বিষয়')} *
              </span>
              <textarea
                className="review-textarea"
                value={body}
                maxLength={2000}
                required
                rows={5}
                onChange={e => setBody(e.target.value)}
                placeholder={bn ? 'ব্যবহারকারীরা এই বার্তাটি দেখবেন…' : 'Users will see this message in their notification inbox…'}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <small style={{ color: '#6b7283', fontSize: 11 }}>{body.length}/2000</small>
            </label>

            {/* URL */}
            <label style={{ display: 'block', marginBottom: 24 }}>
              <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                {t('Action URL (optional)', 'অ্যাকশন URL (ঐচ্ছিক)')}
              </span>
              <input
                className="review-input"
                type="text"
                value={url}
                maxLength={500}
                onChange={e => setUrl(e.target.value)}
                placeholder="/scam-alerts or https://..."
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </label>

            {result && (
              <div
                role="status"
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  marginBottom: 16,
                  background: result.success ? '#d1fae5' : '#fee2e2',
                  color: result.success ? '#065f46' : '#991b1b',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                  fontSize: 13,
                }}
              >
                {result.success ? <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} /> : <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />}
                <span>{result.message}{result.count ? ` (${result.count} recipients)` : ''}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !title.trim() || !body.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 8,
                border: 'none',
                background: busy ? '#6b7283' : '#18243e',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                transition: 'background .15s',
              }}
            >
              {busy ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              {busy ? t('Sending…', 'পাঠানো হচ্ছে…') : t('Send Broadcast', 'বার্তা পাঠান')}
            </button>
          </form>
        </div>

        {/* Preview + History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Live Preview */}
          {(title || body) && (
            <div style={{ background: '#fff', border: '1px solid #d8cdb7', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Bell size={14} color="#6b7283" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7283', letterSpacing: '0.08em' }}>
                  {t('PREVIEW', 'পূর্বদর্শন')}
                </span>
              </div>
              <div style={{ background: '#faf6eb', borderRadius: 8, padding: '12px 16px', border: '1px solid #e2d9c5' }}>
                <strong style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>{title || '…'}</strong>
                <p style={{ fontSize: 13, color: '#596273', margin: 0, lineHeight: 1.6 }}>{body || '…'}</p>
                {url && <a href={url} style={{ fontSize: 12, color: '#b93628', marginTop: 8, display: 'block' }}>{url}</a>}
              </div>
              <div style={{ fontSize: 11, color: '#6b7283', marginTop: 8 }}>
                {t('Audience:', 'প্রাপক:')} {bn ? TARGETS.find(t => t.value === target)?.bn : TARGETS.find(t => t.value === target)?.label}
              </div>
            </div>
          )}

          {/* Broadcast History */}
          <div style={{ background: '#fff', border: '1px solid #d8cdb7', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <BarChart3 size={14} color="#6b7283" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7283', letterSpacing: '0.08em' }}>
                {t('RECENT BROADCASTS', 'সাম্প্রতিক সম্প্রচার')}
              </span>
            </div>
            {loadingHistory ? (
              <p style={{ color: '#6b7283', fontSize: 13 }}>{t('Loading…', 'লোড হচ্ছে…')}</p>
            ) : history.length === 0 ? (
              <p style={{ color: '#6b7283', fontSize: 13 }}>{t('No broadcasts sent yet.', 'এখনও কোনো বার্তা পাঠানো হয়নি।')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.slice(0, 5).map((log, i) => {
                  let meta: any = {};
                  try { meta = JSON.parse(log.metadata || '{}'); } catch {}
                  return (
                    <div key={i} style={{ padding: '10px 14px', background: '#faf6eb', borderRadius: 8, border: '1px solid #e2d9c5' }}>
                      <strong style={{ fontSize: 13, display: 'block' }}>{meta.title || 'Broadcast'}</strong>
                      <div style={{ fontSize: 11, color: '#6b7283', marginTop: 4 }}>
                        {meta.recipients_count || 0} {t('recipients', 'প্রাপক')} · {meta.target_role || 'all'} · {new Date(log.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
