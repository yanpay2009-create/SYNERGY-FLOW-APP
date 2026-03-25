import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApp, TIER_THRESHOLDS } from '../context/AppContext';
import { Plus, Search, Bell, TrendingUp, BarChart3, Star as StarIcon, Sparkles, Filter, Zap, X, Crown, Gift, UserPlus, Wallet, Clock, Trophy, ChevronRight, Tag, Star, ArrowRight, Share2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserTier, Product } from '../types';
import { ProductCard, getTierColors, getTierBadgeStyles, formatSold, calculateRating } from '../components/ProductCard';
import { CountdownTimer } from '../components/CountdownTimer';

const LiveSalesFeed: React.FC<{ sales: any[]; t: any }> = ({ sales, t }) => {
  if (!sales || sales.length === 0) return null;

  return (
    <div className="mb-6 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Clock className="text-emerald-500" size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          </div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">{t('home.live_sales')}</h3>
        </div>
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">{t('home.real_time')}</span>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
        <div className="space-y-3">
          {sales.slice(0, 3).map((sale, idx) => (
            <div key={sale.id || idx} className={`flex items-center justify-between animate-in slide-in-from-right-4 duration-500 delay-${idx * 100} fill-mode-both`}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                  {sale.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-800 dark:text-gray-100 leading-none">{sale.name || t('home.anonymous')}</p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-medium">{t('home.just_purchased')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 leading-none">฿{sale.amount?.toLocaleString()}</p>
                <p className="text-[8px] text-gray-300 dark:text-gray-600 mt-1 font-bold uppercase tracking-tighter">
                  {new Date(sale.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-50/50 dark:from-emerald-900/10 to-transparent rounded-bl-full pointer-events-none"></div>
      </div>
    </div>
  );
};

export const Home: React.FC = () => {
  const { user, products, addToCart, calculateCommission, t, notifications, ads, setIsSearchActive, setBottomNavHidden, referrer, addReferrer, commissions, team, liveSales } = useApp();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByCommission, setSortByCommission] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollingUp, setScrollingUp] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show background when scrolling up and not at the very top
      if (currentScrollY > 50 && currentScrollY < lastScrollY) {
        setScrollingUp(true);
      } else {
        setScrollingUp(false);
      }

      // Threshold for "scrolled" state (e.g. when banner is mostly gone)
      if (currentScrollY > 180) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleExpire = useCallback(() => {
    setCurrentTime(Date.now());
  }, []);

  // Update current time every minute to refresh promotion filtering
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      // Only update if the minute has actually changed to avoid excessive re-renders
      setCurrentTime(prev => {
        if (Math.floor(now / 60000) !== Math.floor(prev / 60000)) {
          return now;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(timer);
  }, []);
  
  // Ensure navigation is visible when home mounts
  useEffect(() => {
    setBottomNavHidden(false);
  }, [setBottomNavHidden]);

  // Income Calculations for Dashboard
  const lifetimeEarned = useMemo(() => {
    return commissions
      .filter(c => (c.status === 'Paid' || c.status === 'Completed') && c.amount > 0)
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [commissions]);

  // Calculate Monthly Revenue
  const monthlyEarned = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toLocaleString('en-GB', { month: 'short' });
    const currentYear = now.getFullYear().toString();
    
    return commissions
      .filter(c => 
        c.date.includes(currentMonth) && 
        c.date.includes(currentYear) &&
        c.amount > 0 &&
        (c.type === 'Direct' || c.type === 'Team')
      )
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [commissions]);

  const activeAds = useMemo(() => {
    return ads.filter(ad => {
      if (!ad.active) return false;
      if (ad.expiryDate) {
        return new Date(ad.expiryDate).getTime() > currentTime;
      }
      return true;
    });
  }, [ads, currentTime]);

  const homeAds = useMemo(() => {
    return activeAds.filter(a => a.placement === 'home');
  }, [activeAds]);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (homeAds.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % homeAds.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [homeAds.length]);


  const promoProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.isPromo) return false;
      if (p.expiryDate) {
        return new Date(p.expiryDate).getTime() > currentTime;
      }
      return true;
    });
  }, [products, currentTime]);
  

  const promoAd = useMemo(() => {
    return activeAds.find(a => a.placement === 'account');
  }, [activeAds]);

  const homeBannerAds = useMemo(() => {
    return activeAds.filter(a => a.placement === 'home_banner');
  }, [activeAds]);

  let filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const isNotPromo = !p.isPromo; 
    return matchesCategory && matchesSearch && isNotPromo;
  });

  if (sortByCommission) {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  }

  const featuredProducts = useMemo(() => {
    let list = [...products];
    return list.sort((a, b) => b.sold - a.sold).slice(0, 5);
  }, [products]);
  
  const categories = ['All', 'Health', 'Gadgets', 'Beauty', 'Fashion', 'Home'];
  const unreadCount = notifications.filter(n => !n.read).length;

  let globalProgress = 0; 
  if (user) {
    const sales = user.accumulatedSales;
    const t_marketer = TIER_THRESHOLDS[UserTier.MARKETER];
    const t_builder = TIER_THRESHOLDS[UserTier.BUILDER];
    const t_executive = TIER_THRESHOLDS[UserTier.EXECUTIVE];

    if (sales >= t_executive) {
        globalProgress = 100;
    } else if (sales >= t_builder) {
        globalProgress = 50 + ((sales - t_builder) / (t_executive - t_builder)) * 50;
    } else if (sales >= t_marketer) {
        globalProgress = 25 + ((sales - t_marketer) / (t_builder - t_marketer)) * 25;
    } else {
        globalProgress = (sales / t_marketer) * 25;
    }
  }

  const tierColors = getTierColors(user?.tier);

  const getDiscountedPrice = useCallback((product: Product) => {
      let tierDiscount = 0;
      if (user) {
          if (user.tier === UserTier.MARKETER) tierDiscount = 0.10;
          else if (user.tier === UserTier.BUILDER) tierDiscount = 0.20;
          else if (user.tier === UserTier.EXECUTIVE) tierDiscount = 0.30;
      }
      
      // Only apply tier discount. The promoDiscount is for tier progression/commission, not price reduction.
      return product.price * (1 - tierDiscount);
  }, [user]);

  return (
    <div className="pb-20 pt-0 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 relative transition-colors duration-300 font-sans">
      {/* Unified Sticky Header */}
      <div className={`fixed top-0 left-0 right-0 z-[100] max-w-md mx-auto transition-all duration-500 ease-in-out ${
        scrollingUp || scrolled || homeAds.length === 0
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl pt-12 pb-3 px-4 shadow-sm'
          : 'pt-12 pb-4 px-4 bg-transparent'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`flex-1 flex items-center px-4 py-2 rounded-2xl border transition-all duration-500 ease-in-out ${
            scrollingUp || scrolled || homeAds.length === 0
              ? 'bg-gray-100/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700' 
              : 'bg-white/40 border-white/50 backdrop-blur-md'
          }`}>
            <Search size={16} className={`transition-colors duration-500 ${scrollingUp || scrolled || homeAds.length === 0 ? 'text-gray-400' : 'text-white/90'} mr-2`} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchActive(true)}
              onBlur={() => setIsSearchActive(false)}
              placeholder={t('home.cat.all') + '...'} 
              className={`bg-transparent border-none outline-none text-xs w-full font-medium transition-colors duration-500 ${
                scrollingUp || scrolled || homeAds.length === 0 ? 'text-gray-800 dark:text-white placeholder-gray-400' : 'text-white placeholder-white/90'
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={`transition-colors duration-500 ${scrollingUp || scrolled || homeAds.length === 0 ? 'text-gray-400' : 'text-white/70'} hover:text-white`}>
                <X size={14} />
              </button>
            )}
          </div>
          <button 
            onClick={() => navigate('/notifications')} 
            className={`relative p-2 rounded-full border transition-all duration-500 ${
              scrollingUp || scrolled || homeAds.length === 0
                ? 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700' 
                : 'bg-white/40 text-white border-white/50 backdrop-blur-md hover:bg-white/50'
            }`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border transition-colors duration-500 ${
                scrollingUp || scrolled || homeAds.length === 0 ? 'border-white dark:border-gray-900' : 'border-white'
              }`}></span>
            )}
          </button>
        </div>
      </div>

      {homeAds.length > 0 && (
        <div className="sticky top-0 w-full aspect-[4/3] bg-gray-200 dark:bg-gray-800 overflow-hidden z-0">
           {/* Header was here, now moved to fixed position above */}
           
           {homeAds.map((ad, index) => (
             <div key={ad.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
               <img src={ad.image || undefined} alt={ad.title} className="w-full h-full object-cover" />
               <div className="absolute bottom-16 left-6 text-white max-w-[80%]">
                  <h2 className="text-2xl font-bold mb-1 drop-shadow-lg leading-tight">{ad.title}</h2>
                  <p className="text-xs font-medium opacity-90 drop-shadow-md">{ad.subtitle}</p>
               </div>
             </div>
           ))}
           
           {homeAds.length > 1 && (
               <div className="absolute bottom-14 right-6 flex space-x-1.5 z-10">
                  {homeAds.map((_, idx) => (
                      <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ease-out backdrop-blur-sm ${currentSlide === idx ? 'bg-white w-6 shadow-glow' : 'bg-white/30 w-1.5'}`} />
                  ))}
               </div>
           )}
        </div>
      )}

      {homeAds.length === 0 && (
        <div className="px-4 pt-20 mb-6">
           {/* Header is fixed at the top, so we just need padding here */}
        </div>
      )}

      <div className="relative z-10 bg-gray-50 dark:bg-gray-900 -mt-12 pt-6 px-4 shadow-[0_-12px_30px_rgba(0,0,0,0.05)] dark:shadow-none min-h-screen">
        <div className="flex space-x-3 overflow-x-auto no-scrollbar mb-3 pb-2" role="tablist">
          {categories.map((cat, i) => (
            <button 
              key={i} role="tab" aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold transition ${activeCategory === cat ? 'bg-synergy-blue text-white shadow-glow' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              {t(`home.cat.${cat.toLowerCase()}`)}
            </button>
          ))}
        </div>


        {!searchQuery && activeCategory === 'All' && (
          <>
            {/* HOME BANNER ADS SECTION */}
            {homeBannerAds.length > 0 && (
                <div className="mb-3">
                    {homeBannerAds.slice(0, 1).map((ad, idx) => (
                        <div 
                          key={ad.id}
                          onClick={() => navigate('/affiliate-links')}
                          className="animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both"
                        >
                            <div 
                              className="w-full h-32 rounded-xl overflow-hidden shadow-soft relative group border border-white/60 dark:border-gray-700 cursor-pointer active:scale-[0.98] transition-all duration-300"
                            >
                                <img src={ad.image || undefined} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" referrerPolicy="no-referrer" />
                                
                                <div className="absolute bottom-4 left-6 right-6">
                                    <h3 className="text-lg font-black leading-tight text-white drop-shadow-md">{ad.title}</h3>
                                    <div className="flex justify-between items-center mt-1">
                                      <p className="text-[9px] text-white/90 font-bold opacity-90 truncate max-w-[80%] drop-shadow-sm">{ad.subtitle}</p>
                                      <div className="bg-white/20 backdrop-blur-md rounded-full p-1.5 border border-white/30 group-hover:bg-synergy-blue group-hover:border-synergy-blue transition-all text-white">
                                          <ArrowRight size={12} />
                                      </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Live Sales Feed */}
            <LiveSalesFeed sales={liveSales} t={t} />

            <div className="mb-2">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                      <TrendingUp className="text-synergy-blue" size={20} />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Sellers</h3>
                  </div>
                  <button 
                    onClick={() => navigate('/featured-products')}
                    className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    View All
                  </button>
                </div>
                <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4">
                  {featuredProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      isFeatured={true} 
                    />
                  ))}
                </div>
            </div>
            
            {/* PROMOTION SECTION (Banner Style) */}
            {promoProducts.length > 0 && promoAd && (
                <div className="mb-4 animate-in slide-in-from-right-4 duration-700">
                    <div 
                      onClick={() => navigate('/promotions')}
                      className="w-full h-32 rounded-xl overflow-hidden shadow-soft relative group cursor-pointer active:scale-[0.98] transition-all duration-500 border border-white/60 dark:border-gray-700"
                    >
                        <img src={promoAd.image || undefined} alt="Promo Background" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" referrerPolicy="no-referrer" />
                        
                        {promoAd?.expiryDate && (
                          <div className="absolute top-3 right-3 z-20">
                            <CountdownTimer expiryDate={promoAd.expiryDate} onExpire={handleExpire} />
                          </div>
                        )}

                        <div className="absolute bottom-4 left-6 right-6">
                            <h3 className="text-lg font-black leading-tight text-white drop-shadow-md">{promoAd ? promoAd.title : "Flash Promotions"}</h3>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-[9px] text-white/90 font-bold opacity-90 truncate max-w-[80%] drop-shadow-sm">{promoAd ? promoAd.subtitle : "Unlock member-only discounts and premium rewards."}</p>
                              <div className="bg-black/30 backdrop-blur-md rounded-full p-1.5 border border-white/20 group-hover:bg-synergy-blue group-hover:border-synergy-blue transition-all text-white">
                                  <ArrowRight size={12} />
                              </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button onClick={() => navigate('/tier-benefits')} className="w-full text-left bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 mb-2 shadow-soft dark:shadow-none border border-white/60 dark:border-gray-700 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all duration-200">
                <div className="text-center mb-6 relative z-10">
                    <div className={`inline-flex items-center space-x-2 ${tierColors.bgLight} px-3 py-1.5 rounded-full mb-2 border border-white/50 dark:border-gray-600 shadow-sm`}>
                        {tierColors.icon && <tierColors.icon size={12} className={tierColors.text} />}
                        <span className={`text-[10px] ${tierColors.text} font-black uppercase tracking-wider`}>{user?.tier === UserTier.EXECUTIVE ? 'Max Level Active' : 'Level Up Path'}</span>
                    </div>
                    <div className="h-10 flex flex-col items-center justify-center">
                        <h2 className={`text-2xl font-black tracking-tight leading-none ${tierColors.text}`}>Road To Executive</h2>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">Earn up to 30% Commission</p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner relative mb-3">
                        <div className={`h-full ${tierColors.progress} rounded-full relative transition-all duration-1000 ease-out`} style={{ width: `${globalProgress}%` }}><div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 rounded-full"></div></div>
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-gray-400 dark:text-gray-500 px-1 uppercase tracking-widest">
                        <span className={user?.tier === UserTier.STARTER ? 'text-synergy-blue' : ''}>Starter</span>
                        <span className={user?.tier === UserTier.MARKETER ? 'text-pink-600' : ''}>Marketer</span>
                        <span className={user?.tier === UserTier.BUILDER ? 'text-purple-700 font-black' : ''}>Builder</span>
                        <span className={user?.tier === UserTier.EXECUTIVE ? 'text-amber-600 font-black' : ''}>Executive</span>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 dark:from-blue-900/20 to-transparent rounded-bl-[100px] pointer-events-none"></div>
                <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${tierColors.decoration} to-transparent rounded-tr-[80px] pointer-events-none`}></div>
            </button>
          </>
        )}

        <div className="flex justify-between items-center mb-4">
           <div className="flex items-center space-x-2">
              {!searchQuery && activeCategory === 'All' && <Sparkles className="text-synergy-blue" size={20} />}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                 {searchQuery 
                   ? `Results for "${searchQuery}"` 
                   : (activeCategory === 'All' ? t('home.just_for_you') : t(`home.cat.${activeCategory.toLowerCase()}`))
                 }
              </h3>
           </div>
           <button onClick={() => setSortByCommission(!sortByCommission)} className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border ${sortByCommission ? 'bg-synergy-blue text-white border-synergy-blue shadow-glow' : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}><Zap size={12} fill={sortByCommission ? "currentColor" : "none"} /><span>Sort</span></button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><p className="text-sm font-medium">No results found.</p></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};