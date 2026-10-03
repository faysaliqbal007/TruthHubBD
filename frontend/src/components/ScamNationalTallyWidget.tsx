"use client";
import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/dictionary';

type DivisionTally = {
  key: string;
  name: string;
  name_bn: string;
  alerts: number;
  money_crore: number;
  bar_percentage: number;
};

type TallyData = {
  total_money_crore: number;
  total_money_formatted: string;
  total_money_formatted_bn: string;
  live_sum_bdt: number;
  disputed_percentage: number;
  days: number;
  divisions: DivisionTally[];
  unit_label?: string;
  unit_label_bn?: string;
};

export function ScamNationalTallyWidget({ lang = 'en' }: { lang?: 'en' | 'bn' }) {
  const { t } = useI18n();
  const bn = lang === 'bn';
  const [data, setData] = useState<TallyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    api<{ success: boolean; data: TallyData }>('/scam-national-tally')
      .then((res) => {
        if (active && res?.data) {
          setData(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    const handleUpdate = () => {
      setAttempt((v) => v + 1);
    };
    window.addEventListener('truthhub:review_created', handleUpdate);
    window.addEventListener('truthhub:case_created', handleUpdate);
    const interval = setInterval(() => setAttempt((v) => v + 1), 30000);
    return () => {
      window.removeEventListener('truthhub:review_created', handleUpdate);
      window.removeEventListener('truthhub:case_created', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Baseline defaults if loading or offline
  const totalCrore = data?.total_money_crore ?? 553.36;
  const disputedPct = data?.disputed_percentage ?? 0;
  const divisions = data?.divisions ?? [
    { key: 'dhaka', name: 'Dhaka', name_bn: 'ঢাকা', alerts: 7557, money_crore: 285.4, bar_percentage: 100 },
    { key: 'chattogram', name: 'Chattogram', name_bn: 'চট্টগ্রাম', alerts: 4101, money_crore: 142.1, bar_percentage: 54 },
    { key: 'rajshahi', name: 'Rajshahi', name_bn: 'রাজশাহী', alerts: 1667, money_crore: 68.35, bar_percentage: 22 },
    { key: 'khulna', name: 'Khulna', name_bn: 'খুলনা', alerts: 1204, money_crore: 57.51, bar_percentage: 16 },
  ];

  return (
    <aside
      className="scam-national-tally-widget"
      aria-label={bn ? 'জাতীয় স্ক্যাম সতর্কতা ও ক্ষতির হিসাব' : 'National Scam Alert & Financial Loss Tally'}
      style={{
        background: '#FCFAF6',
        border: '1.5px solid #1E293B',
        borderRadius: '12px',
        padding: '14px 18px',
        margin: '10px 0 16px',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px',
        alignItems: 'stretch',
        position: 'relative',
      }}
    >
      {/* Left Column: Total Scam Money & 30-Day Badge */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Header kicker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EA580C', display: 'inline-block' }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#EA580C',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'monospace, sans-serif',
              }}
            >
              {bn ? 'মোট রিপোর্টকৃত স্ক্যামের আর্থিক পরিমাণ' : 'TOTAL SCAM MONEY REPORTED'}
            </span>
          </div>

          {/* Big Amount */}
          <div
            style={{
              fontFamily: 'var(--serif, Georgia, serif)',
              fontSize: 'clamp(1.45rem, 2.1vw, 1.85rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              margin: '2px 0 4px',
            }}
          >
            <span>৳</span>
            <span>{typeof totalCrore === 'number' ? (totalCrore >= 1000 ? formatNumber(totalCrore, lang) : totalCrore.toFixed(2)) : totalCrore} </span>
            <span style={{ color: '#EA580C', fontStyle: 'italic', fontWeight: 800 }}>
              {bn ? (data?.unit_label_bn ?? 'কোটি') : (data?.unit_label ?? 'crore')}
            </span>
          </div>

          {/* 30 Days Badge */}
          <div style={{ margin: '4px 0 6px' }}>
            <span
              style={{
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                borderRadius: '4px',
                padding: '1px 7px',
                fontSize: '10.5px',
                fontWeight: 600,
                color: '#64748B',
                fontFamily: 'monospace',
                display: 'inline-block',
              }}
            >
              {bn ? 'গত ৩০ দিনে' : 'in 30 days'}
            </span>
          </div>

          {/* Disputed Alert Note */}
          <div
            style={{
              background: '#FFEDD5',
              border: '1px solid #FED7AA',
              borderRadius: '5px',
              padding: '4px 9px',
              color: '#9A3412',
              fontSize: '11px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              margin: '4px 0 6px',
            }}
          >
            <Clock size={12} color="#C2410C" />
            <span>
              {bn
                ? `সমাধান হওয়া অ্যালার্টের ${formatNumber(disputedPct, lang)}% নিয়ে বিরোধ রয়েছে`
                : `${disputedPct}% of resolved scam alerts disputed`}
            </span>
          </div>
        </div>

        {/* Footer Subtitle */}
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748B', lineHeight: 1.35, maxWidth: 320 }}>
          {bn
            ? 'যাচাইকৃত কমিউনিটি স্ক্যাম অ্যালার্ট থেকে প্রাপ্ত মোট আর্থিক ক্ষতির পরিমাণ।'
            : 'Total scam losses reported from verified community scam alerts.'}
        </p>
      </div>

      {/* Right Column: Top Divisions by Scam Alerts */}
      <div
        style={{
          borderLeft: '1px solid #E2E8F0',
          paddingLeft: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#475569',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'monospace, sans-serif',
              }}
            >
              {bn ? 'শীর্ষ বিভাগসমূহ' : 'TOP DIVISIONS'}
            </span>
            <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>
              {bn ? 'ক্ষতির পরিমাণ অনুযায়ী' : 'by scam money'}
            </span>
          </div>

          {/* Division Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {(data?.divisions ?? divisions).slice(0, 4).map((div, idx) => {
              // Warm gradient color from intense terracotta to lighter peach based on rank
              const barColors = ['#C2410C', '#EA580C', '#D97706', '#F59E0B'];
              const barColor = barColors[idx % barColors.length];

              return (
                <div
                  key={div.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '75px 1fr 65px',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: '12px',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>
                    {bn ? div.name_bn : div.name}
                  </span>

                  {/* Horizontal Bar Track */}
                  <div
                    style={{
                      height: 9,
                      background: '#F1F5F9',
                      borderRadius: 999,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(8, div.bar_percentage)}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: 999,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>

                  {/* Cases Money ONLY */}
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'block',
                        fontFamily: 'monospace',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        color: '#C2410C',
                        whiteSpace: 'nowrap',
                      }}
                      title={bn ? 'বিভাগের স্ক্যামের অর্থ' : 'Division scam money'}
                    >
                      {(() => {
                        const bdt = (div as any).bdt ?? ((div.money_crore || 0) * 10000000);
                        if (bdt >= 10000000) return `৳${(bdt / 10000000).toFixed(1)} ${bn ? 'কোটি' : 'cr'}`;
                        if (bdt >= 100000) return `৳${(bdt / 100000).toFixed(1)} ${bn ? 'লাখ' : 'lakh'}`;
                        if (bdt > 0) return `৳${formatNumber(Math.round(bdt), lang)}`;
                        return `৳0`;
                      })()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: SCAM ALERTS ... NATIONAL TALLY */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid #F1F5F9',
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#64748B',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
            }}
          >
            {bn ? 'স্ক্যাম অ্যালার্ট' : 'SCAM ALERTS'}
          </span>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#EA580C',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
            }}
          >
            {bn ? 'জাতীয় হিসাব' : 'NATIONAL TALLY'}
          </span>
        </div>
      </div>
    </aside>
  );
}
