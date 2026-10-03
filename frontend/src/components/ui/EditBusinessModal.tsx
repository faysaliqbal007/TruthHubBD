"use client";
import React, { useEffect, useRef, useState } from "react";
import { Building2, Save, X } from "lucide-react";
import { CATEGORIES_LIST } from "./CategoryDropdown";
import { businessService } from "../../services/businessService";
import type { Business } from "../../types";
import {GoogleMap} from '../GoogleMap';
import {useI18n} from '../../i18n/LanguageContext';
import {translateCategory,localizedError} from '../../i18n/dictionary';
import './add-organization.css';

interface EditBusinessModalProps {
  open: boolean;
  business: Business;
  onClose: () => void;
  onUpdated: (updatedBusiness: Business) => void;
}

/**
 * Business Owner Profile Edit Modal Component
 * Enables the creator/owner of a business to update facts, profile picture, and details.
 */
export function EditBusinessModal({
  open,
  business,
  onClose,
  onUpdated,
}: EditBusinessModalProps) {
  const {lang,t}=useI18n();
  const [name, setName] = useState(business.name || "");
  const [bengaliName, setBengaliName] = useState(business.bengaliName || "");
  const [category, setCategory] = useState(business.category || CATEGORIES_LIST[0].name);
  const [description, setDescription] = useState(business.description || "");
  const [location, setLocation] = useState(business.location || "");
  const [phone, setPhone] = useState(business.phone || "");
  const [website, setWebsite] = useState(business.website || "");
  const [facebookUrl, setFacebookUrl] = useState(business.facebookUrl || "");
  const [file, setFile] = useState<File | null>(null);
  const [imageConsent,setImageConsent]=useState(false);
  const [imagePreview,setImagePreview]=useState('');
  const imageInput=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(!file){setImagePreview('');return;}const url=URL.createObjectURL(file);setImagePreview(url);return()=>URL.revokeObjectURL(url);},[file]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(business.name || "");
    setBengaliName(business.bengaliName || "");
    setCategory(business.category || CATEGORIES_LIST[0].name);
    setDescription(business.description || "");
    setLocation(business.location || "");
    setPhone(business.phone || "");
    setWebsite(business.website || "");
    setFacebookUrl(business.facebookUrl || "");
    setFile(null);
    setImageConsent(false);

    const listener = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [open, business, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg(t("Please enter the organization name.","প্রতিষ্ঠানের নাম লিখুন।"));
      return;
    }

    try {
      setLoading(true);
      const updated = await businessService.updateBusiness(business.id, {
        name: name.trim(),
        bengaliName: bengaliName.trim() || undefined,
        bengali_name: bengaliName.trim() || undefined,
        category,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        facebookUrl: facebookUrl.trim() || undefined,
        facebook_url: facebookUrl.trim() || undefined,
        file: file || undefined,
        profile_image_consent: true,
      });

      setLoading(false);
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message ? localizedError(err.message,lang) : t("Failed to update the organization profile. Please try again.","প্রতিষ্ঠানের প্রোফাইল বদলানো যায়নি। আবার চেষ্টা করুন।"));
    }
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{ overflowY: "auto", padding: "20px 16px" }}
    >
      <div
        className="review-modal-box add-organization-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-business-title"
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label={t("Close modal","বন্ধ করুন")}
        >
          <X size={18} />
        </button>

        <div className="review-modal-header">
          <h2 id="edit-business-title" className="review-modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Building2 size={22} color="#0f766e" /> {t("Edit Organization Profile","প্রতিষ্ঠানের প্রোফাইল সম্পাদনা করুন")}
          </h2>
          <p className="review-modal-subtitle">
            {t("Update your organization’s details, category, contact information, and profile image.","প্রতিষ্ঠানের তথ্য, ছবি, বিভাগ ও যোগাযোগের বিবরণ বদলান।")}
          </p>
        </div>

        {errorMsg && (
          <div role="alert" style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px" }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="review-form-content">
          {/* Profile Picture / Logo File Upload */}
            <div className="review-form-group organization-image-picker">
              <label htmlFor="edit-biz-image" className="review-label">
                {t("Profile Photo / Logo Image (Optional)","প্রোফাইলের ছবি / লোগো (ঐচ্ছিক)")}
              </label>
              <input
                id="edit-biz-image"
                ref={imageInput}
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.svg,.avif,.bmp"
                disabled={loading}
                aria-describedby="edit-biz-image-help"
                className="review-input"
                onChange={(e) => {
                  const next=e.target.files?.[0];
                  setFile(null);
                  setErrorMsg(null);
                  if(!next)return;
                  if(!next.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|svg|avif|bmp)$/i.test(next.name)){
                    e.target.value='';
                    setErrorMsg(t('Choose a valid image file (JPG, PNG, WebP, GIF, SVG, etc.).','সঠিক ছবির ফাইল বাছুন (JPG, PNG, WebP, GIF, SVG ইত্যাদি)।'));
                    return;
                  }
                  if(next.size > 15*1024*1024){
                    e.target.value='';
                    setErrorMsg(t('Image size must be up to 15 MB.','ছবির আকার সর্বোচ্চ ১৫ এমবি হতে পারবে।'));
                    return;
                  }
                  setFile(next);
                  setImageConsent(true);
                }}
              />
              <p id="edit-biz-image-help">{t('Choose a logo or storefront photo. Supports JPG, PNG, WebP, GIF, SVG, AVIF, BMP up to 15 MB.','প্রতিষ্ঠানের লোগো বা ছবি বাছুন। JPG, PNG, WebP, GIF, SVG, AVIF, BMP সমর্থিত · সর্বোচ্চ ১৫ এমবি।')}</p>
              {file&&<><div className="organization-image-selected">{imagePreview&&<img src={imagePreview} alt={t('Preview of your selected profile image','নির্বাচিত প্রোফাইল ছবির প্রিভিউ')}/>}<div><p>{file.name}</p><button type="button" className="btn-pill-light" disabled={loading} onClick={()=>{setFile(null);setImageConsent(false);if(imageInput.current)imageInput.current.value='';}}>{t('Remove image','ছবি সরান')}</button></div></div></>}
            </div>

          {/* Business Name */}
          <div className="review-form-group">
            <label htmlFor="edit-biz-name" className="review-label">
              {t("Organization Name *","প্রতিষ্ঠানের নাম *")}
            </label>
            <input
              id="edit-biz-name"
              type="text"
              className="review-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Bengali Name */}
          <div className="review-form-group">
            <label htmlFor="edit-biz-bengali" className="review-label">
              {t("Bengali Name (Optional)","বাংলা নাম (ঐচ্ছিক)")}
            </label>
            <input
              id="edit-biz-bengali"
              type="text"
              className="review-input"
              value={bengaliName}
              onChange={(e) => setBengaliName(e.target.value)}
            />
          </div>

          {/* Category Select */}
          <div className="review-form-group">
            <label htmlFor="edit-biz-category" className="review-label">
              {t("Category *","বিভাগ *")}
            </label>
            <select
              id="edit-biz-category"
              className="review-input-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES_LIST.map((cat) => (
                <option key={translateCategory(cat.name,lang)} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="review-form-group">
            <label htmlFor="edit-biz-desc" className="review-label">
              {t("Description (Optional)","বিবরণ (ঐচ্ছিক)")}
            </label>
            <textarea
              id="edit-biz-desc"
              className="review-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 2 Grid: Location & Phone */}
          <div className="review-grid-2">
            <div className="review-form-group">
              <label htmlFor="edit-biz-location" className="review-label">
                {t("Location (Optional)","ঠিকানা (ঐচ্ছিক)")}
              </label>
              <input
                id="edit-biz-location"
                type="text"
                className="review-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="review-form-group">
              <label htmlFor="edit-biz-phone" className="review-label">
                {t("Phone Number (Optional)","ফোন নম্বর (ঐচ্ছিক)")}
              </label>
              <input
                id="edit-biz-phone"
                type="text"
                className="review-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <GoogleMap name={name} location={location} placeId={location===business.location?business.googlePlaceId:undefined} lang={lang}/>

          {/* 2 Grid: Website & Facebook URL */}
          <div className="review-grid-2">
            <div className="review-form-group">
              <label htmlFor="edit-biz-website" className="review-label">
                {t("Website URL (Optional)","ওয়েবসাইটের লিংক (ঐচ্ছিক)")}
              </label>
              <input
                id="edit-biz-website"
                type="url"
                className="review-input"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="review-form-group">
              <label htmlFor="edit-biz-facebook" className="review-label">
                {t("Facebook Page URL (Optional)","ফেসবুক পেজের লিংক (ঐচ্ছিক)")}
              </label>
              <input
                id="edit-biz-facebook"
                type="url"
                className="review-input"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit-review"
            disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            {loading ? (
              <span>{t("Saving changes…","পরিবর্তন সংরক্ষণ হচ্ছে…")}</span>
            ) : (
              <>
                <Save size={16} /> {t("Save Changes","পরিবর্তন সংরক্ষণ করুন")}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

