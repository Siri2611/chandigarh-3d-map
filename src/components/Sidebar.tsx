import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Navigation, Trash2, ArrowLeft, Star, Plus, ExternalLink, UserPlus, Users } from 'lucide-react';
import type { Restaurant, ReviewerRating, SidebarMode, RatingParam } from '../App';
import { RATING_PARAMS, PARAM_LABELS } from '../App';
import { BurgerScorecard } from './BurgerScorecard';

interface SidebarProps {
  mode: SidebarMode;
  onSetMode: (mode: SidebarMode) => void;
  restaurants: Restaurant[];
  selectedRestaurantId: string | null;
  onSelectRestaurant: (id: string | null) => void;
  onDeleteRestaurant: (id: string) => void;
  onCreateRestaurant: (data: { name: string; burger_name?: string; image_url?: string; location_url?: string }) => void;
  onAddReviewerRating: (restaurantId: string, data: Omit<ReviewerRating, 'id' | 'restaurant_id' | 'created_at'>) => void;
  onUpdateReviewerRating: (ratingId: string, restaurantId: string, data: Omit<ReviewerRating, 'id' | 'restaurant_id' | 'created_at'>) => void;
  onDeleteReviewerRating: (ratingId: string, restaurantId: string) => void;
  draftLocation: { longitude: number; latitude: number } | null;
  isAdmin: boolean;
}

const getRatingColor = (rating: number) => {
  if (rating >= 4) return '#22c55e';
  if (rating >= 2.5) return '#eab308';
  return '#ef4444';
};

