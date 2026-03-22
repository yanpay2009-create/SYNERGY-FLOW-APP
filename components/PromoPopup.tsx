import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const PromoPopup: React.FC = () => {
  const { activePromo, dismissPromotion, products, addToCart } = useApp();
  const navigate = useNavigate();

  if (!activePromo) return null;

  const handleShopNow = () => {
    if (activePromo.link) {
        const productId = Number(activePromo.link);
        
        // CASE 1: ลิงก์เป็น Product ID (ตัวเลข) -> เพิ่มลงตะกร้าและไปที่หน้า Cart ทันที
        if (!isNaN(productId)) {
            const product = products.find(p => p.id === productId);
            if (product) {
                addToCart(product);
                navigate('/cart');
            } else {
                navigate('/featured-products');
            }
        } 
        // CASE 2: ลิงก์เป็น External URL
        else if (activePromo.link.startsWith('http')) {
            window.open(activePromo.link, '_blank');
        } 
        // CASE 3: ลิงก์เป็น Internal Path อื่นๆ
        else {
            navigate(activePromo.link);
        }
    }
    dismissPromotion();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-transparent animate-in fade-in duration-500">
      <div className="relative w-full max-w-sm bg-transparent flex flex-col items-center">
        
        {/* Close Button - Floating higher up with a slight dark circle for visibility on transparent bg */}
        <button 
          onClick={dismissPromotion}
          className="absolute -top-16 right-0 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition active:scale-90 border border-white/20 shadow-lg"
        >
          <X size={24} />
        </button>

        {/* Promo Image Area - Centered and large */}
        <div className="relative w-full flex flex-col items-center">
            {activePromo.title && (
                <div className="mb-4 animate-in slide-in-from-top-4 duration-700">
                    <h2 className="text-2xl font-black text-white text-center uppercase tracking-[0.2em] drop-shadow-lg">
                        {activePromo.title}
                    </h2>
                </div>
            )}
            <div className="relative aspect-square w-full flex items-center justify-center p-2">
                <img 
                    src={activePromo.image} 
                    alt={activePromo.title || "Promotion"} 
                    className="w-full h-full object-contain drop-shadow-[0_40px_80px_rgba(0,181,255,0.7)] animate-in zoom-in-90 duration-700"
                />
            </div>
        </div>

        {/* Floating Action Area - Positioned tightly under the image */}
        {activePromo.link && (
            <div className="w-full text-center px-4 -mt-2 animate-in slide-in-from-bottom-6 duration-700 delay-200">
                <button 
                    onClick={handleShopNow}
                    className="group relative w-full h-14 overflow-hidden rounded-full transition-all active:scale-95 shadow-[0_20px_50px_rgba(0,181,255,0.5)]"
                >
                    {/* Button Background Gradient & Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-synergy-blue via-blue-500 to-blue-600"></div>
                    
                    {/* Shine Animation Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                    
                    <div className="relative flex items-center justify-center space-x-3 text-white px-8 h-full">
                        <span className="uppercase tracking-[0.25em] text-[13px] font-black italic">Shop Now</span>
                        <div className="bg-white/20 p-1 rounded-full group-hover:translate-x-1 transition-transform">
                            <ArrowRight size={16} strokeWidth={3} />
                        </div>
                    </div>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};