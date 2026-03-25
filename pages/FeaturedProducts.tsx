import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Plus, Crown, Zap, BarChart3, Sparkles, Star, X } from 'lucide-react';
import { ShoppingBagIcon } from '../components/ShoppingBagIcon';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { UserTier, Product } from '../types';
import { ProductCard } from '../components/ProductCard';

export const FeaturedProducts: React.FC = () => {
  const { products, addToCart, calculateCommission, user, t, setBottomNavHidden, cart } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    setBottomNavHidden(false);
  }, [setBottomNavHidden]);

  const featuredProducts = [...products].sort((a, b) => b.sold - a.sold);

  const getTierColors = (tier: UserTier | undefined) => {
    switch (tier) {
      case UserTier.EXECUTIVE:
        return { text: 'text-amber-600 dark:text-amber-400', bgLight: 'bg-amber-50 dark:bg-amber-900/30' };
      case UserTier.BUILDER:
        return { text: 'text-purple-700 dark:text-purple-400', bgLight: 'bg-purple-50 dark:bg-purple-900/30' };
      case UserTier.MARKETER: 
        return { text: 'text-pink-600 dark:text-pink-400', bgLight: 'bg-pink-50 dark:bg-pink-900/30' };
      default:
        return { text: 'text-synergy-blue dark:text-blue-400', bgLight: 'bg-blue-50 dark:bg-blue-900/30' };
    }
  };

  const getTierBadgeStyles = (tier: UserTier | undefined) => {
    const colors = getTierColors(tier);
    return `${colors.bgLight} ${colors.text} border border-white/50 dark:border-gray-600 shadow-sm`;
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
        title="Featured Products" 
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
          {featuredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
            />
          ))}
      </div>
    </div>
  );
};