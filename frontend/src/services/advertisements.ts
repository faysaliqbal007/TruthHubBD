import type {Language} from '../i18n/LanguageContext';

export type AdSector = 'education' | 'healthcare' | 'recruitment' | 'general' | (string & {});
export type AdStatus = 'draft' | 'published' | 'paused' | 'archived';
export type Advertisement = {
  id: number;
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
  bullets_en: string[];
  bullets_bn: string[];
  sector: AdSector;
  ticker_text_en?: string|null; ticker_text_bn?: string|null;
  published_at?: string|null;
  is_sample: boolean;
  label?: string;
  starts_at: string | null;
  ends_at: string | null;
  destination_url: string | null;
  organization: {id: number; name: string; bengali_name?: string | null; slug: string; url: string} | null;
  image: {kind: 'illustration' | 'photo' | 'creative'; url: string; alt: string};
};
export type ManagedAdvertisement = Advertisement & {
  status: AdStatus;
  organization_id: number | null;
  image_source: 'illustration' | 'organization_photo' | 'creative_image';
  creative_image_path?: string | null;
  illustration_theme: AdSector;
  display_order: number;
  decision_rationale?: string;
  show_in_ticker: boolean;
};
export type AdvertisementDraft = {
  title_en: string; title_bn: string; body_en: string; body_bn: string;
  bullets_en: string; bullets_bn: string; sector: AdSector;
  organization_id: number | null; destination_url: string;
  image_source: 'illustration' | 'organization_photo' | 'creative_image'; illustration_theme: AdSector;
  creative_image_path: string;
  show_in_ticker: boolean; ticker_text_en:string; ticker_text_bn:string;
  starts_at: string; ends_at: string; display_order: string; decision_rationale: string;
};
export type AdvertisementWrite = Omit<AdvertisementDraft, 'bullets_en' | 'bullets_bn' | 'starts_at' | 'ends_at' | 'destination_url' | 'display_order'> & {
  bullets_en: string[]; bullets_bn: string[]; starts_at: string | null; ends_at: string | null;
  destination_url: string | null; display_order: number; status: AdStatus;
};
export type AdvertisementTickerSettings={enabled:boolean;policy_en:string;policy_bn:string};
export type AdvertisementTicker=AdvertisementTickerSettings&{items:Advertisement[]};
export type AdvertisementTickerWrite=AdvertisementTickerSettings&{decision_rationale:string};

const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const sectors: AdSector[] = ['education', 'healthcare', 'recruitment', 'general'];

export class AdvertisementApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;
  constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}) {
    super(message); this.name = 'AdvertisementApiError'; this.status = status; this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, method = 'GET', body?: AdvertisementWrite|AdvertisementTickerWrite, signal?: AbortSignal): Promise<T> {
  const staff = path.startsWith('/admin/');
  if (method !== 'GET') {
    const csrf = await fetch(`${base}/sanctum/csrf-cookie`, {credentials: 'include', headers: {Accept: 'application/json'}, signal});
    if (!csrf.ok) throw new AdvertisementApiError('Could not establish a secure session. Please try again.', csrf.status);
  }
  const token = staff && typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)?.[1] : null;
  const response = await fetch(`${base}/api${path}`, {
    method, signal, credentials: staff ? 'include' : 'omit',
    headers: {Accept: 'application/json', ...(token ? {'X-XSRF-TOKEN': decodeURIComponent(token)} : {}), ...(body ? {'Content-Type': 'application/json'} : {})},
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => {throw new AdvertisementApiError('Advertisements are unavailable. Please try again.', response.status);});
  if (!response.ok) throw new AdvertisementApiError(response.status === 401 ? 'Please sign in to continue.' : result.message ?? 'The advertisement could not be saved.', response.status, result.errors ?? {});
  return result as T;
}

