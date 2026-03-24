import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, MessageCircle, Phone, Copy, Check, UserCheck, UserPlus, Search, X, Scan, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { UserTier } from '../types';
import { QRScanner } from '../components/QRScanner';

export const ReferrerInfo: React.FC = () => {
  const { referrer, user, addReferrer, language, showToast } = useApp();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (decodedText: string) => {
    let code = decodedText;
    if (decodedText.includes('/ref/')) {
        code = decodedText.split('/ref/').pop() || decodedText;
    }
    setInputCode(code.toUpperCase());
    setShowScanner(false);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmitCode = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputCode) return;
      
      const result = await addReferrer(inputCode);
      if (result.success) {
          setError('');
      } else {
          if (language === 'th') {
              if (result.error === 'Cannot refer yourself') {
                  setError("ไม่สามารถใช้รหัสของตัวเองได้");
              } else if (result.error === 'Referrer code not found') {
                  setError("ไม่พบรหัสผู้แนะนำนี้");
              } else {
                  setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
              }
          } else {
              setError(result.error || "Referrer code not found.");
          }
      }
  };

  if (!user?.referrerCode) {
    return (
      <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <div className="p-4 flex items-center border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md z-10 -mx-4 pt-10 pb-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold ml-2 text-gray-900 dark:text-white tracking-tight">My Referrer</h1>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-900 rounded-[40px] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 text-center">
          <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 text-synergy-blue rounded-full flex items-center justify-center mx-auto mb-8">
            <UserPlus size={48} strokeWidth={1.5} />
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Who Invited You?</h2>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-10 leading-relaxed font-medium px-4">
            Link your account to your referrer to unlock team support and bonuses.
          </p>

          <form onSubmit={handleSubmitCode} className="w-full space-y-4">
            <div className="relative group">
              <input 
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="ENTER CODE"
                className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-[24px] py-5 px-4 text-center font-bold text-lg uppercase tracking-wider text-gray-400 focus:text-synergy-blue focus:border-synergy-blue/30 focus:outline-none transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowScanner(true)}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-synergy-blue transition-all active:scale-90"
                title="Scan QR Code"
              >
                <Scan size={24} />
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-xs font-black uppercase tracking-widest animate-shake">
                {error}
              </p>
            )}

            <button 
              type="submit"
              disabled={!inputCode}
              className="w-full bg-[#87E1FF] hover:bg-[#6ED8FF] text-white font-black py-5 rounded-[24px] shadow-lg shadow-blue-200/50 active:scale-95 transition flex items-center justify-center space-x-3 h-16 disabled:opacity-50 disabled:shadow-none"
            >
              <Search size={24} strokeWidth={2.5} />
              <span className="text-lg font-bold">Find Referrer</span>
            </button>
          </form>
        </div>
        
        {showScanner && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            <div className="p-4 flex items-center justify-between text-white z-10">
              <button onClick={() => setShowScanner(false)} className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                <X size={24} />
              </button>
              <h2 className="font-black uppercase tracking-widest text-sm">Scan Referrer QR</h2>
              <div className="w-10"></div>
            </div>
            <div className="flex-1 relative">
              <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors" lang={language}>
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 pt-10 pb-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-bold ml-2 text-gray-900 dark:text-white tracking-tight">My Referrer</h1>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[32px] p-8 shadow-soft dark:shadow-none text-center relative overflow-hidden mb-6 animate-in zoom-in-95 duration-300 border border-transparent dark:border-gray-700">
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50 dark:from-blue-900/20 to-transparent z-0"></div>
         
         <div className="relative z-10">
            <div className="w-24 h-24 rounded-full p-1 bg-gray-100 dark:bg-gray-700 mx-auto mb-4">
                <img src={referrer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.referrerCode}`} alt={referrer?.name || 'Referrer'} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-800" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{referrer?.name || 'Linked Referrer'}</h2>
            <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-synergy-blue rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800 mb-6 uppercase tracking-wider">
                {referrer?.tier || 'Member'} Leader
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => window.open(`tel:${referrer.phone}`)}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl hover:bg-green-50 dark:hover:bg-emerald-900/20 hover:text-green-600 transition group border border-transparent dark:border-gray-700"
                >
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-gray-600 dark:text-gray-400 group-hover:text-green-600 mb-2 transition-colors">
                        <Phone size={20} />
                    </div>
                    <span className="text-xs font-bold dark:text-gray-300">Call Now</span>
                </button>

                <button 
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl hover:bg-green-50 dark:hover:bg-emerald-900/20 hover:text-green-600 transition group border border-transparent dark:border-gray-700"
                >
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-gray-600 dark:text-gray-400 group-hover:text-green-600 mb-2 transition-colors">
                        <MessageCircle size={20} />
                    </div>
                    <span className="text-xs font-bold dark:text-gray-300">Line Chat</span>
                </button>
            </div>
         </div>
      </div>

      <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-2 mb-3 tracking-widest">Contact Identity</h3>
      
      <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-synergy-blue rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold">ID</span>
                  </div>
                  <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Referral Code</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{referrer.code}</p>
                  </div>
              </div>
              <button onClick={() => handleCopy(referrer.code, 'code')} className="p-2 text-gray-400 hover:text-synergy-blue transition-colors">
                 {copied === 'code' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-10 h-10 bg-green-50 dark:bg-emerald-900/20 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                      <MessageCircle size={20} />
                  </div>
                  <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Line Identification</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{referrer.lineId}</p>
                  </div>
              </div>
              <button onClick={() => handleCopy(referrer.lineId, 'line')} className="p-2 text-gray-400 hover:text-synergy-blue transition-colors">
                 {copied === 'line' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl flex items-center justify-center shrink-0">
                      <Phone size={20} />
                  </div>
                  <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Phone Number</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{referrer.phone}</p>
                  </div>
              </div>
              <button onClick={() => handleCopy(referrer.phone, 'phone')} className="p-2 text-gray-400 hover:text-synergy-blue transition-colors">
                 {copied === 'phone' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
          </div>
      </div>

      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="p-4 flex items-center justify-between text-white z-10">
            <button onClick={() => setShowScanner(false)} className="p-2 bg-white/10 rounded-full backdrop-blur-md">
              <X size={24} />
            </button>
            <h2 className="font-black uppercase tracking-widest text-sm">Scan Referrer QR</h2>
            <div className="w-10"></div>
          </div>
          <div className="flex-1 relative">
            <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
