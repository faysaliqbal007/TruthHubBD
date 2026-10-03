"use client";
import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { translateArea } from '../i18n/dictionary';
import {
  locationSummary, locationAreaLabel, locationSelectionFromLabel,
  normalizeLocationSelection, type LocationValue,
} from '../data/bd-locations';
import { BangladeshLocationFields } from './BangladeshLocationFields';

interface AreaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedArea: string;
  onSelectArea: (area: string) => void;
  /** Discovery can filter nationwide/online. Intake should select a physical area. */
  allowDiscoveryModes?: boolean;
}

export function AreaPickerModal({
  isOpen, onClose, selectedArea, onSelectArea, allowDiscoveryModes = true,
}: AreaPickerModalProps) {
  const {lang, t} = useI18n();
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<LocationValue>({});
  const [scope, setScope] = useState<'area' | 'nationwide' | 'online'>('area');

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setDraft(normalizeLocationSelection(locationSelectionFromLabel(selectedArea)));
    setScope(allowDiscoveryModes && /^Online Only/.test(selectedArea) ? 'online'
      : allowDiscoveryModes && (!selectedArea || /^All Bangladesh/.test(selectedArea)) ? 'nationwide' : 'area');
    panel.current?.querySelector<HTMLInputElement>('input')?.focus();
    return () => {document.body.style.overflow = overflow; previous?.focus();};
  }, [isOpen, selectedArea, allowDiscoveryModes]);

  if (!isOpen) return null;
  const geographicLabel = locationAreaLabel(draft);
  const finalLabel = scope === 'online' ? 'Online Only · শুধু অনলাইন'
    : scope === 'nationwide' ? 'All Bangladesh (সারাদেশ)' : geographicLabel;
  const summary = scope === 'area'
    ? locationSummary(draft, lang)
    : translateArea(finalLabel, lang);
  const apply = () => {if (!finalLabel) return; onSelectArea(finalLabel); onClose();};

  return <div className="area-modal-backdrop bd-area-backdrop" onClick={onClose}>
    <div ref={panel} className="area-modal-card bd-area-dialog" role="dialog" aria-modal="true"
      aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      onClick={event => event.stopPropagation()}
      onKeyDown={event => {
        if (event.key === 'Escape') {event.preventDefault(); event.stopPropagation(); onClose();}
        if (event.key === 'Tab') {
          const nodes = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], summary') || [])
            .filter(node => node.getClientRects().length > 0);
          const first = nodes[0], last = nodes[nodes.length - 1];
          if (first && event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
          else if (last && !event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
        }
      }}>
      <header className="area-modal-header">
        <div>
          <h3 id={`${id}-title`} className="area-modal-title">{t('Choose a location', 'এলাকা বাছুন')}</h3>
          <p id={`${id}-description`} className="area-modal-sub">{t('Search or select division, district and local area.', 'খুঁজুন অথবা বিভাগ, জেলা ও স্থানীয় এলাকা বাছুন।')}</p>
        </div>
        <button type="button" className="area-modal-close" onClick={onClose} aria-label={t('Close location picker', 'এলাকা বাছাই বন্ধ করুন')}><X size={20} /></button>
      </header>
      <div className="bd-area-body">
        {allowDiscoveryModes && <label className="bd-location-scope" htmlFor={`${id}-scope`}>
          <span>{t('Show results in', 'ফলাফল দেখুন')}</span>
          <select id={`${id}-scope`} value={scope} onChange={event => setScope(event.target.value as typeof scope)}>
            <option value="area">{t('A selected area', 'নির্বাচিত এলাকা')}</option>
            <option value="nationwide">{t('All Bangladesh', 'সারাদেশ')}</option>
            <option value="online">{t('Online only', 'শুধু অনলাইন')}</option>
          </select>
        </label>}
        <BangladeshLocationFields value={draft} onChange={value => {setDraft(value); setScope('area');}} />
      </div>
      <footer className="area-modal-footer bd-area-footer">
        <div className="area-current-selected" role="status" aria-live="polite">
          <small>{t('Selected location', 'নির্বাচিত এলাকা')}</small>
          <b>{summary || t('Choose an area above', 'উপরে একটি এলাকা বাছুন')}</b>
        </div>
        <div className="area-modal-buttons">
          <button type="button" className="btn-paper-outline" onClick={onClose}>{t('Cancel', 'বাতিল')}</button>
          <button type="button" className="btn-vermilion" disabled={!finalLabel} onClick={apply}>{t('Confirm location', 'এলাকা নিশ্চিত করুন')}</button>
        </div>
      </footer>
    </div>
  </div>;
}
