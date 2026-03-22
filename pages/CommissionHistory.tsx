import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  Users, 
  Wallet, 
  Target,
  TrendingUp,
  ChevronRight,
  Zap,
  DollarSign,
  BarChart3,
  Award,
  CreditCard,
  Download,
  Share2,
  Check,
  ShieldCheck,
  Landmark,
  CheckCircle2,
  Lock,
  X
} from 'lucide-react';
import { ShoppingBagIcon } from '../components/ShoppingBagIcon';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserTier, CommissionTransaction } from '../types';

export const CommissionHistory: React.FC = () => {
  const { commissions, user, t, systemSettings, allOrders } = useApp();
  const navigate = useNavigate();
  
  const [activeFilter, setActiveFilter] = useState<'All' | 'Direct' | 'Team' | 'Withdrawal'>('All');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedTx, setSelectedTx] = useState<CommissionTransaction | null>(null);

  // PIN Gate States
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinFlow, setPinFlow] = useState<'verify' | 'setup' | 'confirm'>('verify');
  const [tempPin, setTempPin] = useState('');
  const [showPinSuccess, setShowPinSuccess] = useState(false);
  const [targetRoute, setTargetRoute] = useState<string>('');

  const { isSecurityUnlocked, setIsSecurityUnlocked, updateUserSecurity } = useApp();
  
  // Animation States
  const [animatedWallet, setAnimatedWallet] = useState(0);
  const [animatedEarned, setAnimatedEarned] = useState(0);
  const [animatedMonthly, setAnimatedMonthly] = useState(0);
  const [animatedWeekly, setAnimatedWeekly] = useState(0);

  const userCommissions = commissions;

  // Calculate Income for Dashboard (Synced logic with Home)
  const lifetimeEarned = useMemo(() => {
    const val = userCommissions
      .filter(c => (c.status === 'Paid' || c.status === 'Completed') && c.amount > 0)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }, [userCommissions]);

  // Calculate Monthly Revenue
  const monthlyEarned = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toLocaleString('en-GB', { month: 'short' });
    const currentYear = now.getFullYear().toString();
    
    return userCommissions
      .filter(c => 
        c.date.includes(currentMonth) && 
        c.date.includes(currentYear) &&
        c.amount > 0 &&
        (c.type === 'Direct' || c.type === 'Team') &&
        (c.status === 'Paid' || c.status === 'Completed')
      )
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [userCommissions]);

  // Calculate Weekly Revenue (Last 7 days)
  const weeklyEarned = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    return userCommissions
      .filter(c => {
        const txDate = new Date(c.date);
        return txDate >= sevenDaysAgo && 
               txDate <= now &&
               c.amount > 0 &&
               (c.type === 'Direct' || c.type === 'Team') &&
               (c.status === 'Paid' || c.status === 'Completed');
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [userCommissions]);

  // Show Total Sales (Accumulated Volume)
  const walletBalance = user?.walletBalance || 0;

  // Animation effect
  useEffect(() => {
    const duration = 1000;
    const frameRate = 60;
    const totalFrames = Math.round(duration / (1000 / frameRate));
    
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedEarned(lifetimeEarned * easeOut);
      setAnimatedMonthly(monthlyEarned * easeOut);
      setAnimatedWeekly(weeklyEarned * easeOut);
      setAnimatedWallet(walletBalance * easeOut);
      
      if (frame === totalFrames) {
        clearInterval(timer);
      }
    }, 1000 / frameRate);

    return () => clearInterval(timer);
  }, [walletBalance, lifetimeEarned, monthlyEarned, weeklyEarned]);

  const triggerPinGate = (route: string) => {
    setTargetRoute(route);
    if (isSecurityUnlocked) {
      navigate(route);
      return;
    }
    const hasPin = user?.pin && user.pin.trim() !== "";
    setPinFlow(hasPin ? 'verify' : 'setup');
    setIsVerifyingPin(true);
    setPin('');
    setTempPin('');
    setPinError(false);
  };

  const handlePinInput = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setPin(cleanValue);
    setPinError(false);

    if (cleanValue.length === 6) {
      if (pinFlow === 'verify') {
        if (cleanValue === user?.pin) {
          setIsSecurityUnlocked(true);
          setShowPinSuccess(true);
          setTimeout(() => {
            setShowPinSuccess(false);
            setIsVerifyingPin(false);
            navigate(targetRoute);
          }, 1000);
        } else {
          setPinError(true);
          setTimeout(() => {
            setPin('');
          }, 500);
        }
      } else if (pinFlow === 'setup') {
        setTempPin(cleanValue);
        setTimeout(() => {
          setPin('');
          setPinFlow('confirm');
        }, 300);
      } else if (pinFlow === 'confirm') {
        if (cleanValue === tempPin) {
          updateUserSecurity('pin', cleanValue);
          setIsSecurityUnlocked(true);
          setShowPinSuccess(true);
          setTimeout(() => {
            setShowPinSuccess(false);
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

  const filteredCommissions = activeFilter === 'All' 
    ? userCommissions 
    : userCommissions.filter(c => c.type === activeFilter);

  if (viewMode === 'detail' && selectedTx) {
    const isWithdrawal = selectedTx.type === 'Withdrawal';
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans pb-10 flex flex-col">
            <div className="flex items-center px-4 pt-6 mb-2">
                <button onClick={() => setViewMode('list')} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                  <ArrowLeft size={24} />
                </button>
            </div>

            <div className="flex-1 px-6 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <Check size={32} strokeWidth={4} className="animate-in zoom-in-50 duration-300 delay-100" />
                    </div>
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1 tracking-tight text-center">
                    {selectedTx.type === 'Withdrawal' 
                        ? 'Withdrawal'
                        : (selectedTx.status === 'Pending' || selectedTx.status === 'Waiting' ? 'Transaction Pending' : 'Transaction Success')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-8 text-center uppercase tracking-widest">
                    {selectedTx.type === 'Withdrawal' 
                        ? (selectedTx.status === 'Completed' || selectedTx.status === 'Paid' ? 'Transaction Completed' : 'Processing Request')
                        : 'Commission earned successfully'}
                </p>

                <div className="w-full bg-white dark:bg-gray-900 rounded-[28px] p-6 shadow-soft border border-gray-100 dark:border-gray-800 space-y-5">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</span>
                        <span className={`text-xl font-black ${selectedTx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {selectedTx.amount > 0 ? '+' : ''}฿{Math.abs(selectedTx.amount ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </span>
                    </div>
                    
                    <div className="h-px bg-gray-50 dark:bg-gray-800"></div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Type</span>
                            <span className="text-xs font-black text-gray-900 dark:text-white">{selectedTx.type}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${selectedTx.status === 'Paid' || selectedTx.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : (selectedTx.status === 'Pending' || selectedTx.status === 'Waiting') ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                {selectedTx.status}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Date</span>
                            <span className="text-xs font-black text-gray-900 dark:text-white">{selectedTx.date}</span>
                        </div>
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Reference</span>
                            <span className="text-[10px] font-black text-gray-900 dark:text-white text-right max-w-[150px] break-words">
                                {selectedTx.source.split('|')[0]}
                            </span>
                        </div>
                        {selectedTx.orderId && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Order ID</span>
                                    <span className="text-xs font-black text-synergy-blue">#{selectedTx.orderId}</span>
                                </div>
                                {allOrders.find(o => o.id === selectedTx.orderId) && (
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 space-y-3">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Purchased Items</p>
                                        {allOrders.find(o => o.id === selectedTx.orderId)?.items.map(item => (
                                            <div key={item.id} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <img 
                                                        src={item.image || undefined} 
                                                        alt={item.name} 
                                                        className="w-8 h-8 rounded-lg object-cover shadow-sm" 
                                                        referrerPolicy="no-referrer"
                                                    />
                                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{item.name}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-gray-900 dark:text-white">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="bg-synergy-blue/5 dark:bg-synergy-blue/10 rounded-xl p-3 flex justify-between items-center border border-synergy-blue/10">
                        <span className="text-[10px] font-black text-synergy-blue uppercase tracking-widest">Transaction ID</span>
                        <span className="text-[10px] font-black text-synergy-blue">SF-{selectedTx.id.toString().slice(-8).toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div className="px-6 space-y-3">
                <button 
                    onClick={() => setViewMode('list')}
                    className="w-full h-14 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-full font-black uppercase tracking-[0.2em] text-[10px] border border-gray-100 dark:border-gray-800 active:scale-95 transition"
                >
                    Back to History
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors relative">
      {isVerifyingPin && (
          <div className="fixed inset-0 z-[110] bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-6 transition-all duration-300">
              <button onClick={() => setIsVerifyingPin(false)} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400"><X size={20} /></button>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl mb-8 transition-all duration-500 ${showPinSuccess ? 'bg-emerald-50 text-white' : 'bg-gray-50 dark:bg-gray-800 text-synergy-blue border border-gray-100 dark:border-gray-700'}`}>
                {showPinSuccess ? <CheckCircle2 size={40} /> : <Lock size={32} />}
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                {showPinSuccess ? 'Success!' : (pinFlow === 'verify' ? 'Enter Security PIN' : pinFlow === 'confirm' ? 'Confirm Security PIN' : 'Set Security PIN')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-10 text-center">
                {pinFlow === 'confirm' ? 'Please re-enter your PIN to confirm.' : (pinFlow === 'setup' ? 'Create a 6-digit PIN to protect your funds.' : 'Enter your 6-digit security PIN to continue.')}
              </p>
              <div className="flex space-x-4 mb-10">
                  {[...Array(6)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-synergy-blue scale-125' : 'bg-gray-200 dark:bg-gray-700'} ${pinError ? 'bg-red-500 animate-shake' : ''}`} />
                  ))}
              </div>
              <input 
                type="text" 
                pattern="\d*" 
                inputMode="numeric" 
                autoFocus 
                className="opacity-0 absolute inset-0 h-full w-full cursor-pointer z-10" 
                value={pin} 
                onChange={(e) => handlePinInput(e.target.value)} 
              />
          </div>
      )}

      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 py-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">Commissions History</h1>
          </div>
        </div>
      </div>

      {/* REVENUE DASHBOARD GRID */}
      <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Weekly */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-transparent dark:border-gray-700 hover:border-purple-100 dark:hover:border-purple-900/30 transition-all">
              <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center">
                      <Zap size={16} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Weekly</span>
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">฿{Math.floor(animatedWeekly ?? 0).toLocaleString()}</p>
              <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">Last 7 Days</p>
          </div>

          {/* Monthly */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-transparent dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all">
              <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-synergy-blue flex items-center justify-center">
                      <BarChart3 size={16} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Monthly</span>
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">฿{Math.floor(animatedMonthly ?? 0).toLocaleString()}</p>
              <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">Current Month</p>
          </div>

          {/* Accumulated */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-transparent dark:border-gray-700 hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-all">
              <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center">
                      <TrendingUp size={16} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Income</span>
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">฿{Math.floor(animatedEarned ?? 0).toLocaleString()}</p>
              <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">Total Income</p>
          </div>

          {/* Withdrawable */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-transparent dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all">
              <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-synergy-blue flex items-center justify-center">
                      <Wallet size={16} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Withdrawal</span>
              </div>
              <p className="text-xl font-black text-synergy-blue">฿{Math.floor(animatedWallet ?? 0).toLocaleString()}</p>
              <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">Available Balance</p>
          </div>
      </div>

      {/* Withdraw Button */}
      <div className="mb-8">
          <button 
            onClick={() => triggerPinGate('/withdraw')} 
            className="w-full bg-emerald-500 text-white py-4 rounded-full font-black uppercase tracking-widest shadow-glow active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
              <CreditCard size={18} />
              <span>Withdraw Funds</span>
          </button>
      </div>

      {/* Categories Filter */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar mb-5 px-1 py-1">
          {['All', 'Direct', 'Team', 'Withdrawal'].map((type) => (
              <button 
                key={type} 
                onClick={() => setActiveFilter(type as any)} 
                className={`px-4 py-2 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition-all duration-300 ${activeFilter === type ? 'bg-synergy-blue text-white shadow-md scale-105' : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
              >
                  {type}
              </button>
          ))}
      </div>
      
      <div className="space-y-3">
        {filteredCommissions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-[24px] border border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300"><Wallet size={22} /></div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">No activity found</p>
            </div>
        ) : (
            filteredCommissions.map((tx, index) => (
                <div 
                    key={tx.id} 
                    onClick={() => {
                        if (tx.type === 'Withdrawal') {
                            navigate('/withdraw', { state: { transaction: tx } });
                        } else {
                            setSelectedTx(tx);
                            setViewMode('detail');
                        }
                    }}
                    className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex items-center justify-between animate-in slide-in-from-bottom-2 border border-transparent dark:border-gray-700 transition-all cursor-pointer active:scale-[0.98] ${tx.type === 'Withdrawal' ? 'hover:border-red-100 dark:hover:border-red-900/30' : 'hover:border-synergy-blue/30'}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-50 dark:border-gray-700 ${tx.type === 'Direct' ? 'bg-blue-50 text-synergy-blue' : tx.type === 'Withdrawal' ? 'bg-red-50 text-red-500' : 'bg-purple-50 text-purple-500'}`}>
                            {tx.type === 'Direct' ? <ShoppingBagIcon size={20} /> : tx.type === 'Withdrawal' ? <ArrowUpRight size={20} /> : <Users size={20} />}
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                                {tx.type === 'Withdrawal' 
                                    ? tx.source.split('|')[0].replace('Withdrawal:', '').trim() 
                                    : (tx.type === 'Direct' ? 'Sales income' : 'Team income')}
                            </h4>
                            <div className="flex items-center space-x-1.5 mt-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${tx.status === 'Paid' || tx.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : (tx.status === 'Pending' || tx.status === 'Waiting') ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                    {tx.status}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tx.type === 'Direct' ? 'bg-blue-50 dark:bg-blue-900/30 text-synergy-blue' : tx.type === 'Withdrawal' ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-500'}`}>
                                    {tx.type}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-sm font-black ${tx.amount > 0 ? (tx.status === 'Pending' ? 'text-gray-400' : 'text-emerald-500') : 'text-red-500'}`}>
                            {tx.amount > 0 ? '+' : ''}฿{Math.abs(tx.amount ?? 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">{tx.date}</p>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};