import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Search, Copy, Check, Megaphone, Tag, Percent, Info, ExternalLink, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Campaigns: React.FC = () => {
  const { campaignAssets, user } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const referralCode = user?.referralCode || 'GUEST';

  const categories = ['All', ...Array.from(new Set(campaignAssets.map(a => a.category).filter(Boolean)))];
  const statuses = ['All', 'Active', 'Upcoming', 'Ended'];

  const filteredCampaigns = campaignAssets.filter(asset => {
    const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) || asset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || asset.category === activeCategory;
    const matchesStatus = activeStatus === 'All' || asset.status === activeStatus;
    return matchesSearch && matchesCategory && matchesStatus && asset.active;
  });

  const handleCopyLink = (id: number) => {
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
    const assetLink = `${baseUrl}/#/campaigns?id=${id}&ref=${referralCode}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(assetLink).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = assetLink;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Fallback copy failed: ', err);
        }
        document.body.removeChild(textArea);
    }
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

  return (
    <div className="pb-24 pt-16 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Campaigns</h1>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
          <Search size={18} className="text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search campaigns..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat, i) => (
            <button 
              key={i}
              onClick={() => setActiveCategory(cat || 'All')}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition ${activeCategory === cat ? 'bg-synergy-blue text-white shadow-glow' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
          {statuses.map((status, i) => (
            <button 
              key={i}
              onClick={() => setActiveStatus(status)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${activeStatus === status ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Megaphone size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold">No campaigns found.</p>
          </div>
        ) : (
          filteredCampaigns.map(campaign => (
            <div key={campaign.id} className="bg-white dark:bg-gray-800 rounded-[24px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="h-32 w-full relative">
                <img src={campaign.image || undefined} alt={campaign.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                  <h3 className="text-white font-bold text-lg leading-tight">{campaign.title}</h3>
                  {campaign.status && (
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${campaign.status === 'Active' ? 'bg-green-500 text-white' : campaign.status === 'Upcoming' ? 'bg-amber-500 text-white' : 'bg-gray-500 text-white'}`}>
                      {campaign.status}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{campaign.description}</p>
                
                <div className="grid grid-cols-2 gap-2">
                  {campaign.category && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl flex items-center space-x-2">
                      <Tag size={14} className="text-synergy-blue" />
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold">Category</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{campaign.category}</p>
                      </div>
                    </div>
                  )}
                  {campaign.commission && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl flex items-center space-x-2">
                      <Percent size={14} className="text-pink-500" />
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold">Commission</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{campaign.commission}</p>
                      </div>
                    </div>
                  )}
                  {campaign.adFormat && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl flex items-center space-x-2">
                      <ExternalLink size={14} className="text-purple-500" />
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold">Ad Format</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{campaign.adFormat}</p>
                      </div>
                    </div>
                  )}
                  {campaign.conditions && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl flex items-center space-x-2">
                      <Info size={14} className="text-amber-500" />
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold">Conditions</p>
                        <p className="text-[10px] font-bold text-gray-900 dark:text-white line-clamp-1">{campaign.conditions}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex space-x-2">
                  <button 
                    onClick={() => handleCopyLink(campaign.id)}
                    className="flex-1 bg-synergy-blue text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 hover:bg-synergy-dark transition active:scale-[0.98]"
                  >
                    {copiedId === campaign.id ? (
                      <>
                        <Check size={16} />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  {campaign.image && (
                    <button 
                      onClick={() => handleDownload(campaign.image, campaign.title)}
                      className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition active:scale-[0.98]"
                      title="Download Asset"
                    >
                      <Download size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
