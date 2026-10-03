import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Map as MapLibreMap, Marker, NavigationControl, AttributionControl, type MapMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Navigation, Compass, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import { BangladeshLocationFields } from '../BangladeshLocationFields';
import { type LocationValue, normalizeLocationSelection, locationSummary } from '../../data/bd-locations';
import { api } from '../../services/api';
import './MapLocationPicker.css';

// Approximate coordinate centers for divisions to sync when dropdown changes
const DIVISION_CENTERS: Record<string, [number, number]> = {
  dhaka: [90.4125, 23.8103],
  chittagong: [91.8317, 22.3384],
  rajshahi: [88.6042, 24.3636],
  khulna: [89.5403, 22.8456],
  barisal: [90.3699, 22.7010],
  sylhet: [91.8687, 24.8949],
  rangpur: [89.2444, 25.7439],
  mymensingh: [90.4074, 24.7471],
};

// Guaranteed-accessible OpenStreetMap raster style (zero external token or vendor timeouts)
const OSM_RASTER_STYLE: any = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export interface ResolvedCoordinates {
  lat: number;
  lng: number;
  road?: string;
  area?: string;
  postcode?: string;
  detected_address?: string;
}

interface MapLocationPickerProps {
  value?: LocationValue;
  onChange: (value: LocationValue) => void;
  coordinates?: { lat: number; lng: number } | null;
  onCoordinatesChange?: (coords: ResolvedCoordinates) => void;
  onAddressSelect?: (address: string) => void;
  label?: string;
  required?: boolean;
  showUpazila?: boolean;
}

