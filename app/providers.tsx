"use client";

/**
 * Application Providers
 * 
 * Wraps the application with necessary context providers:
 * - SWR for data fetching
 * - Session provider for auth
 * - Toast provider for notifications
 */

import { SWRConfig } from 'swr';
import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/ui/toast';

interface ProvidersProps {
    children: React.ReactNode;
    session?: unknown;
}

export function Providers({ children, session }: ProvidersProps) {
    return (
        <SessionProvider session={session}>
            <SWRConfig
                value={{
                    // Global configuration
                    refreshInterval: 0,
                    revalidateOnFocus: false,
                    revalidateOnReconnect: true,
                    revalidateIfStale: true,
                    shouldRetryOnError: true,
                    errorRetryCount: 3,
                    errorRetryInterval: 5000,
                    dedupingInterval: 2000,

                    // Global error handler
                    onError: (error, key) => {
                        console.error('SWR Error:', key, error);

                        // Don't log 401 errors (expected for unauthenticated users)
                        if (error?.status === 401) {
                            return;
                        }

                        // Log to analytics/error tracking
                        if (typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureException: (e: Error) => void } }).Sentry) {
                            (window as unknown as { Sentry: { captureException: (e: Error) => void } }).Sentry.captureException(error);
                        }
                    },

                    // Global loading fallback
                    onLoadingSlow: (key) => {
                        console.warn('SWR Slow Loading:', key);
                    },
                }}
            >
                <ToastProvider>
                    {children}
                </ToastProvider>
            </SWRConfig>
        </SessionProvider>
    );
}

/**
 * Light provider for components that only need SWR
 */
export function SWRProvider({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig
            value={{
                refreshInterval: 0,
                revalidateOnFocus: false,
                revalidateOnReconnect: true,
                shouldRetryOnError: true,
                errorRetryCount: 2,
            }}
        >
            {children}
        </SWRConfig>
    );
}
