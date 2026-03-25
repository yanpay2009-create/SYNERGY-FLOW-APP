
import React, { useState } from 'react';
import { ArrowLeft, Plus, Monitor, Trash2, Camera, Type, Save, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const AdminOnboardingManage: React.FC = () => {
  const navigate = useNavigate();
  const { onboardingSlides, updateOnboardingSlide, deleteOnboardingSlide, addOnboardingSlide } = useApp();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, slideId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateOnboardingSlide(slideId, { image: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNew = () => {
    addOnboardingSlide({
        title: "New Amazing Feature",
        desc: "Explain how this helps your affiliates earn more.",
        image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop"
    });
  };

  return (
    <div className="pb-24 pt-10 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400">
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Onboarding Slides</h1>
        </div>
        <button 
            onClick={handleAddNew} 
            className="p-2 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 active:scale-90 transition-all"
            title="Add New Slide"
        >
            <Plus size={20} />
        </button>
      </div>

      <div className="space-y-6">
          {onboardingSlides.map((slide, index) => (
              <div key={slide.id} className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-transparent dark:border-gray-700 animate-in fade-in">
                  <div className="aspect-video relative group">
                      <img src={slide.image || undefined} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <label className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white cursor-pointer hover:bg-white/40 transition">
                              <Camera size={20} />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, slide.id)}
                              />
                          </label>
                      </div>
                      <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-md text-[10px] font-bold">
                          SLIDE {index + 1}
                      </div>
                  </div>
                  <div className="p-4">
                      <div className="space-y-3">
                          <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                              <Type size={18} className="text-gray-400 shrink-0" />
                              <input 
                                defaultValue={slide.title || ''} 
                                onBlur={(e) => updateOnboardingSlide(slide.id, { title: e.target.value })}
                                className="bg-transparent text-sm font-bold w-full focus:outline-none dark:text-white" 
                                placeholder="Slide Title"
                              />
                          </div>
                          <div className="flex items-start space-x-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                              <FileText size={18} className="text-gray-400 shrink-0 mt-1" />
                              <textarea 
                                defaultValue={slide.desc || ''} 
                                onBlur={(e) => updateOnboardingSlide(slide.id, { desc: e.target.value })}
                                className="bg-transparent text-xs w-full focus:outline-none dark:text-white h-16 resize-none" 
                                placeholder="Description text..."
                              />
                          </div>
                          <div className="flex space-x-2">
                              <button onClick={() => deleteOnboardingSlide(slide.id)} className="p-3 bg-red-50 text-red-500 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition"><Trash2 size={18} /></button>
                              <div className="flex-1 py-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 rounded-xl text-xs font-bold uppercase flex items-center justify-center space-x-2">
                                  <Save size={16} />
                                  <span>Auto Saved</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          ))}

          {onboardingSlides.length === 0 && (
              <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <Monitor size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold">No slides configured.</p>
                  <button onClick={handleAddNew} className="mt-4 text-indigo-500 font-bold flex items-center justify-center space-x-2 mx-auto">
                      <Plus size={16} />
                      <span>Add First Slide</span>
                  </button>
              </div>
          )}
      </div>
      
      <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
          <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center"><Monitor size={14} className="mr-2" /> Note</h4>
          <p className="text-[10px] text-indigo-500 leading-relaxed">Changes to onboarding slides will affect all new users immediately. High resolution vertical images (1080x1920) are recommended for best fullscreen appearance.</p>
      </div>
    </div>
  );
};
