
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Tag, 
  Info, 
  Check, 
  X, 
  Calendar, 
  Bell, 
  ChevronRight,
  ArrowRight,
  Zap,
  Sparkles,
  Hash,
  Shield,
  Globe,
  Users,
  Trophy,
  Award,
  Clock,
  TrendingUp
} from 'lucide-react';
import { ShoppingBagIcon } from '../components/ShoppingBagIcon';
import { useNavigate } from 'react-router-dom';
import { Notification, CommissionTransaction, UserTier } from '../types';

export const Notifications: React.FC = () => {
  const { notifications, markNotificationAsRead, t, user, allCommissions, allOrders, broadcastPromotion } = useApp();
  const navigate = useNavigate();
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [selectedCommission, setSelectedCommission] = useState<CommissionTransaction | null>(null);

  const getIcon = (notif: Notification) => {
    if (notif.userId === 'global') {
        if (notif.type === 'promo') return <Sparkles size={20} />;
        return <Users size={20} />;
    }
    switch (notif.type) {
      case 'order': return <ShoppingBagIcon size={20} />;
      case 'promo': return <Tag size={20} />;
      default: return <Info size={20} />;
    }
  };

  const getColor = (notif: Notification) => {
    if (notif.userId === 'global') {
        if (notif.type === 'promo') return 'bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400';
        return 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400';
    }
    switch (notif.type) {
      case 'order': return 'bg-blue-50 text-synergy-blue dark:bg-blue-900/30 dark:text-blue-400';
      case 'promo': return 'bg-pink-50 text-pink-500 dark:bg-pink-900/30 dark:text-pink-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const handleNotifClick = (notif: Notification) => {
    markNotificationAsRead(notif.id);
    
    // 1. Handle Platform Event (Promotion Broadcast)
    if (notif.relatedType === 'promo' && notif.relatedData) {
        try {
            const promoInfo = JSON.parse(notif.relatedData);
            broadcastPromotion(promoInfo); 
            return;
        } catch (e) {
            console.error("Failed to parse promo metadata", e);
        }
    }

    // 2. Personal commission notification -> show detail popup
    if (notif.relatedType === 'commission' || notif.title.includes('Commission Settled')) {
        const txId = Number(notif.relatedId);
        const commission = allCommissions.find(c => c.id === txId);
        if (commission) {
            setSelectedCommission(commission);
            return;
        }
    }

    // 3. Personal order notification -> go to orders
    if (notif.type === 'order') {
        navigate('/my-orders');
        return;
    }
    
    // 4. Default -> show general detail popup
    setSelectedNotif(notif);
  };

  const theme = {
    gradient: 'from-synergy-blue to-blue-600',
    communityGradient: 'from-indigo-600 to-purple-600'
  };

  const linkedOrder = selectedCommission?.orderId ? allOrders.find(o => o.id === selectedCommission.orderId) : null;

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition">
            <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Notifications</h1>
        </div>
        <button 
            className="text-[10px] font-black uppercase tracking-widest text-synergy-blue bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800"
            onClick={() => notifications.forEach(n => markNotificationAsRead(n.id))}
        >
            Mark all read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
             <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-700">
                 <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                     <Bell size={32} />
                 </div>
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No notifications yet</p>
             </div>
        ) : (
            notifications.map(notif => {
                const timestamp = new Date(notif.id).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

                return (
                    <div 
                        key={notif.id} 
                        onClick={() => handleNotifClick(notif)}
                        className={`p-4 rounded-[24px] flex items-start space-x-4 transition cursor-pointer active:scale-[0.98] ${notif.read ? 'bg-white/60 dark:bg-gray-800/40 opacity-80' : 'bg-white dark:bg-gray-800 shadow-soft dark:shadow-none border border-transparent hover:border-gray-100 dark:hover:border-gray-700'}`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm relative ${getColor(notif)}`}>
                            {getIcon(notif)}
                            {notif.userId === 'global' && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border-2 border-transparent">
                                    <Globe size={8} className="text-blue-500" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center min-w-0 pr-2">
                                    <h4 className={`text-sm truncate ${notif.read ? 'font-medium text-gray-600 dark:text-gray-400' : 'font-black text-gray-900 dark:text-white'}`}>
                                        {notif.title}
                                    </h4>
                                    {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-synergy-blue shadow-glow shrink-0 ml-2"></div>}
                                </div>
                                <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap uppercase tracking-tighter mt-0.5">{timestamp}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed line-clamp-2 text-gray-500 dark:text-gray-400">
                                {notif.message}
                            </p>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* POPUP 2: PERSONAL COMMISSION DETAIL */}
      {selectedCommission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedCommission(null)}>
              <div className="bg-white dark:bg-gray-900 w-full max-w-[310px] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 relative border border-white/20 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
                  <div className={`p-5 bg-gradient-to-r ${theme.gradient} flex justify-between items-center relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                      <div className="flex items-center space-x-3 relative z-10">
                          <div className="w-14 h-14 rounded-full border-2 border-white/60 overflow-hidden shadow-md bg-white/20">
                              <img src={user?.avatar || undefined} className="w-full h-full object-cover" alt="User" />
                          </div>
                          <div className="min-w-0 text-white">
                              <h3 className="font-black text-[13px] tracking-wide leading-tight">My Commission</h3>
                              <p className="text-[9px] font-bold uppercase opacity-80">{user?.tier} Rank</p>
                          </div>
                      </div>
                      <div className="relative z-10">
                          <button onClick={() => setSelectedCommission(null)} className="p-1.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition">
                              <X size={16} />
                          </button>
                      </div>
                  </div>

                  <div className="p-5 space-y-5">
                      <div className="text-center py-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                              {selectedCommission.type} Earnings
                          </p>
                          <h2 className={`text-3xl font-black ${selectedCommission.status === 'Paid' ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                              ฿{(selectedCommission.amount ?? 0).toLocaleString()}
                          </h2>
                          <div className={`mt-2 inline-flex px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${selectedCommission.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>
                              {selectedCommission.status}
                          </div>
                      </div>

                      <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center space-x-2 text-gray-400"><Calendar size={12} /><span>Date</span></div>
                              <span className="font-bold text-gray-900 dark:text-white">{selectedCommission.date}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center space-x-2 text-gray-400"><Hash size={12} /><span>Order</span></div>
                              <span className="font-bold text-gray-900 dark:text-white">#{selectedCommission.orderId?.split('-')[1] || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-100 shadow-sm bg-gray-100 shrink-0">
                                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCommission.source}`} className="w-full h-full object-cover" alt="Buyer" />
                                  </div>
                                  <span className="font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{selectedCommission.source.replace('Direct Order: ', '').replace('Team Order: ', '')}</span>
                              </div>
                              <span className="font-black text-[10px] text-gray-900 dark:text-white uppercase tracking-tighter">
                                  Success
                              </span>
                          </div>
                      </div>

                      {linkedOrder && (
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2.5 flex items-center"><ShoppingBagIcon size={10} className="mr-1" /> Items</p>
                              <div className="flex space-x-2 overflow-x-auto no-scrollbar">
                                  {linkedOrder.items.map((item, idx) => (
                                      <div key={idx} className="relative w-10 h-10 shrink-0">
                                          <img src={item.image || undefined} className="w-full h-full object-cover rounded-md border border-white dark:border-gray-700 shadow-sm" alt="p" />
                                          <div className="absolute -top-1 -right-1 bg-synergy-blue text-white w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold">x{item.quantity}</div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* POPUP 3: GENERAL NOTIF */}
      {selectedNotif && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedNotif(null)}>
              <div className="bg-white dark:bg-gray-900 w-full max-w-[310px] rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 relative border border-white/20 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
                  <div className={`p-6 bg-gradient-to-br from-gray-700 to-gray-900 flex justify-between items-start relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                      <div className="relative z-10 text-white">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-4 shadow-lg">
                              {getIcon(selectedNotif)}
                          </div>
                          <h3 className="font-black text-lg tracking-tight leading-tight">Notice</h3>
                      </div>
                      <button onClick={() => setSelectedNotif(null)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition relative z-10">
                          <X size={18} />
                      </button>
                  </div>
                  <div className="p-6">
                      <div className="mb-6">
                          <h2 className="text-lg font-black text-gray-900 dark:text-white leading-snug mb-3">{selectedNotif.title}</h2>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-700">
                             <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{selectedNotif.message}</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => setSelectedNotif(null)}
                        className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition"
                      >
                          Okay
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
