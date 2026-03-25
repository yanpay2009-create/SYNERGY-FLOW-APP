import React, { useState, useEffect } from 'react';
import { X, UserPlus, Scan, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QRScanner } from './QRScanner';

interface ReferralModalProps {
  onClose: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ onClose }) => {
  const { addReferrer, getPublicProfileByCode, t } = useApp();
  const [referrerCode, setReferrerCode] = useState('');
  const [referrerError, setReferrerError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundReferrer, setFoundReferrer] = useState<any | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (referrerCode.length >= 3) {
        setIsSearching(true);
        const profile = await getPublicProfileByCode(referrerCode);
        setFoundReferrer(profile);
        setIsSearching(false);
      } else {
        setFoundReferrer(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [referrerCode, getPublicProfileByCode]);

  const handleScan = (decodedText: string) => {
    let code = decodedText;
    if (decodedText.includes('/ref/')) {
        code = decodedText.split('/ref/').pop() || decodedText;
    }
    setReferrerCode(code.toUpperCase());
    setShowScanner(false);
  };

  const handleAddReferrer = async () => {
      if (!referrerCode) return;
      setIsLinking(true);
      const result = await addReferrer(referrerCode);
      setIsLinking(false);
      if (result.success) {
          onClose();
          setReferrerError('');
      } else {
          setReferrerError(result.error || "Invalid Referral Code");
      }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6 pointer-events-none">
        <div className="absolute inset-0 pointer-events-auto bg-transparent" onClick={onClose}></div>
        <div className="bg-white dark:bg-gray-950 w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 border border-white/10 overflow-hidden pointer-events-auto">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 z-20"
            >
                <X size={24} />
            </button>
            
            <div className="text-center relative z-10">
                <div className="mb-6 relative">
                    {foundReferrer ? (
                        <div className="animate-in zoom-in duration-500">
                            <div className="w-28 h-28 mx-auto relative">
                                <img 
                                    src={foundReferrer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${foundReferrer.name}`} 
                                    alt="Referrer" 
                                    className="w-28 h-28 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700 relative z-10"
                                />
                                <div className="absolute -bottom-1 -right-1 bg-synergy-blue text-white p-2 rounded-full shadow-lg z-20 animate-bounce">
                                    <UserPlus size={16} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{foundReferrer.name}</h3>
                                <div className="flex items-center justify-center space-x-2 mt-1">
                                    <span className="px-2 py-0.5 bg-synergy-blue/10 text-synergy-blue text-[10px] font-black rounded-full uppercase tracking-widest border border-synergy-blue/20">
                                        {foundReferrer.referralCode}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            <div className="w-24 h-24 mx-auto relative">
                                <div className="w-24 h-24 rounded-full bg-transparent flex items-center justify-center border-4 border-dashed border-gray-200 dark:border-gray-800 shadow-inner overflow-hidden">
                                    {isSearching ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 size={32} className="text-synergy-blue animate-spin mb-1" />
                                            <span className="text-[8px] font-black text-synergy-blue uppercase tracking-widest">{t('ref.searching')}</span>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <UserPlus size={40} className="text-gray-300 dark:text-gray-600" />
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full border-2 border-white dark:border-gray-800"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{t('ref.title')}</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-1 leading-relaxed font-medium max-w-[200px] mx-auto">
                                    {t('ref.desc')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="mb-6 relative group">
                    <input 
                        value={referrerCode}
                        onChange={(e) => {
                            setReferrerCode(e.target.value.toUpperCase());
                            setReferrerError('');
                        }}
                        placeholder={t('ref.placeholder')}
                        className="w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-xl py-5 px-4 text-center font-black text-xl uppercase tracking-[0.2em] text-synergy-blue focus:outline-none focus:ring-4 focus:ring-synergy-blue/10 shadow-inner pr-14"
                    />
                    <button 
                        onClick={() => setShowScanner(true)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-synergy-blue transition-all active:scale-90"
                        title={t('ref.scan_hint')}
                    >
                        <Scan size={20} />
                    </button>
                    {referrerError && <p className="text-red-500 text-xs mt-2 font-black uppercase tracking-widest animate-pulse">{referrerError}</p>}
                </div>

                <div className="flex flex-col space-y-3">
                    <button 
                        onClick={handleAddReferrer}
                        disabled={!referrerCode || isLinking}
                        className="w-full bg-synergy-blue text-white font-black py-4 rounded-2xl shadow-glow active:scale-95 transition flex items-center justify-center space-x-2 h-14 disabled:opacity-50"
                    >
                        {isLinking ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                        <span className="uppercase tracking-widest text-xs">{foundReferrer ? `${t('ref.link_with')} ${foundReferrer.name.split(' ')[0]}` : t('ref.link_btn')}</span>
                    </button>
                    <button 
                        onClick={onClose}
                        className="text-[11px] font-black text-gray-400 hover:text-gray-600 transition uppercase tracking-[0.3em] py-2"
                    >
                        {t('btn.cancel')}
                    </button>
                </div>
            </div>
        </div>

        {showScanner && (
            <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
        )}
    </div>
  );
};
