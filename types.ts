export enum UserTier {
  STARTER = 'Starter', // 5%
  MARKETER = 'Marketer', // 10% (Req: 3000 sales)
  BUILDER = 'Builder', // 20% (Req: 6000 sales)
  EXECUTIVE = 'Executive' // 30% (Req: 9000 sales)
}

export interface LevelUpInfo {
  tier: UserTier;
  commissionRate: number;
  oldTier: UserTier;
}

export interface SystemSettings {
  logo: string | null;
  slipBackground: string | null;
  contactLinks: {
    line: string;
    phone: string;
    email: string;
    website: string;
    terms: string;
    privacy: string;
  };
}

export interface Promotion {
  id: number;
  image: string;
  title: string;
  active: boolean;
  link?: string;
}

export interface CampaignAsset {
  id: number;
  title: string;
  description: string;
  image: string;
  active: boolean;
  category?: string;
  commission?: string;
  status?: 'Active' | 'Upcoming' | 'Ended';
  adFormat?: string;
  conditions?: string;
}

export interface Review {
  id: number;
  user: string;
  rating: number;
  text: string;
  date: string;
  images?: string[];
}

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  images?: string[]; 
  category: string;
  sold: number;
  stock: number;
  description?: string;
  descriptionImages?: string[];
  reviews?: Review[];
  isPromo?: boolean;
  promoDiscount?: number; // percentage
  expiryDate?: string | null; // ISO string
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Comment {
  id: number;
  user: string;
  avatar: string;
  text: string;
  date: string;
}

export interface FeedItem {
  id: number;
  type: 'image' | 'video';
  category: 'Trending' | 'For You';
  user: string;
  userId: string; 
  avatar: string;
  content: string; 
  caption: string;
  mood?: string;
  status: 'Approved' | 'Pending';
  likes: number;
  likedBy?: string[];
  shares: number;
  comments: Comment[];
  isAi: boolean;
  isAd?: boolean;
  productId?: number;
}

export interface Ad {
  id: number;
  title: string;
  image: string;
  active: boolean;
  subtitle?: string;
  placement: 'home' | 'feed' | 'account' | 'home_banner' | 'home_banner_2';
  expiryDate?: string | null; // ISO string
}

export interface OnboardingSlide {
  id: number;
  title: string;
  desc: string;
  image: string;
}

export interface TeamMember {
  id: string | number;
  referralCode?: string;
  uplineId: string; 
  uplinePath?: string[];
  name: string;
  email?: string;
  tier: UserTier;
  avatar: string;
  totalSales: number;
  teamSize: number;
  accumulatedIncome: number;
  joinedDate: string;
  relationship: 'Direct' | 'Indirect';
  phone?: string;
  lineId?: string;
  idCardImage?: string;
  kycStatus?: KYCStatus;
  role?: 'admin' | 'user';
}

export interface Referrer {
  name: string;
  code: string;
  tier: UserTier;
  avatar: string;
  phone: string;
  lineId: string;
}

export interface CommissionTransaction {
  id: number;
  userId: string; 
  orderId?: string; // Linked order
  date: string;
  source: string; 
  sourceUid?: string;
  type: 'Direct' | 'Team' | 'Withdrawal';
  amount: number;
  salesVolume?: number; 
  status: 'Pending' | 'Paid' | 'Completed' | 'Waiting' | 'Cancelled';
}

export interface User {
  name: string;
  uid: string;
  username?: string;
  email: string;
  phone?: string;
  lineId?: string;
  tier: UserTier;
  accumulatedSales: number;
  teamSize: number;
  accumulatedIncome: number;
  walletBalance: number;
  avatar: string;
  referralCode: string;
  pin?: string;
  password?: string;
  teamIncomeExpiry?: string; 
  kycDocumentType?: KYCDocumentType;
  kycFullName?: string;
  hasWorkPermit?: boolean;
  socials?: {
    facebook: { connected: boolean; name: string };
    line: { connected: boolean; name: string };
    google: { connected: boolean; name: string };
  };
  addresses?: Address[];
  selectedAddressId?: number | null;
  bankAccounts?: BankAccount[];
  selectedBankId?: number | null;
  savedCards?: CreditCardInfo[];
  selectedCardId?: number | null;
  kycStatus?: KYCStatus;
  idCardImage?: string;
  paymentMethod?: PaymentType;
  role?: 'admin' | 'user';
  referrerCode?: string;
  referrer?: string;
  uplineId?: string;
  uplinePath?: string[];
  favorites?: number[]; // Product IDs
}

