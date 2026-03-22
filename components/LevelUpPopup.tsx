import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Sparkles, Crown, ArrowRight, Zap, Award, Star } from 'lucide-react';
import { UserTier } from '../types';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

export const LevelUpPopup: React.FC = () => {
  const { pendingLevelUp, dismissLevelUp, user, t, language } = useApp();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (pendingLevelUp) {
      setIsVisible(true);
      
      // Initial burst
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 500
      });
      
      // Continuous confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 500 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    } else {
      setIsVisible(false);
    }
  }, [pendingLevelUp]);

  if (!pendingLevelUp) return null;

  const { tier, commissionRate } = pendingLevelUp;

  const handleNavigateToBenefits = () => {
    navigate('/tier-benefits');
    dismissLevelUp();
  };

  const getTierTheme = () => {
    switch (tier) {
      case UserTier.EXECUTIVE:
        return {
          bg: 'from-amber-400 to-orange-600',
          text: 'text-amber-500',
          icon: Crown,
          accent: 'bg-amber-50 dark:bg-amber-900/30',
          border: 'border-amber-400/50',
          glow: 'shadow-[0_0_50px_rgba(245,158,11,0.5)]'
        };
      case UserTier.BUILDER:
        return {
          bg: 'from-purple-500 to-indigo-700',
          text: 'text-purple-500',
          icon: Award,
          accent: 'bg-purple-50 dark:bg-purple-900/30',
          border: 'border-purple-400/50',
          glow: 'shadow-[0_0_50px_rgba(168,85,247,0.5)]'
        };
      case UserTier.MARKETER:
        return {
          bg: 'from-pink-400 to-rose-600',
          text: 'text-pink-500',
          icon: Zap,
          accent: 'bg-pink-50 dark:bg-pink-900/30',
          border: 'border-pink-400/50',
          glow: 'shadow-[0_0_50px_rgba(236,72,153,0.5)]'
        };
      default:
        return {
          bg: 'from-synergy-blue to-blue-700',
          text: 'text-synergy-blue',
          icon: Star,
          accent: 'bg-blue-50 dark:bg-blue-900/30',
          border: 'border-synergy-blue/50',
          glow: 'shadow-[0_0_50px_rgba(0,181,255,0.5)]'
        };
    }
  };

  const theme = getTierTheme();

  return (
    <div className={`fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} lang={language}>
      
      {/* Container for the Card */}
      <div className={`relative w-full max-w-[290px] bg-white dark:bg-gray-900 rounded-[35px] overflow-hidden transition-all duration-500 transform ${isVisible ? 'scale-100' : 'scale-95'} border ${theme.border} ${theme.glow} shadow-2xl z-20`}>
        
        {/* Compact Header */}
        <div className={`pt-10 pb-3 text-center relative overflow-hidden`}>
            <div className="relative mb-5">
                <div className={`relative w-20 h-20 mx-auto rounded-full bg-gradient-to-tr ${theme.bg} flex items-center justify-center text-white shadow-xl animate-in zoom-in duration-700`}>
                    <theme.icon size={40} strokeWidth={2.5} />
                    <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-md text-emerald-500 border border-gray-100 dark:border-gray-700">
                        <Sparkles size={16} fill="currentColor" />
                    </div>
                </div>
            </div>

            <div className="px-5">
                <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme.text} mb-1`}>
                    Level Up!
                </h3>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
                    {tier} Affiliate
                </h2>
            </div>
        </div>

        {/* Compact Benefit Section */}
        <div className="px-5 pb-8">
            <div className={`p-4 rounded-2xl ${theme.accent} flex items-center justify-between border border-current/5 mb-6 shadow-inner`}>
                <div className="text-left">
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Commission Rate</p>
                    <div className="flex items-baseline space-x-1">
                        <span className={`text-3xl font-black ${theme.text} tracking-tighter`}>{commissionRate}%</span>
                        <span className="text-[9px] font-black text-emerald-500 uppercase">Active</span>
                    </div>
                </div>
                <button 
                  onClick={handleNavigateToBenefits}
                  className={`w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center ${theme.text} shadow-sm border ${theme.border} active:scale-90 transition-all hover:bg-gray-50 dark:hover:bg-gray-700`}
                >
                    <ArrowRight size={20} strokeWidth={3} />
                </button>
            </div>

            <button 
                onClick={dismissLevelUp}
                className={`w-full h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[20px] font-black uppercase tracking-[0.2em] text-[10px] shadow-lg active:scale-95 transition-all`}
            >
                {t('btn.confirm')}
            </button>
        </div>

        <button 
            onClick={dismissLevelUp}
            className="absolute top-5 right-5 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400 hover:text-red-500 transition-colors z-30"
        >
            <X size={14} />
        </button>
      </div>
    </div>
  );
};