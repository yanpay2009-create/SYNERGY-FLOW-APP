import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Wallet, 
  Plus, 
  ShieldCheck, 
  Lock, 
  X, 
  CheckCircle2, 
  Loader2, 
  Landmark, 
  Check,
  Download,
  Share2,
  AlertCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CommissionTransaction } from '../types';
import html2canvas from 'html2canvas';

export const Withdraw: React.FC = () => {
  const { user, bankAccounts, selectedBankId, selectBank, withdrawFunds, kycStatus, isSecurityUnlocked, setIsSecurityUnlocked, updateUserSecurity, t, language, systemSettings, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const slipRef = useRef<HTMLDivElement>(null);
  
  const [amount, setAmount] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<number | null>(selectedBankId);
  
  // View State: 'form' | 'summary' | 'slip'
  const [viewMode, setViewMode] = useState<'form' | 'summary' | 'slip'>('form');

  // PIN Gate States
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinFlow, setPinFlow] = useState<'verify' | 'setup' | 'confirm' | 'recovery'>('verify');
  const [tempPin, setTempPin] = useState('');
  const [showPinSuccess, setShowPinSuccess] = useState(false);

  // Process States
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<CommissionTransaction | null>(null);
  const [animatedBalance, setAnimatedBalance] = useState(0);

  useEffect(() => {
    const balance = user?.walletBalance || 0;
    const duration = 1000;
    const frameRate = 60;
    const totalFrames = Math.round(duration / (1000 / frameRate));
    
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedBalance(balance * easeOut);
      if (frame === totalFrames) clearInterval(timer);
    }, 1000 / frameRate);

    return () => clearInterval(timer);
  }, [user?.walletBalance]);

  useEffect(() => {
    if (!isSecurityUnlocked) {
      const hasPin = user?.pin && user.pin.trim() !== "";
      setPinFlow(hasPin ? 'verify' : 'setup');
      setIsVerifyingPin(true);
      setPin('');
      setTempPin('');
      setPinError(false);
    }
  }, [isSecurityUnlocked, user.pin]);

  // Updated Business Rules
  const WITHDRAWAL_FEE = 35.00;
  
  const getTaxRate = () => {
    if (user?.hasWorkPermit) return 0.03;
    if (user?.kycDocumentType === 'ThaiID') return 0.03;
    if (user?.kycDocumentType === 'Passport') return 0.15;
    return 0.15; // Default
  };

  const WITHHOLDING_TAX_RATE = getTaxRate();

  useEffect(() => {
    if (location.state?.transaction) {
      setLastTransaction(location.state.transaction);
      setViewMode('summary');
    }
  }, [location.state]);

  if (!user) return null;

  const handleKycClick = () => {
    if (isSecurityUnlocked) { navigate('/kyc'); return; }
    if (!user.pin || user.pin.trim() === "") setPinFlow('setup');
    else setPinFlow('verify');
    setIsVerifyingPin(true);
    setPin('');
    setPinError(false);
  };

  const handlePinInput = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setPin(cleanValue);
    setPinError(false);

    if (cleanValue.length === 6) {
      if (pinFlow === 'verify') {
        if (cleanValue === user.pin) {
          setIsSecurityUnlocked(true);
          setShowPinSuccess(true);
          setTimeout(() => { setShowPinSuccess(false); setIsVerifyingPin(false); }, 1000);
        } else { 
          setPinError(true); 
          setTimeout(() => setPin(''), 500); 
        }
      } else if (pinFlow === 'setup') {
        setTempPin(cleanValue);
        setTimeout(() => { setPin(''); setPinFlow('confirm'); }, 300);
      } else if (pinFlow === 'confirm') {
        if (cleanValue === tempPin) {
          updateUserSecurity('pin', cleanValue);
          setIsSecurityUnlocked(true);
          setShowPinSuccess(true);
          setTimeout(() => { setShowPinSuccess(false); setIsVerifyingPin(false); }, 1200);
        } else { 
          setPinError(true); 
          setTimeout(() => { setPin(''); setTempPin(''); setPinFlow('setup'); }, 500); 
        }
      }
    }
  };

  const grossAmount = parseFloat(amount) || 0;
  const taxAmount = grossAmount * WITHHOLDING_TAX_RATE;
  const netAmount = grossAmount - WITHDRAWAL_FEE - taxAmount;
  const isValidAmount = grossAmount >= 500 && grossAmount <= 50000 && grossAmount <= user.walletBalance && netAmount > 0;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kycStatus !== 'Verified') { handleKycClick(); return; }
    if (!selectedBank) { showToast({ message: "Please select a bank account.", type: 'error' }); return; }
    if (grossAmount < 500) { showToast({ message: "Min withdrawal is ฿500.", type: 'error' }); return; }
    if (grossAmount > 50000) { showToast({ message: "Max withdrawal is ฿50,000.", type: 'error' }); return; }
    if (grossAmount > user.walletBalance) { showToast({ message: "Insufficient balance.", type: 'error' }); return; }
    if (!isValidAmount) { showToast({ message: "Invalid withdrawal amount.", type: 'error' }); return; }
    
    setIsProcessing(true);
    // Simulate delay for UX
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const transaction = await withdrawFunds(grossAmount, selectedBank);
    setIsProcessing(false);
    
    if (transaction) {
        setLastTransaction(transaction);
        setViewMode('summary');
    }
  };

  const parseWithdrawalInfo = (source: string) => {
    if (!source || !source.includes('|')) return { name: 'N/A', bank: 'N/A', account: 'N/A' };
    const parts = source.replace('Withdrawal:', '').split('|');
    return {
        name: parts[0]?.trim() || 'N/A',
        bank: parts[1]?.trim() || 'N/A',
        account: parts[2]?.replace('ACC:', '').trim() || 'N/A'
    };
  };

  const handleDownloadSlip = async () => {
    if (slipRef.current) {
        try {
            const canvas = await html2canvas(slipRef.current, { 
                scale: 3, 
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false
            });
            const link = document.createElement('a');
            link.href = canvas.toDataURL("image/png");
            link.download = `Synergy-Slip-${lastTransaction?.id}.png`;
            link.click();
        } catch (error) {
            console.error('Failed to generate slip image:', error);
            showToast({ message: 'Could not generate slip image. Please try again or take a screenshot.', type: 'error' });
        }
    }
  };

  const handleForgotPin = () => {
    setPinFlow('recovery');
  };

  // --- RENDER 1: TRANSACTION SUMMARY (COMPACT) ---
  if (viewMode === 'summary' && lastTransaction) {
    const info = parseWithdrawalInfo(lastTransaction.source);
    const amt = Math.abs(lastTransaction.amount);
    const tax = amt * WITHHOLDING_TAX_RATE;
    const net = amt - WITHDRAWAL_FEE - tax;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans pb-10 flex flex-col">
            <div className="flex items-center px-4 pt-16 mb-2">
                <button onClick={() => navigate('/commissions')} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
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
                    Withdrawal
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-8 text-center uppercase tracking-widest">
                    {lastTransaction.status === 'Completed' || lastTransaction.status === 'Paid' ? 'Transaction Completed' : 'Processing Request'}
                </p>

                <div className="w-full bg-white dark:bg-gray-900 rounded-[28px] p-6 shadow-soft border border-gray-100 dark:border-gray-800 space-y-5">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</span>
                        <span className="text-xl font-black text-gray-900 dark:text-white">฿{(amt ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    
                    <div className="h-px bg-gray-50 dark:bg-gray-800"></div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Bank</span>
                            <span className="text-xs font-black text-gray-900 dark:text-white">{info.bank}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Account</span>
                            <span className="text-xs font-black text-gray-900 dark:text-white">{info.account}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Fees</span>
                            <span className="text-xs font-black text-red-500">-฿{(WITHDRAWAL_FEE).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Tax ({Math.round(WITHHOLDING_TAX_RATE * 100)}%)</span>
                            <span className="text-xs font-black text-red-500">-฿{(tax ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>

                    <div className="bg-synergy-blue/5 dark:bg-synergy-blue/10 rounded-xl p-3 flex justify-between items-center border border-synergy-blue/10">
                        <span className="text-[10px] font-black text-synergy-blue uppercase tracking-widest">Net Total</span>
                        <span className="text-lg font-black text-synergy-blue">฿{(net ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                </div>
            </div>

            <div className="px-6 space-y-3">
                <button 
                    onClick={() => setViewMode('slip')}
                    className="w-full h-14 bg-synergy-blue text-white rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-glow active:scale-95 transition flex items-center justify-center space-x-2"
                >
                    <Download size={16} />
                    <span>View E-Slip</span>
                </button>
                <button 
                    onClick={() => navigate('/home')}
                    className="w-full h-14 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-full font-black uppercase tracking-[0.2em] text-[10px] border border-gray-100 dark:border-gray-800 active:scale-95 transition"
                >
                    Done
                </button>
            </div>
        </div>
    );
  }

  // --- RENDER 2: COMPACT E-SLIP (REDESIGNED) ---
  if (viewMode === 'slip' && lastTransaction) {
    const info = parseWithdrawalInfo(lastTransaction.source);
    const amt = Math.abs(lastTransaction.amount);
    const tax = amt * WITHHOLDING_TAX_RATE;
    const net = amt - WITHDRAWAL_FEE - tax;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 font-sans pb-10">
            <div className="flex items-center px-4 pt-6 mb-4">
                <button onClick={() => setViewMode('summary')} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold ml-2 text-gray-900 dark:text-white tracking-tight">E-Slip</h1>
            </div>

            <div className="max-w-md mx-auto px-6">
                <div 
                    ref={slipRef} 
                    className="bg-white dark:bg-gray-900 rounded-[32px] overflow-hidden shadow-xl relative border border-white dark:border-gray-800 animate-in zoom-in-95 duration-500"
                >
                    {systemSettings.slipBackground && (
                        <img 
                            src={systemSettings.slipBackground || undefined} 
                            alt="Background" 
                            className="absolute inset-0 w-full h-full object-cover opacity-20" 
                            referrerPolicy="no-referrer"
                        />
                    )}
                    <div className="p-6 relative z-10">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-tighter uppercase">
                                Synergy <span className="text-synergy-blue">Flow</span>
                            </h2>
                            {systemSettings.logo ? (
                                <img 
                                    src={systemSettings.logo || undefined} 
                                    alt="Logo" 
                                    className="h-8 w-auto rounded-lg object-contain bg-transparent" 
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                                    <span className="text-[8px] font-black uppercase tracking-widest">Settled</span>
                                </div>
                            )}
                        </div>

                        {/* Transaction Details */}
                        <div className="space-y-6 mb-6">
                            <div className="flex flex-col items-center py-3 border-y border-gray-50 dark:border-gray-800/50">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Net Amount</span>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">฿{(net ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Ref ID</span>
                                        <p className="text-[10px] font-black text-gray-900 dark:text-white font-mono">SF-{lastTransaction.id.toString().slice(-8).toUpperCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Date</span>
                                        <p className="text-[10px] font-black text-gray-900 dark:text-white">
                                            {new Date(lastTransaction.id).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800/50">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center text-synergy-blue shadow-sm">
                                            <Landmark size={16} />
                                        </div>
                                        <div>
                                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest block">Destination</span>
                                            <p className="text-xs font-black text-gray-900 dark:text-white">{info.bank}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                                        <div className="flex justify-between text-[9px]">
                                            <span className="font-bold text-gray-400">Name</span>
                                            <span className="font-black text-gray-900 dark:text-white uppercase">{info.name}</span>
                                        </div>
                                        <div className="flex justify-between text-[9px]">
                                            <span className="font-bold text-gray-400">Account</span>
                                            <span className="font-black text-gray-900 dark:text-white">{info.account}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 px-1">
                                <div className="flex justify-between text-[8px]">
                                    <span className="font-bold text-gray-400 uppercase tracking-tighter">Gross Amount</span>
                                    <span className="font-bold text-gray-600 dark:text-gray-300">฿{(amt ?? 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[8px]">
                                    <span className="font-bold text-gray-400 uppercase tracking-tighter">Processing Fee</span>
                                    <span className="font-bold text-red-500">-฿{(WITHDRAWAL_FEE).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[8px]">
                                    <span className="font-bold text-gray-400 uppercase tracking-tighter">Withholding Tax ({Math.round(WITHHOLDING_TAX_RATE * 100)}%)</span>
                                    <span className="font-bold text-red-500">-฿{(tax ?? 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col items-center pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                             <ShieldCheck size={16} className="text-emerald-500 mb-1" />
                             <p className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Verified Electronic Receipt</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleDownloadSlip}
                        className="h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition"
                    >
                        <Download size={16} />
                        <span>Save</span>
                    </button>
                    <button 
                        onClick={() => navigate('/commissions')}
                        className="h-14 bg-white dark:bg-gray-800 text-synergy-blue border border-synergy-blue/20 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition shadow-sm"
                    >
                        <Share2 size={16} />
                        <span>Share</span>
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // --- RENDER 3: WITHDRAWAL FORM ---
  return (
    <div className="pb-24 pt-12 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 relative font-sans">
      {isProcessing && (
          <div className="fixed inset-0 z-[120] bg-white/90 dark:bg-gray-950/90 backdrop-blur-md flex flex-col items-center justify-center">
              <Loader2 size={64} className="text-synergy-blue animate-spin" />
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-4 tracking-widest">Processing Transaction...</p>
          </div>
      )}

      {isVerifyingPin && (
          <div className="fixed inset-0 z-[110] bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-6 transition-all duration-300">
              <button onClick={() => navigate(-1)} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400"><X size={20} /></button>
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

              {pinFlow === 'verify' && (
                  <button 
                    onClick={handleForgotPin}
                    className="mb-8 flex items-center space-x-2 text-[10px] font-black text-synergy-blue uppercase tracking-widest hover:underline transition"
                  >
                    <RefreshCw size={12} />
                    <span>Forgot Security PIN?</span>
                  </button>
              )}

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

      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 pt-16 pb-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">Withdraw Funds</h1>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6 border border-transparent dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-synergy-blue flex items-center justify-center">
                    <Wallet size={16} />
                </div>
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Withdrawal</span>
            </div>
            <h2 className="text-xl font-black text-synergy-blue">฿{Math.floor(animatedBalance ?? 0).toLocaleString()}</h2>
            <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">Available Balance</p>
      </div>

      {kycStatus !== 'Verified' && (
          <div 
            onClick={handleKycClick}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-2xl flex items-center space-x-3 cursor-pointer active:scale-[0.98] transition animate-in slide-in-from-top-2"
          >
              <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-500 shrink-0">
                  <AlertCircle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-black text-red-700 dark:text-red-400 uppercase tracking-tight">KYC Required</h4>
                  <p className="text-[10px] text-red-600 dark:text-red-500/80 font-medium truncate">Verify identity to enable withdrawals.</p>
              </div>
              <button className="flex items-center space-x-1 text-[9px] font-black uppercase text-red-700 dark:text-red-400 bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-800 shrink-0">
                  <span>Verify</span>
                  <ChevronRight size={10} />
              </button>
          </div>
      )}

      <form onSubmit={handleWithdraw}>
        <div className="mb-8">
            <label className="text-[10px] font-black text-gray-400 uppercase block mb-3 ml-1">Payout Destination</label>
            {bankAccounts.length === 0 ? (
                <button 
                    type="button" 
                    onClick={() => kycStatus === 'Verified' ? navigate('/bank-accounts') : handleKycClick()} 
                    className="w-full py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 rounded-3xl flex flex-col items-center justify-center space-y-2 hover:bg-white transition"
                >
                   <Plus size={20} />
                   <span className="text-xs font-black uppercase tracking-widest">Link Bank Account</span>
                </button>
            ) : (
                <div className="space-y-3">
                    {bankAccounts.map(bank => (
                        <div 
                            key={bank.id} 
                            onClick={() => {
                                setSelectedBank(bank.id);
                                selectBank(bank.id);
                            }} 
                            className={`p-5 rounded-[24px] border transition-all cursor-pointer flex justify-between items-center ${selectedBank === bank.id ? 'bg-blue-50 dark:bg-blue-900/20 border-synergy-blue shadow-sm' : 'bg-white dark:bg-gray-800 border-transparent shadow-soft'}`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedBank === bank.id ? 'bg-synergy-blue text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                    <Landmark size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-800 dark:text-white">{bank.bankName}</p>
                                    <p className="text-xs text-gray-500 font-mono">{bank.accountNumber.replace(/.(?=.{4})/g, '*')}</p>
                                </div>
                            </div>
                            {selectedBank === bank.id && <CheckCircle2 size={20} className="text-synergy-blue" />}
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="mb-10">
             <label className="text-[10px] font-black text-gray-400 uppercase block mb-3 ml-2">Amount to withdraw</label>
             <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft mb-4 flex items-center">
                 <span className="text-xl font-black text-gray-300 mr-3">฿</span>
                 <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-transparent text-xl font-black text-gray-900 dark:text-white focus:outline-none" placeholder="0.00" />
             </div>
             <div className="flex space-x-2">
                 {[500, 1000, 5000].map(val => (
                     <button key={val} type="button" onClick={() => setAmount(val.toString())} className="flex-1 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full text-[10px] font-black uppercase text-gray-500">฿{val}</button>
                 ))}
                 <button type="button" onClick={() => setAmount(user.walletBalance.toString())} className="flex-1 py-3 bg-synergy-blue/10 text-synergy-blue rounded-full text-[10px] font-black uppercase">Max</button>
             </div>
        </div>

        <button 
            type="submit" 
            disabled={!selectedBank || !isValidAmount || kycStatus !== 'Verified' || isProcessing} 
            className={`w-full h-16 rounded-full font-black text-xs text-white flex items-center justify-center space-x-3 transition uppercase tracking-[0.2em] ${(!selectedBank || !isValidAmount || kycStatus !== 'Verified' || isProcessing) ? 'bg-gray-200 dark:bg-gray-800 text-gray-400' : 'bg-synergy-blue'}`}
        >
            <ShieldCheck size={20} />
            <span>Confirm Payout</span>
        </button>
      </form>

      <div className="mt-8 p-5 bg-gray-100 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
              <AlertCircle size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Withdrawal Terms</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      Withdrawal Limit: Min ฿500 - Max ฿50,000 per transaction.
                      Processing Time: Funds will be transferred to your account within 1-3 business days.
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
};