export function MapLocationPicker({
  value = {},
  onChange,
  coordinates,
  onCoordinatesChange,
  onAddressSelect,
  label,
  required = false,
  showUpazila = true,
}: MapLocationPickerProps) {
  const { lang, t } = useI18n();
  const bn = lang === 'bn';
  const valid = normalizeLocationSelection(value);

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<MapLibreMap | null>(null);
  const markerInstance = useRef<Marker | null>(null);

  const [currentLngLat, setCurrentLngLat] = useState<{ lng: number; lat: number }>({
    lng: coordinates?.lng ?? 90.4125,
    lat: coordinates?.lat ?? 23.8103,
  });
  const [resolving, setResolving] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string>('');
  const [detectedStreet, setDetectedStreet] = useState<string>('');
  const [locatingUser, setLocatingUser] = useState(false);

  // Debounced reverse geocoding call
  const resolveLocation = useCallback(async (lat: number, lng: number) => {
    setResolving(true);
    try {
      const res = await api<{
        success: boolean;
        in_bangladesh?: boolean;
        division_id?: string;
        district_id?: string;
        upazila_id?: string;
        road?: string;
        area?: string;
        postcode?: string;
        detected_address?: string;
      }>('/location/resolve', 'POST', { latitude: lat, longitude: lng });

      if (res && res.success) {
        setDetectedAddress(res.detected_address || '');
        const streetAddr = [res.road, res.area].filter(Boolean).join(', ') || res.detected_address || '';
        setDetectedStreet(streetAddr);
        if (streetAddr) {
          onAddressSelect?.(streetAddr);
        }

        if (res.division_id) {
          onChange({
            divisionId: res.division_id,
            districtId: res.district_id || valid.districtId,
            upazilaId: res.upazila_id || valid.upazilaId,
          });
        }
        onCoordinatesChange?.({
          lat,
          lng,
          road: res.road,
          area: res.area,
          postcode: res.postcode,
          detected_address: res.detected_address,
        });
      }
    } catch {
      // Graceful fallback if offline
    } finally {
      setResolving(false);
    }
  }, [onChange, onCoordinatesChange, onAddressSelect, valid.districtId, valid.upazilaId]);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    const initialLng = coordinates?.lng ?? (valid.divisionId && DIVISION_CENTERS[valid.divisionId] ? DIVISION_CENTERS[valid.divisionId][0] : 90.4125);
    const initialLat = coordinates?.lat ?? (valid.divisionId && DIVISION_CENTERS[valid.divisionId] ? DIVISION_CENTERS[valid.divisionId][1] : 23.8103);

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: OSM_RASTER_STYLE,
      center: [initialLng, initialLat],
      zoom: coordinates ? 15 : 12,
      minZoom: 5.5,
      maxZoom: 19,
      maxBounds: [
        [87.8, 20.3], // Southwest Bangladesh
        [93.0, 27.0], // Northeast Bangladesh
      ],
      attributionControl: false,
    });

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

    // Create custom pin element
    const el = document.createElement('div');
    el.className = 'map-pin-marker';
    el.innerHTML = `
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#ef4444" />
        <circle cx="12" cy="10" r="3.5" fill="#ffffff" stroke="#991b1b" stroke-width="1.5" />
      </svg>
    `;

    const marker = new Marker({ element: el, draggable: true })
      .setLngLat([initialLng, initialLat])
      .addTo(map);

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      setCurrentLngLat({ lng: lngLat.lng, lat: lngLat.lat });
      resolveLocation(lngLat.lat, lngLat.lng);
    });

    map.on('click', (e: MapMouseEvent) => {
      marker.setLngLat(e.lngLat);
      setCurrentLngLat({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      resolveLocation(e.lngLat.lat, e.lngLat.lng);
    });

    mapInstance.current = map;
    markerInstance.current = marker;

    return () => {
      map.remove();
      mapInstance.current = null;
      markerInstance.current = null;
    };
  }, []);

  // Update map center when division changes manually
  useEffect(() => {
    if (!mapInstance.current || !valid.divisionId) return;
    const center = DIVISION_CENTERS[valid.divisionId];
    if (center && !coordinates) {
      mapInstance.current.flyTo({ center, zoom: 11, essential: true });
      markerInstance.current?.setLngLat(center);
      setCurrentLngLat({ lng: center[0], lat: center[1] });
    }
  }, [valid.divisionId]);

  // Locate Me with high accuracy and permission guidance
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert(bn ? 'আপনার ব্রাউজারে ভৌগোলিক অবস্থান (GPS) সুবিধা নেই।' : 'Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const { latitude, longitude } = pos.coords;
        // Verify in BD bounds
        if (latitude < 20.3 || latitude > 27.0 || longitude < 87.8 || longitude > 93.0) {
          alert(bn ? 'আপনার বর্তমান অবস্থান বাংলাদেশের সীমানার বাইরে শনাক্ত হয়েছে।' : 'Current location is outside Bangladesh territory.');
          return;
        }
        if (mapInstance.current && markerInstance.current) {
          mapInstance.current.flyTo({ center: [longitude, latitude], zoom: 15, essential: true });
          markerInstance.current.setLngLat([longitude, latitude]);
          setCurrentLngLat({ lng: longitude, lat: latitude });
          resolveLocation(latitude, longitude);
        }
      },
      (err) => {
        setLocatingUser(false);
        const msg = err.code === 1
          ? (bn ? 'অনুগ্রহ করে ব্রাউজারে লোকেশন/জিপিএস পারমিশন অ্যালাউ করুন।' : 'Location permission was denied. Please allow location access.')
          : (bn ? 'অবস্থান পাওয়া যায়নি। জিপিএস চালু আছে কিনা নিশ্চিত করুন।' : 'Could not retrieve your location. Ensure GPS is enabled.');
        alert(msg);
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  };

  const summary = locationSummary(valid, lang);

  return (
    <div className="map-location-picker">
      <div className="map-picker-topbar">
        <div className="map-picker-title">
          <MapPin size={17} aria-hidden="true" />
          <span>{label ?? t('Interactive Location & Map', 'মানচিত্র ও এলাকা নির্বাচন')} {required && '*'}</span>
        </div>
        <div className="map-picker-actions">
          <button
            type="button"
            className="map-locate-btn"
            onClick={handleLocateMe}
            disabled={locatingUser}
            title={bn ? 'আমার বর্তমান অবস্থান শনাক্ত করুন' : 'Locate my current position'}
          >
            <Navigation size={13} aria-hidden="true" />
            <span>{locatingUser ? (bn ? 'অনুসন্ধান হচ্ছে…' : 'Locating…') : (bn ? 'আমার অবস্থান' : 'Locate Me')}</span>
          </button>
        </div>
      </div>

      {/* Map Surface */}
      <div className="map-canvas-container">
        <div ref={mapContainer} className="map-canvas-surface" />

        {resolving && (
          <div className="map-resolving-spinner">
            {bn ? 'ঠিকানা যাচাই হচ্ছে…' : 'Resolving address…'}
          </div>
        )}

        <div className="map-picker-overlay-badge">
          <Compass size={12} aria-hidden="true" />
          <span>{currentLngLat.lat.toFixed(4)}, {currentLngLat.lng.toFixed(4)}</span>
          {detectedAddress && ` · ${detectedAddress}`}
        </div>
      </div>

      {detectedStreet && (
        <div className="map-picker-detected-street">
          <MapPin size={14} aria-hidden="true" style={{ color: '#059669', flexShrink: 0 }} />
          <div className="map-picker-street-content">
            <span className="map-picker-street-label">{bn ? 'মানচিত্র থেকে প্রাপ্ত ঠিকানা:' : 'Detected Street Address:'}</span>
            <strong className="map-picker-street-val">{detectedStreet}</strong>
          </div>
          <button
            type="button"
            className="map-picker-street-apply-btn"
            onClick={() => onAddressSelect?.(detectedStreet)}
            title={bn ? 'এই ঠিকানাটি ইনপুটে বসান' : 'Apply this street address to input'}
          >
            {bn ? 'ঠিকানায় বসান' : 'Apply to Address'}
          </button>
        </div>
      )}

      <p className="map-picker-helper">
        {bn 
          ? 'মানচিত্রে লাল পিনটি টেনে সঠিক স্থানে বসান অথবা নিচের ড্রপডাউনগুলো ব্যবহার করুন।'
          : 'Drag the pin to your exact building or entrance, or select from the administrative dropdowns below.'}
      </p>

      {/* Manual Dropdowns with live area & place search (Kept 100% fully functional) */}
      <BangladeshLocationFields
        value={valid}
        onChange={onChange}
        onPlaceSelect={(place) => {
          if (place.lat && place.lng && mapInstance.current && markerInstance.current) {
            mapInstance.current.flyTo({ center: [place.lng, place.lat], zoom: 16, essential: true });
            markerInstance.current.setLngLat([place.lng, place.lat]);
            setCurrentLngLat({ lng: place.lng, lat: place.lat });
            if (place.street) {
              setDetectedStreet(place.street);
              onAddressSelect?.(place.street);
            }
            if (place.displayName) {
              setDetectedAddress(place.displayName);
            }
            onCoordinatesChange?.({
              lat: place.lat,
              lng: place.lng,
              road: place.street,
              detected_address: place.displayName,
            });
          }
        }}
        showUpazila={showUpazila}
        required={required}
      />

      <p className="bd-location-confirmed" role="status" aria-live="polite">
        <CheckCircle2 size={13} color="#059669" aria-hidden="true" />
        <span>{t('Confirmed location:', 'নিশ্চিত এলাকা:')}</span> {summary || t('Choose an area', 'এলাকা বাছুন')}
      </p>
    </div>
  );
}
