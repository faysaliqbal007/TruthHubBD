import type {Language} from './LanguageContext';
import {divisions,districts,upazilas} from '../data/bd-locations';
const areaNames = new Map([...divisions,...districts,...upazilas].map(area=>[area.name,area.nameBn]));
/** Translate controlled directory area labels; arbitrary addresses remain as supplied. */
export function translateArea(value: string | undefined, lang: Language) {
  if (!value || lang==='en') return value || '';
  if (value==='All Bangladesh (সারাদেশ)' || value==='All Bangladesh') return 'সারাদেশ';
  if (value==='Online Only · শুধু অনলাইন' || value==='Online Only') return 'শুধু অনলাইন';
  return value.split(',').map(part=>{
    const text=part.trim();
    if (text==='Bangladesh') return 'বাংলাদেশ';
    if (areaNames.has(text)) return areaNames.get(text)!;
    if (text.endsWith(' Division')) return (areaNames.get(text.slice(0,-9))||text.slice(0,-9))+' বিভাগ';
    if (text.endsWith(' District (All Upazilas)')) return (areaNames.get(text.slice(0,-24))||text.slice(0,-24))+' জেলা (সব উপজেলা)';
    return text;
  }).join(', ');
}
export function formatNumber(value: number, lang: Language, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', options).format(value);
}
export function formatDate(value: string | Date | undefined | null, lang: Language) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return lang === 'bn' ? 'তারিখ দেওয়া নেই' : 'Date not provided';
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka'}).format(date);
}
const categories: Record<string, string> = {
  'All': 'সব', 'All Categories': 'সব বিভাগ', 'Products': 'পণ্য', 'Businesses & Services': 'প্রতিষ্ঠান ও সেবা',
  'Doctors & Professionals': 'চিকিৎসক ও পেশাজীবী', 'Hospitals & Clinics': 'হাসপাতাল ও ক্লিনিক',
  'Universities & Education': 'বিশ্ববিদ্যালয় ও শিক্ষা', 'Courier & Digital Services': 'কুরিয়ার ও ডিজিটাল সেবা',
  'Online Electronics Shop': 'অনলাইন ইলেকট্রনিকসের দোকান', 'Overseas Education Consultancy': 'বিদেশে শিক্ষার পরামর্শসেবা',
  'E-Commerce Marketplace': 'ই-কমার্স মার্কেটপ্লেস', 'Healthcare & Clinics': 'স্বাস্থ্যসেবা ও ক্লিনিক',
  'E-Commerce': 'ই-কমার্স', 'Electronics': 'ইলেকট্রনিক্স', 'Education': 'শিক্ষা',
  'Home & Living': 'হোম ও লিভিং', 'Home & Decor': 'গৃহসজ্জা ও হোম ডেকর',
};
export function translateCategory(value: string | undefined, lang: Language) { return value ? lang === 'bn' ? categories[value] || value : value === 'Businesses & Services' ? 'Organizations & Services' : value : ''; }
const statuses: Record<string, string> = {
  published: 'প্রকাশিত', resolved: 'সমাধান হয়েছে', under_review: 'পর্যালোচনাধীন', 'business responded': 'প্রতিষ্ঠান উত্তর দিয়েছে',
  business_responded: 'প্রতিষ্ঠান উত্তর দিয়েছে', 'organization responded': 'প্রতিষ্ঠান জবাব দিয়েছে', organization_responded: 'প্রতিষ্ঠান জবাব দিয়েছে',
  submitted: 'জমা হয়েছে', needs_evidence: 'আরও প্রমাণ দরকার',
  not_enough_evidence: 'প্রমাণ অপর্যাপ্ত', restricted: 'সীমিত', removed: 'সরানো হয়েছে', limited: 'সীমিত',
  approved: 'অনুমোদিত', rejected: 'অনুমোদন হয়নি', open: 'খোলা', closed: 'বন্ধ', unknown: 'জানা নেই',
  disputed: 'বিরোধপূর্ণ', needs_review: 'পর্যালোচনা প্রয়োজন', need_evidence: 'আরও প্রমাণ দরকার', needsevidence: 'আরও প্রমাণ দরকার',
  underreview: 'পর্যালোচনাধীন', unavailable: 'পাওয়া যাচ্ছে না', pending: 'অপেক্ষায় আছে', trending: 'আলোচিত',
  'scam alert': 'প্রতারণা সতর্কতা', scam_alert: 'প্রতারণা সতর্কতা',
  'not publicly disclosed': 'উন্মুক্তভাবে প্রকাশ করা হয়নি', not_publicly_disclosed: 'উন্মুক্তভাবে প্রকাশ করা হয়নি',
  'not disclosed': 'অপ্রকাশিত', not_disclosed: 'অপ্রকাশিত',
  'platform-reviewed report': 'প্ল্যাটফর্মে পর্যালোচিত রিপোর্ট', 'sample case': 'নমুনা কেস',
  non_delivery: 'পণ্য বা সেবা পাওয়া যায়নি', payment: 'অর্থ পরিশোধের সমস্যা', impersonation: 'পরিচয় নকল',
  misleading_offer: 'বিভ্রান্তিকর অফার', bribery: 'ঘুষ দেওয়া/নেওয়া', other: 'অন্য / নিশ্চিত নই',
};
export function translateStatus(value: string, lang: Language) {
  if (!value) return '';
  const key = value.toLowerCase().trim();
  const underscoreKey = key.replaceAll(' ', '_');
  return lang === 'bn' ? statuses[key] || statuses[underscoreKey] || value : key === 'business responded' ? 'Organization responded' : value.replaceAll('_', ' ');
}
/** Translate known server messages only; retain unknown errors instead of inventing a diagnosis. */
export function localizedError(value: string | undefined, lang: Language, fallback = 'The request could not be completed.') {
  const message = value || fallback;
  const errors: Record<string, string> = {
    'Please sign in to continue.': 'এগিয়ে যেতে সাইন ইন করুন।',
    'Could not establish a secure session.': 'নিরাপদ সেশন তৈরি করা যায়নি। আবার চেষ্টা করুন।',
    'The server returned an unavailable response. Please retry shortly.': 'সার্ভার থেকে সঠিক উত্তর পাওয়া যায়নি। একটু পরে আবার চেষ্টা করুন।',
    'The request could not be completed.': 'অনুরোধটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।',
    'You cannot vote on your own review.': 'নিজের রিভিউয়ে ভোট দেওয়া যায় না।',
    'Directory unavailable. Check the backend and retry; demo data is not substituted.': 'ডিরেক্টরি লোড করা যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
    'Failed to fetch': 'সার্ভারের সঙ্গে সংযোগ করা যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
    'NetworkError when attempting to fetch resource.': 'সার্ভারের সঙ্গে সংযোগ করা যায়নি। আবার চেষ্টা করুন।',
    'Unauthenticated.': 'এগিয়ে যেতে সাইন ইন করুন।',
    'This action is unauthorized.': 'এই কাজটি করার অনুমতি আপনার অ্যাকাউন্টে নেই।',
    'The given data was invalid.': 'জমা দেওয়া তথ্য সঠিক নয়। চিহ্নিত ঘরগুলো দেখে আবার চেষ্টা করুন।',
  };
  return lang === 'bn' ? errors[message] || message : message;
}
