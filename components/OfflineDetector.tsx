'use client';

/**
 * Offline Detector Component
 * Shows a banner when the user loses internet connection
 */

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';

export function OfflineDetector() {
    const [isOffline, setIsOffline] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        // Check initial status
        setIsOffline(!navigator.onLine);

        const handleOnline = () => {
            setIsOffline(false);
            if (wasOffline) {
                // Show "back online" message briefly
                setShowBanner(true);
                setTimeout(() => setShowBanner(false), 3000);
            }
            setWasOffline(false);
        };

        const handleOffline = () => {
            setIsOffline(true);
            setWasOffline(true);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline]);

    // Don't render anything if online and no banner to show
    if (!isOffline && !showBanner) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[100] transition-transform duration-300 ${showBanner ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            <div
                className={`flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium ${isOffline
                        ? 'bg-red-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}
            >
                {isOffline ? (
                    <>
                        <WifiOff className="h-4 w-4 animate-pulse" />
                        <span>ไม่มีการเชื่อมต่ออินเทอร์เน็ต - บางฟีเจอร์อาจไม่สามารถใช้งานได้</span>
                    </>
                ) : (
                    <>
                        <Wifi className="h-4 w-4" />
                        <span>กลับมาออนไลน์แล้ว!</span>
                    </>
                )}

                <button
                    onClick={() => setShowBanner(false)}
                    className="ml-4 p-1 hover:bg-white/20 rounded transition-colors"
                    aria-label="ปิด"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

/**
 * Hook to check online status
 */
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

/**
 * Connection Quality Detector
 */
export function useConnectionQuality(): 'good' | 'slow' | 'offline' {
    const [quality, setQuality] = useState<'good' | 'slow' | 'offline'>('good');

    useEffect(() => {
        // Check initial status
        if (!navigator.onLine) {
            setQuality('offline');
            return;
        }

        // Check connection type if available
        const connection = (navigator as Navigator & {
            connection?: {
                effectiveType?: string;
                downlink?: number;
                rtt?: number;
            }
        }).connection;

        const updateQuality = () => {
            if (!navigator.onLine) {
                setQuality('offline');
                return;
            }

            if (connection) {
                const effectiveType = connection.effectiveType;
                if (effectiveType === 'slow-2g' || effectiveType === '2g') {
                    setQuality('slow');
                } else if (connection.downlink && connection.downlink < 1) {
                    setQuality('slow');
                } else if (connection.rtt && connection.rtt > 500) {
                    setQuality('slow');
                } else {
                    setQuality('good');
                }
            } else {
                setQuality('good');
            }
        };

        updateQuality();

        window.addEventListener('online', updateQuality);
        window.addEventListener('offline', updateQuality);

        if (connection) {
            connection.addEventListener?.('change', updateQuality);
        }

        return () => {
            window.removeEventListener('online', updateQuality);
            window.removeEventListener('offline', updateQuality);
            if (connection) {
                connection.removeEventListener?.('change', updateQuality);
            }
        };
    }, []);

    return quality;
}

export default OfflineDetector;
