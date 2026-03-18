import { useState, useCallback, useEffect } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer } from './components/MapContainer';
import { Sidebar } from './components/Sidebar';
import { supabase } from './supabaseClient';
import './App.css';

// ─── 10 Rating Parameters ───
export const RATING_PARAMS = [
  'taste', 'patty_quality', 'juiciness', 'bun_quality',
  'cheese_sauce', 'structural_integrity', 'size_price_ratio',
  'hygiene', 'aesthetic_presentation', 'service_speed'
] as const;

export type RatingParam = typeof RATING_PARAMS[number];

export const PARAM_LABELS: Record<RatingParam, string> = {
  taste: 'Taste / Flavor Balance',
  patty_quality: 'Patty Quality',
  juiciness: 'Juiciness',
  bun_quality: 'Bun Quality',
  cheese_sauce: 'Cheese & Sauce',
  structural_integrity: 'Structural Integrity',
  size_price_ratio: 'Size to Price Ratio',
  hygiene: 'Hygiene',
  aesthetic_presentation: 'Aesthetic & Presentation',
  service_speed: 'Service Speed',
};

// ─── Data Types ───
export interface ReviewerRating {
  id: string;
  restaurant_id: string;
  reviewer_name: string;
  taste: number;
  patty_quality: number;
  juiciness: number;
  bun_quality: number;
  cheese_sauce: number;
  structural_integrity: number;
  size_price_ratio: number;
  hygiene: number;
  aesthetic_presentation: number;
  service_speed: number;
  created_at?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  location_url?: string;
  burger_name?: string;
  overall_rating: number;
  created_at?: string;
  // Client-side computed
  ratings: ReviewerRating[];
  param_averages: Record<RatingParam, number>;
}

export interface MenuItem {
  name: string;
  isVeg: boolean;
}

export const parseBurgers = (burgerNameStr: string | null | undefined): MenuItem[] => {
  if (!burgerNameStr) return [];
  try {
    const parsed = JSON.parse(burgerNameStr);
    if (Array.isArray(parsed)) return parsed as MenuItem[];
    return [];
  } catch (e) {
    return [{ name: burgerNameStr, isVeg: false }];
  }
};

export const DietIcon = ({ isVeg, size = 16 }: { isVeg: boolean; size?: number }) => {
  const color = isVeg ? '#008539' : '#D8232A'; // FSSAI Green and Red
  const padding = size * 0.15;
  const innerSize = size - padding * 2;
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      border: `2px solid ${color}`,
      backgroundColor: 'white', // Ensure visibility on dark background
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '2px',
      flexShrink: 0
    }}>
      {isVeg ? (
        <div style={{
          width: `${innerSize}px`,
          height: `${innerSize}px`,
          backgroundColor: color,
          borderRadius: '50%'
        }} />
      ) : (
        <div style={{
          width: 0,
          height: 0,
          borderLeft: `${innerSize / 2}px solid transparent`,
          borderRight: `${innerSize / 2}px solid transparent`,
          borderBottom: `${innerSize * 0.866}px solid ${color}`, // equilateral triangle height approximation
          transform: 'translateY(-1px)' // visual center
        }} />
      )}
    </div>
  );
};

export type SidebarMode = 'list' | 'add' | 'detail' | 'add-reviewer';

// ─── Utility: compute averages from ratings array ───
function computeAverages(ratings: ReviewerRating[]): { param_averages: Record<RatingParam, number>; overall_rating: number } {
  const param_averages: Record<string, number> = {};
  if (ratings.length === 0) {
    for (const p of RATING_PARAMS) param_averages[p] = 0;
    return { param_averages: param_averages as Record<RatingParam, number>, overall_rating: 0 };
  }
  let totalSum = 0;
  for (const p of RATING_PARAMS) {
    const sum = ratings.reduce((acc, r) => acc + (r[p] || 0), 0);
    const avg = sum / ratings.length;
    param_averages[p] = Math.round(avg * 10) / 10; // round to 1 decimal
    totalSum += param_averages[p];
  }
  const overall = Math.round((totalSum / 10) * 10) / 10;
  return { param_averages: param_averages as Record<RatingParam, number>, overall_rating: overall };
}

