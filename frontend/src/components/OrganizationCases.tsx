"use client";
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Plus } from 'lucide-react';
import { useBusinessCases } from '../services/cases';
import { useI18n } from '../i18n/LanguageContext';
import { formatDate, formatNumber, translateStatus, localizedError } from '../i18n/dictionary';
import { publicText } from '../i18n/content';
import './organization-cases.css';

export function OrganizationCases({ slug, businessId }: { slug: string; businessId?: number }) {
  const { lang, t } = useI18n();
  const { cases, loading, error, total, retry } = useBusinessCases(slug);
  const submitUrl = businessId ? `/scam-alerts/submit?business_id=${businessId}` : '/scam-alerts/submit';

  return (
    <section id="organization-reports" className="organization-cases">
      <header className="org-cases-header">
        <div className="org-cases-header-left">
          <AlertTriangle size={18} aria-hidden="true" className="org-cases-icon" />
          <div className="org-cases-heading-wrap">
            <span className="civic-kicker">{t('REPORTS & RESPONSES', 'রিপোর্ট ও প্রতিক্রিয়া')}</span>
            <h2>
              {t('Public cases', 'পাবলিক কেস')}{' '}
              {!loading && !error && <span>({formatNumber(total, lang)})</span>}
            </h2>
          </div>
        </div>
        <Link
          to={submitUrl}
          className="org-cases-submit-btn"
          title={t("Submit a case or report against this organization", "এই প্রতিষ্ঠানের বিরুদ্ধে কেস বা অভিযোগ জমা দিন")}
        >
          <Plus size={13} strokeWidth={2.5} aria-hidden="true" />
          <span>{t('Submit Case', 'কেস জমা দিন')}</span>
        </Link>
      </header>

      <p className="organization-case-context">
        {t(
          'Published after platform review. These are attributed reports—not findings of guilt.',
          'প্ল্যাটফর্মের পর্যালোচনার পর প্রকাশিত। এগুলো রিপোর্টের বিবরণ—অপরাধ প্রমাণের রায় নয়।'
        )}
      </p>

      {loading ? (
        <p role="status">{t('Loading case updates…', 'ঘটনার আপডেট লোড হচ্ছে…')}</p>
      ) : error ? (
        <div role="alert">
          <p>{localizedError(error, lang)}</p>
          <button type="button" className="btn-pill-light" onClick={retry}>
            {t('Try again', 'আবার চেষ্টা করুন')}
          </button>
        </div>
      ) : cases.length ? (
        <div>
          {cases.slice(0, 3).map((item) => (
            <article className="organization-case-item" key={item.id}>
              <div>
                <span>
                  {item.is_demo
                    ? t('Sample case', 'নমুনা কেস')
                    : t('Platform-reviewed report', 'প্ল্যাটফর্মে পর্যালোচিত রিপোর্ট')}
                </span>
                <strong>{translateStatus(item.status, lang)}</strong>
              </div>
              <Link to={'/scam-alerts/' + item.caseCode}>
                <h3>{publicText(item, 'title', lang)}</h3>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <p>{publicText(item, 'summary', lang)}</p>
              <small>
                {item.caseCode} · {formatDate(item.date, lang)}
              </small>
              {item.linked_review && (
                <Link className="organization-review-link" to={item.linked_review.url}>
                  {t('Read the linked review', 'সংশ্লিষ্ট রিভিউ পড়ুন')}
                </Link>
              )}
            </article>
          ))}
          {total > 3 && (
            <Link className="btn-pill-light" to={'/scam-alerts?q=' + encodeURIComponent(cases[0]?.entity || '')}>
              {t('More public updates', 'আরও প্রকাশ্য আপডেট')}
            </Link>
          )}
        </div>
      ) : (
        <p>
          {t(
            'No public case updates for this organization. This is not a safety certification.',
            'এই প্রতিষ্ঠানের প্রকাশ্য কেস আপডেট নেই। এটি নিরাপদ হওয়ার সনদ নয়।'
          )}
        </p>
      )}
    </section>
  );
}
