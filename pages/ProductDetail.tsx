import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Star, ShieldCheck, Truck, User, Share2, Heart, Check, Zap, Info, X, UserPlus, Search, Plus, TrendingUp, Sparkles, Trophy, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { ShoppingBagIcon } from '../components/ShoppingBagIcon';
import { useNavigate, useParams } from 'react-router-dom';
import { UserTier, Product } from '../types';
import { CountdownTimer } from '../components/CountdownTimer';
import { ProductCard } from '../components/ProductCard';

export const ProductDetail: React.FC = () => {
  const { products, addToCart, calculateCommission, user, referrer, addReferrer, t, setBottomNavHidden, cart, toggleFavorite, isFavorite, showToast } = useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const product = products.find(p => p.id === Number(id));

  const [activeImage, setActiveImage] = useState(0);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Referrer Modal State
  const [showReferrerModal, setShowReferrerModal] = useState(false);
  const [referrerCode, setReferrerCode] = useState('');
  const [referrerError, setReferrerError] = useState('');

  // Ensure navigation is visible and scroll to top
  useEffect(() => {
    setBottomNavHidden(false);
    window.scrollTo(0, 0);
  }, [id, setBottomNavHidden]);

  if (!product) return <div className="p-10 text-center text-gray-500">Product not found</div>;

  const commission = calculateCommission(product.price);
  const reviews = product.reviews || [];
  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  // Related Products Logic
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 6);

  const getDiscountedPrice = (prod: Product) => {
    let tierDiscount = 0;
    if (user) {
        if (user.tier === UserTier.MARKETER) tierDiscount = 0.10;
        else if (user.tier === UserTier.BUILDER) tierDiscount = 0.20;
        else if (user.tier === UserTier.EXECUTIVE) tierDiscount = 0.30;
    }
    
    // Only apply tier discount. The promoDiscount is for tier progression/commission, not price reduction.
    return prod.price * (1 - tierDiscount);
  };

  const handleScroll = () => {
      if (scrollRef.current) {
          const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
          setActiveImage(index);
      }
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

  const handleShare = async () => {
    // Check for referrer before sharing
    if (!referrer) {
      setShowReferrerModal(true);
      return;
    }

    const affiliateLink = `${window.location.origin}/#/product/${product.id}?ref=${user?.referralCode || 'GUEST'}`;
    const shareText = `Check out ${product.name} on Synergy Flow! Earn commissions or shop now.`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: product.name,
                text: shareText,
                url: affiliateLink,
            });
        } catch (error) {
            console.log('Share canceled');
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareText);
            showToast({ message: "Affiliate link copied to clipboard!", type: 'success' });
        } catch (err) {
            showToast({ message: "Could not copy link.", type: 'error' });
        }
    }
  };

  const handleAddReferrer = async () => {
      if (!referrerCode) return;
      const result = await addReferrer(referrerCode);
      if (result.success) {
          setShowReferrerModal(false);
          setReferrerError('');
      } else {
          setReferrerError(result.error || "Invalid Referral Code");
      }
  };

  const handleDownloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${product.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const finalPrice = getDiscountedPrice(product);
  // Hide strikethrough for Starter tier
  const hasDiscount = finalPrice < product.price && user?.tier !== UserTier.STARTER;

  const getTierBadgeStyles = (tier: UserTier | undefined) => {
    switch (tier) {
      case UserTier.EXECUTIVE: return 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-white/50 dark:border-gray-600 shadow-sm';
      case UserTier.BUILDER: return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-white/50 dark:border-gray-600 shadow-sm';
      case UserTier.MARKETER: return 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border-white/50 dark:border-gray-600 shadow-sm';
      default: return 'bg-blue-50 dark:bg-blue-900/30 text-synergy-blue dark:text-blue-400 border-white/50 dark:border-gray-600 shadow-sm';
    }
  };

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header Bar */}
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 py-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">Product Detail</h1>
          </div>
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
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative h-[42vh] w-full bg-white dark:bg-gray-800 overflow-hidden rounded-2xl shadow-soft mb-5">
         {product.stock <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
                <span className="text-gray-400 dark:text-gray-500 text-5xl font-black tracking-tighter opacity-80">
                    Out of Stock
                </span>
            </div>
         )}
         <div 
             ref={scrollRef}
             onScroll={handleScroll}
             className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full w-full"
         >
             {images.map((img, i) => (
                 <div key={i} className="w-full h-full object-cover snap-center shrink-0 relative group cursor-pointer" onClick={() => setFullImage(img)}>
                    <img src={img || undefined} alt={`Product ${i}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white">
                            <Search size={24} />
                        </div>
                    </div>
                 </div>
             ))}
         </div>

         {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-1.5 z-20">
                {images.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === activeImage ? 'w-6 bg-synergy-blue shadow-glow' : 'w-2 bg-gray-300 dark:bg-gray-600'}`} />
                ))}
            </div>
         )}
      </div>

      {/* Product Content Container */}
      <div className="relative px-2 py-2 z-20">
            <div className="flex justify-between items-start mb-3">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight flex-1 pr-4">{product.name}</h1>
                <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm shrink-0 mt-1">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-black text-gray-700 dark:text-gray-200">{calculateRating(product.reviews)}</span>
                    <span className="text-[9px] text-gray-400 font-medium ml-0.5">({reviews.length})</span>
                </div>
            </div>

            <div className="mb-5">
                <div className="flex justify-between items-center">
                    <div className="inline-flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-1 pr-3 rounded-2xl">
                        <div className="w-7 h-7 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-sm">
                            <Zap size={14} fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider leading-none mb-0.5">Commission</span>
                            <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                                {product.isPromo ? `+${product.promoDiscount}%` : `+฿${(commission ?? 0).toLocaleString()}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => toggleFavorite(product.id)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-soft border border-gray-100 dark:border-gray-700 active:scale-90 transition-all ${isFavorite(product.id) ? 'bg-red-50 dark:bg-red-900/20 text-red-500 border-red-100 dark:border-red-800/50' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            title={isFavorite(product.id) ? "Remove from Favorites" : "Add to Favorites"}
                        >
                            <Heart size={18} fill={isFavorite(product.id) ? "currentColor" : "none"} />
                        </button>
                        <button 
                            onClick={handleShare}
                            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-800 dark:text-white shadow-soft border border-gray-100 dark:border-gray-700 active:scale-90 transition-all hover:bg-synergy-blue hover:text-white"
                            title="Share Affiliate Link"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-end mb-6 border-b border-gray-100 dark:border-gray-800 pb-5">
                <div>
                    <div className="flex items-center space-x-2">
                        <h2 className="text-2xl font-black text-synergy-blue">฿{(finalPrice ?? 0).toLocaleString()}</h2>
                        {hasDiscount && (
                            <p className="text-sm text-gray-400 line-through font-bold">฿{(product.price ?? 0).toLocaleString()}</p>
                        )}
                    </div>
                    {hasDiscount && (
                        <div className="inline-flex bg-synergy-blue/10 text-synergy-blue text-[8px] font-black px-2 py-0.5 rounded-full tracking-tighter mt-1">
                            Member level discount applied
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Status</p>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{formatSold(product.sold)} {t('home.sold')}</span>
                        <span className={`text-[10px] font-black mt-0.5 ${product.stock > 10 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {product.stock} In Stock
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <Truck size={16} className="text-synergy-blue" />
                        <div>
                            <p className="text-[10px] font-black text-gray-800 dark:text-gray-100">Flash Delivery</p>
                            <p className="text-[9px] text-gray-400">1-2 Days</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <div>
                            <p className="text-[10px] font-black text-gray-800 dark:text-gray-100">Genuine</p>
                            <p className="text-[9px] text-gray-400">100% Authentic</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2">Product Story</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium opacity-80 mb-4">
                        {product.description || "Crafted with precision for those who demand the best. This product represents the pinnacle of quality and modern design, ensuring you stay ahead of the curve."}
                    </p>
                    
                    {/* Description Images (Long Details) */}
                    {product.descriptionImages && product.descriptionImages.length > 0 && (
                        <div className="mt-4">
                            {!showAllDetails ? (
                                <button 
                                    onClick={() => setShowAllDetails(true)}
                                    className="w-full py-6 flex flex-col items-center justify-center group active:scale-95 transition-all"
                                >
                                    <span className="text-[10px] font-black text-synergy-blue uppercase tracking-[0.2em] mb-1 group-hover:tracking-[0.3em] transition-all">See More Details</span>
                                    <ChevronDown size={16} className="text-synergy-blue animate-bounce" />
                                </button>
                            ) : (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                    {product.descriptionImages.map((img, idx) => (
                                        <img 
                                            key={idx} 
                                            src={img || undefined} 
                                            alt={`Detail ${idx}`} 
                                            className="w-full rounded-2xl shadow-sm cursor-pointer" 
                                            onClick={() => setFullImage(img)}
                                        />
                                    ))}
                                    <button 
                                        onClick={() => setShowAllDetails(false)}
                                        className="w-full py-4 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 mt-4 active:scale-95 transition-all"
                                    >
                                        <ChevronUp size={16} className="text-gray-400 mb-1" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Show Less</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Top Reviews</h3>
                        <button 
                            onClick={() => navigate(`/product/${product.id}/reviews`)}
                            className="text-[10px] text-synergy-blue font-bold flex items-center space-x-1"
                        >
                            <span>See All</span>
                            <ArrowLeft size={10} className="rotate-180" />
                        </button>
                    </div>
                    
                    {reviews.length > 0 ? (
                        <div className="space-y-4">
                            {reviews.slice(0, 1).map(review => (
                                <div key={review.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 overflow-hidden shadow-inner border border-gray-100 dark:border-gray-600">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{review.user}</p>
                                                <div className="flex text-amber-400 mt-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={7} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-200 dark:text-gray-600"} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[9px] text-gray-400">{review.date}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 italic leading-relaxed">"{review.text}"</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                            <p className="text-[10px] text-gray-400 font-medium">No reviews yet.</p>
                        </div>
                    )}
                </div>

                {/* RELATED PRODUCTS SECTION */}
                {relatedProducts.length > 0 && (
                    <div className="pb-2">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="text-synergy-blue" size={16} />
                                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">{t('product.related')}</h3>
                            </div>
                            <button 
                                onClick={() => navigate('/featured-products')}
                                className="text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                View All
                            </button>
                        </div>
                        <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                            {relatedProducts.map(relProduct => (
                                <ProductCard 
                                    key={relProduct.id}
                                    product={relProduct}
                                    isFeatured={true}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-t border-gray-100 dark:border-gray-800 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-2xl overflow-hidden">
          <div className="max-w-md mx-auto p-4 flex space-x-3">
              <button 
                disabled={product.stock <= 0}
                onClick={() => {
                    addToCart(product, quantity);
                }}
                className={`flex-1 h-12 rounded-full flex items-center justify-center font-black text-xs active:scale-95 transition-all border border-transparent dark:border-gray-700 ${
                    product.stock <= 0 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 cursor-not-allowed' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white'
                }`}
              >
                  {product.stock <= 0 ? 'Sold Out' : 'Add to Cart'}
              </button>
              <button 
                disabled={product.stock <= 0}
                onClick={() => {
                    addToCart(product, quantity);
                    navigate('/cart');
                }}
                className={`flex-1 h-12 rounded-full flex items-center justify-center font-black text-xs active:scale-95 transition-all flex items-center space-x-2 ${
                    product.stock <= 0 
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-synergy-blue text-white shadow-glow hover:bg-synergy-dark'
                }`}
              >
                  <span>{product.stock <= 0 ? 'Sold Out' : `Buy ฿${(finalPrice * quantity).toLocaleString()}`}</span>
                  <ShoppingBagIcon size={16} handleColor={product.stock <= 0 ? 'gray' : 'white'} />
              </button>
          </div>
      </div>

      {/* REFERRER REQUIRED MODAL - Refined Global Style */}
      {showReferrerModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowReferrerModal(false)}></div>
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 border border-white/10 overflow-hidden">
                <button 
                    onClick={() => setShowReferrerModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 z-20"
                >
                    <X size={24} />
                </button>
                
                <div className="text-center relative z-10">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-synergy-blue rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100 dark:border-blue-800">
                        <UserPlus size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Referral Code</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed font-medium">
                        To generate your personal affiliate link and track commissions, you must link your account to a referrer.
                    </p>
                    
                    <div className="mb-6 relative">
                        <input 
                            value={referrerCode}
                            onChange={(e) => {
                                setReferrerCode(e.target.value.toUpperCase());
                                setReferrerError('');
                            }}
                            placeholder="EX. BOSS001"
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl py-5 px-4 text-center font-black text-2xl uppercase tracking-[0.2em] text-synergy-blue placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-synergy-blue/10 shadow-inner"
                        />
                        {referrerError && <p className="text-red-500 text-xs mt-2 font-black uppercase tracking-widest animate-pulse">{referrerError}</p>}
                    </div>

                    <div className="flex flex-col space-y-3">
                        <button 
                            onClick={handleAddReferrer}
                            disabled={!referrerCode}
                            className="w-full bg-synergy-blue text-white font-black py-4 rounded-full shadow-glow active:scale-95 transition flex items-center justify-center space-x-2 h-14"
                        >
                            <Sparkles size={20} />
                            <span className="uppercase tracking-widest text-xs">Link & Share</span>
                        </button>
                        <button 
                            onClick={() => setShowReferrerModal(false)}
                            className="text-[11px] font-black text-gray-400 hover:text-gray-600 transition uppercase tracking-[0.3em] py-2"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE MODAL */}
      {fullImage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
                <button 
                    onClick={() => setFullImage(null)}
                    className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 transition-all active:scale-90"
                >
                    <X size={24} />
                </button>
                <button 
                    onClick={() => handleDownloadImage(fullImage)}
                    className="flex items-center space-x-2 px-5 py-3 bg-synergy-blue text-white rounded-full font-black text-xs uppercase tracking-widest shadow-glow active:scale-95 transition-all"
                >
                    <Download size={18} />
                    <span>Download</span>
                </button>
            </div>
            <div className="w-full h-full flex items-center justify-center p-4">
                <img 
                    src={fullImage || undefined} 
                    alt="Full size product" 
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300" 
                />
            </div>
        </div>
      )}

    </div>
  );
};