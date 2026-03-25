import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, CheckCircle, Crown, Shield, Star, TrendingUp, Clock, Info, Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserTier } from '../types';

export const TierBenefits: React.FC = () => {
  const { user, getNextTierTarget, language } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  const nextTarget = getNextTierTarget();
  const progress = Math.min(100, (user.accumulatedSales / nextTarget) * 100);

  const getDaysRemaining = () => {
    if (!user.teamIncomeExpiry) return 0;
    const expiry = new Date(user.teamIncomeExpiry);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining();
  const isEligible = daysRemaining > 0;

  const tiers = [
    {
      name: UserTier.STARTER,
      displayName: 'Starter',
      req: 'Free Signup',
      color: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: Shield,
      benefits: [
        '5% Direct Commission (Base)',
        '0% Personal Discount',
        'Standard Platform Access'
      ]
    },
    {
      name: UserTier.MARKETER,
      displayName: 'Marketer',
      req: 'Accumulate ฿3,000',
      color: 'bg-pink-50 text-pink-600 border-pink-100',
      icon: Star,
      benefits: [
        '10% Direct Commission',
        '10% Personal Discount',
        'Indirect: +5% Starter, +2% Marketer'
      ]
    },
    {
      name: UserTier.BUILDER,
      displayName: 'Builder',
      req: 'Accumulate ฿6,000',
      color: 'bg-purple-50 text-purple-700 border-purple-100',
      icon: Zap,
      benefits: [
        '20% Direct Commission',
        '20% Personal Discount',
        'Indirect: +15% Starter, +10% Marketer, +2% Builder'
      ]
    },
    {
      name: UserTier.EXECUTIVE,
      displayName: 'Executive',
      req: 'Accumulate ฿9,000',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      icon: Crown,
      benefits: [
        '30% Direct Commission',
        '30% Personal Discount',
        'Indirect: +25% Starter, +20% Marketer, +10% Builder, +1% Executive'
      ]
    }
  ];

  const getTierColorClass = (tier: UserTier) => {
    switch (tier) {
        case UserTier.EXECUTIVE: return 'text-amber-500';
        case UserTier.BUILDER: return 'text-purple-700';
        case UserTier.MARKETER: return 'text-pink-600';
        default: return 'text-synergy-blue';
    }
  };

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 pt-12 pb-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">Affiliate Tiers</h1>
          </div>
          <button 
            onClick={() => navigate(`/tier-data/Executive`)}
            className="p-2.5 bg-white dark:bg-gray-800 text-amber-500 rounded-full shadow-sm hover:bg-amber-50 dark:hover:bg-amber-900/30 transition border border-amber-100 dark:border-gray-700 active:scale-95"
            title="Executive Board"
          >
            <Crown size={20} />
          </button>
        </div>
      </div>

      <button 
        onClick={() => navigate(`/tier-data/${user.tier}`)}
        className="w-full text-left bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-soft dark:shadow-none border border-transparent dark:border-gray-700 mb-4 active:scale-[0.98] transition-all group"
      >
        <div className="flex justify-between items-center mb-4">
            <div>
                <div className="flex items-center space-x-1 mb-1">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Current Tier</p>
                    <TrendingUp size={10} className="text-synergy-blue" />
                </div>
                <h2 className={`text-2xl font-black ${getTierColorClass(user.tier)}`}>{user.tier} Affiliate</h2>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border transition-transform group-hover:scale-110 ${user.tier === UserTier.EXECUTIVE ? 'bg-amber-50 text-amber-500 border-amber-200' : user.tier === UserTier.BUILDER ? 'bg-purple-50 text-purple-700 border-purple-200' : user.tier === UserTier.MARKETER ? 'bg-pink-50 text-pink-600 border-pink-200' : 'bg-blue-50 text-synergy-blue border-blue-200'}`}>
                {user.tier === UserTier.EXECUTIVE ? <Crown size={24} fill="currentColor" /> : user.tier === UserTier.BUILDER ? <Zap size={24} fill="currentColor" /> : <Star size={24} fill="currentColor" />}
            </div>
        </div>
        
        <div className="mb-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter mb-1.5">
                <span className="text-gray-400">Next Target</span>
                <span className="text-synergy-blue">{progress.toFixed(0)}% Complete</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${user.tier === UserTier.EXECUTIVE ? 'bg-gradient-to-r from-amber-400 to-orange-600' : user.tier === UserTier.BUILDER ? 'bg-gradient-to-r from-purple-700 to-indigo-900' : user.tier === UserTier.MARKETER ? 'bg-pink-500' : 'bg-synergy-blue'}`} 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
        <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] text-gray-400 font-bold">
                {user.tier === UserTier.EXECUTIVE 
                    ? "Max Tier Achieved" 
                    : `฿${((nextTarget ?? 0) - (user.accumulatedSales ?? 0)).toLocaleString()} remaining`}
            </p>
            <span className="text-[9px] font-black text-synergy-blue uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">View Stats</span>
        </div>
      </button>

      {user.tier !== UserTier.STARTER && (
          <div className={`p-4 rounded-2xl mb-6 shadow-sm border flex items-start space-x-3 transition-colors duration-300 ${isEligible ? 'bg-green-50 dark:bg-emerald-900/20 border-green-100 dark:border-emerald-800 text-green-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${isEligible ? 'bg-green-100 border-green-200 dark:bg-emerald-900/40 text-green-600 dark:text-emerald-300 dark:border-emerald-700' : 'bg-red-100 border-red-200 dark:bg-red-900/40 text-red-600 dark:text-red-300 dark:border-red-700'}`}>
                  {isEligible ? <Clock size={20} /> : <Clock size={20} className="animate-pulse" />}
              </div>
              <div>
                  <h4 className="text-sm font-bold mb-1">
                      Team Income Eligibility
                  </h4>
                  <p className="text-xs font-medium opacity-90">
                      {`Eligibility remains ${daysRemaining} days`}
                  </p>
                  <p className="text-[10px] mt-1 opacity-70 font-bold uppercase tracking-tight">
                      {'Make 1 sale to add +30 days to your current balance'}
                  </p>
              </div>
          </div>
      )}

      <h3 className="text-xs font-black text-gray-400 uppercase ml-2 mb-4 tracking-[0.2em]">Tier Status</h3>

      <div className="space-y-4">
        {tiers.map((tier) => {
            const isActive = user.tier === tier.name;
            const isPassed = 
                (user.tier === UserTier.EXECUTIVE && tier.name !== UserTier.EXECUTIVE) ||
                (user.tier === UserTier.BUILDER && (tier.name === UserTier.STARTER || tier.name === UserTier.MARKETER)) ||
                (user.tier === UserTier.MARKETER && tier.name === UserTier.STARTER);

            return (
                <div key={tier.name} className={`rounded-2xl p-5 border transition ${isActive ? 'bg-white dark:bg-gray-800 border-current shadow-md ring-1 ring-current/20' : 'bg-white dark:bg-gray-800 border-transparent shadow-sm opacity-90'} ${isActive ? (tier.name === UserTier.EXECUTIVE ? 'border-amber-500 text-amber-600 dark:text-amber-400' : tier.name === UserTier.BUILDER ? 'border-purple-700 text-purple-700 dark:text-purple-400' : tier.name === UserTier.MARKETER ? 'border-pink-500 text-pink-600' : 'border-synergy-blue text-synergy-blue dark:text-blue-400') : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md border ${tier.color} transition-transform`}>
                                <tier.icon size={32} fill="currentColor" className="opacity-90" />
                            </div>
                            <div>
                                <h4 className="text-base font-black text-gray-900 dark:text-white leading-tight">{tier.displayName}</h4>
                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight mt-0.5">{tier.req}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-1">
                          {isActive && <span className={`text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full shadow-sm ${tier.name === UserTier.EXECUTIVE ? 'bg-amber-500' : tier.name === UserTier.BUILDER ? 'bg-purple-700' : tier.name === UserTier.MARKETER ? 'bg-pink-500' : 'bg-synergy-blue'}`}>Active</span>}
                          {isPassed && <CheckCircle size={18} className="text-green-500" />}
                        </div>
                    </div>
                    
                    <ul className="space-y-2.5 mt-4">
                        {tier.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start space-x-3 text-[13px] text-gray-600 dark:text-gray-400">
                                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                                <span className="font-semibold leading-snug">{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        })}
      </div>
    </div>
  );
};