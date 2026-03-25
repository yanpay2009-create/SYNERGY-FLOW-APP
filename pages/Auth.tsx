import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, ArrowRight, Gift, X, User, Phone, ShieldCheck, Smartphone, Eye, EyeOff, Check, FileText, Circle, KeyRound, RefreshCw, Loader2, Sparkles, AlertCircle } from 'lucide-react';

type AuthStep = 'form' | 'otp';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>('form');
  const { login, register, addReferrer, systemSettings, t, updateUserSecurity, language, showToast, isLoggingIn } = useApp();
  const navigate = useNavigate();
  
  // Form State
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Modal States
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetFlow, setIsResetFlow] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Password Validation Logic: At least 6 chars, 1 English lowercase, 1 number
  const validatePassword = (pass: string) => {
    const hasLowercase = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasMinLength = pass.length >= 6;
    return hasLowercase && hasNumber && hasMinLength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
        // Simple login logic
        const success = await login(emailOrPhone, password);
        if (success) {
          navigate('/home');
        }
    } else {
        // Validation for Sign Up
        if (password !== confirmPassword) {
            showToast({ message: "Passwords do not match.", type: "error" });
            return;
        }
        if (!validatePassword(password)) {
            showToast({ message: "Password must be at least 6 characters long and contain at least one English lowercase letter (a-z) and one number (0-9).", type: "error" });
            return;
        }
        if (!agreedToTerms) {
            showToast({ message: "Please agree to the Terms & Conditions.", type: "error" });
            return;
        }
        setIsResetFlow(false);
        setAuthStep('otp');
    }
  };

  const handleForgotPassword = () => {
      if (!emailOrPhone) {
          showToast({ message: "Please enter your email or phone number first.", type: "error" });
          return;
      }
      setIsResetFlow(true);
      setAuthStep('otp');
  };

  const handleOtpInput = (val: string) => {
      const value = val.replace(/[^0-9]/g, '').slice(0, 6);
      setOtp(value);
      
      if (value.length === 6) {
          executeOtpVerification(value);
      }
  };

  const executeOtpVerification = async (code: string) => {
      setIsVerifying(true);
      // Simulate API Verification
      setTimeout(async () => {
          setIsVerifying(false);
          if (isResetFlow) {
              setAuthStep('form');
              setShowResetModal(true);
          } else {
              // SUCCESS: Register and GO TO HOME IMMEDIATELY
              await register(emailOrPhone, password, username);
              navigate('/home');
          }
          setOtp('');
      }, 1500);
  };

  const handleResetPassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (!validatePassword(newPassword)) {
          showToast({ message: "Password must be at least 6 characters, including a lowercase letter and a number.", type: "error" });
          return;
      }
      updateUserSecurity('password', newPassword);
      showToast({ message: "Password has been reset successfully! Please sign in.", type: "success" });
      setShowResetModal(false);
      setIsLogin(true);
  };

  const handleToggleTerms = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!agreedToTerms) {
          setShowTermsModal(true);
      } else {
          setAgreedToTerms(false);
      }
  };

  const acceptTerms = () => {
      setAgreedToTerms(true);
      setShowTermsModal(false);
  };

  if (authStep === 'otp') {
      return (
          <div className="w-full bg-white dark:bg-gray-900 pt-16 px-8 pb-10 rounded-[40px] shadow-2xl relative animate-in fade-in duration-500">
              <button 
                onClick={() => setAuthStep('form')}
                className="absolute top-6 left-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition active:scale-90 w-fit"
              >
                  <ArrowLeft size={28} />
              </button>

              <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-synergy-blue rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                      <Smartphone size={28} />
                  </div>

                  <div className="text-center mb-6">
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-1">Security Verification</h2>
                      <p className="text-[13px] text-gray-400 font-medium leading-relaxed max-w-[260px] mx-auto">
                          {isResetFlow 
                            ? "Verify your identity to reset your account password." 
                            : "Enter the 6-digit code sent to your device to finalize your account."}
                      </p>
                  </div>
              </div>

              <div className="w-full relative mb-6">
                  <div className="flex justify-between gap-2">
                      {[...Array(6)].map((_, i) => (
                          <div 
                            key={i}
                            className={`flex-1 aspect-[2/2.8] rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all duration-300 ${i < otp.length ? 'border-synergy-blue bg-blue-50/50 dark:bg-blue-900/10 text-synergy-blue' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-300'}`}
                          >
                              {otp[i] || ''}
                              {i === otp.length && !isVerifying && <div className="w-0.5 h-6 bg-synergy-blue animate-pulse"></div>}
                          </div>
                      ))}
                  </div>
                  <input 
                    type="number"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    autoFocus
                    value={otp}
                    onChange={(e) => handleOtpInput(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-default"
                    disabled={isVerifying}
                  />
              </div>

              {isVerifying ? (
                  <div className="flex flex-col items-center space-y-3 animate-in zoom-in duration-300">
                      <Loader2 size={32} className="text-synergy-blue animate-spin" />
                      <p className="text-[10px] font-black text-synergy-blue uppercase tracking-[0.2em]">Verifying Identity...</p>
                  </div>
              ) : (
                  <div className="text-center">
                      <p className="text-[11px] text-gray-400 font-bold mb-4 uppercase tracking-widest">Didn't receive the code?</p>
                      <button className="text-xs font-black text-synergy-blue hover:underline uppercase tracking-widest px-8 py-2.5 rounded-full bg-blue-50/50 dark:bg-blue-900/20 transition active:scale-95">
                          Resend Code (59s)
                      </button>
                  </div>
              )}
          </div>
      );
  }

  return (
    <div className="w-full animate-in fade-in zoom-in duration-300">
      <div className="bg-white dark:bg-gray-900 pt-10 px-8 pb-20 rounded-[40px] shadow-2xl relative z-10 border border-white/50 dark:border-gray-800 transition-all">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-transparent mx-auto mb-3 flex items-center justify-center">
            {systemSettings.logo ? (
                <img src={systemSettings.logo || undefined} className="w-full h-full object-contain" alt="App Logo" />
            ) : (
                <span className="text-5xl font-black bg-gradient-to-tr from-synergy-blue to-purple-600 bg-clip-text text-transparent italic tracking-tighter">S</span>
            )}
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{isLogin ? t('auth.welcome') : t('auth.join')}</h2>
          <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Synergy Flow Network</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1 mt-1">
          {!isLogin && (
            <div className="space-y-0.5 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-300" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl py-3 pl-12 pr-4 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-synergy-blue/20 transition text-sm font-medium"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-0.5">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('auth.email_phone')}</label>
            <div className="relative">
              {emailOrPhone.match(/^[0-9]+$/) ? <Smartphone className="absolute left-4 top-3.5 text-gray-300" size={18} /> : <Mail className="absolute left-4 top-3.5 text-gray-300" size={18} />}
              <input 
                type="text" 
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder={t('auth.email_phone')}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl py-3 pl-12 pr-4 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-synergy-blue/20 transition text-sm font-medium"
                required
              />
            </div>
          </div>
          
          <div className="space-y-0.5">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('auth.pass')}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-300" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl py-3 pl-12 pr-12 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-synergy-blue/20 transition text-sm font-medium"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-synergy-blue transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-0.5 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-3.5 text-gray-300" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl py-3 pl-12 pr-12 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-synergy-blue/20 transition text-sm font-medium"
                  required={!isLogin}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-synergy-blue transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex items-start space-x-1.5 mt-1 px-1 text-gray-400 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={10} className="mt-0.5 shrink-0" />
                <p className="text-[9px] font-bold uppercase tracking-tight leading-tight">
                  Min 6 characters (At least 1 lowercase letter & 1 number)
                </p>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button 
              disabled={isLoggingIn}
              className="w-full bg-synergy-blue text-white font-black py-4 rounded-2xl shadow-glow active:scale-[0.98] transition uppercase tracking-[0.2em] text-xs flex items-center justify-center space-x-2 disabled:opacity-70 disabled:shadow-none"
            >
              {isLoggingIn ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? t('auth.signin') : t('auth.signup')}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-2">
          <div className="relative flex items-center justify-center mb-4">
            <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Or continue with</span>
            <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
          </div>

          <button 
            type="button"
            onClick={() => login(undefined, undefined, !isLogin)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-white font-black py-3.5 rounded-2xl shadow-sm active:scale-[0.98] transition uppercase tracking-[0.2em] text-[10px] flex items-center justify-center space-x-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            <span>Google Account</span>
          </button>
        </div>

        <div className="mt-2 flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center space-x-2.5 group">
                {!isLogin && (
                    <button 
                        type="button"
                        onClick={handleToggleTerms}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${agreedToTerms ? 'bg-synergy-blue border-synergy-blue text-white shadow-sm scale-110' : 'bg-transparent border-gray-300 dark:border-gray-700 hover:border-synergy-blue'}`}
                    >
                        {agreedToTerms && <Check size={10} strokeWidth={4} />}
                    </button>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {isLogin ? "New to Synergy?" : "Already a member?"}{" "}
                  <button 
                    type="button"
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setAgreedToTerms(false);
                    }} 
                    className="text-synergy-blue font-black hover:underline ml-1"
                  >
                    {isLogin ? t('auth.signup') : t('auth.signin')}
                  </button>
                </p>
            </div>
            
            {isLogin && (
                <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-synergy-blue transition flex items-center space-x-1"
                >
                    <RefreshCw size={10} />
                    <span>Forgot Password?</span>
                </button>
            )}
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[80vh] border border-white/20">
                  <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center space-x-2 text-synergy-blue">
                          <FileText size={20} />
                          <h3 className="font-black text-xs uppercase tracking-[0.2em]">Affiliate Agreement</h3>
                      </div>
                      <button onClick={() => setShowTermsModal(false)} className="text-gray-300 hover:text-gray-500 transition"><X size={22} /></button>
                  </div>
                  <div className="p-6 overflow-y-auto no-scrollbar flex-1 bg-white dark:bg-gray-900">
                      <div className="space-y-6">
                          <div>
                              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center"><ShieldCheck size={14} className="mr-2 text-emerald-500" /> 1. Operational Security</h4>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                  Your account is protected by encryption. Commission tracking is automated via our proprietary Synergy Flow engine to ensure 100% accuracy on every direct and team referral.
                              </p>
                          </div>
                          <div>
                              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center"><Check size={14} className="mr-2 text-synergy-blue" /> 2. Payout Verification</h4>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                  Withdrawals are only enabled for KYC-verified members. The system automatically audits all sales before releasing funds.
                              </p>
                          </div>
                          <div>
                              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center"><User size={14} className="mr-2 text-purple-500" /> 3. Data Integrity</h4>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                  We never share your personal or banking data. All information is used strictly for payout processing and tax compliance.
                              </p>
                          </div>
                      </div>
                  </div>
                  <div className="p-6 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-50 dark:border-gray-800">
                      <button 
                        onClick={acceptTerms}
                        className="w-full h-14 bg-synergy-blue text-white font-black rounded-2xl shadow-glow active:scale-[0.98] transition uppercase tracking-[0.2em] text-xs"
                      >
                          Accept & Continue
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 p-8 rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <KeyRound size={28} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Reset Password</h3>
                    <p className="text-gray-400 text-[11px] mb-6 uppercase font-bold tracking-widest">Set a new strong password.</p>
                </div>
                
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-300" size={18} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl py-3.5 pl-12 pr-12 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-synergy-blue/20 transition text-sm font-medium"
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-gray-400 hover:text-synergy-blue transition"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"
                    >
                        Save & Sign In
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};