import React, { useState } from 'react';
import { ArrowLeft, Plus, Layout, Trash2, Camera, Link as LinkIcon, Save, Eye, EyeOff, Image as ImageIcon, Sparkles, MapPin, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const AdminAdManage: React.FC = () => {
  const navigate = useNavigate();
  const { ads, updateAd, deleteAd, addAd } = useApp();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, adId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // We'll assume showToast is available or just alert if not
        alert("File is too large. Max 2MB allowed.");
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
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
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
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          updateAd(adId, { image: resizedBase64 });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNew = () => {
      addAd({
          title: 'New Exclusive Deal',
          subtitle: 'Join now and earn more bonus commissions!',
          image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
          active: true,
          placement: 'home',
          expiryDate: new Date(Date.now() + 86400000).toISOString()
      });
  };

  const formatDateTimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  return (
    <div className="pb-24 pt-16 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400">
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2">Ads & Banners</h1>
        </div>
        <button onClick={handleAddNew} className="p-2 bg-indigo-500 text-white rounded-full shadow-lg active:scale-95 transition-transform"><Plus size={20} /></button>
      </div>

      <div className="space-y-6">
          {ads.map(ad => (
              <div key={ad.id} className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-transparent dark:border-gray-700 animate-in fade-in">
                  <div className="h-44 relative group">
                      <img src={ad.image || undefined} className="w-full h-full object-cover" alt={ad.title} />
                      <label className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                          <Camera size={24} className="text-white" />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, ad.id)}
                          />
                      </label>
                      <button 
                        onClick={() => updateAd(ad.id, { active: !ad.active })}
                        className={`absolute top-3 left-3 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-1 shadow-sm transition ${ad.active ? 'bg-indigo-500/80 text-white' : 'bg-gray-500/80 text-white'}`}
                      >
                          {ad.active ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{ad.active ? 'Visible' : 'Hidden'}</span>
                      </button>

                      <div className="absolute top-3 right-3 backdrop-blur-md px-2.5 py-1 rounded-lg bg-black/50 text-white text-[10px] font-black uppercase tracking-widest flex items-center space-x-1 shadow-sm">
                          <MapPin size={12} />
                          <span>{ad.placement.toUpperCase()}</span>
                      </div>
                  </div>
                  <div className="p-5">
                      <div className="space-y-4 mb-5">
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Placement Position</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['home', 'feed', 'account', 'home_banner'] as const).map(pos => (
                                    <button 
                                        key={pos}
                                        onClick={() => updateAd(ad.id, { placement: pos })}
                                        className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${ad.placement === pos ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' : 'bg-gray-50 dark:bg-gray-700 text-gray-400 border-transparent hover:border-gray-200'}`}
                                    >
                                        {pos.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Main Title</label>
                            <input 
                                defaultValue={ad.title || ''} 
                                onBlur={(e) => updateAd(ad.id, { title: e.target.value })}
                                placeholder="Banner Title"
                                className="font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-xl w-full text-sm outline-none focus:ring-1 focus:ring-indigo-500 transition"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Subtitle / Description</label>
                            <input 
                                defaultValue={ad.subtitle || ''} 
                                onBlur={(e) => updateAd(ad.id, { subtitle: e.target.value })}
                                placeholder="Subtitle"
                                className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl w-full outline-none focus:ring-1 focus:ring-indigo-500 transition"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Countdown Expiry Date</label>
                            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                                <Clock size={14} className="text-gray-400" />
                                <input 
                                    type="datetime-local"
                                    defaultValue={formatDateTimeLocal(ad.expiryDate)}
                                    onChange={(e) => updateAd(ad.id, { expiryDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                    className="bg-transparent w-full outline-none dark:text-white text-[10px]"
                                />
                                {ad.expiryDate && (
                                  <button 
                                    onClick={() => updateAd(ad.id, { expiryDate: null })}
                                    className="text-red-400 hover:text-red-600 transition"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Image Link (URL)</label>
                            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                                <ImageIcon size={14} className="text-gray-400" />
                                <input 
                                    defaultValue={(ad.image && ad.image.startsWith('data:')) ? 'Custom Uploaded Image' : (ad.image || '')}
                                    readOnly={!!(ad.image && ad.image.startsWith('data:'))}
                                    onBlur={(e) => !(ad.image && ad.image.startsWith('data:')) && updateAd(ad.id, { image: e.target.value })}
                                    className="bg-transparent w-full outline-none dark:text-white text-[10px] truncate"
                                    placeholder="https://..."
                                />
                            </div>
                          </div>
                      </div>
                      <div className="flex space-x-2">
                          <button className="flex-1 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase flex items-center justify-center space-x-2"><Sparkles size={14} /><span>Preview Placement</span></button>
                          <button onClick={() => deleteAd(ad.id)} className="p-3 bg-red-50 text-red-500 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition"><Trash2 size={18} /></button>
                      </div>
                  </div>
              </div>
          ))}

          <button onClick={handleAddNew} className="w-full py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[32px] text-gray-400 flex flex-col items-center space-y-3 hover:bg-white/50 dark:hover:bg-gray-800/50 transition">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Plus size={24} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Add New Banner</span>
          </button>
      </div>
      
      <div className="mt-8 p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
          <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-2 flex items-center">
            <Layout size={14} className="mr-2" /> 
            Placement Logic
          </h4>
          <p className="text-[10px] text-indigo-500 leading-relaxed space-y-1">
            • <b>Home:</b> Appears in the sliding carousel at the top of the Home page.<br/>
            • <b>Feed:</b> Appears as a top banner list on the Social Feed page.<br/>
            • <b>Account:</b> Appears on Account, Home (carousel), and Promotions pages.<br/>
            • <b>Home Banner:</b> Appears as a static banner section on the Home page.
          </p>
      </div>
    </div>
  );
};