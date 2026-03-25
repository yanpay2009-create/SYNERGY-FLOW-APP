
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Star, User, X, Download, Share2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export const ProductReviews: React.FC = () => {
  const { products } = useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const product = products.find(p => p.id === Number(id));

  if (!product) return null;

  const reviews = product.reviews || [];
  
  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="pb-24 pt-10 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Reviews</h1>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-soft dark:shadow-none border border-transparent dark:border-gray-700 mb-6 flex items-center justify-between">
          <div>
              <div className="flex items-end space-x-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{averageRating}</span>
                  <span className="text-gray-400 text-sm mb-1.5">/ 5.0</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{reviews.length} Verified Reviews</p>
          </div>
          <div className="flex space-x-1">
             {[1, 2, 3, 4, 5].map((star) => (
                 <Star key={star} size={20} className={star <= Number(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 dark:text-gray-700"} />
             ))}
          </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <p className="font-medium text-sm">No reviews yet.</p>
            </div>
        ) : (
            reviews.map(review => (
                <div key={review.id} className="bg-white dark:bg-gray-800 p-5 rounded-[28px] shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 overflow-hidden border border-gray-100 dark:border-gray-600">
                                <User size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{review.user}</h4>
                                <div className="flex items-center space-x-1 mt-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-yellow-400" : "text-gray-200 dark:text-gray-600"} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">{review.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{review.text}</p>
                    
                    {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
                            {review.images.map((img, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => setSelectedImage(img)}
                                    className="w-20 h-20 rounded-xl overflow-hidden shrink-0 cursor-pointer active:scale-95 transition-transform border border-gray-100 dark:border-gray-700 shadow-sm hover:ring-2 hover:ring-synergy-blue/50"
                                >
                                    <img src={img || undefined} alt="Review" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))
        )}
      </div>

      {/* Full-Screen Image Viewer Overlay */}
      {selectedImage && (
          <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
              {/* Toolbar */}
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[1001]">
                  <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => setSelectedImage(null)}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition active:scale-90"
                      >
                        <X size={24} />
                      </button>
                      <span className="text-white text-xs font-black uppercase tracking-widest opacity-60">Review Image</span>
                  </div>
                  <div className="flex space-x-2">
                      <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition active:scale-90">
                        <Download size={20} />
                      </button>
                      <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition active:scale-90">
                        <Share2 size={20} />
                      </button>
                  </div>
              </div>

              {/* Main Image Container */}
              <div 
                className="w-full h-full flex items-center justify-center p-4 cursor-zoom-out"
                onClick={() => setSelectedImage(null)}
              >
                  <img 
                      src={selectedImage || undefined} 
                      alt="Full View" 
                      className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500"
                      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
                  />
              </div>

              {/* Footer Tip */}
              <div className="absolute bottom-10 left-0 right-0 text-center">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em]">Tap anywhere to dismiss</p>
              </div>
          </div>
      )}
    </div>
  );
};
