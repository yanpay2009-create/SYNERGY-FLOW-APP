import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Onboarding } from './pages/Onboarding';
import { Auth } from './pages/Auth';
import { Home } from './pages/Home';
import { Cart } from './pages/Cart';
import { Feed } from './pages/Feed';
import { Account } from './pages/Account';
import { AffiliateLinks } from './pages/AffiliateLinks';
import { MyTeam } from './pages/MyTeam';
import { CommissionHistory } from './pages/CommissionHistory';
import { AddressBook } from './pages/AddressBook';
import { PaymentSelection } from './pages/PaymentSelection';
import { Preferences } from './pages/Preferences';
import { PersonalInfo } from './pages/PersonalInfo';
import { EditProfile } from './pages/EditProfile';
import { KYC } from './pages/KYC';
import { BankAccounts } from './pages/BankAccounts';
import { HelpSupport } from './pages/HelpSupport';
import { AboutUs } from './pages/AboutUs';
import { Withdraw } from './pages/Withdraw';
import { TierBenefits } from './pages/TierBenefits';
import { ReferrerInfo } from './pages/ReferrerInfo';
import { TierData } from './pages/TierData';
import { Notifications } from './pages/Notifications';
import { MyOrders } from './pages/MyOrders';
import { CreateContent } from './pages/CreateContent';
import { SocialAccounts } from './pages/SocialAccounts';
import { ChangePassword } from './pages/ChangePassword';
import { ChangePin } from './pages/ChangePin';
import { LanguageSelection } from './pages/LanguageSelection';
import { WriteReview } from './pages/WriteReview';
import { ProductDetail } from './pages/ProductDetail';
import { ProductReviews } from './pages/ProductReviews';
import { FeaturedProducts } from './pages/FeaturedProducts';
import { Promotions } from './pages/Promotions';
import { Campaigns } from './pages/Campaigns';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminProductManage } from './pages/AdminProductManage';
import { AdminAdManage } from './pages/AdminAdManage';
import { AdminOnboardingManage } from './pages/AdminOnboardingManage';
import { AdminCampaignAssetManage } from './pages/AdminCampaignAssetManage';
import { ReferralHandler } from './pages/ReferralHandler';
import { BottomNav } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PromoPopup } from './components/PromoPopup';
import { FloatingToast } from './components/FloatingToast';
import { LevelUpPopup } from './components/LevelUpPopup';

import { ErrorBoundary } from './src/components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <HashRouter>
          <div className="font-sans text-gray-900 bg-gray-100 dark:bg-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300">
            <Routes>
              <Route path="/" element={<Onboarding />} />
              <Route path="/login" element={<Navigate to="/account" replace />} />
              
              {/* Public Routes */}
              <Route path="/home" element={<Home />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/account" element={<Account />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/product/:id/reviews" element={<ProductReviews />} />
              <Route path="/featured-products" element={<FeaturedProducts />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/ref/:code" element={<ReferralHandler />} />
              
              {/* Protected Routes */}
              <Route path="/affiliate-links" element={<ProtectedRoute><AffiliateLinks /></ProtectedRoute>} />
              <Route path="/my-team" element={<ProtectedRoute><MyTeam /></ProtectedRoute>} />
              <Route path="/commissions" element={<ProtectedRoute><CommissionHistory /></ProtectedRoute>} />
              <Route path="/referrer-info" element={<ProtectedRoute><ReferrerInfo /></ProtectedRoute>} />
              <Route path="/tier-data/:tier" element={<ProtectedRoute><TierData /></ProtectedRoute>} />
              <Route path="/address-book" element={<ProtectedRoute><AddressBook /></ProtectedRoute>} />
              <Route path="/payment-selection" element={<ProtectedRoute><PaymentSelection /></ProtectedRoute>} />
              <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
              <Route path="/social-accounts" element={<ProtectedRoute><SocialAccounts /></ProtectedRoute>} />
              <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
              <Route path="/change-pin" element={<ProtectedRoute><ChangePin /></ProtectedRoute>} />
              <Route path="/language-selection" element={<ProtectedRoute><LanguageSelection /></ProtectedRoute>} />
              <Route path="/personal-info" element={<ProtectedRoute><PersonalInfo /></ProtectedRoute>} />
              <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
              <Route path="/bank-accounts" element={<ProtectedRoute><BankAccounts /></ProtectedRoute>} />
              <Route path="/help-support" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
              <Route path="/about-us" element={<ProtectedRoute><AboutUs /></ProtectedRoute>} />
              <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
              <Route path="/tier-benefits" element={<ProtectedRoute><TierBenefits /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
              <Route path="/write-review/:orderId/:productId" element={<ProtectedRoute><WriteReview /></ProtectedRoute>} />
              <Route path="/create-content" element={<ProtectedRoute><CreateContent /></ProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute><AdminProductManage /></ProtectedRoute>} />
              <Route path="/admin/ads" element={<ProtectedRoute><AdminAdManage /></ProtectedRoute>} />
              <Route path="/admin/onboarding" element={<ProtectedRoute><AdminOnboardingManage /></ProtectedRoute>} />
              <Route path="/admin/campaign-assets" element={<ProtectedRoute><AdminCampaignAssetManage /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <BottomNav />
            <PromoPopup />
            <FloatingToast />
            <LevelUpPopup />
          </div>
        </HashRouter>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;