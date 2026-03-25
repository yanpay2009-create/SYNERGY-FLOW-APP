
import React, { useState } from 'react';
import { ArrowLeft, Plus, Megaphone, Trash2, Camera, Type, Save, FileText, Eye, EyeOff, Tag, Percent, ExternalLink, Info, Copy, Check, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const AdminCampaignAssetManage: React.FC = () => {
  const navigate = useNavigate();
  const { campaignAssets, updateCampaignAsset, deleteCampaignAsset, addCampaignAsset, user, showToast } = useApp();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const referralCode = user?.referralCode || 'ADMIN';

  const handleCopyLink = (id: number) => {
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
    const assetLink = `${baseUrl}/#/campaigns?id=${id}&ref=${referralCode}`;
    navigator.clipboard.writeText(assetLink).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, assetId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast({ message: "File is too large. Max 2MB allowed for upload.", type: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        
        // Resize image before uploading
        const img = new Image();
        img.src = base64;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Use JPEG compression to significantly reduce size
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          updateCampaignAsset(assetId, { image: resizedBase64 });
        };
        
        // Reset input value to allow re-uploading the same file
        event.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNew = () => {
    addCampaignAsset({
        title: "New Seasonal Campaign",
        description: "High performance marketing kit for affiliates.",
        image: "",
        active: true
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
        deleteCampaignAsset(id);
    }
  };

  const handleSeedData = () => {
    const samples = [
        {
            title: "Synergy Flow Launch",
            description: "Official launch banner for Synergy Flow. Use this to invite new members.",
            image: "https://picsum.photos/seed/synergy1/800/600",
            active: true,
            category: "Banner",
            commission: "10-30%",
            status: "Active",
            adFormat: "1080x1080",
            conditions: "Must include your referral link."
        },
        {
            title: "Summer Special Promo",
            description: "Limited time offer for summer products. High conversion rate.",
            image: "https://picsum.photos/seed/summer/800/600",
            active: true,
            category: "Promotion",
            commission: "20%",
            status: "Upcoming",
            adFormat: "Story (9:16)",
            conditions: "Active from June 1st."
        }
    ];
    samples.forEach(s => addCampaignAsset(s as any));
    showToast({ message: "Sample assets added!", type: 'success' });
  };

  return (
    <div className="pb-24 pt-16 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400">
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Campaign Assets</h1>
        </div>
        <div className="flex items-center space-x-2">
            <button 
                onClick={handleSeedData}
                className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full transition"
                title="Seed Sample Data"
            >
                <RotateCcw size={20} />
            </button>
            <button 
                onClick={handleAddNew} 
                className="p-2 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 active:scale-90 transition-all"
            >
                <Plus size={20} />
            </button>
        </div>
      </div>

      <div className="space-y-6">
          {campaignAssets.map((asset) => (
              <div key={asset.id} className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-transparent dark:border-gray-700 animate-in fade-in">
                  <div className="aspect-square w-24 h-24 mx-auto mt-4 rounded-2xl overflow-hidden relative group border border-gray-100 dark:border-gray-700">
                      <img src={asset.image || undefined} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <label className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg text-white cursor-pointer hover:bg-white/40 transition">
                              <Camera size={16} />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, asset.id)}
                              />
                          </label>
                      </div>
                  </div>
                  
                  <div className="p-4">
                      <div className="space-y-3">
                          <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 p-2.5 rounded-xl border border-gray-100 dark:border-gray-600">
                              <Type size={16} className="text-gray-400 shrink-0" />
                              <input 
                                defaultValue={asset.title || ''} 
                                onBlur={(e) => updateCampaignAsset(asset.id, { title: e.target.value })}
                                className="bg-transparent text-sm font-bold w-full focus:outline-none dark:text-white" 
                                placeholder="Asset Title"
                              />
                          </div>
                          <div className="flex items-start space-x-3 bg-gray-50 dark:bg-gray-700 p-2.5 rounded-xl border border-gray-100 dark:border-gray-600">
                              <FileText size={16} className="text-gray-400 shrink-0 mt-1" />
                              <textarea 
                                defaultValue={asset.description || ''} 
                                onBlur={(e) => updateCampaignAsset(asset.id, { description: e.target.value })}
                                className="bg-transparent text-xs w-full focus:outline-none dark:text-white h-12 resize-none" 
                                placeholder="Asset description..."
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-xl border border-gray-100 dark:border-gray-600">
                                  <Tag size={14} className="text-gray-400 shrink-0" />
                                  <input 
                                    defaultValue={asset.category || ''} 
                                    onBlur={(e) => updateCampaignAsset(asset.id, { category: e.target.value })}
                                    className="bg-transparent text-[10px] font-bold w-full focus:outline-none dark:text-white" 
                                    placeholder="Category"
                                  />
                              </div>
                              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-xl border border-gray-100 dark:border-gray-600">
                                  <Percent size={14} className="text-gray-400 shrink-0" />
                                  <input 
                                    defaultValue={asset.commission || ''} 
                                    onBlur={(e) => updateCampaignAsset(asset.id, { commission: e.target.value })}
                                    className="bg-transparent text-[10px] font-bold w-full focus:outline-none dark:text-white" 
                                    placeholder="Commission"
                                  />
                              </div>
                              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-xl border border-gray-100 dark:border-gray-600">
                                  <Megaphone size={14} className="text-gray-400 shrink-0" />
                                  <select 
                                    defaultValue={asset.status || 'Active'} 
                                    onChange={(e) => updateCampaignAsset(asset.id, { status: e.target.value as any })}
                                    className="bg-transparent text-[10px] font-bold w-full focus:outline-none dark:text-white"
                                  >
                                      <option value="Active">Active</option>
                                      <option value="Upcoming">Upcoming</option>
                                      <option value="Ended">Ended</option>
                                  </select>
                              </div>
                              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-xl border border-gray-100 dark:border-gray-600">
                                  <ExternalLink size={14} className="text-gray-400 shrink-0" />
                                  <input 
                                    defaultValue={asset.adFormat || ''} 
                                    onBlur={(e) => updateCampaignAsset(asset.id, { adFormat: e.target.value })}
                                    className="bg-transparent text-[10px] font-bold w-full focus:outline-none dark:text-white" 
                                    placeholder="Ad Format"
                                  />
                              </div>
                          </div>
                          <div className="flex items-start space-x-3 bg-gray-50 dark:bg-gray-700 p-2.5 rounded-xl border border-gray-100 dark:border-gray-600">
                              <Info size={16} className="text-gray-400 shrink-0 mt-1" />
                              <textarea 
                                defaultValue={asset.conditions || ''} 
                                onBlur={(e) => updateCampaignAsset(asset.id, { conditions: e.target.value })}
                                className="bg-transparent text-xs w-full focus:outline-none dark:text-white h-12 resize-none" 
                                placeholder="Conditions & Requirements..."
                              />
                          </div>
                          <div className="flex space-x-2">
                              <button 
                                onClick={() => updateCampaignAsset(asset.id, { active: !asset.active })}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center space-x-2 transition ${asset.active ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}
                              >
                                  {asset.active ? <Eye size={14} /> : <EyeOff size={14} />}
                                  <span>{asset.active ? 'Active' : 'Inactive'}</span>
                              </button>
                              <button 
                                onClick={() => handleCopyLink(asset.id)}
                                className={`p-3 rounded-xl transition border ${copiedId === asset.id ? 'bg-green-50 text-green-500 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-100 dark:bg-gray-700 dark:border-gray-600'}`}
                              >
                                  {copiedId === asset.id ? <Check size={16} /> : <Copy size={16} />}
                              </button>
                              <button onClick={() => handleDelete(asset.id)} className="p-3 bg-red-50 text-red-500 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition border border-transparent"><Trash2 size={16} /></button>
                          </div>
                      </div>
                  </div>
              </div>
          ))}

          {campaignAssets.length === 0 && (
              <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <Megaphone size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold">No assets found.</p>
                  <button onClick={handleAddNew} className="mt-4 text-indigo-500 font-bold flex items-center justify-center space-x-2 mx-auto">
                      <Plus size={16} />
                      <span>Create First Asset</span>
                  </button>
              </div>
          )}
      </div>
      
      <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
          <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center"><Megaphone size={14} className="mr-2" /> Note</h4>
          <p className="text-[10px] text-indigo-500 leading-relaxed">These assets are downloadable banners and kits provided to affiliates to help them promote SYNERGY products. Inactive assets will not appear on the Affiliate Links page for users.</p>
      </div>
    </div>
  );
};
