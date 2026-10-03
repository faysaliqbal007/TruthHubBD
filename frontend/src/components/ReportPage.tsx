"use client";
import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Bookmark, Check, CheckCircle2, Lock } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { useSearchParams, useLocation, Link } from "react-router-dom";
import { api } from "../services/api";
import { ReportChooser } from "./ReportChooser";
import { businessService } from "../services/businessService";
import type { Business } from "../types";
import "./content-report.css";
import {useLanguage,useI18n} from '../i18n/LanguageContext';
import {formatNumber, localizedError} from '../i18n/dictionary';

type ContentType = "review" | "business" | "comment" | "scam_case" | "advertisement";
const contentTypes: ContentType[] = ["review", "business", "comment", "scam_case", "advertisement"];

export function ReportPage({ lang: requestedLang }: { lang?: "en" | "bn" }) {
  const {lang: contextLang} = useLanguage();
  const lang = requestedLang || contextLang;
  const [params] = useSearchParams();
  return !params.has("kind") && !params.has("type") && !params.has("id")
    ? <ReportChooser lang={lang} />
    : <ContentReport key={params.toString()} lang={lang} />;
}

function ContentReport({ lang }: { lang: "en" | "bn" }) {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const bn = lang === "bn";
  const rawType = params.get("type");
  const type: ContentType = contentTypes.includes(rawType as ContentType) ? rawType as ContentType : "business";
  const suppliedTarget = params.has("id");
  const initialTarget = params.get("id") || "";
  const invalidReference = (rawType !== null && !contentTypes.includes(rawType as ContentType)) ||
    (suppliedTarget && (!/^[1-9]\d*$/.test(initialTarget) || !Number.isSafeInteger(Number(initialTarget))));
  const [target, setTarget] = useState(initialTarget);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [reason, setReason] = useState(params.get("reason")?.includes("closed") ? "closed_business" : type === "business" ? "inaccurate_information" : "harmful_content");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [ticket, setTicket] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Business[]>([]);
  const [searching, setSearching] = useState(false);
  const sending = useRef(false);
  const labels: Record<ContentType, string> = {
    review: bn ? "রিভিউ" : "Review", business: bn ? "প্রতিষ্ঠান" : "Business",
    comment: bn ? "মন্তব্য" : "Comment", scam_case: bn ? "সতর্কতা" : "Alert", advertisement: bn ? "বিজ্ঞাপন" : "Advertisement",
  };
  const heading = type === "business"
    ? (bn ? "প্রতিষ্ঠানের তথ্য সংশোধনের অনুরোধ" : "Request a business correction")
    : (bn ? `এই ${labels[type]} সম্পর্কে জানান` : `Report this ${labels[type].toLowerCase()}`);
  const returnPath = "/report?" + params.toString();

  useEffect(() => {
    if (suppliedTarget || type !== "business" || query.trim().length < 2) {
      setMatches([]); setSearching(false); return;
    }
    let active = true;
    setSearching(true);
    const timer = setTimeout(() => {
      businessService.search(query.trim()).then(rows => { if (active) setMatches(rows.slice(0, 6)); })
        .catch(() => { if (active) setMessage(bn ? "অনুসন্ধান করা যায়নি। আবার চেষ্টা করুন।" : "Search could not load. Try again."); })
        .finally(() => { if (active) setSearching(false); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [query, type, suppliedTarget, bn]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current) return;
    if (invalidReference || !/^[1-9]\d*$/.test(target) || !Number.isSafeInteger(Number(target))) {
      setMessage(bn ? "একটি প্রতিষ্ঠান নির্বাচন করুন বা কনটেন্টের রিপোর্ট লিংক ব্যবহার করুন।" : "Select a business or use the Report link on the content you want to report.");
      return;
    }
    if (!details.trim()) { setMessage(bn ? "আপনার উদ্বেগের কারণ লিখুন।" : "Explain what needs attention."); return; }
    sending.current = true; setBusy(true); setMessage("");
    try {
      const result = await api<{ data: { id: number } }>("/reports", "POST", { reportable_type: type, reportable_id: Number(target), reason, details: details.trim() });
      if (!Number.isSafeInteger(result.data?.id) || result.data.id < 1) throw new Error(bn ? "সার্ভার জমা নিশ্চিত করেনি। আবার চেষ্টা করুন।" : "The server did not confirm submission. Please try again.");
      setTicket(result.data.id);
    } catch (error) { setMessage(localizedError((error as Error).message, lang) || (bn ? "জমা হয়নি। আবার চেষ্টা করুন।" : "Not submitted. Please try again.")); }
    finally { setBusy(false); sending.current = false; }
  }

  return (
    <div className="workspace-page civic-correction content-report-page">
      <header className="workspace-heading">
        <Link to="/report">← {bn ? "সব রিপোর্টের পথ" : "All reporting options"}</Link>
        <span className="civic-kicker">{bn ? "কমিউনিটির তথ্য সঠিক রাখতে সাহায্য করুন" : "HELP KEEP COMMUNITY CONTENT ACCURATE"}</span>
        <h1>{heading}</h1>
        <p>{bn ? "মডারেশন দলকে আপনার উদ্বেগ জানান। অনুরোধটি পর্যালোচনার জন্য পাঠানো হবে।" : "Tell the moderation team what needs attention. Your request will be reviewed before a decision is made."}</p>
      </header>
      {suppliedTarget && !invalidReference && <div className="content-report-reference" aria-label={bn ? "নির্বাচিত কনটেন্ট" : "Selected content"}>
        <Lock size={18} aria-hidden="true" />
        <div><strong>{labels[type]} #{formatNumber(Number(target),lang,{useGrouping:false})}</strong><small>{bn ? "এই রিপোর্টের কনটেন্ট নির্ধারিত আছে।" : "This is the selected content for your report."}</small></div>
        {type === "review" && <Link to={`/reviews/${target}`}>{bn ? "রিভিউ দেখুন" : "View review"}</Link>}
        {type === "advertisement" && <Link to="/ads">{bn ? "বিজ্ঞাপন দেখুন" : "View advertisements"}</Link>}
      </div>}
      {invalidReference ? <section className="workspace-card" role="alert">
        <h2>{bn ? "কনটেন্টের লিংকটি সঠিক নয়" : "This content reference is invalid"}</h2>
        <p>{bn ? "কনটেন্টে ফিরে রিপোর্ট লিংক ব্যবহার করুন।" : "Return to the content and use its Report link to select the correct item."}</p>
        <Link className="civic-primary" to="/report">{bn ? "রিপোর্টের পথ দেখুন" : "Choose a reporting option"}</Link>
      </section> : ticket ? <section className="workspace-card" role="status">
        <CheckCircle2 size={32} aria-hidden="true" /><h2>{bn ? "অনুরোধ জমা হয়েছে" : "Request received"} · #{formatNumber(ticket,lang,{useGrouping:false})}</h2>
        <p>{bn ? "সার্ভার আপনার অনুরোধ মডারেশনের জন্য সংরক্ষণ করেছে।" : "The server has saved your request for moderation."}</p>
        <Link className="civic-primary" to="/activity">{bn ? "আমার কার্যক্রমে দেখুন" : "Track in My activity"} <ArrowRight size={18} aria-hidden="true" /></Link>
      </section> : !user ? <section className="workspace-card">
        <h2>{bn ? "রিপোর্ট পাঠাতে সাইন ইন করুন" : "Sign in to send this report"}</h2>
        <p>{bn ? "আপনার অ্যাকাউন্ট থেকে অনুরোধের অগ্রগতি দেখতে পারবেন।" : "Your account lets you track the outcome and answer follow-up questions."}</p>
        <Link className="civic-primary" to={"/login?next=" + encodeURIComponent(returnPath)}>{bn ? "সাইন ইন করে এগিয়ে যান" : "Sign in to continue"}</Link>
      </section> : <form className="workspace-card review-form-content" onSubmit={submit} aria-busy={busy}>
        {!suppliedTarget && type === "business" && <div>
          <label htmlFor="report-business">{bn ? "প্রতিষ্ঠান খুঁজুন" : "Find the business"}<input id="report-business" className="review-input" value={query} maxLength={255} onChange={event => { setQuery(event.target.value); setTarget(""); setSelectedBusiness(null); }} placeholder={bn ? "নাম বা এলাকা দিয়ে খুঁজুন" : "Search business name or area"} /></label>
          {searching && <p role="status">{bn ? "খোঁজা হচ্ছে…" : "Searching…"}</p>}
          {!searching && query.trim().length >= 2 && !matches.length && <p>{bn ? "কোনো প্রতিষ্ঠান পাওয়া যায়নি। অন্য নাম দিয়ে চেষ্টা করুন।" : "No businesses found. Try another name or area."}</p>}
          <div className="civic-entity-options">{matches.map(business => <button key={business.id} className="civic-entity-option" type="button" aria-pressed={target === String(business.id)} onClick={() => { setTarget(String(business.id)); setSelectedBusiness(business); }}>
            <strong>{business.name}</strong><small>{business.location || (bn ? "ঠিকানা দেওয়া নেই" : "Address not listed")}</small>{target === String(business.id) && <Check size={18} aria-hidden="true" />}
          </button>)}</div>
          {selectedBusiness && <p className="content-selected-business"><Check size={16} aria-hidden="true" />{bn ? "নির্বাচিত:" : "Selected:"} {selectedBusiness.name} · #{selectedBusiness.id}</p>}
        </div>}
        {!suppliedTarget && type !== "business" && <p className="workspace-notice">{bn ? "সংশ্লিষ্ট কনটেন্টের রিপোর্ট লিংক ব্যবহার করুন।" : "Open the content you want to report and use its Report link. This selects the correct reference automatically."} <Link to={type === "scam_case" ? "/scam-alerts" : type === "advertisement" ? "/ads" : "/search"}>{bn ? "কনটেন্ট খুঁজুন" : "Find content"}</Link></p>}
        <label htmlFor="report-concern">{bn ? "কী বিষয়ে নজর দেওয়া দরকার?" : "What needs attention?"}<select id="report-concern" className="review-input" value={reason} onChange={event => setReason(event.target.value)}>
          {type === "business" && <><option value="inaccurate_information">{bn ? "ভুল তথ্য বা ঠিকানা" : "Incorrect details / address"}</option><option value="closed_business">{bn ? "প্রতিষ্ঠান বন্ধ" : "Business is closed"}</option></>}
          <option value="spam_manipulation">{bn ? "স্প্যাম বা সাজানো কনটেন্ট" : "Spam or manipulated content"}</option>
          <option value="harmful_content">{bn ? "ক্ষতিকর বা বিভ্রান্তিকর কনটেন্ট" : "Harmful or misleading content"}</option>
          <option value="other">{bn ? "অন্য উদ্বেগ" : "Other concern"}</option>
        </select></label>
        <label htmlFor="report-details">{bn ? "আপনার উদ্বেগের কারণ লিখুন (প্রয়োজনীয়)" : "Explain your concern (required)"}<textarea id="report-details" className="review-textarea" required rows={6} value={details} maxLength={3000} onChange={event => setDetails(event.target.value)} aria-describedby="report-details-hint" placeholder={bn ? "কী ভুল বা উদ্বেগজনক? সম্ভব হলে একটি পাবলিক সূত্রের লিংক দিন।" : "What is incorrect or concerning? Include a public source link if available."} /></label>
        <small id="report-details-hint">{formatNumber(details.length,lang)}/{formatNumber(3000,lang)} {bn ? "অক্ষর। পাসওয়ার্ড, অ্যাকাউন্ট নম্বর বা ব্যক্তিগত পরিচয়পত্র দেবেন না।" : "characters. Do not include passwords, account numbers or private identity documents."}</small>
        <p>{bn ? "প্রতারণার ঘটনার ছবি বা রসিদ জমা দিয়ে সবাইকে সতর্ক করতে চান?" : "Need to report a scam with photos or receipts to warn others?"} <Link to="/scam-alerts/submit">{bn ? "স্ক্যাম অ্যালার্ট রিপোর্ট করুন।" : "Submit a scam alert."}</Link></p>
        {message && <p role="alert" className="workspace-notice">{message}</p>}
        <button disabled={busy || !target} className="civic-primary" type="submit">{busy ? (bn ? "জমা হচ্ছে…" : "Submitting…") : (bn ? "পর্যালোচনার জন্য পাঠান" : "Send for review")}<ArrowRight size={18} aria-hidden="true" /></button>
      </form>}
    </div>
  );
}

export function SaveEntity({ id }: { id: number }) {
  const {lang,t}=useI18n();
  const currentLocation=useLocation();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    setSaved(false);
    setReady(false);
    setMessage("");
    if (user)
      api<{ saved: boolean }>(`/businesses/${id}/saved`)
        .then((r) => {
          if (active) {
            setSaved(r.saved);
            setReady(true);
          }
        })
        .catch(() => {
          if (active) setReady(true);
        });
    else setReady(true);
    return () => {
      active = false;
    };
  }, [id, user?.id]);

  if (!user) {
    return (
      <Link className="save-entity-button" to={'/login?next='+encodeURIComponent(currentLocation.pathname+currentLocation.search)}>
        <Bookmark size={16} aria-hidden="true" />
        <span>{t('Sign in to save','সংরক্ষণ করতে লগ ইন করুন')}</span>
      </Link>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <button
        type="button"
        className="save-entity-button"
        aria-pressed={saved}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api(`/businesses/${id}/saved`, "PUT", { saved: !saved });
            setSaved(!saved);
            setMessage(!saved ? t('Saved to My Activity.','আমার কার্যক্রমে সংরক্ষিত হয়েছে।') : t('Removed from saved.','সংরক্ষিত তালিকা থেকে সরানো হয়েছে।'));
            setTimeout(() => setMessage(""), 3000);
          } catch (e) {
            setMessage(t('Not saved. Please try again.','সংরক্ষণ হয়নি। আবার চেষ্টা করুন।'));
          } finally {
            setBusy(false);
          }
        }}
      >
        {saved ? <Check size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
        <span>{busy ? t('Saving…','সংরক্ষণ হচ্ছে…') : saved ? t('Saved in Activity','কার্যক্রমে সংরক্ষিত') : t('Save this organization','প্রতিষ্ঠান সংরক্ষণ করুন')}</span>
      </button>
      {message && <p className="save-status-toast" role="status">{message}</p>}
    </div>
  );
}
