import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Mail, Shield, FileText, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AboutUs: React.FC = () => {
  const navigate = useNavigate();
  const { systemSettings } = useApp();
  const { logo } = systemSettings;
  const contactLinks = systemSettings?.contactLinks || { line: '', phone: '', email: '', website: '', terms: '', privacy: '' };

  const LinkRow = ({ icon: Icon, label, href, colorClass }: any) => {
    if (!href) return null;
    
    return (
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-3 active:scale-[0.98] transition hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent dark:border-gray-700"
      >
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-xl ${colorClass || 'bg-blue-50 dark:bg-blue-900/20 text-synergy-blue'} flex items-center justify-center`}>
            <Icon size={18} />
          </div>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{label}</span>
        </div>
        <ChevronRight size={16} className="text-gray-300" />
      </a>
    );
  };

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 pt-10 pb-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">About Us</h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center text-center mb-10 mt-4">
        {/* Transparent Logo Container with Sharper Corners */}
        <div className="w-24 h-24 bg-transparent rounded-xl flex items-center justify-center mb-5 overflow-hidden">
           {logo ? (
               <img src={logo || undefined} className="w-full h-full object-contain" alt="Logo" />
           ) : (
               <span className="text-6xl font-black bg-gradient-to-tr from-synergy-blue to-purple-600 bg-clip-text text-transparent italic tracking-tighter">S</span>
           )}
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">SYNERGY FLOW</h2>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Version 1.0.1 Stable</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-transparent dark:border-gray-700 mb-8">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-center font-medium">
              Synergy Flow is the ultimate affiliate marketing platform designed to empower creators and sellers. We combine the best elements of e-commerce and social influence to create a seamless earning experience for the next generation of digital entrepreneurs.
          </p>
      </div>

      <div className="space-y-1">
          <LinkRow icon={Globe} label="Visit Official Website" href={contactLinks.website} />
          <LinkRow icon={FileText} label="Terms of Service" href={contactLinks.terms} colorClass="bg-purple-50 dark:bg-purple-900/20 text-purple-600" />
          <LinkRow icon={Shield} label="Privacy Policy" href={contactLinks.privacy} colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" />
          <LinkRow icon={Mail} label="Contact Customer Service" href={contactLinks.email ? `mailto:${contactLinks.email}` : ''} colorClass="bg-orange-50 dark:bg-orange-900/20 text-orange-600" />
      </div>

      <div className="mt-12 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2 opacity-30 grayscale contrast-125">
             <div className="w-5 h-px bg-gray-400"></div>
             <Globe size={14} className="text-gray-400" />
             <div className="w-5 h-px bg-gray-400"></div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
              © 2024 Synergy Flow Global<br/>Accelerating Affiliate Freedom
          </p>
      </div>
    </div>
  );
};