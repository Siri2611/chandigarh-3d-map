import { useState, useCallback, useEffect } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer } from './components/MapContainer';
import { Sidebar } from './components/Sidebar';
import { supabase } from './supabaseClient';
import './App.css';

export type Verdict = 'Try Once' | 'Eat Again' | 'Avoid';

export interface BurgerReview {
  id: string;
  restaurantName: string;
  burgerName: string;
  latitude: number;
  longitude: number;
  taste: number; // 1-5 rating
  texture: number;
  size: number;
  overall: number; // 1-5
  verdict: Verdict;
  reviewText: string;
  logoUrl?: string;
  locationLink?: string;
  created_at?: string;
}

export type SidebarMode = 'list' | 'add' | 'detail';

function App() {
  const [reviews, setReviews] = useState<BurgerReview[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  
  // State for adding a new review
  const [draftLocation, setDraftLocation] = useState<{longitude: number; latitude: number} | null>(null);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('list');
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Fetch reviews on mount
  useEffect(() => {
    const fetchReviews = async () => {
      if (!supabase) return;
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
      } else if (data) {
        setReviews(data as BurgerReview[]);
      }
    };

    fetchReviews();
  }, []);

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setShowPasswordPrompt(true);
      setPasswordError(false);
      setPasswordInput('');
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === 'burgerboss') {
      setIsAdmin(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
    } else {
      setPasswordError(true);
    }
  };

  const handleMapClick = useCallback((longitude: number, latitude: number) => {
    if (!isAdmin) return; // Prevent public from adding pins
    setDraftLocation({ longitude, latitude });
    setSelectedReviewId(null);
    setSidebarMode('add');
  }, [isAdmin]);

  const handleSelectReview = useCallback((id: string | null) => {
    setSelectedReviewId(id);
    setDraftLocation(null);
    setSidebarMode(id ? 'detail' : 'list');
  }, []);

  const handleSaveReview = useCallback(async (reviewData: Omit<BurgerReview, 'id' | 'longitude' | 'latitude'>) => {
    if (!draftLocation || !supabase) return;
    
    const newReview = {
      ...reviewData,
      longitude: draftLocation.longitude,
      latitude: draftLocation.latitude,
    };
    
    const { data, error } = await supabase
      .from('reviews')
      .insert([newReview])
      .select()
      .single();

    if (error) {
      console.error('Error saving review:', error);
      alert(`Failed to save review to database: ${error.message}`);
      return;
    }

    if (data) {
      setReviews(prev => [data as BurgerReview, ...prev]);
      setDraftLocation(null);
      setSelectedReviewId(data.id);
      setSidebarMode('detail');
    }
  }, [draftLocation]);

  const handleDeleteReview = useCallback(async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review.');
      return;
    }

    setReviews(prev => prev.filter(r => r.id !== id));
    if (selectedReviewId === id) {
      setSelectedReviewId(null);
      setSidebarMode('list');
    }
  }, [selectedReviewId]);

  if (!supabase) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', padding: '24px', textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '12px' }}>Supabase Configuration Missing 🛑</h2>
        <p style={{ maxWidth: '400px', lineHeight: 1.6, opacity: 0.8 }}>
          Your site works locally but crashes on Vercel because Vercel doesn't know your keys.
          <br /><br />
          Please go to your **Vercel Project Settings ➔ Environment Variables** and add:
        </p>
        <code style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '4px', margin: '16px 0', fontSize: '0.9rem' }}>
          VITE_SUPABASE_URL <br />
          VITE_SUPABASE_ANON_KEY
        </code>
        <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Then trigger a new redeploy on Vercel.</p>
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
        reviews={reviews} 
        onMapClick={handleMapClick}
        selectedReviewId={selectedReviewId}
        onSelectReview={handleSelectReview}
        draftLocation={draftLocation}
        isAdmin={isAdmin}
      />
      <Sidebar 
        mode={sidebarMode}
        onSetMode={setSidebarMode}
        reviews={reviews}
        selectedReviewId={selectedReviewId}
        onSelectReview={handleSelectReview}
        onDeleteReview={handleDeleteReview}
        onSaveReview={handleSaveReview}
        draftLocation={draftLocation}
        isAdmin={isAdmin}
      />
    </div>
  );
}

export default App;
