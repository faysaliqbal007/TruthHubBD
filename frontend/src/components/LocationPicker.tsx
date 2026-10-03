"use client";
import { MapPin } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { BangladeshLocationFields } from './BangladeshLocationFields';
import { locationSummary, normalizeLocationSelection, type LocationValue } from '../data/bd-locations';

interface LocationPickerProps {
  value?: LocationValue;
  onChange: (value: LocationValue) => void;
  label?: string;
  required?: boolean;
  showUpazila?: boolean;
  placeholder?: string;
  compact?: boolean;
  /** Structured intake locations are always physical; kept explicit for callers. */
  allowDiscoveryModes?: boolean;
}

export function LocationPicker({
  value = {}, onChange, label, required = false, showUpazila = true, placeholder, compact = false,
}: LocationPickerProps) {
  const {lang, t} = useI18n();
  const valid = normalizeLocationSelection(value);
  const summary = locationSummary(valid, lang);
  return <fieldset className={`bd-location-picker ${compact ? 'bd-location-compact' : ''}`}>
    <legend><MapPin size={14} aria-hidden="true" /> {label ?? t('Location', 'এলাকা')}{required && <span aria-hidden="true"> *</span>}</legend>
    <BangladeshLocationFields value={valid} onChange={onChange} showUpazila={showUpazila} required={required} />
    <p className="bd-location-confirmed" role="status" aria-live="polite">
      <span>{t('Selected location:', 'নির্বাচিত এলাকা:')}</span> {summary || placeholder || t('Choose an area', 'এলাকা বাছুন')}
    </p>
  </fieldset>;
}

export function LocationBadge({location}: {location: string}) {
  if (!location) return null;
  return <span className="loc-badge"><MapPin size={11} aria-hidden="true" />{location}</span>;
}
