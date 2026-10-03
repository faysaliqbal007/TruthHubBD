"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Compass,
  Eye,
  FileCheck,
  Flag,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  Lock,
  MapPin,
  MessageSquare,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import './static-pages.css';

export function AboutPage() {
  const { lang } = useI18n();
  const bn = lang === 'bn';

  return (
    <div className="info-page-container">
      {/* Breadcrumb Navigation */}
      <nav className="info-breadcrumb" aria-label={bn ? 'অবস্থান' : 'Breadcrumb'}>
        <Link to="/">{bn ? 'মূল পাতা' : 'Home'}</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: '#1e293b' }}>{bn ? 'আমাদের সম্পর্কে' : 'About TruthHubBD'}</span>
      </nav>

      {/* Hero Section */}
      <section className="info-hero" aria-labelledby="about-hero-title">
        <span className="info-hero-eyebrow">
          <ShieldCheck size={14} aria-hidden="true" />
          {bn ? 'নাগরিক পর্যালোচনা ও যাচাইকরণ নেটওয়ার্ক' : 'BANGLADESH CITIZEN REVIEW & VERIFICATION NETWORK'}
        </span>
        <h1 id="about-hero-title">
          {bn ? 'ট্রুথহাববিডি সম্পর্কে' : 'About TruthHubBD'}
        </h1>
        <p className="info-hero-subtitle">
          {bn
            ? 'বাংলাদেশের সাধারণ নাগরিক ও ভোক্তাদের জন্য একটি উন্মুক্ত, স্বচ্ছ ও জবাবদিহিতামূলক ডিজিটাল প্ল্যাটফর্ম। প্রতিষ্ঠান অনুসন্ধান, বাস্তব অভিজ্ঞতা প্রকাশ এবং সচেতন সিদ্ধান্ত নেওয়ার নির্ভরযোগ্য মাধ্যম।'
            : 'Building a more transparent, accountable, and informed digital community for Bangladesh. Discover organizations, share authentic experiences, and make confident decisions.'}
        </p>
        <div className="info-hero-actions">
          <Link to="/search?view=businesses" className="btn-teal-pill">
            <Search size={16} aria-hidden="true" />
            {bn ? 'প্রতিষ্ঠান খুঁজুন' : 'Explore Organizations'}
          </Link>
          <Link to="/how-to-use" className="btn-pill-light">
            <Compass size={16} aria-hidden="true" />
            {bn ? 'কীভাবে ব্যবহার করবেন' : 'How to Use'}
          </Link>
          <Link to="/trust-safety" className="btn-pill-light">
            <Shield size={16} aria-hidden="true" />
            {bn ? 'আস্থা ও নিরাপত্তা' : 'Trust & Safety'}
          </Link>
        </div>
      </section>

      {/* Founding Team Section */}
      <section className="info-section" aria-labelledby="team-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <GraduationCap size={14} aria-hidden="true" />
            {bn ? 'প্রতিষ্ঠাতা দল' : 'MEET THE FOUNDING TEAM'}
          </span>
          <h2 id="team-heading">
            {bn ? 'যাঁদের উদ্যোগে ট্রুথহাববিডি' : 'Who Created TruthHubBD'}
          </h2>
          <p>
            {bn
              ? 'ট্রুথহাববিডি আহসানউল্লাহ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় (AUST), ঢাকা-র তিন শিক্ষার্থীর একটি সমন্বিত উদ্যোগ।'
              : 'TruthHubBD was created by three students from Ahsanullah University of Science and Technology (AUST), Dhaka, Bangladesh.'}
          </p>
        </div>

        <div className="team-grid">
          <article className="team-card">
            <div className="team-avatar-placeholder" aria-hidden="true">
              IK
            </div>
            <div className="team-info">
              <h3>Ishraq Alom Khan</h3>
              <p className="team-role">{bn ? 'সহ-প্রতিষ্ঠাতা / ডেভেলপমেন্ট টিম' : 'Co-Founder / Development Team'}</p>
              <p className="team-inst">Ahsanullah University of Science and Technology</p>
            </div>
          </article>

          <article className="team-card">
            <div className="team-avatar-placeholder" aria-hidden="true">
              FI
            </div>
            <div className="team-info">
              <h3>M.M. Faysal Iqbal</h3>
              <p className="team-role">{bn ? 'সহ-প্রতিষ্ঠাতা / ডেভেলপমেন্ট টিম' : 'Co-Founder / Development Team'}</p>
              <p className="team-inst">Ahsanullah University of Science and Technology</p>
            </div>
          </article>

          <article className="team-card">
            <div className="team-avatar-placeholder" aria-hidden="true">
              NN
            </div>
            <div className="team-info">
              <h3>Nahid Hasan Nafi</h3>
              <p className="team-role">{bn ? 'সহ-প্রতিষ্ঠাতা / ডেভেলপমেন্ট টিম' : 'Co-Founder / Development Team'}</p>
              <p className="team-inst">Ahsanullah University of Science and Technology</p>
            </div>
          </article>
        </div>

        <div className="university-banner">
          <div className="university-banner-icon" aria-hidden="true">
            <GraduationCap size={22} />
          </div>
          <div>
            <p>
              <strong>Ahsanullah University of Science and Technology (AUST)</strong> · Dhaka, Bangladesh
              <br />
              {bn
                ? 'শিক্ষার্থীদের সমাজমুখী প্রযুক্তি উদ্ভাবনের অংশ হিসেবে প্ল্যাটফর্মটি তৈরি ও পরিচালিত হচ্ছে।'
                : 'Developed by university students focused on citizen empowerment, digital transparency, and civic technology.'}
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="info-section" aria-labelledby="story-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <Compass size={14} aria-hidden="true" />
            {bn ? 'আমাদের যাত্রা' : 'ORIGIN & INSPIRATION'}
          </span>
          <h2 id="story-heading">{bn ? 'আমাদের গল্প' : 'Our Story'}</h2>
        </div>

        <div className="info-callout">
          <p>
            {bn
              ? 'বাংলাদেশে যেকোনো প্রতিষ্ঠান, ই-কমার্স পেইজ, হাসপাতাল বা সেবামূলক প্রতিষ্ঠান সম্পর্কে নির্ভরযোগ্য তথ্য খুঁজে পাওয়া একটি নিত্যদিনের চ্যালেঞ্জ। প্রয়োজনীয় তথ্য বিভিন্ন ওয়েবসাইট ও সোশ্যাল মিডিয়ার পাতায় ছড়িয়ে-ছিটিয়ে থাকে। মানুষ প্রায়শই ভুয়া অনলাইন শপ, বিভ্রান্তিকর বিজ্ঞাপন, নিম্নমানের সেবা, কৃত্রিম রিভিউ এবং ভুয়া তথ্যের মুখোমুখি হন। প্রতারণার শিকার হলে কোথায় সঠিক তথ্য প্রকাশ করবেন কিংবা প্রতিষ্ঠানটি বৈধ কি না তা বোঝার কোনো একক উন্মুক্ত মাধ্যম ছিল না।'
              : 'TruthHubBD began as an initiative by three university students who observed a widespread challenge across Bangladesh: citizens struggle to find trustworthy, verified information about businesses, online shops, hospitals, educational institutions, and public services. Information is often fragmented across social media pages and isolated forums.'}
          </p>
          <p style={{ marginTop: '12px' }}>
            {bn
              ? 'এই সমস্যার সমাধানে আমরা একটি কেন্দ্রীয় নাগরিক প্ল্যাটফর্ম তৈরির সিদ্ধান্ত নিই—যেখানে মানুষ সহজে প্রতিষ্ঠানের তথ্য জানতে পারবে, নিজের বাস্তব অভিজ্ঞতা ও প্রমাণ শেয়ার করতে পারবে এবং প্রতারণা থেকে অন্যদের সতর্ক করতে পারবে।'
              : 'Everyday consumers often face fraudulent online pages, misleading advertisements, fabricated reviews, and unverified contact numbers. The founding team wanted to build one consolidated platform where citizens could find accurate listings, share verified experiences with receipts or evidence, and empower fellow community members to make informed decisions.'}
          </p>
        </div>
      </section>

      {/* Our Goal Section */}
      <section className="info-section" aria-labelledby="goal-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <Sparkles size={14} aria-hidden="true" />
            {bn ? 'আমাদের লক্ষ্য' : 'OUR PURPOSE'}
          </span>
          <h2 id="goal-heading">{bn ? 'আমাদের লক্ষ্য' : 'Our Goal'}</h2>
          <p>
            {bn
              ? 'বাংলাদেশে একটি অধিকতর স্বচ্ছ, নির্ভরযোগ্য ও জবাবদিহিতামূলক ডিজিটাল পরিবেশ গড়ে তোলা।'
              : "TruthHubBD's goal is to help build a more transparent, informed, and accountable digital environment in Bangladesh."}
          </p>
        </div>

        <div className="info-cards-grid-3">
          <div className="info-card">
            <div className="info-card-icon" aria-hidden="true"><Search size={20} /></div>
            <h3>{bn ? 'সহজে প্রতিষ্ঠান সন্ধান' : 'Discover Organizations'}</h3>
            <p>{bn ? 'বাংলাদেশের ৮টি বিভাগের ব্যবসা, হাসপাতাল, শিক্ষাপ্রতিষ্ঠান ও সেবাদাতাদের সঠিক তথ্য এক জায়গায় পাওয়া।' : 'Make useful information about Bangladeshi businesses, healthcare providers, institutions, and public offices easy to find.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon" aria-hidden="true"><MessageSquare size={20} /></div>
            <h3>{bn ? 'বাস্তব অভিজ্ঞতা প্রকাশ' : 'Share Genuine Experiences'}</h3>
            <p>{bn ? 'ভোক্তা ও নাগরিকদের প্রথম হাতের প্রত্যক্ষ অভিজ্ঞতা, রেটিং এবং প্রামাণিক নথি প্রকাশের উন্মুক্ত পরিবেশ।' : 'Give citizens an open, respectful venue to share real first-hand experiences, complete with service ratings and dates.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon" aria-hidden="true"><ShieldAlert size={20} /></div>
            <h3>{bn ? 'প্রতারণা প্রতিরোধ ও সচেতনতা' : 'Responsible Scam Reporting'}</h3>
            <p>{bn ? 'সন্দেহজনক কার্যক্রম ও প্রতারণার তথ্য দায়িত্বশীলভাবে প্রকাশ করে সমাজের অন্যান্য মানুষকে সচেতন করা।' : 'Help expose potential scams and deceptive practices through structured, evidence-backed community reporting.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon" aria-hidden="true"><HeartHandshake size={20} /></div>
            <h3>{bn ? 'প্রতিষ্ঠানের উত্তর ও সমাধান' : 'Right of Response'}</h3>
            <p>{bn ? 'প্রতিষ্ঠানের প্রতিনিধিদের সরাসরি ব্যাখ্যা, অর্থ ফেরত বা সমাধানের প্রমাণ দেওয়ার ন্যায্য অধিকার নিশ্চিত করা।' : 'Allow organizations to address customer concerns, provide official explanations, and document resolutions.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon" aria-hidden="true"><FileCheck size={20} /></div>
            <h3>{bn ? 'মালিকানা যাচাই ও ভেরিফিকেশন' : 'Profile Claim & Verification'}</h3>
            <p>{bn ? 'বৈধ প্রতিষ্ঠানের জন্য প্রোফাইল ক্লেইম ও প্রশাসনিক যাচাইকরণের মাধ্যমে বিশ্বস্ততা বৃদ্ধি করা।' : 'Give legitimate organizations the opportunity to claim their profile and submit official verification documents.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon" aria-hidden="true"><MapPin size={20} /></div>
            <h3>{bn ? 'সঠিক অবস্থান ও ভৌগোলিক তথ্য' : 'Geographic Accuracy'}</h3>
            <p>{bn ? 'ওপেনস্ট্রিটম্যাপ ও ইন্টারেক্টিভ মানচিত্রের সহায়তায় প্রতিষ্ঠানের বাস্তব ঠিকানা নিশ্চিত করা।' : 'Connect scattered public information with interactive maps and OpenStreetMap geographic coordinates.'}</p>
          </div>
        </div>

        {/* Clear Disclaimer */}
        <div className="info-disclaimer-box" role="note">
          <ShieldAlert size={22} aria-hidden="true" />
          <div>
            <p>
              <strong>{bn ? 'গুরুত্বপূর্ণ সচেতনতা বার্তা: ' : 'Important Community Notice: '}</strong>
              {bn
                ? 'ট্রুথহাববিডি কোনো প্রতিষ্ঠান বা সেবার নিখুঁত নিশ্চয়তা দেয় না এবং সমস্ত প্রতারণা নির্মূল করার দাবি করে না। আমরা এমন তথ্য ও উন্মুক্ত সরঞ্জাম সরবরাহ করি, যা নাগরিকদের নিজস্ব যাচাই এবং সচেতন সিদ্ধান্ত গ্রহণে সহায়তা করতে পারে।'
                : 'TruthHubBD does not guarantee that no scams will ever happen, nor does it claim that every piece of information on the internet is verified. Instead, TruthHubBD provides the civic tools and transparent data to HELP users make informed decisions.'}
            </p>
          </div>
        </div>
      </section>

      {/* Our Vision Section */}
      <section className="info-section" aria-labelledby="vision-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <Eye size={14} aria-hidden="true" />
            {bn ? 'আমাদের দৃষ্টিভঙ্গি' : 'OUR VISION'}
          </span>
          <h2 id="vision-heading">{bn ? 'আমাদের ভিশন' : 'Our Vision'}</h2>
          <p>
            {bn
              ? 'আমাদের লক্ষ্য বাংলাদেশের সর্বাধিক কার্যকর ও জনকল্যাণমুখী তথ্য, রিভিউ ও যাচাইকরণ নেটওয়ার্ক গড়ে তোলা—যেখানে মানুষ সহজে প্রতিষ্ঠান খুঁজে পাবে, তাদের সুনাম ও সততা অনুধাবন করতে পারবে এবং দায়িত্বশীলভাবে তথ্য আদান-প্রদান করতে পারবে।'
              : 'Our vision is to build one of Bangladesh’s most useful citizen-focused information, review, and verification platforms — where people can discover organizations, understand their reputation, access public information, and share experiences responsibly.'}
          </p>
        </div>
      </section>

      {/* Our Mission Cards */}
      <section className="info-section" aria-labelledby="mission-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <ShieldCheck size={14} aria-hidden="true" />
            {bn ? 'মূল স্তম্ভসমূহ' : 'PILLARS OF OPERATION'}
          </span>
          <h2 id="mission-heading">{bn ? 'আমাদের মিশন' : 'Our Mission'}</h2>
        </div>

        <div className="info-cards-grid">
          <div className="info-card">
            <div className="info-card-icon" aria-hidden="true"><Eye size={20} /></div>
            <h3>{bn ? 'স্বচ্ছতা (Transparency)' : 'Transparency'}</h3>
            <p>{bn ? 'প্রয়োজনীয় তথ্য যাতে সাধারণ মানুষের কাছে সহজে ও খোলামেলাভাবে পৌঁছাতে পারে তা নিশ্চিত করা।' : 'Make useful institutional and consumer information easier for everyday citizens to access.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon" aria-hidden="true"><CheckCircle2 size={20} /></div>
            <h3>{bn ? 'যাচাইকরণ (Verification)' : 'Verification'}</h3>
            <p>{bn ? 'তথ্যের উৎস ও নির্ভরযোগ্যতা স্পষ্টভাবে তুলে ধরা, যাতে ব্যবহারকারী সঠিক ধারণা পান।' : 'Help users understand where organization details come from and how verified they are.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon" aria-hidden="true"><Users size={20} /></div>
            <h3>{bn ? 'কমিউনিটি (Community)' : 'Community'}</h3>
            <p>{bn ? 'নাগরিকদের অভিজ্ঞতা প্রকাশের সুযোগ দিয়ে একে অপরকে সচেতন ও সুরক্ষিত রাখতে সহায়তা করা।' : 'Empower citizens to share their authentic experiences to guide and protect others.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon" aria-hidden="true"><HeartHandshake size={20} /></div>
            <h3>{bn ? 'ন্যায্যতা (Fairness)' : 'Fairness'}</h3>
            <p>{bn ? 'ভোক্তা ও প্রতিষ্ঠান উভয় পক্ষকেই তথ্য উপস্থাপন এবং উত্তর দেওয়ার সমান সুযোগ প্রদান।' : 'Give both consumers and organizations the opportunity to present facts and respond respectfully.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon" aria-hidden="true"><Lock size={20} /></div>
            <h3>{bn ? 'নিরাপত্তা (Safety)' : 'Safety'}</h3>
            <p>{bn ? 'প্রতারণা, ভুয়া রিভিউ, হুমকি এবং ক্ষতিকর কার্যকলাপ কঠোরভাবে নিরুৎসাহিত ও প্রতিরোধ করা।' : 'Discourage scams, manipulation, fake reviews, and unauthorized exposure of private data.'}</p>
          </div>

          <div className="info-card">
            <div className="info-card-icon" aria-hidden="true"><Compass size={20} /></div>
            <h3>{bn ? 'সহজবোধ্যতা (Accessibility)' : 'Accessibility'}</h3>
            <p>{bn ? 'প্রতিষ্ঠান ও সেবার তথ্য যাতে দেশের যেকোনো সাধারণ নাগরিক সহজে বুঝতে ও ব্যবহার করতে পারেন।' : 'Make complex directory and public service information straightforward for everyday citizens.'}</p>
          </div>
        </div>
      </section>

      {/* What is TruthHubBD? Section */}
      <section className="info-section" aria-labelledby="whatis-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <Building2 size={14} aria-hidden="true" />
            {bn ? 'প্ল্যাটফর্মের বিবরণ' : 'PLATFORM OVERVIEW'}
          </span>
          <h2 id="whatis-heading">{bn ? 'ট্রুথহাববিডি আসলে কী?' : 'What is TruthHubBD?'}</h2>
          <p>
            {bn
              ? 'ট্রুথহাববিডি হলো বাংলাদেশের জন্য নিবেদিত একটি সিটিজেন রিভিউ ও ভেরিফিকেশন নেটওয়ার্ক। প্ল্যাটফর্মে আপনি যা করতে পারবেন:'
              : 'TruthHubBD is a Bangladesh-focused Citizen Review & Verification Network. Based on our live platform, users can:'}
          </p>
        </div>

        <div className="info-cards-grid">
          <div className="info-card">
            <h3>{bn ? '🔍 সার্বিক অনুসন্ধান (Omni-Search)' : '🔍 Omni-Search & Discovery'}</h3>
            <p>{bn ? 'নাম, বাংলা নাম, বিভাগ (ঢাকা, চট্টগ্রাম, রাজশাহী ইত্যাদি) কিংবা ক্যাটাগরি দিয়ে নিমেষেই প্রতিষ্ঠান খুঁজে বের করুন।' : 'Instantly search by organization name, Bengali name, 8 administrative divisions, or industry category.'}</p>
          </div>

          <div className="info-card">
            <h3>{bn ? '⭐ নাগরিক রিভিউ ও রেটিং' : '⭐ Citizen Reviews & Ratings'}</h3>
            <p>{bn ? '১ থেকে ৫ স্টার রেটিং, সেবার মান, মূল্য ও যোগাযোগের সন্তুষ্টির সাথে বাস্তব অভিজ্ঞতার রিভিউ পড়ুন ও লিখুন।' : 'Read and submit authentic 1–5 star reviews with detailed ratings for service, value, and communication.'}</p>
          </div>

          <div className="info-card">
            <h3>{bn ? '🚨 প্রকাশ্য স্ক্যাম অ্যালার্ট' : '🚨 Live Public Scam Alerts'}</h3>
            <p>{bn ? 'প্রতারণার শিকার হলে সরাসরি কেস জমা দিন; সঙ্গে রসিদ, চালান, বা স্ক্রিনশট যুক্ত করে তাৎক্ষণিক প্রকাশ করুন।' : 'Report fraud or non-delivery incidents with transaction amounts, dates, and evidence for immediate public awareness.'}</p>
          </div>

          <div className="info-card">
            <h3>{bn ? '🗺️ ইন্টারেক্টিভ ম্যাপ ও এলাকা' : '🗺️ Interactive Location Maps'}</h3>
            <p>{bn ? 'ম্যাপলিব্রে ও ওপেনস্ট্রিটম্যাপের মানচিত্রে সঠিক ভৌগোলিক অবস্থান ও দিকনির্দেশনা দেখুন।' : 'View accurate physical locations, coordinates, and navigation links via MapLibre and OpenStreetMap.'}</p>
          </div>

          <div className="info-card">
            <h3>{bn ? '🏢 প্রতিষ্ঠান ক্লেইম ও ব্যবসা কেন্দ্র' : '🏢 Organization Center'}</h3>
            <p>{bn ? 'মালিকরা তাদের প্রতিষ্ঠান ক্লেইম করে ট্রেড লাইসেন্স বা প্রমাণপত্র জমা দিতে পারেন এবং কাস্টমারদের উত্তর দিতে পারেন।' : 'Business representatives can claim existing listings, manage information, and post official responses.'}</p>
          </div>

          <div className="info-card">
            <h3>{bn ? '🛡️ নিরাপদ অ্যাকাউন্ট ও নোটিফিকেশন' : '🛡️ Account Security & 2FA'}</h3>
            <p>{bn ? 'ইমেইল ভেরিফিকেশন, অপশনাল টু-ফ্যাক্টর অথেনটিকেশন (2FA) এবং রিয়েল-টাইম নোটিফিকেশন সুবিধা।' : 'Citizen accounts with email verification, optional two-factor authentication (MFA), and live alerts.'}</p>
          </div>
        </div>
      </section>

      {/* How Our Directory Works Section */}
      <section className="info-section" aria-labelledby="directory-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <FileCheck size={14} aria-hidden="true" />
            {bn ? 'ডিরেক্টরি নীতিমালা' : 'DIRECTORY OPERATIONS'}
          </span>
          <h2 id="directory-heading">{bn ? 'আমাদের ডিরেক্টরি কীভাবে কাজ করে?' : 'How Our Directory Works'}</h2>
          <p>
            {bn
              ? 'ট্রুথহাববিডির তালিকাগুলো বিভিন্ন নির্ভরযোগ্য উৎস থেকে সংকলিত হয়। কোনো প্রতিষ্ঠানের উপস্থিতি মানেই তা ট্রুথহাববিডি কর্তৃক স্পনসরকৃত বা অনুমোদিত নয়।'
              : 'Organization profiles on TruthHubBD are compiled from verified community contributions and public databases. An appearance in the directory does not imply endorsement by TruthHubBD.'}
          </p>
        </div>

        <div className="info-cards-grid-3">
          <div className="info-card" style={{ borderTop: '4px solid #f59e0b' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#b45309', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              <ShieldAlert size={16} /> {bn ? 'অযাচাইকৃত (Unverified)' : 'Unverified Listing'}
            </div>
            <p>
              {bn
                ? 'উন্মুক্ত নাগরিক তথ্য বা ওপেনস্ট্রিটম্যাপের ডেটাসেট থেকে সংগৃহীত। এখনও কোনো আনুষ্ঠানিক মালিকানা বা প্রাতিষ্ঠানিক কাগজপত্র যাচাই করা হয়নি।'
                : 'Created from public datasets, OpenStreetMap, or community suggestions. No official owner has claimed or verified the profile yet.'}
            </p>
          </div>

          <div className="info-card" style={{ borderTop: '4px solid #3b82f6' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1d4ed8', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              <Building2 size={16} /> {bn ? 'মালিকানা দাবি করা (Claimed)' : 'Owner Claimed'}
            </div>
            <p>
              {bn
                ? 'প্রতিষ্ঠানের একজন প্রতিনিধি অ্যাকাউন্ট লিংক করে মালিকানা দাবি করেছেন এবং তিনি প্রোফাইলের তথ্য হালনাগাদ করার অধিকার রাখেন।'
                : 'An official representative has claimed control of the profile and can update contact information and post official responses.'}
            </p>
          </div>

          <div className="info-card" style={{ borderTop: '4px solid #10b981' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              <ShieldCheck size={16} /> {bn ? 'যাচাইকৃত (Verified)' : 'Verified Organization'}
            </div>
            <p>
              {bn
                ? 'ট্রেড লাইসেন্স, দাপ্তরিক ইমেইল বা প্রাতিষ্ঠানিক প্রমাণের মাধ্যমে ট্রুথহাববিডি অ্যাডমিন দল কর্তৃক পরিচয় নিশ্চিত হওয়া প্রোফাইল।'
                : 'Identity and operational authority authenticated by TruthHubBD staff via trade license, official domain email, or verified documents.'}
            </p>
          </div>
        </div>
      </section>

      {/* Our 9 Principles */}
      <section className="info-section" aria-labelledby="principles-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <CheckCircle2 size={14} aria-hidden="true" />
            {bn ? 'কমিউনিটি আদর্শ' : 'ETHICAL COMMITMENT'}
          </span>
          <h2 id="principles-heading">{bn ? 'আমাদের ৯টি মূল নীতি' : 'Our Nine Principles'}</h2>
        </div>

        <div className="info-cards-grid-3">
          {[
            {
              title: bn ? '১. স্বচ্ছতা (Transparency)' : '1. Transparency',
              desc: bn ? 'তথ্যের উৎস ও প্রকাশের শর্তাবলী পরিষ্কার রাখা।' : 'Openly display information sources and operational criteria.',
            },
            {
              title: bn ? '২. যথার্থতা (Accuracy)' : '2. Accuracy',
              desc: bn ? 'ভুল বা অসত্য তথ্য শনাক্ত ও সংশোধন করার ব্যবস্থা।' : 'Continuously refine data and facilitate user corrections.',
            },
            {
              title: bn ? '৩. পক্ষপাতহীন ন্যায্যতা (Fairness)' : '3. Fairness',
              desc: bn ? 'ভোক্তা বা প্রতিষ্ঠান কারো প্রতি অন্ধ পক্ষপাত না রাখা।' : 'Treat both consumers and businesses equitably.',
            },
            {
              title: bn ? '৪. নাগরিক দায়িত্বশীলতা (Responsibility)' : '4. Community Responsibility',
              desc: bn ? 'সত্য ও শালীন ভাষায় দায়িত্বশীল মতামত প্রকাশ।' : 'Encourage honest, respectful, and constructive discourse.',
            },
            {
              title: bn ? '৫. আত্মপক্ষ সমর্থনের অধিকার (Right of Response)' : '5. Right of Response',
              desc: bn ? 'প্রতিষ্ঠানকে বক্তব্য ও সমাধানের সুযোগ নিশ্চিত করা।' : 'Ensure entities can respond and demonstrate solutions.',
            },
            {
              title: bn ? '৬. তথ্যের গোপনীয়তা (Privacy)' : '6. Privacy & Redaction',
              desc: bn ? 'ব্যক্তিগত জাতীয় পরিচয়পত্র বা সংবেদনশীল তথ্য গোপন রাখা।' : 'Protect personal IDs, phone numbers, and financial details.',
            },
            {
              title: bn ? '৭. নিরাপত্তা ও নিয়মানুবর্তিতা (Safety)' : '7. Safety & Compliance',
              desc: bn ? 'সাইবার প্রতারণা ও ভুয়া তথ্যের বিরুদ্ধে দৃঢ় অবস্থান।' : 'Proactively counter fraudulent and malicious behavior.',
            },
            {
              title: bn ? '৮. প্রমাণভিত্তিক রিপোর্ট (Evidence-Based)' : '8. Evidence-Based Reporting',
              desc: bn ? 'অভিযোগের সমর্থনে রসিদ ও প্রমাণের গুরুত্ব দেওয়া।' : 'Prioritize documentation, invoices, and factual evidence.',
            },
            {
              title: bn ? '৯. ক্রমাগত উন্নয়ন (Continuous Improvement)' : '9. Continuous Improvement',
              desc: bn ? 'নাগরিকদের মতামতের ভিত্তিতে প্ল্যাটফর্মের ফিচার উন্নত করা।' : 'Iterate platform capabilities to better serve Bangladesh.',
            },
          ].map((item, i) => (
            <div className="info-card" key={i}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Responsibility & Independence */}
      <section className="info-section" aria-labelledby="independence-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <Lock size={14} aria-hidden="true" />
            {bn ? 'স্বাধীনতা ও দায়বদ্ধতা' : 'INDEPENDENCE & LIMITATIONS'}
          </span>
          <h2 id="independence-heading">{bn ? 'আমাদের স্বাধীনতা ও দায়িত্ব' : 'Our Responsibility & Independence'}</h2>
        </div>

        <div className="info-callout">
          <p>
            {bn
              ? 'ব্যবহারকারীদের দেওয়া রিভিউ কেবল তাঁদের নিজস্ব অভিজ্ঞতা ও মতামত প্রকাশ করে; এটি ট্রুথহাববিডি কর্তৃপক্ষের ব্যক্তিগত অভিমত নয়।'
              : 'User reviews represent the views and experiences of individual reviewers and do not automatically reflect the opinion of TruthHubBD.'}
          </p>
          <p style={{ marginTop: '10px' }}>
            {bn
              ? 'আমরা তথ্যের সঠিকতা বজায় রাখতে সর্বোচ্চ সচেষ্ট থাকি। তবে ফোন নম্বর, ঠিকানা বা প্রতিষ্ঠানের অস্তিত্ব সময়ের সাথে পরিবর্তিত হতে পারে। তাই বড় কোনো আর্থিক সিদ্ধান্ত বা লেনদেনের আগে ব্যবহারকারীদের স্বাধীনভাবে তথ্য যাচাই করে নেওয়ার অনুরোধ করা হচ্ছে।'
              : 'While we strive to keep records accurate, addresses, contact numbers, and operational statuses change over time. Users should independently verify critical details before significant transactions.'}
          </p>
          <p style={{ marginTop: '10px' }}>
            {bn
              ? 'বিজ্ঞাপন ও বাণিজ্যিক স্পনসরশিপ কখনোই রিভিউ, স্টার রেটিং কিংবা মডারেশন সিদ্ধান্তকে প্রভাবিত করে না। আমাদের বিজ্ঞাপন নীতি ও নাগরিক বোর্ড সম্পূর্ণ আলাদা ও স্বচ্ছ।'
              : 'TruthHubBD maintains strict editorial independence: advertising sponsorships never alter ratings, community reviews, or moderation decisions.'}
          </p>
        </div>
      </section>

      {/* Our Journey Timeline */}
      <section className="info-section" aria-labelledby="journey-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <Compass size={14} aria-hidden="true" />
            {bn ? 'অগ্রযাত্রার ধাপ' : 'DEVELOPMENT MILESTONES'}
          </span>
          <h2 id="journey-heading">{bn ? 'আমাদের পরিক্রমা' : 'Our Journey'}</h2>
        </div>

        <div className="info-timeline">
          <div className="info-timeline-step">
            <span className="info-timeline-dot">1</span>
            <div className="info-timeline-body">
              <h4>{bn ? 'ভাবনা ও পরিকল্পনা (The Idea)' : 'The Idea'}</h4>
              <p>{bn ? 'অস্টের ৩ শিক্ষার্থী বাংলাদেশে ছড়িয়ে-ছিটিয়ে থাকা তথ্য এবং ভোক্তা প্রতারণার সংকট অনুধাবন করেন।' : 'Three AUST university students identify the pressing need for a transparent, verified citizen information and review network in Bangladesh.'}</p>
            </div>
          </div>

          <div className="info-timeline-step">
            <span className="info-timeline-dot">2</span>
            <div className="info-timeline-body">
              <h4>{bn ? 'গবেষণা ও তথ্য বিশ্লেষণ (Research)' : 'Research & System Design'}</h4>
              <p>{bn ? 'বাংলাদেশের ৮টি বিভাগ, ওপেন ডেটা এবং ভোক্তা অধিকার আইনের উপর গবেষণা করে প্ল্যাটফর্মের আর্কিটেকচার তৈরি।' : 'Deep research into nationwide directory structuring, OpenStreetMap integration, and fair moderation standards.'}</p>
            </div>
          </div>

          <div className="info-timeline-step">
            <span className="info-timeline-dot">3</span>
            <div className="info-timeline-body">
              <h4>{bn ? 'প্ল্যাটফর্ম ডেভেলপমেন্ট (Development)' : 'Engineering TruthHubBD'}</h4>
              <p>{bn ? 'লারাভেল ও নেক্সট.জেএস প্রযুক্তির সমন্বয়ে শক্তিশালী সার্চ, ম্যাপ, কেস ট্র্যাকিং ও দ্বিভাষিক ব্যবস্থা নির্মাণ।' : 'Built robust full-stack software with Sanctum security, MapLibre geographic tools, real-time scam tallying, and Bengali localization.'}</p>
            </div>
          </div>

          <div className="info-timeline-step">
            <span className="info-timeline-dot">4</span>
            <div className="info-timeline-body">
              <h4>{bn ? 'নাগরিক অংশগ্রহণ (Community Launch)' : 'Community Participation'}</h4>
              <p>{bn ? 'সাধারণ নাগরিক ও বৈধ প্রতিষ্ঠানসমূহকে যুক্ত করে প্রমাণভিত্তিক তথ্য আদান-প্রদান চালু।' : 'Welcoming citizens, reviewers, and verified business owners across Bangladesh to participate openly.'}</p>
            </div>
          </div>

          <div className="info-timeline-step">
            <span className="info-timeline-dot">5</span>
            <div className="info-timeline-body">
              <h4>{bn ? 'ভবিষ্যৎ প্রসার (Future Growth)' : 'Future Growth'}</h4>
              <p>{bn ? 'সমগ্র দেশের প্রত্যন্ত অঞ্চলের নির্ভরযোগ্য তথ্য আরও সহজে সবার নাগালে পৌঁছে দেওয়ার নিরন্তর প্রচেষ্টা।' : 'Expanding directory depth, verification partnerships, and consumer transparency nationwide.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* A Message from the Team */}
      <section className="info-section" aria-labelledby="message-heading">
        <div className="info-section-header">
          <span className="info-section-kicker">
            <HeartHandshake size={14} aria-hidden="true" />
            {bn ? 'প্রতিষ্ঠাতাদের বার্তা' : 'FROM THE FOUNDERS'}
          </span>
          <h2 id="message-heading">{bn ? 'টিমের পক্ষ থেকে এক টুকরো বার্তা' : 'A Message from the Team'}</h2>
        </div>

        <div className="info-callout" style={{ borderLeftColor: '#1e3a8a', background: '#f8fafc' }}>
          <blockquote style={{ margin: 0, fontStyle: 'italic', fontSize: '15.5px', lineHeight: 1.7, color: '#1e293b' }}>
            {bn
              ? '“আমরা ট্রুথহাববিডি শুরু করেছিলাম কারণ আমরা বিশ্বাস করি যেকোনো প্রতিষ্ঠান বা সেবা নির্বাচনের পূর্বে সাধারণ মানুষের সঠিক ও নিরপেক্ষ তথ্য পাওয়ার অধিকার রয়েছে। আমাদের উদ্দেশ্য কারও হয়ে সিদ্ধান্ত নেওয়া নয়; বরং সবাইকে নির্ভরযোগ্য তথ্য, বাস্তব অভিজ্ঞতা ও আধুনিক টুলস দেওয়া যাতে প্রত্যেকে নিজ প্রজ্ঞায় সেরা সিদ্ধান্ত নিতে পারেন। ট্রুথহাববিডি ক্রমাগত সমৃদ্ধ হচ্ছে এবং আমরা আপনাদের সহযোগিতা নিয়ে এটিকে বাংলাদেশের প্রতিটি নাগরিকের জন্য আরও কার্যকর করে তুলতে চাই।”'
              : '“We started TruthHubBD because we believe people deserve easy access to useful, reliable information before choosing a product, service, or organization. Our goal is not to decide for people, but to provide better information, real experiences, and useful tools so they can make their own informed decisions. TruthHubBD is growing, and we look forward to improving it together with our community.”'}
          </blockquote>
          <div style={{ marginTop: '18px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
            <p style={{ margin: 0, fontWeight: 750, color: '#0f766e', fontSize: 14 }}>
              Ishraq Alom Khan · M.M. Faysal Iqbal · Nahid Hasan Nafi
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
              Ahsanullah University of Science and Technology (AUST), Dhaka, Bangladesh
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="info-cta" aria-labelledby="about-cta-title">
        <div>
          <h2 id="about-cta-title">
            {bn ? 'ট্রুথহাববিডিতে ঘুরে দেখতে প্রস্তুত?' : 'Ready to explore TruthHubBD?'}
          </h2>
          <p>
            {bn
              ? 'হাজারো প্রতিষ্ঠানের তথ্য খুঁজুন, কমিউনিটির অভিজ্ঞতা পড়ুন অথবা আপনার পরিচিত প্রতিষ্ঠান যোগ করুন।'
              : 'Search thousands of Bangladeshi organizations, read genuine reviews, or learn how to navigate the platform safely.'}
          </p>
        </div>
        <div className="info-cta-actions">
          <Link to="/search?view=businesses" className="btn-cta-white">
            <Search size={16} aria-hidden="true" />
            {bn ? 'প্রতিষ্ঠান খুঁজুন' : 'Explore Organizations'}
          </Link>
          <Link to="/how-to-use" className="btn-cta-outline">
            {bn ? 'ব্যবহার নির্দেশিকা' : 'How to Use'}
          </Link>
          <Link to="/trust-safety" className="btn-cta-outline">
            {bn ? 'আস্থা ও নিরাপত্তা নীতি' : 'Trust & Safety'}
          </Link>
        </div>
      </section>
    </div>
  );
}
