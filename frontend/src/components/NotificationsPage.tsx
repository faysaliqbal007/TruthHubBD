"use client";
import {useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {ArrowRight, Bell, Check, CheckCheck, Megaphone, RefreshCw, ShieldCheck, AlertTriangle} from 'lucide-react';
import {useAuth} from '../features/auth/AuthContext';
import {useI18n} from '../i18n/LanguageContext';
import {formatDate, formatNumber, localizedError} from '../i18n/dictionary';
import {notificationContent, notificationDestination, type NotificationItem} from '../lib/notificationContent';
import {api} from '../services/api';
import './notification-inbox.css';

export function NotificationsPage() {
  const {user, checking} = useAuth();
  const {t} = useI18n();
  const location = useLocation();
  const signIn = '/login?next=' + encodeURIComponent(location.pathname + location.search + location.hash);
  return <section className="workspace-page notification-page">
    <header className="notification-heading"><span className="workspace-eyebrow">{t('YOUR ACCOUNT / UPDATES','আপনার অ্যাকাউন্ট / আপডেট')}</span><h1>{t('Recent notifications','সাম্প্রতিক বিজ্ঞপ্তি')}</h1><p>{t('Replies and reviewed case updates, together in one place.','মন্তব্যের উত্তর ও পর্যালোচিত কেসের আপডেট এক জায়গায়।')}</p></header>
    {checking ? <p className="notification-notice" role="status">{t('Checking your account…','আপনার অ্যাকাউন্ট দেখা হচ্ছে…')}</p> : user ? <NotificationInbox key={user.id}/> : <div className="notification-empty"><Bell size={28} aria-hidden="true"/><h2>{t('Your updates start here','আপনার আপডেট এখানে থাকবে')}</h2><p>{t('Sign in to see replies and public case alerts sent to your account. You can browse public alerts without an account.','আপনার অ্যাকাউন্টে পাঠানো মন্তব্যের উত্তর ও প্রকাশ্য কেসের সতর্কতা দেখতে সাইন ইন করুন। অ্যাকাউন্ট ছাড়াও প্রকাশ্য সতর্কতা পড়তে পারবেন।')}</p><div className="notification-actions"><Link className="notification-primary" to={signIn}>{t('Sign in for notifications','বিজ্ঞপ্তি দেখতে সাইন ইন')}</Link><Link to="/scam-alerts">{t('Browse public alerts','প্রকাশ্য সতর্কতা দেখুন')}<ArrowRight size={16} aria-hidden="true"/></Link></div></div>}
  </section>;
}

function NotificationInbox() {
  const {lang, t} = useI18n();
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<{revision: number; items: NotificationItem[]; error?: string}>();
  const [readAt, setReadAt] = useState<Record<number, string>>({});
  const [busyIds, setBusyIds] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const active = useRef(true);
  const pending = useRef(new Set<number>());
  useEffect(() => {
    active.current = true;
    return () => {active.current = false;};
  }, []);
  useEffect(() => {
    let current = true;
    api<{data: NotificationItem[]}>('/notifications').then(result => {
      if (current) setSnapshot({revision, items: result.data});
    }).catch(error => {
      if (current) setSnapshot({revision, items: [], error: (error as Error).message});
    });
    return () => {current = false;};
  }, [revision]);
  const current = snapshot?.revision === revision ? snapshot : undefined;
  const loading = !current;
  const items = current?.items ?? [];
  const unread = items.filter(item => !item.read_at && !readAt[item.id]).length;
  const refresh = () => {setMessage(''); setRevision(value => value + 1);};
  async function markRead(id: number) {
    if (pending.current.has(id)) return;
    pending.current.add(id);
    setBusyIds(ids => [...ids, id]);
    setMessage('');
    try {
      await api(`/notifications/${id}/read`, 'PATCH');
      if (!active.current) return;
      // Preserve successful reads even when a refresh started before the PATCH finished.
      setReadAt(previous => ({...previous, [id]: new Date().toISOString()}));
      setMessage(t('Notification marked as read.','বিজ্ঞপ্তিটি পড়া হয়েছে হিসেবে রাখা হয়েছে।'));
    } catch (error) {if (active.current) setMessage(localizedError((error as Error).message, lang));}
    finally {pending.current.delete(id); if (active.current) setBusyIds(ids => ids.filter(value => value !== id));}
  }

  async function markAllRead() {
    const unreadList = items.filter(item => !item.read_at && !readAt[item.id]);
    for (const it of unreadList) {
      await markRead(it.id);
    }
  }

  return <div className="notification-inbox" aria-busy={loading}>
    <div className="notification-toolbar">
      <div>
        <span>{t('Up to 30 most recent notifications','সর্বশেষ সর্বোচ্চ ৩০টি বিজ্ঞপ্তি')}</span>
        {!loading && !current?.error && <strong>{formatNumber(unread, lang)} {t('unread in this list','টি এই তালিকায় অপঠিত')}</strong>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {unread > 0 && (
          <button type="button" onClick={markAllRead} disabled={loading} style={{ color: '#059669', fontWeight: 700 }}>
            <CheckCheck size={16} aria-hidden="true"/>
            {t('Mark all as read', 'সব পড়া হিসেবে চিহ্নিত করুন')}
          </button>
        )}
        <button type="button" onClick={refresh} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true"/>
          {loading ? t('Loading…','লোড হচ্ছে…') : t('Refresh','আবার দেখুন')}
        </button>
      </div>
    </div>
    {message && <p className="notification-notice" role="status">{message}</p>}
    {loading ? <p className="notification-notice" role="status">{t('Loading recent notifications…','সাম্প্রতিক বিজ্ঞপ্তি লোড হচ্ছে…')}</p> : current?.error ? <div className="notification-empty" role="alert"><h2>{t('Notifications are unavailable','বিজ্ঞপ্তি পাওয়া যাচ্ছে না')}</h2><p>{localizedError(current.error, lang)}</p><button type="button" className="notification-primary" onClick={refresh}>{t('Try again','আবার চেষ্টা করুন')}</button></div> : items.length ? <div className="notification-list">{items.map(item => {
      const content = notificationContent(item, lang);
      const destination = notificationDestination(item.url);
      const isRead = !!item.read_at || !!readAt[item.id];
      const busy = busyIds.includes(item.id);
      const isBroadcast = (content as any).isBroadcast;
      const isReport = (content as any).isReportResponse;

      return <article 
        className={'notification-card' + (isRead ? ' notification-card-read' : '')} 
        key={item.id}
        style={{
          borderLeft: isBroadcast ? '4px solid #f59e0b' : isReport ? '4px solid #10b981' : undefined,
          background: isBroadcast && !isRead ? '#fefce8' : isReport && !isRead ? '#f0fdf4' : undefined,
        }}
      >
        <div className="notification-record">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="notification-state">
              {isRead ? <Check size={14} aria-hidden="true"/> : <span className="notification-unread-dot" aria-hidden="true"/>}
              {isRead ? t('Read','পঠিত') : t('Unread','অপঠিত')}
            </span>
            {isBroadcast && (
              <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Megaphone size={12} /> {lang === 'bn' ? 'সম্প্রচার বিজ্ঞপ্তি' : 'BROADCAST NOTICE'}
              </span>
            )}
            {isReport && (
              <span style={{ background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={12} /> {lang === 'bn' ? 'অ্যাডমিন প্রতিক্রিয়া (ব্যক্তিগত)' : 'ADMIN RESPONSE (PRIVATE)'}
              </span>
            )}
          </div>
          <time dateTime={item.created_at ?? undefined}>{formatDate(item.created_at, lang)}</time>
        </div>
        <h2>{content.title}</h2>
        <p style={{ whiteSpace: 'pre-line' }}>{content.body}</p>
        {content.original && <small className="notification-original">{t('Original message','মূল বার্তা · বাংলা অনুবাদ দেওয়া নেই')}</small>}
        <div className="notification-actions">
          {destination && (
            destination.startsWith('http') ? (
              <a href={destination} target="_blank" rel="noopener noreferrer">
                {t('Open link','লিংক খুলুন')}<ArrowRight size={16} aria-hidden="true"/>
              </a>
            ) : (
              <Link to={destination}>
                {t('View update','আপডেট দেখুন')}<ArrowRight size={16} aria-hidden="true"/>
              </Link>
            )
          )}
          {!isRead && (
            <button type="button" disabled={busy} aria-busy={busy} onClick={() => void markRead(item.id)}>
              <Check size={16} aria-hidden="true"/>
              {busy ? t('Saving…','সংরক্ষণ হচ্ছে…') : t('Mark as read','পড়া হয়েছে হিসেবে রাখুন')}
            </button>
          )}
        </div>
      </article>;
    })}</div> : <div className="notification-empty"><Bell size={28} aria-hidden="true"/><h2>{t('No recent notifications','সাম্প্রতিক বিজ্ঞপ্তি নেই')}</h2><p>{t('Replies, announcements, and case alerts will appear here when they are sent to your account.','আপনার অ্যাকাউন্টে মন্তব্যের উত্তর, ঘোষণা ও কেসের সতর্কতা পাঠানো হলে এখানে দেখা যাবে।')}</p><Link to="/scam-alerts">{t('Browse public alerts','প্রকাশ্য সতর্কতা দেখুন')}<ArrowRight size={16} aria-hidden="true"/></Link></div>}
  </div>;
}
