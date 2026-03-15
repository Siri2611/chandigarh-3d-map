import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Trash2, ArrowLeft, Star, Plus, ExternalLink } from 'lucide-react';
import type { BurgerReview, SidebarMode, Verdict } from '../App';

interface SidebarProps {
  mode: SidebarMode;
  onSetMode: (mode: SidebarMode) => void;
  reviews: BurgerReview[];
  selectedReviewId: string | null;
  onSelectReview: (id: string | null) => void;
  onDeleteReview: (id: string) => void;
  onSaveReview: (reviewData: Omit<BurgerReview, 'id' | 'longitude' | 'latitude'>) => void;
  draftLocation: { longitude: number; latitude: number } | null;
  isAdmin: boolean;
}

const getVerdictColor = (verdict: Verdict) => {
  switch (verdict) {
    case 'Eat Again': return '#22c55e';
    case 'Try Once': return '#eab308';
    case 'Avoid': return '#ef4444';
    default: return 'var(--accent-primary)';
  }
};

const StarRating = ({ value }: { value: number }) => {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercentage = Math.max(0, Math.min(100, (value - (star - 1)) * 100));

        return (
          <div key={star} style={{ position: 'relative', width: '16px', height: '16px' }}>
            {/* Background Empty Star */}
            <Star 
              size={16} 
              color="var(--text-muted)" 
              fill="transparent" 
              style={{ position: 'absolute', top: 0, left: 0 }} 
            />
            
            {/* Front Filled Star clipped by width */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${fillPercentage}%`,
              overflow: 'hidden',
              height: '16px'
            }}>
              <Star 
                size={16} 
                color="var(--accent-primary)" 
                fill="var(--accent-primary)" 
                style={{ position: 'absolute', top: 0, left: 0 }} 
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function Sidebar({ 
  mode, 
  /* onSetMode unused in this simplified version */
  reviews, 
  selectedReviewId, 
  onSelectReview, 
  onDeleteReview, 
  onSaveReview,
  draftLocation,
  isAdmin
}: SidebarProps) {
  
  // Form State
  const [restaurantName, setRestaurantName] = useState('');
  const [burgerName, setBurgerName] = useState('');
  const [taste, setTaste] = useState(3);
  const [texture, setTexture] = useState(3);
  const [size, setSize] = useState(3);
  const [overall, setOverall] = useState(3);
  const [verdict, setVerdict] = useState<Verdict>('Try Once');
  const [reviewText, setReviewText] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [locationLink, setLocationLink] = useState('');

  // Mobile collapsed state logic
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Automatically expand the sheet when a pin/map is clicked (mode changes from list)
  useEffect(() => {
    if (mode !== 'list') {
      setIsMobileExpanded(true);
    } else {
      setIsMobileExpanded(false); // Collapse immediately when returning to list mode
    }
  }, [mode]);

  const handleSave = () => {
    if (!restaurantName || !burgerName) return;
    onSaveReview({
      restaurantName,
      burgerName,
      taste,
      texture,
      size,
      overall,
      verdict,
      reviewText,
      ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
      ...(locationLink.trim() ? { locationLink: locationLink.trim() } : {})
    });
    
    // Reset form fields
    setRestaurantName('');
    setBurgerName('');
    setLogoUrl('');
    setLocationLink('');
    setTaste(3);
    setTexture(3);
    setSize(3);
    setOverall(3);
    setVerdict('Try Once');
    setReviewText('');
  };

  const selectedReview = reviews.find(r => r.id === selectedReviewId);

  return (
    <motion.div 
      className={`glass-panel glass-sidebar ${mode === 'list' && !isMobileExpanded ? 'collapsed-mobile' : ''}`}
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.2 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }} // Only allow pulling down gently before snap
      onDragEnd={(_, info) => {
        // If dragged down far enough or fast enough, collapse it
        if (info.offset.y > 50 || info.velocity.y > 500) {
          setIsMobileExpanded(false);
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
        onClick={(e) => {
          e.stopPropagation();
          setIsMobileExpanded(prev => !prev);
        }}
      >
        <div className="pull-tab-handle" />
      </div>

      {/* Dynamic Header */}
      {mode !== 'list' && (
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button
            whileHover={{ x: -2 }}
            onClick={() => onSelectReview(null)}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px'
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <span className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
            {mode === 'detail' ? 'Review Details' : 'Draft New Review'}
          </span>
        </div>
      )}

      <div className="sidebar-content-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <AnimatePresence mode="wait">
          
          {/* LIST VIEW */}
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
                    ? <><strong>Click the map</strong> to draft a new review, or explore saved reviews below.</>
                    : <>Explore the mapped burgers below. Click a pin to read the full review!</>
                  }
                </p>
              </div>

              {reviews.length === 0 ? (
                <div className="flex-center" style={{ flexDirection: 'column', opacity: 0.5, padding: '40px 0', textAlign: 'center' }}>
                  <Navigation size={40} style={{ marginBottom: '16px' }} />
                  <p className="text-sm">No burgers mapped yet.<br/>Time to start eating!</p>
                </div>
              ) : (
                reviews.map(review => (
                  <motion.div
                    key={review.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onSelectReview(review.id)}
                    style={{
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid var(--glass-border)`,
                      borderLeft: `4px solid ${getVerdictColor(review.verdict)}`,
                      borderRadius: 'var(--border-radius-md)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 className="text-sm font-semibold" style={{ margin: 0 }}>{review.restaurantName}</h3>
                        <p className="text-xs text-muted" style={{ margin: 0, marginTop: '2px' }}>{review.burgerName}</p>
                      </div>
                      <div className="text-xs font-medium" style={{ color: getVerdictColor(review.verdict) }}>
                        {review.verdict}
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StarRating value={review.overall} />
                      <span className="text-xs text-secondary">{review.overall}/5</span>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* DETAIL VIEW */}
          {mode === 'detail' && selectedReview && (
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {selectedReview.logoUrl && (
                      <img 
                        src={selectedReview.logoUrl} 
                        alt={`${selectedReview.restaurantName} logo`}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          border: '2px solid rgba(249, 115, 22, 0.2)'
                        }} 
                      />
                    )}
                    <div style={{ display: 'flex',flexDirection: 'column', gap: '8px' }}>
                      <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', lineHeight: 1.2 }}>
                        {selectedReview.restaurantName}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <StarRating value={selectedReview.overall} />
                        <span className="text-xs font-bold text-accent-primary">{selectedReview.overall}/5</span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: `${getVerdictColor(selectedReview.verdict)}20`,
                    color: getVerdictColor(selectedReview.verdict),
                    border: `1px solid ${getVerdictColor(selectedReview.verdict)}40`
                  }}>
                    {selectedReview.verdict}
                  </div>
                </div>
                <p className="text-sm text-accent-primary font-medium" style={{ margin: 0 }}>{selectedReview.burgerName}</p>
              </div>

              {/* Stats Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
                background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--border-radius-md)'
              }}>
                <div>
                  <label className="text-xs text-muted mb-1 block">Taste</label>
                  <StarRating value={selectedReview.taste} />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Texture</label>
                  <StarRating value={selectedReview.texture} />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Size</label>
                  <StarRating value={selectedReview.size} />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Overall</label>
                  <StarRating value={selectedReview.overall} />
                </div>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Review Notes</p>
                <div 
                  className="glass-panel text-sm" 
                  style={{ 
                    padding: '16px',
                    color: 'var(--text-primary)',
                    fontStyle: selectedReview.reviewText ? 'normal' : 'italic',
                    opacity: selectedReview.reviewText ? 1 : 0.7,
                    lineHeight: 1.6,
                    marginBottom: selectedReview.locationLink ? '16px' : '0'
                  }}
                >
                  {selectedReview.reviewText || "No review notes provided."}
                </div>
              </div>

              {selectedReview.locationLink && (
                <a 
                  href={selectedReview.locationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-panel"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px', 
                    width: '100%', 
                    padding: '12px',
                    textDecoration: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 'bold',
                    transition: 'background 0.2s',
                    marginTop: 'auto'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                >
                  <ExternalLink size={18} />
                  Open in Maps
                </a>
              )}

              {isAdmin && (
                <motion.button
                  whileHover={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                  onClick={() => onDeleteReview(selectedReview.id)}
                  style={{
                    marginTop: 'auto',
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: 'var(--border-radius-md)',
                    transition: 'background 0.2s',
                    width: '100%'
                  }}
                >
                  <Trash2 size={16} /> <span className="text-sm font-medium">Delete Review</span>
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ADD REVIEW VIEW */}
          {mode === 'add' && draftLocation && (
            <motion.div
              key="add-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <h2 className="text-lg font-semibold" style={{ margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                Draft New Review
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Restaurant Name" 
                  value={restaurantName}
                  onChange={e => setRestaurantName(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="What's the burger called?"
                  style={inputStyle}
                  value={burgerName}
                  onChange={(e) => setBurgerName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Restaurant Logo URL (Optional)"
                  style={inputStyle}
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Google Maps Link (Optional)"
                  style={inputStyle}
                  value={locationLink}
                  onChange={(e) => setLocationLink(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
                {/* Taste */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="flex-between">
                    <label className="text-xs text-muted">Taste</label>
                    <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{taste.toFixed(1)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StarRating value={taste} />
                    <input 
                      type="range" min="1" max="5" step="0.1" value={taste} 
                      onChange={e => setTaste(parseFloat(e.target.value))} 
                      style={{ flex: 1, accentColor: 'var(--accent-primary)', height: '4px' }} 
                    />
                  </div>
                </div>

                {/* Texture */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="flex-between">
                    <label className="text-xs text-muted">Texture</label>
                    <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{texture.toFixed(1)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StarRating value={texture} />
                    <input 
                      type="range" min="1" max="5" step="0.1" value={texture} 
                      onChange={e => setTexture(parseFloat(e.target.value))} 
                      style={{ flex: 1, accentColor: 'var(--accent-primary)', height: '4px' }} 
                    />
                  </div>
                </div>

                {/* Size */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="flex-between">
                    <label className="text-xs text-muted">Size</label>
                    <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{size.toFixed(1)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StarRating value={size} />
                    <input 
                      type="range" min="1" max="5" step="0.1" value={size} 
                      onChange={e => setSize(parseFloat(e.target.value))} 
                      style={{ flex: 1, accentColor: 'var(--accent-primary)', height: '4px' }} 
                    />
                  </div>
                </div>

                {/* Overall */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                  <div className="flex-between">
                    <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Overall</label>
                    <span className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>{overall.toFixed(1)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StarRating value={overall} />
                    <input 
                      type="range" min="1" max="5" step="0.1" value={overall} 
                      onChange={e => setOverall(parseFloat(e.target.value))} 
                      style={{ flex: 1, accentColor: 'var(--accent-primary)', height: '4px' }} 
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted mb-2 block">Verdict</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['Try Once', 'Eat Again', 'Avoid'] as Verdict[]).map(v => (
                    <button
                      key={v}
                      onClick={() => setVerdict(v)}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        background: verdict === v ? `${getVerdictColor(v)}20` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${verdict === v ? getVerdictColor(v) : 'var(--glass-border)'}`,
                        color: verdict === v ? 'white' : 'var(--text-secondary)',
                        borderRadius: 'var(--border-radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: verdict === v ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <textarea 
                placeholder="Review notes..."
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                style={{ ...inputStyle, minHeight: '100px', resize: 'none' }}
              />

              <button
                onClick={handleSave}
                disabled={!restaurantName || !burgerName}
                style={{
                  background: (!restaurantName || !burgerName) ? 'rgba(255,255,255,0.1)' : 'var(--accent-gradient)',
                  color: (!restaurantName || !burgerName) ? 'var(--text-muted)' : 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: 'var(--border-radius-md)',
                  fontWeight: 600,
                  cursor: (!restaurantName || !burgerName) ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={18} /> Publish Review
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
