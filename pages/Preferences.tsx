import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { ArrowLeft, Globe, MapPin, Share2, Shield, LogOut, ChevronRight, Lock, Type, Bell } from 'lucide-react';

export const Preferences: React.FC = () => {
  const { logout, language, fontSize, setFontSize, t, notificationsEnabled, setNotificationsEnabled, user } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/account');
  };

  const getLanguageLabel = () => {
      switch(language) {
          case 'th': return 'ไทย';
          case 'mm': return 'မြန်မာ';
          default: return 'English';
      }
  };

  const cycleFontSize = () => {
      if (fontSize === 'small') setFontSize('medium');
      else if (fontSize === 'medium') setFontSize('large');
      else setFontSize('small');
  };

  const PreferenceItem = ({ icon: Icon, label, value, to, onClick, color = "text-synergy-blue", toggle, active }: any) => (
    <button 
      onClick={() => {
        if (toggle && onClick) {
            onClick();
        } else {
            if (to) navigate(to);
            if (onClick) onClick();
        }
      }}
      className="w-full bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex items-center justify-between active:scale-[0.98] transition mb-3 border border-transparent dark:border-gray-700"
    >
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
        <div className="text-left">
           <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 block">{label}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {value && <span className={`text-xs font-bold ${fontSize === 'large' && label.includes('Size') ? 'text-synergy-blue' : 'text-gray-400'}`}>{value}</span>}
        {toggle ? (
            <div 
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${active ? 'bg-synergy-blue' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
        ) : (
            <ChevronRight size={18} className="text-gray-300 dark:text-gray-500" />
        )}
      </div>
    </button>
  );

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header 
        title={t('pref.settings')} 
        onBack={() => navigate(-1)}
      />

      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase ml-2 mb-3">{t('pref.general')}</h3>
        <PreferenceItem icon={Globe} label={t('pref.language')} value={getLanguageLabel()} to="/language-selection" />
        <PreferenceItem 
            icon={Type} 
            label={t('pref.font_size')} 
            value={t(`font.${fontSize}`)} 
            onClick={cycleFontSize} 
        />
        <PreferenceItem 
            icon={Bell} 
            label={t('pref.notifications')} 
            toggle={true} 
            active={notificationsEnabled} 
            onClick={() => setNotificationsEnabled(!notificationsEnabled)} 
        />
        <PreferenceItem icon={MapPin} label={t('pref.addresses')} to="/address-book" />
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase ml-2 mb-3">{t('pref.connections')}</h3>
        <PreferenceItem icon={Share2} label={t('pref.social')} to="/social-accounts" value="Linked" />
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase ml-2 mb-3">{t('pref.security')}</h3>
        <PreferenceItem icon={Lock} label={user?.password ? t('pref.password') : t('pref.set_password')} to="/change-password" />
        <PreferenceItem icon={Shield} label={t('pref.pin')} to="/change-pin" />
      </div>

      <button 
        onClick={handleLogout}
        className="w-full py-4 text-red-500 font-bold bg-white dark:bg-gray-800 dark:text-red-400 rounded-2xl shadow-sm flex items-center justify-center space-x-2 border border-transparent dark:border-gray-700"
      >
        <LogOut size={20} />
        <span>{t('pref.logout')}</span>
      </button>
    </div>
  );
};