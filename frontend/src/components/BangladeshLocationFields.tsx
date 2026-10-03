import { useId, useMemo, useState, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { api } from '../services/api';
import {
  divisions, getDistricts, getUpazilas, normalizeLocationSelection, searchBDLocations,
  locationCoverage, type LocationAreaKind, type LocationValue,
} from '../data/bd-locations';
import './BangladeshLocationFields.css';

export interface PlaceSelection {
  lat?: number;
  lng?: number;
  street?: string;
  displayName?: string;
  selection: LocationValue;
}

export function BangladeshLocationFields({value, onChange, onPlaceSelect, showUpazila = true, required = false}: {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  onPlaceSelect?: (place: PlaceSelection) => void;
  showUpazila?: boolean;
  required?: boolean;
}) {
  const {lang, t} = useI18n();
  const id = useId();
  const [query, setQuery] = useState('');
  const valid = normalizeLocationSelection(value);
  const currentDistricts = getDistricts(valid.divisionId || '');
  const currentAreas = getUpazilas(valid.districtId || '');
  const results = useMemo(() => searchBDLocations(query, 8), [query]);

  const [apiResults, setApiResults] = useState<Array<{
    id: string;
    name: string;
    name_bn: string;
    display_name: string;
    type: string;
    lat: number;
    lng: number;
    division_id?: string | null;
    district_id?: string | null;
    upazila_id?: string | null;
    street?: string;
  }>>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setApiResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api<{ success: boolean; data: any[] }>(`/location/search?q=${encodeURIComponent(q)}`);
        if (res && res.success && Array.isArray(res.data)) {
          setApiResults(res.data);
        }
      } catch {
        // silent fallback to local results
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const name = (item: {name: string; nameBn: string}) => lang === 'bn' ? item.nameBn : item.name;
  const kindLabel = (kind: LocationAreaKind | 'division' | 'district') => ({
    upazila: t('Administrative upazila', 'প্রশাসনিক উপজেলা'),
    'police-thana': t('Police thana', 'পুলিশ থানা'),
    city: t('City area', 'শহর এলাকা'), locality: t('Local area', 'স্থানীয় এলাকা'),
    district: t('District', 'জেলা'), division: t('Division', 'বিভাগ'),
  })[kind];

  const chooseResult = (result: (typeof results)[0]) => {
    const sel = showUpazila ? result.value : {divisionId: result.value.divisionId, districtId: result.value.districtId};
    onChange(sel);
    onPlaceSelect?.({
      selection: sel,
      displayName: name(result),
    });
    setQuery('');
  };

  const chooseApiResult = (item: typeof apiResults[0]) => {
    const sel: LocationValue = {
      divisionId: item.division_id || valid.divisionId,
      districtId: item.district_id || valid.districtId,
      upazilaId: item.upazila_id || valid.upazilaId,
    };
    onChange(showUpazila ? sel : {divisionId: sel.divisionId, districtId: sel.districtId});
    onPlaceSelect?.({
      lat: item.lat,
      lng: item.lng,
      street: item.street,
      displayName: item.display_name,
      selection: sel,
    });
    setQuery('');
  };

  const hasAnyResults = results.length > 0 || apiResults.length > 0;

  return <div className="bd-location-fields">
    <label className="bd-location-search-label" htmlFor={`${id}-search`}>{t('Search an area or address', 'এলাকা বা ঠিকানা খুঁজুন')}</label>
    <div className="bd-location-search">
      <Search size={17} aria-hidden="true" />
      <input id={`${id}-search`} type="search" value={query} autoComplete="off"
        placeholder={t('e.g. Uttara sector 7, Dhanmondi, Agrabad...', 'যেমন: উত্তরা সেক্টর ৭, ধানমন্ডি, আগ্রাবাদ…')}
        aria-describedby={`${id}-search-help`}
        onChange={event => setQuery(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            if (apiResults[0]) chooseApiResult(apiResults[0]);
            else if (results[0]) chooseResult(results[0]);
          }
        }} />
      {searching && <Loader2 size={15} className="animate-spin" style={{ color: '#0284c7', marginRight: 8 }} />}
    </div>
    <p className="bd-location-hint" id={`${id}-search-help`}>{t('Search directly or use the three lists below.', 'সরাসরি খুঁজুন অথবা নিচের তিনটি তালিকা ব্যবহার করুন।')}</p>
    {query.trim() && <div className="bd-location-results" aria-label={t('Location search results', 'এলাকার অনুসন্ধান ফলাফল')}>
      {hasAnyResults ? <ul>
        {apiResults.map(item => (
          <li key={item.id} className="bd-location-api-item">
            <button type="button" onClick={() => chooseApiResult(item)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} style={{ color: '#b7362a', flexShrink: 0 }} />
                <strong>{lang === 'bn' ? item.name_bn || item.name : item.name}</strong>
              </div>
              <span style={{ fontSize: 11.5, color: '#64748b' }}>{item.display_name}</span>
            </button>
          </li>
        ))}
        {results.map(result => <li key={`${result.type}-${result.id}`}>
          <button type="button" onClick={() => chooseResult(result)}>
            <strong>{name(result)}</strong>
            <span>{kindLabel(result.type)} · {lang === 'bn' ? result.contextBn : result.context}</span>
          </button>
        </li>)}
      </ul> : searching ? (
        <p role="status">{t('Searching area…', 'এলাকা অনুসন্ধান হচ্ছে…')}</p>
      ) : (
        <p role="status">{t('No matching area. Try the district name or another spelling.', 'এলাকা মেলেনি। জেলার নাম বা অন্য বানান দিয়ে খুঁজুন।')}</p>
      )}
    </div>}
    <div className="bd-location-selects">
      <label htmlFor={`${id}-division`}>
        <span>{t('Division', 'বিভাগ')}</span>
        <select id={`${id}-division`} value={valid.divisionId || ''} required={required}
          onChange={event => onChange(normalizeLocationSelection({divisionId: event.target.value}))}>
          <option value="">{t('Select division', 'বিভাগ বাছুন')}</option>
          {divisions.map(division => <option key={division.id} value={division.id}>{name(division)}</option>)}
        </select>
      </label>
      <label htmlFor={`${id}-district`}>
        <span>{t('District', 'জেলা')}</span>
        <select id={`${id}-district`} value={valid.districtId || ''} disabled={!valid.divisionId} required={required}
          onChange={event => onChange(normalizeLocationSelection({divisionId: valid.divisionId, districtId: event.target.value}))}>
          <option value="">{t('Select district', 'জেলা বাছুন')}</option>
          {currentDistricts.map(district => <option key={district.id} value={district.id}>{name(district)}</option>)}
        </select>
      </label>
      {showUpazila && <label htmlFor={`${id}-area`}>
        <span>{t('Upazila / city area', 'উপজেলা / শহর এলাকা')}</span>
        <select id={`${id}-area`} value={valid.upazilaId || ''} disabled={!valid.districtId} required={required}
          onChange={event => onChange(normalizeLocationSelection({...valid, upazilaId: event.target.value}))}>
          <option value="">{required ? t('Select local area', 'স্থানীয় এলাকা বাছুন') : t('Entire district', 'পুরো জেলা')}</option>
          {(['upazila', 'police-thana', 'city', 'locality'] as const).map(kind => {
            const options = currentAreas.filter(area => area.kind === kind);
            return options.length ? <optgroup key={kind} label={kindLabel(kind)}>
              {options.map(area => <option key={area.id} value={area.id}>{name(area)}</option>)}
            </optgroup> : null;
          })}
        </select>
      </label>}
    </div>
    <details className="bd-location-source">
      <summary>{t('Location coverage and sources', 'এলাকার তালিকা ও উৎস')}</summary>
      <p>{t(`Source snapshot: 8 divisions, 64 districts and ${locationCoverage.administrativeUpazilas} administrative upazilas, checked ${locationCoverage.checkedAt}. Police thanas and city neighbourhoods are listed separately; their coverage is partial.`,
        `উৎসের তালিকা: ৮ বিভাগ, ৬৪ জেলা ও ${new Intl.NumberFormat('bn-BD').format(locationCoverage.administrativeUpazilas)} প্রশাসনিক উপজেলা; যাচাই ${locationCoverage.checkedAt}। পুলিশ থানা ও শহরের এলাকা আলাদা; সেগুলোর তালিকা আংশিক।`)}</p>
      <a href={locationCoverage.sourceUrl} target="_blank" rel="noreferrer">{t('Bangladesh National Portal', 'বাংলাদেশ জাতীয় তথ্য বাতায়ন')}</a>
      <span> · </span><a href="https://dpp.gov.bd/bgpress/index.php/document/extraordinary_gazettes_monthly/2026-07-01" target="_blank" rel="noreferrer">{t('Government gazettes', 'সরকারি গেজেট')}</a>
    </details>
  </div>;
}
