import React, { useState, useEffect } from 'react';
import { Home, User, Zap, Plus } from 'lucide-react';
import { ShoppingBagIcon } from './ShoppingBagIcon';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, t, isSearchActive, bottomNavHidden, setBottomNavHidden } = useApp();
  const [isInputActive, setIsInputActive] = useState(false);
  
  // Detect if keyboard is likely up by tracking focus on inputs
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setIsInputActive(true);
      }
    };
    const handleBlur = () => {
      setIsInputActive(false);
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Reset hide state when changing routes
  useEffect(() => {
    setBottomNavHidden(false);
  }, [location.pathname, setBottomNavHidden]);

  // Whitelist approach: Only show bottom nav on main tab paths
  const mainTabs = ['/home', '/feed', '/cart', '/account'];
  
  const isExcluded = !mainTabs.includes(location.pathname) || 
                     isSearchActive ||
                     isInputActive;

  if (isExcluded) return null;

  const NavItem = ({ to, icon: Icon, label, isActive, badge }: any) => (
    <Link to={to} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-synergy-blue' : 'text-gray-400 dark:text-gray-500'}`}>
      <div className="relative">
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        {badge && (
           <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500/80 rounded-full px-1 shadow-sm backdrop-blur-sm">
             {badge}
           </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out ${bottomNavHidden ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
      <div className="max-w-md mx-auto bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 pb-safe pt-2 px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] dark:shadow-none rounded-t-3xl">
        <div className="flex justify-between items-center h-16 px-2">
          <NavItem to="/home" icon={Home} label={t('nav.home')} isActive={location.pathname === '/home'} />
          <NavItem to="/feed" icon={Zap} label={t('nav.feed')} isActive={location.pathname === '/feed'} />
          
          <div className="relative -top-8">
             <button 
               onClick={() => navigate('/create-content')}
               className={`relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 text-white shadow-[0_8px_20px_rgba(168,85,247,0.4)] transform transition-all duration-300 active:scale-95 hover:scale-105 border-4 border-white dark:border-gray-900 ${location.pathname === '/create-content' ? 'ring-2 ring-synergy-blue ring-offset-2' : ''}`}
             >
                <Plus size={32} strokeWidth={3} className="text-white" />
             </button>
          </div>

          <NavItem 
            to="/cart" 
            icon={ShoppingBagIcon} 
            label={t('nav.cart')} 
            isActive={location.pathname === '/cart'} 
            badge={cartCount > 0 ? cartCount : null}
          />
          <NavItem to="/account" icon={User} label={t('nav.account')} isActive={location.pathname === '/account'} />
        </div>
      </div>
    </div>
  );
};