export async function getPublicAdvertisements(signal?: AbortSignal): Promise<Advertisement[]> {
  return (await request<{data: Advertisement[]}>('/advertisements', 'GET', undefined, signal)).data;
}
export async function getPublicAdvertisementTicker(signal?:AbortSignal):Promise<AdvertisementTicker>{return (await request<{data:AdvertisementTicker}>('/advertisement-ticker','GET',undefined,signal)).data;}
export async function getAdvertisementTickerSettings(signal?:AbortSignal):Promise<AdvertisementTickerSettings>{return (await request<{data:AdvertisementTickerSettings}>('/admin/advertisement-ticker','GET',undefined,signal)).data;}
export async function saveAdvertisementTickerSettings(payload:AdvertisementTickerWrite):Promise<AdvertisementTickerSettings>{return (await request<{data:AdvertisementTickerSettings}>('/admin/advertisement-ticker','PATCH',payload)).data;}
export async function getManagedAdvertisements(signal?: AbortSignal): Promise<ManagedAdvertisement[]> {
  return (await request<{data: ManagedAdvertisement[]}>('/admin/advertisements', 'GET', undefined, signal)).data;
}
export async function saveAdvertisement(id: number | null, payload: AdvertisementWrite): Promise<ManagedAdvertisement> {
  const path = id ? `/admin/advertisements/${id}` : '/admin/advertisements';
  return (await request<{data: ManagedAdvertisement}>(path, id ? 'PATCH' : 'POST', payload)).data;
}

export async function uploadAdvertisementImage(file: File): Promise<string> {
  const csrf = await fetch(`${base}/sanctum/csrf-cookie`, {credentials: 'include', headers: {Accept: 'application/json'}});
  if (!csrf.ok) throw new AdvertisementApiError('Could not establish a secure session. Please try again.', csrf.status);
  const token = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)?.[1] : null;
  const formData = new FormData();
  formData.append('image', file);
  const response = await fetch(`${base}/api/admin/advertisements/upload-image`, {
    method: 'POST',
    credentials: 'include',
    headers: {Accept: 'application/json', ...(token ? {'X-XSRF-TOKEN': decodeURIComponent(token)} : {})},
    body: formData,
  });
  const result = await response.json().catch(() => {throw new AdvertisementApiError('Image upload failed. Please try again.', response.status);});
  if (!response.ok) throw new AdvertisementApiError(result.message ?? 'Image upload failed.', response.status, result.errors ?? {});
  return result.url;
}

