import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp, TIER_THRESHOLDS } from '../context/AppContext';
import { UserTier } from '../types';
import { CountdownTimer } from '../components/CountdownTimer';
import { 
  Settings, 
  ChevronRight, 
  Users, 
  Link as LinkIcon, 
  BarChart2, 
  UserCog, 
  HelpCircle, 
  Package, 
  ShieldCheck, 
  Info, 
  Wallet, 
  Zap, 
  BarChart3,
  Eye,
  EyeOff,
  Crown,
  Layout,
  ImageIcon,
  Database,
  Monitor,
  Check,
  Megaphone,
  Lock,
  Edit3,
  Sparkles,
  CheckCircle2,
  X,
  UserCheck,
  Share2,
  RefreshCw,
  Smartphone,
  Loader2,
  UserPlus,
  Search,
  QrCode,
  Scan,
  Clock,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Auth } from './Auth';
import { QRScanner } from '../components/QRScanner';

import { ReferralModal } from '../components/ReferralModal';

const MenuRow = ({ icon: Icon, label, value, to, colorClass, requiresPin, navigate, triggerPinGate }: any) => (
  <button 
    onClick={() => { 
      if (requiresPin) {
          triggerPinGate(to);
      } else if (to) {
          navigate(to); 
      }
    }}
    className={`w-full flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-sm mb-3 active:scale-[0.99] transition border border-white/60 dark:border-gray-700`}
  >
    <div className="flex items-center space-x-4">
      <div className={`w-10 h-10 rounded-xl ${colorClass || 'bg-blue-50 dark:bg-gray-700 text-synergy-blue'} flex items-center justify-center`}>
        <Icon size={20} />
      </div>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
    </div>
    <div className="flex items-center space-x-2">
      {value && <span className="text-xs text-gray-400 font-medium">{value}</span>}
      <ChevronRight size={16} className="text-gray-300 dark:text-gray-500" />
    </div>
  </button>
);

