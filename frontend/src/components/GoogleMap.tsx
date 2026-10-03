import React, { useEffect, useRef, useState } from 'react';
import { MapPin, ExternalLink, Map as MapIcon } from 'lucide-react';
import { Map as MapLibreMap, Marker, NavigationControl, AttributionControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { translateArea } from '../i18n/dictionary';

export function GoogleMap({
  name,
  location,
  placeId,
  latitude,
  longitude,
  administrativeOnly = false,
  lang = 'en',
}: {
  name: string;
  location?: string | null;
  placeId?: string | null;
  latitude?: string | number;
  longitude?: string | number;
  administrativeOnly?: boolean;
  lang?: 'en' | 'bn';
}) {
  const [loaded, setLoaded] = useState(false);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<MapLibreMap | null>(null);
  const bn = lang === 'bn';
  const address = location?.trim() || '';

  const numLat = latitude != null && latitude !== '' ? Number(latitude) : null;
  const numLng = longitude != null && longitude !== '' ? Number(longitude) : null;
  const hasValidCoords =
    numLat != null &&
    numLng != null &&
    Number.isFinite(numLat) &&
    Number.isFinite(numLng) &&
    Math.abs(numLat) <= 90 &&
    Math.abs(numLng) <= 180;

  const hasAddress = Boolean(address && address.toLowerCase() !== 'bangladesh');
  const precise = Boolean(hasValidCoords || (!administrativeOnly && hasAddress));

  const centerLng = hasValidCoords ? numLng! : 90.4125;
  const centerLat = hasValidCoords ? numLat! : 23.8103;

  const osmSearchUrl = hasValidCoords
    ? `https://www.openstreetmap.org/?mlat=${numLat}&mlon=${numLng}#map=16/${numLat}/${numLng}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent([name, address, 'Bangladesh'].filter(Boolean).join(', '))}`;

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

  useEffect(() => {
    if (!loaded || !mapContainer.current || mapInstance.current) return;

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: OSM_RASTER_STYLE,
      center: [centerLng, centerLat],
      zoom: hasValidCoords ? 14 : 11,
      minZoom: 5.5,
      maxZoom: 18,
      attributionControl: false,
    });

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

    if (hasValidCoords) {
      const el = document.createElement('div');
      el.className = 'map-pin-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.filter = 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))';
      el.innerHTML = `
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#ef4444" />
          <circle cx="12" cy="10" r="3.5" fill="#ffffff" stroke="#991b1b" stroke-width="1.5" />
        </svg>
      `;
      new Marker({ element: el, anchor: 'bottom' })
        .setLngLat([centerLng, centerLat])
        .addTo(map);
    }

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [loaded, centerLng, centerLat, hasValidCoords]);

  return (
    <section className="location-card standard-location-card">
      <header>
        <span className="location-icon">
          <MapPin size={22} aria-hidden="true" />
        </span>
        <div>
          <h3>{bn ? 'অবস্থান' : 'Location'}</h3>
          <p>
            {hasAddress
              ? translateArea(address, lang)
              : bn
              ? 'সম্পূর্ণ ঠিকানা দেওয়া নেই—সঠিক শাখা নিশ্চিত করুন'
              : 'Full address not supplied—confirm the correct branch'}
          </p>
        </div>
      </header>

      {precise && loaded && (
        <div className="map-surface" style={{ height: 260, minHeight: 260, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: 10 }} />
        </div>
      )}

      <div className="location-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        {precise && !loaded && (
          <button
            type="button"
            className="btn-map-load"
            onClick={() => setLoaded(true)}
            style={{
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: '#0f766e',
              color: '#ffffff',
              border: '1px solid #0d655e',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(15,118,110,0.18)',
              transition: 'all 0.18s ease',
            }}
          >
            <MapIcon size={18} aria-hidden="true" />
            <span>{bn ? 'মানচিত্র লোড করুন' : 'Load Interactive Map'}</span>
          </button>
        )}
        <a
          href={osmSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-osm-link"
          style={{
            minHeight: '44px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: '#ffffff',
            color: '#0f766e',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '13.5px',
            textDecoration: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.18s ease',
          }}
        >
          <ExternalLink size={17} aria-hidden="true" />
          <span>{bn ? 'ওপেনস্ট্রিটম্যাপে দেখুন' : 'View on OpenStreetMap'}</span>
        </a>
      </div>

      <p className="map-caption">
        {administrativeOnly
          ? bn
            ? 'সোর্সে শুধু প্রশাসনিক এলাকা আছে, রাস্তা বা প্রবেশপথ নয়। মানচিত্রে প্রতিষ্ঠানটি খুঁজুন এবং সরাসরি ঠিকানা নিশ্চিত করুন।'
            : 'Source supplies the administrative area, not a street or entrance. Search the institution on Maps and confirm its precise address.'
          : bn
          ? 'সোর্সের তথ্য অনুযায়ী মানচিত্রের লিংক। যাওয়ার আগে শাখা নিশ্চিত করুন।'
          : 'Map link uses the source location. Confirm the branch before travelling.'}
        {!precise && !administrativeOnly && (bn ? ' অবস্থান যাচাই করা হয়নি।' : ' Location is not verified.')}
      </p>
    </section>
  );
}
export { GoogleMap as EntityMap };
