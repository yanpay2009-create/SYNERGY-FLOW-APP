
import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Language } from '../types';

export const LanguageSelection: React.FC = () => {
  const { language, setLanguage, t } = useApp();
  const navigate = useNavigate();

  const languages: { code: Language; name: string; localName: string; flag: string }[] = [
    { code: 'en', name: 'English', localName: 'English', flag: '🇺🇸' },
    { code: 'th', name: 'Thai', localName: 'ไทย', flag: '🇹🇭' },
    { code: 'mm', name: 'Myanmar', localName: 'မြန်မာ', flag: '🇲🇲' },
  ];

  const handleSelect = (code: Language) => {
    setLanguage(code);
    // Optional: go back immediately
    // navigate(-1);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-gray-50">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-2">{t('pref.language')}</h1>
      </div>

      <div className="space-y-3">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={`w-full bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between active:scale-[0.98] transition border ${language === lang.code ? 'border-synergy-blue' : 'border-transparent'}`}
          >
            <div className="flex items-center space-x-4">
              <span className="text-2xl">{lang.flag}</span>
              <div className="text-left">
                <span className="text-sm font-bold text-gray-900 block">{lang.localName}</span>
                <span className="text-xs text-gray-400">{lang.name}</span>
              </div>
            </div>
            {language === lang.code && (
              <div className="w-6 h-6 bg-synergy-blue rounded-full flex items-center justify-center text-white">
                <Check size={14} strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
