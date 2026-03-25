import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Facebook, Mail, MessageCircle, ChevronRight, ShieldCheck, CheckCircle2, Info, Lock, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SocialAccounts: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserSocials, t } = useApp();

  // Default structure if undefined
  const connections = user?.socials || {
    facebook: { connected: false, name: '' },
    line: { connected: false, name: '' },
    google: { connected: false, name: '' }
  };

  const handleToggleConnection = (platform: 'facebook' | 'line' | 'google') => {
    const isConnected = connections[platform].connected;
    if (isConnected) {
      if (window.confirm(`Do you want to disconnect your ${platform.charAt(0).toUpperCase() + platform.slice(1)} account?`)) {
        updateUserSocials(platform, false, '');
      }
    } else {
      // Simulate OAuth connection
      updateUserSocials(platform, true, user?.name || 'Verified User');
    }
  };

  const SocialRow = ({ platform, icon: Icon, label, colorClass }: any) => {
    const data = connections[platform as keyof typeof connections];
    
    return (
      <button 
        onClick={() => handleToggleConnection(platform)}
        className="w-full bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm flex items-center justify-between active:scale-[0.98] transition mb-3 border border-transparent dark:border-gray-700"
      >
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
            <Icon size={20} />
          </div>
          <div className="text-left">
             <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 block">{label}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {data.connected ? (
            <span className="text-xs font-bold text-emerald-500">{data.name || 'Linked'}</span>
          ) : (
            <span className="text-xs font-bold text-gray-400">Not Linked</span>
          )}
          <ChevronRight size={18} className="text-gray-300 dark:text-gray-500" />
        </div>
      </button>
    );
  };

  return (
    <div className="pb-24 pt-10 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Social Accounts</h1>
        </div>
        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-synergy-blue shadow-sm border border-gray-100 dark:border-gray-700">
          <Lock size={18} />
        </div>
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-500">
        <SocialRow 
          platform="facebook" 
          icon={Facebook} 
          label="Facebook" 
          colorClass="bg-blue-50 dark:bg-blue-900/30 text-[#1877F2]" 
        />
        <SocialRow 
          platform="line" 
          icon={MessageCircle} 
          label="Line Messenger" 
          colorClass="bg-green-50 dark:bg-green-900/30 text-[#06C755]" 
        />
        <SocialRow 
          platform="google" 
          icon={Mail} 
          label="Google Account" 
          colorClass="bg-red-50 dark:bg-red-900/30 text-[#DB4437]" 
        />
      </div>

      <div className="mt-10 p-6 bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-lg flex items-center justify-center">
            <Info size={18} />
          </div>
          <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Privacy Notice</h4>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
          Synergy Flow will never post to your social accounts without your explicit permission. We only use these connections to verify your identity and facilitate sharing features.
        </p>
      </div>

      <div className="mt-12 text-center pb-8">
        <p className="text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-[0.2em]">
          Secured by Synergy Guard
        </p>
      </div>
    </div>
  );
};
