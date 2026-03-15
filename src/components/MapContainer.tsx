import React, { useEffect, useCallback } from 'react';
import Map, { NavigationControl, Marker, Source, Layer } from 'react-map-gl/maplibre';
import type { MapRef, LayerProps } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BurgerReview, Verdict } from '../App';

const INITIAL_VIEW_STATE = {
  longitude: 76.7794,
  latitude: 30.7333,
  zoom: 13.5,
  pitch: 60,
  bearing: -20,
};

interface MapContainerProps {
  reviews: BurgerReview[];
  onMapClick: (longitude: number, latitude: number) => void;
  selectedReviewId: string | null;
  onSelectReview: (id: string | null) => void;
  draftLocation: { longitude: number; latitude: number } | null;
  isAdmin: boolean;
}

const buildingLayer: LayerProps = {
  id: '3d-buildings',
  source: 'openmaptiles',
  'source-layer': 'building',
  type: 'fill-extrusion',
  minzoom: 14,
  paint: {
    'fill-extrusion-color': [
      'interpolate',
      ['linear'],
      ['get', 'render_height'],
      0, '#ffffff',
      100, '#f97316'
    ],
    'fill-extrusion-height': [
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      0,
      14.05,
      ['get', 'render_height']
    ],
    'fill-extrusion-base': [
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      0,
      14.05,
      ['get', 'render_min_height']
    ],
    'fill-extrusion-opacity': 0.8
  }
};

const getVerdictColor = (verdict: Verdict) => {
  switch (verdict) {
    case 'Eat Again': return '#22c55e'; // Green
    case 'Try Once': return '#eab308'; // Yellow
    case 'Avoid': return '#ef4444'; // Red
    default: return '#f97316';
  }
};

export function MapContainer({ 
  reviews, 
  onMapClick, 
  selectedReviewId, 
  onSelectReview, 
  draftLocation,
  isAdmin
}: MapContainerProps) {
  const mapRef = React.useRef<MapRef>(null);
  const mapStyleUrl = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

  const handleMapClick = useCallback((e: any) => {
    // Only block if clicking explicitly inside a marker element
    const target = e.originalEvent?.target as HTMLElement;
    if (target && target.closest('.custom-marker')) {
      return;
    }
    
    if (e.lngLat) {
      onMapClick(e.lngLat.lng, e.lngLat.lat);
    }
  }, [onMapClick]);

  useEffect(() => {
    // Detect if we're on mobile to apply a larger bottom padding
    const isMobile = window.innerWidth <= 768;
    const paddingOffset = isMobile ? { bottom: window.innerHeight * 0.4 } : { left: 360 };

    if (selectedReviewId && mapRef.current) {
      const review = reviews.find(r => r.id === selectedReviewId);
      if (review) {
        mapRef.current.flyTo({
          center: [review.longitude, review.latitude],
          zoom: 15,
          pitch: 65,
          padding: paddingOffset,
          duration: 2000,
          essential: true
        });
      }
    } else if (draftLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [draftLocation.longitude, draftLocation.latitude],
        zoom: 15,
        padding: paddingOffset,
        duration: 1000,
        essential: true
      });
    }
  }, [selectedReviewId, draftLocation, reviews]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={mapStyleUrl}
        mapLib={maplibregl as any}
        onClick={handleMapClick}
        interactiveLayerIds={['3d-buildings']}
      >
        <NavigationControl position="bottom-right" />
        
        <Source id="openmaptiles" type="vector" url="https://api.maptiler.com/tiles/v3/tiles.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL">
          <Layer {...buildingLayer} />
        </Source>

        <AnimatePresence>
          {/* Render Saved Reviews */}
          {reviews.map((review) => {
            const isSelected = selectedReviewId === review.id;
            const color = getVerdictColor(review.verdict);
            
            return (
              <Marker 
                key={review.id} 
                longitude={review.longitude} 
                latitude={review.latitude}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  onSelectReview(review.id);
                }}
              >
                <motion.div
                  className="custom-marker"
                  initial={{ scale: 0, y: 50, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  whileHover={{ scale: 1.2 }}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: isSelected ? 10 : 1
                  }}
                >
                  <div
                    className="glass-panel text-sm font-medium"
                    style={{
                      padding: '4px 8px',
                      marginBottom: '8px',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      borderBottom: `2px solid ${color}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{review.restaurantName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(255,165,0,0.1)', padding: '2px 6px', borderRadius: '12px' }}>
                      <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{review.overall}</span>
                      <Star size={12} fill="var(--accent-primary)" color="var(--accent-primary)" />
                    </div>
                  </div>
                  <div style={{
                    position: 'relative',
                    width: '44px',
                    height: '54px',
                    filter: `drop-shadow(0 4px 6px ${color}60)`, // Soft glow based on verdict
                    zIndex: isSelected ? 10 : 1,
                    transformOrigin: 'bottom center',
                  }}>
                    {/* The Teardrop Background PIN Shape */}
                    <svg width="44" height="54" viewBox="0 0 44 54" style={{ position: 'absolute', top: 0, left: 0 }}>
                      <path 
                        d="M22,2 C10.95,2 2,10.95 2,22 C2,34 22,52 22,52 C22,52 42,34 42,22 C42,10.95 33.05,2 22,2 Z" 
                        fill={color}
                        stroke="white"
                        strokeWidth="2"
                      />
                    </svg>

                    {/* Inner Circle displaying the Image or Fallback MapPin */}
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      {review.logoUrl ? (
                        <img 
                          src={review.logoUrl} 
                          alt={review.restaurantName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <MapPin color={color} size={18} />
                      )}
                    </div>
                  </div>
                </motion.div>
              </Marker>
            )
          })}

          {/* Render Draft Marker (Admin Only) */}
          {isAdmin && draftLocation && (
            <Marker 
              key="draft"
              longitude={draftLocation.longitude} 
              latitude={draftLocation.latitude}
              anchor="bottom"
            >
              <motion.div
                className="custom-marker"
                initial={{ scale: 0, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div className="glass-panel text-xs font-semibold" style={{
                  padding: '4px 8px', marginBottom: '8px', color: 'var(--accent-primary)'
                }}>
                  Drafting Review...
                </div>
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    background: 'var(--accent-gradient)',
                    borderRadius: '50%',
                    padding: '6px',
                    opacity: 0.8
                }}>
                  <MapPin color="white" size={20} />
                </motion.div>
              </motion.div>
            </Marker>
          )}
        </AnimatePresence>
      </Map>
    </div>
  );
}