export interface Address {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  isDefault: boolean;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  description: string;
}

export interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface CreditCardInfo {
  id: number;
  cardNumber: string;
  expiryDate: string;
  cardHolder: string;
  brand: 'Visa' | 'Mastercard' | 'JCB' | 'Amex';
}

export interface Notification {
  id: number;
  userId: string; 
  title: string;
  message: string;
  date: string;
  type: 'order' | 'promo' | 'system';
  read: boolean;
  relatedId?: string | number;
  relatedType?: 'order' | 'commission' | 'promo';
  relatedData?: string;
}

export interface ToastMessage {
  id: number;
  title?: string;
  message?: string;
  amount?: number;
  user?: string; // Buyer name or Promo Header
  earnerName?: string; // Account that received commission
  type: 'commission' | 'info' | 'promo' | 'success' | 'error' | 'warning';
  transactionId?: number;
  image?: string;
  description?: string;
  link?: string;
}

export type KYCStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';
export type KYCDocumentType = 'ThaiID' | 'Passport' | 'Other';
export type PaymentType = 'Wallet' | 'CreditCard' | 'PromptPay';
export type OrderStatus = 'Pending' | 'To Ship' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Return Pending' | 'Returned';

export interface OrderTimelineItem {
  status: string;
  date: string;
  completed: boolean;
}

export interface Order {
  id: string;
  userId: string; 
  date: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: Address; 
  trackingNumber?: string;
  shippingProvider?: string;
  timeline: OrderTimelineItem[];
  returnReason?: string;
  reviewedProductIds?: number[];
}

export type Language = 'en' | 'th' | 'mm';
export type FontSize = 'small' | 'medium' | 'large';

export interface AppContextType {
  user: User | null;
  isLoggedIn: boolean;
  cart: CartItem[];
  products: Product[];
  feed: FeedItem[];
  ads: Ad[];
  campaignAssets: CampaignAsset[];
  onboardingSlides: OnboardingSlide[];
  team: TeamMember[];
  referrer: Referrer | null;
  commissions: CommissionTransaction[];
  orders: Order[];
  addresses: Address[];
  selectedAddressId: number | null;
  paymentMethod: PaymentType;
  appliedCoupon: Coupon | null;
  notifications: Notification[];
  activePromo: Promotion | null;
  systemSettings: SystemSettings;
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;
  liveSales: { id: string, name: string, amount: number, time: string }[];
  
  // Level Up Celebration
  pendingLevelUp: LevelUpInfo | null;
  dismissLevelUp: () => void;

  // Security State
  isSecurityUnlocked: boolean;
  setIsSecurityUnlocked: (unlocked: boolean) => void;

  // Notification State
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  // Floating Notification
  currentToast: ToastMessage | null;
  showToast: (msg: Omit<ToastMessage, 'id'>) => void;
  bottomNavHidden: boolean;
  setBottomNavHidden: (hidden: boolean) => void;
  dismissToast: () => void;
  
  // Admin Data Extensions
  allOrders: Order[];
  allTeamMembers: TeamMember[];
  allCommissions: CommissionTransaction[];

  // Personal Info & Security
  bankAccounts: BankAccount[];
  selectedBankId: number | null;
  savedCards: CreditCardInfo[];
  selectedCardId: number | null;
  kycStatus: KYCStatus;

  // Language & Font
  language: Language;
  setLanguage: (lang: Language) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  t: (key: string) => string;
  
  login: (email?: string, password?: string, isRegister?: boolean) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartQuantity: (productId: number, delta: number) => void;
  checkout: () => void;
  calculateCommission: (price: number) => number;
  getNextTierTarget: () => number;
  getCommissionRate: () => number;
  
