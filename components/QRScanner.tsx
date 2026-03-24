import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';

interface QRScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [containerId] = useState(() => `qr-reader-${Math.random().toString(36).substr(2, 9)}`);

    const onScanRef = useRef(onScan);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        let isMounted = true;
        let html5QrCode: Html5Qrcode | null = null;

        const startScanner = async () => {
            try {
                // Ensure any previous instance is cleaned up
                if (scannerRef.current) {
                    try {
                        if (scannerRef.current.isScanning) {
                            await scannerRef.current.stop();
                        }
                        scannerRef.current.clear();
                    } catch (e) {
                        console.warn("Cleanup of previous scanner failed", e);
                    }
                }

                html5QrCode = new Html5Qrcode(containerId);
                scannerRef.current = html5QrCode;

                const config = { fps: 10, qrbox: { width: 250, height: 250 } };
                
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        if (isMounted) {
                            onScanRef.current(decodedText);
                        }
                    },
                    () => {
                        // Ignore errors during scanning
                    }
                );
                if (isMounted) setIsScanning(true);
            } catch (err) {
                if (isMounted) {
                    console.error("Failed to start scanner", err);
                    setError("Could not access camera. Please check permissions.");
                }
            }
        };

        startScanner();

        return () => {
            isMounted = false;
            const cleanup = async () => {
                if (html5QrCode) {
                    try {
                        if (html5QrCode.isScanning) {
                            await html5QrCode.stop();
                        }
                        html5QrCode.clear();
                    } catch (err) {
                        console.error("Failed to stop scanner on unmount", err);
                    }
                }
            };
            cleanup();
        };
    }, [containerId]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Stop camera scanning before file scanning to prevent conflicts
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                setIsScanning(false);
            } catch (err) {
                console.error("Failed to stop camera for file scan", err);
            }
        }

        const fileScanner = new Html5Qrcode(containerId);
        try {
            const decodedText = await fileScanner.scanFile(file, true);
            onScanRef.current(decodedText);
            onCloseRef.current();
        } catch (err) {
            console.error("Failed to scan file", err);
            setError("Could not find a QR code in this image.");
            // Restart camera if file scan failed? 
            // For now, just show error.
        } finally {
            try {
                fileScanner.clear();
            } catch (e) {}
        }
    };

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[32px] overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-synergy-blue rounded-xl flex items-center justify-center">
                            <Camera size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Scan QR Code</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Referral Scanner</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden relative border-2 border-dashed border-gray-200 dark:border-gray-700">
                        {/* 
                          CRITICAL: This div is for html5-qrcode. 
                          React must see it as empty to avoid 'removeChild' errors 
                          if the library modifies the DOM.
                        */}
                        <div 
                            id={containerId} 
                            className="w-full h-full" 
                            dangerouslySetInnerHTML={{ __html: '' }}
                        />
                        
                        {/* React-managed overlays as siblings to the scanner div */}
                        {!isScanning && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none z-10">
                                <Loader2 size={32} className="animate-spin mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">Initializing Camera...</p>
                            </div>
                        )}
                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-100 dark:bg-gray-800 z-20">
                                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                                    <X size={24} />
                                </div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{error}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Try uploading an image instead.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="relative">
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <button className="w-full py-4 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center space-x-3 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                                <ImageIcon size={18} />
                                <span>Upload from Gallery</span>
                            </button>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-full py-4 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
