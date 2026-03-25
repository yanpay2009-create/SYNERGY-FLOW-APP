import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Plus, Gift, Sparkles, Star, ArrowRight, Zap, X } from 'lucide-react';
import { ShoppingBagIcon } from '../components/ShoppingBagIcon';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { UserTier, Product } from '../types';
import { CountdownTimer } from '../components/CountdownTimer';
import { ProductCard } from '../components/ProductCard';

export const Promotions: React.FC = () => {
  const { products, addToCart, calculateCommission, user, t, setBottomNavHidden, ads, cart } = useApp();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(Date.now());

  const handleExpire = useCallback(() => {
    setCurrentTime(Date.now());
  }, []);

  // Update current time every minute to refresh promotion filtering
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setBottomNavHidden(false);
  }, [setBottomNavHidden]);

  const promoProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.isPromo) return false;
      if (p.expiryDate) {
        return new Date(p.expiryDate).getTime() > currentTime;
      }
      return true;
    });
  }, [products, currentTime]);
  
  // Get an ad for the banner, prioritizing 'account' placement ads as requested
  const promoAd = useMemo(() => {
    const activeAds = ads.filter(a => {
      if (!a.active) return false;
      if (a.expiryDate) {
        return new Date(a.expiryDate).getTime() > currentTime;
      }
      return true;
    });
    return activeAds.find(a => a.placement === 'account');
  }, [ads, currentTime]);

  const getTierBadgeStyles = (tier: UserTier | undefined) => {
    switch (tier) {
      case UserTier.EXECUTIVE: return 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-white/50 dark:border-gray-600 shadow-sm';
      case UserTier.BUILDER: return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-white/50 dark:border-gray-600 shadow-sm';
      case UserTier.MARKETER: return 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border-white/50 dark:border-gray-600 shadow-sm';
      default: return 'bg-blue-50 dark:bg-blue-900/30 text-synergy-blue dark:text-blue-400 border-white/50 dark:border-gray-600 shadow-sm';
    }
  };

  const getDiscountedPrice = (product: Product) => {
    let tierDiscount = 0;
    if (user) {
        if (user.tier === UserTier.MARKETER) tierDiscount = 0.10;
        else if (user.tier === UserTier.BUILDER) tierDiscount = 0.20;
        else if (user.tier === UserTier.EXECUTIVE) tierDiscount = 0.30;
    }
    
    // Only apply tier discount. The promoDiscount is for tier progression/commission, not price reduction.
    return product.price * (1 - tierDiscount);
  };

  const formatSold = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const calculateRating = (reviews?: any[]) => {
    if (!reviews || reviews.length === 0) return "0.0";
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header 
        title={t('menu.promotions')} 
        onBack={() => navigate(-1)}
        rightElement={
          <button 
            onClick={() => navigate('/cart')} 
            className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition"
          >
            <ShoppingBagIcon size={24} />
            {cart.reduce((acc, item) => acc + item.quantity, 0) > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500/80 rounded-full px-1 shadow-sm backdrop-blur-sm">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </button>
        }
      />


      <div className="grid grid-cols-2 gap-4">
          {promoProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
            />
          ))}
      </div>
      
      {promoProducts.length === 0 && (
          <div className="text-center py-20 text-gray-400 bg-white dark:bg-gray-800 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-700">
              <Gift size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-black uppercase tracking-widest">No promotional products available at this time</p>
          </div>
      )}
    </div>
  );
};