export function adText(ad: Advertisement, field: 'title' | 'body', lang: Language): string {
  return (lang === 'bn' ? ad[`${field}_bn`] : ad[`${field}_en`]) || ad[`${field}_en`];
}
export function adBullets(ad: Advertisement, lang: Language): string[] {
  return (lang === 'bn' && ad.bullets_bn?.length ? ad.bullets_bn : ad.bullets_en ?? []).slice(0, 3);
}
export function adSectorLabel(sector: string, lang: Language): string {
  const values: Record<string, [string, string]> = {
    education: ['Education & learning', 'শিক্ষা ও দক্ষতা'],
    healthcare: ['Healthcare', 'স্বাস্থ্যসেবা'],
    recruitment: ['Recruitment', 'নিয়োগ বিজ্ঞপ্তি'],
    general: ['Organization & services', 'প্রতিষ্ঠান ও সেবা']
  };
  return (values[sector.toLowerCase()] ?? [sector, sector])[lang === 'bn' ? 1 : 0];
}
export function safeHttpsAdUrl(value: string | null): string | null {
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')
      || !host.includes('.') || !/^[a-z0-9.-]+$/.test(host) || /^\d+(?:\.\d+){3}$/.test(host)
      || /(?:^|\.)(localhost|local|internal|test|invalid|example)$/.test(host)) return null;
    return url.href;
  } catch {return null;}
}
export function adDestination(ad: Advertisement): {url: string; external: boolean} | null {
  const external = safeHttpsAdUrl(ad.destination_url);
  if (external) return {url: external, external: true};
  const url = ad.organization?.url;
  return url && /^\/business\/[a-zA-Z0-9_-]+$/.test(url) ? {url, external: false} : null;
}
export function adIllustration(sector: string): string {
  return `/advertisement-media/${sectors.includes(sector as AdSector) ? sector : 'general'}.svg`;
}
export function adImageUrl(ad: Advertisement): {url: string; photo: boolean} {
  const creative = (ad as ManagedAdvertisement).creative_image_path;
  if (creative) {
    if (creative.startsWith('/uploads/advertisements/')) return {url: base + creative, photo: true};
    if (creative.startsWith('http://') || creative.startsWith('https://')) return {url: creative, photo: true};
    if (creative.startsWith('/advertisement-media/reference-')) return {url: creative, photo: false};
  }
  if (ad.image?.kind === 'creative') {
    if (/^\/advertisement-media\/reference-(education|healthcare|recruitment)\.jpg$/.test(ad.image.url)) {
      return {url: ad.image.url, photo: false};
    }
    if (/^\/uploads\/advertisements\/[a-zA-Z0-9_\.-]+$/.test(ad.image.url)) {
      return {url: base + ad.image.url, photo: true};
    }
  }
  if (ad.image?.kind === 'photo' && /^\/api\/businesses\/\d+\/profile-image$/.test(ad.image.url)) {
    return {url: base + ad.image.url, photo: true};
  }
  const path = ad.image?.kind === 'illustration' && /^\/advertisement-media\/(education|healthcare|recruitment|general)\.svg$/.test(ad.image.url)
    ? ad.image.url
    : adIllustration(ad.sector);
  return {url: path, photo: false};
}
export function scheduleText(ad: Pick<Advertisement, 'starts_at' | 'ends_at'|'published_at'>, lang: Language): string {
  const format = (value: string) => new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka'}).format(new Date(value));
  const valid = (value: string | null | undefined) => value && !Number.isNaN(new Date(value).getTime());
  if (valid(ad.starts_at) && valid(ad.ends_at)) return `${format(ad.starts_at!)} — ${format(ad.ends_at!)}`;
  if (valid(ad.ends_at)) return (lang === 'bn' ? 'শেষ: ' : 'Until ') + format(ad.ends_at!);
  if (valid(ad.starts_at)) return (lang === 'bn' ? 'শুরু: ' : 'From ') + format(ad.starts_at!);
  if(valid(ad.published_at))return (lang==='bn'?'প্রকাশিত: ':'Published ')+format(ad.published_at!);
  return lang === 'bn' ? 'প্রকাশের তারিখ দেওয়া নেই' : 'Publication date not supplied';
}
export function dhakaDateInput(value: string | null): string {
  if (!value || Number.isNaN(new Date(value).getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(new Date(value));
  const get = (kind: string) => parts.find(part => part.type === kind)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
export function dhakaDateIso(value: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(value + ':00+06:00');
  return Number.isNaN(date.getTime()) || dhakaDateInput(date.toISOString()) !== value ? null : date.toISOString();
}
export function blankAdDraft(): AdvertisementDraft {
  return {
    title_en: '', title_bn: '',
    body_en: '', body_bn: '',
    bullets_en: '', bullets_bn: '',
    sector: 'general',
    organization_id: null,
    destination_url: '',
    image_source: 'illustration',
    illustration_theme: 'general',
    creative_image_path: '',
    show_in_ticker: true,
    ticker_text_en: '',
    ticker_text_bn: '',
    starts_at: '',
    ends_at: '',
    display_order: '0',
    decision_rationale: 'Updated via advertisement desk.'
  };
}
export function draftFromAdvertisement(ad: ManagedAdvertisement): AdvertisementDraft {
  return {
    title_en: ad.title_en,
    title_bn: ad.title_bn,
    body_en: ad.body_en,
    body_bn: ad.body_bn,
    bullets_en: (ad.bullets_en ?? []).join('\n'),
    bullets_bn: (ad.bullets_bn ?? []).join('\n'),
    sector: ad.sector,
    organization_id: ad.organization_id,
    destination_url: ad.destination_url ?? '',
    image_source: ad.image_source || 'creative_image',
    illustration_theme: ad.illustration_theme || 'general',
    creative_image_path: ad.creative_image_path ?? '',
    show_in_ticker: ad.show_in_ticker ?? true,
    ticker_text_en: ad.ticker_text_en ?? '',
    ticker_text_bn: ad.ticker_text_bn ?? '',
    starts_at: dhakaDateInput(ad.starts_at),
    ends_at: dhakaDateInput(ad.ends_at),
    display_order: String(ad.display_order ?? '0'),
    decision_rationale: ad.decision_rationale ?? 'Updated via advertisement desk.'
  };
}
const bulletLines = (value: string) => value ? value.split(/\r?\n/).map(line => line.trim()).filter(Boolean) : [];
export function validateAdDraft(draft: AdvertisementDraft, lang: Language): Record<string, string> {
  const errors: Record<string, string> = {}; const bn = lang === 'bn';
  for (const field of ['title_en', 'title_bn', 'body_en', 'body_bn'] as const) {
    const max = field.startsWith('title') ? 140 : 1000;
    if (!draft[field].trim()) errors[field] = bn ? 'এই তথ্যটি লিখুন।' : 'Enter this field.';
    else if (draft[field].trim().length > max) errors[field] = bn ? `সর্বোচ্চ ${max} অক্ষর লিখুন।` : `Use no more than ${max} characters.`;
  }
  if (bulletLines(draft.bullets_en).length > 3) errors.bullets_en = bn ? 'সর্বোচ্চ ৩টি হাইলাইট লিখুন।' : 'Use at most 3 highlights.';
  if (bulletLines(draft.bullets_bn).length > 3) errors.bullets_bn = bn ? 'সর্বোচ্চ ৩টি হাইলাইট লিখুন।' : 'Use at most 3 highlights.';
  if (!draft.decision_rationale.trim() || draft.decision_rationale.trim().length < 10) errors.decision_rationale = bn ? 'অন্তত ১০টি অক্ষরে সিদ্ধান্তের কারণ লিখুন।' : 'Enter a rationale of at least 10 characters.';
  if (draft.destination_url.trim() && !safeHttpsAdUrl(draft.destination_url.trim())) errors.destination_url = bn ? 'প্রকাশ্য ওয়েবসাইটের সম্পূর্ণ HTTPS লিংক দিন।' : 'Use a complete HTTPS link to a public website.';
  if (draft.image_source === 'creative_image' && !/^\/(advertisement-media\/reference-(education|healthcare|recruitment)\.jpg|uploads\/advertisements\/[a-zA-Z0-9_\.-]+)$/.test(draft.creative_image_path)) {
    errors.creative_image_path = bn ? 'অনুমোদিত ক্রিয়েটিভ ইমেজ নির্বাচন বা আপলোড করুন।' : 'Select or upload an approved creative image.';
  }
  for (const key of ['ticker_text_en','ticker_text_bn'] as const) if (draft[key].trim().length > 500) errors[key] = bn ? 'সর্বোচ্চ ৫০০ অক্ষর দিন।' : 'Use no more than 500 characters.';
  const start = dhakaDateIso(draft.starts_at), end = dhakaDateIso(draft.ends_at);
  if (draft.starts_at && !start) errors.starts_at = bn ? 'সঠিক শুরুর তারিখ ও সময় দিন।' : 'Enter a valid start date and time.';
  if (draft.ends_at && !end) errors.ends_at = bn ? 'সঠিক শেষের তারিখ ও সময় দিন।' : 'Enter a valid end date and time.';
  if (start && end && end <= start) errors.ends_at = bn ? 'শেষের সময় শুরুর সময়ের পরে হতে হবে।' : 'The end must be after the start.';
  if (!/^\d+$/.test(draft.display_order) || Number(draft.display_order) > 10000) errors.display_order = bn ? '০ থেকে ১০০০০-এর মধ্যে একটি পূর্ণসংখ্যা দিন।' : 'Use a whole number from 0 to 10,000.';
  return errors;
}
export function adWritePayload(draft: AdvertisementDraft, status: AdStatus): AdvertisementWrite {
  const rationale = (draft.decision_rationale || '').trim();
  const validRationale = rationale.length >= 10 ? rationale : 'Updated via advertisement desk.';
  const imageSource = draft.creative_image_path ? 'creative_image' : (draft.image_source || 'illustration');
  return {
    ...draft,
    title_en: draft.title_en.trim(),
    title_bn: draft.title_bn.trim(),
    body_en: draft.body_en.trim(),
    body_bn: draft.body_bn.trim(),
    bullets_en: bulletLines(draft.bullets_en),
    bullets_bn: bulletLines(draft.bullets_bn),
    organization_id: draft.organization_id || null,
    destination_url: draft.destination_url.trim() || null,
    image_source: imageSource,
    illustration_theme: (['education','healthcare','recruitment'].includes(draft.sector) ? draft.sector : 'general') as AdSector,
    creative_image_path: draft.creative_image_path.trim(),
    starts_at: dhakaDateIso(draft.starts_at),
    ends_at: dhakaDateIso(draft.ends_at),
    display_order: Number(draft.display_order) || 0,
    decision_rationale: validRationale,
    status
  };
}
