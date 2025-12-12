"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";

interface SessionProviderProps {
    children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
    return (
        <NextAuthSessionProvider>
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
                        // Don't log 401 errors (expected for unauthenticated users)
                        if ((error as { status?: number })?.status === 401) {
                            return;
                        }
                        console.error('SWR Error:', key, error);
                    },
                }}
            >
                {children}
            </SWRConfig>
        </NextAuthSessionProvider>
    );
}
