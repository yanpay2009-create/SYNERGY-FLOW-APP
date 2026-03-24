

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Save, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EditProfile: React.FC = () => {
  const { user, updateUserProfile, showToast } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    lineId: user?.lineId || '',
    avatar: user?.avatar || ''
  });

  const compressImage = (base64Str: string, maxWidth = 512, maxHeight = 512, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        showToast({ message: "File is too large. Please upload an image under 1MB.", type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        setFormData(prev => ({ ...prev, avatar: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(formData);
    showToast({ message: 'Profile updated successfully!', type: 'success' });
    navigate(-1);
  };

  return (
    <div className="pb-24 pt-10 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Edit Profile</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-[32px] shadow-soft dark:shadow-none border border-transparent dark:border-gray-700">
         <div className="flex justify-center mb-8">
            <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                <div className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-700 shadow-xl overflow-hidden relative">
                    {formData.avatar ? (
                        <img src={formData.avatar || undefined} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                            <Camera size={32} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                    </div>
                </div>
                <button type="button" className="absolute bottom-1 right-1 bg-synergy-blue text-white p-2.5 rounded-full border-4 border-white dark:border-gray-800 shadow-lg group-hover:scale-110 transition-transform">
                    <Camera size={16} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>
         </div>

         <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-synergy-blue/20 dark:text-white font-bold"
                    placeholder="Your full name"
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-synergy-blue/20 dark:text-white font-bold"
                    placeholder="email@example.com"
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input 
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-synergy-blue/20 dark:text-white font-bold"
                    placeholder="08X-XXX-XXXX"
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Line ID</label>
                <input 
                    value={formData.lineId}
                    onChange={e => setFormData({...formData, lineId: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-synergy-blue/20 dark:text-white font-bold"
                    placeholder="Line ID for contact"
                />
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-synergy-blue to-indigo-600 text-white font-black py-4 rounded-[20px] shadow-glow mt-4 flex items-center justify-center space-x-2 active:scale-[0.98] transition uppercase tracking-[0.2em] text-xs h-16">
                <Save size={18} />
                <span>Save Profile</span>
            </button>
         </form>
      </div>
    </div>
  );
};