"use client";
import { useEffect, useState, type FormEvent } from 'react';
import { Building2, Save, Loader2, CheckCircle2, AlertTriangle, Search, Edit3, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../i18n/LanguageContext';

const CATEGORIES = [
  'Products',
  'Businesses & Services',
  'Doctors & Professionals',
  'Hospitals & Clinics',
  'Universities & Education',
  'Courier & Digital Services',
];

type OrgData = {
  id: number;
  name: string;
  bengali_name?: string;
  category: string;
  description?: string;
  location?: string;
  phone?: string;
  website?: string;
  facebook_url?: string;
  operating_status?: string;
  image?: string;
  verified?: boolean;
  status?: string;
  slug?: string;
};

export type AdminOrgEditProps = {
  initialOrgId?: number;
  onClose?: () => void;
  onUpdated?: () => void;
};

export function AdminOrganizationEdit({ initialOrgId, onClose, onUpdated }: AdminOrgEditProps = {}) {
  const { t, lang } = useI18n();
  const bn = lang === 'bn';

  const [searchId, setSearchId] = useState(initialOrgId ? String(initialOrgId) : '');
  const [loading, setLoading] = useState(false);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialOrgId) {
      loadOrg(String(initialOrgId));
    }
  }, [initialOrgId]);

  // Edit form fields
  const [name, setName] = useState('');
  const [bengaliName, setBengaliName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [image, setImage] = useState('');
  const [verified, setVerified] = useState(false);
  const [status, setStatus] = useState('approved');
  const [operatingStatus, setOperatingStatus] = useState('unknown');
  const [reason, setReason] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadOrg = async (id: string) => {
    const idNum = parseInt(id.trim(), 10);
    if (!idNum || idNum < 1) return;
    setLoading(true);
    setError('');
    setOrg(null);
    setSaveResult(null);
    try {
      const res = await api<{ success: boolean; data: OrgData }>(`/admin/businesses/${idNum}/details`);
      if (res.data) {
        const o = res.data;
        setOrg(o);
        setName(o.name || '');
        setBengaliName(o.bengali_name || '');
        setCategory(o.category || '');
        setDescription(o.description || '');
        setLocation(o.location || '');
        setPhone(o.phone || '');
        setWebsite(o.website || '');
        setFacebookUrl(o.facebook_url || '');
        setImage(o.image || '');
        setVerified(Boolean(o.verified));
        setStatus(o.status || 'approved');
        setOperatingStatus(o.operating_status || 'unknown');
        setReason('');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(bn ? 'ছবির সাইজ সর্বোচ্চ ২ মেগাবাইট হতে পারবে।' : 'Image size must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!org || saving) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const res = await api<{ success: boolean; message: string }>(
        `/admin/businesses/${org.id}/edit`,
        'PATCH',
        {
          name: name || undefined,
          bengali_name: bengaliName || undefined,
          category: category || undefined,
          description: description || undefined,
          location: location || undefined,
          phone: phone || undefined,
          website: website || undefined,
          facebook_url: facebookUrl || undefined,
          image: image || null,
          verified: verified,
          status: status,
          operating_status: operatingStatus,
          reason: reason.trim() || undefined,
        }
      );
      setSaveResult({ success: true, message: res.message });
      onUpdated?.();
      // Reload org data to show updated values
      await loadOrg(String(org.id));
    } catch (err) {
      setSaveResult({ success: false, message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = {
    display: 'block',
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #d8cdb7',
    borderRadius: 8,
    fontSize: 14,
    background: '#fff',
    color: '#18243e',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  };

  return (
    <div className="workspace-page" style={onClose ? { padding: 0 } : undefined}>
      <div className="workspace-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <span className="workspace-eyebrow">{t('ADMIN / ORGANIZATIONS', 'অ্যাডমিন / প্রতিষ্ঠান')}</span>
          <h1>{t('Edit Organization', 'প্রতিষ্ঠান সম্পাদনা')}</h1>
          <p>
            {t(
              'Search for an organization by ID or manage details directly. All changes are logged in the audit trail.',
              'আইডি দিয়ে প্রতিষ্ঠান খুঁজুন এবং তথ্য সম্পাদনা করুন। সব পরিবর্তন নিরীক্ষা লগে সংরক্ষিত হবে।'
            )}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#334155'
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #d8cdb7',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7283' }} />
          <input
            type="number"
            min="1"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadOrg(searchId)}
            placeholder={bn ? 'প্রতিষ্ঠানের আইডি লিখুন (যেমন: 42)' : 'Enter organization ID (e.g. 42)'}
            style={{ ...fieldStyle, paddingLeft: 40, margin: 0 }}
          />
        </div>
        <button
          type="button"
          disabled={loading || !searchId.trim()}
          onClick={() => loadOrg(searchId)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            background: loading ? '#6b7283' : '#18243e',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={15} />}
          {t('Load', 'লোড করুন')}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', borderRadius: 8, color: '#991b1b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {org && (
        <form onSubmit={handleSave}>
          <div style={{ background: '#fff', border: '1px solid #d8cdb7', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            {/* Org header */}
            <div style={{ background: '#18243e', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Building2 size={20} />
              <div>
                <strong style={{ fontSize: 16 }}>{org.name}</strong>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                  ID: {org.id} · {org.category} · Status: {org.status}
                  {org.slug && <> · <a href={`/business/${org.slug}`} target="_blank" rel="noreferrer" style={{ color: '#f5ddbb' }}>View Public Profile</a></>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setOrg(null); setSearchId(''); }}
                style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, color: '#fff', padding: 6, cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <label>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{t('Name (English)', 'নাম (ইংরেজি)')}</span>
                  <input value={name} onChange={e => setName(e.target.value)} maxLength={255} style={fieldStyle} />
                </label>
                <label>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{t('Bengali Name', 'বাংলা নাম')}</span>
                  <input value={bengaliName} onChange={e => setBengaliName(e.target.value)} maxLength={255} style={fieldStyle} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <label>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{t('Category', 'বিভাগ')}</span>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={fieldStyle}>
                    <option value="">{t('— Select category —', '— বিভাগ নির্বাচন করুন —')}</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{t('Operating Status', 'পরিচালনার অবস্থা')}</span>
                  <select value={operatingStatus} onChange={e => setOperatingStatus(e.target.value)} style={fieldStyle}>
                    <option value="unknown">{t('Unknown', 'অজানা')}</option>
                    <option value="open">{t('Open', 'খোলা')}</option>
                    <option value="closed">{t('Closed', 'বন্ধ')}</option>
                  </select>
                </label>
              </div>

              {/* Image & Logo with upload and URL */}
              <div style={{ background: '#faf7f2', border: '1px solid #e2d9c5', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                  {t('Organization Logo / Image', 'প্রতিষ্ঠানের লোগো / ছবি')}
                </span>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  {image ? (
                    <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid #d8cdb7', background: '#fff', flexShrink: 0 }}>
                      <img src={image} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f5eedb', display: 'grid', placeItems: 'center', color: '#8c8270', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {t('No Image', 'ছবি নেই')}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <input
                      type="text"
                      value={image}
                      onChange={e => setImage(e.target.value)}
                      placeholder="https://... or upload below"
                      style={{ ...fieldStyle, marginBottom: 8 }}
                    />
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#18243e', cursor: 'pointer' }}>
                      📁 {t('Upload New Image (JPG, PNG, WebP)', 'নতুন ছবি আপলোড করুন')}
                      <input type="file" accept="image/*" onChange={handleImageFile} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Status and Verification Badge */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <label>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{t('Directory Listing Status', 'ডিরেক্টরি স্ট্যাটাস')}</span>
                  <select value={status} onChange={e => setStatus(e.target.value)} style={fieldStyle}>
                    <option value="approved">{t('Approved (অনুমোদিত)', 'Approved')}</option>
                    <option value="pending">{t('Pending Review (অপেক্ষমান)', 'Pending Review')}</option>
                    <option value="rejected">{t('Rejected (বাতিল)', 'Rejected')}</option>
                  </select>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#18243e' }}>
                    <input
                      type="checkbox"
                      checked={verified}
                      onChange={e => setVerified(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#059669' }}
                    />
                    <span>✓ {t('Official Verified Badge (সত্যতা যাচাইকৃত)', 'Official Verified Badge')}</span>
                  </label>
                </div>
              </div>

              <label style={{ display: 'block', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{t('Location / Address', 'ঠিকানা')}</span>
                <input value={location} onChange={e => setLocation(e.target.value)} maxLength={255} style={fieldStyle} />
              </label>

              <label style={{ display: 'block', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{t('Description', 'বিবরণ')}</span>
                <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={5000} rows={4} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }} />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                <label>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{t('Phone', 'ফোন')}</span>
                  <input value={phone} onChange={e => setPhone(e.target.value)} maxLength={50} style={fieldStyle} placeholder="+880..." />
                </label>
                <label>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{t('Website', 'ওয়েবসাইট')}</span>
                  <input value={website} onChange={e => setWebsite(e.target.value)} maxLength={500} style={fieldStyle} placeholder="https://..." />
                </label>
                <label>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{t('Facebook URL', 'ফেসবুক লিংক')}</span>
                  <input value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} maxLength={500} style={fieldStyle} placeholder="https://facebook.com/..." />
                </label>
              </div>

              {saveResult && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    marginBottom: 16,
                    background: saveResult.success ? '#d1fae5' : '#fee2e2',
                    color: saveResult.success ? '#065f46' : '#991b1b',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    fontSize: 13,
                  }}
                >
                  {saveResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  {saveResult.message}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    background: saving ? '#6b7283' : '#18243e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                  {saving ? t('Saving…', 'সংরক্ষণ হচ্ছে…') : t('Save Changes', 'পরিবর্তন সংরক্ষণ করুন')}
                </button>
                <span style={{ fontSize: 12, color: '#6b7283' }}>
                  {t('Changes are logged in the audit trail.', 'সব পরিবর্তন নিরীক্ষা লগে থাকবে।')}
                </span>
              </div>
            </div>
          </div>
        </form>
      )}

      {!org && !loading && !error && (
        <div style={{ background: '#fff', border: '1px dashed #d8cdb7', borderRadius: 12, padding: '40px 28px', textAlign: 'center', color: '#6b7283' }}>
          <Edit3 size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: 14 }}>
            {t('Enter an organization ID above to load and edit its details.', 'উপরে প্রতিষ্ঠানের আইডি লিখুন এবং তথ্য সম্পাদনা করুন।')}
          </p>
        </div>
      )}
    </div>
  );
}
