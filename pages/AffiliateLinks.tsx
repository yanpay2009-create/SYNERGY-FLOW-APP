import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Copy, Share2, Check, Hash, UserPlus, Search, X, Sparkles, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AffiliateLinks: React.FC = () => {
  const { user, referrer, addReferrer, campaignAssets } = useApp();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [assetCopied, setAssetCopied] = useState<number | null>(null);

  // Referrer Modal State - Now starts as false to let user see the page first
  const [showReferrerModal, setShowReferrerModal] = useState(false);
  const [referrerCode, setReferrerCode] = useState('');
  const [referrerError, setReferrerError] = useState('');

  const referralCode = user?.referralCode || 'GUEST';
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
  const affiliateLink = `${baseUrl}/#/ref/${referralCode}`;
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(affiliateLink)}&color=000000&bgcolor=FFFFFF`;

  // Helper to ensure referrer exists
  const checkReferrerAction = (action: () => void) => {
    if (!referrer) {
      setShowReferrerModal(true);
      return;
    }
    action();
  };

  const copyToClipboard = () => {
    checkReferrerAction(() => {
        navigator.clipboard.writeText(affiliateLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyCodeToClipboard = () => {
    checkReferrerAction(() => {
        navigator.clipboard.writeText(referralCode);
        setCodeCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    checkReferrerAction(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join Synergy Flow',
                    text: `Start earning with Synergy Flow! Use my code: ${referralCode}`,
                    url: affiliateLink,
                });
            } catch (error) {
                console.log('Error sharing', error);
            }
        } else {
            copyToClipboard();
        }
    });
  };

  const handleGetAssetLink = (id: number) => {
    checkReferrerAction(() => {
        const assetLink = `${baseUrl}/#/campaigns?id=${id}&ref=${referralCode}`;
        navigator.clipboard.writeText(assetLink);
        setAssetCopied(id);
        setTimeout(() => setAssetCopied(null), 2000);
    });
  };

  const handleDownload = (imageUrl: string, title: string) => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title.replace(/\s+/g, '_')}_asset.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddReferrer = async () => {
      if (!referrerCode) return;
      const result = await addReferrer(referrerCode);
      if (result.success) {
          setShowReferrerModal(false);
          setReferrerError('');
      } else {
          setReferrerError(result.error || "Invalid Referral Code");
      }
  };

  const activeAssets = campaignAssets.filter(a => a.active);

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 py-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">Affiliate Links</h1>
          </div>
        </div>
      </div>

      {/* Main Content (Interactive, triggers modal on click if no referrer) */}
      <div>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-soft dark:shadow-none border border-transparent dark:border-gray-700 text-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Scan & Join</h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">Your personal referral QR Code</p>
            
            <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 inline-block mb-6">
               <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 object-contain" />
            </div>
            
            <div className="mb-4">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2 text-left ml-1">My Referral Code</label>
              <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 flex items-center justify-between border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center space-x-2">
                  <Hash size={16} className="text-synergy-blue" />
                  <span className="text-lg font-black text-gray-900 dark:text-white tracking-widest">{referralCode}</span>
                </div>
                <button onClick={copyCodeToClipboard} className="text-synergy-blue hover:text-synergy-dark transition bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-blue-50 dark:border-gray-700">
                  {codeCopied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2 text-left ml-1">Shareable Link</label>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 flex items-center justify-between border border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate mr-2 flex-1 text-left">{affiliateLink}</span>
                <button onClick={copyToClipboard} className="text-synergy-blue hover:text-synergy-dark transition bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                  {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            <button 
              onClick={handleShare}
              className="w-full bg-synergy-blue text-white font-bold py-3.5 rounded-xl shadow-glow flex items-center justify-center space-x-2 active:scale-95 transition hover:bg-synergy-dark"
            >
              <Share2 size={18} />
              <span>Share Everything</span>
            </button>
          </div>

          <div className="flex justify-between items-center mb-4 ml-1">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">Campaign Assets</h3>
            <button 
              onClick={() => navigate('/campaigns')}
              className="text-[10px] font-black text-synergy-blue uppercase tracking-widest hover:underline"
            >
              Browse All
            </button>
          </div>
          <div className="space-y-4">
            {activeAssets.length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-xs italic">No campaign assets available at this time.</p>
            ) : (
                activeAssets.map((asset) => (
                    <div key={asset.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-center space-x-4 border border-gray-50 dark:border-gray-700 transition-all">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden shrink-0">
                            <img src={asset.image || undefined} alt={asset.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{asset.title}</h4>
                            <p className="text-[10px] text-gray-400 font-medium line-clamp-1">{asset.description}</p>
                        </div>
                        <div className="flex space-x-2 shrink-0">
                          <button 
                            onClick={() => handleGetAssetLink(asset.id)}
                            className={`font-bold text-[10px] uppercase tracking-wider border px-3 py-1.5 rounded-full transition flex items-center space-x-1 ${assetCopied === asset.id ? 'bg-green-50 border-green-200 text-green-600' : 'border-synergy-blue text-synergy-blue hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                          >
                              {assetCopied === asset.id ? (
                                  <>
                                     <span>Copied</span>
                                     <Check size={12} />
                                  </>
                              ) : (
                                  <span>Get Link</span>
                              )}
                          </button>
                          {asset.image && (
                            <button 
                              onClick={() => handleDownload(asset.image, asset.title)}
                              className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                              <Download size={14} />
                            </button>
                          )}
                        </div>
                    </div>
                ))
            )}
          </div>
      </div>

      {/* REFERRER REQUIRED MODAL - Standardized Premium Style */}
      {showReferrerModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowReferrerModal(false)}></div>
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 border border-white/10 overflow-hidden">
                <button 
                    onClick={() => setShowReferrerModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 z-20"
                >
                    <X size={24} />
                </button>
                
                <div className="text-center relative z-10">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-synergy-blue rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100 dark:border-blue-800">
                        <UserPlus size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Referral Code</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed font-medium">
                        To access your affiliate tools and QR code, you must first link your account to a referrer.
                    </p>
                    
                    <div className="mb-6 relative">
                        <input 
                            value={referrerCode}
                            onChange={(e) => {
                                setReferrerCode(e.target.value.toUpperCase());
                                setReferrerError('');
                            }}
                            placeholder="EX. BOSS001"
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl py-5 px-4 text-center font-black text-2xl uppercase tracking-[0.2em] text-synergy-blue placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-synergy-blue/10 shadow-inner"
                        />
                        {referrerError && <p className="text-red-500 text-xs mt-2 font-black uppercase tracking-widest animate-pulse">{referrerError}</p>}
                    </div>

                    <div className="flex flex-col space-y-3">
                        <button 
                            onClick={handleAddReferrer}
                            disabled={!referrerCode}
                            className="w-full bg-synergy-blue text-white font-black py-4 rounded-2xl shadow-glow active:scale-95 transition flex items-center justify-center space-x-2 h-14"
                        >
                            <Sparkles size={20} />
                            <span className="uppercase tracking-widest text-xs">Link Referrer</span>
                        </button>
                        <button 
                            onClick={() => setShowReferrerModal(false)}
                            className="text-[11px] font-black text-gray-400 hover:text-gray-600 transition uppercase tracking-[0.3em] py-2"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};