  // New Methods
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: number, address: Partial<Address>) => Promise<void>;
  removeAddress: (id: number) => Promise<void>;
  selectAddress: (id: number) => Promise<void>;
  setPaymentMethod: (method: PaymentType) => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  getCartTotals: () => { 
    subtotal: number; 
    discount: number; 
    memberDiscount: number; 
    couponDiscount: number;
    vat: number; 
    total: number 
  };

  // Personal Info Methods
  addBankAccount: (account: Omit<BankAccount, 'id'>) => Promise<boolean>;
  removeBankAccount: (id: number) => Promise<void>;
  selectBank: (id: number) => Promise<void>;
  
  // Credit Card Methods
  addCreditCard: (card: Omit<CreditCardInfo, 'id' | 'brand'>) => Promise<void>;
  removeCreditCard: (id: number) => Promise<void>;
  selectCreditCard: (id: number) => Promise<void>;

  updateKycStatus: (status: KYCStatus) => Promise<void>;
  updateUserKycStatus: (userId: string, status: KYCStatus) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  withdrawFunds: (amount: number, bankId: number) => Promise<CommissionTransaction | null>;
  markNotificationAsRead: (id: number) => Promise<void>;

  // Feed Methods
  toggleFeedLike: (id: number) => Promise<void>;
  addFeedComment: (id: number, text: string) => Promise<void>;
  createPost: (data: { image: string, type: 'image' | 'video', caption: string, mood: string, isAd: boolean, productId?: number }) => Promise<void>;
  
  // Real Functionality
  addReview: (productId: number, orderId: string, rating: number, text: string, images: string[]) => Promise<void>;
  updateUserSocials: (platform: 'facebook' | 'line' | 'google', connected: boolean, name: string) => Promise<void>;
  updateUserSecurity: (type: 'password' | 'pin', value: string) => Promise<void>;
  addReferrer: (code: string) => Promise<{ success: boolean; error?: string }>;
  updateOrderAddress: (orderId: string, address: Address) => Promise<void>;

  // Admin Methods
  updateProduct: (productId: number, data: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateAd: (adId: number, data: Partial<Ad>) => Promise<void>;
  deleteAd: (adId: number) => Promise<void>;
  addAd: (ad: Omit<Ad, 'id'>) => Promise<void>;
  updateCampaignAsset: (assetId: number, data: Partial<CampaignAsset>) => Promise<void>;
  deleteCampaignAsset: (assetId: number) => Promise<void>;
  addCampaignAsset: (asset: Omit<CampaignAsset, 'id'>) => Promise<void>;
  updateOnboardingSlide: (slideId: number, data: Partial<OnboardingSlide>) => Promise<void>;
  deleteOnboardingSlide: (slideId: number) => Promise<void>;
  addOnboardingSlide: (slide: Omit<OnboardingSlide, 'id'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  updateCommissionStatus: (txId: number, status: CommissionTransaction['status']) => Promise<void>;
  deleteCommission: (txId: number) => Promise<void>;
  deleteTeamMember: (memberId: string | number) => Promise<void>;
  updateMemberTier: (memberId: string | number, tier: UserTier) => Promise<void>;
  updateFeedStatus: (postId: number, status: 'Approved' | 'Pending') => Promise<void>;
  deleteFeedPost: (postId: number) => Promise<void>;
  updateFeedPost: (postId: number, data: Partial<FeedItem>) => Promise<void>;
  broadcastPromotion: (promo: Omit<Promotion, 'id' | 'active'>) => void;
  dismissPromotion: () => void;
  updateSystemSettings: (data: Partial<SystemSettings>) => Promise<void>;
  updateUserReferralCode: (userId: string, newCode: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: 'admin' | 'user') => Promise<void>;
  updateUserAdminProfile: (userId: string, data: Partial<User>) => Promise<void>;
  factoryReset: () => Promise<void>;
  healReferralCodes: () => Promise<void>;
  healTeamSizes: () => Promise<void>;
  healUplinePaths: () => Promise<void>;
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
}