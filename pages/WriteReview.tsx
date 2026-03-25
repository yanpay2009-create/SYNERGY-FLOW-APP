
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Star, Image as ImageIcon, Send, Camera, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export const WriteReview: React.FC = () => {
  const { orders, addReview, showToast } = useApp();
  const navigate = useNavigate();
  const { orderId, productId } = useParams<{ orderId: string, productId: string }>();
  
  const order = orders.find(o => o.id === orderId);
  const product = order?.items.find(item => item.id === Number(productId));
  
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);

  if (!order || !product) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages([...images, ev.target.result as string]);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!text.trim()) {
        showToast({ message: "Please write a review.", type: 'error' });
        return;
    }
    
    addReview(product.id, order.id, rating, text, images);
    
    showToast({ message: "Thank you for your review! You earned 10 points.", type: 'success' });
    navigate(-1);
  };

  return (
    <div className="pb-24 pt-10 px-4 max-w-md mx-auto min-h-screen bg-gray-50">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-2">Write Review</h1>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-soft mb-6">
        <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-100">
           <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
               <img src={product.image || undefined} className="w-full h-full object-cover" />
           </div>
           <div>
               <h3 className="text-sm font-bold text-gray-900">{product.name}</h3>
               <p className="text-xs text-gray-500">Order ID: {order.id}</p>
           </div>
        </div>

        <div className="text-center mb-6">
            <p className="text-sm font-bold text-gray-700 mb-3">How was your experience?</p>
            <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                        key={star}
                        onClick={() => setRating(star)}
                        className={`transition hover:scale-110 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    >
                        <Star size={32} className={star <= rating ? 'fill-current' : ''} />
                    </button>
                ))}
            </div>
            <p className="text-xs text-synergy-blue font-medium mt-2">
                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : 'Poor'}
            </p>
        </div>

        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Review</label>
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Tell us about the product quality, shipping..."
                    className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-synergy-blue/20"
                />
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Add Photos</label>
                <div className="flex space-x-3 overflow-x-auto pb-2">
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 shrink-0">
                        <Camera size={20} className="text-gray-400 mb-1" />
                        <span className="text-[10px] text-gray-400">Add</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    {images.map((img, idx) => (
                        <div key={idx} className="w-20 h-20 rounded-xl relative shrink-0">
                            <img src={img || undefined} className="w-full h-full object-cover rounded-xl" />
                            <button 
                                onClick={() => removeImage(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full shadow-sm"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <button 
            onClick={handleSubmit}
            className="w-full bg-synergy-blue text-white font-bold py-4 rounded-2xl shadow-glow mt-6 flex items-center justify-center space-x-2 active:scale-[0.98] transition"
        >
            <Send size={18} />
            <span>Submit Review</span>
        </button>
      </div>
    </div>
  );
};
