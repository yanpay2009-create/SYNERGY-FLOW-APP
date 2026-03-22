import React, { useState, useRef } from 'react';
// Add missing 'Check' component to the lucide-react imports.
import { ArrowLeft, Plus, Edit, Trash2, ImageIcon, Save, X, Camera, Upload, FileText, Tag, DollarSign, Images, CheckCircle2, Gift, Check, Clock, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Product } from '../types';

export const AdminProductManage: React.FC = () => {
  const navigate = useNavigate();
  const { products, updateProduct, deleteProduct, addProduct, showToast } = useApp();
  const [editingId, setEditingId] = useState<number | null>(null);

  const compressImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, productId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast({ message: "File is too large. Please upload an image under 2MB.", type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        updateProduct(productId, { image: compressed });
        event.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGalleryImage = async (event: React.ChangeEvent<HTMLInputElement>, product: Product) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast({ message: "File is too large. Please upload an image under 2MB.", type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        const currentImages = product.images || [];
        updateProduct(product.id, { images: [...currentImages, compressed] });
        event.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveGalleryImage = (productId: number, index: number, currentImages: string[]) => {
    const updatedImages = currentImages.filter((_, i) => i !== index);
    updateProduct(productId, { images: updatedImages });
  };

  const handleAddDescriptionImage = async (event: React.ChangeEvent<HTMLInputElement>, product: Product) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast({ message: "File is too large. Please upload an image under 2MB.", type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        const currentImages = product.descriptionImages || [];
        updateProduct(product.id, { descriptionImages: [...currentImages, compressed] });
        event.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveDescriptionImage = (productId: number, index: number, currentImages: string[]) => {
    const updatedImages = currentImages.filter((_, i) => i !== index);
    updateProduct(productId, { descriptionImages: updatedImages });
  };

  const handleEditClick = (id: number) => {
      setEditingId(id);
  };

  const handleSave = (id: number) => {
      setEditingId(null);
  };

  const handleAddNew = () => {
      addProduct({
          name: "New Product Name",
          price: 0,
          category: "Health",
          sold: 0,
          stock: 0,
          image: "",
          description: "Default product description. Please edit.",
          images: [],
          descriptionImages: [],
          reviews: [],
          isPromo: false,
          promoDiscount: 0
      });
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400">
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Product Assets</h1>
        </div>
        <button onClick={handleAddNew} className="p-2 bg-indigo-500 text-white rounded-full shadow-lg active:scale-90 transition-transform"><Plus size={20} /></button>
      </div>

      <div className="space-y-4">
          {products.map(product => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-transparent dark:border-gray-700 overflow-hidden">
                  <div className="flex items-start space-x-4 mb-4">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden relative group shrink-0 shadow-sm">
                          <img src={product.image || undefined} className="w-full h-full object-cover" alt="Primary" />
                          <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                              <Camera size={20} />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, product.id)}
                              />
                          </label>
                          {product.isPromo && (
                              <div className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-sm">
                                  <Gift size={10} />
                              </div>
                          )}
                      </div>
                      <div className="flex-1 min-w-0">
                          {editingId === product.id ? (
                              <div className="space-y-2">
                                  <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-1 border border-gray-100 dark:border-gray-600">
                                      <span className="text-[10px] font-bold text-gray-400 mr-2 uppercase">Name</span>
                                      <input 
                                        defaultValue={product.name || ''} 
                                        onBlur={(e) => updateProduct(product.id, { name: e.target.value })}
                                        className="text-sm font-bold text-gray-900 dark:text-white bg-transparent w-full outline-none"
                                      />
                                  </div>
                                  <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-1 border border-gray-100 dark:border-gray-600">
                                      <DollarSign size={12} className="text-synergy-blue mr-1" />
                                      <input 
                                        type="number"
                                        defaultValue={product.price ?? 0}
                                        onBlur={(e) => updateProduct(product.id, { price: Number(e.target.value) })}
                                        className="text-xs font-bold text-synergy-blue bg-transparent w-full outline-none"
                                      />
                                  </div>
                                  <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-1 border border-gray-100 dark:border-gray-600">
                                      <span className="text-[10px] font-bold text-gray-400 mr-2 uppercase">Stock</span>
                                      <input 
                                        type="number"
                                        defaultValue={product.stock ?? 0}
                                        onBlur={(e) => updateProduct(product.id, { stock: Number(e.target.value) })}
                                        className="text-xs font-bold text-gray-900 dark:text-white bg-transparent w-full outline-none"
                                      />
                                  </div>
                              </div>
                          ) : (
                            <>
                                <div className="flex items-center space-x-1.5">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
                                    {product.isPromo && <CheckCircle2 size={12} className="text-indigo-500" />}
                                </div>
                                <p className="text-xs text-synergy-blue font-bold mt-0.5">฿{(product.price ?? 0).toLocaleString()}</p>
                            </>
                          )}
                          
                          <div className="flex space-x-2 mt-2">
                              {editingId === product.id ? (
                                  <div className="space-y-1.5">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Category</label>
                                      <div className="relative w-32">
                                          <select 
                                              value={product.category}
                                              onChange={(e) => updateProduct(product.id, { category: e.target.value })}
                                              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none appearance-none pr-8 dark:text-white"
                                          >
                                              {['Health', 'Gadgets', 'Beauty', 'Fashion', 'Home'].map(cat => (
                                                  <option key={cat} value={cat}>{cat}</option>
                                              ))}
                                          </select>
                                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                              <ChevronDown size={12} />
                                          </div>
                                      </div>
                                  </div>
                              ) : (
                                <>
                                  <span className="text-[10px] bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-400 border border-gray-100 dark:border-gray-600">{product.category}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 border ${product.stock > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 border-emerald-100 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-500 border-red-100 dark:border-red-800'}`}>
                                    {product.stock} in stock
                                  </span>
                                </>
                              )}
                              <span className="text-[10px] bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-400 shrink-0 border border-gray-100 dark:border-gray-600">{product.sold} Sold</span>
                          </div>
                      </div>
                  </div>

                  {editingId === product.id ? (
                      <div className="space-y-4 pt-3 border-t border-gray-50 dark:border-gray-700 animate-in fade-in slide-in-from-top-1">
                          
                          {/* Promotion Controls */}
                          <div className="flex items-center space-x-3 bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                             <div 
                                onClick={() => updateProduct(product.id, { isPromo: !product.isPromo })}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all cursor-pointer ${product.isPromo ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}
                             >
                                {product.isPromo && <Check size={14} strokeWidth={4} />}
                             </div>
                             <div className="flex-1">
                                <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">Set as Promotion</span>
                             </div>
                             {product.isPromo && (
                                <div className="flex flex-col space-y-2 flex-1 ml-3">
                                    <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-700">
                                        <input 
                                            type="number"
                                            defaultValue={product.promoDiscount || 0}
                                            onBlur={(e) => updateProduct(product.id, { promoDiscount: Number(e.target.value) })}
                                            className="w-8 text-xs font-black text-indigo-500 bg-transparent outline-none text-center"
                                        />
                                        <span className="text-[10px] font-black text-indigo-300">%</span>
                                    </div>
                                    <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter text-center">
                                        10%=MKT | 20%=BLD | 30%=EXE
                                    </p>
                                    <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-700">
                                        <Clock size={10} className="text-indigo-400" />
                                        <input 
                                            type="datetime-local"
                                            defaultValue={product.expiryDate ? new Date(product.expiryDate).toISOString().slice(0, 16) : ''}
                                            onChange={(e) => updateProduct(product.id, { expiryDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                            className="text-[9px] font-black text-indigo-500 bg-transparent outline-none w-full"
                                        />
                                    </div>
                                </div>
                             )}
                          </div>

                          <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center">
                                  <FileText size={10} className="mr-1" />
                                  Product Story
                              </label>
                              <textarea 
                                defaultValue={product.description || ''}
                                onBlur={(e) => updateProduct(product.id, { description: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-xs h-24 resize-none focus:ring-1 focus:ring-indigo-500 outline-none dark:text-white"
                                placeholder="Describe the product..."
                              />
                          </div>

                          {/* Gallery Management */}
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center">
                                  <Images size={10} className="mr-1" />
                                  Gallery Images
                              </label>
                              <div className="flex flex-wrap gap-2">
                                  {(product.images || []).map((img, idx) => (
                                      <div key={idx} className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden relative group shrink-0 shadow-sm border border-gray-200 dark:border-gray-600">
                                          <img src={img || undefined} className="w-full h-full object-cover" alt="Gallery" />
                                          <button 
                                              onClick={() => handleRemoveGalleryImage(product.id, idx, product.images || [])}
                                              className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition"
                                          >
                                              <X size={10} />
                                          </button>
                                      </div>
                                  ))}
                                  <label className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-300 cursor-pointer hover:border-indigo-500 hover:text-indigo-500 transition">
                                      <Plus size={20} />
                                      <input 
                                          type="file" 
                                          className="hidden" 
                                          accept="image/*"
                                          onChange={(e) => handleAddGalleryImage(e, product)}
                                      />
                                  </label>
                              </div>
                          </div>

                          {/* Description Images Management */}
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center">
                                  <ImageIcon size={10} className="mr-1" />
                                  Description Images (Long Details)
                              </label>
                              <div className="flex flex-wrap gap-2">
                                  {(product.descriptionImages || []).map((img, idx) => (
                                      <div key={idx} className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden relative group shrink-0 shadow-sm border border-gray-200 dark:border-gray-600">
                                          <img src={img || undefined} className="w-full h-full object-cover" alt="Description" />
                                          <button 
                                              onClick={() => handleRemoveDescriptionImage(product.id, idx, product.descriptionImages || [])}
                                              className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition"
                                          >
                                              <X size={10} />
                                          </button>
                                      </div>
                                  ))}
                                  <label className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-300 cursor-pointer hover:border-indigo-500 hover:text-indigo-500 transition">
                                      <Plus size={20} />
                                      <input 
                                          type="file" 
                                          className="hidden" 
                                          accept="image/*"
                                          onChange={(e) => handleAddDescriptionImage(e, product)}
                                      />
                                  </label>
                              </div>
                          </div>

                          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-xs border border-gray-100 dark:border-gray-600">
                             <ImageIcon size={14} className="text-gray-400" />
                             <input 
                                placeholder="Primary Image URL" 
                                value={product.image.startsWith('data:') ? '' : product.image}
                                onChange={(e) => updateProduct(product.id, { image: e.target.value })}
                                className="bg-transparent w-full outline-none dark:text-white text-[10px]"
                             />
                          </div>
                          
                          <div className="flex space-x-2">
                              <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl text-[10px] font-bold uppercase border border-gray-200 dark:border-gray-600">Cancel</button>
                              <button onClick={() => handleSave(product.id)} className="flex-1 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase flex items-center justify-center space-x-1 shadow-sm"><Save size={12} /><span>Save Assets</span></button>
                          </div>
                      </div>
                  ) : (
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between px-1">
                            {product.description ? (
                                <p className="text-[10px] text-gray-400 line-clamp-1 italic">"{product.description}"</p>
                            ) : <div></div>}
                            <div className="flex -space-x-2">
                                {(product.images || []).slice(0, 3).map((img, i) => (
                                    <img key={i} src={img || undefined} className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 object-cover" alt="mini" />
                                ))}
                                {(product.images?.length || 0) > 3 && (
                                    <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[6px] font-bold text-gray-400">
                                        +{(product.images?.length || 0) - 3}
                                    </div>
                                )}
                            </div>
                            {product.descriptionImages && product.descriptionImages.length > 0 && (
                                <div className="flex items-center space-x-1 ml-2">
                                    <ImageIcon size={10} className="text-gray-300" />
                                    <span className="text-[8px] font-bold text-gray-300 uppercase">{product.descriptionImages.length} Details</span>
                                </div>
                            )}
                        </div>
                        <div className="flex space-x-2 pt-1 border-t border-gray-50 dark:border-gray-700">
                            <button onClick={() => handleEditClick(product.id)} className="flex-1 py-2 bg-gray-50 dark:bg-gray-700 text-gray-400 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center space-x-2 hover:bg-indigo-50 hover:text-indigo-600 transition border border-transparent dark:border-gray-700"><Edit size={14} /><span>Edit Assets</span></button>
                            <button onClick={() => deleteProduct(product.id)} className="p-2 bg-red-50 text-red-500 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition border border-transparent dark:border-gray-700"><Trash2 size={16} /></button>
                        </div>
                      </div>
                  )}
              </div>
          ))}
      </div>
      
      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800">
          <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center"><Gift size={14} className="mr-2" /> Promotion Tip</h4>
          <p className="text-[10px] text-amber-500 leading-relaxed">
            Marking a product as "Promotion" will move it to the sliding banner section on the Home page. These products are filtered out from the general list below to prevent redundant content.
          </p>
      </div>
    </div>
  );
};
