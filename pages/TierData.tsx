import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Crown, TrendingUp, Users, ShieldCheck, Star, ChevronRight, Search, X, Zap, BarChart3, Shield, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserTier } from '../types';
import { useApp } from '../context/AppContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../src/firebase';

export const TierData: React.FC = () => {
  const navigate = useNavigate();
  const { tier } = useParams<{ tier: string }>();
  const { allTeamMembers, user } = useApp();
  const [isShowingAll, setIsShowingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedTier = (tier as UserTier) || UserTier.EXECUTIVE;

  const [tierMembers, setTierMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTierMembers = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'publicProfiles'), where('tier', '==', selectedTier));
        const snapshot = await getDocs(q);
        const members = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTierMembers(members);
      } catch (err) {
        console.error("Failed to fetch tier members", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTierMembers();
  }, [selectedTier]);

  const stats = useMemo(() => {
    const activeCount = tierMembers.length;
    const totalIncome = tierMembers.reduce((sum, m) => sum + (m.accumulatedIncome || 0), 0);
    return {
      activeCount,
      totalIncome
    };
  }, [tierMembers]);

  const theme = useMemo(() => {
    switch (selectedTier) {
      case UserTier.EXECUTIVE:
        return { 
          title: 'Executive', 
          subtitle: 'Platform Elite Leaders',
          gradient: 'from-amber-500 to-orange-600', 
          accent: 'amber', 
          icon: Crown,
          activeLabel: 'Active Executives',
          rewardLabel: 'Total Income',
          activeVal: stats.activeCount.toLocaleString(),
          rewardVal: `฿${stats.totalIncome.toLocaleString()}`
        };
      case UserTier.BUILDER:
        return { 
          title: 'Builder', 
          subtitle: 'Structural Growth Hub',
          gradient: 'from-purple-600 to-indigo-700', 
          accent: 'purple', 
          icon: Zap,
          activeLabel: 'Active Builders',
          rewardLabel: 'Total Income',
          activeVal: stats.activeCount.toLocaleString(),
          rewardVal: `฿${stats.totalIncome.toLocaleString()}`
        };
      case UserTier.MARKETER:
        return { 
          title: 'Marketer', 
          subtitle: 'Campaign Frontline',
          gradient: 'from-pink-500 to-rose-600', 
          accent: 'pink', 
          icon: BarChart3,
          activeLabel: 'Active Marketers',
          rewardLabel: 'Total Income',
          activeVal: stats.activeCount.toLocaleString(),
          rewardVal: `฿${stats.totalIncome.toLocaleString()}`
        };
      default:
        return { 
          title: 'Starter', 
          subtitle: 'Emerging Affiliates',
          gradient: 'from-synergy-blue to-blue-600', 
          accent: 'blue', 
          icon: Shield,
          activeLabel: 'New Signups',
          rewardLabel: 'Total Income',
          activeVal: stats.activeCount.toLocaleString(),
          rewardVal: `฿${stats.totalIncome.toLocaleString()}`
        };
    }
  }, [selectedTier, stats]);

  const tierLeaders = useMemo(() => {
    return [...tierMembers]
      .sort((a, b) => (b.accumulatedIncome || 0) - (a.accumulatedIncome || 0))
      .map(m => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        income: `฿${(m.accumulatedIncome || 0).toLocaleString()}`,
        team: (m.teamSize || 0).toLocaleString(),
        rawIncome: m.accumulatedIncome || 0
      }));
  }, [tierMembers]);

  const displayedList = isShowingAll 
    ? tierLeaders.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : tierLeaders.slice(0, 3);

  const colors: any = {
      amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-100 dark:border-amber-800' },
      purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-100 dark:border-purple-800' },
      pink: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/30', border: 'border-pink-100 dark:border-pink-800' },
      blue: { text: 'text-synergy-blue dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-100 dark:border-blue-800' }
  };

  const currentColors = colors[theme.accent];

  const DataCard: React.FC<{ item: any, idx: number }> = ({ item, idx }) => {
    const getRankColor = () => {
        if (searchQuery) return 'text-gray-900 dark:text-white';
        if (idx === 0) return 'text-amber-500 dark:text-amber-400';
        if (idx === 1) return 'text-purple-500 dark:text-purple-400';
        if (idx === 2) return 'text-rose-500 dark:text-rose-400';
        return 'text-gray-900 dark:text-white';
    };

    const isTopRank = !searchQuery && idx < 3;
    const rankBorderColor = isTopRank 
        ? (idx === 0 ? 'border-amber-400' : idx === 1 ? 'border-purple-500' : 'border-rose-500')
        : 'border-gray-50 dark:border-gray-700';
    
    const badgeBgColor = isTopRank
        ? (idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-purple-500' : 'bg-rose-500')
        : (theme.accent === 'amber' ? 'bg-amber-400' : theme.accent === 'purple' ? 'bg-purple-500' : theme.accent === 'pink' ? 'bg-pink-500' : 'bg-synergy-blue');

    return (
        <div 
            className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex items-center justify-between border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${idx * 50}ms` }}
        >
            <div className="flex items-center space-x-4">
                <div className="relative shrink-0">
                    <img 
                        src={item.avatar || undefined} 
                        alt={item.name} 
                        className={`w-14 h-14 rounded-full object-cover border-2 ${rankBorderColor} shadow-sm bg-gray-100 transition-colors duration-500`} 
                    />
                    <div className={`absolute -top-1 -right-1 rounded-full border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center transition-all duration-500 ${isTopRank ? 'w-6 h-6' : 'p-1'} ${badgeBgColor}`}>
                        {isTopRank ? (
                            <span className="text-[10px] font-black text-white">{idx + 1}</span>
                        ) : (
                            <theme.icon size={8} fill="white" className="text-white" />
                        )}
                    </div>
                </div>
                <div className="min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border ${currentColors.bg} ${currentColors.text} ${currentColors.border}`}>{selectedTier}</span>
                        <span className="flex items-center text-[10px] text-gray-400 font-bold">
                            <Users size={10} className="mr-1" />
                            {item.team} Net
                        </span>
                    </div>
                </div>
            </div>
            <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${getRankColor()}`}>{item.income}</p>
                <p className="text-[10px] text-gray-400 font-medium">Total Income</p>
            </div>
        </div>
    );
  };

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 py-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
                onClick={() => isShowingAll ? setIsShowingAll(false) : navigate(-1)} 
                className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">
                {isShowingAll ? `Top ${selectedTier}s` : `${selectedTier} Status`}
            </h1>
          </div>
        </div>
      </div>

      {!isShowingAll ? (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-xs font-black uppercase tracking-widest">Loading Intel...</p>
            </div>
          ) : (
            <>
              {/* Dynamic Board Header */}
              <div className={`bg-gradient-to-br ${theme.gradient} rounded-[32px] p-6 mb-8 text-white relative overflow-hidden shadow-lg animate-in zoom-in-95 duration-500`}>
                  <div className="relative z-10">
                      <div className="flex items-center space-x-3 mb-5">
                          <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                              <theme.icon size={26} className="text-white" />
                          </div>
                          <div>
                              <h2 className="text-lg font-black tracking-tight uppercase leading-tight">{theme.title}</h2>
                              <p className="text-[10px] opacity-80 font-black uppercase tracking-widest">{theme.subtitle}</p>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5 shadow-inner">
                              <p className="text-[9px] text-white/80 uppercase font-black tracking-widest mb-1">{theme.activeLabel}</p>
                              <p className="text-xl font-black">{theme.activeVal}</p>
                          </div>
                          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5 shadow-inner">
                              <p className="text-[9px] text-white/80 uppercase font-black tracking-widest mb-1">{theme.rewardLabel}</p>
                              <p className="text-xl font-black">{theme.rewardVal}</p>
                          </div>
                      </div>
                  </div>
                  <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute left-[-10px] bottom-[-10px] w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
              </div>

              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Rank Top Performers</h3>
                <button 
                    onClick={() => setIsShowingAll(true)}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${currentColors.bg} ${currentColors.text} ${currentColors.border}`}
                >
                    See all
                </button>
              </div>

              <div className="space-y-4">
                  {displayedList.map((item, idx) => (
                      <DataCard key={idx} item={item} idx={idx} />
                  ))}
              </div>

              {/* Dynamic Privileges Info */}
              <div className={`mt-8 rounded-[32px] p-6 border transition-all animate-in fade-in slide-in-from-bottom-4 shadow-sm ${currentColors.bg} ${currentColors.border}`}>
                  <h4 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center ${currentColors.text}`}>
                      <ShieldCheck size={18} className="mr-2" />
                      {selectedTier} Privileges
                  </h4>
                  <ul className="space-y-4">
                      {[
                          selectedTier === UserTier.EXECUTIVE ? "30% Lifetime Direct Commission" : selectedTier === UserTier.BUILDER ? "20% Direct Commission Boost" : selectedTier === UserTier.MARKETER ? "10% Direct Commission Active" : "5% Baseline Commission",
                          selectedTier === UserTier.EXECUTIVE ? "Exclusive VIP Support Line" : "Priority Network Support",
                          "Access to Advanced AI Studio",
                          selectedTier === UserTier.EXECUTIVE ? "Quarterly Profit Sharing Pool" : "Tier Performance Bonuses"
                      ].map((item, i) => (
                          <li key={i} className="flex items-start space-x-3">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${currentColors.bg} border ${currentColors.border}`}>
                                <TrendingUp size={10} className={currentColors.text} />
                              </div>
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 opacity-80">{item}</span>
                          </li>
                      ))}
                  </ul>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="animate-in fade-in duration-300">
            <div className="relative mb-6">
                <div className="absolute left-4 top-3 text-gray-400">
                    <Search size={18} />
                </div>
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${selectedTier} leaders...`}
                    className="w-full bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-2xl py-3.5 pl-12 pr-10 shadow-soft focus:ring-2 focus:ring-synergy-blue/20 outline-none dark:text-white text-sm font-medium"
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {displayedList.length > 0 ? (
                    displayedList.map((item, idx) => (
                        <DataCard key={idx} item={item} idx={idx} />
                    ))
                ) : (
                    <div className="text-center py-20 text-gray-400 bg-white dark:bg-gray-800 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-700">
                        <Users size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No matching results</p>
                    </div>
                )}
            </div>

            <button 
                onClick={() => setIsShowingAll(false)}
                className="w-full mt-8 py-4 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] text-[10px] rounded-[20px] shadow-sm border border-transparent active:scale-95 transition-all"
            >
                Back to Intel
            </button>
        </div>
      )}
    </div>
  );
};