export const Account: React.FC = () => {
  const { user, isLoggedIn, getCommissionRate, team, kycStatus, commissions, orders, t, updateUserSecurity, isSecurityUnlocked, setIsSecurityUnlocked, logout, referrer, addReferrer, ads, products, showToast } = useApp();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(Date.now());

  const handleExpire = useCallback(() => {
    setCurrentTime(Date.now());
  }, []);

  // Update current time every minute to refresh promotion filtering
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = user?.role === 'admin' || 
                  user?.email?.toLowerCase() === 'synergyflow.my@gmail.com' || 
                  user?.email?.toLowerCase() === 'yanpay2009@gmail.com' ||
                  user?.uid === 'ugTOls4K6EgKG13hBiAXHaYC2bj2' ||
                  user?.uid === 'mqZUUW73sCYe1bJTowBqF1HI2O02';
  const activeAd = useMemo(() => {
    return ads.find(a => {
      if (!a.active || a.placement !== 'account') return false;
      if (a.expiryDate) {
        return new Date(a.expiryDate).getTime() > currentTime;
      }
      return true;
    });
  }, [ads, currentTime]);
  const hasPromoProducts = useMemo(() => {
    return products.some(p => {
      if (!p.isPromo) return false;
      if (p.expiryDate) {
        return new Date(p.expiryDate).getTime() > currentTime;
      }
      return true;
    });
  }, [products, currentTime]);

  const [showEarnings, setShowEarnings] = useState<boolean>(() => {
    const saved = localStorage.getItem('synergy_privacy_mode');
    return saved === null ? true : saved === 'true';
  });

  const [animatedEarnings, setAnimatedEarnings] = useState(0);

  // PIN Gate States
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinFlow, setPinFlow] = useState<'verify' | 'setup' | 'confirm' | 'recovery'>('verify');
  const [tempPin, setTempPin] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [targetRoute, setTargetRoute] = useState<string>('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Referrer Modal State for Account Page
  const [showReferrerModal, setShowReferrerModal] = useState(false);
  
  // Auto-show referrer modal for new users without an upline
  useEffect(() => {
    if (isLoggedIn && user && !user.referrerCode && user.role !== 'admin') {
      setShowReferrerModal(true);
    }
  }, [isLoggedIn, user?.referrerCode, user?.role]);

  const todayString = useMemo(() => new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), []);
  
  const preciseDailyEarnings = useMemo(() => {
    if (!isLoggedIn || !user || !commissions) return 0;
    const todayTxs = commissions.filter(c => c.date && c.date.includes(todayString));
    const dailyEarnings = todayTxs
      .filter(c => c.amount > 0 && (c.type === 'Direct' || c.type === 'Team'))
      .reduce((acc, curr) => acc + curr.amount, 0);
    return Math.round((dailyEarnings + Number.EPSILON) * 100) / 100;
  }, [isLoggedIn, user, commissions, todayString]);

  useEffect(() => {
    const duration = 1200;
    const frameRate = 60;
    const totalFrames = Math.round(duration / (1000 / frameRate));
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setAnimatedEarnings(preciseDailyEarnings * easeOut);
      if (frame === totalFrames) clearInterval(timer);
    }, 1000 / frameRate);
    return () => clearInterval(timer);
  }, [preciseDailyEarnings]);

  // Reset security state whenever account page mounts to ensure "Every Time" requirement
  useEffect(() => {
    setIsSecurityUnlocked(false);
    localStorage.setItem('synergy_privacy_mode', showEarnings.toString());
  }, [showEarnings, setIsSecurityUnlocked]);

  const getTierColors = (tier: UserTier) => {
    switch (tier) {
      case UserTier.EXECUTIVE:
        return { 
          gradient: 'from-amber-500 via-amber-400 to-orange-500', 
          border: 'border-amber-600/30', 
          cardGradient: 'from-amber-400 via-orange-50 to-white dark:via-orange-900/20 dark:to-gray-800',
          text: 'text-amber-600 dark:text-amber-400', 
          bgLight: 'bg-amber-50 dark:bg-amber-900/30', 
          progress: 'bg-gradient-to-r from-amber-400 to-orange-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]', 
          decoration: 'from-amber-400/20', 
          icon: Crown,
          label: t('account.executive')
        };
      case UserTier.BUILDER:
        return { 
          gradient: 'from-purple-800 via-purple-600 to-indigo-700', 
          border: 'border-purple-800/30', 
          cardGradient: 'from-purple-700 via-indigo-50 to-white dark:via-indigo-900/20 dark:to-gray-800',
          text: 'text-purple-700 dark:text-purple-400', 
          bgLight: 'bg-purple-50 dark:bg-purple-900/30', 
          progress: 'bg-gradient-to-r from-purple-700 to-indigo-900 shadow-[0_0_15px_rgba(126,34,206,0.4)]', 
          decoration: 'from-purple-700/20', 
          icon: Zap,
          label: t('account.builder')
        };
      case UserTier.MARKETER: 
        return { 
          gradient: 'from-pink-600 via-pink-500 to-rose-500', 
          border: 'border-pink-700/30', 
          cardGradient: 'from-pink-500 via-pink-50 to-white dark:via-pink-900/20 dark:to-gray-800',
          text: 'text-pink-600 dark:text-pink-400', 
          bgLight: 'bg-pink-50 dark:bg-pink-900/30', 
          progress: 'bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]', 
          decoration: 'from-pink-400/20', 
          icon: BarChart3,
          label: t('account.marketer')
        };
      default:
        return { 
          gradient: 'from-synergy-dark via-synergy-blue to-blue-400', 
          border: 'border-synergy-dark/30', 
          cardGradient: 'from-synergy-blue via-blue-50 to-white dark:via-blue-900/20 dark:to-gray-800',
          text: 'text-synergy-blue dark:text-blue-400', 
          bgLight: 'bg-blue-50 dark:bg-blue-900/30', 
          progress: 'bg-synergy-blue shadow-[0_0_15px_rgba(0,181,255,0.4)]', 
          decoration: 'from-synergy-blue/20', 
          icon: UserCog,
          label: t('account.starter')
        };
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center pt-16 pb-16 px-6 relative overflow-hidden">
        {/* Subtle background elements to give it depth without a solid color */}
        <div className="absolute inset-0 bg-gray-100/30 dark:bg-gray-900/30 backdrop-blur-[2px]"></div>
        <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-500">
          <Auth />
        </div>
      </div>
    );
  }

  const colors = getTierColors(user.tier);

  let globalProgress = 0; 
  if (user.accumulatedSales >= TIER_THRESHOLDS[UserTier.EXECUTIVE]) {
      globalProgress = 100;
  } else if (user.accumulatedSales >= TIER_THRESHOLDS[UserTier.BUILDER]) {
      globalProgress = 50 + ((user.accumulatedSales - TIER_THRESHOLDS[UserTier.BUILDER]) / (TIER_THRESHOLDS[UserTier.EXECUTIVE] - TIER_THRESHOLDS[UserTier.BUILDER])) * 50;
  } else if (user.accumulatedSales >= TIER_THRESHOLDS[UserTier.MARKETER]) {
      globalProgress = 25 + ((user.accumulatedSales - TIER_THRESHOLDS[UserTier.MARKETER]) / (TIER_THRESHOLDS[UserTier.BUILDER] - TIER_THRESHOLDS[UserTier.MARKETER])) * 25;
  } else {
      globalProgress = (user.accumulatedSales / TIER_THRESHOLDS[UserTier.MARKETER]) * 25;
  }

  const currentRate = (getCommissionRate() * 100).toFixed(0);

  const triggerPinGate = (route: string) => {
    setTargetRoute(route);
    if (!user.pin || user.pin.trim() === "") {
        setPinFlow('setup');
    } else {
        setPinFlow('verify');
    }
    setIsVerifyingPin(true);
    setPin('');
    setPinError(false);
  };

  const handlePinInput = (value: string) => {
    if (value.length > 6) return;
    setPin(value);
    setPinError(false);

    if (value.length === 6) {
      if (pinFlow === 'verify') {
        if (value === user.pin) {
          setIsSecurityUnlocked(true);
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setIsVerifyingPin(false);
            navigate(targetRoute);
          }, 800);
        } else {
          setPinError(true);
          setTimeout(() => setPin(''), 500);
        }
      } else if (pinFlow === 'setup') {
        setTempPin(value);
        setTimeout(() => {
          setPin('');
          setPinFlow('confirm');
        }, 300);
      } else if (pinFlow === 'confirm') {
        if (value === tempPin) {
          updateUserSecurity('pin', value);
          setIsSecurityUnlocked(true);
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setIsVerifyingPin(false);
            navigate(targetRoute);
          }, 1000);
        } else {
          setPinError(true);
          setTimeout(() => {
            setPin('');
            setTempPin('');
            setPinFlow('setup');
          }, 500);
        }
      }
    }
  };

  const handleForgotPin = () => {
    setPinFlow('recovery');
    setRecoveryOtp('');
  };

  const handleVerifyRecoveryOtp = (value: string) => {
    const val = value.replace(/[^0-9]/g, '').slice(0, 6);
    setRecoveryOtp(val);
    if (val.length === 6) {
        setIsVerifyingOtp(true);
        setTimeout(() => {
            setIsVerifyingOtp(false);
            setPinFlow('setup');
        }, 1500);
    }
  };

  const getPinTitle = () => {
    if (showSuccess) return "Success!";
    switch (pinFlow) {
      case 'verify': return 'Enter Security PIN';
      case 'setup': return 'Set New PIN';
      case 'confirm': return 'Confirm New PIN';
      case 'recovery': return 'PIN Recovery';
    }
  };

  const handleShareProfile = async () => {
    if (!user?.referrerCode) {
      setShowReferrerModal(true);
      return;
    }

    const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
    const shareData = {
      title: 'Join Synergy Flow',
      text: `Start earning with Synergy Flow! My Referral Code: ${user.referralCode}`,
      url: `${baseUrl}/#/ref/${user.referralCode}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      showToast({ message: 'Referral link copied to clipboard!', type: 'success' });
    }
  };

  return (
    <div className="pb-0 pt-0 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 relative overflow-x-hidden">
      
      {/* TOP BACKGROUND HEADER */}
      <div className={`absolute top-0 left-0 right-0 h-48 bg-gradient-to-br ${colors.gradient} border-b-4 ${colors.border} z-0 shadow-lg`}>
          <div className="absolute top-[-20px] left-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10px] right-[-10px] w-32 h-32 bg-black/5 rounded-full blur-2xl"></div>
          <div className="absolute top-8 right-6 z-20">
              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1.5 flex items-center shadow-lg animate-in fade-in slide-in-from-right-4 duration-700">
                  <span className="text-[10px] font-black text-white tracking-widest uppercase italic">
                      {user.tier} {t('account.affiliate')}
                  </span>
              </div>
          </div>
      </div>

      {/* PIN Security Gate Overlay */}
      {isVerifyingPin && (
          <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-6 transition-all duration-300 animate-in fade-in">
              <button onClick={() => setIsVerifyingPin(false)} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400"><X size={20} /></button>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl mb-8 transition-all duration-500 ${showSuccess ? 'bg-emerald-50 text-white scale-110' : 'bg-gray-50 dark:bg-gray-800 text-synergy-blue border border-gray-100 dark:border-gray-700'}`}>
                {showSuccess ? <CheckCircle2 size={40} className="animate-in zoom-in" /> : (pinFlow === 'recovery' ? <Smartphone size={32} className="text-amber-500" /> : (pinFlow === 'verify' ? <Lock size={32} /> : <Sparkles size={32} className="animate-pulse" />))}
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 text-center">{getPinTitle()}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-10 text-center max-w-[260px] leading-relaxed font-medium">
                  {showSuccess ? "Verification confirmed. Accessing profile..." : (pinFlow === 'recovery' ? "Enter the verification code sent to your device." : (pinFlow === 'setup' ? "Create a new 6-digit PIN for your account." : "Enter your PIN to access sensitive information."))}
              </p>
              {pinFlow === 'recovery' ? (
                  <div className="w-full space-y-6 flex flex-col items-center animate-in fade-in">
                    <input type="number" pattern="[0-9]*" inputMode="numeric" autoFocus placeholder="000000" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-3xl py-6 text-center text-4xl font-black text-synergy-blue tracking-[0.3em] outline-none focus:ring-2 focus:ring-synergy-blue/10" value={recoveryOtp} onChange={(e) => handleVerifyRecoveryOtp(e.target.value)} disabled={isVerifyingOtp} />
                    {isVerifyingOtp && (
                        <div className="flex items-center space-x-2 text-synergy-blue animate-pulse">
                            <Loader2 size={16} className="animate-spin" /><span className="text-[10px] font-black uppercase tracking-widest">{t('account.validating')}</span>
                        </div>
                    )}
                  </div>
              ) : (
                  <>
                    <div className="flex space-x-4 mb-10">
                        {[...Array(6)].map((_, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-synergy-blue scale-125 shadow-glow' : 'bg-gray-200 dark:bg-gray-700'} ${pinError ? 'bg-red-50' : ''}`} />
                        ))}
                    </div>
                    {pinFlow === 'verify' && (
                        <button onClick={handleForgotPin} className="mb-8 flex items-center space-x-2 text-[10px] font-black text-synergy-blue uppercase tracking-widest hover:underline transition">
                        <RefreshCw size={12} /><span>{t('account.forgot_pin')}</span>
                        </button>
                    )}
                    <input type="number" pattern="[0-9]*" inputMode="numeric" autoFocus className="opacity-0 absolute inset-0 h-full w-full cursor-pointer z-10" value={pin} onChange={(e) => handlePinInput(e.target.value)} />
                  </>
              )}
          </div>
      )}

      {/* REFERRER REQUIRED MODAL */}
      {showReferrerModal && (
        <ReferralModal onClose={() => setShowReferrerModal(false)} />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-t-[40px] mt-32 pt-12 px-4 pb-16 shadow-[0_-15px_40px_rgba(0,0,0,0.08)] min-h-[calc(100vh-8rem)]">
          
          {/* Action Icons Area */}
          <div className="absolute top-10 right-6 flex items-center space-x-2.5 z-30">
              <button onClick={() => triggerPinGate('/withdraw')} className={`w-9 h-9 ${colors.bgLight} backdrop-blur-sm rounded-full flex items-center justify-center ${colors.text} shadow-sm border border-white dark:border-gray-700 active:scale-90 transition-all`}><Wallet size={18} /></button>
              <button onClick={() => navigate('/referrer-info')} className={`w-9 h-9 ${colors.bgLight} backdrop-blur-sm rounded-full flex items-center justify-center ${colors.text} shadow-sm border border-white dark:border-gray-700 active:scale-90 transition-all`}><UserCheck size={18} /></button>
              <button onClick={handleShareProfile} className={`w-9 h-9 ${colors.bgLight} backdrop-blur-sm rounded-full flex items-center justify-center ${colors.text} shadow-sm border border-white dark:border-gray-700 active:scale-90 transition-all`}><Share2 size={18} /></button>
          </div>

          {/* PROFILE SECTION */}
          <div className="mb-4 relative z-20 flex flex-col items-start -mt-[104px] px-5 space-y-3">
              <button onClick={() => triggerPinGate('/edit-profile')} className="relative w-28 h-28 group block active:scale-95 transition-transform shrink-0">
                <div className="w-28 h-28 rounded-full shadow-2xl overflow-hidden bg-white dark:bg-gray-700 transition-all group-hover:ring-8 group-hover:ring-synergy-blue/10 border-2 border-white/90">
                    <img src={user.avatar || undefined} alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-black/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Lock size={26} className="text-white opacity-60" /></div>
              </button>
              <div className="flex flex-col text-left">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight drop-shadow-sm leading-tight">{user.name}</h2>
                    {kycStatus === 'Verified' && <div className="bg-emerald-500 text-white rounded-full p-0.5 shadow-sm flex items-center justify-center"><Check size={10} strokeWidth={4} /></div>}
                  </div>
              </div>
          </div>

          {/* Today's Earnings Card */}
          <div onClick={() => navigate('/commissions')} className="w-full text-left bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 mb-4 shadow-soft dark:shadow-none border border-white/60 dark:border-gray-700 relative overflow-hidden group transition-all duration-200 cursor-pointer active:scale-[0.98]">
            <div className="text-center mb-6 relative z-10">
                <div className={`inline-flex items-center space-x-2 ${colors.bgLight} px-3 py-1.5 rounded-full mb-2 border border-white/50 dark:border-gray-600 shadow-sm`}>
                    <span className={`text-[10px] ${colors.text} font-black uppercase tracking-wider`}>{t('account.earnings_today')}</span>
                </div>
                <div className="h-10 flex flex-col items-center justify-center">
                    <h2 className={`text-2xl font-black ${colors.text} tracking-tight leading-none`}>฿{(Math.floor(animatedEarnings) || 0).toLocaleString()}</h2>
                </div>
            </div>
            <div className="relative z-10">
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner relative mb-3">
                     <div className={`h-full ${colors.progress} rounded-full relative transition-all duration-1000 ease-out`} style={{ width: `${globalProgress}%` }}><div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 rounded-full"></div></div>
                </div>
                <div className="flex justify-between text-[9px] font-black text-gray-400 dark:text-gray-500 px-1 tracking-widest uppercase">
                    <span className={user.tier === UserTier.STARTER ? 'text-synergy-blue' : ''}>{t('account.starter')}</span>
                    <span className={user.tier === UserTier.MARKETER ? 'text-pink-600' : ''}>{t('account.marketer')}</span>
                    <span className={user.tier === UserTier.BUILDER ? 'text-purple-700 font-black' : ''}>{t('account.builder')}</span>
                    <span className={user.tier === UserTier.EXECUTIVE ? 'text-amber-600 font-black' : ''}>{t('account.executive')}</span>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 dark:from-blue-900/20 to-transparent rounded-bl-[100px] pointer-events-none"></div>
            <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${colors.decoration} to-transparent rounded-tr-[80px] pointer-events-none`}></div>
          </div>

          {/* ADVERTISEMENT BANNER (Updated: Click navigates to Promotions) */}
          {user.tier !== UserTier.EXECUTIVE && hasPromoProducts && (
            activeAd ? (
                <div 
                  onClick={() => navigate('/promotions')}
                  className="w-full h-32 rounded-xl overflow-hidden shadow-soft mb-8 relative group cursor-pointer active:scale-[0.98] transition-all duration-500 border border-white/60 dark:border-gray-700 animate-in slide-in-from-bottom-2 duration-700"
                >
                    <img src={activeAd.image || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Account Ad" />
                    
                    {activeAd.expiryDate && (
                      <div className="absolute top-3 right-3 z-20">
                        <CountdownTimer expiryDate={activeAd.expiryDate} onExpire={handleExpire} />
                      </div>
                    )}

                    <div className="absolute bottom-4 left-6 right-6">
                        <h3 className="text-lg font-black leading-tight text-gray-900 drop-shadow-sm">{activeAd.title}</h3>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-[9px] text-gray-600 font-bold opacity-90 truncate max-w-[80%]">{activeAd.subtitle}</p>
                          <div className="bg-black/30 backdrop-blur-md rounded-full p-1.5 border border-white/20 group-hover:bg-synergy-blue group-hover:border-synergy-blue transition-all text-white">
                              <ArrowRight size={12} />
                          </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div 
                  onClick={() => navigate('/promotions')}
                  className="w-full h-32 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl mb-8 p-6 flex flex-col justify-center shadow-soft dark:shadow-none border border-white/60 dark:border-gray-700 relative overflow-hidden group transition-all duration-200 cursor-pointer active:scale-[0.98]"
                >
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-blue-100/50 dark:from-blue-900/20 to-transparent rounded-tl-[100px] pointer-events-none"></div>
                    <div className={`absolute top-0 left-0 w-24 h-24 bg-gradient-to-br ${colors.decoration} to-transparent rounded-br-[80px] pointer-events-none`}></div>
                    
                    <div className="relative z-10">
                        <div className={`inline-flex items-center space-x-2 ${colors.bgLight} px-2 py-1 rounded-full mb-2 border border-white/50 dark:border-gray-600 shadow-sm`}>
                            <Sparkles size={10} className={colors.text} />
                            <span className={`text-[8px] ${colors.text} font-black uppercase tracking-wider`}>Promotion</span>
                        </div>
                        <h3 className={`text-lg font-black ${colors.text} leading-tight mb-1`}>Empower Your Network</h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium line-clamp-1">Earn up to 30% commission on every referral.</p>
                        
                        <div className="absolute right-0 bottom-0">
                             <div className={`p-2 rounded-full ${colors.bgLight} ${colors.text} border border-white/50 dark:border-gray-600 shadow-sm group-hover:scale-110 transition-transform`}>
                                <ArrowRight size={14} />
                             </div>
                        </div>
                    </div>
                </div>
            )
          )}

          {/* Admin Management Section */}
          {isAdmin && (
            <div className="mb-8 animate-in slide-in-from-bottom-2">
              <h3 className="text-xs font-black text-indigo-500 uppercase ml-2 mb-4 tracking-[0.2em] flex items-center"><ShieldCheck size={16} className="mr-2.5" />Admin Management</h3>
              <div className="space-y-1">
                <MenuRow icon={Database} label="Manage System Operations" to="/admin/dashboard" colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" navigate={navigate} triggerPinGate={triggerPinGate} />
                <MenuRow icon={ImageIcon} label="Update Product Assets" to="/admin/products" colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" navigate={navigate} triggerPinGate={triggerPinGate} />
                <MenuRow icon={Megaphone} label="Update Campaign Assets" to="/admin/campaign-assets" colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" navigate={navigate} triggerPinGate={triggerPinGate} />
                <MenuRow icon={Layout} label="Update Ads & Banners" to="/admin/ads" colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" navigate={navigate} triggerPinGate={triggerPinGate} />
                <MenuRow icon={Monitor} label="Update Onboarding Slides" to="/admin/onboarding" colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" navigate={navigate} triggerPinGate={triggerPinGate} />
              </div>
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-xs font-black text-gray-400 uppercase ml-2 mb-4 tracking-[0.2em]">{t('account.dashboard')}</h3>
            <div className="space-y-1">
                <MenuRow icon={Package} label={t('menu.my_orders')} to="/my-orders" navigate={navigate} triggerPinGate={triggerPinGate} />
                <MenuRow icon={LinkIcon} label={t('menu.affiliate_links')} to="/affiliate-links" navigate={navigate} triggerPinGate={triggerPinGate} />
                <MenuRow icon={Users} label={t('menu.my_team')} value={`${team.length} Members`} to="/my-team" navigate={navigate} triggerPinGate={triggerPinGate} />
                <MenuRow icon={BarChart2} label={t('menu.commissions')} value={`Currently ${currentRate}%`} to="/commissions" navigate={navigate} triggerPinGate={triggerPinGate} />
            </div>
          </div>

          <div className="pb-2">
             <h3 className="text-xs font-black text-gray-400 uppercase ml-2 mb-4 tracking-[0.2em]">{t('account.personal')}</h3>
             <div className="space-y-1">
                 <MenuRow icon={UserCog} label={t('menu.personal_info')} to="/personal-info" requiresPin={true} navigate={navigate} triggerPinGate={triggerPinGate} />
                 <MenuRow icon={Settings} label={t('menu.preferences')} to="/preferences" navigate={navigate} triggerPinGate={triggerPinGate} />
                 <MenuRow icon={HelpCircle} label={t('menu.help_support')} to="/help-support" navigate={navigate} triggerPinGate={triggerPinGate} />
                 <MenuRow icon={Info} label={t('menu.about_us')} to="/about-us" navigate={navigate} triggerPinGate={triggerPinGate} />
             </div>
          </div>
      </div>

    </div>
  );
};