const StarRating = ({ value }: { value: number }) => {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercentage = Math.max(0, Math.min(100, (value - (star - 1)) * 100));
        return (
          <div key={star} style={{ position: 'relative', width: '16px', height: '16px' }}>
            <Star size={16} color="var(--text-muted)" fill="transparent" style={{ position: 'absolute', top: 0, left: 0 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: `${fillPercentage}%`, overflow: 'hidden', height: '16px' }}>
              <Star size={16} color="var(--accent-primary)" fill="var(--accent-primary)" style={{ position: 'absolute', top: 0, left: 0 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function Sidebar({ 
  mode, 
  onSetMode,
  restaurants, 
  selectedRestaurantId, 
  onSelectRestaurant, 
  onDeleteRestaurant, 
  onCreateRestaurant,
  onAddReviewerRating,
  onUpdateReviewerRating,
  onDeleteReviewerRating,
  draftLocation,
  isAdmin
}: SidebarProps) {
  
  // ─── Create Restaurant Form State ───
  const [restaurantName, setRestaurantName] = useState('');
  const [burgerName, setBurgerName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [locationUrl, setLocationUrl] = useState('');

  // ─── Edit Reviewer Form State ───
  const [expandedReviewerId, setExpandedReviewerId] = useState<string | null>(null);
  const [editReviewerRatings, setEditReviewerRatings] = useState<Record<RatingParam, number> | null>(null);

  // ─── Scorecard State ───
  const [showScorecard, setShowScorecard] = useState(false);

  // ─── List Sorting State ───
  const [sortBy, setSortBy] = useState<'overall' | 'juiciness' | 'size_price_ratio'>('overall');

  // ─── Add Reviewer Form State ───
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRatings, setReviewerRatings] = useState<Record<RatingParam, number>>(
    Object.fromEntries(RATING_PARAMS.map(p => [p, 3])) as Record<RatingParam, number>
  );

  // Mobile collapsed state logic
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dragControls = useDragControls();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (mode !== 'list') {
      setIsMobileExpanded(true);
    } else {
      setIsMobileExpanded(false);
    }
  }, [mode]);

  const handleCreateRestaurant = () => {
    if (!restaurantName.trim()) return;
    onCreateRestaurant({
      name: restaurantName.trim(),
      burger_name: burgerName.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      location_url: locationUrl.trim() || undefined,
    });
    setRestaurantName('');
    setBurgerName('');
    setImageUrl('');
    setLocationUrl('');
  };

  const handleSubmitReviewerRating = () => {
    if (!reviewerName.trim() || !selectedRestaurantId) return;
    onAddReviewerRating(selectedRestaurantId, {
      reviewer_name: reviewerName.trim(),
      ...reviewerRatings,
    });
    setReviewerName('');
    setReviewerRatings(Object.fromEntries(RATING_PARAMS.map(p => [p, 3])) as Record<RatingParam, number>);
  };

  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);

  const headerTitle = (() => {
    switch (mode) {
      case 'detail': return 'Restaurant Details';
      case 'add': return 'New Restaurant';
      case 'add-reviewer': return 'Add Reviewer';
      default: return '';
    }
  })();

  // ─── Sorting Logic ───
  const sortedRestaurants = [...restaurants].sort((a, b) => {
    if (sortBy === 'overall') {
      return b.overall_rating - a.overall_rating;
    } else if (sortBy === 'juiciness') {
      return (b.param_averages['juiciness'] || 0) - (a.param_averages['juiciness'] || 0);
    } else if (sortBy === 'size_price_ratio') {
      return (b.param_averages['size_price_ratio'] || 0) - (a.param_averages['size_price_ratio'] || 0);
    }
    return 0;
  });

  return (
    <motion.div 
      className="glass-panel glass-sidebar"
      initial={{ x: -400, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1, 
        y: isMobile 
          ? (isMobileExpanded ? 0 : 'calc(50dvh - 60px)') 
          : 0
      }}
      transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.2 }}
      drag={isMobile ? "y" : false}
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.3, bottom: 0.3 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 50 || info.velocity.y > 500) {
          setIsMobileExpanded(false);
        } else if (info.offset.y < -50 || info.velocity.y < -500) {
          setIsMobileExpanded(true);
        }
      }}
      style={{
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Mobile Pull Handle */}
      <div 
        className="mobile-pull-tab" 
        onPointerDown={(e) => dragControls.start(e)}
        onClick={(e) => {
          e.stopPropagation();
          setIsMobileExpanded(prev => !prev);
        }}
        style={{ cursor: 'grab', touchAction: 'none' }}
      >
        <div className="pull-tab-handle" />
      </div>

      {/* Dynamic Header */}
      {mode !== 'list' && (
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button
            whileHover={{ x: -2 }}
            onClick={() => {
              if (mode === 'add-reviewer') {
                onSetMode('detail');
              } else {
                onSelectRestaurant(null);
              }
            }}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px'
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <span className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
            {headerTitle}
          </span>
        </div>
      )}

      <div className="sidebar-content-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <AnimatePresence mode="wait">
          
          {/* ═══════════ LIST VIEW ═══════════ */}
          {mode === 'list' && (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ marginBottom: '8px' }}>
                <p className="text-sm text-secondary">
                  {isAdmin 
                    ? <><strong>Click the map</strong> to add a new restaurant, or explore rated spots below.</>
                    : <>Explore the mapped burgers below. Click a pin to see the full breakdown!</>
                  }
                </p>
              </div>

              {/* Sorting Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort by:</span>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                  {(['overall', 'size_price_ratio', 'juiciness'] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    style={{
                      background: sortBy === option ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                      color: sortBy === option ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid',
                      borderColor: sortBy === option ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                      padding: '6px 12px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      textTransform: 'capitalize'
                    }}
                  >
                    {option === 'size_price_ratio' ? 'Value (Size/Price)' : option === 'overall' ? 'Overall Rating' : option}
                  </button>
                ))}
                </div>
              </div>

              {sortedRestaurants.length === 0 ? (
                <div className="flex-center" style={{ flexDirection: 'column', opacity: 0.5, padding: '40px 0', textAlign: 'center' }}>
                  <Navigation size={40} style={{ marginBottom: '16px' }} />
                  <p className="text-sm">No restaurants mapped yet.<br/>Time to start eating!</p>
                </div>
              ) : (
                sortedRestaurants.map(restaurant => (
                  <motion.div
                    key={restaurant.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onSelectRestaurant(restaurant.id)}
                    style={{
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid var(--glass-border)`,
                      borderLeft: `4px solid ${getRatingColor(restaurant.overall_rating)}`,
                      borderRadius: 'var(--border-radius-md)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {restaurant.image_url && (
                          <img src={restaurant.image_url} alt={restaurant.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        )}
                        <div>
                          <h3 className="text-sm font-semibold" style={{ margin: 0 }}>{restaurant.name}</h3>
                          {restaurant.burger_name && <p className="text-xs text-muted" style={{ margin: 0, opacity: 0.7 }}>{restaurant.burger_name}</p>}
                        </div>
                      </div>
                      <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        {/* Removed reviewer count icon row */}
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StarRating value={restaurant.overall_rating} />
                      <span className="text-xs text-secondary">
                        {restaurant.overall_rating > 0 ? `${restaurant.overall_rating.toFixed(1)}/5` : 'No ratings'}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ═══════════ DETAIL VIEW ═══════════ */}
          {mode === 'detail' && selectedRestaurant && (
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              {/* Restaurant Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {selectedRestaurant.image_url && (
                      <img 
                        src={selectedRestaurant.image_url} 
                        alt={selectedRestaurant.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(249, 115, 22, 0.2)' }} 
                      />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.3rem', lineHeight: 1.2 }}>
                        {selectedRestaurant.name}
                      </h2>
                      {selectedRestaurant.burger_name && (
                        <p className="text-xs text-muted" style={{ margin: 0, marginTop: '-2px' }}>
                          {selectedRestaurant.burger_name}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <StarRating value={selectedRestaurant.overall_rating} />
                        <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>
                          {selectedRestaurant.overall_rating > 0 ? `${selectedRestaurant.overall_rating.toFixed(1)}/5` : 'No ratings'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: 'rgba(255,255,255,0.08)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Users size={12} /> {selectedRestaurant.ratings.length} review{selectedRestaurant.ratings.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* 10 Parameter Averages Grid */}
              {selectedRestaurant.ratings.length > 0 && (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '12px',
                  background: 'radial-gradient(circle at center, rgba(249, 115, 22, 0.25), rgba(251, 191, 36, 0.04))', 
                  padding: '16px', borderRadius: 'var(--border-radius-md)',
                  border: '1.5px solid var(--accent-primary)',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.08)'
                }}>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    Average Ratings
                  </p>
                  {RATING_PARAMS.map(param => (
                    <div key={param} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)', flex: 1, minWidth: 0 }}>{PARAM_LABELS[param]}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <StarRating value={selectedRestaurant.param_averages[param]} />
                        <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)', width: '24px', textAlign: 'right' }}>
                          {selectedRestaurant.param_averages[param].toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {isAdmin && (
                    <p 
                      onClick={() => setShowScorecard(true)} 
                      style={{
                        textAlign: 'center', marginTop: '12px', cursor: 'pointer',
                        textDecoration: 'underline', color: 'var(--accent-primary)',
                        fontSize: '0.85rem', fontWeight: 600
                      }}
                    >
                      Reveal Scorecard
                    </p>
                  )}
                </div>
              )}

              {/* Location Link */}
              {selectedRestaurant.location_url && (
                <a 
                  href={selectedRestaurant.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-panel"
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    gap: '8px', width: '100%', padding: '12px',
                    textDecoration: 'none', color: 'var(--accent-primary)',
                    fontWeight: 'bold', transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                >
                  <ExternalLink size={18} />
                  Open in Maps
                </a>
              )}

              {/* ─── Reviewers Section ─── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    Reviewers
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => onSetMode('add-reviewer')}
                      style={{
                        background: 'var(--accent-gradient)', border: 'none', color: 'white',
                        padding: '6px 12px', borderRadius: 'var(--border-radius-sm)',
                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <UserPlus size={14} /> Add Reviewer
                    </button>
                  )}
                </div>

                {selectedRestaurant.ratings.length === 0 ? (
                  <p className="text-xs text-muted" style={{ opacity: 0.6, fontStyle: 'italic' }}>
                    No reviewers yet. {isAdmin && "Add one to start rating!"}
                  </p>
                ) : (
                  selectedRestaurant.ratings.map(rating => {
                    const isExpanded = expandedReviewerId === rating.id;
                    const overall = (RATING_PARAMS.reduce((s, p) => s + (rating[p] || 0), 0) / 10).toFixed(1);

                    return (
                      <div key={rating.id} style={{
                        padding: '12px', background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)',
                        display: 'flex', flexDirection: 'column', gap: '12px'
                      }}>
                        <div 
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedReviewerId(null);
                              setEditReviewerRatings(null);
                            } else {
                              setExpandedReviewerId(rating.id);
                              // Hydrate edit state
                              const currentRatings: any = {};
                              RATING_PARAMS.forEach(p => currentRatings[p] = rating[p] || 0);
                              setEditReviewerRatings(currentRatings);
                            }
                          }}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        >
                          <div>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {rating.reviewer_name}
                            </span>
                            <p className="text-xs text-muted" style={{ margin: '2px 0 0' }}>
                              Overall: {overall}/5
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StarRating value={parseFloat(overall)} />
                            {isAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteReviewerRating(rating.id, selectedRestaurant.id);
                                }}
                                style={{
                                  background: 'transparent', border: 'none',
                                  color: 'rgba(239, 68, 68, 0.7)', cursor: 'pointer', padding: '4px'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}
                            >
                              {RATING_PARAMS.map(param => {
                                const val = editReviewerRatings ? editReviewerRatings[param] : rating[param] || 0;
                                return (
                                  <div key={param} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <label className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>{PARAM_LABELS[param]}</label>
                                      <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)', fontSize: '0.7rem' }}>
                                        {val.toFixed(1)}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <StarRating value={val} />
                                      {isAdmin && editReviewerRatings && (
                                        <input 
                                          type="range" min="0" max="5" step="0.1" 
                                          value={val} 
                                          onClick={e => e.stopPropagation()}
                                          onChange={e => {
                                            e.stopPropagation();
                                            setEditReviewerRatings(prev => prev ? ({ ...prev, [param]: parseFloat(e.target.value) }) : null);
                                          }} 
                                          style={{ flex: 1, accentColor: 'var(--accent-primary)', height: '2px' }} 
                                        />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {isAdmin && editReviewerRatings && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateReviewerRating(rating.id, selectedRestaurant.id, {
                                      reviewer_name: rating.reviewer_name,
                                      ...editReviewerRatings
                                    });
                                    setExpandedReviewerId(null);
                                    setEditReviewerRatings(null);
                                  }}
                                  style={{
                                    background: 'var(--accent-gradient)', border: 'none', color: 'white',
                                    padding: '8px', borderRadius: 'var(--border-radius-sm)',
                                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                    marginTop: '6px', width: '100%'
                                  }}
                                >
                                  Save Changes
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Admin: Delete Restaurant */}
              {isAdmin && (
                <motion.button
                  whileHover={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                  onClick={() => onDeleteRestaurant(selectedRestaurant.id)}
                  style={{
                    marginTop: 'auto', background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    padding: '12px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px',
                    borderRadius: 'var(--border-radius-md)',
                    transition: 'background 0.2s', width: '100%'
                  }}
                >
                  <Trash2 size={16} /> <span className="text-sm font-medium">Delete Restaurant</span>
                </motion.button>
              )}

              {/* Burger Scorecard Overlay Modal */}
              <BurgerScorecard 
                isOpen={showScorecard}
                onClose={() => setShowScorecard(false)}
                ratings={selectedRestaurant.param_averages}
                overallRating={selectedRestaurant.overall_rating}
                burgerName={selectedRestaurant.burger_name}
                restaurantName={selectedRestaurant.name}
              />
            </motion.div>
          )}

          {/* ═══════════ ADD RESTAURANT VIEW ═══════════ */}
          {mode === 'add' && draftLocation && (
            <motion.div
              key="add-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <h2 className="text-lg font-semibold" style={{ margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                Create Restaurant
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Restaurant Name *" 
                  value={restaurantName}
                  onChange={e => setRestaurantName(e.target.value)}
                  style={inputStyle}
                />
                <input 
                  type="text" 
                  placeholder="Burger Name *" 
                  value={burgerName}
                  onChange={e => setBurgerName(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Restaurant Image URL (Optional)"
                  style={inputStyle}
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Google Maps Link (Optional)"
                  style={inputStyle}
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                />
              </div>

              <p className="text-xs text-muted" style={{ margin: 0 }}>
                After creating, you can add reviewer ratings from the detail page.
              </p>

              <button
                onClick={handleCreateRestaurant}
                disabled={!restaurantName.trim()}
                style={{
                  background: (!restaurantName.trim()) ? 'rgba(255,255,255,0.1)' : 'var(--accent-gradient)',
                  color: (!restaurantName.trim()) ? 'var(--text-muted)' : 'white',
                  border: 'none', padding: '12px',
                  borderRadius: 'var(--border-radius-md)',
                  fontWeight: 600,
                  cursor: (!restaurantName.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                }}
              >
                <Plus size={18} /> Create Restaurant
              </button>
            </motion.div>
          )}

          {/* ═══════════ ADD REVIEWER VIEW ═══════════ */}
          {mode === 'add-reviewer' && selectedRestaurant && (
            <motion.div
              key="add-reviewer-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <h2 className="text-lg font-semibold" style={{ margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                Rate: {selectedRestaurant.name}
              </h2>

              <input 
                type="text" 
                placeholder="Reviewer Name *" 
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
                style={inputStyle}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
                {RATING_PARAMS.map(param => (
                  <div key={param} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="text-xs text-muted">{PARAM_LABELS[param]}</label>
                      <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>
                        {reviewerRatings[param].toFixed(1)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <StarRating value={reviewerRatings[param]} />
                      <input 
                        type="range" min="0" max="5" step="0.1" 
                        value={reviewerRatings[param]} 
                        onChange={e => setReviewerRatings(prev => ({ ...prev, [param]: parseFloat(e.target.value) }))} 
                        style={{ flex: 1, accentColor: 'var(--accent-primary)', height: '4px' }} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmitReviewerRating}
                disabled={!reviewerName.trim()}
                style={{
                  background: (!reviewerName.trim()) ? 'rgba(255,255,255,0.1)' : 'var(--accent-gradient)',
                  color: (!reviewerName.trim()) ? 'var(--text-muted)' : 'white',
                  border: 'none', padding: '12px',
                  borderRadius: 'var(--border-radius-md)',
                  fontWeight: 600,
                  cursor: (!reviewerName.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                }}
              >
                <UserPlus size={18} /> Submit Rating
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const inputStyle = {
  background: 'rgba(0, 0, 0, 0.03)',
  border: '1px solid var(--glass-border)',
  color: 'var(--text-primary)',
  padding: '12px',
  borderRadius: 'var(--border-radius-sm)',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit'
};
