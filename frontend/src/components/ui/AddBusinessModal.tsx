"use client";
import React, { useEffect, useRef, useState } from "react";
import { Building2, ImagePlus, Plus, X } from "lucide-react";
import { CATEGORIES_LIST } from "./CategoryDropdown";
import { BusinessSubmissionError, businessService } from "../../services/businessService";
import type { Business } from "../../types";
import { MapLocationPicker, type ResolvedCoordinates } from './MapLocationPicker';
import {formatLocation,normalizeLocationSelection} from '../../data/bd-locations';
import {useI18n} from '../../i18n/LanguageContext';
import {translateCategory,localizedError} from '../../i18n/dictionary';
import './add-organization.css';

interface AddBusinessModalProps {
  open: boolean;
  onClose: () => void;
  onBusinessAdded: (newBusiness: Business) => void;
}

/**
 * Business User Entity Creation Modal Component
 * Allows business owners/users to add a new business listing to the database via POST /api/businesses.
 */
export function AddBusinessModal({
  open,
  onClose,
  onBusinessAdded,
}: AddBusinessModalProps) {
  const {lang,t}=useI18n();
  const [name, setName] = useState("");
  const [bengaliName, setBengaliName] = useState("");
  const [category, setCategory] = useState(CATEGORIES_LIST[0].name);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [area,setArea]=useState<{divisionId?:string;districtId?:string;upazilaId?:string}>({});
  const [presence,setPresence]=useState<'physical'|'online'|'both'>('physical');
  const [placeId,setPlaceId]=useState('');
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageConsent, setImageConsent] = useState(false);
  const [imageError, setImageError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});
  
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<ResolvedCoordinates | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [matches, setMatches] = useState<Business[]>([]);
  const dialog=useRef<HTMLDivElement>(null);
  const successTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const submitting=useRef(false);
  const imageInput=useRef<HTMLInputElement>(null);
  const errorSummary=useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!profileImage) {setImagePreview('');return;}
    const url=URL.createObjectURL(profileImage);setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profileImage]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => { if (open && name.trim().length > 2) businessService.search(name.trim()).then(items => { if(active) setMatches(items.slice(0, 5)); }).catch(()=>{if(active)setMatches([]);}); else setMatches([]); }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [name, open]);

  useEffect(() => {
    if (!open) return;
    setSuccessMsg(null);
    setErrorMsg(null);
    setFieldErrors({});
    const previous=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    dialog.current?.querySelector<HTMLElement>('button')?.focus();
    const listener = (e: KeyboardEvent) => {
      if(e.key==='Escape'&&!submitting.current)onClose();
      if(e.key==='Tab'){
        const nodes=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])')||[]).filter(node=>node.getClientRects().length);
        const first=nodes[0],last=nodes[nodes.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    document.addEventListener("keydown", listener);
    return () => {document.removeEventListener("keydown", listener);document.body.style.overflow=overflow;previous?.focus();if(successTimer.current)clearTimeout(successTimer.current);};
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(submitting.current)return;
    setErrorMsg(null);
    setFieldErrors({});
    setSuccessMsg(null);

    const validArea=normalizeLocationSelection(area);
    const invalid:Record<string,string>={};
    if(presence!=='online' && (!validArea.divisionId || !validArea.districtId || !validArea.upazilaId)) invalid.location=t('Select the division, district and local area.','বিভাগ, জেলা ও স্থানীয় এলাকা বাছুন।');
    if(imageError) invalid.profile_image=imageError;
    if(Object.keys(invalid).length){setFieldErrors(invalid);setErrorMsg(t('Please check the highlighted fields.','চিহ্নিত তথ্যগুলো ঠিক করুন।'));requestAnimationFrame(()=>errorSummary.current?.focus());return;}

    try {
      submitting.current=true;
      setLoading(true);
      const created = await businessService.createBusiness({
        name: name.trim(),
        bengali_name: bengaliName.trim() || undefined,
        category,
        presence,
        google_place_id: presence==='online'?undefined:placeId||undefined,
        description: description.trim() || undefined,
        location: (presence==='online'?location.trim():[location.trim(),formatLocation(validArea.divisionId,validArea.districtId,validArea.upazilaId)].filter(Boolean).join(', ')) || undefined,
        division_id: presence==='online'?undefined:validArea.divisionId,
        district_id: presence==='online'?undefined:validArea.districtId,
        upazila_id: presence==='online'?undefined:validArea.upazilaId,
        latitude: coords?.lat,
        longitude: coords?.lng,
        road: coords?.road,
        area: coords?.area,
        postcode: coords?.postcode,
        detected_address: coords?.detected_address,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        facebook_url: facebookUrl.trim() || undefined,
        profile_image: profileImage || undefined,
        profile_image_consent: true,
      });

      setLoading(false);
      setSuccessMsg(profileImage?t('Listing created. Your image stays private until an admin approves it for public display.','প্রতিষ্ঠানটি যোগ হয়েছে। অ্যাডমিন প্রকাশের অনুমোদন না দেওয়া পর্যন্ত ছবিটি ব্যক্তিগত থাকবে।'):t("Directory listing created. You can review it while moderators check the details.","ডিরেক্টরিতে প্রতিষ্ঠানটি যোগ হয়েছে। মডারেটররা তথ্য যাচাই করার সময় আপনি রিভিউ দিতে পারেন।"));
      
      successTimer.current=setTimeout(() => {
        onBusinessAdded(created);
        onClose();
        setName("");
        setBengaliName("");
        setDescription("");
        setLocation("");
        setArea({});
        setPlaceId('');
        setPhone("");
        setWebsite("");
        setFacebookUrl("");
        setProfileImage(null);setImageConsent(false);setImageError('');
        setSuccessMsg(null);
      }, 2500);
    } catch (err: unknown) {
      setLoading(false);
      setErrorMsg(localizedError(err instanceof Error?err.message:undefined,lang));
      if(err instanceof BusinessSubmissionError)setFieldErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([key,messages])=>[key,messages[0]])));
      requestAnimationFrame(()=>errorSummary.current?.focus());
    } finally {submitting.current=false;}
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}
      style={{ overflowY: "auto", padding: "20px 16px" }}
    >
      <div
        ref={dialog}
        className="review-modal-box add-organization-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-business-title"
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          disabled={loading}
          aria-label={t("Close modal","বন্ধ করুন")}
        >
          <X size={18} />
        </button>

        <div className="review-modal-header">
          <h2 id="add-business-title" className="review-modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Building2 size={22} color="#0f766e" /> {t("Add a missing organization","নতুন প্রতিষ্ঠান যোগ করুন")}
          </h2>
          <p className="review-modal-subtitle">
            {t("Add an organization, shop, hospital, school or service to the directory. Adding a listing does not claim its ownership.","ডিরেক্টরিতে প্রতিষ্ঠান, দোকান, হাসপাতাল, স্কুল বা সেবা যোগ করুন। তালিকা যোগ করলে এর মালিকানা পাওয়া যায় না।")}
          </p>
        </div>

        {successMsg && (
          <div role="status" style={{ backgroundColor: "#ecfdf5", color: "#065f46", padding: "14px", borderRadius: "8px", fontSize: "0.88rem", marginBottom: "16px", fontWeight: 600 }}>
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div ref={errorSummary} tabIndex={-1} role="alert" className="add-organization-errors">
            {errorMsg}
            {Object.keys(fieldErrors).length>0&&<ul>{Object.entries(fieldErrors).map(([field,message])=><li key={field}><a href={field==='name'?'#biz-name':field==='profile_image_consent'?'#biz-image-consent':field==='profile_image'||field==='file'?'#biz-profile-image':'#biz-location'}>{message}</a></li>)}</ul>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="review-form-content">
          {/* Business Name */}
          <div className="review-form-group">
            <label htmlFor="biz-name" className="review-label">
              {t("Organization name *","প্রতিষ্ঠানের নাম *")}
            </label>
            <input
              id="biz-name"
              type="text"
              className="review-input"
              placeholder={t("e.g. Dhaka Diagnostic Center","যেমন: ঢাকা ডায়াগনস্টিক সেন্টার")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name?'biz-name-error':undefined}
            />
            {fieldErrors.name&&<p id="biz-name-error" className="add-organization-field-error">{fieldErrors.name}</p>}
          </div>

          <div className="organization-image-picker review-form-group">
            <label htmlFor="biz-profile-image" className="review-label"><ImagePlus size={18} aria-hidden="true"/> {t('Organization profile image (optional)','প্রতিষ্ঠানের প্রোফাইল ছবি (ঐচ্ছিক)')}</label>
            <p id="biz-image-help">{t('Choose a logo or storefront photo. Supports JPG, PNG, WebP, GIF, SVG, AVIF, BMP up to 15 MB.','প্রতিষ্ঠানের লোগো বা ছবি বাছুন। JPG, PNG, WebP, GIF, SVG, AVIF, BMP সমর্থিত · সর্বোচ্চ ১৫ এমবি।')}</p>
            <input ref={imageInput} id="biz-profile-image" type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.svg,.avif,.bmp" disabled={loading} aria-describedby={`biz-image-help${imageError||fieldErrors.profile_image||fieldErrors.file?' biz-image-error':''}`} aria-invalid={!!(imageError||fieldErrors.profile_image||fieldErrors.file)} onChange={event=>{
              const file=event.target.files?.[0];setProfileImage(null);setImageError('');setFieldErrors(current=>{const next={...current};delete next.profile_image;delete next.file;delete next.profile_image_consent;return next;});
              if(!file)return;
              if(!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|svg|avif|bmp)$/i.test(file.name)){setImageError(t('Choose a valid image file (JPG, PNG, WebP, GIF, SVG, etc.).','সঠিক ছবির ফাইল বাছুন (JPG, PNG, WebP, GIF, SVG ইত্যাদি)।'));event.target.value='';return;}
              if(file.size>15*1024*1024){setImageError(t('Image size must be up to 15 MB.','ছবির আকার সর্বোচ্চ ১৫ এমবি হতে পারবে।'));event.target.value='';return;}
              setProfileImage(file);
            }}/>
            {(imageError||fieldErrors.profile_image||fieldErrors.file)&&<p id="biz-image-error" role="alert" className="add-organization-field-error">{imageError||fieldErrors.profile_image||fieldErrors.file}</p>}
            {profileImage&&<>
              <div className="organization-image-selected">
                {imagePreview&&<img src={imagePreview} alt={t('Preview of the selected organization image','নির্বাচিত প্রতিষ্ঠানের ছবির প্রিভিউ')} onError={()=>setImageError(t('This image could not be read. Choose another image.','ছবিটি পড়া যাচ্ছে না। অন্য ছবি বাছুন।'))}/>}<div><p>{profileImage.name}</p><small>{t('Selected, ready to submit','নির্বাচিত, জমা দেওয়ার জন্য প্রস্তুত')}</small><button type="button" className="btn-pill-light" disabled={loading} onClick={()=>{setProfileImage(null);setImageError('');if(imageInput.current)imageInput.current.value='';setFieldErrors(current=>{const next={...current};delete next.profile_image;delete next.file;delete next.profile_image_consent;return next;});}}>{t('Remove image','ছবি সরান')}</button></div>
              </div>
            </>}
          </div>

          {matches.length > 0 && <section className="workspace-notice"><strong>{t("Could it be one of these?","এগুলোর মধ্যে আপনার প্রতিষ্ঠানটি আছে?")}</strong><p>{t("Use an existing profile to keep reviews together.","সব রিভিউ একসঙ্গে রাখতে বিদ্যমান প্রোফাইল ব্যবহার করুন।")}</p>{matches.map(b => <button type="button" className="btn-pill-light" key={b.id} onClick={() => { onBusinessAdded(b); onClose(); }}>{lang==='bn'&&b.bengaliName?b.bengaliName:b.name} · {b.location}</button>)}</section>}
          {/* Bengali Name */}
          <div className="review-form-group">
            <label htmlFor="biz-bengali" className="review-label">
              {t("Bengali Name (Optional)","বাংলা নাম (ঐচ্ছিক)")}
            </label>
            <input
              id="biz-bengali"
              type="text"
              className="review-input"
              placeholder={t("e.g. ঢাকা ডায়াগনস্টিক সেন্টার","যেমন: ঢাকা ডায়াগনস্টিক সেন্টার")}
              value={bengaliName}
              onChange={(e) => setBengaliName(e.target.value)}
            />
          </div>

          {/* Category Select */}
          <div className="review-form-group">
            <label htmlFor="biz-category" className="review-label">
              {t("Category *","বিভাগ *")}
            </label>
            <select
              id="biz-category"
              className="review-input-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES_LIST.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {translateCategory(cat.name,lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="review-form-group">
            <label htmlFor="biz-desc" className="review-label">
              {t("Description (Optional)","বিবরণ (ঐচ্ছিক)")}
            </label>
            <textarea
              id="biz-desc"
              className="review-textarea"
              rows={3}
              placeholder={t("Brief description of products, services, or medical facilities...","পণ্য, সেবা বা চিকিৎসা সুবিধার সংক্ষিপ্ত বিবরণ লিখুন…")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 2 Grid: Location & Phone */}
          <label className="review-label">{t("Organization presence","প্রতিষ্ঠানের কার্যক্রম")}<select className="review-input" value={presence} onChange={e=>{setPresence(e.target.value as typeof presence);setPlaceId('');setArea({});setCoords(null);}}><option value="physical">{t("Physical location","সরাসরি ঠিকানায়")}</option><option value="online">{t("Online only","শুধু অনলাইনে")}</option><option value="both">{t("Physical and online","সরাসরি ও অনলাইনে")}</option></select></label>
          {presence!=='online' ? (
            <MapLocationPicker
              value={area}
              onChange={(value) => { setArea(value); setPlaceId(''); }}
              coordinates={coords}
              onAddressSelect={(addr) => {
                if (addr) setLocation(addr);
              }}
              onCoordinatesChange={(c) => {
                setCoords(c);
                const street = [c.road, c.area].filter(Boolean).join(', ') || c.detected_address;
                if (street) {
                  setLocation(street);
                }
              }}
              required
              label={t('Organization location & interactive map *', 'প্রতিষ্ঠানের এলাকা ও মানচিত্র *')}
            />
          ) : (
            <p className="workspace-notice">{t("Online businesses do not need a physical Maps address. Add a website or Facebook page below to help customers identify the right business.","অনলাইন প্রতিষ্ঠানের সরাসরি ম্যাপের ঠিকানা প্রয়োজন নেই। সঠিক প্রতিষ্ঠান চেনার জন্য নিচে ওয়েবসাইট বা ফেসবুক পেজের লিংক দিন।")}</p>
          )}
          <div className="review-grid-2">
            <div className="review-form-group">
              <label htmlFor="biz-location" className="review-label">
                {presence==='online'?t("Service area (optional)","সেবা দেওয়ার এলাকা (ঐচ্ছিক)"):t("Street / building details (optional)","রাস্তা / ভবন / বিস্তারিত ঠিকানা (ঐচ্ছিক)")}
              </label>
              <input
                id="biz-location"
                type="text"
                className="review-input"
                placeholder={t("e.g. House 12, Road 4 / Sector 3","যেমন: বাড়ি ১২, রোড ৪ / সেক্টর ৩")}
                value={location}
                onChange={(e) => {setLocation(e.target.value);setPlaceId('');}}
                aria-invalid={!!fieldErrors.location}
                aria-describedby={fieldErrors.location?'biz-location-error':undefined}
              />
              {fieldErrors.location&&<p id="biz-location-error" className="add-organization-field-error">{fieldErrors.location}</p>}
            </div>

            <div className="review-form-group">
              <label htmlFor="biz-phone" className="review-label">
                {t("Phone Number (Optional)","ফোন নম্বর (ঐচ্ছিক)")}
              </label>
              <input
                id="biz-phone"
                type="text"
                className="review-input"
                placeholder={t("e.g. 01700-000000","যেমন: 01700-000000")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div className="review-grid-2">
            <div className="review-form-group">
              <label htmlFor="biz-website" className="review-label">
                {t("Website URL (Optional)","ওয়েবসাইটের লিংক (ঐচ্ছিক)")}
              </label>
              <input
                id="biz-website"
                type="url"
                className="review-input"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="review-form-group">
              <label htmlFor="biz-facebook" className="review-label">
                {t("Facebook Page URL (Optional)","ফেসবুক পেজের লিংক (ঐচ্ছিক)")}
              </label>
              <input
                id="biz-facebook"
                type="url"
                className="review-input"
                placeholder="https://facebook.com/page"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit-review"
            disabled={loading||!!successMsg}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            {loading ? (
              <span>{t("Saving to database...","সংরক্ষণ করা হচ্ছে…")}</span>
            ) : (
              <>
                <Plus size={16} /> {t("Add organization","প্রতিষ্ঠান যোগ করুন")}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
