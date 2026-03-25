import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Share2, Copy, Heart, MessageCircle, Send, X, Check, Clock, ChevronUp, Sparkles, Play, ShieldCheck, UserPlus, Search, Scan, Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FeedItem } from '../types';
import { CountdownTimer } from '../components/CountdownTimer';

import { ReferralModal } from '../components/ReferralModal';

export const Feed: React.FC = () => {
  const { feed, ads, toggleFeedLike, addFeedComment, user, referrer, addReferrer, setBottomNavHidden, products, addToCart, isLoggedIn, showToast } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Trending' | 'For You'>('For You');
  const [currentTime, setCurrentTime] = useState(Date.now());

  const handleExpire = useCallback(() => {
    setCurrentTime(Date.now());
  }, []);

  // Update current time every minute to refresh promotion filtering
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(prev => {
        if (Math.floor(now / 60000) !== Math.floor(prev / 60000)) {
          return now;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const [showComments, setShowComments] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [isExpandedComments, setIsExpandedComments] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  // State to track which post IDs have expanded captions
  const [expandedPostIds, setExpandedPostIds] = useState<Set<number>>(new Set());

  // Ensure navigation is visible when feed mounts
  useEffect(() => {
    setBottomNavHidden(false);
  }, [setBottomNavHidden]);

  // Referrer Modal for Feed
  const [showReferrerModal, setShowReferrerModal] = useState(false);

  // Users see all 'Approved' posts + their own 'Pending' posts
  const visibleFeed = feed.filter(f => f.status === 'Approved' || f.userId === user?.email);
  const filteredFeed = activeTab === 'For You' ? visibleFeed : visibleFeed.filter(f => f.category === 'Trending');
  
  const activeAds = useMemo(() => {
    return ads.filter(a => {
      if (!a.active || a.placement !== 'feed') return false;
      if (a.expiryDate) {
        return new Date(a.expiryDate).getTime() > currentTime;
      }
      return true;
    });
  }, [ads, currentTime]);

  const checkReferrerAction = (action: () => void) => {
    if (!user?.referrerCode) {
      setShowReferrerModal(true);
      return;
    }
    action();
  };

  const handleShare = async (post: FeedItem) => {
    if (!isLoggedIn || !user) {
        navigate('/account');
        return;
    }

    checkReferrerAction(async () => {
        const affiliateLink = `${window.location.origin}/#/post/${post.id}?ref=${user?.referralCode || 'USER'}`;
        const shareText = `${post.caption}\n\nShop Now: ${affiliateLink} #SynergyFlow`;

        if (navigator.share) {
            try {
                await navigator.share({ title: `Promote: ${post.user}'s Post`, text: shareText, url: affiliateLink });
            } catch (error) { console.log('Share canceled'); }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                showToast({ message: "Promote link and caption copied to clipboard!", type: 'success' });
            } catch (err) { showToast({ message: "Could not copy text.", type: 'error' }); }
        }
    });
  };

  const handleCopyCaption = (id: number, text: string) => {
    checkReferrerAction(() => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleLike = (id: number) => {
    if (!isLoggedIn || !user) {
        navigate('/account');
        return;
    }
    toggleFeedLike(id);
  };

  const handleCommentClick = (id: number) => {
    if (!isLoggedIn || !user) {
        navigate('/account');
        return;
    }
    openComments(id);
  };

  const submitComment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isLoggedIn || !user) {
          navigate('/account');
          return;
      }
      if (!commentInput.trim() || showComments === null) return;
      addFeedComment(showComments, commentInput);
      setCommentInput('');
  };

  const openComments = (id: number) => {
      setShowComments(id);
      setIsExpandedComments(false);
  };

  const toggleCaption = (id: number) => {
    setExpandedPostIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  };

  const activePostForComments = feed.find(f => f.id === showComments);

  return (
    <div className="pb-0 pt-0 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 relative transition-colors duration-300">
      
      {/* Top Header Bar (Always visible, centered tabs) */}
      <div className="fixed top-4 left-0 right-0 z-[100] px-4 py-1.5 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center justify-end">
          <div className="flex space-x-1 p-1 rounded-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-lg pointer-events-auto">
            <button 
                onClick={() => setActiveTab('Trending')} 
                className={`text-[8px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider transition-all duration-300 ${
                    activeTab === 'Trending' 
                        ? 'bg-synergy-blue text-white shadow-glow' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
                Trending
            </button>
            <button 
                onClick={() => setActiveTab('For You')} 
                className={`text-[8px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider transition-all duration-300 ${
                    activeTab === 'For You' 
                        ? 'bg-synergy-blue text-white shadow-glow' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
                For You
            </button>
          </div>
        </div>
      </div>

      {/* Advertising Banners - Sticky so content can overlap it */}
      <div className="sticky top-0 z-0">
        {activeAds.length > 0 && (
            <div className="w-full aspect-[16/9] bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div className="flex overflow-x-auto snap-x no-scrollbar h-full">
                  {activeAds.map(ad => (
                      <div key={ad.id} className="min-w-full h-full relative snap-center group">
                          <img src={ad.image || undefined} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          
                          {ad.expiryDate && (
                            <div className="absolute top-14 right-4 z-20">
                              <CountdownTimer expiryDate={ad.expiryDate} onExpire={handleExpire} />
                            </div>
                          )}
  
                          <div className="absolute bottom-10 left-6 right-6 text-white">
                              <h2 className="text-xl font-bold leading-tight drop-shadow-lg">{ad.title}</h2>
                              <p className="text-xs text-gray-200 line-clamp-1 font-medium mt-1 drop-shadow-md">{ad.subtitle}</p>
                          </div>
                      </div>
                  ))}
                </div>
            </div>
        )}
      </div>

      {activeAds.length === 0 && (
        <div className="pt-20"></div>
      )}

      {/* Overlapping Content - Higher z-index to cover the sticky ad */}
      <div className={`relative z-10 bg-gray-50 dark:bg-gray-950 -mt-6 pt-6 px-4 min-h-screen pb-28`}>
        <div className="space-y-6">
        {filteredFeed.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
                <Sparkles size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No posts in your feed yet.</p>
            </div>
        ) : (
            filteredFeed.map(post => {
              const isLong = post.caption.length > 60;
              const isExpanded = expandedPostIds.has(post.id);
              const displayCaption = isLong && !isExpanded 
                ? `${post.caption.substring(0, 60)}...` 
                : post.caption;

              return (
                <div key={post.id} className={`bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden shadow-soft transition-all duration-300 border border-transparent dark:border-gray-700 ${post.status === 'Pending' ? 'opacity-80 grayscale-[0.3]' : ''}`}>
                  <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
                    {post.type === 'video' ? (
                        <video src={post.content} className="w-full h-full object-cover" controls playsInline />
                    ) : (
                        <img src={post.content || undefined} alt="Post" className="w-full h-full object-cover" />
                    )}
                    
                    {/* Add to Cart button removed from here */}
                    
                    <div className="absolute top-4 right-4 flex flex-col items-end space-y-2 z-10">
                        {post.status === 'Pending' && (
                            <div className="bg-yellow-400/90 backdrop-blur-md rounded-full px-3 py-1 text-white text-[10px] font-black uppercase flex items-center space-x-1 shadow-md border border-white/20">
                                <Clock size={12} />
                                <span>Reviewing</span>
                            </div>
                        )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2.5">
                         <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 flex-shrink-0">
                            <img 
                                src={post.avatar || "https://picsum.photos/seed/user/100/100"} 
                                alt={post.user} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                         </div>
                         <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{post.user}</span>
                      </div>
                      <div className="flex space-x-4 text-gray-500">
                        <button onClick={() => handleLike(post.id)} className="flex flex-col items-center transition active:scale-90"><Heart size={22} className={(post.likedBy || []).includes(user?.uid || '') ? "fill-red-500 text-red-500" : ""} /><span className="text-[10px] mt-1 font-bold">{post.likes}</span></button>
                        <button onClick={() => handleCommentClick(post.id)} className="flex flex-col items-center transition active:scale-90"><MessageCircle size={22} /><span className="text-[10px] mt-1 font-bold">{post.comments.length}</span></button>
                      </div>
                    </div>

                    <div className="mb-3">
                        <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            {displayCaption}
                            {isLong && (
                                <button 
                                    onClick={() => toggleCaption(post.id)}
                                    className="ml-1 text-synergy-blue hover:underline focus:outline-none"
                                >
                                    {isExpanded ? 'Show less' : 'See more'}
                                </button>
                            )}
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                <span className="text-synergy-blue">#SynergyFlow</span>
                                <span className="text-synergy-blue">#Affiliate</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {post.productId && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const product = products.find(p => p.id === post.productId);
                            if (product) addToCart(product);
                          }}
                          className="flex-1 h-9 rounded-full text-[9px] font-black uppercase tracking-[0.1em] flex items-center justify-center space-x-1.5 bg-gray-100 dark:bg-gray-800 text-synergy-blue border border-gray-200 dark:border-gray-700 active:scale-95 transition-all"
                        >
                          <Plus size={12} />
                          <span>Add to Cart</span>
                        </button>
                      )}
                      <button 
                        onClick={() => handleShare(post)} 
                        disabled={post.status === 'Pending'} 
                        className={`flex-1 h-9 rounded-full text-[9px] font-black uppercase tracking-[0.1em] flex items-center justify-center space-x-1.5 shadow-glow active:scale-95 transition ${
                          post.status === 'Pending' 
                            ? 'bg-gray-300 dark:bg-gray-700 shadow-none cursor-not-allowed text-gray-500' 
                            : 'bg-synergy-blue text-white'
                        }`}
                      >
                          <Share2 size={12} />
                          <span>Promote Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>

      {/* REFERRER REQUIRED MODAL */}
      {showReferrerModal && (
        <ReferralModal onClose={() => setShowReferrerModal(false)} />
      )}

      {/* COMMENTS MODAL */}
      {showComments !== null && activePostForComments && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowComments(null)}></div>
              <div className={`bg-white dark:bg-gray-900 w-full max-w-md rounded-t-[40px] relative animate-in slide-in-from-bottom-full duration-300 flex flex-col transition-all ease-in-out ${isExpandedComments ? 'h-[92vh]' : 'h-[60vh]'} border-t border-white/10`}>
                  <div className="w-full pt-4 pb-2 flex flex-col items-center justify-center cursor-pointer touch-none" onClick={() => setIsExpandedComments(!isExpandedComments)}><div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mb-1"></div>{!isExpandedComments && <ChevronUp size={14} className="text-gray-400 animate-bounce" />}</div>
                  <div className="px-6 flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">Comments ({activePostForComments.comments.length})</h3>
                      <button onClick={() => setShowComments(null)} className="p-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20} className="text-gray-500" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-4 px-6 pt-4">
                      {activePostForComments.comments.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10 font-bold text-sm">No comments yet. Be the first!</div>
                      ) : (
                        activePostForComments.comments.map(c => (
                            <div key={c.id} className="flex space-x-3 animate-in fade-in slide-in-from-bottom-2">
                                <img src={c.avatar || undefined} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 border border-gray-100 dark:border-gray-800" alt="Avatar" />
                                <div className="bg-gray-50 dark:bg-gray-800 p-3.5 rounded-[20px] rounded-tl-none text-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-black text-gray-900 dark:text-white text-xs">{c.user}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{c.date}</span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium leading-relaxed">{c.text}</p>
                                </div>
                            </div>
                        ))
                      )}
                  </div>
                  <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 pb-safe rounded-b-[40px]">
                      <form onSubmit={submitComment} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-full border border-gray-100 dark:border-gray-700">
                          <input value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-transparent px-4 py-2 text-xs font-bold focus:outline-none dark:text-white" />
                          <button type="submit" disabled={!commentInput.trim()} className="p-2.5 bg-synergy-blue text-white rounded-full disabled:opacity-50 disabled:bg-gray-300 transition shadow-glow"><Send size={16} /></button>
                      </form>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};