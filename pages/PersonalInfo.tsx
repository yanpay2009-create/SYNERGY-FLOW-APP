import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, User, ShieldCheck, Landmark } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PersonalInfo: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSecurityUnlocked, t } = useApp();
  
  useEffect(() => {
    if (!user) {
        navigate('/account');
        return;
    }
    // Security Fallback: If someone deep links to this page without unlocking PIN at Account page
    if (!isSecurityUnlocked) {
        navigate('/account');
    }
  }, [user, isSecurityUnlocked, navigate]);

  const MenuLink = ({ to, icon: Icon, title, desc }: any) => (
    <button 
      onClick={() => navigate(to)}
      className="w-full bg-white dark:bg-gray-800 p-5 rounded-[24px] shadow-soft dark:shadow-none border border-transparent dark:border-gray-700 flex items-center justify-between active:scale-[0.98] transition mb-4 group"
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-synergy-blue rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon size={24} />
        </div>
        <div className="text-left">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
        </div>
      </div>
      <ChevronRight size={20} className="text-gray-300 dark:text-gray-600 group-hover:translate-x-1 transition-transform" />
    </button>
  );

  if (!user || !isSecurityUnlocked) return null;

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/account')} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Personal Information</h1>
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-500">
         <MenuLink to="/edit-profile" icon={User} title="Edit Profile" desc="Name, Email, Phone Number" />
         <MenuLink to="/kyc" icon={ShieldCheck} title="Identity Verification (KYC)" desc="ID Card, Verification Status" />
         <MenuLink to="/bank-accounts" icon={Landmark} title="Bank Accounts" desc="Manage Withdrawal Accounts" />
      </div>
    </div>
  );
};