
import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Sparkles, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FloatingToast: React.FC = () => {
  const { currentToast, dismissToast, systemSettings, user, notificationsEnabled } = useApp();
  const navigate = useNavigate();
  const audioRef = useRef<AudioContext | null>(null);

  // High-fidelity & Ultra Exciting Notification sound generator
  const playSound = (isPromo: boolean) => {
    try {
        if (!audioRef.current) {
            audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioRef.current;
        const now = ctx.currentTime;
        
        const playNote = (freq: number, start: number, duration: number, volume: number = 0.1, type: OscillatorType = 'sine') => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, start);
            
            // Advanced Envelope for "Crisp" sound
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(volume, start + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + duration);
        };

        if (isPromo) {
            // "Exciting Fanfare" - Bright triple sequence with a power finish
            const vol = 0.08;
            playNote(523.25, now, 0.3, vol, 'sine');           // C5
            playNote(659.25, now + 0.04, 0.3, vol, 'sine');    // E5
            playNote(783.99, now + 0.08, 0.3, vol, 'sine');    // G5
            playNote(1046.50, now + 0.12, 0.6, vol + 0.02, 'sine'); // C6 (Peak)
        } else {
            // "Exciting Money/Dropship Sale" - Rapid Shimmer (The "Jackpot" feel)
            const baseVol = 0.04;
            const shimmerNotes = [1318.51, 1567.98, 2093.00, 2637.02, 3135.96, 4186.01]; // E6 to C8
            shimmerNotes.forEach((freq, i) => {
                playNote(freq, now + (i * 0.025), 0.25, baseVol, 'sine');
            });
            playNote(523.25, now, 0.4, 0.05, 'sine'); 
        }
    } catch (e) {
        console.warn("Audio playback not supported or blocked", e);
    }
  };

  useEffect(() => {
    if (currentToast && notificationsEnabled) {
      playSound(currentToast.type === 'promo');
      const displayTime = currentToast.type === 'promo' ? 8000 : 6000;
      const timer = setTimeout(() => {
        dismissToast();
      }, displayTime);
      return () => clearTimeout(timer);
    } else if (currentToast && !notificationsEnabled) {
        // If notifications are disabled, dismiss immediately
        dismissToast();
    }
  }, [currentToast, dismissToast, notificationsEnabled]);

  if (!currentToast || !notificationsEnabled) return null;

  const isPromo = currentToast.type === 'promo';

  // Handler to navigate to Notifications page
  const handleToastClick = () => {
      navigate('/notifications', { state: { openNotifId: currentToast.relatedId } });
      dismissToast();
  };

  const isMe = user && (currentToast.earnerName === user.name || currentToast.earnerName === user.username);
  const displayName = isMe ? (user.name || user.username) : currentToast.earnerName;
  
  let earnerDisplayName = '';
  if (isPromo) {
    earnerDisplayName = currentToast.title || 'Special Offer';
  } else if (currentToast.type === 'success' || currentToast.type === 'error' || currentToast.type === 'info' || currentToast.type === 'warning') {
    earnerDisplayName = currentToast.title || (currentToast.type.charAt(0).toUpperCase() + currentToast.type.slice(1));
  } else {
    earnerDisplayName = `Congratulations ${displayName || 'User'} 🎉`;
  }

  const toastMessage = currentToast.message || currentToast.description || (isPromo ? 'Tap to view exclusive offer!' : '');

  return (
    <div className="fixed top-6 left-0 right-0 z-[250] px-4 pointer-events-none animate-in slide-in-from-top-full duration-700 ease-out">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div 
            onClick={handleToastClick}
            className={`bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border p-3 rounded-[24px] shadow-[0_20px_50px_-15px_rgba(0,181,255,0.2)] flex items-center group transition-all cursor-pointer active:scale-95 ${isPromo ? 'border-amber-400/40' : 'border-white/40'}`}
        >
          
          {/* Media Container */}
          <div className="shrink-0 mr-3.5">
             <div className={`w-12 h-12 flex items-center justify-center overflow-hidden rounded-lg ${isPromo ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200' : ''}`}>
                {isPromo && currentToast.image ? (
                    <img src={currentToast.image} className="w-full h-full object-cover" alt="Promo" />
                ) : systemSettings.logo ? (
                    <img src={systemSettings.logo} className="w-10 h-10 object-contain rounded-md" alt="App Logo" />
                ) : (
                    <span className="text-3xl font-black italic bg-gradient-to-tr from-synergy-blue to-blue-600 bg-clip-text text-transparent tracking-tighter">S</span>
                )}
             </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 min-w-0 pr-2">
             <div className="space-y-0.5">
                <p className={`text-[13px] font-black leading-tight truncate ${isPromo ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                   <span className={isMe ? "text-synergy-blue" : ""}>{earnerDisplayName}</span>
                </p>
                <div className="flex items-center flex-wrap gap-x-1.5">
                    {currentToast.type === 'commission' ? (
                        <>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold leading-none">
                               From <span className="text-gray-900 dark:text-gray-100">@{currentToast.user}</span>
                            </p>
                            <p className="text-[12px] font-black text-emerald-500 dark:text-emerald-400 leading-none">
                               +฿{(currentToast.amount ?? 0).toLocaleString()}
                            </p>
                        </>
                    ) : (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold leading-none truncate max-w-[180px]">
                           {toastMessage}
                        </p>
                    )}
                </div>
             </div>
          </div>
          <div className="shrink-0 flex items-center space-x-2">
             {isPromo && (
                 <div className="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center animate-pulse shadow-sm">
                     <Megaphone size={14} fill="currentColor" />
                 </div>
             )}
             <button 
                onClick={(e) => { e.stopPropagation(); dismissToast(); }} 
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition active:scale-90 bg-white/40 dark:bg-gray-800/40 rounded-full border border-white/20"
             >
                <X size={16} strokeWidth={3} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
