"use client";
import React, { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Camera, Facebook, MapPin, PlusCircle, Star, X } from "lucide-react";
import { businessService } from "../../services/businessService";
import type { Business } from "../../types";

export function WriteReviewModal({
  open,
  onClose,
  initialBusiness,
  onShowSoon,
  onOpenAddBusiness,
}: {
  open: boolean;
  onClose: () => void;
  initialBusiness?: Business | null;
  onShowSoon: (feature: string) => void;
  onOpenAddBusiness?: () => void;
}) {
  const [availableBusinesses, setAvailableBusinesses] = useState<Business[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<number>(1);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
    const [serviceRating, setServiceRating] = useState(0);
    const [valueRating, setValueRating] = useState(0);
    const [commRating, setCommRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  
  // Issue #3: Location field state (Optional)
  const [location, setLocation] = useState("");
  
  // Issue #4: Facebook Page URL field state (Optional)
  const [facebookUrl, setFacebookUrl] = useState("");
  
  const [date, setDate] = useState("2026-08-15");
  const [scamAlertRequested, setScamAlertRequested] = useState(false);
  
  // Issue #5: File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Load latest businesses list from API/Database
  useEffect(() => {
    async function loadBusinesses() {
      try {
        const list = await businessService.getAll();
        setAvailableBusinesses(list);
        if (initialBusiness) {
          setSelectedEntityId(initialBusiness.id);
        } else if (list.length > 0) {
          setSelectedEntityId(list[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch businesses for modal", e);
      }
    }
    if (open) {
      loadBusinesses();
    }
  }, [open, initialBusiness]);

  useEffect(() => {
    if (!open) return;
    const listener = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [open, onClose]);

  if (!open) return null;

  /**
   * Issue #5: Validate selected file type and size (Max 5MB)
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validation 1: File Size check (5MB limit)
      const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Megabytes
      if (file.size > MAX_SIZE_BYTES) {
        setFileError("File size exceeds 5MB limit. Please choose a smaller photo or document.");
        setSelectedFile(null);
        setSelectedImagePreview(null);
        return;
      }

      // Validation 2: File Type check
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        setFileError("Invalid file type. Please upload a JPEG, PNG, WEBP image, or PDF document.");
        setSelectedFile(null);
        setSelectedImagePreview(null);
        return;
      }

      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setSelectedImagePreview(URL.createObjectURL(file));
      } else {
        setSelectedImagePreview(null);
      }
    }
  };

  /**
   * Issue #3, #4, #5: Form submission handler
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);
    setSubmitSuccessMsg(null);

    // Issue #4: Optional Facebook URL validation
    if (facebookUrl.trim()) {
      const urlPattern = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+$/i;
      if (!urlPattern.test(facebookUrl.trim()) && !facebookUrl.startsWith("http")) {
        setFileError("Please enter a valid Facebook URL (e.g. https://facebook.com/yourpage)");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Create FormData to support Issue #5 File Upload & Issue #3/#4 optional fields
      const formData = new FormData();
      formData.append("rating", rating.toString());
        if (serviceRating > 0) formData.append("service_rating", serviceRating.toString());
        if (valueRating > 0) formData.append("value_rating", valueRating.toString());
        if (commRating > 0) formData.append("comm_rating", commRating.toString());
      formData.append("title", title.trim());
      formData.append("body", body.trim());
      
      // Issue #3: Location is optional - send if user filled it
      if (location.trim()) {
        formData.append("location", location.trim());
      }
      
      // Issue #4: Facebook Page is optional - send if user filled it
      if (facebookUrl.trim()) {
        formData.append("facebook_url", facebookUrl.trim());
      }
      
      // Issue #5: Attach file if uploaded
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      await businessService.submitReview(selectedEntityId, formData);

      setIsSubmitting(false);
      setSubmitSuccessMsg("Your review has been submitted successfully!");
      
      setTimeout(() => {
        onClose();
        setSubmitSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      setFileError(err.message || "Failed to submit review. Please try again.");
    }
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{ overflowY: "auto", padding: "20px 16px" }}
    >
      <div
        className="review-modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="write-review-title"
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="review-modal-header">
          <h2 id="write-review-title" className="review-modal-title">
            Write a Review
          </h2>
          <p className="review-modal-subtitle">
            Structured experience submission. Reviews attach to canonical entities.
          </p>
        </div>

        {submitSuccessMsg && (
          <div style={{ backgroundColor: "#f0fdf4", color: "#15803d", padding: "12px", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 600, marginBottom: "16px" }}>
            ✓ {submitSuccessMsg}
          </div>
        )}

        {fileError && (
          <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={16} />
            <span>{fileError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="review-form-content">
          {/* 1. Select Entity */}
          <div className="entity-select-field">
            <div className="entity-select-top">
              <label htmlFor="entity-select" className="review-label">
                1. What entity are you reviewing? *
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
                <PlusCircle size={14} /> Entity missing? Add it to TruthHubBD
              </button>
            </div>
            <select
              id="entity-select"
              className="review-input-select"
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(Number(e.target.value))}
            >
              {availableBusinesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.category} {b.location ? `- ${b.location}` : ""})
                </option>
              ))}
            </select>
          </div>

          {/* Overall Rating */}
          <div className="review-form-group">
            <label className="review-label">Overall Rating *</label>
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
                    aria-label={`Rate ${star} stars`}
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
              <span className="rating-text-score">{hoverRating || rating} / 5</span>
            </div>
          </div>

          {/* Review Title */}
          <div className="review-form-group">
            <label htmlFor="review-title" className="review-label">
              Review Title *
            </label>
            <input
              id="review-title"
              type="text"
              className="review-input"
              placeholder="Summarize your key experience in a clear headline..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Experience Details */}
          <div className="review-form-group">
            <label htmlFor="review-body" className="review-label">
              Experience Details *
            </label>
            <textarea
              id="review-body"
              className="review-textarea"
              rows={4}
              placeholder="Describe what happened clearly and factually..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          {/* Issue #3: Location Field (Optional) */}
          <div className="review-form-group">
            <label htmlFor="review-location" className="review-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={15} color="#0f766e" /> Location (Optional)
            </label>
            <input
              id="review-location"
              type="text"
              className="review-input"
              placeholder="e.g. Dhanmondi Branch, Dhaka (Optional - you can leave this empty)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            </div>

          {/* Issue #4: Facebook Page URL Field (Optional) */}
          <div className="review-form-group">
            <label htmlFor="review-facebook" className="review-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Facebook size={15} color="#1877f2" /> Facebook Page / Profile URL (Optional)
            </label>
            <input
              id="review-facebook"
              type="url"
              className="review-input"
              placeholder="https://facebook.com/your-page-or-profile (Optional)"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
            />
            </div>

          {/* Issue #5: File Upload for Reviews */}
          <div className="review-form-group">
            <label className="review-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Camera size={15} color="#0f766e" /> Add Photos / Receipts (Optional, Max 5MB)
            </label>
            <label className="image-upload-zone" style={{ cursor: "pointer" }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {selectedImagePreview ? (
                <div className="uploaded-preview-wrap">
                  <img src={selectedImagePreview} alt="Uploaded preview" className="uploaded-preview-img" style={{ maxHeight: "140px", objectFit: "cover" }} />
                  <span className="uploaded-change-text">Click to change photo ({selectedFile?.name})</span>
                </div>
              ) : selectedFile ? (
                <div className="upload-placeholder" style={{ color: "#0f766e" }}>
                  <span>File Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  <span className="uploaded-change-text" style={{ fontSize: "0.75rem", color: "#64748b" }}>Click to change file</span>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <Camera size={20} className="upload-icon" />
                  <span>Upload receipt, invoice, photo, or PDF (Max 5MB)</span>
                </div>
              )}
            </label>
            </div>

          {/* Experience Date & Conflict */}
          <div className="review-grid-2">
            <div className="review-form-group">
              <label htmlFor="exp-date" className="review-label">
                Experience Date
              </label>
              <input
                id="exp-date"
                type="date"
                className="review-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            
          </div>

          {/* Request Scam Alert Classification */}
          <div className="scam-alert-checkbox-box">
            <div className="scam-box-top">
              <div className="scam-box-title">
                <AlertTriangle size={17} color="#be123c" />
                <span>Request Scam Alert Classification</span>
              </div>
              <input
                type="checkbox"
                checked={scamAlertRequested}
                onChange={(e) => setScamAlertRequested(e.target.checked)}
                className="scam-checkbox"
                aria-label="Request scam alert classification"
              />
            </div>
            <p className="scam-box-note">
              Scam Alert is a moderated evidence workflow, not an instant accusation badge. Evidence is stored privately by default.
            </p>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-submit-review" disabled={isSubmitting}>
            {isSubmitting ? "Submitting Review..." : "Submit Structured Review"}
          </button>
        </form>
      </div>
    </div>
  );
}




