export type NotificationItem = {
  id: number;
  type?: string;
  title: string;
  body: string;
  url?: string | null;
  created_at?: string | null;
  read_at?: string | null;
};

export function notificationDestination(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(value)) return undefined;
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(decoded)) return undefined;
  } catch { return undefined; }
  return value;
}

export function notificationContent(item: NotificationItem, lang: 'en' | 'bn') {
  const bn = lang === 'bn';

  if (item.type === 'announcement' || item.type === 'broadcast') {
    return {
      title: item.title,
      body: item.body,
      badge: bn ? 'সম্প্রচার বিজ্ঞপ্তি' : 'Official Notice',
      isBroadcast: true,
      original: false,
    };
  }

  if (item.type === 'report_response') {
    return {
      title: item.title || (bn ? 'আপনার রিপোর্টের প্রশাসনিক প্রতিক্রিয়া' : 'Admin Response to Your Report'),
      body: item.body,
      badge: bn ? 'অ্যাডমিন প্রতিক্রিয়া (ব্যক্তিগত)' : 'Admin Response (Private)',
      isReportResponse: true,
      original: false,
    };
  }

  if (item.type === 'claim_decision') {
    return {
      title: item.title,
      body: item.body,
      badge: bn ? 'মালিকানার আবেদন সিদ্ধান্ত' : 'Claim Decision',
      isClaim: true,
      original: false,
    };
  }

  if (item.type === 'case_alert') {
    const destination = notificationDestination(item.url);
    const code = destination?.match(/^\/scam-alerts\/([A-Za-z0-9][A-Za-z0-9_-]{0,99})$/)?.[1]
      ?? item.body.match(/^([A-Za-z0-9][A-Za-z0-9_-]{0,99}): A reviewed public case update is available\. Platform review is not a finding of legal guilt\.$/)?.[1];
    return {
      title: bn ? 'প্রশাসক পর্যালোচিত প্রকাশ্য কেসের সতর্কতা' : 'Admin-reviewed public case alert',
      body: (code ? code + ': ' : '') + (bn ? 'পর্যালোচিত প্রকাশ্য কেসের আপডেট পাওয়া যাচ্ছে। প্ল্যাটফর্মের পর্যালোচনা আইনি অপরাধের সিদ্ধান্ত নয়।' : 'A reviewed public case update is available. Platform review is not a finding of legal guilt.'),
      badge: bn ? 'কেস সতর্কতা' : 'Case Alert',
      original: false
    };
  }

  if (item.type === 'review_comment' && item.title === 'New comment on your review' && item.body === 'Someone joined the conversation on your review.') {
    return {
      title: bn ? 'আপনার রিভিউতে নতুন মন্তব্য' : item.title,
      body: bn ? 'আপনার রিভিউয়ের আলোচনায় কেউ যুক্ত হয়েছে।' : item.body,
      badge: bn ? 'মন্তব্য' : 'Comment',
      original: false
    };
  }

  return { title: item.title, body: item.body, original: bn };
}
