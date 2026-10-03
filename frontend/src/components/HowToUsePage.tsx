"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  Compass,
  Eye,
  FileCheck,
  FilePlus,
  HelpCircle,
  Lock,
  Map,
  MapPin,
  MessageSquare,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Users,
} from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import './static-pages.css';

export function HowToUsePage() {
  const { lang } = useI18n();
  const bn = lang === 'bn';

  return (
    <div className="info-page-container">
      {/* Breadcrumb Navigation */}
      <nav className="info-breadcrumb" aria-label={bn ? 'অবস্থান' : 'Breadcrumb'}>
        <Link to="/">{bn ? 'মূল পাতা' : 'Home'}</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: '#1e293b' }}>{bn ? 'কীভাবে ব্যবহার করবেন' : 'How to Use'}</span>
      </nav>

      {/* Hero Section */}
      <section className="info-hero" aria-labelledby="how-hero-title">
        <span className="info-hero-eyebrow">
          <BookOpen size={14} aria-hidden="true" />
          {bn ? 'ব্যবহার নির্দেশিকা ও গাইড' : 'COMPLETE PLATFORM GUIDE'}
        </span>
        <h1 id="how-hero-title">
          {bn ? 'ট্রুথহাববিডি ব্যবহারের সম্পূর্ণ নিয়ম' : 'How to Use TruthHubBD'}
        </h1>
        <p className="info-hero-subtitle">
          {bn
            ? 'প্রতিষ্ঠান অনুসন্ধান, রিভিউ প্রদান, প্রতারণার অভিযোগ জমা এবং ব্যবসায়িক প্রোফাইল পরিচালনার প্রতিটি ধাপের সহজ ও বিস্তারিত গাইড।'
            : 'A comprehensive, step-by-step citizen and organization guide to navigating Bangladesh’s review, verification, and consumer accountability network.'}
        </p>
        <div className="info-hero-actions">
          <Link to="/search?view=businesses" className="btn-teal-pill">
            <Search size={16} aria-hidden="true" />
            {bn ? 'প্রতিষ্ঠান খুঁজুন' : 'Search Directory'}
          </Link>
          <Link to="/scam-alerts/submit" className="btn-pill-light">
            <ShieldAlert size={16} aria-hidden="true" />
            {bn ? 'অভিযোগ জমা দিন' : 'Report a Case'}
          </Link>
          <Link to="/trust-safety" className="btn-pill-light">
            <Shield size={16} aria-hidden="true" />
            {bn ? 'আস্থা ও নিরাপত্তা' : 'Trust & Safety'}
          </Link>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="info-section" aria-labelledby="quick-start-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <Sparkles size={14} aria-hidden="true" />
            {bn ? 'সংক্ষিপ্ত সারসংক্ষেপ' : 'QUICK OVERVIEW'}
          </span>
          <h2 id="quick-start-heading">{bn ? 'এক নজরে ৬টি সহজ ধাপ' : 'Quick Start: 6 Easy Steps'}</h2>
        </div>

        <div className="quick-start-bar">
          <div className="quick-start-item">
            <span className="quick-start-num">1</span>
            <span className="quick-start-text">{bn ? 'প্রতিষ্ঠান খুঁজুন' : 'Search organization'}</span>
          </div>
          <div className="quick-start-item">
            <span className="quick-start-num">2</span>
            <span className="quick-start-text">{bn ? 'প্রোফাইল ওপেন করুন' : 'Open profile'}</span>
          </div>
          <div className="quick-start-item">
            <span className="quick-start-num">3</span>
            <span className="quick-start-text">{bn ? 'ভেরিফিকেশন যাচাই করুন' : 'Check verification'}</span>
          </div>
          <div className="quick-start-item">
            <span className="quick-start-num">4</span>
            <span className="quick-start-text">{bn ? 'রিভিউ ও রেটিং পড়ুন' : 'Read experiences'}</span>
          </div>
          <div className="quick-start-item">
            <span className="quick-start-num">5</span>
            <span className="quick-start-text">{bn ? 'রিভিউ বা কেস দিন' : 'Review or report'}</span>
          </div>
          <div className="quick-start-item">
            <span className="quick-start-num">6</span>
            <span className="quick-start-text">{bn ? 'সচেতন সিদ্ধান্ত নিন' : 'Make your decision'}</span>
          </div>
        </div>
      </section>

      {/* Detailed Steps Grid */}
      <section className="info-section" aria-labelledby="detailed-steps-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <Compass size={14} aria-hidden="true" />
            {bn ? 'ফিচার নির্দেশিকা' : 'FEATURE BY FEATURE'}
          </span>
          <h2 id="detailed-steps-heading">{bn ? 'ধাপে ধাপে প্রতিটি ফিচারের ব্যবহার' : 'Detailed Step-by-Step Instructions'}</h2>
        </div>

        <div className="steps-grid">
          {/* Step 1: Search */}
          <article className="step-card">
            <span className="step-card-number">01</span>
            <div className="step-card-icon" aria-hidden="true"><Search size={22} /></div>
            <h3>{bn ? 'প্রতিষ্ঠান ও সেবা অনুসন্ধান' : 'Searching for Organizations'}</h3>
            <p>{bn ? 'সার্বিক অনুসন্ধান (Omni-Search) ব্যবহার করে সেকেন্ডেই প্রতিষ্ঠান ও সেবা খুঁজে নিন:' : 'Find organizations across 8 divisions using multi-faceted discovery tools:'}</p>
            <ol>
              <li><strong>{bn ? 'দ্রুত সার্চ বার:' : 'Omni Search Bar:'}</strong> {bn ? 'হোমপেজে কিবোর্ড দিয়ে টাইপ করুন (বা শর্টকাট Ctrl+K চাপুন)।' : 'Type organization name or keywords directly (or press Ctrl+K).'}</li>
              <li><strong>{bn ? 'বিভাগভিত্তিক ফিল্টার:' : 'Division filter:'}</strong> {bn ? 'ঢাকা, চট্টগ্রাম, রাজশাহী সহ ৮টি বিভাগ সিলেক্ট করুন।' : 'Filter by Dhaka, Chattogram, Rajshahi, or other divisions.'}</li>
              <li><strong>{bn ? 'ক্যাটাগরি ব্রাউজ:' : 'Industry category:'}</strong> {bn ? 'ই-কমার্স, স্বাস্থ্যসেবা, আইটি, শিক্ষা ইত্যাদি ক্যাটাগরি বেছে নিন।' : 'Explore E-commerce, IT, Healthcare, Education, and Logistics.'}</li>
              <li><strong>{bn ? 'স্টার ফিল্টার:' : 'Star filter:'}</strong> {bn ? 'নির্দিষ্ট রেটিং (যেমন ৪+ বা ৫ স্টার) অনুযায়ী বাছাই করুন।' : 'Filter listings by minimum star rating or verified badge.'}</li>
            </ol>
          </article>

          {/* Step 2: Profile */}
          <article className="step-card">
            <span className="step-card-number">02</span>
            <div className="step-card-icon" aria-hidden="true"><Building2 size={22} /></div>
            <h3>{bn ? 'প্রোফাইলের তথ্য বিশ্লেষণ' : 'Exploring Organization Profiles'}</h3>
            <p>{bn ? 'একটি প্রতিষ্ঠানের প্রোফাইল পেজে যেসব প্রয়োজনীয় তথ্য পাবেন:' : 'Every organization listing includes vital verification and contact data:'}</p>
            <ul>
              <li><strong>{bn ? 'প্রোফাইল ছবি ও নাম:' : 'Official photo & name:'}</strong> {bn ? 'ইংরেজি ও বাংলা উভয় নাম এবং অনুমোদিত ছবি।' : 'Both English and Bengali naming with authentic profile photography.'}</li>
              <li><strong>{bn ? 'ভেরিফিকেশন স্ট্যাটাস:' : 'Verification stamp:'}</strong> {bn ? 'যাচাইকৃত (Verified), দাবি করা (Claimed), অথবা অযাচাইকৃত (Unverified)।' : 'Clear badges indicating if the profile is Unverified, Claimed, or Verified.'}</li>
              <li><strong>{bn ? 'রেটিং ও পরিসংখ্যান:' : 'Rating breakdown:'}</strong> {bn ? 'সামগ্রিক স্কোর এবং ১ থেকে ৫ স্টারের শতাংশ গ্রাফ।' : 'Overall average score with 1–5 star percentage distribution.'}</li>
              <li><strong>{bn ? 'যোগাযোগ ও ফেসবুক:' : 'Contact & social links:'}</strong> {bn ? 'ফোন নম্বর, ওয়েবসাইট লিংক এবং ভেরিফাইড ফেসবুক পেইজ।' : 'Direct phone numbers, official websites, and social links.'}</li>
            </ul>
          </article>

          {/* Step 3: Write Review */}
          <article className="step-card">
            <span className="step-card-number">03</span>
            <div className="step-card-icon" aria-hidden="true"><Star size={22} /></div>
            <h3>{bn ? 'বাস্তব রিভিউ লেখা' : 'Writing an Authentic Review'}</h3>
            <p>{bn ? 'আপনার নিজস্ব বাস্তব অভিজ্ঞতা লিখে অন্যকে সঠিক সিদ্ধান্ত নিতে সাহায্য করুন:' : 'Share your genuine first-hand transaction or service experience:'}</p>
            <ol>
              <li><strong>{bn ? '“রিভিউ লিখুন” বাটনে চাপুন:' : 'Click "Write a Review":'}</strong> {bn ? 'লগ ইন করে প্রতিষ্ঠানের পেজ বা হোমপেজ থেকে শুরু করুন।' : 'Available on any organization profile or via the global review button.'}</li>
              <li><strong>{bn ? 'স্টার রেটিং দিন:' : 'Rate 1 to 5 stars:'}</strong> {bn ? 'সেবার মান, পণ্যের মূল্য ও যোগাযোগের জন্য সাব-রেটিং দিন।' : 'Provide overall stars plus sub-ratings for Service, Value, and Communication.'}</li>
              <li><strong>{bn ? 'বিস্তারিত বর্ণনা লিখুন:' : 'Write factual summary:'}</strong> {bn ? 'কী ঘটেছিল এবং লেনদেনের তারিখ উল্লেখ করুন।' : 'Clearly explain the facts, product details, and the date of experience.'}</li>
              <li><strong>{bn ? 'প্রমাণ যুক্ত করুন:' : 'Attach evidence:'}</strong> {bn ? 'রসিদ বা পণ্যের ছবি আপলোড করুন এবং প্রকাশ করুন।' : 'Upload receipts or photos (up to 20 files, 5MB max) and submit.'}</li>
            </ol>
          </article>

          {/* Step 4: Report Scam */}
          <article className="step-card">
            <span className="step-card-number">04</span>
            <div className="step-card-icon" aria-hidden="true"><ShieldAlert size={22} /></div>
            <h3>{bn ? 'প্রতারণার অভিযোগ (Scam Alert)' : 'Filing a Scam / Fraud Alert'}</h3>
            <p>{bn ? 'টাকা নেওয়ার পর পণ্য না দেওয়া বা প্রতারণার শিকার হলে সরাসরি কেস জমা দিন:' : 'Report non-delivery, fraudulent payment demands, or deceptive merchant conduct:'}</p>
            <ol>
              <li><strong>{bn ? '“অভিযোগ জমা দিন” খুলুন:' : 'Open Report Form:'}</strong> {bn ? 'প্রতিষ্ঠান নির্বাচন করুন এবং ঘটনার শিরোনাম লিখুন।' : 'Select the entity and choose the incident category (e.g., non-delivery).'}</li>
              <li><strong>{bn ? 'আর্থিক ক্ষতির পরিমাণ:' : 'Financial loss amount:'}</strong> {bn ? 'কত টাকা ক্ষতি হয়েছে তা টাকায় (BDT) উল্লেখ করুন।' : 'Enter the exact financial transaction loss and incident date.'}</li>
              <li><strong>{bn ? 'প্রমাণপত্র আপলোড:' : 'Upload proof:'}</strong> {bn ? 'বিকাশ/নগদ ট্রানজেকশন স্ক্রিনশট, মেমো ও চ্যাট রেকর্ড দিন।' : 'Upload bKash/Nagad/bank transfer receipts and chat transcripts.'}</li>
              <li><strong>{bn ? 'তাৎক্ষণিক প্রকাশ ও ট্র্যাকিং:' : 'Instant publication:'}</strong> {bn ? 'কেসটি সাথে সাথে লাইভ বোর্ডে চলে আসবে এবং একটি কেস কোড পাবেন।' : 'The alert is published immediately with a unique reference code (THB-YYYY-XXXXXX).'}</li>
            </ol>
          </article>

          {/* Step 5: Add Organization */}
          <article className="step-card">
            <span className="step-card-number">05</span>
            <div className="step-card-icon" aria-hidden="true"><FilePlus size={22} /></div>
            <h3>{bn ? 'নতুন প্রতিষ্ঠান যোগ করা' : 'Adding a Missing Organization'}</h3>
            <p>{bn ? 'কোনো প্রতিষ্ঠান ডিরেক্টরিতে না থাকলে নিজেই যোগ করতে পারেন:' : 'Cannot find an organization? Any registered user can add a missing entity:'}</p>
            <ol>
              <li><strong>{bn ? 'আগে সার্চ করুন:' : 'Search first:'}</strong> {bn ? 'ডুপ্লিকেট এড়াতে প্রতিষ্ঠানটি ইতিমধ্যে আছে কি না দেখে নিন।' : 'Search to confirm the organization is not already listed in the directory.'}</li>
              <li><strong>{bn ? 'মৌলিক তথ্য পূরণ করুন:' : 'Basic details:'}</strong> {bn ? 'ইংরেজি নাম, বাংলা নাম, ক্যাটাগরি ও সংক্ষিপ্ত বিবরণ দিন।' : 'Provide English name, Bengali name, category, and website/social URL.'}</li>
              <li><strong>{bn ? 'ভৌগোলিক এলাকা:' : 'Administrative area:'}</strong> {bn ? 'বিভাগ, জেলা এবং উপজেলা বা থানা নির্বাচন করুন।' : 'Select Division, District, and Upazila / city area.'}</li>
              <li><strong>{bn ? 'ম্যাপে পিন করুন:' : 'Pin on map:'}</strong> {bn ? 'ইন্টারেক্টিভ মানচিত্রে ক্লিক করে সঠিক লোকেশন নিশ্চিত করুন।' : 'Click the interactive MapLibre map to place the pinpoint.'}</li>
            </ol>
          </article>

          {/* Step 6: Map Tools */}
          <article className="step-card">
            <span className="step-card-number">06</span>
            <div className="step-card-icon" aria-hidden="true"><Map size={22} /></div>
            <h3>{bn ? 'ইন্টারেক্টিভ মানচিত্রের ব্যবহার' : 'Using Maps & Location Tools'}</h3>
            <p>{bn ? 'প্রতিষ্ঠানের সঠিক শাখা ও অবস্থান নিশ্চিত করতে ম্যাপ ব্যবহার করুন:' : 'Confirm physical branch addresses and navigation details:'}</p>
            <ul>
              <li><strong>{bn ? 'ইন্টারেক্টিভ ম্যাপ লোড:' : 'Load interactive map:'}</strong> {bn ? '“Load Interactive Map” বাটনে ক্লিক করে সরাসরি লাইভ ম্যাপ দেখুন।' : 'Click the Load Interactive Map button to view street details.'}</li>
              <li><strong>{bn ? 'জুম ও নেভিগেশন:' : 'Zoom & explore:'}</strong> {bn ? 'ম্যাপে জুম ইন করে আশপাশের রাস্তা ও ল্যান্ডমার্ক দেখুন।' : 'Zoom into streets, nearby crossroads, and district boundaries.'}</li>
              <li><strong>{bn ? 'ওপেনস্ট্রিটম্যাপ লিংক:' : 'OpenStreetMap link:'}</strong> {bn ? '“View on OpenStreetMap” বাটনে ক্লিক করে জিপিএস রুট দেখুন।' : 'Open the coordinate link for live driving or walking directions.'}</li>
            </ul>
          </article>

          {/* Step 7: Claim Organization */}
          <article className="step-card">
            <span className="step-card-number">07</span>
            <div className="step-card-icon" aria-hidden="true"><FileCheck size={22} /></div>
            <h3>{bn ? 'প্রতিষ্ঠানের মালিকানা দাবি (Claim)' : 'Claiming an Organization Profile'}</h3>
            <p>{bn ? 'প্রতিষ্ঠানের মালিক বা অনুমোদিত প্রতিনিধি হিসেবে প্রোফাইল পরিচালনা করুন:' : 'Are you a shop owner, hospital admin, or company manager? Take official ownership:'}</p>
            <ol>
              <li><strong>{bn ? 'ক্লেইম পেজে যান:' : 'Open Claim Portal (/claim):'}</strong> {bn ? 'আপনার প্রতিষ্ঠানের নামটি খুঁজে বের করুন।' : 'Search and select your existing organization listing.'}</li>
              <li><strong>{bn ? 'প্রতিনিধিত্বের প্রমাণ দিন:' : 'Submit verification documents:'}</strong> {bn ? 'ট্রেড লাইসেন্স, ইউটিলিটি বিল বা অফিশিয়াল ডোমেইন ইমেইল প্রদান করুন।' : 'Provide trade license copy, utility bill, or official authorization letter.'}</li>
              <li><strong>{bn ? 'অ্যাডমিন অনুমোদন:' : 'Staff review:'}</strong> {bn ? 'আমাদের টিম নথি যাচাই করে মালিকানা প্রোফাইলে যুক্ত করে দেবে।' : 'Our moderation staff audits the credentials and grants official manager rights.'}</li>
            </ol>
          </article>

          {/* Step 8: Owner Workspace */}
          <article className="step-card">
            <span className="step-card-number">08</span>
            <div className="step-card-icon" aria-hidden="true"><Users size={22} /></div>
            <h3>{bn ? 'প্রতিষ্ঠানের ড্যাশবোর্ড ও উত্তর' : 'Business Center & Official Responses'}</h3>
            <p>{bn ? 'অনুমোদিত প্রতিনিধিরা যেভাবে গ্রাহকদের সঙ্গে যুক্ত থাকবেন:' : 'Verified business owners can actively address reviews and community concerns:'}</p>
            <ul>
              <li><strong>{bn ? 'ব্যবসা কেন্দ্র (Business Center):' : 'Organization Center:'}</strong> {bn ? 'আপনার অ্যাকাউন্টের অধীনে সব রিভিউ ও কেস এক জায়গায় মনিটর করুন।' : 'Monitor incoming reviews, customer feedback, and case alerts.'}</li>
              <li><strong>{bn ? 'অফিশিয়াল উত্তর প্রকাশ:' : 'Official Response:'}</strong> {bn ? 'যেকোনো পর্যালোচনায় আপনার বক্তব্য ও ব্যাখ্যা সরাসরি পোস্ট করুন।' : 'Post verified public explanations or clarify misunderstandings.'}</li>
              <li><strong>{bn ? 'সমাধান ও অর্থ ফেরত:' : 'Propose resolution:'}</strong> {bn ? 'কেসের ক্ষেত্রে সমাধানের প্রমাণ বা রিফান্ড তথ্য দিয়ে বিরোধ নিষ্পত্তি করুন।' : 'Submit proof of refund or customer resolution to resolve disputes.'}</li>
            </ul>
          </article>

          {/* Step 9: User Accounts */}
          <article className="step-card">
            <span className="step-card-number">09</span>
            <div className="step-card-icon" aria-hidden="true"><User size={22} /></div>
            <h3>{bn ? 'অ্যাকাউন্ট ও নিরাপত্তা ব্যবস্থা' : 'Managing Your Citizen Account'}</h3>
            <p>{bn ? 'আপনার ব্যক্তিগত প্রোফাইল ও অ্যাক্টিভিটি সুরক্ষিত রাখুন:' : 'Maintain your citizen account with modern security features:'}</p>
            <ul>
              <li><strong>{bn ? 'রেজিস্ট্রেশন ও ওটিপি:' : 'Email verification:'}</strong> {bn ? '৬ ডিজিটের ওটিপি দিয়ে ইমেইল ভেরিফাই করে সক্রিয় করুন।' : 'Verify your email with a 6-digit one-time passcode for full access.'}</li>
              <li><strong>{bn ? 'টু-ফ্যাক্টর অথেনটিকেশন (2FA):' : 'Two-Factor Authentication:'}</strong> {bn ? 'অ্যাকাউন্ট সিকিউরিটি থেকে অতিরিক্ত নিরাপত্তা স্তর চালু করুন।' : 'Enroll in multi-factor authentication (MFA) under Security settings.'}</li>
              <li><strong>{bn ? 'বুকমার্ক ও নোটিফিকেশন:' : 'Bookmarks & alerts:'}</strong> {bn ? 'পছন্দের প্রতিষ্ঠান সেভ করে রাখুন এবং আপডেটের নোটিফিকেশন পান।' : 'Save favorite organizations and receive alerts on review discussions.'}</li>
            </ul>
          </article>
        </div>
      </section>

      {/* Essential Privacy Tips */}
      <section className="info-section" aria-labelledby="privacy-tips-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <Lock size={14} aria-hidden="true" />
            {bn ? 'নিরাপত্তা টিপস' : 'PROTECT YOUR DATA'}
          </span>
          <h2 id="privacy-tips-heading">{bn ? 'নাগরিকদের জন্য জরুরি গোপনীয়তা পরামর্শ' : 'Essential Citizen Privacy Tips'}</h2>
        </div>

        <div className="info-cards-grid-3">
          <div className="info-card">
            <div className="info-card-icon"><Lock size={20} /></div>
            <h3>{bn ? 'পাসওয়ার্ড ও ওটিপি গোপন রাখুন' : 'Never Share Passwords or OTPs'}</h3>
            <p>{bn ? 'ট্রুথহাববিডি কর্মী পরিচয় দিয়ে কেউ কখনো আপনার পাসওয়ার্ড বা ওটিপি চাইবে না। এগুলো কাউকেই দেবেন না।' : 'TruthHubBD staff will never ask for your account password or verification codes.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon"><AlertTriangle size={20} /></div>
            <h3>{bn ? 'ব্যাংক কার্ডের তথ্য গোপন করুন' : 'Hide Bank & Card Numbers'}</h3>
            <p>{bn ? 'প্রমাণ আপলোড করার সময় কার্ডের ১৬ ডিজিট ও সিভিসি কোড অবশ্যই মার্কার দিয়ে ঢেকে দিন।' : 'Always cross out bank card numbers, CVVs, and account passwords from evidence attachments.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon"><Eye size={20} /></div>
            <h3>{bn ? 'স্ক্রিনশট যাচাই করে আপলোড করুন' : 'Inspect Screenshots First'}</h3>
            <p>{bn ? 'স্ক্রিনশটে অনাকাঙ্ক্ষিত ব্যক্তিগত কথোপকথন বা পারিবারিক ছবি থাকলে তা ক্রপ করে নিন।' : 'Crop out unrelated personal conversations, family pictures, and browser tabs before sharing.'}</p>
          </div>
        </div>
      </section>

      {/* How-to FAQ Accordion */}
      <section className="info-section" aria-labelledby="how-faq-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <HelpCircle size={14} aria-hidden="true" />
            {bn ? 'সচরাচর জিজ্ঞাসা' : 'FREQUENTLY ASKED QUESTIONS'}
          </span>
          <h2 id="how-faq-heading">{bn ? 'ব্যবহার নির্দেশিকা সম্পর্কিত প্রশ্নোত্তর' : 'Frequently Asked Questions'}</h2>
        </div>

        <div className="faq-accordion">
          {[
            {
              q: bn ? 'ট্রুথহাববিডি ব্যবহার করতে কি কোনো ফি দিতে হয়?' : 'Is TruthHubBD free to use for citizens?',
              a: bn
                ? 'না, সাধারণ নাগরিক ও ভোক্তাদের জন্য প্রতিষ্ঠান খোঁজা, রিভিউ পড়া ও লেখা সম্পূর্ণ বিনামূল্যে উন্মুক্ত।'
                : 'No. Searching directory listings, reading authentic reviews, and posting community experiences is 100% free for citizens.',
            },
            {
              q: bn ? 'আমি কি আমার জমা দেওয়া রিভিউ সম্পাদনা করতে পারি?' : 'Can I edit or update my review after posting?',
              a: bn
                ? 'হ্যাঁ, আপনি লগ ইন থাকা অবস্থায় আপনার প্রোফাইল বা অ্যাক্টিভিটি পাতা থেকে পূর্বে দেওয়া রিভিউ সম্পাদনা করতে পারেন।'
                : 'Yes. You can edit your submitted review from your Profile or Activity page as your experience with the organization develops.',
            },
            {
              q: bn ? 'স্ক্যাম কেস সমাধান হলে কী করব?' : 'How do I mark a scam case as resolved?',
              a: bn
                ? 'যদি সংশ্লিষ্ট প্রতিষ্ঠান আপনার ক্ষতিপূরণ দেয় বা বিরোধ সমাধান করে, তবে কেস পেজে গিয়ে “Mark as Solved” বাটনে ক্লিক করুন। এটি কেসটিকে Resolved স্ট্যাটাসে নিয়ে যাবে।'
                : 'If the organization refunds your money or rectifies the issue, click the "Mark as Solved" button on the case page to change its status to Resolved.',
            },
            {
              q: bn ? 'ভুয়া বা ক্ষতিকর রিভিউ দেখলে কী করব?' : 'What if I see an abusive or fraudulent review?',
              a: bn
                ? 'প্রতিটি রিভিউয়ের নিচে থাকা “Report to Admin” বাটনে ক্লিক করে কারণ উল্লেখ করুন। আমাদের মডারেশন টিম দ্রুত ব্যবস্থা নেবে।'
                : 'Click the "Report to Admin" button below the review and select the reason. Our moderation team audits reports and takes necessary action.',
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
      <section className="info-cta" aria-labelledby="how-cta-title">
        <div>
          <h2 id="how-cta-title">
            {bn ? 'এখনই শুরু করুন' : 'Start Exploring TruthHubBD Today'}
          </h2>
          <p>
            {bn
              ? 'আপনার এলাকার প্রতিষ্ঠান খুঁজুন, নাগরিক রিভিউ পড়ুন অথবা আপনার নিজের অভিজ্ঞতা শেয়ার করুন।'
              : 'Discover trusted organizations across Bangladesh, learn from real consumer reviews, or help others by sharing your story.'}
          </p>
        </div>
        <div className="info-cta-actions">
          <Link to="/search?view=businesses" className="btn-cta-white">
            <Search size={16} aria-hidden="true" />
            {bn ? 'ডিরেক্টরি খুঁজুন' : 'Search Organizations'}
          </Link>
          <Link to="/trust-safety" className="btn-cta-outline">
            {bn ? 'আস্থা ও নিরাপত্তা' : 'Trust & Safety'}
          </Link>
          <Link to="/about" className="btn-cta-outline">
            {bn ? 'আমাদের সম্পর্কে' : 'About Us'}
          </Link>
        </div>
      </section>
    </div>
  );
}
