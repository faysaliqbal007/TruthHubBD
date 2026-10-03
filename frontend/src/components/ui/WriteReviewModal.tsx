"use client";
import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, Building2, Camera, Facebook, PlusCircle, Radio, Search, Star, X } from "lucide-react";
import { businessService } from "../../services/businessService";
import type { Business } from "../../types";

import {MultiFilePicker} from '../MultiFilePicker';
import {PublicVideoField} from '../PublicVideoLinks';
import {parsePublicVideoUrls} from '../../lib/publicVideoUrls';
import {useI18n} from '../../i18n/LanguageContext';
import {useAuth} from '../../features/auth/AuthContext';
import {formatNumber,translateCategory,localizedError} from '../../i18n/dictionary';


export function WriteReviewModal({
  open,
  onClose,
  initialBusiness,
  onShowSoon,
  onOpenAddBusiness,
  onReviewSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  initialBusiness?: Business | null;
  onShowSoon: (feature: string) => void;
  onOpenAddBusiness?: () => void;
  onReviewSubmitted?: (review: any, businessId: number) => void;
}) {
  const {lang,t}=useI18n();
  const {user}=useAuth();
  const [availableBusinesses, setAvailableBusinesses] = useState<Business[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<number>(0);
  const [entityQuery,setEntityQuery]=useState('');
  const [entityLoading,setEntityLoading]=useState(false);
  const [entityError,setEntityError]=useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
    const [serviceRating, setServiceRating] = useState(0);
    const [valueRating, setValueRating] = useState(0);
    const [commRating, setCommRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  

  
  // Issue #4: Facebook Page URL field state (Optional)
  const [facebookUrl, setFacebookUrl] = useState("");
  
  const [date, setDate] = useState('');
  const [disclosure, setDisclosure] = useState('none');
  const [broadcastRequested, setBroadcastRequested] = useState(false);
  const [videoUrls,setVideoUrls]=useState('');
  const [videoConsent,setVideoConsent]=useState(false);
  const [caseReference,setCaseReference]=useState('');
  
  // Issue #5: File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const dialog=useRef<HTMLDivElement>(null);
  const submission=useRef(false);

  const selectedBusiness = availableBusinesses.find((b) => b.id === selectedEntityId) || (initialBusiness?.id === selectedEntityId ? initialBusiness : null);

  useEffect(()=>{if(open){setSelectedEntityId(initialBusiness?.id||0);setEntityQuery(initialBusiness?.name||'');setRating(0);setServiceRating(0);setValueRating(0);setCommRating(0);setTitle('');setBody('');setSelectedFiles([]);setDate('');setFacebookUrl('');setBroadcastRequested(false);setVideoUrls('');setVideoConsent(false);setCaseReference('');setDisclosure('none');setFileError(null);setSubmitSuccessMsg(null);}},[open,initialBusiness]);
  // Search the full directory, not just its first page. Never silently select a business.
  useEffect(() => {
    if(!open)return;
    let active=true;
    async function loadBusinesses() {
      setEntityLoading(true);setEntityError('');
      try {
        const list = await businessService.search(entityQuery);
        if(active)setAvailableBusinesses(initialBusiness&&!list.some(b=>b.id===initialBusiness.id)?[initialBusiness,...list]:list);
      } catch (e) {
        if(active){setEntityError(t("Could not load organizations. Change the search to try again.","প্রতিষ্ঠানের তালিকা আসেনি। আবার খুঁজে চেষ্টা করুন।"));setAvailableBusinesses([]);}
      } finally {if(active)setEntityLoading(false);}
    }
    const timer=setTimeout(loadBusinesses,250);
    return()=>{active=false;clearTimeout(timer);};
  }, [open, initialBusiness,entityQuery]);


  useEffect(() => {
    if (!open) return;
    const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    dialog.current?.querySelector<HTMLElement>('button')?.focus();
    const listener = (e: KeyboardEvent) => {
      if(e.key==='Escape'){e.preventDefault();if(!submission.current)onClose();}
      if(e.key==='Tab'){const nodes=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])')||[]).filter(n=>n.getClientRects().length);const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
    };
    document.addEventListener("keydown", listener);
    return () => {document.removeEventListener("keydown", listener);document.body.style.overflow=overflow;previous?.focus();};
  }, [open, onClose]);

  if (!open) return null;


  /**
   * Issue #3, #4, #5: Form submission handler
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(submission.current||submitSuccessMsg)return;
    setFileError(null);
    setSubmitSuccessMsg(null);
    if(!selectedEntityId||entityLoading){setFileError(t("Search for and select the correct organization first.","আগে খুঁজে সঠিক প্রতিষ্ঠান নির্বাচন করুন।"));return;}
    if(!rating){setFileError(t("Select a rating that reflects your experience.","আপনার অভিজ্ঞতার সঙ্গে মিল রেখে একটি রেটিং দিন।"));return;}
    if(!title.trim()||!body.trim()){setFileError(t("Enter a title and description, not just spaces.","শিরোনাম ও অভিজ্ঞতার বিবরণ লিখুন; শুধু ফাঁকা জায়গা নয়।"));return;}
    const videos=parsePublicVideoUrls(videoUrls);
    if(videos.error || (videos.urls.length && !videoConsent)){setFileError(t('Add up to 3 supported HTTPS video links and confirm permission to share.','সর্বোচ্চ ৩টি সমর্থিত HTTPS ভিডিও লিংক দিন এবং শেয়ারের অনুমতি নিশ্চিত করুন।'));return;}

    // Issue #4: Optional Facebook URL validation
    if (facebookUrl.trim()) {
      const urlPattern = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+$/i;
      if (!urlPattern.test(facebookUrl.trim())) {
        setFileError(t("Please enter a valid Facebook URL (e.g. https://facebook.com/yourpage)","সঠিক ফেসবুক পেজের লিংক দিন (যেমন https://facebook.com/yourpage)।"));
        return;
      }
    }

    try {
      submission.current=true;
      setIsSubmitting(true);

      // Create FormData to support Issue #5 File Upload & Issue #3/#4 optional fields
      const formData = new FormData();
      formData.append("rating", rating.toString());
        if (serviceRating > 0) formData.append("service_rating", serviceRating.toString());
        if (valueRating > 0) formData.append("value_rating", valueRating.toString());
        if (commRating > 0) formData.append("comm_rating", commRating.toString());
      formData.append("title", title.trim());
      formData.append("body", body.trim());
      if (date) formData.append('experience_date', date);
      formData.append('relationship_disclosure', disclosure);
      formData.append('broadcast_requested', broadcastRequested ? '1' : '0');
      videos.urls.forEach(url=>formData.append('public_video_urls[]',url));
      formData.append('public_video_consent',videoConsent?'1':'0');
      


      
      // Issue #4: Facebook Page is optional - send if user filled it
      if (facebookUrl.trim()) {
        formData.append("facebook_url", facebookUrl.trim());
      }
      
      // Issue #5: Attach file if uploaded
      selectedFiles.forEach(file=>formData.append('evidence[]',file));

      if (!user) {
        setIsSubmitting(false);
        setFileError(t("You must be signed in to submit a review.", "রিভিউ জমা দিতে অনুগ্রহ করে প্রথমে সাইন ইন করুন।"));
        return;
      }

      const result = await businessService.submitReview(selectedEntityId, formData);
      setCaseReference(result.linked_case?.case_code || '');
      setSelectedFiles([]);
      setIsSubmitting(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('truthhub:review_created', {
            detail: { businessId: selectedEntityId, review: result }
          })
        );
      }
      onReviewSubmitted?.(result, selectedEntityId);

      setSubmitSuccessMsg(broadcastRequested ? t("Your review has been submitted and community broadcast request sent to moderators!","আপনার রিভিউ জমা হয়েছে এবং মডারেটরদের কাছে ব্রডকাস্টের অনুরোধ পাঠানো হয়েছে!") : t("Your review has been submitted successfully!","আপনার রিভিউ জমা হয়েছে।"));
      
    } catch (err: any) {
      setIsSubmitting(false);
      setFileError(localizedError(err.message,lang));
    } finally {
      submission.current=false;
    }
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && !submission.current && onClose()}
      style={{ overflowY: "auto", padding: "20px 16px" }}
    >
      <div
        className="review-modal-box"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="write-review-title"
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label={t("Close modal","বন্ধ করুন")}
        >
          <X size={18} />
        </button>

        <div className="review-modal-header">
          <h2 id="write-review-title" className="review-modal-title">
            {t("Write a Review","রিভিউ লিখুন")}
          </h2>
          <p className="review-modal-subtitle">
            {t("Share your experience and help others make a confident choice.","আপনার অভিজ্ঞতা জানান, যাতে অন্যরা তথ্য জেনে সিদ্ধান্ত নিতে পারেন।")}
          </p>
        </div>

        {!user && !submitSuccessMsg && (
          <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fed7aa', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9a3412', fontSize: '13px', fontWeight: 600 }}>
              <AlertCircle size={16} />
              <span>{t("You must be signed in to submit a review.", "রিভিউ জমা দিতে অনুগ্রহ করে প্রথমে সাইন ইন করুন।")}</span>
            </div>
            <a
              href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/')}`}
              className="btn-teal-pill"
              style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none', borderRadius: '999px', whiteSpace: 'nowrap' }}
            >
              {t("Sign in", "সাইন ইন")} →
            </a>
          </div>
        )}

        {submitSuccessMsg && (
          <div style={{ backgroundColor: "#f0fdf4", color: "#15803d", padding: "12px", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 600, marginBottom: "16px" }}>
            ✓ {submitSuccessMsg}{caseReference&&<p>{t('Case reference:','কেস রেফারেন্স:')} <strong>{caseReference}</strong> · <a href="/activity">{t('Track my submission','আমার রিপোর্টের অগ্রগতি')}</a></p>}
          </div>
        )}

        {fileError && (
          <div role="alert" style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={16} />
            <span>{fileError}</span>
          </div>
        )}

        {submitSuccessMsg ? (
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            {selectedBusiness?.slug ? (
              <a
                href={`/business/${selectedBusiness.slug}`}
                className="civic-primary"
                style={{ textDecoration: 'none', textAlign: 'center', padding: '10px 18px', display: 'inline-block' }}
                onClick={onClose}
              >
                {t("View Organization & Reviews", "প্রতিষ্ঠান ও রিভিউ দেখুন")} →
              </a>
            ) : null}
            <button className="btn-pill-light" onClick={onClose} type="button" style={{ padding: '10px 18px' }}>
              {t("Done", "সম্পন্ন")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="review-form-content">
          {/* 1. Select Entity */}
          <div className="entity-select-field">
            <div className="entity-select-top">
              <label htmlFor="review-entity-search" className="review-label">
                {t("1. Which organization are you reviewing? *","১. কোন প্রতিষ্ঠানের রিভিউ লিখছেন? *")}
              </label>
              <button
                type="button"
                className="btn-missing-entity"
                onClick={() => {
                  onClose();
                  if (onOpenAddBusiness) {
                    onOpenAddBusiness();
                  } else {
                    onShowSoon("Add Missing Canonical Entity");
                  }
                }}
              >
                <PlusCircle size={14} /> {t("Organization missing? Add it","প্রতিষ্ঠান নেই? যোগ করুন")}
              </button>
            </div>
            {selectedEntityId && selectedBusiness ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f0fdfa', border: '1.5px solid #99f6e4', borderRadius: '10px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 40, height: 40, minWidth: 40, borderRadius: 8, overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedBusiness.image ? (
                      <img
                        src={selectedBusiness.image.startsWith('/') || selectedBusiness.image.startsWith('http') ? selectedBusiness.image : '/' + selectedBusiness.image}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <Building2 size={20} color="#0f766e" />
                    )}
                  </div>
                  <div>
                    <strong style={{ fontSize: '14.5px', color: '#0f172a', display: 'block' }}>{lang==='bn'&&selectedBusiness.bengaliName?selectedBusiness.bengaliName:selectedBusiness.name}</strong>
                    <small style={{ fontSize: '12.5px', color: '#64748b' }}>{translateCategory(selectedBusiness.category,lang)} {selectedBusiness.location ? `• ${selectedBusiness.location}` : ''}</small>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedEntityId(0); setEntityQuery(''); }}
                  className="btn-paper-outline"
                  style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {t("Change","বদলান")}
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
                  <input
                    id="review-entity-search"
                    className="review-input"
                    type="search"
                    maxLength={255}
                    style={{ paddingLeft: '36px' }}
                    value={entityQuery}
                    placeholder={t("Type organization, doctor, university or shop name...","প্রতিষ্ঠান, চিকিৎসক, বিশ্ববিদ্যালয় বা দোকানের নাম লিখুন…")}
                    onChange={(e) => {
                      setEntityQuery(e.target.value);
                      setSelectedEntityId(0);
                    }}
                    autoComplete="off"
                  />
                </div>

                {entityLoading && <p role="status" style={{ fontSize: '12.5px', color: 'var(--mut)', margin: '6px 0 0' }}>{t("Searching…","খোঁজা হচ্ছে…")}</p>}
                {entityError && <p role="alert" style={{ fontSize: '12.5px', color: '#b91c1c', margin: '6px 0 0' }}>{entityError}</p>}

                {/* Dropdown search results */}
                {!entityLoading && entityQuery.trim() && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#ffffff',
                      border: '1.5px solid #18243e',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      zIndex: 40,
                      maxHeight: '220px',
                      overflowY: 'auto',
                      marginTop: '4px',
                    }}
                  >
                    {availableBusinesses.length > 0 ? (
                      availableBusinesses.map((b) => (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => {
                            setSelectedEntityId(b.id);
                            setEntityQuery(b.name);
                          }}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width:'100%',textAlign:'left',background:'#fff',border:0,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, minWidth: 34, borderRadius: 6, overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {b.image ? (
                                <img
                                  src={b.image.startsWith('/') || b.image.startsWith('http') ? b.image : '/' + b.image}
                                  alt=""
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                />
                              ) : (
                                <Building2 size={18} color="#0f766e" />
                              )}
                            </div>
                            <div>
                              <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>{b.name}</strong>
                              <small style={{ fontSize: '12px', color: '#64748b' }}>
                                {translateCategory(b.category,lang)} {b.location ? `• ${b.location}` : ''}
                              </small>
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', color: '#0f766e', fontWeight: 600 }}>{t("Select →","নির্বাচন করুন →")}</span>
                        </button>
                      ))
                    ) : (
                      <div style={{ padding: '14px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                        {t("No matches for","কোনো প্রতিষ্ঠান পাওয়া যায়নি:")} &ldquo;{entityQuery}&rdquo;.<br />
                        <button
                          type="button"
                          style={{ border: 0, background: 'none', color: '#0f766e', fontWeight: 700, cursor: 'pointer', marginTop: '6px' }}
                          onClick={() => {
                            onClose();
                            if (onOpenAddBusiness) onOpenAddBusiness();
                            else onShowSoon('Add Missing Canonical Entity');
                          }}
                        >
                          + {t("Add to TruthHubBD:","TruthHubBD-তে যোগ করুন:")} &ldquo;{entityQuery}&rdquo;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Overall Rating */}
          <div className="review-form-group">
            <label className="review-label">{t("Overall Rating *","সামগ্রিক রেটিং *")}</label>
            <div className="rating-interactive-row">
              <div className="stars-cluster">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className="star-btn"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={t(`Rate ${star} stars`,`${formatNumber(star,lang)} তারকা দিন`)}
                    aria-pressed={rating===star}
                  >
                    <Star
                      size={24}
                      className={
                        star <= (hoverRating || rating) ? "star-fill" : "star-empty"
                      }
                    />
                  </button>
                ))}
              </div>
              <span className="rating-text-score">{formatNumber(hoverRating || rating,lang)} / {formatNumber(5,lang)}</span>
            </div>
          </div>

          {/* Review Title */}
          <div className="review-form-group">
            <label htmlFor="review-title" className="review-label">
              {t("Review Title *","রিভিউয়ের শিরোনাম *")}
            </label>
            <input
              id="review-title"
              type="text"
              className="review-input"
              placeholder={t("Summarize your key experience in a clear headline...","একটি স্পষ্ট শিরোনামে অভিজ্ঞতার মূল বিষয় লিখুন…")}
              value={title}
              maxLength={255}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Experience Details */}
          <div className="review-form-group">
            <label htmlFor="review-body" className="review-label">
              {t("Experience Details *","অভিজ্ঞতার বিবরণ *")}
            </label>
            <textarea
              id="review-body"
              className="review-textarea"
              rows={4}
              placeholder={t("Describe what happened clearly and factually...","কী ঘটেছে তা স্পষ্টভাবে তথ্যসহ লিখুন…")}
              value={body}
              maxLength={5000}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>




          {/* Issue #4: Facebook Page URL Field (Optional) */}
          <div className="review-form-group">
            <label htmlFor="review-facebook" className="review-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Facebook size={15} color="#1877f2" /> {t("Organization Facebook page URL (optional)","প্রতিষ্ঠানের ফেসবুক পেজের লিংক (ঐচ্ছিক)")}
            </label>
            <input
              id="review-facebook"
              type="url"
              className="review-input"
              placeholder="https://facebook.com/business-page"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
            />
            </div>

          <MultiFilePicker files={selectedFiles} onChange={setSelectedFiles} maxMB={5} maxFiles={20} disabled={isSubmitting} label={t("Supporting photos & documents (optional)","সহায়ক ছবি ও প্রমাণাদি (ঐচ্ছিক)")}/>
          <PublicVideoField value={videoUrls} onChange={setVideoUrls} consent={videoConsent} onConsent={setVideoConsent} privateIntake={false} disabled={isSubmitting}/>

          {/* Experience Date & Conflict */}
          <div className="review-grid-2">
            <div className="review-form-group">
              <label htmlFor="exp-date" className="review-label">
                {t("Experience Date","অভিজ্ঞতার তারিখ")}
              </label>
              <input
                id="exp-date"
                type="date"
                className="review-input"
                value={date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            
          </div>

          {/* Request Community Broadcast */}
          <div className="scam-alert-checkbox-box" style={{ background: '#f0fdfa', borderColor: '#99f6e4' }}>
            <div className="scam-box-top">
              <div className="scam-box-title" style={{ color: '#0f766e' }}>
                <Radio size={17} color="#0f766e" />
                <span>{t("Request Community Broadcast","কমিউনিটি ব্রডকাস্টের অনুরোধ")}</span>
              </div>
              <input
                type="checkbox"
                checked={broadcastRequested}
                onChange={(e) => setBroadcastRequested(e.target.checked)}
                className="scam-checkbox"
                aria-label={t("Request Community Broadcast","কমিউনিটি ব্রডকাস্টের অনুরোধ")}
              />
            </div>
            <p className="scam-box-note" style={{ color: '#134e4a' }}>
              {t("Ask TruthHubBD admins to verify and broadcast this review to all community members across Bangladesh.","আপনার এই অভিজ্ঞতাটি জনস্বার্থে যাচাইয়ের পর সারা দেশের সকল সদস্যের কাছে ব্রডকাস্ট নোটিফিকেশন পাঠানোর জন্য অ্যাডমিনকে অনুরোধ করুন।")}
            </p>
          </div>

          <label className="review-label" htmlFor="relationship">{t("Relationship disclosure","প্রতিষ্ঠানের সঙ্গে সম্পর্ক")}</label>
          <select id="relationship" className="review-input" value={disclosure} onChange={e => setDisclosure(e.target.value)}>
            <option value="none">{t("Independent customer","স্বাধীন গ্রাহক")}</option><option value="employee">{t("Employee","কর্মী")}</option><option value="competitor">{t("Competitor","প্রতিযোগী")}</option><option value="incentive">{t("Received an incentive","কোনো সুবিধা পেয়েছি")}</option><option value="family">{t("Family relationship","পারিবারিক সম্পর্ক")}</option><option value="other">{t("Other connection","অন্য সম্পর্ক")}</option>
          </select>
          {/* Submit Button */}
          <button type="submit" className="btn-submit-review" disabled={isSubmitting || !user}>
            {isSubmitting ? t("Submitting review…","রিভিউ জমা হচ্ছে…") : !user ? t("Sign in to submit review", "রিভিউ জমা দিতে সাইন ইন করুন") : t("Submit review","রিভিউ জমা দিন")}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}




