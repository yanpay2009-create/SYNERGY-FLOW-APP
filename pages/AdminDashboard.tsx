import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, Users, CreditCard, Wallet, Search, 
  Trash2, X, Zap, Camera, Heart, MessageCircle,
  Sparkles, Link as LinkIcon, Activity, 
  Globe, ImageIcon, Printer, Play, 
  QrCode, Loader2, ShieldCheck, Box, ClipboardList, Check, CheckCircle, Landmark, Banknote, Edit2, Mail,
  Layout, Megaphone, Monitor, ChevronRight, ChevronLeft, RotateCcw, Truck, AlertTriangle
} from 'lucide-react';
import { ShoppingBagIcon } from '../components/ShoppingBagIcon';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { OrderStatus, UserTier, Order, CommissionTransaction, FeedItem, TeamMember } from '../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    allTeamMembers, allCommissions, allOrders, feed, activePromo, products,
    broadcastPromotion, dismissPromotion, updateOrderStatus, deleteOrder, 
    updateCommissionStatus, deleteCommission, deleteTeamMember, updateMemberTier, 
    updateFeedStatus, deleteFeedPost, systemSettings, updateSystemSettings, updateUserKycStatus, showToast,
    updateUserReferralCode, factoryReset, healReferralCodes, healPhoneMap, healTeamSizes, healUplinePaths, updateUserRole
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'Members' | 'Orders' | 'Withdrawals' | 'Posts' | 'KYC' | 'Settings' | 'Events'>('Members');
  
  const [promoForm, setPromoForm] = useState({ title: 'Special Promotion', image: '', link: '' });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<CommissionTransaction | null>(null);
  const [selectedKyc, setSelectedKyc] = useState<TeamMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isEditingRefCode, setIsEditingRefCode] = useState(false);
  const [newRefCode, setNewRefCode] = useState('');
  const [previewPost, setPreviewPost] = useState<FeedItem | null>(null);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  
  const [printingLabel, setPrintingLabel] = useState<Order | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle video playback safely
  useEffect(() => {
    let isMounted = true;
    if (previewPost?.type === 'video' && videoRef.current) {
        const video = videoRef.current;
        const playVideo = async () => {
            if (!video.isConnected) return;
            try {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    await playPromise;
                }
            } catch (err) {
                // Ignore play interruptions and media removed errors
                if (isMounted && err instanceof Error && 
                    err.name !== 'AbortError' && 
                    !err.message.includes('interrupted') &&
                    !err.message.includes('removed')) {
                    console.error("Video playback failed:", err);
                }
            }
        };
        playVideo();
    }
    return () => { isMounted = false; };
  }, [previewPost]);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Payment Verification States
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [isCheckingBank, setIsCheckingBank] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Helpers
  const parseWithdrawal = (source: string) => {
    if (!source || !source.includes('|')) return { name: 'Unknown', bank: 'Unknown', account: source || 'N/A' };
    const parts = source.replace('Withdrawal:', '').split('|');
    return {
        name: parts[0]?.trim() || 'N/A',
        bank: parts[1]?.trim() || 'N/A',
        account: parts[2]?.replace('ACC:', '').trim() || 'N/A'
    };
  };

  const withdrawals = useMemo(() => allCommissions.filter(c => c.type === 'Withdrawal'), [allCommissions]);
  const pendingWithdrawalsCount = useMemo(() => withdrawals.filter(w => w.status === 'Waiting').length, [withdrawals]);
  const pendingPostsCount = useMemo(() => feed.filter(p => p.status === 'Pending').length, [feed]);

  const totalMembers = allTeamMembers.length;
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((acc, o) => acc + o.total, 0);

  const filteredList = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    if (activeTab === 'Members') {
      return allTeamMembers.filter(m => {
        const matchesQuery = m.name.toLowerCase().includes(query) || m.id.toString().includes(query);
        const matchesStatus = statusFilter === 'All' || m.tier === statusFilter;
        return matchesQuery && matchesStatus;
      });
    }
    
    if (activeTab === 'Orders') {
      return allOrders.filter(o => {
        const matchesQuery = o.id.toLowerCase().includes(query) || o.shippingAddress.name.toLowerCase().includes(query) || o.shippingAddress.phone.includes(query);
        const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
        return matchesQuery && matchesStatus;
      });
    }
    
    if (activeTab === 'Withdrawals') {
      return withdrawals.filter(w => {
        const matchesQuery = w.source.toLowerCase().includes(query) || w.id.toString().includes(query);
        const matchesStatus = statusFilter === 'All' || w.status === statusFilter;
        return matchesQuery && matchesStatus;
      });
    }

    if (activeTab === 'Posts') {
        return feed.filter(p => {
            const matchesQuery = p.user.toLowerCase().includes(query) || p.caption.toLowerCase().includes(query);
            const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
            return matchesQuery && matchesStatus;
        }).sort((a, b) => (a.status === 'Pending' ? -1 : 1));
    }

    if (activeTab === 'KYC') {
        return allTeamMembers.filter(m => {
            const matchesQuery = m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query);
            // Only show members who have submitted KYC (Pending or Verified)
            const hasSubmitted = m.kycStatus === 'Pending' || m.kycStatus === 'Verified' || m.kycStatus === 'Rejected';
            const matchesStatus = statusFilter === 'All' ? hasSubmitted : m.kycStatus === statusFilter;
            return matchesQuery && matchesStatus;
        });
    }
    
    return [];
  }, [activeTab, searchQuery, statusFilter, allTeamMembers, allOrders, withdrawals, feed]);

  const filterOptions = useMemo(() => {
    if (activeTab === 'Members') return ['All', 'Starter', 'Marketer', 'Builder', 'Executive'];
    if (activeTab === 'Orders') return ['All', 'Pending', 'To Ship', 'Shipped', 'Delivered'];
    if (activeTab === 'Withdrawals') return ['All', 'Waiting', 'Completed'];
    if (activeTab === 'Posts') return ['All', 'Pending', 'Approved'];
    if (activeTab === 'KYC') return ['All', 'Unverified', 'Pending', 'Verified'];
    return ['All'];
  }, [activeTab]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            updateSystemSettings({ logo: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSlipBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            updateSystemSettings({ slipBackground: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleContactLinkUpdate = (key: string, value: string) => {
    updateSystemSettings({
        contactLinks: {
            ...systemSettings.contactLinks,
            [key]: value
        } as any
    });
  };

  const handleOpenVerifyPayment = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    setVerifyingOrder(order);
    setVerificationSuccess(false);
    setIsCheckingBank(false);
  };

  const startVerificationProcess = async () => {
    setIsCheckingBank(true);
    // Simulate verification delay
    await new Promise(r => setTimeout(r, 2800));
    
    setIsCheckingBank(false);
    setVerificationSuccess(true);
    
    // Final delay before closing and moving to next step
    await new Promise(r => setTimeout(r, 1500));
    
    if (verifyingOrder) {
        await updateOrderStatus(verifyingOrder.id, 'To Ship');
        setPrintingLabel(verifyingOrder);
        setVerifyingOrder(null);
    }
  };

  const handleUpdateOrder = async (e: React.MouseEvent, id: string, currentStatus: OrderStatus) => {
      e.stopPropagation();
      let next: OrderStatus = 'Pending';
      if (currentStatus === 'Pending') next = 'To Ship';
      else if (currentStatus === 'To Ship') next = 'Shipped';
      else if (currentStatus === 'Shipped') next = 'Delivered';
      
      if (next !== currentStatus) {
          await updateOrderStatus(id, next);
          showToast({ message: `Order status updated to ${next}`, type: 'success' });
          if (next === 'To Ship') {
              const order = allOrders.find(o => o.id === id);
              if (order) setPrintingLabel(order);
          }
      }
  };

  const handleDeleteOrder = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      await deleteOrder(id);
      showToast({ message: 'Order deleted', type: 'info' });
      if (selectedOrder?.id === id) setSelectedOrder(null);
  };

  const handleApproveWithdrawal = async (id: number) => {
      await updateCommissionStatus(id, 'Completed');
      showToast({ message: 'Withdrawal Approved', type: 'success' });
      setSelectedWithdrawal(null);
  };

  const handleRejectWithdrawal = async (id: number) => {
      await updateCommissionStatus(id, 'Waiting');
      showToast({ message: 'Withdrawal marked as Waiting', type: 'info' });
      setSelectedWithdrawal(null);
  };

  const handleDeleteWithdrawal = async (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      await deleteCommission(id);
      showToast({ message: 'Withdrawal record deleted', type: 'info' });
      if (selectedWithdrawal?.id === id) setSelectedWithdrawal(null);
  };

  const handleDeleteMember = async (id: string | number) => {
      await deleteTeamMember(id);
      showToast({ message: 'Member removed', type: 'info' });
  };

  const handleUpdateRefCode = async () => {
    if (!selectedMember || !newRefCode) return;
    await updateUserReferralCode(selectedMember.id.toString(), newRefCode.toUpperCase());
    setSelectedMember({ ...selectedMember, referralCode: newRefCode.toUpperCase() });
    setIsEditingRefCode(false);
    setNewRefCode('');
  };

  const handleToggleTier = async (id: string | number, currentTier: UserTier) => {
      const tiers = [UserTier.STARTER, UserTier.MARKETER, UserTier.BUILDER, UserTier.EXECUTIVE];
      const currentIndex = tiers.indexOf(currentTier);
      const nextIndex = (currentIndex + 1) % tiers.length;
      const nextTier = tiers[nextIndex];
      await updateMemberTier(id, nextTier);
      showToast({ message: `Member tier updated to ${nextTier}`, type: 'success' });
  };

  const handleApprovePost = async (id: number) => {
      await updateFeedStatus(id, 'Approved');
      showToast({ message: 'Post Approved', type: 'success' });
      setPreviewPost(null);
  };

  const handleDeletePost = async (id: number) => {
      await deleteFeedPost(id);
      showToast({ message: 'Post Deleted', type: 'info' });
      setPreviewPost(null);
  };

  const handlePromoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPromoForm(prev => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleBroadcast = () => {
      if (!promoForm.image) {
          showToast({ message: "Please upload a promo image.", type: 'error' });
          return;
      }
      setIsBroadcasting(true);
      setTimeout(() => {
          broadcastPromotion(promoForm);
          setIsBroadcasting(false);
          showToast({ message: "Full-screen broadcast sent to all active sessions.", type: 'success' });
      }, 800);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) setSearchQuery('');
  };

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }

    return pages.map((p, i) => (
      <button
        key={i}
        onClick={() => typeof p === 'number' && setCurrentPage(p)}
        disabled={p === '...'}
        className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${p === currentPage ? 'bg-synergy-blue text-white shadow-glow' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'}`}
      >
        {p}
      </button>
    ));
  };

  return (
    <div className="pb-24 pt-16 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400">
            <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-black ml-2 text-gray-900 dark:text-white tracking-tight">Admin System</h1>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">System Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
          <div 
            onClick={() => setActiveTab('Orders')}
            className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-transparent dark:border-gray-700 hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-all cursor-pointer active:scale-[0.97]"
          >
              <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                      <Wallet size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GMV Revenue</span>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">฿{(totalRevenue ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-1">Platform Total</p>
          </div>

          <div 
            onClick={() => setActiveTab('Members')}
            className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-transparent dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all cursor-pointer active:scale-[0.97]"
          >
              <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-synergy-blue">
                      <Users size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Users</span>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{(totalMembers ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-1">Registered Base</p>
          </div>

          <div 
            onClick={() => setActiveTab('Orders')}
            className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-transparent dark:border-gray-700 hover:border-orange-100 dark:hover:border-orange-900/30 transition-all cursor-pointer active:scale-[0.97]"
          >
              <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
                      <ShoppingBagIcon size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Orders</span>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{(totalOrders ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 mt-1">Lifetime Volume</p>
          </div>

          <div 
            onClick={() => setActiveTab('Withdrawals')}
            className={`p-4 rounded-2xl shadow-sm border transition-all cursor-pointer active:scale-[0.97] ${pendingWithdrawalsCount > 0 ? 'bg-red-50/30 border-red-100 dark:bg-red-900/10 dark:border-red-900/40' : 'bg-white dark:bg-gray-800 border-transparent dark:border-gray-700 hover:border-red-100 dark:hover:border-red-900/30'}`}
          >
              <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${pendingWithdrawalsCount > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                          <CreditCard size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payout Tasks</span>
                  </div>
                  {pendingWithdrawalsCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>}
              </div>
              <p className={`text-2xl font-black ${pendingWithdrawalsCount > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{pendingWithdrawalsCount}</p>
              <p className="text-[10px] text-gray-400 mt-1">Pending Audit</p>
          </div>
      </div>

      <div className="flex space-x-2 overflow-x-auto no-scrollbar mb-6 px-1 py-1">
        {(['Members', 'Orders', 'Withdrawals', 'Posts', 'KYC', 'Events', 'Settings'] as const).map((t) => (
          <button 
            key={t}
            onClick={() => {
                setActiveTab(t);
                setStatusFilter('All');
                setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${activeTab === t ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md scale-105' : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
          >
            {t === 'Posts' && pendingPostsCount > 0 ? `Posts (${pendingPostsCount})` : t}
          </button>
        ))}
      </div>

      {activeTab === 'Settings' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-soft dark:shadow-none border border-transparent dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500">
                          <Layout size={20} />
                      </div>
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Marketing Assets</h3>
                  </div>

                  <div className="space-y-3">
                      <button 
                        onClick={() => navigate('/admin/ads')}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-all"
                      >
                          <div className="flex items-center space-x-3">
                              <Megaphone size={18} className="text-indigo-500" />
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Manage Ads & Banners</span>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                      </button>
                      <button 
                        onClick={() => navigate('/admin/onboarding')}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-all"
                      >
                          <div className="flex items-center space-x-3">
                              <Monitor size={18} className="text-indigo-500" />
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Onboarding Slides</span>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                      </button>
                  </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-soft dark:shadow-none border border-transparent dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500">
                          <ImageIcon size={20} />
                      </div>
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Platform Branding</h3>
                  </div>

                  <div className="flex flex-col items-center">
                      <div 
                        onClick={() => document.getElementById('logo-input')?.click()}
                        className="w-28 h-28 rounded-[24px] bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition group overflow-hidden relative shadow-inner"
                      >
                          {systemSettings.logo ? (
                              <>
                                <img src={systemSettings.logo || undefined} className="w-full h-full object-contain p-4" alt="Logo" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                    <Camera size={28} className="text-white" />
                                </div>
                              </>
                          ) : (
                              <div className="text-center text-gray-300 group-hover:text-indigo-500 transition">
                                  <Camera size={32} className="mx-auto" />
                                  <span className="text-[8px] font-black uppercase mt-2 block tracking-widest">Select Logo</span>
                              </div>
                          )}
                          <input id="logo-input" type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                      </div>
                  </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-soft dark:shadow-none border border-transparent dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-synergy-blue">
                          <ImageIcon size={20} />
                      </div>
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Slip Appearance</h3>
                  </div>

                  <div className="flex flex-col items-center">
                      <div 
                        onClick={() => document.getElementById('slip-bg-input')?.click()}
                        className="w-full h-32 rounded-[24px] bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-synergy-blue transition group overflow-hidden relative shadow-inner"
                      >
                          {systemSettings.slipBackground ? (
                              <>
                                <img src={systemSettings.slipBackground || undefined} className="w-full h-full object-cover" alt="Slip Background" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                    <Camera size={28} className="text-white" />
                                </div>
                              </>
                          ) : (
                              <div className="text-center text-gray-300 group-hover:text-synergy-blue transition">
                                  <Camera size={24} className="mx-auto" />
                                  <span className="text-[8px] font-black uppercase mt-2 block tracking-widest">Upload Slip Background</span>
                              </div>
                          )}
                          <input id="slip-bg-input" type="file" className="hidden" accept="image/*" onChange={handleSlipBgChange} />
                      </div>
                  </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-soft dark:shadow-none border border-transparent dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500">
                          <Globe size={20} />
                      </div>
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Official Channels</h3>
                  </div>

                  <div className="space-y-5">
                      {['line', 'phone', 'email', 'website'].map((key) => (
                        <div key={key} className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{key}</label>
                            <input 
                                defaultValue={systemSettings.contactLinks?.[key as keyof typeof systemSettings.contactLinks] || ''}
                                onBlur={(e) => handleContactLinkUpdate(key, e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl py-3.5 px-4 text-xs dark:text-white font-bold transition-all"
                            />
                        </div>
                      ))}
                  </div>
              </div>

              {/* --- DANGEROUS: FACTORY RESET --- */}
              <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-soft dark:shadow-none border border-red-100 dark:border-red-900/30">
                  <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-500">
                          <Trash2 size={20} />
                      </div>
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Danger Zone</h3>
                  </div>

                  <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 mb-6">
                      <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase leading-relaxed">
                          Factory Reset will delete all users, orders, and data. This action is irreversible and only available to the primary administrator.
                      </p>
                  </div>

                  <div className="space-y-3">
                      <button 
                        onClick={() => healReferralCodes()}
                        className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                      >
                        Heal Duplicate Referral Codes
                      </button>

                      <button 
                        onClick={() => healTeamSizes()}
                        className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                      >
                        Heal Team Sizes (Net Members)
                      </button>

                      <button 
                        onClick={() => healUplinePaths()}
                        className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                      >
                        Heal Upline Paths (Network Tree)
                      </button>

                      <button 
                        onClick={() => healPhoneMap()}
                        className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                      >
                        Heal Phone/Email Mappings (Login Fix)
                      </button>
                      
                      <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95"
                      >
                        Factory Reset System
                      </button>
                  </div>
              </div>
          </div>
      ) : activeTab === 'Events' ? (
          <div className="bg-transparent animate-in fade-in duration-500 space-y-6">
              <div className="flex items-center space-x-3 mb-2 px-2">
                  <div className="w-11 h-11 bg-indigo-100 dark:bg-indigo-900/40 rounded-[18px] flex items-center justify-center text-indigo-600 shadow-sm border border-white dark:border-gray-700">
                      <Sparkles size={22} fill="currentColor" />
                  </div>
                  <div>
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-lg">Event Broadcast</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global Promotion Hub</p>
                  </div>
              </div>

              <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-soft dark:shadow-none border border-transparent dark:border-gray-700">
                      <div className="flex items-center space-x-3 mb-4">
                          <ImageIcon size={18} className="text-synergy-blue" />
                          <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Promotion Image (PNG Transparent Recommended)</h4>
                      </div>
                      
                      <div 
                        onClick={() => document.getElementById('promo-input')?.click()}
                        className={`w-full h-64 rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 relative overflow-hidden ${promoForm.image ? 'border-transparent bg-gray-100 dark:bg-gray-900' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-synergy-blue'}`}
                        style={promoForm.image ? { backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)', backgroundSize: '10px 10px' } : {}}
                      >
                          {promoForm.image ? (
                              <img src={promoForm.image || undefined} className="w-full h-full object-contain p-4" alt="Promo" />
                          ) : (
                              <div className="text-center text-gray-300">
                                  <Camera size={32} className="mx-auto mb-2" />
                                  <p className="text-[10px] font-black uppercase tracking-widest">Select Image</p>
                              </div>
                          )}
                          <input id="promo-input" type="file" className="hidden" accept="image/*" onChange={handlePromoFileChange} />
                      </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-soft dark:shadow-none border border-transparent dark:border-gray-700">
                      <div className="space-y-5">
                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Promotion Title (Optional)</label>
                              <input 
                                type="text"
                                value={promoForm.title}
                                onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                                placeholder="e.g. Flash Sale"
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl py-4 px-4 text-xs dark:text-white font-bold"
                              />
                          </div>

                          <div className="space-y-2">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Redirect Logic (Link to Product)</label>
                              <div className="relative">
                                  <select 
                                    value={promoForm.link}
                                    onChange={(e) => setPromoForm({ ...promoForm, link: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl py-4 px-4 text-xs dark:text-white font-black appearance-none"
                                  >
                                      <option value="">-- Select Product --</option>
                                      {products.map(p => (
                                          <option key={p.id} value={p.id.toString()}>
                                              {p.name} (฿{p.price.toLocaleString()})
                                          </option>
                                      ))}
                                      <option value="/featured-products">Featured Products Page</option>
                                      <option value="/promotions">Promotions Page</option>
                                  </select>
                                  <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="px-2">
                      <button 
                        onClick={activePromo ? dismissPromotion : handleBroadcast}
                        disabled={isBroadcasting || (!activePromo && !promoForm.image)}
                        className={`w-full h-16 rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-lg flex items-center justify-center space-x-3 active:scale-95 transition-all ${activePromo ? 'bg-red-500 text-white shadow-red-200' : 'bg-synergy-blue text-white shadow-blue-200'}`}
                      >
                          {isBroadcasting ? (
                              <Loader2 size={20} className="animate-spin" />
                          ) : (
                              <>
                                  {activePromo ? <X size={20} /> : <Megaphone size={20} />}
                                  <span>{activePromo ? 'Stop Current Broadcast' : 'Launch Event Broadcast'}</span>
                              </>
                          )}
                      </button>
                      
                      {activePromo && (
                          <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl flex items-center space-x-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Broadcast is currently active</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-soft dark:shadow-none border border-transparent dark:border-gray-700 transition-all">
            <div className="flex justify-between items-center mb-5 px-1">
                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-[0.1em] text-xs">
                    {activeTab === 'Posts' ? 'Compliance Queue' : `Registry: ${activeTab}`}
                </h3>
                <div className="flex space-x-2">
                    <button 
                      onClick={toggleSearch}
                      className={`p-2 rounded-xl transition-all ${showSearch ? 'bg-synergy-blue text-white shadow-glow' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 shadow-inner'}`}
                    >
                      {showSearch ? <X size={16} /> : <Search size={16} />}
                    </button>
                </div>
            </div>

            {showSearch && (
                <div className="mb-5 animate-in slide-in-from-top-3 duration-300">
                    <input 
                      autoFocus
                      placeholder={`Search in ${activeTab.toLowerCase()}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-xs font-bold focus:outline-none dark:text-white"
                    />
                </div>
            )}

            <div className="flex space-x-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                {filterOptions.map(option => (
                    <button 
                    key={option}
                    onClick={() => setStatusFilter(option)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === option ? 'bg-synergy-blue/10 text-synergy-blue dark:bg-blue-900/40 dark:text-blue-400 ring-1 ring-inset ring-synergy-blue/20' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'}`}
                    >
                    {option}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {paginatedList.length === 0 ? (
                    <div className="text-center py-16">
                        <Activity size={48} className="mx-auto text-gray-100 dark:text-gray-800 mb-4" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Data Reservoir Empty</p>
                    </div>
                ) : (
                    paginatedList.map((item: any) => {
                        if (activeTab === 'Members') {
                            return (
                              <div key={item.id} onClick={() => setSelectedMember(item)} className="flex items-center justify-between pb-5 border-b border-gray-50 dark:border-gray-700 last:border-0 last:pb-0 cursor-pointer active:opacity-70 transition-all">
                                  <div className="flex items-center space-x-4 min-w-0">
                                      <img src={item.avatar || undefined} className="w-11 h-11 rounded-2xl object-cover border border-gray-100 dark:border-gray-700 shadow-sm" alt="Avatar" />
                                      <div className="min-w-0">
                                          <p className="text-sm font-black text-gray-900 dark:text-white truncate tracking-tight">{item.name}</p>
                                          <p className="text-[10px] text-gray-400 truncate">{item.email || 'No Email'}</p>
                                          <div className="relative mt-1" onClick={(e) => e.stopPropagation()}>
                                              <select 
                                                  value={item.tier}
                                                  onChange={(e) => updateMemberTier(item.id, e.target.value as UserTier)}
                                                  className="appearance-none bg-transparent text-[9px] text-synergy-blue font-black uppercase tracking-widest pr-4 focus:outline-none cursor-pointer"
                                              >
                                                  {Object.values(UserTier).map(tier => (
                                                      <option key={tier} value={tier}>{tier} Rank</option>
                                                  ))}
                                              </select>
                                              <ChevronRight size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-synergy-blue rotate-90 pointer-events-none" />
                                          </div>
                                      </div>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteMember(item.id); }} className="p-2.5 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl"><Trash2 size={16} /></button>
                              </div>
                            );
                        }
                        
                        if (activeTab === 'Orders') {
                            return (
                              <div key={item.id} onClick={() => setSelectedOrder(item)} className="flex items-center justify-between pb-5 border-b border-gray-50 dark:border-gray-700 last:border-0 last:pb-0 cursor-pointer active:opacity-70 transition-all">
                                  <div className="flex items-center space-x-4 min-w-0">
                                      <div className={`w-11 h-11 rounded-[18px] flex items-center justify-center shrink-0 border ${item.status === 'Pending' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                          {item.status === 'Pending' ? <QrCode size={20} /> : <ShoppingBagIcon size={20} />}
                                      </div>
                                      <div className="min-w-0">
                                          <p className="text-sm font-black text-gray-900 dark:text-white truncate tracking-tight">{item.shippingAddress.name}</p>
                                          <p className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{item.id}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-xs font-black text-gray-900 dark:text-white">฿{(item?.total ?? 0).toLocaleString()}</p>
                                      <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${item.status === 'Pending' ? 'text-amber-500' : 'text-synergy-blue'}`}>{item.status}</p>
                                  </div>
                              </div>
                            );
                        }
                        
                        if (activeTab === 'Withdrawals') {
                            const withdrawalInfo = parseWithdrawal(item.source);
                            return (
                              <div key={item.id} onClick={() => setSelectedWithdrawal(item)} className="flex items-center justify-between pb-5 border-b border-gray-50 dark:border-gray-700 last:border-0 last:pb-0 cursor-pointer active:opacity-70 transition-all">
                                  <div className="flex items-center space-x-4 min-w-0">
                                      <div className={`w-11 h-11 rounded-[18px] flex items-center justify-center shrink-0 border ${item.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-amber-50 border-amber-100 text-amber-500'}`}>
                                          <CreditCard size={20} />
                                      </div>
                                      <div className="min-w-0">
                                          <p className="text-sm font-black text-gray-900 dark:text-white truncate tracking-tight">{withdrawalInfo.name}</p>
                                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.status}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-sm font-black text-red-500">-฿{Math.abs(item?.amount ?? 0).toLocaleString()}</p>
                                      <p className={`text-[8px] text-gray-400 uppercase font-black`}>{withdrawalInfo.bank.slice(0,10)}</p>
                                  </div>
                              </div>
                            );
                        }

                        if (activeTab === 'Posts') {
                            return (
                                <div key={item.id} onClick={() => { setPreviewPost(item); setIsCaptionExpanded(false); }} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-transparent hover:border-synergy-blue/30 transition-all cursor-pointer">
                                    <div className="flex items-center space-x-4 min-w-0">
                                        <div className="w-12 h-12 bg-black rounded-xl overflow-hidden shrink-0">
                                            {item.type === 'video' ? <Play size={16} className="text-white m-auto mt-4" /> : <img src={item.content || undefined} className="w-full h-full object-cover" alt="p" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-gray-900 dark:text-white truncate">{item.user}</p>
                                            <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{item.caption}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md ${item.status === 'Pending' ? 'bg-amber-400 text-white' : 'bg-emerald-500 text-white'}`}>{item.status}</span>
                                </div>
                            );
                        }

                        if (activeTab === 'KYC') {
                            return (
                                <div key={item.id} onClick={() => setSelectedKyc(item)} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-transparent hover:border-synergy-blue/30 transition-all cursor-pointer">
                                    <div className="flex items-center space-x-4">
                                        <img src={item.avatar || undefined} className="w-10 h-10 rounded-xl" alt="u" />
                                        <div>
                                            <p className="text-xs font-black text-gray-900 dark:text-white">{item.name}</p>
                                            <p className="text-[9px] text-gray-500">{item.email || `user_${item.referralCode || item.id}@example.com`}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded-md text-[7px] font-black uppercase ${item.kycStatus === 'Verified' ? 'bg-emerald-500 text-white' : item.kycStatus === 'Pending' ? 'bg-amber-400 text-white' : 'bg-red-500 text-white'}`}>
                                            {item.kycStatus}
                                        </span>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })
                )}
            </div>

            {filteredList.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        (Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}- {Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)} of {filteredList.length} {activeTab === 'Members' ? "Member's" : activeTab})
                    </p>
                    <div className="flex items-center space-x-1">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-400 disabled:opacity-30 transition-all hover:text-synergy-blue"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        
                        <div className="flex items-center space-x-1">
                            {renderPageNumbers()}
                        </div>

                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-400 disabled:opacity-30 transition-all hover:text-synergy-blue"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* --- MODAL: ORDER DETAIL --- */}
      {selectedOrder && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedOrder(null)}>
              <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[36px] overflow-hidden shadow-2xl animate-in zoom-in-95 relative border border-white/10" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600">
                              <ClipboardList size={18} />
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 dark:text-white text-[10px] uppercase tracking-[0.15em]">Order Detail</h3>
                            <p className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{selectedOrder.id}</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-400"><X size={16} /></button>
                  </div>

                  <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                      <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-synergy-blue">
                              <Users size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Recipient Info</span>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                             <p className="text-sm font-black text-gray-900 dark:text-white">{selectedOrder.shippingAddress.name}</p>
                             <div className="h-px bg-gray-100 dark:bg-gray-700 my-2"></div>
                             <p className="text-[11px] text-gray-500 leading-relaxed"><Landmark size={10} className="inline mr-1 -mt-0.5" /> {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.zip}</p>
                          </div>
                      </div>

                      <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-indigo-500">
                              <Box size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Items Breakdown</span>
                          </div>
                          <div className="space-y-2">
                              {selectedOrder.items.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                      <div className="flex items-center space-x-3">
                                          <img src={item.image || undefined} className="w-10 h-10 rounded-lg object-cover" alt="p" />
                                          <div>
                                              <p className="text-[11px] font-black text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Qty: {item.quantity}</p>
                                          </div>
                                      </div>
                                      <p className="text-xs font-black text-gray-900 dark:text-white">฿{((item?.price ?? 0) * (item?.quantity ?? 0)).toLocaleString()}</p>
                                  </div>
                              ))}
                          </div>
                          <div className="flex justify-between items-center px-2 pt-2">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</span>
                              <span className="text-lg font-black text-synergy-blue">฿{(selectedOrder?.total ?? 0).toLocaleString()}</span>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center space-x-3">
                      {selectedOrder.status === 'Pending' ? (
                          <button 
                            onClick={(e) => handleOpenVerifyPayment(e, selectedOrder)}
                            className="flex-1 py-4 bg-emerald-500 text-white rounded-[20px] font-black text-[9px] uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg"
                          >
                            <ShieldCheck size={14} />
                            <span>Verify Payment</span>
                          </button>
                      ) : selectedOrder.status === 'Return Pending' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateOrderStatus(selectedOrder.id, 'Returned'); setSelectedOrder(null); }}
                            className="flex-1 py-4 bg-red-500 text-white rounded-[20px] font-black text-[9px] uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg"
                          >
                            <RotateCcw size={14} />
                            <span>Approve Return & Refund</span>
                          </button>
                      ) : (
                          <button 
                            onClick={(e) => handleUpdateOrder(e, selectedOrder.id, selectedOrder.status)}
                            className="flex-1 py-4 bg-synergy-blue text-white rounded-[20px] font-black text-[9px] uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg"
                          >
                            <Activity size={14} />
                            <span>Update: {selectedOrder.status}</span>
                          </button>
                      )}
                      <button 
                        onClick={(e) => handleDeleteOrder(e, selectedOrder.id)}
                        className="w-14 h-14 bg-white dark:bg-gray-700 text-red-500 rounded-[20px] font-black border border-red-100 dark:border-red-900/30 flex items-center justify-center shrink-0 active:scale-90 transition-all"
                        title="Delete Order"
                      >
                        <Trash2 size={20} />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL: WITHDRAWAL DETAIL --- */}
      {selectedWithdrawal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedWithdrawal(null)}>
              <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[36px] overflow-hidden shadow-2xl animate-in zoom-in-95 relative border border-white/10" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600">
                              <Banknote size={18} />
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 dark:text-white text-[10px] uppercase tracking-[0.15em]">Withdrawal Detail</h3>
                            <p className="text-[10px] text-gray-400 font-mono tracking-tighter">TXN_{selectedWithdrawal.id}</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedWithdrawal(null)} className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-400"><X size={16} /></button>
                  </div>

                  <div className="p-8 text-center bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Requested Amount</p>
                      <h2 className="text-4xl font-black text-red-500 tracking-tighter">-฿{Math.abs(selectedWithdrawal?.amount ?? 0).toLocaleString()}</h2>
                      <div className={`mt-4 inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${selectedWithdrawal.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                         {selectedWithdrawal.status}
                      </div>
                  </div>

                  <div className="p-6 space-y-5">
                      {(() => {
                          const info = parseWithdrawal(selectedWithdrawal.source);
                          return (
                              <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Bank Method</span>
                                        <p className="text-xs font-black text-gray-800 dark:text-white flex items-center"><Landmark size={12} className="mr-1 text-synergy-blue" /> {info.bank}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Account Number</span>
                                        <p className="text-xs font-mono font-bold text-gray-800 dark:text-white">{info.account}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Account Name</span>
                                    <p className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-tight">{info.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Request Date</span>
                                    <p className="text-xs font-bold text-gray-500">{selectedWithdrawal.date}</p>
                                </div>
                              </>
                          );
                      })()}
                  </div>

                  <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 space-y-3">
                      {selectedWithdrawal.status === 'Waiting' && (
                          <button 
                            onClick={() => handleApproveWithdrawal(selectedWithdrawal.id)}
                            className="w-full h-14 bg-synergy-blue text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 shadow-glow active:scale-95 transition-all"
                          >
                            <ShieldCheck size={18} />
                            <span>Confirm & Settle Payout</span>
                          </button>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                         {selectedWithdrawal.status === 'Completed' && (
                             <button 
                                onClick={() => handleRejectWithdrawal(selectedWithdrawal.id)}
                                className="py-3 bg-amber-50 text-amber-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-amber-100"
                             >
                                Revert Pending
                             </button>
                         )}
                         <button 
                            onClick={(e) => handleDeleteWithdrawal(e, selectedWithdrawal.id)}
                            className={`py-3 bg-white dark:bg-gray-700 text-red-500 rounded-xl font-black text-[9px] uppercase tracking-widest border border-red-100 dark:border-red-900/30 flex items-center justify-center space-x-2 ${selectedWithdrawal.status === 'Completed' ? '' : 'col-span-2'}`}
                         >
                            <Trash2 size={14} />
                            <span>Delete Record</span>
                         </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL: POST PREVIEW & COMPLIANCE --- */}
      {previewPost && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setPreviewPost(null)}>
               <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 border border-transparent dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                    <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
                        {previewPost.type === 'video' ? (
                            <video 
                                ref={videoRef}
                                src={previewPost.content || undefined} 
                                className="w-full h-full object-cover" 
                                controls 
                                muted 
                                loop 
                                playsInline
                            />
                        ) : (
                            <img src={previewPost.content || undefined} className="w-full h-full object-cover" alt="content" />
                        )}
                        <button onClick={() => setPreviewPost(null)} className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white active:scale-90 transition z-20"><X size={20} /></button>
                        
                        <div className="absolute top-4 left-4 z-10">
                           <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full backdrop-blur-md border border-white/20 ${previewPost.status === 'Pending' ? 'bg-amber-400/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
                               {previewPost.status}
                           </span>
                        </div>
                    </div>
                    
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center space-x-2">
                               <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-synergy-blue to-purple-500 p-[2px] shadow-sm">
                                   <img src={previewPost.avatar || undefined} className="w-full h-full rounded-full border border-white dark:border-gray-800" alt="av" />
                               </div>
                               <div>
                                   <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{previewPost.user}</p>
                                   <p className="text-[9px] text-gray-400 font-medium">Compliance Review</p>
                               </div>
                           </div>
                           <div className="flex space-x-3 text-gray-400">
                               <div className="flex flex-col items-center"><Heart size={20} /><span className="text-[9px] mt-0.5 font-bold">{previewPost.likes}</span></div>
                               <div className="flex flex-col items-center"><MessageCircle size={20} /><span className="text-[9px] mt-0.5 font-bold">{previewPost.comments.length}</span></div>
                           </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 mb-5">
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                "{isCaptionExpanded || previewPost.caption.length <= 100 
                                    ? previewPost.caption 
                                    : `${previewPost.caption.slice(0, 100)}...`}"
                                {previewPost.caption.length > 100 && (
                                    <button 
                                        onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                                        className="ml-1 text-synergy-blue hover:underline focus:outline-none font-black"
                                    >
                                        {isCaptionExpanded ? 'Show less' : 'See more'}
                                    </button>
                                )}
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            {previewPost.status === 'Pending' && (
                                <button 
                                    onClick={() => handleApprovePost(previewPost.id)}
                                    className="flex-[2] py-3.5 bg-synergy-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-glow flex items-center justify-center space-x-2 active:scale-95 transition-all"
                                >
                                    <CheckCircle size={16} />
                                    <span>Approve</span>
                                </button>
                            )}
                            <button 
                                onClick={() => handleDeletePost(previewPost.id)}
                                className="flex-1 py-3.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-100 dark:border-red-900/40 flex items-center justify-center space-x-2 active:scale-95 transition-all"
                            >
                                <Trash2 size={16} />
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
               </div>
          </div>
      )}

      {/* --- MODAL: KYC DETAIL --- */}
      {selectedKyc && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedKyc(null)}>
              <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[36px] overflow-hidden shadow-2xl animate-in zoom-in-95 relative border border-white/10" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-synergy-blue">
                              <ShieldCheck size={18} />
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 dark:text-white text-[10px] uppercase tracking-[0.15em]">KYC Verification</h3>
                            <p className="text-[10px] text-gray-400 font-mono tracking-tighter">{selectedKyc.referralCode || selectedKyc.id}</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedKyc(null)} className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-400"><X size={16} /></button>
                  </div>

                  <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                      <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                              <img src={selectedKyc.avatar || undefined} className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-md" alt="Avatar" />
                              <div>
                                  <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{selectedKyc.name}</p>
                                  <p className="text-xs text-gray-500 font-medium">{selectedKyc.email || `user_${selectedKyc.referralCode || selectedKyc.id}@example.com`}</p>
                              </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-4">
                              <div className="space-y-1">
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">ID Card Document</span>
                                  <div className="aspect-[1.6/1] bg-gray-200 dark:bg-gray-700 rounded-2xl overflow-hidden relative group">
                                      <img 
                                          src={selectedKyc.idCardImage || undefined} 
                                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                                          alt="ID Card" 
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[8px] font-black uppercase tracking-widest">Confidential</div>
                                      </div>
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Full Name (TH)</span>
                                      <p className="text-xs font-black text-gray-800 dark:text-white">{selectedKyc.name}</p>
                                  </div>
                                  <div className="space-y-1">
                                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">ID Number</span>
                                      <p className="text-xs font-mono font-bold text-gray-800 dark:text-white">1-2345-67890-12-3</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex space-x-3">
                      <button 
                        onClick={async () => { 
                          if (selectedKyc) {
                            await updateUserKycStatus(selectedKyc.id.toString(), 'Verified'); 
                            setSelectedKyc(null); 
                            showToast({ message: 'KYC Approved', type: 'success' });
                          }
                        }}
                        className="flex-1 py-4 bg-emerald-500 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all"
                      >
                        <CheckCircle size={16} />
                        <span>Approve KYC</span>
                      </button>
                      <button 
                        onClick={async () => { 
                          if (selectedKyc) {
                            await updateUserKycStatus(selectedKyc.id.toString(), 'Rejected'); 
                            setSelectedKyc(null); 
                            showToast({ message: 'KYC Rejected', type: 'error' });
                          }
                        }}
                        className="flex-1 py-4 bg-white dark:bg-gray-700 text-red-500 rounded-[20px] font-black text-[10px] uppercase tracking-widest border border-red-100 dark:border-red-900/30 flex items-center justify-center space-x-2 active:scale-95 transition-all"
                      >
                        <X size={16} />
                        <span>Reject</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL: MEMBER DETAIL --- */}
      {selectedMember && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedMember(null)}>
              <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[36px] overflow-hidden shadow-2xl animate-in zoom-in-95 relative border border-white/10" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center space-x-3">
                          <Users size={20} className="text-synergy-blue" />
                          <p className="text-xs font-black uppercase tracking-widest text-gray-800 dark:text-white">Member Profile</p>
                      </div>
                      <button onClick={() => setSelectedMember(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400"><X size={18} /></button>
                  </div>
                  
                  <div className="p-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                      <div className="flex flex-col items-center text-center mb-8">
                          <div className="relative mb-4">
                              <img src={selectedMember.avatar} className="w-24 h-24 rounded-[32px] object-cover border-4 border-white dark:border-gray-800 shadow-xl" alt="avatar" />
                              <div className="absolute -bottom-2 -right-2 bg-synergy-blue text-white p-2 rounded-2xl shadow-lg">
                                  <Zap size={16} fill="currentColor" />
                              </div>
                          </div>
                          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{selectedMember.name}</h2>
                          <p className="text-[10px] font-black text-synergy-blue uppercase tracking-[0.2em] mt-1">{selectedMember.tier} RANK</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-8">
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 text-center">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Sales</p>
                              <p className="text-sm font-black text-gray-900 dark:text-white">฿{selectedMember.totalSales.toLocaleString()}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 text-center">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Income</p>
                              <p className="text-sm font-black text-emerald-500">฿{selectedMember.accumulatedIncome.toLocaleString()}</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800">
                              <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                          <Monitor size={16} />
                                      </div>
                                      <div>
                                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Referral Code</p>
                                          {!isEditingRefCode ? (
                                            <p className="text-xs font-mono font-bold text-gray-800 dark:text-white">{selectedMember.referralCode || 'N/A'}</p>
                                          ) : (
                                            <input 
                                              type="text" 
                                              value={newRefCode} 
                                              onChange={(e) => setNewRefCode(e.target.value)}
                                              placeholder="Enter new code"
                                              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs font-mono font-bold text-gray-800 dark:text-white focus:outline-none focus:border-synergy-blue w-24"
                                              autoFocus
                                            />
                                          )}
                                      </div>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {!isEditingRefCode ? (
                                      <>
                                        <button 
                                          onClick={() => {
                                              setIsEditingRefCode(true);
                                              setNewRefCode(selectedMember.referralCode || '');
                                          }}
                                          className="p-2 text-gray-400 hover:text-synergy-blue transition-colors"
                                          title="Edit Code"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                          onClick={() => {
                                              navigator.clipboard.writeText(selectedMember.referralCode || '');
                                              showToast({ message: 'Code Copied', type: 'success' });
                                          }}
                                          className="p-2 text-gray-400 hover:text-synergy-blue transition-colors"
                                          title="Copy Code"
                                        >
                                            <ClipboardList size={16} />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button 
                                          onClick={handleUpdateRefCode}
                                          className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                          title="Save"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button 
                                          onClick={() => setIsEditingRefCode(false)}
                                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                          title="Cancel"
                                        >
                                            <X size={16} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Phone Number</span>
                                  <p className="text-xs font-bold text-gray-800 dark:text-white">{selectedMember.phone || 'Not Provided'}</p>
                              </div>
                              <div className="space-y-1">
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Line ID</span>
                                  <p className="text-xs font-bold text-gray-800 dark:text-white">{selectedMember.lineId || 'Not Provided'}</p>
                              </div>
                          </div>

                          <div className="space-y-1">
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Email Address</span>
                          <div className="flex items-center space-x-3">
                              <Mail size={16} className="text-gray-400" />
                              <p className="text-xs font-bold text-gray-800 dark:text-white">{selectedMember.email || 'Not Provided'}</p>
                          </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Upline ID</span>
                                  <p className="text-xs font-mono font-bold text-gray-500">{selectedMember.uplineId || 'Direct'}</p>
                              </div>
                              <div className="space-y-1">
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Joined Date</span>
                                  <p className="text-xs font-bold text-gray-500">{selectedMember.joinedDate}</p>
                              </div>
                          </div>

                          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                              <div className="flex items-center justify-between mb-4">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Role</span>
                                  <div className="flex items-center space-x-2">
                                      <button 
                                          onClick={async () => {
                                              const newRole = selectedMember.role === 'admin' ? 'user' : 'admin';
                                              await updateUserRole(selectedMember.id.toString(), newRole);
                                              setSelectedMember({ ...selectedMember, role: newRole });
                                              showToast({ message: `Role updated to ${newRole}`, type: 'success' });
                                          }}
                                          className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl transition-all ${
                                              selectedMember.role === 'admin' 
                                              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' 
                                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                          }`}
                                      >
                                          {selectedMember.role === 'admin' ? 'Administrator' : 'Standard User'}
                                      </button>
                                  </div>
                              </div>
                              <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">KYC Status</span>
                                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                                      selectedMember.kycStatus === 'Verified' ? 'bg-emerald-50 text-emerald-600' :
                                      selectedMember.kycStatus === 'Rejected' ? 'bg-red-50 text-red-600' :
                                      'bg-amber-50 text-amber-600'
                                  }`}>
                                      {selectedMember.kycStatus || 'Unverified'}
                                  </span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                      <button 
                        onClick={() => handleDeleteMember(selectedMember.id)}
                        className="w-full py-4 bg-white dark:bg-gray-800 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-100 dark:border-red-900/30 flex items-center justify-center space-x-2 active:scale-95 transition-all"
                      >
                          <Trash2 size={16} />
                          <span>Terminate Membership</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL: VERIFY PAYMENT ANIMATION --- */}
      {verifyingOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-300">
              <div className="bg-white dark:bg-gray-900 w-full max-w-xs rounded-[40px] p-8 text-center shadow-2xl relative border border-white/20">
                  {!verificationSuccess ? (
                      <div className="animate-in fade-in duration-500">
                          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                              <QrCode size={40} />
                          </div>
                          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight leading-tight">Verify Payment Flow</h2>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">
                              Order ID: {verifyingOrder.id}<br/>
                              Total Amount: <span className="font-black text-emerald-600 dark:text-emerald-400">฿{(verifyingOrder?.total ?? 0).toLocaleString()}</span>
                          </p>

                          {isCheckingBank ? (
                              <div className="flex flex-col items-center py-4 space-y-4">
                                  <Loader2 size={32} className="text-synergy-blue animate-spin" />
                                  <p className="text-[10px] font-black text-synergy-blue uppercase tracking-[0.2em] animate-pulse">Syncing Bank Gateway...</p>
                              </div>
                          ) : (
                              <div className="space-y-3">
                                  <button 
                                      onClick={startVerificationProcess}
                                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all"
                                  >
                                      <ShieldCheck size={18} />
                                      <span>Verify QR Scan</span>
                                  </button>
                                  <button 
                                      onClick={() => setVerifyingOrder(null)}
                                      className="w-full py-2 text-gray-400 text-[10px] font-black uppercase tracking-widest"
                                  >
                                      Back to List
                                  </button>
                              </div>
                          )}
                      </div>
                  ) : (
                      <div className="animate-in zoom-in duration-500 py-6">
                          <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow shadow-emerald-500/30">
                              <Check size={40} strokeWidth={4} />
                          </div>
                          <h2 className="text-xl font-black text-emerald-600 mb-2 uppercase tracking-tighter">Funds Confirmed</h2>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">Routing to Logistics...</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- MODAL: SHIPPING LABEL PREVIEW --- */}
      {printingLabel && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-[320px] rounded-xl overflow-hidden shadow-2xl p-6 text-black font-sans border-2 border-black animate-in slide-in-from-bottom-5">
                    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-2xl italic">S</div>
                            <span className="font-black text-lg tracking-tighter">SYNERGY<br/>EXPRESS</span>
                        </div>
                        <div className="text-right">
                             <p className="text-[8px] font-black uppercase">Service Code</p>
                             <p className="text-xl font-black tracking-tighter">TH-FL-09</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex border-b border-gray-200 pb-3">
                             <div className="w-1/2">
                                <p className="text-[8px] font-black uppercase mb-1">Sender</p>
                                <p className="text-[9px] font-bold">Synergy Distribution Center<br/>Lat Krabang, BKK 10520</p>
                             </div>
                             <div className="w-1/2 text-right">
                                <p className="text-[8px] font-black uppercase mb-1">Receiver Contact</p>
                                <p className="text-[9px] font-bold">{printingLabel.shippingAddress.phone}</p>
                             </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg border-2 border-black/10">
                            <p className="text-[8px] font-black uppercase mb-1 text-gray-500">Shipping To:</p>
                            <p className="text-sm font-black uppercase leading-tight mb-2">{printingLabel.shippingAddress.name}</p>
                            <p className="text-[10px] font-medium leading-relaxed">{printingLabel.shippingAddress.address}, {printingLabel.shippingAddress.city}, {printingLabel.shippingAddress.zip}</p>
                        </div>

                        <div className="flex flex-col items-center py-2">
                             <div className="h-14 w-full bg-black mb-1 flex items-center justify-center">
                                 <div className="flex space-x-1 h-10">
                                     {[...Array(20)].map((_, i) => (
                                         <div key={i} className="bg-white w-[3px]" style={{ opacity: Math.random() > 0.5 ? 1 : 0.4 }}></div>
                                     ))}
                                 </div>
                             </div>
                             <p className="text-[10px] font-mono font-black">{printingLabel.id}</p>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <button onClick={() => setPrintingLabel(null)} className="flex-1 py-3 border-2 border-black rounded-lg font-black text-[10px] uppercase tracking-widest active:scale-95 transition hover:bg-gray-50">Done</button>
                        <button onClick={() => { window.print(); setPrintingLabel(null); }} className="flex-1 py-3 bg-black text-white rounded-lg font-black text-[10px] uppercase tracking-widest active:scale-95 transition flex items-center justify-center space-x-2">
                            <Printer size={14} />
                            <span>Print</span>
                        </button>
                    </div>
               </div>
          </div>
      )}

      {/* --- MODAL: FACTORY RESET CONFIRM --- */}
      {showResetConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="bg-white dark:bg-gray-900 w-full max-w-xs rounded-[40px] p-8 text-center shadow-2xl relative border border-red-500/20 animate-in zoom-in-95">
                  <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <AlertTriangle size={40} />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight leading-tight">Factory Reset</h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">
                      This will delete <span className="text-red-500 font-black">ALL DATA</span> (users, orders, products, etc.) and reset the system to its initial state. This action is <span className="font-black">IRREVERSIBLE</span>.
                  </p>

                  <div className="space-y-3">
                      <button 
                          onClick={async () => {
                              setShowResetConfirm(false);
                              await factoryReset();
                          }}
                          className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                      >
                          Confirm Reset
                      </button>
                      <button 
                          onClick={() => setShowResetConfirm(false)}
                          className="w-full py-2 text-gray-400 text-[10px] font-black uppercase tracking-widest"
                      >
                          Cancel
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};