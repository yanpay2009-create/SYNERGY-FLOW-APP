import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserTier } from '../types';

interface CountdownTimerProps {
  expiryDate: string;
  className?: string;
  onExpire?: () => void;
}

const getTierColors = (tier: UserTier | undefined) => {
  switch (tier) {
    case UserTier.EXECUTIVE:
      return { text: 'text-amber-600 dark:text-amber-400', bgLight: 'bg-amber-50 dark:bg-amber-900/30' };
    case UserTier.BUILDER:
      return { text: 'text-purple-700 dark:text-purple-400', bgLight: 'bg-purple-50 dark:bg-purple-900/30' };
    case UserTier.MARKETER: 
      return { text: 'text-pink-600 dark:text-pink-400', bgLight: 'bg-pink-50 dark:bg-pink-900/30' };
    default:
      return { text: 'text-synergy-blue dark:text-blue-400', bgLight: 'bg-blue-50 dark:bg-blue-900/30' };
  }
};

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiryDate, className = "", onExpire }) => {
  const { user } = useApp();
  const [timeLeft, setTimeLeft] = useState<{ d: string; h: string; m: string; s: string } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiryDate || isExpired) return;
    const target = new Date(expiryDate).getTime();
    if (isNaN(target)) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft(null);
        setIsExpired(true);
        if (onExpire) onExpire();
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        d: d.toString(),
        h: h.toString().padStart(2, '0'),
        m: m.toString().padStart(2, '0'),
        s: s.toString().padStart(2, '0')
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiryDate]);

  if (!timeLeft) return null;

  const colors = getTierColors(user?.tier);

  return (
    <div className={`flex items-center space-x-1.5 ${colors.bgLight} ${colors.text} px-2.5 py-1 rounded-full backdrop-blur-md border border-white/50 dark:border-gray-600 shadow-sm ${className}`}>
      <Clock size={12} />
      <div className="font-mono text-[11px] font-black tracking-tighter">
        {parseInt(timeLeft.d) > 0 
          ? `${timeLeft.d}d ${timeLeft.h}h` 
          : `${timeLeft.h}:${timeLeft.m}:${timeLeft.s}`
        }
      </div>
    </div>
  );
};
