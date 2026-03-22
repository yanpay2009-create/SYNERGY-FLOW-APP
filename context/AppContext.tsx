import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { io, Socket } from "socket.io-client";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, where, getDoc, getDocs, addDoc, serverTimestamp, Timestamp, runTransaction, increment, limit } from 'firebase/firestore';
import { ref, set, push, onValue, limitToLast, query as rtdbQuery } from 'firebase/database';
import { auth, db, rtdb } from '../src/firebase';
import { User, UserTier, Product, CartItem, FeedItem, AppContextType, TeamMember, Referrer, CommissionTransaction, Address, Coupon, PaymentType, BankAccount, CreditCardInfo, KYCStatus, KYCDocumentType, Notification, Order, Language, FontSize, Ad, OnboardingSlide, OrderStatus, Promotion, SystemSettings, CampaignAsset, ToastMessage, OrderTimelineItem, LevelUpInfo } from '../types';
import { dictionary } from './translations';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Accuracy Helper: Ensure precision to 2 decimal places for all financial operations
const TO_PRECISION = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

const cleanData = (data: any) => {
  const clean: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  });
  return clean;
};

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const TIER_THRESHOLDS = {
  [UserTier.STARTER]: 0,
  [UserTier.MARKETER]: 3000,
  [UserTier.BUILDER]: 6000,
  [UserTier.EXECUTIVE]: 9000
};

const TIER_RATES = {
  [UserTier.STARTER]: 0.05,
  [UserTier.MARKETER]: 0.10,
  [UserTier.BUILDER]: 0.20,
  [UserTier.EXECUTIVE]: 0.30
};

const INDIRECT_RATES = {
  [UserTier.STARTER]: {},
  [UserTier.MARKETER]: {
    [UserTier.MARKETER]: 0.02,
    [UserTier.STARTER]: 0.05
  },
  [UserTier.BUILDER]: {
    [UserTier.BUILDER]: 0.02,
    [UserTier.MARKETER]: 0.10,
    [UserTier.STARTER]: 0.15
  },
  [UserTier.EXECUTIVE]: {
    [UserTier.EXECUTIVE]: 0.01,
    [UserTier.BUILDER]: 0.10,
    [UserTier.MARKETER]: 0.20,
    [UserTier.STARTER]: 0.25
  }
};

const TIER_DISCOUNTS = {
  [UserTier.STARTER]: 0,
  [UserTier.MARKETER]: 0.10,
  [UserTier.BUILDER]: 0.20,
  [UserTier.EXECUTIVE]: 0.30
};

const DEFAULT_USER_EMAIL = "yanpay2009@gmail.com";

const INITIAL_PRODUCTS: Product[] = [];

const INITIAL_ADS: Ad[] = [];

const INITIAL_ASSETS: CampaignAsset[] = [];

const INITIAL_ONBOARDING: OnboardingSlide[] = [];

const INITIAL_TEAM: TeamMember[] = [];

const INITIAL_COMMISSIONS: CommissionTransaction[] = [];

