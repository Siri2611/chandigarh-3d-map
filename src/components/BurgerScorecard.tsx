import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChefHat, Droplets, Circle, Square, Box, DollarSign, ShieldCheck, Eye, Zap, X, Star } from 'lucide-react';
import type { RatingParam } from '../App';
import { PARAM_LABELS } from '../App';

const PARAM_ICONS: Record<RatingParam, React.ComponentType<any>> = {
  taste: Sparkles,
  patty_quality: ChefHat,
  juiciness: Droplets,
  bun_quality: Circle,
  cheese_sauce: Square,
  structural_integrity: Box,
  size_price_ratio: DollarSign,
  hygiene: ShieldCheck,
  aesthetic_presentation: Eye,
  service_speed: Zap
};

interface BurgerScorecardProps {
  isOpen: boolean;
  onClose: () => void;
  ratings: Record<RatingParam, number>;
  overallRating: number;
  burgerName?: string;
  restaurantName: string;
}

export function BurgerScorecard({ 
  isOpen, 
  onClose, 
  ratings, 
  overallRating, 
  burgerName, 
  restaurantName 
}: BurgerScorecardProps) {

  const formatRating = (val: number) => (val > 0 ? val.toFixed(1) : '—');
  
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
          style={{
            position: 'fixed', // Fixed to overlay the WHOLE page
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(135deg, #112538 0%, #09131c 100%)', 
            zIndex: 1000, // Above everything
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center', // Center content vertically
            alignItems: 'center', // Center content horizontally
            gap: '12px', // Gap between sections
            color: 'white',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden' // No scrolling
          }}
        >
          {/* Close Button Top Right index overlay */}
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'white',
              padding: '6px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1010
            }}
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div style={{ 
            padding: '0', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            width: '100%',
            maxWidth: '440px'
          }}>
            {/* Centered Logo */}
            <img 
              src="/logo.png" 
              alt="Burger.Theory Logo" 
              style={{ 
                height: '72px', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 10px rgba(255, 122, 0, 0.35))' 
              }} 
            />

            {/* Title Stack */}
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: '0.95rem', 
                letterSpacing: '3px', 
                fontWeight: 800, 
                color: '#FF7A00',
                fontFamily: 'system-ui, sans-serif'
              }}>
                BURGER SCORECARD
              </h1>
              <p style={{ margin: '1px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                {restaurantName} {burgerName ? `• ${burgerName}` : ''}
              </p>
            </div>
          </div>

          {/* Parameters List - Single Column */}
          <div style={{ 
            flex: '0 0 auto', 
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
            maxWidth: '400px'
          }}>
            {Object.entries(PARAM_LABELS).map(([key, label]) => {
              const IconComponent = PARAM_ICONS[key as RatingParam] || Star;
              const val = ratings[key as RatingParam] || 0;

              return (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.01, background: 'rgba(255, 255, 255, 0.04)' }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    transition: 'background 0.2s',
                    height: 'fit-content'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <div style={{ 
                      color: '#3ABEFF', 
                      display: 'flex', 
                      alignItems: 'center',
                      flexShrink: 0
                    }}>
                      <IconComponent size={16} />
                    </div>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 500, 
                      color: 'rgba(255,255,255,0.9)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {label}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '6px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const fill = val >= star ? '#FF7A00' : 'transparent';
                        const stroke = val >= star ? '#FF7A00' : 'rgba(255,255,255,0.15)';
                        return (
                          <Star 
                            key={star} 
                            size={12} 
                            fill={fill} 
                            color={stroke} 
                            style={{ filter: val >= star ? 'drop-shadow(0 0 2px rgba(255, 122, 0, 0.4))' : 'none' }}
                          />
                        );
                      })}
                    </div>
                    <span style={{ 
                      fontSize: '0.95rem', 
                      fontWeight: 700, 
                      color: '#FF7A00',
                      width: '26px',
                      textAlign: 'right'
                    }}>
                      {formatRating(val)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div style={{
            padding: '8px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            width: '100%',
            maxWidth: '500px'
          }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '3px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
              OVERALL RATING
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const fill = overallRating >= star ? '#FF7A00' : 'transparent';
                  const stroke = overallRating >= star ? '#FF7A00' : 'rgba(255,255,255,0.2)';
                  return (
                    <Star 
                      key={star} 
                      size={28} 
                      fill={fill} 
                      color={stroke} 
                      style={{ filter: overallRating >= star ? 'drop-shadow(0 0 6px rgba(255, 122, 0, 0.5))' : 'none' }}
                    />
                  );
                })}
              </div>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 800, 
                color: '#FF7A00',
                textShadow: '0 0 10px rgba(255, 122, 0, 0.3)'
              }}>
                {formatRating(overallRating)}<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}> / 5</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
