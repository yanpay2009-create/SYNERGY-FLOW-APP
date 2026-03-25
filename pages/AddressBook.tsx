
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Plus, Trash2, Edit2, Check, MapPin, Loader2, Navigation, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AddressBook: React.FC = () => {
  const { addresses, selectedAddressId, selectAddress, addAddress, updateAddress, removeAddress, language, showToast } = useApp();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', houseNumber: '', phone: '', address: '', city: '', zip: '', isDefault: false
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const combinedAddress = `${formData.houseNumber} ${formData.address}`.trim();
    const { houseNumber, ...submitData } = formData;
    
    if (editingAddressId) {
      await updateAddress(editingAddressId, { ...submitData, address: combinedAddress });
    } else {
      await addAddress({ ...submitData, address: combinedAddress });
    }
    
    setShowAddForm(false);
    setEditingAddressId(null);
    setFormData({ name: '', houseNumber: '', phone: '', address: '', city: '', zip: '', isDefault: false });
  };

  const handleEdit = (addr: any) => {
    const parts = addr.address.split(' ');
    const houseNum = parts[0];
    const restAddress = parts.slice(1).join(' ');
    
    setFormData({
      name: addr.name,
      houseNumber: houseNum,
      phone: addr.phone,
      address: restAddress,
      city: addr.city,
      zip: addr.zip,
      isDefault: addr.isDefault
    });
    setEditingAddressId(addr.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    await removeAddress(id);
    setShowDeleteConfirm(null);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
        showToast({ message: "Sorry, your browser does not support location services.", type: 'error' });
        return;
    }
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=${language === 'th' ? 'th' : 'en'}`, {
                headers: { 'User-Agent': 'SynergyFlowApp/3.0' }
            });
            const data = await response.json();
            if (data && data.address) {
                const addr = data.address;
                const houseNum = addr.house_number || '';
                const village = addr.village || addr.neighbourhood || addr.suburb || '';
                const road = addr.road || '';
                const subDistrict = addr.subdistrict || addr.suburb || '';
                const district = addr.city_district || addr.town || addr.district || '';
                const province = addr.city || addr.province || addr.state || '';
                const zip = addr.postcode || '';
                let areaDetails = '';
                if (village && village !== subDistrict) areaDetails += village + ' ';
                if (road) areaDetails += 'Road ' + road + ' ';
                const parts = [];
                if (subDistrict) parts.push(subDistrict);
                if (district) parts.push(district);
                const finalAreaLine = areaDetails + parts.join(', ');
                setFormData(prev => ({ ...prev, houseNumber: houseNum, address: finalAreaLine.trim(), city: province.replace('Province', '').trim(), zip: zip }));
            }
        } catch (error) {
            console.error("Error fetching address:", error);
        } finally {
            setIsLoadingLocation(false);
        }
    }, (error) => {
        setIsLoadingLocation(false);
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="sticky top-0 z-[100] bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 -mx-4 px-4 pt-12 pb-3 mb-6 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white tracking-tight">Shipping Address</h1>
          </div>
        </div>
      </div>

      {showAddForm ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[32px] shadow-soft dark:shadow-none border border-transparent dark:border-gray-700 animate-in slide-in-from-bottom-5 duration-300">
           <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingAddressId ? 'Edit Address' : 'New Address'}</h2>
                <button 
                    type="button" onClick={handleUseLocation} disabled={isLoadingLocation}
                    className="flex items-center space-x-2 text-synergy-blue font-bold text-xs bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800 active:scale-95 transition"
                >
                    {isLoadingLocation ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} className="fill-current" />}
                    <span>{isLoadingLocation ? 'Locating...' : 'GPS Auto-fill'}</span>
                </button>
           </div>
           
           <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">Recipient Name</label>
                  <input 
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-synergy-blue/20 outline-none dark:text-white"
                    placeholder="First and Last Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required
                  />
              </div>

              <div className="flex space-x-3">
                <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">Phone Number</label>
                    <input 
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-sm outline-none dark:text-white focus:ring-2 focus:ring-synergy-blue/20"
                        placeholder="08X-XXX-XXXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required
                    />
                </div>
                <div className="w-28 space-y-1 shrink-0">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">Address No.</label>
                    <input 
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-sm outline-none dark:text-white focus:ring-2 focus:ring-synergy-blue/20"
                        placeholder="123/45" value={formData.houseNumber} onChange={e => setFormData({...formData, houseNumber: e.target.value})} required
                    />
                </div>
              </div>

              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">Street, Sub-district, Building</label>
                  <textarea 
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-sm h-20 resize-none focus:ring-2 focus:ring-synergy-blue/20 outline-none dark:text-white"
                    placeholder="Enter street and area details" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required
                  />
              </div>

              <div className="flex space-x-3">
                <div className="w-1/2 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">City / Province</label>
                    <input 
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-sm outline-none dark:text-white focus:ring-2 focus:ring-synergy-blue/20"
                        placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required
                    />
                </div>
                <div className="w-1/2 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">Zip Code</label>
                    <input 
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl p-3 text-sm outline-none dark:text-white focus:ring-2 focus:ring-synergy-blue/20"
                        placeholder="10XXX" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} required
                    />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Set as Default Address</span>
                  <button 
                    type="button" onClick={() => setFormData({...formData, isDefault: !formData.isDefault})}
                    className={`w-10 h-5 rounded-full transition-colors relative ${formData.isDefault ? 'bg-synergy-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.isDefault ? 'translate-x-6' : 'translate-x-1'}`}></div>
                  </button>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 rounded-2xl bg-synergy-blue text-white font-bold text-sm shadow-glow shadow-synergy-blue/20">{editingAddressId ? 'Update Address' : 'Save Address'}</button>
              </div>
           </form>
        </div>
      ) : (
        <>
           <div className="space-y-4">
              {addresses.map(addr => (
                  <div 
                    key={addr.id} onClick={() => selectAddress(addr.id)}
                    className={`p-5 rounded-[24px] border transition cursor-pointer relative overflow-hidden ${selectedAddressId === addr.id ? 'bg-blue-50 dark:bg-blue-900/20 border-synergy-blue shadow-sm' : 'bg-white dark:bg-gray-800 border-transparent shadow-soft'}`}
                  >
                     <div className="flex items-start space-x-4 relative z-10">
                        <div className={`w-6 h-6 mt-1 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAddressId === addr.id ? 'border-synergy-blue bg-synergy-blue text-white' : 'border-gray-200 dark:border-gray-700'}`}>
                            {selectedAddressId === addr.id && <Check size={14} strokeWidth={4} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-gray-900 dark:text-white text-sm">{addr.name}</span>
                                <div className="flex items-center space-x-1">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEdit(addr); }}
                                        className="p-2 text-gray-400 hover:text-synergy-blue hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(addr.id); }}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium">{addr.phone}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                                {addr.address}, {addr.city} {addr.zip}
                            </p>
                            {addr.isDefault && (
                                <div className="mt-3 inline-flex items-center space-x-1 bg-synergy-blue/10 dark:bg-blue-400/10 text-synergy-blue dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-synergy-blue/20">
                                    <span className="text-[9px] font-black uppercase tracking-wider">Default</span>
                                </div>
                            )}
                        </div>
                     </div>
                  </div>
              ))}
           </div>
           
           <button 
             onClick={() => { setEditingAddressId(null); setFormData({ name: '', houseNumber: '', phone: '', address: '', city: '', zip: '', isDefault: false }); setShowAddForm(true); }}
             className="mt-8 w-full py-5 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 rounded-[24px] flex items-center justify-center space-x-3 hover:border-synergy-blue hover:text-synergy-blue dark:hover:border-blue-800 transition group"
           >
              <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-50 transition">
                <Plus size={24} />
              </div>
              <span className="font-bold text-sm">Add New Address</span>
           </button>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowDeleteConfirm(null)}></div>
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 border border-white/10">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Address?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                Are you sure you want to remove this shipping address? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
