import type {Language} from './LanguageContext';
export type PublicTextField = 'title' | 'body' | 'summary';
export type PublicTranslations = Partial<Record<Language, Partial<Record<PublicTextField, string>>>>;
export type PublicText = {title?: string; body?: string; summary?: string; translations?: PublicTranslations};
/** APIs expose only approved public translations. Original user text is never machine translated here. */
export function publicText(item: PublicText, field: PublicTextField, lang: Language) {
  const approved = item.translations?.[lang]?.[field];
  return typeof approved === 'string' && approved.trim() ? approved : item[field] || '';
}
export function hasApprovedTranslation(item: PublicText, lang: Language, fields: PublicTextField[]) {
  return fields.every(field => typeof item.translations?.[lang]?.[field] === 'string' && !!item.translations[lang]![field]!.trim());
}
export function originalTextLabel(item: PublicText, lang: Language, fields: PublicTextField[]) {
  return lang === 'bn' && !hasApprovedTranslation(item, lang, fields) ? 'মূল লেখা · অনুমোদিত বাংলা অনুবাদ নেই' : '';
}
