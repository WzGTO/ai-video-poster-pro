'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log the error
        console.error('Page error:', error);

        // Send to Sentry if available
        if (typeof window !== 'undefined' && window.Sentry) {
            window.Sentry.captureException(error);
        }
    }, [error]);

    const isDev = process.env.NODE_ENV === 'development';

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-pulse">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                    เกิดข้อผิดพลาด
                </h2>

                {/* Error message */}
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                    {error.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง'}
                </p>

                {/* Error digest (for debugging) */}
                {error.digest && (
                    <p className="text-xs text-center text-gray-400 mb-4">
                        Error ID: {error.digest}
                    </p>
                )}

                {/* Dev error details */}
                {isDev && (
                    <details className="mb-6 text-left">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                            <Bug className="w-4 h-4" />
                            รายละเอียดข้อผิดพลาด (Dev)
                        </summary>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-48 font-mono">
                            {error.stack || error.toString()}
                        </pre>
                    </details>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={reset}
                        className="flex-1"
                        size="lg"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        ลองอีกครั้ง
                    </Button>

                    <Button
                        onClick={() => window.location.href = '/dashboard'}
                        className="flex-1"
                        variant="outline"
                        size="lg"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        กลับหน้าหลัก
                    </Button>
                </div>

                {/* Help text */}
                <p className="text-xs text-center text-gray-400 mt-6">
                    หากปัญหายังคงเกิดขึ้น กรุณาติดต่อทีมสนับสนุน
                </p>
            </div>
        </div>
    );
}
