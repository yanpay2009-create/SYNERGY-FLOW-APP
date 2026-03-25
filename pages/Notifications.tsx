
import React, { useState, useEffect, useRef } from 'react';
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
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Notification, CommissionTransaction, UserTier } from '../types';

export const Notifications: React.FC = () => {
  const { notifications, markNotificationAsRead, t, user, allCommissions, allOrders, broadcastPromotion } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const handledNotifId = useRef<string | null>(null);

  useEffect(() => {
    const openNotifId = location.state?.openNotifId;
    if (openNotifId && notifications.length > 0 && handledNotifId.current !== String(openNotifId)) {
        const notif = notifications.find(n => String(n.id) === String(openNotifId));
        if (notif) {
            handleNotifClick(notif);
            handledNotifId.current = String(openNotifId);
            // Clear state to prevent re-triggering
            window.history.replaceState({}, document.title);
        }
    }
  }, [location.state, notifications]);

  const getIcon = (notif: Notification) => {
    if (notif.userId === 'global') {
        if (notif.type === 'promo') return <Sparkles size={20} />;
        return <Users size={20} />;
    }
    switch (notif.type) {
      case 'order': return <ShoppingBag size={20} />;
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

  function handleNotifClick(notif: Notification) {
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

    // 2. Personal commission notification -> go to commission history
    if (notif.relatedType === 'commission' || notif.title.includes('Commission') || notif.title.includes('ค่าคอมมิชชั่น')) {
        const txId = notif.relatedId;
        navigate('/commissions', { state: { txId } });
        return;
    }

    // 3. Personal order notification -> go to orders
    if (notif.type === 'order') {
        navigate('/my-orders');
        return;
    }
    
    // 4. Default -> show general detail popup
    setSelectedNotif(notif);
  }

  const theme = {
    gradient: 'from-synergy-blue to-blue-600',
    communityGradient: 'from-indigo-600 to-purple-600'
  };

  return (
    <div className="pb-24 pt-0 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header 
        title="Notifications" 
        onBack={() => navigate(-1)}
        rightElement={
          <button 
            className="text-[10px] font-black uppercase tracking-widest text-synergy-blue bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800"
            onClick={() => notifications.forEach(n => markNotificationAsRead(n.id))}
          >
            Mark all read
          </button>
        }
      />

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
