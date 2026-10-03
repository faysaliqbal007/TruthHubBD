"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Flag,
  HelpCircle,
  Lock,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import './static-pages.css';

export function TrustSafetyPage() {
  const { lang } = useI18n();
  const bn = lang === 'bn';

  return (
    <div className="info-page-container">
      {/* Breadcrumb Navigation */}
      <nav className="info-breadcrumb" aria-label={bn ? 'অবস্থান' : 'Breadcrumb'}>
        <Link to="/">{bn ? 'মূল পাতা' : 'Home'}</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: '#1e293b' }}>{bn ? 'আস্থা ও নিরাপত্তা' : 'Trust & Safety'}</span>
      </nav>

      {/* Hero Section */}
      <section className="info-hero" aria-labelledby="safety-hero-title">
        <span className="info-hero-eyebrow">
          <ShieldCheck size={14} aria-hidden="true" />
          {bn ? 'দায়িত্বশীল প্ল্যাটফর্ম ও নাগরিক সুরক্ষা' : 'RESPONSIBLE CITIZEN PLATFORM & CONSUMER SAFETY'}
        </span>
        <h1 id="safety-hero-title">
          {bn ? 'আস্থা, নিরাপত্তা ও নিয়মানুবর্তিতা' : 'Trust & Safety on TruthHubBD'}
        </h1>
        <p className="info-hero-subtitle">
          {bn
            ? 'স্বচ্ছ নীতিমালা, গঠনমূলক নাগরিক অংশগ্রহণ, প্রমাণের সুরক্ষা এবং বাংলাদেশের আইনের প্রতি সর্বোচ্চ সম্মান। জানুন কীভাবে আমরা একটি নিরপেক্ষ ও বিশ্বস্ত রিভিউ নেটওয়ার্ক পরিচালনা করি।'
            : 'Clear guidelines, responsible community participation, evidence integrity, and consumer safety across Bangladesh. Learn how we safeguard truth and fairness.'}
        </p>
        <div className="info-hero-actions">
          <Link to="/how-to-use" className="btn-teal-pill">
            <BookOpen size={16} aria-hidden="true" />
            {bn ? 'ব্যবহার নির্দেশিকা' : 'How to Use TruthHubBD'}
          </Link>
          <Link to="/report" className="btn-pill-light">
            <Flag size={16} aria-hidden="true" />
            {bn ? 'উদ্বেগ বা অভিযোগ জানান' : 'Report a Concern'}
          </Link>
          <Link to="/policies" className="btn-pill-light">
            <FileText size={16} aria-hidden="true" />
            {bn ? 'কমিউনিটি স্ট্যান্ডার্ডস' : 'Community Standards'}
          </Link>
        </div>
      </section>

      {/* Legal Guidance Disclaimer Notice */}
      <div className="info-callout" style={{ borderLeftColor: '#0f766e', background: '#f8fafc' }} role="note">
        <p>
          <strong>{bn ? 'আইনগত সাধারণ নির্দেশিকা: ' : 'Legal Guidance Notice: '}</strong>
          {bn
            ? 'ট্রুথহাববিডি বাংলাদেশের প্রচলিত আইন ও তথ্যপ্রযুক্তি নীতিমালা মেনে একটি দায়িত্বশীল নাগরিক প্ল্যাটফর্ম হিসেবে পরিচালিত হয়। এই পৃষ্ঠার তথ্য সাধারণ বোঝাপড়া ও নির্দেশনার জন্য রচিত এবং এটি কোনো আনুষ্ঠানিক আইনি পরামর্শ (Legal Advice) নয়।'
            : 'TruthHubBD is designed and operated with the aim of complying with applicable laws of Bangladesh and following responsible platform practices. This information is provided for general guidance and does not constitute formal legal advice.'}
        </p>
      </div>

      {/* Bangladesh Legal Framework Section */}
      <section className="info-section" aria-labelledby="legal-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <Scale size={14} aria-hidden="true" />
            {bn ? 'আইনি প্রেক্ষাপট' : 'BANGLADESH LEGAL FRAMEWORK'}
          </span>
          <h2 id="legal-heading">
            {bn ? 'বাংলাদেশের প্রাসঙ্গিক আইন ও নীতি' : 'Applicable Laws of Bangladesh'}
          </h2>
          <p>
            {bn
              ? 'আমরা চাই নাগরিকরা তাদের অধিকার জানুন এবং দায়িত্বশীলভাবে তথ্য প্রকাশ করুন। বাংলাদেশের গুরুত্বপূর্ণ আইনসমূহ নিচে সংক্ষেপে তুলে ধরা হলো:'
              : 'TruthHubBD encourages citizens to exercise their rights responsibly within the framework of Bangladesh law. Here are the key legislative acts that govern consumer rights, cyber safety, and public communications:'}
          </p>
        </div>

        <div className="law-grid">
          <div className="law-card">
            <span className="law-card-tag">{bn ? 'ভোক্তা অধিকার' : 'Consumer Protection'}</span>
            <h4>{bn ? 'ভোক্তা-অধিকার সংরক্ষণ আইন, ২০০৯' : "Consumers' Right Protection Act, 2009"}</h4>
            <p>
              {bn
                ? 'আইন নং ২৬, ২০০৯। মিথ্যা বিজ্ঞাপন, প্রতিশ্রুত পণ্য বা সেবা সরবরাহ না করা, প্রতারণামূলক মূল্য নির্ধারণ ও ক্ষতিকর বাণিজ্য রোধে এই আইন ভোক্তাকে সুরক্ষা প্রদান করে।'
                : 'Act No. 26 of 2009. Protects consumers against misleading advertisements, deceptive pricing, non-delivery of promised goods, and fraudulent business practices.'}
            </p>
            <a href="http://bdlaws.minlaw.gov.bd/act-1014.html" target="_blank" rel="noopener noreferrer" className="law-card-link">
              <span>bdlaws.minlaw.gov.bd</span>
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>

          <div className="law-card">
            <span className="law-card-tag">{bn ? 'সাইবার ও ডিজিটাল নিরাপত্তা' : 'Cyber Security'}</span>
            <h4>{bn ? 'সাইবার নিরাপত্তা ও আইসিটি আইন' : 'Cyber Security & ICT Legislation'}</h4>
            <p>
              {bn
                ? 'অনলাইন প্রতারণা, ডিজিটাল জালিয়াতি, অন্যের ছদ্মবেশ ধারণ (Impersonation) ও সিস্টেম অননুমোদিত অ্যাক্সেস প্রতিরোধে কঠোর শাস্তির বিধান রয়েছে।'
                : 'Prohibits cyber fraud, unauthorized system tampering, digital identity theft, and malicious electronic falsification under Bangladesh cyber jurisprudence.'}
            </p>
            <a href="http://bdlaws.minlaw.gov.bd/act-955.html" target="_blank" rel="noopener noreferrer" className="law-card-link">
              <span>bdlaws.minlaw.gov.bd</span>
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>

          <div className="law-card">
            <span className="law-card-tag">{bn ? 'মানহানি ও দেওয়ানি নীতি' : 'Defamation & Fair Comment'}</span>
            <h4>{bn ? 'দণ্ডবিধি ১৮৬০ (ধারা ৪৯৯ ও ৫০০)' : 'Penal Code, 1860 (Sec. 499 & 500)'}</h4>
            <p>
              {bn
                ? 'ধারা ৪৯৯ এর প্রথম ব্যতিক্রম অনুযায়ী—জনস্বার্থে এবং সৎ বিশ্বাসে প্রকাশিত সত্য তথ্য বা ঘটনা প্রকাশ মানহানি হিসেবে গণ্য হয় না।'
                : 'Defamation principles under Section 499. The First Exception explicitly protects true imputations made in good faith for the public good and consumer awareness.'}
            </p>
            <a href="http://bdlaws.minlaw.gov.bd/act-11/section-3112.html" target="_blank" rel="noopener noreferrer" className="law-card-link">
              <span>bdlaws.minlaw.gov.bd</span>
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>

          <div className="law-card">
            <span className="law-card-tag">{bn ? 'কপিরাইট ও ট্রেডমার্ক' : 'Intellectual Property'}</span>
            <h4>{bn ? 'ট্রেডমার্ক আইন ২০০৯ ও কপিরাইট আইন ২০২৩' : 'Trademarks Act, 2009 & Copyright Act, 2023'}</h4>
            <p>
              {bn
                ? 'প্রতিষ্ঠানের ব্র্যান্ড নাম ও লোগো সুরক্ষিত। তবে রিভিউ বা ডিরেক্টরি পরিচিতির উদ্দেশ্যে প্রতিষ্ঠানের নাম উল্লেখ ন্যায্য ব্যবহারের আওতাভুক্ত।'
                : 'Protects proprietary brand identities and trademarks. Directory listings and reviews referencing registered trademarks for identification fall under nominative fair use.'}
            </p>
            <a href="http://bdlaws.minlaw.gov.bd/act-1033.html" target="_blank" rel="noopener noreferrer" className="law-card-link">
              <span>bdlaws.minlaw.gov.bd</span>
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>

          <div className="law-card">
            <span className="law-card-tag">{bn ? 'ডিজিটাল কমার্স' : 'E-Commerce Standards'}</span>
            <h4>{bn ? 'ডিজিটাল কমার্স পরিচালনা নির্দেশিকা, ২০২১' : 'Digital Commerce Operation Guidelines, 2021'}</h4>
            <p>
              {bn
                ? 'অনলাইন শপ কর্তৃক পণ্য প্রদর্শনী, ডেলিভারির নির্দিষ্ট সময়সীমা এবং অর্থ ফেরতের (Refund) সুস্পষ্ট জাতীয় বিধিমালা।'
                : 'Commerce Ministry guidelines setting mandatory operational standards for online delivery timelines, clear refund mechanisms, and accurate product display.'}
            </p>
            <a href="https://mincom.gov.bd" target="_blank" rel="noopener noreferrer" className="law-card-link">
              <span>mincom.gov.bd</span>
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>

          <div className="law-card">
            <span className="law-card-tag">{bn ? 'উন্মুক্ত মানচিত্র ডেটা' : 'Open Data Attribution'}</span>
            <h4>{bn ? 'ওপেন ডেটাবেস লাইসেন্স (ODbL 1.0)' : 'Open Database License (ODbL 1.0)'}</h4>
            <p>
              {bn
                ? 'ওপেনস্ট্রিটম্যাপের ভৌগোলিক ডেটা উন্মুক্ত লাইসেন্সে প্রদর্শিত হয়। আমরা কন্ট্রিবিউটরদের অবদান ও কপিরাইটকে যথাযথভাবে স্বীকৃতি দিই।'
                : 'Directory map and geographic records utilize OpenStreetMap data licensed under ODbL 1.0 with complete public attribution and source traceability.'}
            </p>
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="law-card-link">
              <span>openstreetmap.org/copyright</span>
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* Platform Legality & Statutory Non-Violation Statement */}
      <section className="info-section" aria-labelledby="platform-legality-heading" style={{ background: '#f8fafc', padding: '36px 32px', borderRadius: 16, border: '1px solid #cbd5e1', margin: '40px 0' }}>
        <div className="info-section-header">
          <span className="info-section-kicker" style={{ color: '#0f766e', background: '#ccfbf1', padding: '4px 10px', borderRadius: 999 }}>
            <Scale size={14} aria-hidden="true" />
            {bn ? 'আইনগত অবস্থান ও সুরক্ষা' : 'PLATFORM COMPLIANCE & LEGAL POSITION'}
          </span>
          <h2 id="platform-legality-heading" style={{ marginTop: 12 }}>
            {bn ? 'আমাদের প্ল্যাটফর্ম কেন এবং কীভাবে আইনসম্মত — ট্রুথহাববিডি কোনো আইন লঙ্ঘন করে না' : 'Why TruthHubBD Fully Complies with Bangladesh Law (Statutory Non-Violation Statement)'}
          </h2>
          <p style={{ maxWidth: 840, fontSize: '15px', lineHeight: 1.7, color: '#334155' }}>
            {bn
              ? 'ট্রুথহাববিডি কোনো স্বৈরাচারী রায় প্রদানকারী আদালত নয় এবং কোনো ব্যক্তি বা প্রতিষ্ঠানকে ইচ্ছাকৃতভাবে হেয় করার উদ্দেশ্যে এটি পরিচালিত হয় না। প্ল্যাটফর্মটি বাংলাদেশের প্রচলিত ফৌজদারি, দেওয়ানি ও সাইবার আইনকে শতভাগ সম্মান জানিয়ে একটি দায়িত্বশীল প্রযুক্তিগত মধ্যস্থতাকারী (Neutral Intermediary) হিসেবে কাজ করে। নিচে আমাদের আইনি ভিত্তি সুস্পষ্টভাবে ব্যাখ্যা করা হলো:'
              : 'TruthHubBD is neither a judicial tribunal nor an avenue for arbitrary defamation. It operates as a neutral, responsible technology intermediary dedicated to lawful consumer feedback and civic transparency in strict conformity with the laws of Bangladesh.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '24px' }}>
          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h4 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="#0d9488" />
              {bn ? '১. দণ্ডবিধি ৪৯৯ ধারার ১ম ব্যতিক্রম (জনস্বার্থে সত্য প্রকাশ)' : '1. Penal Code 1860, Section 499 (First Exception: Public Good)'}
            </h4>
            <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.65, color: '#475569' }}>
              {bn
                ? 'বাংলাদেশের দণ্ডবিধির ৪৯৯ ধারার প্রথম ব্যতিক্রম অনুযায়ী—জনস্বার্থে সৎ বিশ্বাসে প্রকাশিত সত্য ঘটনা বা তথ্য প্রকাশ কখনোই মানহানি হিসেবে গণ্য হয় না। ট্রুথহাববিডি ভিত্তিহীন অপবাদ নয়, বরং নাগরিকদের প্রত্যক্ষ অভিজ্ঞতা ও প্রমাণের ভিত্তিতে তথ্য সংরক্ষণ করে।'
                : 'Under Section 499 (First Exception) of the Penal Code 1860, it is not defamation to publish true imputations concerning any party if made in good faith for the public good. Verifiable consumer experiences serve the direct welfare of citizens.'}
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h4 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="#0d9488" />
              {bn ? '২. নিরপেক্ষ প্রযুক্তি মধ্যস্থতাকারী ও সুরক্ষিত অপসারণ নীতি' : '2. Neutral Intermediary Status & Notice-and-Takedown'}
            </h4>
            <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.65, color: '#475569' }}>
              {bn
                ? 'আন্তর্জাতিক তথ্যপ্রযুক্তি নীতিমালা ও প্রচলিত আইন অনুযায়ী ট্রুথহাববিডি কোনো নাগরিক মন্তব্যের মূল রচয়িতা নয়; এটি একটি প্রযুক্তিগত হোস্ট। যেকোনো অসত্য, আক্রমণাত্মক বা বেআইনি কন্টেন্টের বিরুদ্ধে অভিযোগ আসার সাথে সাথে দ্রুত তদন্ত ও অপসারণের সুনির্দিষ্ট ব্যবস্থা রয়েছে।'
                : 'TruthHubBD is a neutral platform host and not the original author of citizen reviews. We maintain an active moderation workflow and notice-and-takedown mechanism to immediately review and restrict any abusive or unlawful posting.'}
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h4 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="#0d9488" />
              {bn ? '৩. ভোক্তা-অধিকার সংরক্ষণ আইন, ২০০৯-এর লক্ষ্যপূরণে সহায়ক' : '3. Advancing the Objectives of Consumer Protection Act 2009'}
            </h4>
            <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.65, color: '#475569' }}>
              {bn
                ? 'আইন অনুযায়ী প্রতারণামূলক বিজ্ঞাপন, অর্থ নিয়ে পণ্য না দেওয়া বা ত্রুটিযুক্ত সেবা দেওয়া শাস্তিযোগ্য অপরাধ। ট্রুথহাববিডির ডিরেক্টরি ভোক্তাদের সজাগ করে এবং প্রতিষ্ঠানগুলোকে জবাবদিহিতামূলক সেবা দিতে উদ্বুদ্ধ করে।'
                : 'Bangladesh consumer law shields the public against commercial deceit and undelivered services. TruthHubBD provides peaceful, constructive transparency that helps businesses resolve grievances directly.'}
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h4 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="#0d9488" />
              {bn ? '৪. প্রতিষ্ঠানের অবাধ আত্মপক্ষ সমর্থন ও নিষ্পত্তির অধিকার' : '4. Unrestricted Right of Reply & Dispute Resolution'}
            </h4>
            <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.65, color: '#475569' }}>
              {bn
                ? 'ন্যায্য বিচারের নীতি (Natural Justice) অক্ষুণ্ণ রাখতে প্রতিটি অভিযুক্ত বা উল্লিখিত প্রতিষ্ঠানকে তাদের নিজস্ব বক্তব্য, ব্যাখ্যা ও প্রমাণ প্রদানের শতভাগ বিনামূল্যে সুযোগ দেওয়া হয়। সমস্যা সমাধান হলে কেস নিষ্পত্তি হিসেবে চিহ্নিত করা হয়।'
                : 'In accordance with fundamental principles of natural justice, every business entity has an open and unrestricted right to claim their profile, publish official rebuttals, upload counter-evidence, and record resolved settlements.'}
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h4 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="#0d9488" />
              {bn ? '৫. সাইবার নিরাপত্তা ও ব্যক্তিগত তথ্য সুরক্ষা (Privacy Safeguard)' : '5. Cyber Security & Strict Evidence Privacy'}
            </h4>
            <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.65, color: '#475569' }}>
              {bn
                ? 'কারো ব্যক্তিগত ফোন নম্বর, জাতীয় পরিচয়পত্র বা সংবেদনশীল ব্যাংক নথি জনসমক্ষে প্রকাশ করা আইনত দণ্ডনীয়। তাই ট্রুথহাববিডিতে জমা পড়া মূল প্রমাণ সম্পূর্ণ এনক্রিপ্টেড ব্যক্তিগত ফাইলে থাকে এবং কেবল অনুমোদিত সারাংশ প্রকাশ পায়।'
                : 'To prevent identity theft, doxxing, or cyber harassment, private IDs, financial statements, and receipts submitted by citizens remain strictly private and accessible only to verified staff under strict confidentiality.'}
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h4 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="#0d9488" />
              {bn ? '৬. অভিযোগ অপরাধের চূড়ান্ত রায় নয় (Presumption of Innocence)' : '6. Allegations Are Not Final Judicial Convictions'}
            </h4>
            <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.65, color: '#475569' }}>
              {bn
                ? 'প্ল্যাটফর্মে প্রকাশিত প্রতিটি কেস সুস্পষ্টভাবে "নাগরিক রিপোর্ট" বা "অভিযোগ" হিসেবে চিহ্নিত থাকে—কোনো বিচারিক শাস্তি নয়। আদালতের বিচারাধীন বিষয়ে প্ল্যাটফর্ম কোনো রায় চাপায় না।'
                : 'All posted case summaries are explicitly designated as citizen dispute notices rather than criminal convictions. TruthHubBD does not usurp judicial functions and refrains from sub judice interference.'}
            </p>
          </div>
        </div>
      </section>

      {/* Review Rules: Good vs Bad Content */}
      <section className="info-section" aria-labelledby="rules-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <FileCheck size={14} aria-hidden="true" />
            {bn ? 'রিভিউ নীতিমালা' : 'AUTHENTICITY GUIDELINES'}
          </span>
          <h2 id="rules-heading">{bn ? 'সঠিক রিভিউ লেখার নিয়ম' : 'Review Rules: Constructive vs. Prohibited'}</h2>
          <p>
            {bn
              ? 'আমরা সত্য, শালীন ও প্রত্যক্ষ অভিজ্ঞতানির্ভর নাগরিক রিভিউকে উৎসাহিত করি। ব্যক্তিগত আক্রমণ বা ভিত্তিহীন অপপ্রচার প্ল্যাটফর্মে নিষিদ্ধ।'
              : 'TruthHubBD welcomes authentic, respectful citizen feedback. Understanding what constitutes acceptable critique ensures your voice protects others effectively.'}
          </p>
        </div>

        <div className="compare-grid">
          <div className="compare-card compare-card-good">
            <h4><CheckCircle2 size={18} /> {bn ? 'গ্রহণযোগ্য রিভিউয়ের বৈশিষ্ট্য' : 'What Makes a Good Review'}</h4>
            <p>{bn ? 'সুনির্দিষ্ট তথ্য, বাস্তব তারিখ, শালীন ভাষা ও প্রয়োজনীয় প্রমাণ সহ লিখিত বর্ণনা।' : 'Specific, truthful, based on genuine first-hand experience, with dates and receipts.'}</p>
            <ul>
              <li><strong>{bn ? 'সুনির্দিষ্ট ঘটনা:' : 'Specific details:'}</strong> {bn ? 'পণ্য বা সেবার কী সমস্যা হয়েছিল বা কী ভালো ছিল তা স্পষ্টভাবে ব্যাখ্যা করুন।' : 'Clearly explain what went wrong or what exceeded expectations.'}</li>
              <li><strong>{bn ? 'লেনদেনের তারিখ:' : 'Dates & context:'}</strong> {bn ? 'অভিজ্ঞতার আনুমানিক তারিখ বা অর্ডার নম্বর উল্লেখ করুন।' : 'Include approximate transaction dates or order references.'}</li>
              <li><strong>{bn ? 'প্রমাণ সংযুক্তি:' : 'Supporting evidence:'}</strong> {bn ? 'রসিদ, চালান বা চ্যাট স্ক্রিনশট যুক্ত করুন (ব্যক্তিগত তথ্য বাদ দিয়ে)।' : 'Attach invoices, photos, or delivery memos with personal data redacted.'}</li>
              <li><strong>{bn ? 'সম্পর্ক প্রকাশ:' : 'Relationship disclosure:'}</strong> {bn ? 'আপনি কি প্রাক্তন কর্মী, প্রতিযোগী বা উপহারপ্রাপ্ত? তা প্রকাশ করুন।' : 'Disclose if you are an employee, competitor, or received an incentive.'}</li>
            </ul>
          </div>

          <div className="compare-card compare-card-bad">
            <h4><XCircle size={18} /> {bn ? 'নিষিদ্ধ ও ক্ষতিকর কন্টেন্ট' : 'Prohibited Content'}</h4>
            <p>{bn ? 'যেসব কন্টেন্ট মডারেশনে বাতিল বা অপসারণ করা হয় এবং অ্যাকাউন্ট সীমাবদ্ধ হতে পারে:' : 'Content that violates platform rules, gets removed, and may lead to account restrictions:'}</p>
            <ul>
              <li><strong>{bn ? 'ভুয়া বা সাজানো রিভিউ:' : 'Fake or incentivized reviews:'}</strong> {bn ? 'নিজের প্রতিষ্ঠানের কৃত্রিম প্রশংসা বা প্রতিদ্বন্দীর বিরুদ্ধে ভুয়া নেগেটিভ রিভিউ।' : 'Coordinated reviews, paid manipulation, or fabricated complaints.'}</li>
              <li><strong>{bn ? 'হুমকি ও গালিগালাজ:' : 'Abuse & threats:'}</strong> {bn ? 'অশ্লীল শব্দ, ব্যক্তিগত আক্রমণ, হিংসাত্মক বক্তব্য বা ব্ল্যাকমেইলিং।' : 'Profanity, personal threats, hate speech, or extortion attempts.'}</li>
              <li><strong>{bn ? 'ব্যক্তিগত তথ্য ফাঁস (Doxxing):' : 'Private information:'}</strong> {bn ? 'কারো জাতীয় পরিচয়পত্র (NID), পাসপোর্ট, ব্যক্তিগত ব্যাংক অ্যাকাউন্ট বা ছবি প্রকাশ।' : 'Publishing private phone numbers, home addresses, or bank cards.'}</li>
              <li><strong>{bn ? 'স্প্যাম ও প্রচার:' : 'Spam & promotion:'}</strong> {bn ? 'অপ্রাসঙ্গিক বিজ্ঞাপন লিংক বা একই লেখা বারবার পোস্ট করা।' : 'Repetitive spam links, unrelated self-promotion, or bot scripts.'}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Serious Allegations & Case Reporting Guidance */}
      <section className="info-section" aria-labelledby="allegations-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <AlertTriangle size={14} aria-hidden="true" />
            {bn ? 'অভিযোগ প্রকাশের কৌশল' : 'ACCUSATIONS & FACTUALITY'}
          </span>
          <h2 id="allegations-heading">{bn ? 'গুরুতর অভিযোগ করার সঠিক পদ্ধতি' : 'Handling Serious Allegations Responsibly'}</h2>
          <p>
            {bn
              ? 'অপরাধমূলক সাধারণ ট্যাগ বা ভিত্তিহীন বাক্য না লিখে ঠিক কী ঘটেছে তা নির্দিষ্ট করে বলুন। নিচের উদাহরণটি লক্ষ্য করুন:'
              : 'When reporting fraud or poor service, stick to verifiable facts and actual occurrences rather than emotional slurs. Factual statements protect both you and the community.'}
          </p>
        </div>

        <div className="compare-grid">
          <div className="compare-card compare-card-bad">
            <h4><XCircle size={18} /> {bn ? 'ভুল পদ্ধতি (অকার্যকর ও ঝুঁকিপূর্ণ)' : 'Weak / Unsupported Declaration'}</h4>
            <p>{bn ? 'কোনো প্রমাণ বা বিবরণ ছাড়া সরাসরি অপরাধী ঘোষণা করা:' : 'Unverified assertions without facts or timeline:'}</p>
            <blockquote>
              {bn
                ? '“এই দোকানদার একজন বড় চোর ও বাটপাড়! এদের সবাইকে জেলে দেওয়া উচিত।”'
                : '“They are absolute criminals and thieves! The worst scammers ever!”'}
            </blockquote>
            <p style={{ marginTop: '10px', fontSize: '12.5px', color: '#64748b' }}>
              {bn
                ? 'সমস্যা: এতে মডারেটর বা আদালত ঘটনার সত্যতা বুঝতে পারে না এবং উল্টো আইনি জটিলতা তৈরি হতে পারে।'
                : 'Problem: Contains no factual evidence, dates, or verifiable actions. It is emotionally charged and legally vulnerable.'}
            </p>
          </div>

          <div className="compare-card compare-card-good">
            <h4><CheckCircle2 size={18} /> {bn ? 'সঠিক পদ্ধতি (তথ্যবহুল ও কার্যকর)' : 'Effective Factual Reporting'}</h4>
            <p>{bn ? 'কী ঘটেছে, কত টাকা লেনদেন হয়েছে এবং তারিখ উল্লেখ করে লেখা:' : 'Chronological, verifiable description of what happened:'}</p>
            <blockquote>
              {bn
                ? '“আমি গত ৫ সেপ্টেম্বর ১,৫০০ টাকা বিকাশ করে একটি ড্রেস অর্ডার করি। ২০ সেপ্টেম্বরের মধ্যে পণ্য পাঠানোর কথা থাকলেও তারা পণ্য পাঠায়নি এবং মেসেজে আর কোনো উত্তর দিচ্ছে না। অর্ডারের ইনভয়েস ও বিকাশ ট্রানজেকশন আইডি যুক্ত করলাম।”'
                : '“I ordered an item on 5 September and paid 1,500 BDT via bKash. Delivery was promised within 7 days, but by 20 September nothing arrived, and the seller stopped responding. Attached order invoice & transaction ID.”'}
            </blockquote>
            <p style={{ marginTop: '10px', fontSize: '12.5px', color: '#15803d' }}>
              {bn
                ? 'সুবিধা: সুনির্দিষ্ট প্রমাণ ও তারিখ থাকায় প্রতিষ্ঠান সমাধান দিতে বাধ্য হয় এবং অন্যান্য নাগরিকরা সহজে সতর্ক হন।'
                : 'Strength: Clear timeline, exact amount, transaction reference, and communication log. Invaluable for community protection.'}
            </p>
          </div>
        </div>
      </section>

      {/* Evidence Standards & Privacy */}
      <section className="info-section" aria-labelledby="evidence-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <Lock size={14} aria-hidden="true" />
            {bn ? 'প্রমাণ ও সুরক্ষা' : 'DOCUMENTATION & PRIVACY'}
          </span>
          <h2 id="evidence-heading">{bn ? 'প্রমাণ আপলোড ও ব্যক্তিগত তথ্যের সুরক্ষা' : 'Evidence Standards & Data Redaction'}</h2>
          <p>
            {bn
              ? 'প্রমাণ যুক্ত করার সময় অবশ্যই সংবেদনশীল ব্যক্তিগত তথ্য গোপন রাখুন। ট্রুথহাববিডি প্রমাণ ফাইলকে নিরাপদে সংরক্ষণ করে।'
              : 'Supporting evidence is essential, but privacy comes first. Here is how evidence is handled and how to protect sensitive personal records:'}
          </p>
        </div>

        <div className="info-cards-grid-3">
          <div className="info-card">
            <div className="info-card-icon"><FileCheck size={20} /></div>
            <h3>{bn ? 'কী কী প্রমাণ গ্রহণযোগ্য?' : 'Accepted Evidence Types'}</h3>
            <p>{bn ? 'অর্ডার রসিদ, মেমো, ক্যাশ মেমো, চালান, কুরিয়ার স্লিপ, ত্রুটিপূর্ণ পণ্যের ছবি এবং ব্যবসায়িক চ্যাটের স্ক্রিনশট।' : 'Official receipts, invoices, courier tracking slips, photographs of defective goods, and merchant chat logs.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon"><Eye size={20} /></div>
            <h3>{bn ? 'ব্যক্তিগত তথ্য বাদ দিন (Redact)' : 'Redact Personal Identifiers'}</h3>
            <p>{bn ? 'স্ক্রিনশট আপলোড করার আগে আপনার জাতীয় পরিচয়পত্র নম্বর, ব্যাংক কার্ডের পুরো নম্বর ও পারিবারিক ছবি ব্লার করুন।' : 'Always cross out or blur National ID numbers, CVV/credit card numbers, and unrelated personal photos before uploading.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon"><Shield size={20} /></div>
            <h3>{bn ? 'নিরাপদ প্রাইভেট স্টোরেজ' : 'Encrypted Server Storage'}</h3>
            <p>{bn ? 'আপনার আপলোডকৃত নথিপত্র আমাদের সুরক্ষিত প্রাইভেট স্টোরেজে সংরক্ষিত থাকে এবং ক্ষতিকর সফটওয়্যার স্ক্যান করা হয়।' : 'Evidence files are quarantined in private disk storage and scanned by malware protection before handling.'}</p>
          </div>
        </div>
      </section>

      {/* Organization Rights Section */}
      <section className="info-section" aria-labelledby="org-rights-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <Building2 size={14} aria-hidden="true" />
            {bn ? 'প্রতিষ্ঠানের অধিকার' : 'BUSINESS INTEGRITY'}
          </span>
          <h2 id="org-rights-heading">{bn ? 'প্রতিষ্ঠানের অধিকার ও আত্মপক্ষ সমর্থন' : 'Organization Rights & Right of Response'}</h2>
          <p>
            {bn
              ? 'আমরা বিশ্বাস করি প্রতিটি বৈধ প্রতিষ্ঠানের আত্মপক্ষ সমর্থনের এবং সত্য তুলে ধরার পূর্ণ অধিকার রয়েছে।'
              : 'Fairness requires that organizations have a structured, dignified mechanism to represent themselves and correct inaccuracies.'}
          </p>
        </div>

        <div className="info-cards-grid-3">
          <div className="info-card">
            <h3>{bn ? '১. প্রোফাইল দাবি (Claim Profile)' : '1. Profile Claiming'}</h3>
            <p>{bn ? 'প্রতিষ্ঠান তাদের ডিরেক্টরি প্রোফাইল ক্লেইম করে মালিকানার সত্যতা প্রমাণ করতে পারে।' : 'Organizations can search their profile, submit legal authorization or trade licenses, and claim control.'}</p>
          </div>

          <div className="info-card">
            <h3>{bn ? '২. আনুষ্ঠানিক উত্তর (Official Response)' : '2. Official Response'}</h3>
            <p>{bn ? 'যেকোনো রিভিউ বা স্ক্যাম অ্যালার্টের নিচে প্রতিষ্ঠান তাদের ব্যাখ্যা বা অর্থ ফেরতের প্রমাণ প্রকাশ করতে পারে।' : 'Post verified official explanations, refund receipts, or remediation steps directly under the report.'}</p>
          </div>

          <div className="info-card">
            <h3>{bn ? '৩. তথ্য সংশোধন (Update Facts)' : '3. Information Updates'}</h3>
            <p>{bn ? 'নতুন ঠিকানা, হেল্পলাইন, ওয়েবসাইট বা ফেসবুক পেইজের লিংক সবসময় আপডেট রাখতে পারে।' : 'Maintain accurate contact details, branch addresses, opening hours, and official website URLs.'}</p>
          </div>
        </div>

        <div className="info-disclaimer-box" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
          <ShieldAlert size={22} color="#0f766e" aria-hidden="true" />
          <div>
            <p style={{ color: '#1e293b' }}>
              <strong>{bn ? 'কঠোর নিরপেক্ষতা নীতি: ' : 'Strict Editorial Rule: '}</strong>
              {bn
                ? 'কোনো প্রতিষ্ঠান কেবল অপছন্দের কারণে কোনো গ্রাহকের বাস্তব নেগেটিভ রিভিউ মুছে ফেলতে পারবে না। অর্থের বিনিময়ে রেটিং বা রিভিউ বদলানো সম্পূর্ণ নিষিদ্ধ।'
                : 'An organization cannot remove an authentic negative review simply because they dislike the criticism. TruthHubBD does not alter ratings or delete verified feedback for advertising revenue.'}
            </p>
          </div>
        </div>
      </section>

      {/* Verification Badges Explained */}
      <section className="info-section" aria-labelledby="badges-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <ShieldCheck size={14} aria-hidden="true" />
            {bn ? 'ব্যাজের অর্থ' : 'BADGE CLARITY'}
          </span>
          <h2 id="badges-heading">{bn ? 'ভেরিফিকেশন ব্যাজের বিস্তারিত অর্থ' : 'What Our Badges Mean (and What They Don’t)'}</h2>
          <p>
            {bn
              ? 'ব্যবহারকারীরা যাতে বিভ্রান্ত না হন, তাই প্রতিটি ব্যাজের অর্থ সুস্পষ্টভাবে সংজ্ঞায়িত করা হলো:'
              : 'Badges certify specific procedural verifications. They do not constitute an blanket endorsement or product warranty.'}
          </p>
        </div>

        <div className="info-cards-grid-3">
          <div className="info-card">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#b45309', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              <ShieldAlert size={16} /> {bn ? 'অযাচাইকৃত (Unverified)' : 'Unverified'}
            </div>
            <p>
              <strong>{bn ? 'যা বোঝায়:' : 'What it means:'}</strong> {bn ? 'পাবলিক সোর্স বা নাগরিক অবদানে তালিকাভুক্ত।' : 'Imported from open directories or community suggestions.'}
              <br /><br />
              <strong>{bn ? 'যা বোঝায় না:' : 'What it does NOT mean:'}</strong> {bn ? 'প্রতিষ্ঠানটি ভুয়া—এমন নয়; কেবল প্রাতিষ্ঠানিক প্রমাণপত্র জমা হয়নি।' : 'It does NOT mean the business is fake; only that official records have not been submitted.'}
            </p>
          </div>

          <div className="info-card">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1d4ed8', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              <Building2 size={16} /> {bn ? 'মালিকানা দাবি করা (Claimed)' : 'Owner Claimed'}
            </div>
            <p>
              <strong>{bn ? 'যা বোঝায়:' : 'What it means:'}</strong> {bn ? 'প্রতিষ্ঠানের একজন প্রতিনিধি অ্যাকাউন্ট নিয়ন্ত্রণ নিয়েছেন।' : 'A designated representative manages the profile and answers customers.'}
              <br /><br />
              <strong>{bn ? 'যা বোঝায় না:' : 'What it does NOT mean:'}</strong> {bn ? 'প্রতিটি পণ্যের গুণগত মানের নিশ্চয়তা।' : 'It does NOT mean TruthHubBD guarantees every transaction or staff member.'}
            </p>
          </div>

          <div className="info-card">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              <ShieldCheck size={16} /> {bn ? 'যাচাইকৃত (Verified)' : 'Verified by TruthHubBD'}
            </div>
            <p>
              <strong>{bn ? 'যা বোঝায়:' : 'What it means:'}</strong> {bn ? 'ট্রেড লাইসেন্স বা দাপ্তরিক দলিলের সত্যতা মডারেটর কর্তৃক পরীক্ষিত।' : 'Trade license, registration, or corporate authority audited by staff.'}
              <br /><br />
              <strong>{bn ? 'যা বোঝায় না:' : 'What it does NOT mean:'}</strong> {bn ? 'প্রতিষ্ঠানটিতে কখনোই কোনো বিরোধ হবে না এমন নিশ্চয়তা নয়।' : 'It does NOT mean customer disputes can never occur. Users should still exercise normal diligence.'}
            </p>
          </div>
        </div>
      </section>

      {/* Safety FAQ Accordion */}
      <section className="info-section" aria-labelledby="faq-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <HelpCircle size={14} aria-hidden="true" />
            {bn ? 'সাধারণ জিজ্ঞাসা' : 'QUESTIONS & ANSWERS'}
          </span>
          <h2 id="faq-heading">{bn ? 'আস্থা ও নিরাপত্তা সম্পর্কিত প্রশ্নোত্তর (FAQ)' : 'Trust & Safety FAQ'}</h2>
        </div>

        <div className="faq-accordion">
          {[
            {
              q: bn ? 'আমি কি কোনো প্রতিষ্ঠানের বিরুদ্ধে নেগেটিভ রিভিউ দিতে পারি?' : 'Can I post a negative review against a business?',
              a: bn
                ? 'হ্যাঁ, অবশ্যই। যদি আপনার নিজস্ব লেনদেন বা সেবার বাস্তব অভিজ্ঞতা খারাপ হয়ে থাকে, তবে আপনি পূর্ণ সততা, তারিখ ও শালীন ভাষায় নেগেটিভ রিভিউ প্রকাশ করতে পারেন। অশালীন ভাষা বা হুমকি পরিহার করুন।'
                : 'Yes. If you had an unsatisfactory experience with a shop, hospital, or service, you have the right to post an honest, factual negative review with dates and details.',
            },
            {
              q: bn ? 'প্রতিষ্ঠান কি আমার রিভিউ সরাসরি ডিলিট করতে পারে?' : 'Can an organization delete my review?',
              a: bn
                ? 'না। কোনো প্রতিষ্ঠান সরাসরি ব্যবহারকারীর রিভিউ মুছে ফেলতে পারে না। প্রতিষ্ঠান কেবল তার ব্যাখ্যা (Official Response) দিতে পারে অথবা নীতি লঙ্ঘনের সুনির্দিষ্ট প্রমাণ সহ অ্যাডমিনের কাছে রিপোর্ট করতে পারে।'
                : 'No. Organizations cannot delete reviews. They can post an official response or report a review to TruthHubBD moderators if they have evidence of fraud or defamation.',
            },
            {
              q: bn ? 'আমার কেস বা রিভিউ কত দ্রুত প্রকাশিত হয়?' : 'How quickly are scam alerts and reviews published?',
              a: bn
                ? 'ট্রুথহাববিডিতে সাবমিট করা স্ক্যাম অ্যালার্ট তাৎক্ষণিকভাবে লাইভ ও প্রকাশিত হয় যাতে নাগরিকরা দ্রুত সতর্ক হতে পারেন। সংশ্লিষ্ট প্রতিষ্ঠানকে সাথে সাথে নোটিফিকেশন পাঠানো হয় যাতে তারা দ্রুত সমাধান দিতে পারে।'
                : 'Scam alerts and customer reviews are published immediately to provide real-time community protection. The organization is notified to provide a prompt response or solution.',
            },
            {
              q: bn ? 'প্রতারণার অর্থ ফেরত পেলে কেস কীভাবে মীমাংসা (Resolved) করব?' : 'What if the merchant refunds my money or solves the problem?',
              a: bn
                ? 'যিনি কেস করেছেন (Citizen Reporter), তিনি যেকোনো সময় তার প্রোফাইল বা কেস পেজ থেকে “Mark as Solved” বাটনে ক্লিক করে কেসটি মীমাংসা করতে পারেন। তখন কেসটি Resolved হিসেবে প্রদর্শিত হবে।'
                : 'The citizen reporter who filed the case can mark it as "Resolved" at any time from their profile or case page once satisfied with the resolution or refund.',
            },
            {
              q: bn ? 'প্রমাণ হিসেবে কী কী তথ্য আপলোড করা উচিত?' : 'What evidence should I attach to my report?',
              a: bn
                ? 'অর্ডার মেমো, মানি রসিদ, চালান, কুরিয়ার স্লিপ, ব্যাংকিং লেনদেনের স্ক্রিনশট ইত্যাদি। আপলোড করার পূর্বে নিজের পিন নম্বর, সিভিসি বা পাসওয়ার্ড জাতীয় গোপন তথ্য ঢেকে দিন।'
                : 'Order invoices, payment confirmation receipts, courier slips, chat logs, and photos of items received. Always redact passwords, PINs, and personal identity numbers.',
            },
            {
              q: bn ? 'প্রতিষ্ঠানটি বন্ধ হয়ে গেলে বা ভুল তথ্য থাকলে কীভাবে জানাব?' : 'What if directory information is outdated or incorrect?',
              a: bn
                ? 'প্রতিটি প্রতিষ্ঠানের প্রোফাইল পেজে “তথ্য সংশোধন জানান” বা ফুটারের “অ্যাডমিনকে জানান” লিংকের মাধ্যমে আপনি সঠিক তথ্য বা সংশোধনের প্রস্তাব পাঠাতে পারেন।'
                : 'Use the "Report to admin" link in the footer or report button on the profile to notify staff of changed addresses, phone numbers, or closed branches.',
            },
          ].map((item, index) => (
            <details className="faq-item" key={index}>
              <summary className="faq-summary">
                <span>{item.q}</span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <div className="faq-content">
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="info-cta" aria-labelledby="safety-cta-title">
        <div>
          <h2 id="safety-cta-title">
            {bn ? 'কোনো অনাকাঙ্ক্ষিত বিষয় নজরে এসেছে?' : 'Notice something that violates our rules?'}
          </h2>
          <p>
            {bn
              ? 'ভুয়া রিভিউ, ক্ষতিকর কন্টেন্ট বা অননুমোদিত তথ্য দেখলে দ্বিধাহীনভাবে আমাদের মডারেশন টিমকে জানান।'
              : 'Our moderation team actively reviews reported content. Report deceptive reviews, scams, or inaccurate listings.'}
          </p>
        </div>
        <div className="info-cta-actions">
          <Link to="/report" className="btn-cta-white">
            <Flag size={16} aria-hidden="true" />
            {bn ? 'অ্যাডমিনকে জানান' : 'Report to Admin'}
          </Link>
          <Link to="/how-to-use" className="btn-cta-outline">
            {bn ? 'ব্যবহার নির্দেশিকা পড়ুন' : 'Read How to Use'}
          </Link>
          <Link to="/about" className="btn-cta-outline">
            {bn ? 'আমাদের সম্পর্কে' : 'About Us'}
          </Link>
        </div>
      </section>
    </div>
  );
}
