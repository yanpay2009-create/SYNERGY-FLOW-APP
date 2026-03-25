import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ShieldCheck, Clock, CheckCircle, X, Camera, Lock, Sparkles, RefreshCw, Check, Zap, CreditCard, Globe, FileText, Briefcase, Plus, Image as ImageIcon, Smartphone, Loader2, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type DocType = 'ID' | 'Passport';
type KycStep = 'select' | 'camera' | 'form' | 'status';

export const KYC: React.FC = () => {
  const { user, kycStatus, updateKycStatus, updateUserSecurity, updateUserProfile, isSecurityUnlocked, setIsSecurityUnlocked, showToast } = useApp();
  const navigate = useNavigate();
  
  // PIN Gate States
  const [internalUnlocked, setInternalUnlocked] = useState(isSecurityUnlocked);
  const [flow, setFlow] = useState<'verify' | 'setup' | 'confirm' | 'recovery'>('verify');
  const [pin, setPin] = useState('');
  const [tempPin, setTempPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // KYC Workflow States
  const [kycStep, setKycStep] = useState<KycStep>('select');
  const [docType, setDocType] = useState<DocType>('ID');
  const [hasWorkPermit, setHasWorkPermit] = useState(false);
  const [workPermitImage, setWorkPermitImage] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    docNumber: '',
    expiryDate: '',
    nationality: 'Thai',
    workPermitNumber: ''
  });

  // Camera States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workPermitInputRef = useRef<HTMLInputElement>(null);

  // Security Gate Logic
  useEffect(() => {
    if (!user) {
        navigate('/account');
        return;
    }
    if (!user.pin) {
        setFlow('setup');
    } else {
        setFlow('verify');
    }
  }, [user, navigate]);

  // Sync kycStep with kycStatus
  useEffect(() => {
    if (kycStatus !== 'Unverified') {
        setKycStep('status');
    }
  }, [kycStatus]);

  // CAMERA FIX: Ensure video element is connected to stream after it mounts
  useEffect(() => {
    let isMounted = true;
    if (kycStep === 'camera' && stream && videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        
        const playVideo = async () => {
            if (!video.isConnected) return;
            try {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    await playPromise;
                }
            } catch (e) {
                // Ignore AbortError and interruptions when media is removed or playback is stopped
                if (isMounted && e instanceof Error && 
                    e.name !== 'AbortError' && 
                    !e.message.includes('interrupted') &&
                    !e.message.includes('removed')) {
                    console.error("Video play failed", e);
                }
            }
        };
        playVideo();
    }
    return () => { isMounted = false; };
  }, [kycStep, stream]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [stream]);

  const handlePinChange = (value: string) => {
    if (value.length > 6) return;
    setPin(value);
    setPinError(false);
    
    if (value.length === 6) {
      if (flow === 'verify') {
          if (value === user?.pin) {
            setIsSecurityUnlocked(true);
            setInternalUnlocked(true);
          } else {
            setPinError(true);
            setTimeout(() => { setPin(''); setPinError(false); }, 500);
          }
      } else if (flow === 'setup') {
          setTempPin(value);
          setTimeout(() => {
              setPin('');
              setFlow('confirm');
          }, 300);
      } else if (flow === 'confirm') {
          if (value === tempPin) {
              updateUserSecurity('pin', value);
              setIsSecurityUnlocked(true);
              setInternalUnlocked(true);
          } else {
              setPinError(true);
              setTimeout(() => {
                  setPin('');
                  setTempPin('');
                  setFlow('setup');
                  setPinError(false);
              }, 500);
          }
      }
    }
  };

  const handleForgotPin = () => {
    setFlow('recovery');
    setRecoveryOtp('');
    setPin('');
  };

  const handleVerifyRecoveryOtp = (value: string) => {
    const val = value.replace(/[^0-9]/g, '').slice(0, 6);
    setRecoveryOtp(val);
    if (val.length === 6) {
        setIsVerifyingOtp(true);
        setTimeout(() => {
            setIsVerifyingOtp(false);
            setFlow('setup');
        }, 1500);
    }
  };

  const startCamera = async () => {
    try {
        const constraints = { 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }, 
            audio: false 
        };
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        setKycStep('camera');
    } catch (err) {
        console.error("Camera access denied:", err);
        showToast({ message: "Please enable camera access in your browser settings to continue.", type: 'error' });
    }
  };

  const stopCamera = () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }
    setKycStep('select');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 150);

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (context) {
            setIsProcessing(true);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            setTimeout(() => {
                setCapturedImage(dataUrl);
                // Don't stop stream immediately to prevent flickering during transition
                setIsProcessing(false);
                setKycStep('form');
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                }
            }, 500);
        }
    }
  };

  const handleWorkPermitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setWorkPermitImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmitFinal = (e: React.FormEvent) => {
    e.preventDefault();
    if (docType === 'Passport' && hasWorkPermit && (!formData.workPermitNumber || !workPermitImage)) {
        showToast({ message: "Please provide your Work Permit number and upload a photo.", type: 'error' });
        return;
    }

    // Save document type and work permit status to user profile
    updateUserProfile({
        kycDocumentType: docType === 'ID' ? 'ThaiID' : 'Passport',
        kycFullName: formData.fullName,
        hasWorkPermit: hasWorkPermit,
        idCardImage: capturedImage
    });

    updateKycStatus('Pending');
    setKycStep('status');
  };

  const getPinTitle = () => {
      if (flow === 'recovery') return "Recover Security PIN";
      if (flow === 'setup') return "Set New PIN";
      if (flow === 'confirm') return "Confirm New PIN";
      return "Enter Security PIN";
  };

  if (!user) return null;

  if (!internalUnlocked) {
    return (
      <div className="fixed inset-0 z-[60] bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6 max-w-md mx-auto left-0 right-0 transition-colors duration-300">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-6 relative transition-all duration-500 ${flow === 'recovery' ? 'bg-amber-50 text-amber-500' : 'bg-white dark:bg-gray-800 text-synergy-blue'}`}>
          {flow === 'recovery' ? <Smartphone size={32} /> : (flow === 'verify' ? <Lock size={32} /> : <Sparkles size={32} />)}
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">{getPinTitle()}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center max-w-[280px]">
            {flow === 'recovery' ? "We've sent a 6-digit code to your registered mobile number." : (flow === 'setup' ? "Create a new 6-digit PIN to secure your documents." : "Verification required to access identity documents.")}
        </p>
        
        {flow === 'recovery' ? (
            <div className="w-full space-y-6 flex flex-col items-center animate-in fade-in">
                <input 
                    type="number" 
                    pattern="[0-9]*" 
                    inputMode="numeric"
                    autoFocus
                    placeholder="000000"
                    className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-3xl py-5 text-center text-4xl font-black text-synergy-blue tracking-[0.3em] outline-none focus:ring-2 focus:ring-synergy-blue/10"
                    value={recoveryOtp}
                    onChange={(e) => handleVerifyRecoveryOtp(e.target.value)}
                    disabled={isVerifyingOtp}
                />
                {isVerifyingOtp && (
                    <div className="flex items-center space-x-2 text-synergy-blue animate-pulse">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-xs font-black uppercase tracking-widest">Verifying Code...</span>
                    </div>
                )}
            </div>
        ) : (
            <>
                <div className="flex space-x-4 mb-8 relative pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-synergy-blue scale-110 shadow-glow' : 'bg-gray-200 dark:bg-gray-700'} ${pinError ? 'bg-red-50 animate-shake' : ''}`}
                    />
                  ))}
                </div>

                <input 
                    type="number" 
                    pattern="[0-9]*" 
                    inputMode="numeric"
                    autoFocus
                    className="opacity-0 absolute inset-0 h-full w-full cursor-pointer z-10"
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value)}
                />

                {flow === 'verify' && (
                  <button 
                    onClick={handleForgotPin}
                    className="mb-8 flex items-center space-x-2 text-[10px] font-black text-synergy-blue uppercase tracking-widest hover:underline transition"
                  >
                    <RefreshCw size={12} />
                    <span>Forgot Security PIN?</span>
                  </button>
                )}
            </>
        )}
        
        <button 
             onClick={() => navigate(-1)} 
             className="mt-8 text-gray-400 dark:text-gray-500 text-sm font-bold uppercase tracking-widest relative z-20 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
             Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-12 px-4 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      <div className="flex items-center mb-6">
        <button 
            onClick={() => {
                if (kycStep === 'camera') {
                    stopCamera();
                } else if (kycStep === 'form') {
                    setKycStep('select');
                } else {
                    navigate(-1);
                }
            }} 
            className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Identity Verification</h1>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-soft dark:shadow-none border border-transparent dark:border-gray-700 animate-in fade-in zoom-in-95 duration-300 min-h-[400px] flex flex-col">
         
         {kycStep === 'select' && (
             <div className="space-y-6 animate-in slide-in-from-bottom-2">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-synergy-blue rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={32} />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Select Document Type</h2>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Please select the document you wish to use for identity verification.</p>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={() => { setDocType('ID'); startCamera(); }}
                        className="w-full p-5 rounded-2xl border-2 border-gray-50 dark:border-gray-700 flex items-center justify-between hover:border-synergy-blue group transition-all bg-gray-50/30 dark:bg-gray-900/30"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-synergy-blue shadow-sm">
                                <CreditCard size={28} />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-gray-800 dark:text-white uppercase text-sm">ID Card</p>
                            </div>
                        </div>
                        <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-gray-300 group-hover:text-synergy-blue transition">
                            <ArrowLeft size={16} className="rotate-180" />
                        </div>
                    </button>

                    <button 
                        onClick={() => { setDocType('Passport'); startCamera(); }}
                        className="w-full p-5 rounded-2xl border-2 border-gray-50 dark:border-gray-700 flex items-center justify-between hover:border-synergy-blue group transition-all bg-gray-50/30 dark:bg-gray-900/30"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-synergy-blue shadow-sm">
                                <Globe size={28} />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-gray-800 dark:text-white uppercase text-sm">Passport</p>
                            </div>
                        </div>
                        <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm text-gray-300 group-hover:text-synergy-blue transition">
                            <ArrowLeft size={16} className="rotate-180" />
                        </div>
                    </button>
                </div>
             </div>
         )}

         {kycStep === 'camera' && (
             <div className="space-y-6 animate-in fade-in flex-1 flex flex-col">
                <div className="relative aspect-[4/3] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-100 dark:border-gray-700">
                    <video 
                        ref={videoRef} 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover" 
                    />
                    
                    {showFlash && <div className="absolute inset-0 bg-white z-[100] animate-pulse"></div>}
                    
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-[85%] h-[65%] border-2 border-synergy-blue/30 rounded-2xl relative`}>
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-synergy-blue rounded-tl-xl shadow-[0_0_15px_rgba(0,181,255,0.4)]"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-synergy-blue rounded-tr-xl shadow-[0_0_15px_rgba(0,181,255,0.4)]"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-synergy-blue rounded-bl-xl shadow-[0_0_15px_rgba(0,181,255,0.4)]"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-synergy-blue rounded-br-xl shadow-[0_0_15px_rgba(0,181,255,0.4)]"></div>
                            
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-synergy-blue to-transparent animate-[scan_2s_linear_infinite] shadow-[0_0_10px_rgba(0,181,255,0.8)] opacity-70"></div>
                        </div>
                    </div>
                    
                    {isProcessing && (
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300 z-50">
                            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-2xl flex items-center space-x-3">
                                <Loader2 size={24} className="text-synergy-blue animate-spin" />
                                <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Processing...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center space-y-5 flex-1 justify-center">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">AI Recognition Active</p>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mt-1">Place your {docType === 'ID' ? 'ID Card' : 'Passport'} within the blue frame</p>
                    </div>

                    <div className="flex items-center justify-center space-x-8 w-full">
                        <button 
                            onClick={stopCamera}
                            className="p-4 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-full active:scale-90 transition hover:bg-red-50 hover:text-red-500"
                        >
                            <X size={24} />
                        </button>
                        
                        <button 
                            onClick={capturePhoto}
                            disabled={isProcessing}
                            className="w-20 h-20 bg-white dark:bg-gray-700 border-8 border-synergy-blue/10 rounded-full p-1 shadow-2xl active:scale-90 transition group relative overflow-hidden"
                        >
                            <div className="w-full h-full bg-synergy-blue rounded-full group-hover:bg-synergy-dark transition flex items-center justify-center text-white">
                                <Camera size={28} />
                            </div>
                        </button>

                        <div className="w-14 h-14 invisible"></div> 
                    </div>
                </div>
             </div>
         )}

         {kycStep === 'form' && (
             <form onSubmit={handleSubmitFinal} className="space-y-6 animate-in slide-in-from-right-4">
                <div className="text-center mb-4">
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Check size={28} strokeWidth={3} />
                    </div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase">Capture Successful</h2>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Review and confirm your document details</p>
                </div>

                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden mb-6 shadow-md border border-gray-100 dark:border-gray-700">
                    <img src={capturedImage || undefined} className="w-full h-full object-cover" alt="Captured Doc" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute top-2 right-2">
                        <button 
                            type="button" 
                            onClick={() => { setCapturedImage(null); startCamera(); }} 
                            className="bg-black/60 backdrop-blur-md text-white p-2.5 rounded-xl active:scale-90 transition shadow-lg flex items-center space-x-2"
                        >
                            <RefreshCw size={14} />
                            <span className="text-[10px] font-black uppercase">Retake</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name (As per document)</label>
                        <input 
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-3.5 text-xs focus:ring-2 focus:ring-synergy-blue/10 outline-none dark:text-white font-black"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Document Number ({docType === 'ID' ? 'ID Number' : 'Passport Number'})</label>
                        <input 
                            value={formData.docNumber}
                            onChange={(e) => setFormData({...formData, docNumber: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-3.5 text-xs focus:ring-2 focus:ring-synergy-blue/10 outline-none dark:text-white font-black"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiry Date</label>
                            <input 
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-3.5 text-[10px] focus:ring-2 focus:ring-synergy-blue/10 outline-none dark:text-white font-black"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nationality</label>
                            <input 
                                value={formData.nationality}
                                onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-3.5 text-xs focus:ring-2 focus:ring-synergy-blue/10 outline-none dark:text-white font-black"
                            />
                        </div>
                    </div>
                </div>

                {docType === 'Passport' && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4 animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                              <Briefcase size={16} className="text-synergy-blue" />
                              <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Work Permit (Optional)</span>
                          </div>
                          <button 
                              type="button"
                              onClick={() => setHasWorkPermit(!hasWorkPermit)}
                              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${hasWorkPermit ? 'bg-synergy-blue' : 'bg-gray-200 dark:bg-gray-700'}`}
                          >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${hasWorkPermit ? 'translate-x-7' : 'translate-x-1'}`}></div>
                          </button>
                      </div>

                      {hasWorkPermit && (
                          <div className="space-y-4 animate-in fade-in">
                              <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Work Permit Number</label>
                                  <input 
                                      value={formData.workPermitNumber}
                                      onChange={(e) => setFormData({...formData, workPermitNumber: e.target.value})}
                                      className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 text-xs focus:ring-2 focus:ring-synergy-blue/10 outline-none dark:text-white font-black"
                                  />
                              </div>
                              <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Work Permit Photo</label>
                                  {!workPermitImage ? (
                                      <button 
                                          type="button"
                                          onClick={() => workPermitInputRef.current?.click()}
                                          className="w-full py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 flex flex-col items-center space-y-1 hover:bg-white dark:hover:bg-gray-800 transition"
                                      >
                                          <Plus size={20} />
                                          <span className="text-[10px] font-black uppercase tracking-widest">Attach Photo</span>
                                          <input type="file" ref={workPermitInputRef} className="hidden" accept="image/*" onChange={handleWorkPermitUpload} />
                                      </button>
                                  ) : (
                                      <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                          <img src={workPermitImage || undefined} className="w-full h-full object-cover" alt="Work Permit" />
                                          <button 
                                              type="button" 
                                              onClick={() => setWorkPermitImage(null)}
                                              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg active:scale-90 transition shadow-lg"
                                          >
                                              <X size={14} />
                                          </button>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
                )}

                <button 
                    type="submit"
                    className="w-full bg-synergy-blue text-white font-black py-4 rounded-2xl shadow-glow active:scale-[0.98] transition uppercase tracking-[0.2em] text-xs h-14"
                >
                    <span>Confirm & Submit</span>
                </button>
             </form>
         )}

         {kycStep === 'status' && (
             <div className="animate-in fade-in duration-500">
                {kycStatus === 'Pending' && (
                    <div className="text-center py-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Clock size={40} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Verification in Progress</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed max-w-[240px]">
                            Our security team is reviewing your documents. This process usually takes 2-24 hours.
                        </p>
                        <div className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 text-left">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Queue ID</p>
                            <p className="text-xs font-mono font-bold text-gray-900 dark:text-white uppercase tracking-tighter">KYC_REQ_{user?.email?.split('@')[0]?.toUpperCase() || 'USER'}</p>
                        </div>
                        {(user?.role === 'admin' || 
                          user?.email?.toLowerCase() === "synergyflow.my@gmail.com" || 
                          user?.email?.toLowerCase() === "yanpay2009@gmail.com" ||
                          user?.uid === "ugTOls4K6EgKG13hBiAXHaYC2bj2" ||
                          user?.uid === "mqZUUW73sCYe1bJTowBqF1HI2O02") && (
                            <button onClick={() => updateKycStatus('Verified')} className="mt-8 text-[9px] text-gray-300 dark:text-gray-700 font-bold uppercase tracking-widest hover:underline transition">
                                (Administrative Override: Force Verify)
                            </button>
                        )}
                    </div>
                )}

                {kycStatus === 'Verified' && (
                    <div className="text-center py-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-glow shadow-emerald-500/10">
                            <CheckCircle size={40} strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-2 tracking-tight">Verification Successful</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed max-w-[260px]">
                            Your account has been fully verified. You can now withdraw funds instantly.
                        </p>
                        <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20">
                            Trust Level: Alpha
                        </div>
                    </div>
                )}
             </div>
         )}
      </div>

      <style>{`
        @keyframes scan {
            0% { transform: translateY(0); }
            50% { transform: translateY(220px); }
            100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};