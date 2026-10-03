"use client";
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Megaphone, 
  ShieldCheck, 
  AlertTriangle, 
  MessageSquare, 
  Check, 
  CheckCheck, 
  ArrowRight, 
  ExternalLink, 
  Loader2,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import { notificationContent, notificationDestination, type NotificationItem } from '../lib/notificationContent';
import { formatDate } from '../i18n/dictionary';

type Props = {
  lang: 'en' | 'bn';
  onClose: () => void;
  onRefreshUser?: () => void;
};

export function NotificationBellPopover({ lang, onClose, onRefreshUser }: Props) {
  const bn = lang === 'bn';
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<number[]>([]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api<{ success: boolean; data: NotificationItem[] }>('/notifications');
      if (res?.data) {
        setItems(res.data);
      }
    } catch {
      // silent catch for background polling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (busyIds.includes(id)) return;
    setBusyIds(prev => [...prev, id]);
    try {
      await api(`/notifications/${id}/read`, 'PATCH');
      setItems(prev => prev.map(item => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
      if (onRefreshUser) onRefreshUser();
    } catch {
      // ignore
    } finally {
      setBusyIds(prev => prev.filter(i => i !== id));
    }
  };

  const markAllRead = async () => {
    const unreadItems = items.filter(i => !i.read_at);
    for (const item of unreadItems) {
      await markAsRead(item.id);
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.read_at) {
      void markAsRead(item.id);
    }
    const dest = notificationDestination(item.url);
    onClose();
    if (dest) {
      if (dest.startsWith('http://') || dest.startsWith('https://')) {
        window.open(dest, '_blank', 'noopener,noreferrer');
      } else {
        navigate(dest);
      }
    } else {
      navigate('/notifications');
    }
  };

  const unreadCount = items.filter(i => !i.read_at).length;

  return (
    <div 
      className="notifications-popover" 
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        width: 'min(92vw, 420px)',
        background: '#ffffff',
        border: '1px solid #d8cdb7',
        borderRadius: 12,
        boxShadow: '0 12px 36px rgba(0,0,0,0.16)',
        zIndex: 2000,
        overflow: 'hidden',
        animation: 'fadeInDown 0.18s ease-out',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '82vh',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: '1px solid #e2d9c5',
        background: '#faf7f2',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#18243e', display: 'grid', placeItems: 'center', color: '#fff' }}>
            <Bell size={16} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#18243e' }}>
              {bn ? 'বিজ্ঞপ্তি' : 'Notifications'}
            </h3>
            <span style={{ fontSize: 11, color: '#6b7283' }}>
              {unreadCount > 0 ? (bn ? `${unreadCount}টি অপঠিত বিজ্ঞপ্তি` : `${unreadCount} unread notices`) : (bn ? 'সব পড়া হয়েছে' : 'All caught up')}
            </span>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#059669',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            <CheckCheck size={14} />
            {bn ? 'সব পড়ুন' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* List Body */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7283' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
            <p style={{ margin: 0, fontSize: 13 }}>{bn ? 'বিজ্ঞপ্তি লোড হচ্ছে…' : 'Loading notifications…'}</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7283' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f5eedb', display: 'grid', placeItems: 'center', margin: '0 auto 10px', color: '#8c8270' }}>
              <Bell size={20} />
            </div>
            <strong style={{ fontSize: 14, color: '#18243e', display: 'block', marginBottom: 4 }}>
              {bn ? 'কোনো নতুন বিজ্ঞপ্তি নেই' : 'No new notifications'}
            </strong>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7283' }}>
              {bn ? 'সম্প্রচার ও কেস আপডেট এখানে দেখা যাবে।' : 'Announcements, reports & case alerts will appear here.'}
            </p>
          </div>
        ) : (
          items.slice(0, 10).map((item) => {
            const content = notificationContent(item, lang);
            const isRead = !!item.read_at;
            const dest = notificationDestination(item.url);
            const isBroadcast = item.type === 'announcement' || item.type === 'broadcast';
            const isReport = item.type === 'report_response';
            const isAlert = item.type === 'case_alert';

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: isBroadcast 
                    ? '1.5px solid #fcd34d' 
                    : isReport 
                    ? '1.5px solid #a7f3d0' 
                    : isRead 
                    ? '1px solid #e5e7eb' 
                    : '1px solid #c7d2fe',
                  background: isBroadcast 
                    ? '#fefce8' 
                    : isReport 
                    ? '#f0fdf4' 
                    : isRead 
                    ? '#ffffff' 
                    : '#f8fafc',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all .12s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isBroadcast ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fef08a', color: '#854d0e', fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
                        <Megaphone size={11} /> {bn ? 'সম্প্রচার বিজ্ঞপ্তি' : 'Notice'}
                      </span>
                    ) : isReport ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#166534', fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
                        <ShieldCheck size={11} /> {bn ? 'অ্যাডমিন উত্তর (ব্যক্তিগত)' : 'Admin Response'}
                      </span>
                    ) : isAlert ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fee2e2', color: '#991b1b', fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
                        <AlertTriangle size={11} /> {bn ? 'কেস সতর্কতা' : 'Case Alert'}
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', color: '#475569', fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
                        <Bell size={11} /> {bn ? 'আপডেট' : 'Update'}
                      </span>
                    )}

                    {!isRead && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
                    )}
                  </div>

                  <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>
                    {formatDate(item.created_at, lang)}
                  </span>
                </div>

                <strong style={{ fontSize: 13.5, color: '#18243e', display: 'block', marginBottom: 3, lineHeight: 1.3 }}>
                  {content.title}
                </strong>

                <p style={{ margin: 0, fontSize: 12.5, color: '#4b5563', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {content.body}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 6, borderTop: '1px dashed rgba(0,0,0,0.06)' }}>
                  {dest ? (
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#b93628', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {bn ? 'বিস্তারিত দেখুন' : 'View details'} <ArrowRight size={12} />
                    </span>
                  ) : <span />}

                  {!isRead && (
                    <button
                      type="button"
                      disabled={busyIds.includes(item.id)}
                      onClick={(e) => markAsRead(item.id, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6b7283',
                        fontSize: 11.5,
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Check size={12} />
                      {bn ? 'পড়া হয়েছে' : 'Mark read'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid #e2d9c5',
        background: '#faf7f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link
          to="/notifications"
          onClick={onClose}
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#18243e',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {bn ? 'সব বিজ্ঞপ্তি ইনবক্সে দেখুন' : 'View all in Notifications Inbox'}
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