function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  
  const [draftLocation, setDraftLocation] = useState<{longitude: number; latitude: number} | null>(null);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('list');
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // ─── Fetch restaurants + ratings on mount ───
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;
      
      const { data: restData, error: restErr } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (restErr) {
        console.error('Error fetching restaurants:', restErr);
        return;
      }

      const { data: ratingsData, error: ratErr } = await supabase
        .from('reviewer_ratings')
        .select('*');

      if (ratErr) {
        console.error('Error fetching ratings:', ratErr);
        return;
      }

      const enriched: Restaurant[] = (restData || []).map((r: any) => {
        const ratings = (ratingsData || []).filter((rt: any) => rt.restaurant_id === r.id);
        const { param_averages, overall_rating } = computeAverages(ratings);
        return { ...r, ratings, param_averages, overall_rating };
      });

      setRestaurants(enriched);
    };

    fetchData();
  }, []);

  // ─── Admin Toggle ───
  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setShowPasswordPrompt(true);
      setPasswordError(false);
      setPasswordInput('');
    }
  };

  const handlePasswordSubmit = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase.rpc('verify_admin', { guess: passwordInput });

      if (error) {
        console.error('Error verifying admin:', error);
        setPasswordError(true);
        return;
      }

      if (data === true) {
        setIsAdmin(true);
        setShowPasswordPrompt(false);
        setPasswordInput('');
      } else {
        setPasswordError(true);
      }
    } catch (err) {
      console.error('Verify admin exception:', err);
      setPasswordError(true);
    }
  };

  // ─── Map Click (Admin) ───
  const handleMapClick = useCallback((longitude: number, latitude: number) => {
    if (!isAdmin) return;
    setDraftLocation({ longitude, latitude });
    setSelectedRestaurantId(null);
    setSidebarMode('add');
  }, [isAdmin]);

  // ─── Select Restaurant ───
  const handleSelectRestaurant = useCallback((id: string | null) => {
    setSelectedRestaurantId(id);
    setDraftLocation(null);
    setSidebarMode(id ? 'detail' : 'list');
  }, []);

  // ─── Create Restaurant ───
  const handleCreateRestaurant = useCallback(async (data: { name: string; burgers?: MenuItem[]; image_url?: string; location_url?: string }) => {
    if (!draftLocation || !supabase) return;
    
    const newRestaurant = {
      name: data.name,
      burger_name: data.burgers && data.burgers.length > 0 ? JSON.stringify(data.burgers) : null,
      latitude: draftLocation.latitude,
      longitude: draftLocation.longitude,
      image_url: data.image_url || null,
      location_url: data.location_url || null,
      overall_rating: 0,
    };
    
    const { data: inserted, error } = await supabase
      .from('restaurants')
      .insert([newRestaurant])
      .select()
      .single();

    if (error) {
      console.error('Error creating restaurant:', error);
      alert(`Failed to create restaurant: ${error.message}`);
      return;
    }

    if (inserted) {
      const restaurant: Restaurant = {
        ...inserted,
        ratings: [],
        param_averages: Object.fromEntries(RATING_PARAMS.map(p => [p, 0])) as Record<RatingParam, number>,
      };
      setRestaurants(prev => [restaurant, ...prev]);
      setDraftLocation(null);
      setSelectedRestaurantId(inserted.id);
      setSidebarMode('detail');
    }
  }, [draftLocation]);

  // ─── Add Reviewer Rating ───
  const handleAddReviewerRating = useCallback(async (restaurantId: string, ratingData: Omit<ReviewerRating, 'id' | 'restaurant_id' | 'created_at'>) => {
    if (!supabase) return;
    
    const payload = { restaurant_id: restaurantId, ...ratingData };
    
    const { data: inserted, error } = await supabase
      .from('reviewer_ratings')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error adding reviewer rating:', error);
      alert(`Failed to save reviewer rating: ${error.message}`);
      return;
    }

    if (inserted) {
      setRestaurants(prev => prev.map(r => {
        if (r.id !== restaurantId) return r;
        const newRatings = [...r.ratings, inserted as ReviewerRating];
        const { param_averages, overall_rating } = computeAverages(newRatings);
        
        // Update overall_rating in Supabase (fire and forget)
        if (supabase) {
          supabase.from('restaurants').update({ overall_rating }).eq('id', restaurantId).then(() => {});
        }
        
        return { ...r, ratings: newRatings, param_averages, overall_rating };
      }));
      setSidebarMode('detail');
    }
  }, []);

  // ─── Delete Reviewer Rating ───
  const handleDeleteReviewerRating = useCallback(async (ratingId: string, restaurantId: string) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('reviewer_ratings')
      .delete()
      .eq('id', ratingId);

    if (error) {
      console.error('Error deleting rating:', error);
      alert('Failed to delete reviewer rating.');
      return;
    }

    setRestaurants(prev => prev.map(r => {
      if (r.id !== restaurantId) return r;
      const newRatings = r.ratings.filter(rt => rt.id !== ratingId);
      const { param_averages, overall_rating } = computeAverages(newRatings);
      
      if (supabase) {
        supabase.from('restaurants').update({ overall_rating }).eq('id', restaurantId).then(() => {});
      }
      
      return { ...r, ratings: newRatings, param_averages, overall_rating };
    }));
  }, []);

  // ─── Update Reviewer Rating ───
  const handleUpdateReviewerRating = useCallback(async (ratingId: string, restaurantId: string, ratingData: Omit<ReviewerRating, 'id' | 'restaurant_id' | 'created_at'>) => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('reviewer_ratings')
      .update(ratingData)
      .eq('id', ratingId)
      .select();

    if (error) {
      console.error('Error updating reviewer rating:', error);
      alert(`Failed to update reviewer rating: ${error.message}`);
      return;
    }

    const updated = data?.[0];
    if (!updated) {
      console.warn('Reviewer rating not found or not updated for ID:', ratingId);
      alert('Reviewer rating could not be updated in the database.');
      return;
    }

    if (updated) {
      setRestaurants(prev => prev.map(r => {
        if (r.id !== restaurantId) return r;
        const newRatings = r.ratings.map(rt => rt.id === ratingId ? (updated as ReviewerRating) : rt);
        const { param_averages, overall_rating } = computeAverages(newRatings);
        
        if (supabase) {
          supabase.from('restaurants').update({ overall_rating }).eq('id', restaurantId).then(() => {});
        }
        
        return { ...r, ratings: newRatings, param_averages, overall_rating };
      }));
    }
  }, []);

  // ─── Delete Restaurant ───
  const handleDeleteRestaurant = useCallback(async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting restaurant:', error);
      alert('Failed to delete restaurant.');
      return;
    }

    setRestaurants(prev => prev.filter(r => r.id !== id));
    if (selectedRestaurantId === id) {
      setSelectedRestaurantId(null);
      setSidebarMode('list');
    }
  }, [selectedRestaurantId]);

  if (!supabase) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', padding: '24px', textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '12px' }}>Supabase Configuration Missing 🛑</h2>
        <p style={{ maxWidth: '400px', lineHeight: 1.6, opacity: 0.8 }}>
          Please add your Supabase credentials to your .env file or Vercel Environment Variables:
        </p>
        <code style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '4px', margin: '16px 0', fontSize: '0.9rem' }}>
          VITE_SUPABASE_URL <br />
          VITE_SUPABASE_ANON_KEY
        </code>
        <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Then trigger a new deployment.</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <div className="top-navbar">
        <div className="navbar-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="Burger.Theory Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', display: 'block' }} />
            <div>
              <h1 style={{ color: 'white', fontSize: '1.75rem', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>Burger.Theory</h1>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', margin: '2px 0 0 0', textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>Chandigarh Burger Map</p>
            </div>
          </div>

          <button
            onClick={handleAdminToggle}
            style={{
              background: isAdmin ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
              color: isAdmin ? 'var(--accent-primary)' : 'white',
              cursor: 'pointer',
              padding: '10px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            title={isAdmin ? "Lock Admin Mode" : "Unlock Admin Mode"}
          >
            {isAdmin ? <Unlock size={18} /> : <Lock size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showPasswordPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-panel"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                alignItems: 'center',
                width: '100%',
                maxWidth: '360px'
              }}
            >
              <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '8px' }}>
                <Lock size={32} color="var(--accent-primary)" />
              </div>
              <h2 className="text-xl font-semibold text-center" style={{ margin: 0, color: 'var(--text-primary)' }}>Admin Access</h2>
              <p className="text-sm text-secondary text-center" style={{ margin: 0, marginBottom: '8px' }}>
                Enter the secret password to unlock mapping capabilities.
              </p>
              
              <input 
                type="password" 
                placeholder="Password" 
                value={passwordInput}
                onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
                onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                style={{
                  background: 'rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${passwordError ? '#ef4444' : 'var(--glass-border)'}`,
                  color: 'var(--text-primary)',
                  padding: '12px',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  width: '100%',
                  fontFamily: 'inherit'
                }}
                autoFocus
              />
              {passwordError && <span className="text-xs" style={{ color: '#ef4444', alignSelf: 'flex-start' }}>Incorrect password.</span>}
              
              <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
                <button
                  onClick={() => setShowPasswordPrompt(false)}
                  style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  style={{ flex: 1, padding: '12px', background: 'var(--accent-gradient)', border: 'none', color: 'white', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Unlock
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MapContainer 
        restaurants={restaurants} 
        onMapClick={handleMapClick}
        selectedRestaurantId={selectedRestaurantId}
        onSelectRestaurant={handleSelectRestaurant}
        draftLocation={draftLocation}
        isAdmin={isAdmin}
      />
      <Sidebar 
        mode={sidebarMode}
        onSetMode={setSidebarMode}
        restaurants={restaurants}
        selectedRestaurantId={selectedRestaurantId}
        onSelectRestaurant={handleSelectRestaurant}
        onDeleteRestaurant={handleDeleteRestaurant}
        onCreateRestaurant={handleCreateRestaurant}
        onAddReviewerRating={handleAddReviewerRating}
        onUpdateReviewerRating={handleUpdateReviewerRating}
        onDeleteReviewerRating={handleDeleteReviewerRating}
        draftLocation={draftLocation}
        isAdmin={isAdmin}
      />
    </div>
  );
}

export default App;