const ADMIN_UIDS = ["ugTOls4K6EgKG13hBiAXHaYC2bj2", "mqZUUW73sCYe1bJTowBqF1HI2O02"];
const ADMIN_EMAILS = ["yanpay2009@gmail.com", "synergyflow.my@gmail.com"];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const isLoggedIn = !!user;
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('synergy_cart');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse synergy_cart', e);
      return [];
    }
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('synergy_lang');
    return (saved as Language) || 'en';
  });
  
  const [fontSize, setFontSize] = useState<FontSize>(() => {
      const saved = localStorage.getItem('synergy_font_size');
      return (saved as FontSize) || 'medium';
  });

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [ads, setAds] = useState<Ad[]>(INITIAL_ADS);
  const [campaignAssets, setCampaignAssets] = useState<CampaignAsset[]>(INITIAL_ASSETS);

  // Capture Referral Code from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    let ref = searchParams.get('ref');
    
    if (!ref && window.location.hash.includes('?')) {
      const hashSearch = window.location.hash.split('?')[1];
      const hashParams = new URLSearchParams(hashSearch);
      ref = hashParams.get('ref');
    }
    
    if (ref) {
      localStorage.setItem('synergy_referrer_code', ref.toUpperCase());
    }
  }, []);
  const [onboardingSlides, setOnboardingSlides] = useState<OnboardingSlide[]>(INITIAL_ONBOARDING);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allTeam, setAllTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [allCommissions, setAllCommissions] = useState<CommissionTransaction[]>(INITIAL_COMMISSIONS);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
      logo: null,
      slipBackground: null,
      contactLinks: { line: '', phone: '', email: '', website: '', terms: '', privacy: '' }
  });

  const [activePromo, setActivePromo] = useState<Promotion | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);
  const [bottomNavHidden, setBottomNavHidden] = useState(false);
  
  const [pendingLevelUp, setPendingLevelUp] = useState<LevelUpInfo | null>(null);
  const dismissLevelUp = () => setPendingLevelUp(null);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [liveSales, setLiveSales] = useState<{ id: string, name: string, amount: number, time: string }[]>([]);

  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('synergy_notifications_enabled');
    return saved === null ? true : saved === 'true';
  });

  const setNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    localStorage.setItem('synergy_notifications_enabled', String(enabled));
  };

  const getUidByReferralCode = async (code: string): Promise<string | null> => {
    try {
      const q = query(collection(db, 'publicProfiles'), where('referralCode', '==', code));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'publicProfiles');
      return null;
    }
  };

  const syncPublicProfile = async (u: User, uid: string) => {
    try {
      const publicData = {
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        referralCode: u.referralCode,
        tier: u.tier,
        uplineId: u.uplineId || null,
        uplinePath: u.uplinePath || [],
        phone: u.phone || '',
        lineId: u.lineId || u.socials?.line?.name || '',
        accumulatedIncome: u.accumulatedIncome || 0,
        totalSales: u.accumulatedSales || 0,
        teamSize: u.teamSize || 0
      };
      await setDoc(doc(db, 'publicProfiles', uid), cleanData(publicData), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `publicProfiles/${uid}`);
    }
  };

  // Firebase Auth Listener
  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Setup real-time listener for the user document
        unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            const isAdminUser = ADMIN_EMAILS.includes(firebaseUser.email?.toLowerCase() || "") || 
                               ADMIN_UIDS.includes(firebaseUser.uid);
            
            // Auto-repair missing data
            const updates: any = {};
            if (isAdminUser && userData.role !== 'admin') {
              updates.role = 'admin';
              updates.kycStatus = 'Verified';
            }

            const emailFromProvider = firebaseUser.providerData.find(p => p.email)?.email;
            const effectiveEmail = (firebaseUser.email || emailFromProvider || "").toLowerCase();

            // Ensure main admin has SYN001
            if (isAdminUser && (effectiveEmail === "synergyflow.my@gmail.com" || firebaseUser.uid === "mqZUUW73sCYe1bJTowBqF1HI2O02")) {
              if (userData.referralCode !== 'SYN001') {
                updates.referralCode = 'SYN001';
              }
            }

            if (!userData.email && effectiveEmail) {
              updates.email = effectiveEmail;
            }
            if (!userData.name && firebaseUser.displayName) {
              updates.name = firebaseUser.displayName;
            }
            
            // Sync Google social info if missing
            if (firebaseUser.providerData.some(p => p.providerId === 'google.com')) {
              if (!userData.socials?.google?.connected || !userData.socials?.google?.name) {
                updates['socials.google.connected'] = true;
                updates['socials.google.name'] = effectiveEmail;
              }
            }

            if (Object.keys(updates).length > 0) {
              updateDoc(docSnap.ref, updates).catch(err => {
                console.error("Failed to auto-repair user data", err);
              });
            }
            
            setUser(userData);
            syncPublicProfile(userData, firebaseUser.uid);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`));

        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (!userDoc.exists()) {
            const isRegistering = localStorage.getItem('synergy_is_registering') === 'true';
            const isPrimaryAdmin = ADMIN_EMAILS.includes(firebaseUser.email?.toLowerCase() || "") || 
                                  ADMIN_UIDS.includes(firebaseUser.uid);

            if (!isRegistering && !isPrimaryAdmin) {
              await signOut(auth);
              showToast({ message: "Account not found. Please create an account first.", type: 'error' });
              localStorage.removeItem('synergy_is_registering');
              setIsLoggingIn(false);
              return;
            }
            
            localStorage.removeItem('synergy_is_registering');

            // Check for duplicate email before creating a new document
            if (firebaseUser.email) {
              try {
                const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email.toLowerCase()), limit(1));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                  console.warn(`Duplicate email detected for ${firebaseUser.email}. Existing UID: ${querySnapshot.docs[0].id}, New UID: ${firebaseUser.uid}`);
                  // Note: In a real app, we might want to link these accounts or merge data.
                  // For now, we proceed to create the document for the new UID to ensure the app works,
                  // but we've logged the collision.
                }
              } catch (err) {
                console.error("Error checking for duplicate email", err);
              }
            }

            // Create user profile if it doesn't exist
            let nextCode = 'SYN000';
            
            if (!isPrimaryAdmin) {
              try {
                await runTransaction(db, async (transaction) => {
                  const counterRef = doc(db, 'counters', 'users');
                  const counterDoc = await transaction.get(counterRef);
                  let newCount = 2; // Start from 2 for non-admins (Admin is 1)
                  if (counterDoc.exists()) {
                    newCount = Math.max(2, counterDoc.data().count + 1);
                    transaction.update(counterRef, { count: newCount });
                  } else {
                    transaction.set(counterRef, { count: 2 });
                  }
                  nextCode = `SYN${String(newCount).padStart(3, '0')}`;
                });
              } catch (e) {
                console.error("Failed to generate referral code, falling back to random", e);
                nextCode = `SYN${Math.floor(1000 + Math.random() * 8999)}`;
              }
            } else {
              // Assign specific codes to admins
              if (firebaseUser.email?.toLowerCase() === "synergyflow.my@gmail.com" || firebaseUser.uid === "mqZUUW73sCYe1bJTowBqF1HI2O02") {
                nextCode = 'SYN001';
              } else {
                nextCode = 'SYN000';
              }
              
              try {
                const counterRef = doc(db, 'counters', 'users');
                const counterDoc = await getDoc(counterRef);
                if (!counterDoc.exists()) {
                  await setDoc(counterRef, { count: 1 }); // Admin is 1
                }
              } catch (e) {
                console.error("Failed to initialize counter for admin", e);
              }
            }

            // Final uniqueness check for nextCode
            let isUnique = false;
            let attempts = 0;
            while (!isUnique && attempts < 5) {
              try {
                const q = query(collection(db, 'publicProfiles'), where('referralCode', '==', nextCode));
                const snap = await getDocs(q);
                if (snap.empty) {
                  isUnique = true;
                } else {
                  // Collision! Generate a new one
                  attempts++;
                  nextCode = `SYN${Math.floor(1000 + Math.random() * 8999)}`;
                }
              } catch (err) {
                handleFirestoreError(err, OperationType.LIST, 'publicProfiles');
              }
            }

            const savedReferrerCode = localStorage.getItem('synergy_referrer_code');
            const referrerUid = savedReferrerCode ? await getUidByReferralCode(savedReferrerCode) : null;
            
            let uplinePath: string[] = [];
            if (referrerUid) {
                const referrerDoc = await getDoc(doc(db, 'users', referrerUid));
                if (referrerDoc.exists()) {
                    const referrerData = referrerDoc.data() as User;
                    uplinePath = [...(referrerData.uplinePath || []), referrerUid];
                }
            }

            const adminUid = await getUidByReferralCode('SYN001');

            const isAdminUser = ADMIN_EMAILS.includes(firebaseUser.email?.toLowerCase() || "") || 
                               ADMIN_UIDS.includes(firebaseUser.uid);
            
            const emailFromProvider = firebaseUser.providerData.find(p => p.email)?.email;
            const effectiveEmail = (firebaseUser.email || emailFromProvider || "").toLowerCase();

            const newUser: User = {
              name: firebaseUser.displayName || (isAdminUser ? "Admin" : "Verified User"),
              uid: firebaseUser.uid,
              email: effectiveEmail,
              tier: UserTier.STARTER,
              role: isAdminUser ? 'admin' : 'user',
              kycStatus: isAdminUser ? 'Verified' : 'Unverified',
              accumulatedSales: 0,
              teamSize: 0,
              accumulatedIncome: 0,
              walletBalance: 0,
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${effectiveEmail}`,
              referralCode: nextCode,
              referrerCode: isPrimaryAdmin ? undefined : savedReferrerCode, 
              uplineId: isPrimaryAdmin ? undefined : (referrerUid || undefined),
              uplinePath: isPrimaryAdmin ? [] : uplinePath,
              socials: { facebook: { connected: false, name: '' }, line: { connected: false, name: '' }, google: { connected: true, name: effectiveEmail } }
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), cleanData(newUser));
            // Listener will pick up the new user
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
        if (unsubUser) unsubUser();
      }
      setIsAuthReady(true);
    });
    return () => {
      unsubscribe();
      if (unsubUser) unsubUser();
    };
  }, []);

  // Real-time Listeners (Optimized)
  useEffect(() => {
    // Products and Feed stay real-time as they change frequently
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return { ...docData, id: typeof docData.id === 'number' ? docData.id : (Number(doc.id) || doc.id) };
      }) as any;
      setProducts(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    const unsubFeed = onSnapshot(collection(db, 'feed'), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return { ...docData, id: typeof docData.id === 'number' ? docData.id : (Number(doc.id) || doc.id) };
      }) as any;
      setFeed(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'feed'));

    const unsubAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) || doc.id }) as Ad));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'ads'));

    const unsubAssets = onSnapshot(collection(db, 'campaignAssets'), (snapshot) => {
      setCampaignAssets(snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) || doc.id }) as CampaignAsset));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'campaignAssets'));

    const unsubOnboarding = onSnapshot(collection(db, 'onboardingSlides'), (snapshot) => {
      setOnboardingSlides(snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) || doc.id }) as OnboardingSlide));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'onboardingSlides'));

    // Realtime Database: Live Sales Feed
    const salesRef = rtdbQuery(ref(rtdb, 'liveSales'), limitToLast(10));
    const unsubSales = onValue(salesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const salesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).reverse();
        setLiveSales(salesArray);
      }
    });

    const unsubSettings = onSnapshot(doc(db, 'systemSettings', 'current'), (doc) => {
      if (doc.exists()) {
          const data = doc.data() as SystemSettings;
          setSystemSettings({
              ...data,
              contactLinks: data.contactLinks || { line: '', phone: '', email: '', website: '', terms: '', privacy: '' }
          });
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'systemSettings/current'));

    return () => {
      unsubProducts();
      unsubFeed();
      unsubAds();
      unsubAssets();
      unsubOnboarding();
      unsubSales();
      unsubSettings();
    };
  }, []);

  // User-specific Listeners
  useEffect(() => {
    if (!auth.currentUser || !user) {
      setAllOrders([]);
      setAllCommissions([]);
      setAllNotifications([]);
      return;
    }

    const ordersRef = collection(db, 'orders');
    const qOrders = user.role === 'admin' 
      ? query(ordersRef) 
      : query(ordersRef, where('userId', '==', auth.currentUser.uid));

    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setAllOrders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

    const commissionsRef = collection(db, 'commissions');
    const qCommissions = user.role === 'admin'
      ? query(commissionsRef)
      : query(commissionsRef, where('userId', '==', auth.currentUser.uid));

    const unsubCommissions = onSnapshot(qCommissions, (snapshot) => {
      setAllCommissions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'commissions'));

    const notificationsRef = collection(db, 'notifications');
    const qNotifications = user.role === 'admin'
      ? query(notificationsRef)
      : query(notificationsRef, where('userId', 'in', [auth.currentUser.uid, 'global']));

    const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
      setAllNotifications(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));

    const usersRef = collection(db, 'users');
    let unsubUsers: (() => void) | null = null;

    if (user.role === 'admin') {
      const qAllUsers = query(usersRef, limit(1000)); // Add a reasonable limit
      getDocs(qAllUsers).then(snapshot => {
        const usersData = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            referralCode: d.referralCode,
            uplineId: d.uplineId || '',
            uplinePath: d.uplinePath || [],
            name: d.name,
            tier: d.tier,
            avatar: d.avatar,
            totalSales: d.accumulatedSales,
            teamSize: d.teamSize || 0,
            accumulatedIncome: d.accumulatedIncome || 0,
            joinedDate: d.joinedDate || '2024-01-01',
            relationship: d.uplineId === auth.currentUser?.uid ? 'Direct' : 'Indirect',
            phone: d.phone,
            lineId: d.lineId,
            email: d.email,
            idCardImage: d.idCardImage,
            kycStatus: d.kycStatus,
            role: d.role || 'user'
          };
        }) as any;
        setAllTeam(usersData);
      }).catch((err) => handleFirestoreError(err, OperationType.LIST, 'users'));
    } else {
      // Fetch all users who have the current user in their uplinePath
      const qUsers = query(usersRef, where('uplinePath', 'array-contains', auth.currentUser.uid));
      unsubUsers = onSnapshot(qUsers, (snapshot) => {
        const usersData = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            referralCode: d.referralCode,
            uplineId: d.uplineId || '',
            uplinePath: d.uplinePath || [],
            name: d.name,
            tier: d.tier,
            avatar: d.avatar,
            totalSales: d.accumulatedSales,
            teamSize: d.teamSize || 0,
            accumulatedIncome: d.accumulatedIncome || 0,
            joinedDate: d.joinedDate || '2024-01-01',
            relationship: d.uplineId === auth.currentUser?.uid ? 'Direct' : 'Indirect',
            phone: d.phone,
            lineId: d.lineId,
            email: d.email,
            idCardImage: d.idCardImage,
            kycStatus: d.kycStatus,
            role: d.role || 'user'
          };
        }) as any;
        setAllTeam(usersData);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
    }

    return () => {
      unsubOrders();
      unsubCommissions();
      unsubNotifications();
      if (unsubUsers) unsubUsers();
    };
  }, [user]);

  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []); // Only once

  useEffect(() => {
    if (socket && auth.currentUser) {
      socket.emit("user:join", auth.currentUser.uid);
    }
  }, [socket, auth.currentUser]);

  useEffect(() => {
    if (!socket) return;

    const handleAdminNewOrder = (order: any) => {
      if (user?.role === 'admin') {
        showToast({ message: `New order received: ${order.id}`, type: 'info' });
      }
    };

    const handleOrderVerified = (orderId: string) => {
      showToast({ message: `Order ${orderId} has been verified by admin!`, type: 'success' });
      setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'To Ship' } : o));
    };

    const handleCommissionNew = (data: any) => {
      showToast({ message: `You earned a new commission: ฿${data.amount}!`, type: 'success' });
    };

    const handleNotificationNew = (data: any) => {
      if (notificationsEnabled) {
        showToast({ message: data.title, type: 'info' });
      }
    };

    const handlePostApproved = (postId: number) => {
      showToast({ message: `Your post has been approved and is now live!`, type: 'success' });
      setFeed(prev => prev.map(p => p.id === postId ? { ...p, status: 'Approved' } : p));
    };

    const handlePromotionBroadcast = (promo: any) => {
      setActivePromo({ ...promo, active: true });
    };

    socket.on("admin:new_order", handleAdminNewOrder);
    socket.on("order:verified", handleOrderVerified);
    socket.on("commission:new", handleCommissionNew);
    socket.on("notification:new", handleNotificationNew);
    socket.on("post:approved", handlePostApproved);
    socket.on("promotion:broadcast", handlePromotionBroadcast);

    return () => {
      socket.off("admin:new_order", handleAdminNewOrder);
      socket.off("order:verified", handleOrderVerified);
      socket.off("commission:new", handleCommissionNew);
      socket.off("notification:new", handleNotificationNew);
      socket.off("post:approved", handlePostApproved);
      socket.off("promotion:broadcast", handlePromotionBroadcast);
    };
  }, [socket, user?.role, notificationsEnabled]);

  // Security Unlocked state is non-persistent for safety
  const [isSecurityUnlocked, setIsSecurityUnlocked] = useState(false);

  const userOrders = useMemo(() => {
    if (!auth.currentUser) return [];
    return allOrders.filter(o => o.userId === auth.currentUser!.uid);
  }, [allOrders, auth.currentUser]);
  const userTeam = useMemo(() => {
    if (!auth.currentUser) return [];
    return allTeam.filter(m => m.uplinePath?.includes(auth.currentUser!.uid) || m.uplineId === auth.currentUser!.uid);
  }, [allTeam, auth.currentUser]);
  const userCommissions = useMemo(() => {
    if (!auth.currentUser) return [];
    return allCommissions.filter(c => c.userId === auth.currentUser!.uid);
  }, [allCommissions, auth.currentUser]);
  
  const userNotifications = useMemo(() => 
    allNotifications.filter(n => n.userId === auth.currentUser?.uid || n.userId === 'global'), 
    [allNotifications, auth.currentUser]
  );

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [kycDocumentType, setKycDocumentType] = useState<KYCDocumentType | undefined>(undefined);

  const [referrer, setReferrer] = useState<Referrer | null>(null);

  useEffect(() => {
    if (!user?.referrerCode) {
      setReferrer(null);
      return;
    }
    const q = query(collection(db, 'publicProfiles'), where('referralCode', '==', user.referrerCode));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const d = snapshot.docs[0].data();
        setReferrer({
          name: d.name,
          code: d.referralCode,
          tier: d.tier,
          avatar: d.avatar,
          phone: d.phone || '',
          lineId: d.lineId || ''
        });
      } else {
        setReferrer(null);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `publicProfiles/referrer/${user.referrerCode}`));
    return () => unsubscribe();
  }, [user?.referrerCode]);

  const addresses = user?.addresses || [];
  const selectedAddressId = user?.selectedAddressId || null;
  const paymentMethod = user?.paymentMethod || 'PromptPay';
  const bankAccounts = user?.bankAccounts || [];
  const selectedBankId = user?.selectedBankId || null;
  const savedCards = user?.savedCards || [];
  const selectedCardId = user?.selectedCardId || null;
  const kycStatus = user?.kycStatus || 'Unverified';

  useEffect(() => { localStorage.setItem('synergy_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { 
    localStorage.setItem('synergy_lang', language);
    document.documentElement.lang = language;
  }, [language]);
  
  useEffect(() => {
      localStorage.setItem('synergy_font_size', fontSize);
      const root = document.documentElement;
      if (fontSize === 'small') {
          root.style.fontSize = '14px';
      } else if (fontSize === 'large') {
          root.style.fontSize = '19px';
      } else {
          root.style.fontSize = '16px';
      }
  }, [fontSize]);

  const showToast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
      setCurrentToast({ ...msg, id: Date.now() });
  }, []);

  const dismissToast = useCallback(() => {
      setCurrentToast(null);
  }, []);

  const getTierBySales = (sales: number): UserTier => {
    const s = TO_PRECISION(sales);
    if (s >= TIER_THRESHOLDS[UserTier.EXECUTIVE]) return UserTier.EXECUTIVE;
    if (s >= TIER_THRESHOLDS[UserTier.BUILDER]) return UserTier.BUILDER;
    if (s >= TIER_THRESHOLDS[UserTier.MARKETER]) return UserTier.MARKETER;
    return UserTier.STARTER; 
  };

  const login = async (email?: string, password?: string, isRegister: boolean = false) => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    if (isRegister) {
      localStorage.setItem('synergy_is_registering', 'true');
    } else {
      localStorage.removeItem('synergy_is_registering');
    }
    try {
      if (email && password) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        showToast({ message: "Login popup was closed. Please try again.", type: 'info' });
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        showToast({ message: "Invalid email or password.", type: 'error' });
      } else {
        console.error("Login failed", error);
        showToast({ message: "Login failed. Please try again.", type: 'error' });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async (email: string, password: string, username: string) => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    localStorage.setItem('synergy_is_registering', 'true');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });
      
      // The onAuthStateChanged listener will handle the Firestore document creation
      showToast({ message: "Registration successful!", type: 'success' });
    } catch (error: any) {
      console.error("Registration failed", error);
      if (error.code === 'auth/email-already-in-use') {
        showToast({ message: "Email already in use.", type: 'error' });
      } else {
        showToast({ message: "Registration failed. Please try again.", type: 'error' });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCart([]);
      setAppliedCoupon(null);
      dismissToast();
      setIsSecurityUnlocked(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      
      if (currentQty + quantity > product.stock) {
        showToast({ message: "Not enough stock!", type: 'error' });
        return prev;
      }

      showToast({ message: `Added ${quantity} ${product.name} to cart`, type: 'success' });

      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { ...product, quantity }];
    });
  };

  const toggleFavorite = async (productId: number) => {
    if (!user || !auth.currentUser) {
      showToast({ message: "Please login to add favorites", type: 'info' });
      return;
    }
    const currentFavorites = user.favorites || [];
    const isFav = currentFavorites.includes(productId);
    const newFavorites = isFav 
      ? currentFavorites.filter(id => id !== productId)
      : [...currentFavorites, productId];
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { favorites: newFavorites });
      showToast({ 
        message: isFav ? "Removed from favorites" : "Added to favorites", 
        type: 'success' 
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const isFavorite = (productId: number) => {
    return user?.favorites?.includes(productId) || false;
  };

  const removeFromCart = (productId: number) => { setCart(prev => prev.filter(item => item.id !== productId)); };
  const updateCartQuantity = (productId: number, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === productId);
      if (!item) return prev;
      
      const product = products.find(p => p.id === productId);
      const maxStock = product ? product.stock : item.stock;

      if (delta > 0 && item.quantity >= maxStock) {
        showToast({ message: "Maximum stock reached", type: 'warning' });
        return prev;
      }
      
      return prev.map(item => item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item);
    });
  };

  const getCommissionRate = (): number => user ? (TIER_RATES[user.tier] || TIER_RATES[UserTier.STARTER]) : TIER_RATES[UserTier.STARTER];
  
  const calculateCommission = (price: number) => {
      const preVatPrice = price / 1.07;
      return TO_PRECISION(preVatPrice * getCommissionRate());
  };

  const getNextTierTarget = (): number => {
    if (!user) return TIER_THRESHOLDS[UserTier.MARKETER];
    const s = TO_PRECISION(user.accumulatedSales);
    if (s < TIER_THRESHOLDS[UserTier.MARKETER]) return TIER_THRESHOLDS[UserTier.MARKETER];
    if (s < TIER_THRESHOLDS[UserTier.BUILDER]) return TIER_THRESHOLDS[UserTier.BUILDER];
    return TIER_THRESHOLDS[UserTier.EXECUTIVE]; 
  };

  const addAddress = async (address: Omit<Address, 'id'>) => {
    if (!auth.currentUser || !user) return;
    const newId = Date.now();
    const newAddr = { ...address, id: newId };
    const updatedAddresses = address.isDefault 
      ? (user.addresses || []).map(a => ({ ...a, isDefault: false })).concat(newAddr) 
      : [...(user.addresses || []), newAddr];
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
        addresses: updatedAddresses,
        selectedAddressId: selectedAddressId || newId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const updateAddress = async (id: number, updatedData: Partial<Address>) => {
    if (!auth.currentUser || !user) return;
    const currentAddresses = user.addresses || [];
    const updatedAddresses = currentAddresses.map(addr => {
      if (addr.id === id) {
        const newAddr = { ...addr, ...updatedData };
        return newAddr;
      }
      if (updatedData.isDefault) {
        return { ...addr, isDefault: false };
      }
      return addr;
    });

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { addresses: updatedAddresses });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const removeAddress = async (id: number) => {
    if (!auth.currentUser || !user) return;
    const updatedAddresses = (user.addresses || []).filter(addr => addr.id !== id);
    const newSelectedId = selectedAddressId === id ? (updatedAddresses[0]?.id || null) : selectedAddressId;
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
        addresses: updatedAddresses,
        selectedAddressId: newSelectedId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const selectAddress = async (id: number) => { 
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { selectedAddressId: id });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const setPaymentMethod = async (method: PaymentType) => { 
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { paymentMethod: method });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    if (code.toUpperCase() === "SYNERGY2024") { 
        setAppliedCoupon({ code: "SYNERGY2024", type: 'percent', value: 5, description: "Launch Bonus 5% Off" }); 
        return true; 
    }
    return false;
  };

  const removeCoupon = () => { setAppliedCoupon(null); };

  const getCartTotals = () => {
    const subtotal = TO_PRECISION(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0));
    let memberDiscount = 0;
    if (user) {
        memberDiscount = subtotal * (TIER_DISCOUNTS[user.tier] || 0);
    }
    memberDiscount = TO_PRECISION(memberDiscount);
    let couponDiscount = appliedCoupon ? (appliedCoupon.type === 'percent' ? TO_PRECISION(subtotal * (appliedCoupon.value / 100)) : appliedCoupon.value) : 0;
    const totalDiscount = TO_PRECISION(memberDiscount + couponDiscount);
    const finalPrice = TO_PRECISION(Math.max(0, subtotal - totalDiscount));
    
    const vat = TO_PRECISION(finalPrice - (finalPrice / 1.07)); 
    const total = finalPrice;
    
    return { subtotal, discount: totalDiscount, memberDiscount, couponDiscount, vat, total };
  };

  const checkout = async () => {
    if (!user || !auth.currentUser) return;
    const shippingAddr = (user.addresses || []).find(a => a.id === user.selectedAddressId);
    if (!shippingAddr) { showToast({ message: "Please select a shipping address.", type: 'error' }); return; }
    const { total } = getCartTotals();
    const currentPaymentMethod = user.paymentMethod || 'PromptPay';
    if (currentPaymentMethod === 'Wallet' && user.walletBalance < total) { showToast({ message: "Insufficient Wallet Balance!", type: 'error' }); return; }
    
    const orderId = `SF-${Math.floor(100000 + Math.random() * 899999)}`;
    const nowTimestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    const newOrder: Order = { 
        id: orderId, 
        userId: auth.currentUser.uid, 
        date: nowTimestamp, 
        items: [...cart], 
        total: total, 
        status: 'Pending', 
        shippingAddress: { ...shippingAddr }, 
        timeline: [
          { status: 'Payment Verified', date: new Date().toLocaleString(), completed: true }, 
          { status: 'Preparing Ship', date: '', completed: false }, 
          { status: 'Shipped', date: '', completed: false }, 
          { status: 'Delivered', date: '', completed: false }
        ] 
    };

    let socketData: { uplineId?: string; userName?: string; referrerTier?: UserTier } = {};

    try {
      await runTransaction(db, async (transaction) => {
        // 1. READS FIRST
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User does not exist");
        const userData = userSnap.data() as User;
        socketData.uplineId = userData.uplineId;
        socketData.userName = userData.name;

        // Read all products in cart
        const productSnaps = await Promise.all(cart.map(item => {
          const productRef = doc(db, 'products', String(item.id));
          return transaction.get(productRef);
        }));

        // Read referrer if exists
        let referrerSnap = null;
        if (userData.uplineId) {
          const referrerRef = doc(db, 'publicProfiles', userData.uplineId);
          referrerSnap = await transaction.get(referrerRef);
          if (referrerSnap.exists()) {
            socketData.referrerTier = referrerSnap.data().tier;
          }
        }

        // Read upline chain for commissions
        const uplineChain: { id: string; data: User }[] = [];
        let tempUplineId = userData.uplineId;
        let tempDepth = 0;
        while (tempUplineId && tempDepth < 10) {
            const uplineRef = doc(db, 'publicProfiles', tempUplineId);
            const uplineSnap = await transaction.get(uplineRef);
            if (!uplineSnap.exists()) break;
            const uplineData = uplineSnap.data() as User;
            uplineChain.push({ id: tempUplineId, data: uplineData });
            tempUplineId = uplineData.uplineId;
            tempDepth++;
        }

        // 2. LOGIC & WRITES
        const oldTier = userData.tier;
        if (currentPaymentMethod === 'Wallet' && userData.walletBalance < total) {
          throw new Error("Insufficient Wallet Balance!");
        }

        let newBalance = currentPaymentMethod === 'Wallet' ? TO_PRECISION(userData.walletBalance - total) : userData.walletBalance;
        const newAccumulatedSales = TO_PRECISION(userData.accumulatedSales + total);
        
        let newTier = getTierBySales(newAccumulatedSales);
        
        cart.forEach(item => {
            if (item.isPromo && item.promoDiscount) {
                let promoTier = UserTier.STARTER;
                if (item.promoDiscount >= 30) promoTier = UserTier.EXECUTIVE;
                else if (item.promoDiscount >= 20) promoTier = UserTier.BUILDER;
                else if (item.promoDiscount >= 10) promoTier = UserTier.MARKETER;
                
                const tierValues = { [UserTier.STARTER]: 0, [UserTier.MARKETER]: 1, [UserTier.BUILDER]: 2, [UserTier.EXECUTIVE]: 3 };
                if (tierValues[promoTier] > tierValues[newTier]) {
                    newTier = promoTier;
                }
            }
        });

        let newExpiry = userData.teamIncomeExpiry || null;
        if (userData.tier !== UserTier.STARTER || newTier !== UserTier.STARTER) {
            const now = new Date();
            const currentExpiry = userData.teamIncomeExpiry ? new Date(userData.teamIncomeExpiry) : now;
            const baseDate = currentExpiry > now ? currentExpiry : now;
            const extendedDate = new Date(baseDate.getTime() + (30 * 24 * 60 * 60 * 1000));
            newExpiry = extendedDate.toISOString();
        }

        // Update product stock (Writes)
        productSnaps.forEach((productSnap, index) => {
          if (productSnap.exists()) {
            const item = cart[index];
            const pData = productSnap.data() as Product;
            transaction.update(productSnap.ref, {
              sold: pData.sold + item.quantity,
              stock: Math.max(0, pData.stock - item.quantity)
            });
          }
        });

        transaction.set(doc(db, 'orders', orderId), cleanData(newOrder));
        
        // Handle Multi-Tier Commissions
        const preVatPrice = total / 1.07;
        let currentUplineId = userData.uplineId;
        let depth = 0;
        let lastTierInChain = UserTier.STARTER; // The tier of the person immediately below in the chain

        uplineChain.forEach((upline, depth) => {
            const uplineData = upline.data;
            const currentUplineId = upline.id;
            let commissionRate = 0;
            let type: 'Direct' | 'Team' = depth === 0 ? 'Direct' : 'Team';

            if (depth === 0) {
                commissionRate = TIER_RATES[uplineData.tier] || 0;
                lastTierInChain = uplineData.tier;
            } else {
                // Indirect rates based on the tier of the person immediately below
                const ratesForUplineTier = INDIRECT_RATES[uplineData.tier] || {};
                commissionRate = ratesForUplineTier[lastTierInChain] || 0;
                lastTierInChain = uplineData.tier;
            }

            if (commissionRate > 0) {
                const commissionAmount = TO_PRECISION(preVatPrice * commissionRate);
                const commissionId = `COMM-${Date.now()}-${depth}-${Math.floor(Math.random() * 1000)}`;
                
                const newCommission: CommissionTransaction = {
                    id: Date.now() + depth,
                    userId: currentUplineId,
                    orderId: orderId,
                    amount: commissionAmount,
                    status: 'Pending',
                    date: nowTimestamp,
                    type: type === 'Direct' ? 'Direct' : 'Team',
                    source: userData.name || 'Customer',
                    sourceUid: auth.currentUser!.uid
                };

                transaction.set(doc(db, 'commissions', commissionId), cleanData(newCommission));
                
                // Notify Upline
                const notifId = (Date.now() + depth + 100).toString();
                transaction.set(doc(db, 'notifications', notifId), cleanData({
                    userId: currentUplineId,
                    title: `New ${type} Commission! ฿${commissionAmount}`,
                    message: `You earned a commission from ${userData.name}'s order.`,
                    date: "Just now",
                    type: 'promo',
                    read: false,
                    relatedId: orderId,
                    relatedType: 'order'
                }));

                if (socket) {
                    socket.emit("commission:new", { userId: currentUplineId, amount: commissionAmount });
                    socket.emit("notification:new", { userId: currentUplineId, title: `New ${type} Commission! ฿${commissionAmount}` });
                }
            }
        });

        transaction.update(userRef, {
          walletBalance: newBalance,
          accumulatedSales: newAccumulatedSales,
          tier: newTier,
          teamIncomeExpiry: newExpiry
        });

        const notifId = Date.now().toString();
        transaction.set(doc(db, 'notifications', notifId), cleanData({ 
          userId: auth.currentUser!.uid, 
          title: "Order Placed", 
          message: `Order ${newOrder.id} is pending.`, 
          date: "Just now", 
          type: 'order', 
          read: false, 
          relatedId: newOrder.id, 
          relatedType: 'order' 
        }));

        if (newTier !== oldTier) {
            setPendingLevelUp({
                tier: newTier,
                oldTier: oldTier,
                commissionRate: TIER_RATES[newTier] * 100
            });
        }

        // Push to Realtime Database for Live Feed
        const liveSaleRef = push(ref(rtdb, 'liveSales'));
        set(liveSaleRef, {
          name: userData.name,
          amount: total,
          time: new Date().toISOString()
        });
      });

      if (socket) {
        socket.emit("order:created", newOrder);
        if (socketData.uplineId) {
          const commissionAmount = TO_PRECISION((total / 1.07) * (TIER_RATES[socketData.referrerTier || UserTier.STARTER] || TIER_RATES[UserTier.STARTER]));
          socket.emit("commission:new", { userId: socketData.uplineId, amount: commissionAmount });
          socket.emit("notification:new", { userId: socketData.uplineId, title: "New Commission Pending! ฿" + commissionAmount });
        }
        socket.emit("notification:new", { userId: auth.currentUser!.uid, title: "Order Placed", message: `Order ${newOrder.id} is pending.` });
      }
      
      setCart([]);
      setAppliedCoupon(null);
      showToast({ message: "Order placed successfully!", type: 'success' });
      window.location.hash = '#/account';
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'checkout');
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, reason?: string) => { 
      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) return;
        const o = orderSnap.data() as Order;

        if (status === 'To Ship' && socket) {
          socket.emit("admin:verify_payment", { orderId, userId: o.userId });
        }
        
        const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        let updatedTimeline = [...o.timeline];

        if (status === 'To Ship') {
            updatedTimeline = updatedTimeline.map(step => step.status === 'Preparing Ship' ? { ...step, completed: true, date: now } : step);
        } else if (status === 'Shipped') {
            updatedTimeline = updatedTimeline.map(step => step.status === 'Shipped' ? { ...step, completed: true, date: now } : step);
        } else if (status === 'Delivered') {
            updatedTimeline = updatedTimeline.map(step => step.status === 'Delivered' ? { ...step, completed: true, date: now } : step);
            await settleCommissionForOrder(orderId);
        } else if (status === 'Return Pending') {
            updatedTimeline.push({ status: 'Return Requested', date: now, completed: true });
        } else if (status === 'Returned') {
            updatedTimeline.push({ status: 'Returned & Refunded', date: now, completed: true });
            await reverseCommissionAndSales(orderId, o.total);
        }

        await setDoc(orderRef, { status, timeline: updatedTimeline, returnReason: reason || o.returnReason || null }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
      }
  };

  const reverseCommissionAndSales = async (orderId: string, orderTotal: number) => {
      try {
        const q = query(collection(db, 'commissions'), where('orderId', '==', orderId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return;

        for (const commissionDoc of snapshot.docs) {
          const commissionTx = commissionDoc.data() as CommissionTransaction;
          
          if (commissionTx.status === 'Paid') {
              await runTransaction(db, async (transaction) => {
                  const userRef = doc(db, 'users', commissionTx.userId);
                  const userSnap = await transaction.get(userRef);
                  if (!userSnap.exists()) return;
                  
                  const userData = userSnap.data() as User;
                  transaction.update(userRef, {
                      walletBalance: TO_PRECISION(userData.walletBalance - commissionTx.amount),
                      accumulatedIncome: TO_PRECISION(Math.max(0, (userData.accumulatedIncome || 0) - commissionTx.amount)),
                      accumulatedSales: TO_PRECISION(Math.max(0, userData.accumulatedSales - orderTotal))
                  });

                  const notifId = (Date.now() + Math.random()).toString();
                  transaction.set(doc(db, 'notifications', notifId), {
                      userId: commissionTx.userId,
                      title: "Commission Reversed",
                      message: `Commission of ฿${commissionTx.amount} for Order ${orderId} has been deducted due to product return.`,
                      date: "Just now",
                      type: 'system',
                      read: false
                  });
              });
          }

          await updateDoc(commissionDoc.ref, { status: 'Cancelled' });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `commissions/order/${orderId}`);
      }
  };

  const settleCommissionForOrder = async (orderId: string) => {
      try {
        const q = query(collection(db, 'commissions'), where('orderId', '==', orderId), where('status', '==', 'Pending'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return;

        for (const commissionDoc of snapshot.docs) {
          const tx = commissionDoc.data() as CommissionTransaction;
          
          await runTransaction(db, async (transaction) => {
            const userRef = doc(db, 'users', tx.userId);
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) return;
            
            const userData = userSnap.data() as User;
            transaction.update(userRef, {
              walletBalance: TO_PRECISION(userData.walletBalance + tx.amount),
              accumulatedIncome: TO_PRECISION((userData.accumulatedIncome || 0) + tx.amount)
            });
            
            transaction.update(commissionDoc.ref, { status: 'Paid' });
            
            if (socket) {
              socket.emit("notification:new", { 
                userId: tx.userId, 
                title: "Commission Settled! ฿" + tx.amount,
                message: `Your commission for order ${orderId} has been moved to available balance.`
              });
            }

            const notifId = (Date.now() + 1).toString();
            transaction.set(doc(db, 'notifications', notifId), cleanData({
              userId: tx.userId,
              title: "Commission Settled! ฿" + tx.amount,
              message: `Your commission for order ${orderId} has been moved to available balance.`,
              date: "Just now",
              type: 'promo',
              read: false,
              relatedId: tx.id,
              relatedType: 'commission'
            }));
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `commissions/order/${orderId}`);
      }
  };

  const addBankAccount = async (account: Omit<BankAccount, 'id'>): Promise<boolean> => {
    if (!auth.currentUser || !user) return false;
    if ((user.bankAccounts || []).length >= 2) return false;
    const newId = Date.now();
    const newBank = { ...account, id: newId };
    const updatedBanks = [...(user.bankAccounts || []), newBank];
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
        bankAccounts: updatedBanks,
        selectedBankId: user.selectedBankId || newId
      });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      return false;
    }
  };
  const removeBankAccount = async (id: number) => { 
    if (!auth.currentUser || !user) return;
    const updatedBanks = (user.bankAccounts || []).filter(b => b.id !== id);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
        bankAccounts: updatedBanks,
        selectedBankId: user.selectedBankId === id ? null : user.selectedBankId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };
  const selectBank = async (id: number) => { 
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { selectedBankId: id });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const addCreditCard = async (card: Omit<CreditCardInfo, 'id' | 'brand'>) => {
    if (!auth.currentUser || !user) return;
    const brands: ('Visa' | 'Mastercard' | 'JCB' | 'Amex')[] = ['Visa', 'Mastercard', 'JCB', 'Amex'];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const newId = Date.now();
    const newCard = { ...card, id: newId, brand };
    const updatedCards = [...(user.savedCards || []), newCard];
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
        savedCards: updatedCards,
        selectedCardId: user.selectedCardId || newId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };
  const removeCreditCard = async (id: number) => {
    if (!auth.currentUser || !user) return;
    const updatedCards = (user.savedCards || []).filter(c => c.id !== id);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
        savedCards: updatedCards,
        selectedCardId: user.selectedCardId === id ? null : user.selectedCardId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };
  const selectCreditCard = async (id: number) => { 
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { selectedCardId: id });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const updateUserKycStatus = async (userId: string, status: KYCStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), { kycStatus: status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const updateKycStatus = async (status: KYCStatus) => { 
    if (!auth.currentUser) return;
    updateUserKycStatus(auth.currentUser.uid, status);
  };
  const checkDocSize = (data: any): boolean => {
    const size = JSON.stringify(data).length;
    if (size > 1000000) {
      showToast({ message: "Data too large for Firestore (max 1MB). Please use a smaller image or reduce content.", type: 'error' });
      return false;
    }
    return true;
  };

  const updateUserProfile = async (data: Partial<User>) => { 
    if (!auth.currentUser || !user) return;
    try {
      const cleaned = cleanData(data);
      if (!checkDocSize(cleaned)) return;
      const updatedUser = { ...user, ...data };
      await setDoc(doc(db, 'users', auth.currentUser.uid), cleaned, { merge: true });
      syncPublicProfile(updatedUser, auth.currentUser.uid);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };
  
  const withdrawFunds = async (amount: number, bankId: number): Promise<CommissionTransaction | null> => {
    if (!user || !auth.currentUser) return null;
    if (user.kycStatus !== 'Verified') return null; 
    
    if (amount < 500) {
      showToast({ message: "Min withdrawal is ฿500.", type: 'error' });
      return null;
    }
    if (amount > 50000) {
      showToast({ message: "Max withdrawal is ฿50,000.", type: 'error' });
      return null;
    }
    
    const bank = (user.bankAccounts || []).find(b => b.id === bankId);
    if (!bank) return null; 
    const nowTimestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newTx: CommissionTransaction = { 
      id: Date.now(), 
      userId: auth.currentUser.uid, 
      date: nowTimestamp, 
      source: `Withdrawal: ${bank.accountName} | ${bank.bankName} | ACC: ${bank.accountNumber}`, 
      type: "Withdrawal", 
      amount: -amount, 
      status: "Waiting" 
    };
    
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User does not exist");
        
        const userData = userSnap.data() as User;
        if (userData.walletBalance < amount) throw new Error("Insufficient balance");

        transaction.set(doc(db, 'commissions', String(newTx.id)), cleanData(newTx));
        transaction.update(userRef, {
          walletBalance: TO_PRECISION(userData.walletBalance - amount)
        });
      });
      return newTx;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `withdraw/${newTx.id}`);
      return null;
    }
  };

  const updateUserReferralCode = async (userId: string, newCode: string) => {
    if (!auth.currentUser) return;
    const normalizedCode = newCode.toUpperCase().trim();
    try {
      // Check if code is already in use
      const q = query(collection(db, 'users'), where('referralCode', '==', normalizedCode), limit(1));
      const snapshot = await getDocs(q);
      
      const isUsedByOther = snapshot.docs.some(d => d.id !== userId);
      if (isUsedByOther) {
        showToast({ message: "This referral code is already in use", type: "error" });
        return;
      }

      await updateDoc(doc(db, 'users', userId), { referralCode: normalizedCode });
      showToast({ message: "Referral code updated successfully", type: "success" });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      showToast({ message: "Failed to update referral code", type: "error" });
    }
  };

  const markNotificationAsRead = async (id: number) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'notifications', String(id)), { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const toggleFeedLike = async (id: number) => {
    if (!auth.currentUser) return;
    const feedRef = doc(db, 'feed', String(id));
    
    try {
      await runTransaction(db, async (transaction) => {
        const feedSnap = await transaction.get(feedRef);
        if (!feedSnap.exists()) throw new Error("Post does not exist");
        
        const post = feedSnap.data() as FeedItem;
        const likedBy = post.likedBy || [];
        const hasLiked = likedBy.includes(auth.currentUser!.uid);
        
        const newLikedBy = hasLiked 
          ? likedBy.filter(uid => uid !== auth.currentUser!.uid)
          : [...likedBy, auth.currentUser!.uid];
          
        transaction.update(feedRef, { 
          likes: newLikedBy.length,
          likedBy: newLikedBy
        });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `feed/${id}`);
    }
  };

  const addFeedComment = async (postId: number, text: string) => {
    if (!auth.currentUser || !user) return;
    const feedRef = doc(db, 'feed', String(postId));
    
    try {
      await runTransaction(db, async (transaction) => {
        const feedSnap = await transaction.get(feedRef);
        if (!feedSnap.exists()) throw new Error("Post does not exist");
        
        const post = feedSnap.data() as FeedItem;
        const newComment = {
            id: Date.now(),
            user: user.name,
            avatar: user.avatar,
            text,
            date: "Just now"
        };
        
        transaction.update(feedRef, { 
          comments: [newComment, ...(post.comments || [])]
        });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `feed/${postId}`);
    }
  };

  const createPost = async (data: { image: string, type: 'image' | 'video', caption: string, mood: string, isAd: boolean, productId?: number }) => {
    if (!user || !auth.currentUser) return;
    const newId = Date.now();
    const newPost: FeedItem = {
        id: newId,
        type: data.type,
        category: data.isAd ? 'Trending' : 'For You',
        user: user.name,
        userId: auth.currentUser.uid,
        avatar: user.avatar,
        content: data.image,
        caption: data.caption,
        mood: data.mood,
        status: 'Pending',
        likes: 0,
        likedBy: [],
        shares: 0,
        comments: [],
        isAi: true,
        isAd: data.isAd,
        productId: data.productId
    };
    
    try {
      const cleaned = cleanData(newPost);
      if (!checkDocSize(cleaned)) return;
      await setDoc(doc(db, 'feed', String(newId)), cleaned);
      
      const notifId = (Date.now() + 2).toString();
      await setDoc(doc(db, 'notifications', notifId), {
          userId: auth.currentUser.uid,
          title: data.isAd ? "Ad Campaign Created" : "Content Reviewing",
          message: data.isAd ? "Your advertisement is being audited for high-conversion standards." : "Your AI-assisted post is being audited for compliance.",
          date: "Just now",
          type: 'system',
          read: false
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `feed/${newId}`);
    }
  };

  const addReview = async (productId: number, orderId: string, rating: number, text: string, images: string[]) => {
      if (!user || !auth.currentUser) return;
      try {
        const productRef = doc(db, 'products', String(productId));
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) return;
        const p = productSnap.data() as Product;
        const newReview = { id: Date.now(), user: user.name, rating, text, date: new Date().toLocaleDateString(), images };
        const updatedReviews = [newReview, ...(p.reviews || [])];
        
        await updateDoc(productRef, { reviews: updatedReviews });

        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          const o = orderSnap.data() as Order;
          const reviewedIds = o.reviewedProductIds || [];
          if (!reviewedIds.includes(productId)) {
              await updateDoc(orderRef, { reviewedProductIds: [...reviewedIds, productId] });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
      }
  };

  const updateUserSocials = async (platform: 'facebook' | 'line' | 'google', connected: boolean, name: string) => {
    if (!auth.currentUser || !user) return;
    const updatedSocials = {
      ...(user.socials || {
        facebook: { connected: false, name: '' },
        line: { connected: false, name: '' },
        google: { connected: false, name: '' }
      }),
      [platform]: { connected, name }
    };
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { socials: updatedSocials });
      if (platform === 'line') {
        syncPublicProfile({ ...user, socials: updatedSocials, lineId: name }, auth.currentUser.uid);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const updateUserSecurity = async (type: 'password' | 'pin', value: string) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { [type]: value });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const addReferrer = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser) return { success: false, error: 'Not authenticated' };
    if (user?.referralCode === code) return { success: false, error: 'Cannot refer yourself' };
    
    try {
      // SYN001 is the admin's code and is always valid as a default
      if (code === 'SYN001') {
        const adminUid = await getUidByReferralCode('SYN001');
      await setDoc(doc(db, 'users', auth.currentUser.uid), cleanData({ 
          referrerCode: code,
          uplineId: adminUid || undefined
        }), { merge: true });
        return { success: true };
      }

      // Verify if other codes exist in publicProfiles
      const q = query(collection(db, 'publicProfiles'), where('referralCode', '==', code));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, error: 'Referrer code not found' };
      }

      const referrerUid = querySnapshot.docs[0].id;
      if (referrerUid === auth.currentUser.uid) {
          return { success: false, error: 'Cannot refer yourself' };
      }

      await setDoc(doc(db, 'users', auth.currentUser.uid), cleanData({ 
        referrerCode: code,
        uplineId: referrerUid
      }), { merge: true });

      // Increment teamSize of referrer
      await updateDoc(doc(db, 'users', referrerUid), { teamSize: increment(1) });
      await updateDoc(doc(db, 'publicProfiles', referrerUid), { teamSize: increment(1) });

      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      return { success: false, error: 'Update failed' };
    }
  };

  const updateOrderAddress = async (orderId: string, address: Address) => {
    try {
      await setDoc(doc(db, 'orders', orderId), { shippingAddress: address }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Admin Methods Implementation
  const updateProduct = async (productId: number, data: Partial<Product>) => {
    try {
      const cleaned = cleanData(data);
      if (!checkDocSize(cleaned)) return;
      await setDoc(doc(db, 'products', String(productId)), cleaned, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
    }
  };
  const deleteProduct = async (productId: number) => { 
    try {
      await deleteDoc(doc(db, 'products', String(productId)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  };
  const addProduct = async (product: Omit<Product, 'id'>) => { 
    const newId = Date.now();
    try {
      const cleaned = cleanData({ ...product, id: newId });
      if (!checkDocSize(cleaned)) return;
      await setDoc(doc(db, 'products', String(newId)), cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${newId}`);
    }
  };
  const updateAd = async (adId: number, data: Partial<Ad>) => {
    try {
      const cleaned = cleanData(data);
      if (!checkDocSize(cleaned)) return;
      await setDoc(doc(db, 'ads', String(adId)), cleaned, { merge: true });
      showToast({ message: "Ad updated successfully", type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `ads/${adId}`);
      showToast({ message: "Failed to update ad", type: 'error' });
    }
  };
  const deleteAd = async (adId: number) => { 
    try {
      await deleteDoc(doc(db, 'ads', String(adId)));
      showToast({ message: "Ad deleted successfully", type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `ads/${adId}`);
      showToast({ message: "Failed to delete ad", type: 'error' });
    }
  };
  const addAd = async (ad: Omit<Ad, 'id'>) => {
    const newId = Date.now();
    try {
      const cleaned = cleanData({ ...ad, id: newId });
      if (!checkDocSize(cleaned)) return;
      await setDoc(doc(db, 'ads', String(newId)), cleaned);
      showToast({ message: "Ad added successfully", type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `ads/${newId}`);
      showToast({ message: "Failed to add ad", type: 'error' });
    }
  };
  const updateCampaignAsset = async (assetId: number, data: Partial<CampaignAsset>) => {
    try {
      const cleaned = cleanData(data);
      // Check for document size limit (1MB)
      const size = JSON.stringify(cleaned).length;
      if (size > 1000000) {
        showToast({ message: "Data too large for Firestore (max 1MB). Please use a smaller image.", type: 'error' });
        return;
      }
      await setDoc(doc(db, 'campaignAssets', String(assetId)), cleaned, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `campaignAssets/${assetId}`);
    }
  };

  const deleteCampaignAsset = async (assetId: number) => {
    try {
      await deleteDoc(doc(db, 'campaignAssets', String(assetId)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `campaignAssets/${assetId}`);
    }
  };

  const addCampaignAsset = async (asset: Omit<CampaignAsset, 'id'>) => {
    const newId = Date.now();
    try {
      const cleaned = cleanData({ ...asset, id: newId });
      // Check for document size limit (1MB)
      const size = JSON.stringify(cleaned).length;
      if (size > 1000000) {
        showToast({ message: "Data too large for Firestore (max 1MB). Please use a smaller image.", type: 'error' });
        return;
      }
      await setDoc(doc(db, 'campaignAssets', String(newId)), cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `campaignAssets/${newId}`);
    }
  };

  const updateOnboardingSlide = async (slideId: number, data: Partial<OnboardingSlide>) => {
    try {
      const cleaned = cleanData(data);
      if (!checkDocSize(cleaned)) return;
      await setDoc(doc(db, 'onboardingSlides', String(slideId)), cleaned, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `onboardingSlides/${slideId}`);
    }
  };

  const deleteOnboardingSlide = async (slideId: number) => {
    try {
      await deleteDoc(doc(db, 'onboardingSlides', String(slideId)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `onboardingSlides/${slideId}`);
    }
  };

  const addOnboardingSlide = async (slide: Omit<OnboardingSlide, 'id'>) => {
    const newId = Date.now();
    try {
      const cleaned = cleanData({ ...slide, id: newId });
      if (!checkDocSize(cleaned)) return;
      await setDoc(doc(db, 'onboardingSlides', String(newId)), cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `onboardingSlides/${newId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  const updateCommissionStatus = async (txId: number, status: CommissionTransaction['status']) => {
    try {
      await setDoc(doc(db, 'commissions', String(txId)), { status }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `commissions/${txId}`);
    }
  };

  const deleteCommission = async (txId: number) => {
    try {
      await deleteDoc(doc(db, 'commissions', String(txId)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `commissions/${txId}`);
    }
  };

  const deleteTeamMember = async (memberId: string | number) => {
    try {
      await deleteDoc(doc(db, 'users', String(memberId)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${memberId}`);
    }
  };

  const updateMemberTier = async (memberId: string | number, tier: UserTier) => {
    try {
      await setDoc(doc(db, 'users', String(memberId)), { tier }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${memberId}`);
    }
  };

  const updateFeedStatus = async (postId: number, status: 'Approved' | 'Pending') => { 
    try {
      await setDoc(doc(db, 'feed', String(postId)), { status }, { merge: true });
      if (status === 'Approved' && socket) {
        socket.emit("admin:approve_post", postId);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `feed/${postId}`);
    }
  };

  const deleteFeedPost = async (postId: number) => {
    try {
      await deleteDoc(doc(db, 'feed', String(postId)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `feed/${postId}`);
    }
  };

  const updateFeedPost = async (postId: number, data: Partial<FeedItem>) => {
    try {
      const cleaned = cleanData(data);
      if (!checkDocSize(cleaned)) return;
      await setDoc(doc(db, 'feed', String(postId)), cleaned, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `feed/${postId}`);
    }
  };

  const updateSystemSettings = async (data: Partial<SystemSettings>) => {
    try {
      const cleaned = cleanData(data);
      if (!checkDocSize(cleaned)) return;
      await setDoc(doc(db, 'systemSettings', 'current'), cleaned, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'systemSettings/current');
    }
  };

  const broadcastPromotion = (promo: Omit<Promotion, 'id' | 'active'>) => { 
    const newPromo = { ...promo, id: Date.now(), active: true };
    setActivePromo(newPromo); 
    if (socket) {
      socket.emit("admin:broadcast_promotion", newPromo);
    }
  };
  const dismissPromotion = () => { setActivePromo(null); };

  // Internationalization Helper
  const t = (key: string) => {
      const entry = dictionary[key];
      if (!entry) return key;
      return entry[language] || entry.en;
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    if (user?.role !== 'admin') return;
    try {
      await setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true });
      showToast({ message: `User role updated to ${newRole}`, type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const updateUserAdminProfile = async (userId: string, data: Partial<User>) => {
    if (user?.role !== 'admin') return;
    try {
      const cleaned = cleanData(data);
      await setDoc(doc(db, 'users', userId), cleaned, { merge: true });
      // Also update public profile if relevant fields are changed
      const publicFields = ['name', 'avatar', 'tier', 'referralCode', 'phone', 'lineId'];
      const publicData: any = {};
      publicFields.forEach(f => {
        if (cleaned[f] !== undefined) publicData[f] = cleaned[f];
      });
      if (Object.keys(publicData).length > 0) {
        await updateDoc(doc(db, 'publicProfiles', userId), publicData);
      }
      showToast({ message: "User profile updated successfully", type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const factoryReset = async () => {
    const isAdmin = auth.currentUser && (
      auth.currentUser.email?.toLowerCase() === "yanpay2009@gmail.com" || 
      auth.currentUser.email?.toLowerCase() === "synergyflow.my@gmail.com" ||
      auth.currentUser.uid === "ugTOls4K6EgKG13hBiAXHaYC2bj2" ||
      auth.currentUser.uid === "mqZUUW73sCYe1bJTowBqF1HI2O02"
    );
    if (!auth.currentUser || !isAdmin) {
      showToast({ message: "Unauthorized", type: "error" });
      return;
    }

    try {
      // 1. Clear users (except admin)
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const d of usersSnap.docs) {
        const userData = d.data();
        const email = userData.email;
        const uid = d.id;
        if (
          email?.toLowerCase() !== "yanpay2009@gmail.com" && 
          email?.toLowerCase() !== "synergyflow.my@gmail.com" &&
          uid !== "ugTOls4K6EgKG13hBiAXHaYC2bj2" &&
          uid !== "mqZUUW73sCYe1bJTowBqF1HI2O02"
        ) {
          await deleteDoc(d.ref);
        } else {
          // Reset admin to initial state
          await updateDoc(d.ref, {
            accumulatedSales: 0,
            accumulatedIncome: 0,
            walletBalance: 0,
            tier: UserTier.STARTER,
            kycStatus: "Verified",
            role: 'admin',
            favorites: []
          });
        }
      }

      // 2. Clear other collections
      const collectionsToClear = [
        'orders', 'withdrawals', 'commissions', 'notifications', 
        'ads', 'onboardingSlides', 'products', 'campaignAssets', 
        'feed', 'publicProfiles', 'promotions'
      ];
      
      for (const coll of collectionsToClear) {
        try {
          const snap = await getDocs(collection(db, coll));
          for (const d of snap.docs) {
            await deleteDoc(d.ref);
          }
        } catch (e) {
          console.warn(`Failed to clear collection ${coll}`, e);
        }
      }

      // 3. Reset counters
      await setDoc(doc(db, 'counters', 'users'), { count: 1 });

      // 4. Re-populate initial products
      for (const p of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', String(p.id)), cleanData(p));
      }

      // 5. Reset System Settings to default
      await setDoc(doc(db, 'systemSettings', 'current'), {
        logo: null,
        slipBackground: null,
        contactLinks: { line: '', phone: '', email: '', website: '', terms: '', privacy: '' }
      });

      showToast({ message: "System reset successfully", type: "success" });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error("Factory reset failed", err);
      showToast({ message: "Failed to reset system", type: "error" });
    }
  };

  const healReferralCodes = async () => {
    const isAdmin = auth.currentUser && (
      auth.currentUser.email?.toLowerCase() === "yanpay2009@gmail.com" || 
      auth.currentUser.email?.toLowerCase() === "synergyflow.my@gmail.com" ||
      auth.currentUser.uid === "ugTOls4K6EgKG13hBiAXHaYC2bj2" ||
      auth.currentUser.uid === "mqZUUW73sCYe1bJTowBqF1HI2O02"
    );
    if (!auth.currentUser || !isAdmin) {
      showToast({ message: "Unauthorized", type: "error" });
      return;
    }

    try {
      const q = query(collection(db, 'users'), where('referralCode', '==', 'SYN001'));
      const snap = await getDocs(q);
      
      let healedCount = 0;
      for (const d of snap.docs) {
        const userData = d.data() as User;
        const uid = d.id;
        if (
          userData.email?.toLowerCase() !== "yanpay2009@gmail.com" && 
          userData.email?.toLowerCase() !== "synergyflow.my@gmail.com" &&
          uid !== "ugTOls4K6EgKG13hBiAXHaYC2bj2" &&
          uid !== "mqZUUW73sCYe1bJTowBqF1HI2O02"
        ) {
          // This is a duplicate!
          const newCode = `SYN${Math.floor(1000 + Math.random() * 8999)}`;
          await updateDoc(d.ref, { referralCode: newCode });
          // Also update public profile
          await setDoc(doc(db, 'publicProfiles', d.id), { referralCode: newCode }, { merge: true });
          healedCount++;
        }
      }

      showToast({ message: `Healed ${healedCount} duplicate referral codes`, type: "success" });
    } catch (err) {
      console.error("Heal referral codes failed", err);
      showToast({ message: "Failed to heal referral codes", type: "error" });
    }
  };

  const healTeamSizes = async () => {
    const isAdmin = auth.currentUser && (
      auth.currentUser.email?.toLowerCase() === "yanpay2009@gmail.com" || 
      auth.currentUser.email?.toLowerCase() === "synergyflow.my@gmail.com" ||
      auth.currentUser.uid === "ugTOls4K6EgKG13hBiAXHaYC2bj2" ||
      auth.currentUser.uid === "mqZUUW73sCYe1bJTowBqF1HI2O02"
    );
    if (!auth.currentUser || !isAdmin) {
      showToast({ message: "Unauthorized", type: "error" });
      return;
    }

    try {
      showToast({ message: "Healing team sizes...", type: "info" });
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => ({ ...d.data(), id: d.id })) as (User & { id: string })[];
      
      const teamSizeMap: Record<string, number> = {};
      allUsers.forEach(u => {
        if (u.uplineId) {
          teamSizeMap[u.uplineId] = (teamSizeMap[u.uplineId] || 0) + 1;
        }
      });

      let healedCount = 0;
      for (const u of allUsers) {
        const currentTeamSize = teamSizeMap[u.id] || 0;
        if (u.teamSize !== currentTeamSize) {
          await updateDoc(doc(db, 'users', u.id), { teamSize: currentTeamSize });
          await updateDoc(doc(db, 'publicProfiles', u.id), { teamSize: currentTeamSize });
          healedCount++;
        }
      }

      showToast({ message: `Healed ${healedCount} team sizes`, type: "success" });
    } catch (err) {
      console.error("Heal team sizes failed", err);
      showToast({ message: "Failed to heal team sizes", type: "error" });
    }
  };

  const healUplinePaths = async () => {
    const isAdmin = auth.currentUser && (
      auth.currentUser.email?.toLowerCase() === "yanpay2009@gmail.com" || 
      auth.currentUser.email?.toLowerCase() === "synergyflow.my@gmail.com" ||
      auth.currentUser.uid === "ugTOls4K6EgKG13hBiAXHaYC2bj2" ||
      auth.currentUser.uid === "mqZUUW73sCYe1bJTowBqF1HI2O02"
    );
    if (!auth.currentUser || !isAdmin) {
      showToast({ message: "Unauthorized", type: "error" });
      return;
    }

    try {
      showToast({ message: "Healing upline paths...", type: "info" });
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => ({ ...d.data(), id: d.id })) as (User & { id: string })[];
      
      const getPath = (uid: string, visited = new Set<string>()): string[] => {
        if (visited.has(uid)) return []; // Prevent infinite loops
        visited.add(uid);
        const u = allUsers.find(x => x.id === uid);
        if (!u || !u.uplineId) return [];
        return [...getPath(u.uplineId, visited), u.uplineId];
      };

      let healedCount = 0;
      for (const u of allUsers) {
        const path = getPath(u.id);
        const currentPathStr = JSON.stringify(u.uplinePath || []);
        const newPathStr = JSON.stringify(path);
        
        if (currentPathStr !== newPathStr) {
          await updateDoc(doc(db, 'users', u.id), { uplinePath: path });
          // Also update public profile
          await setDoc(doc(db, 'publicProfiles', u.id), { uplinePath: path }, { merge: true });
          healedCount++;
        }
      }

      showToast({ message: `Healed ${healedCount} upline paths`, type: "success" });
    } catch (err) {
      console.error("Heal upline paths failed", err);
      showToast({ message: "Failed to heal upline paths", type: "error" });
    }
  };

  const contextValue: AppContextType = {
    user, isLoggedIn, cart, products, feed, ads, campaignAssets, onboardingSlides, team: userTeam, referrer, commissions: userCommissions, orders: userOrders, addresses, selectedAddressId, paymentMethod, appliedCoupon, notifications: userNotifications, activePromo, systemSettings, isSearchActive, setIsSearchActive, liveSales, pendingLevelUp, dismissLevelUp, isSecurityUnlocked, setIsSecurityUnlocked, notificationsEnabled, setNotificationsEnabled, currentToast, showToast, bottomNavHidden, setBottomNavHidden, dismissToast, allOrders, allTeamMembers: allTeam, allCommissions, bankAccounts, selectedBankId, savedCards, selectedCardId, kycStatus, language, setLanguage, fontSize, setFontSize, t, login, register, logout, addToCart, removeFromCart, updateCartQuantity, checkout, calculateCommission, getNextTierTarget, getCommissionRate, addAddress, updateAddress, removeAddress, selectAddress, setPaymentMethod, applyCoupon, removeCoupon, getCartTotals, addBankAccount, removeBankAccount, selectBank, addCreditCard, removeCreditCard, selectCreditCard, updateKycStatus, updateUserKycStatus, updateUserProfile, updateUserAdminProfile, updateUserRole, withdrawFunds, markNotificationAsRead, toggleFeedLike, addFeedComment, createPost, addReview, updateUserSocials, updateUserSecurity, addReferrer, updateOrderAddress, updateProduct, deleteProduct, addProduct, updateAd, deleteAd, addAd, updateCampaignAsset, deleteCampaignAsset, addCampaignAsset, updateOnboardingSlide, deleteOnboardingSlide, addOnboardingSlide, updateOrderStatus, deleteOrder, updateCommissionStatus, deleteCommission, deleteTeamMember, updateMemberTier, updateFeedStatus, deleteFeedPost, updateFeedPost, broadcastPromotion, dismissPromotion, updateSystemSettings, updateUserReferralCode, factoryReset, healReferralCodes, healTeamSizes, healUplinePaths, toggleFavorite, isFavorite
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};