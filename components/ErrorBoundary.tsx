'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ===== Types =====

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

// Extend window for Sentry
declare global {
    interface Window {
        Sentry?: {
            captureException: (error: Error, options?: unknown) => void;
        };
    }
}

// ===== ErrorBoundary Component =====

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Call custom error handler
        this.props.onError?.(error, errorInfo);

        // Send to Sentry if available
        if (typeof window !== 'undefined' && window.Sentry) {
            window.Sentry.captureException(error, {
                contexts: {
                    react: {
                        componentStack: errorInfo.componentStack,
                    },
                },
            });
        }

        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return <DefaultErrorUI
                error={this.state.error}
                errorInfo={this.state.errorInfo}
                onReset={this.handleReset}
                onReload={this.handleReload}
                onGoHome={this.handleGoHome}
            />;
        }

        return this.props.children;
    }
}

// ===== Default Error UI Component =====

interface DefaultErrorUIProps {
    error: Error | null;
    errorInfo: ErrorInfo | null;
    onReset: () => void;
    onReload: () => void;
    onGoHome: () => void;
}

function DefaultErrorUI({ error, errorInfo, onReset, onReload, onGoHome }: DefaultErrorUIProps) {
    const [showDetails, setShowDetails] = React.useState(false);
    const isDev = process.env.NODE_ENV === 'development';

    return (
        <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 rounded-lg">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                    เกิดข้อผิดพลาด
                </h1>

                {/* Message */}
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                    ขออภัยค่ะ เกิดข้อผิดพลาดบางอย่างขณะแสดงหน้านี้
                    <br />
                    <span className="text-sm">กรุณาลองใหม่อีกครั้ง หรือกลับไปหน้าหลัก</span>
                </p>

                {/* Error details (dev only) */}
                {isDev && error && (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors w-full"
                        >
                            <Bug className="w-4 h-4" />
                            <span>รายละเอียดข้อผิดพลาด (Dev)</span>
                            <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                        </button>

                        {showDetails && (
                            <div className="mt-3 bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-hidden">
                                <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                                    {error.name}: {error.message}
                                </p>
                                <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 overflow-auto max-h-48 whitespace-pre-wrap">
                                    {error.stack}
                                </pre>
                                {errorInfo?.componentStack && (
                                    <>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">
                                            Component Stack:
                                        </p>
                                        <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 overflow-auto max-h-32 whitespace-pre-wrap">
                                            {errorInfo.componentStack}
                                        </pre>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={onReset}
                        className="flex-1"
                        variant="default"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        ลองอีกครั้ง
                    </Button>

                    <Button
                        onClick={onGoHome}
                        className="flex-1"
                        variant="outline"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        กลับหน้าหลัก
                    </Button>
                </div>

                {/* Reload link */}
                <button
                    onClick={onReload}
                    className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                    หรือ รีเฟรชหน้าใหม่
                </button>
            </div>
        </div>
    );
}

// ===== HOC Wrapper =====

export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode,
    onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

    const WithErrorBoundaryComponent = (props: P) => {
        return (
            <ErrorBoundary fallback={fallback} onError={onError}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };

    WithErrorBoundaryComponent.displayName = `withErrorBoundary(${displayName})`;

    return WithErrorBoundaryComponent;
}

// ===== Simple Error Fallback Components =====

export function SimpleErrorFallback() {
    return (
        <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
                ไม่สามารถโหลดเนื้อหาได้
            </p>
            <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
            >
                <RefreshCw className="w-4 h-4 mr-2" />
                รีเฟรชหน้า
            </Button>
        </div>
    );
}

export function InlineErrorFallback({ message }: { message?: string }) {
    return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">เกิดข้อผิดพลาด</span>
            </div>
            {message && (
                <p className="mt-2 text-sm text-red-600/80 dark:text-red-400/80">
                    {message}
                </p>
            )}
        </div>
    );
}

// ===== Async Error Boundary (for Suspense) =====

interface AsyncErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export function AsyncErrorBoundary({ children, fallback }: AsyncErrorBoundaryProps) {
    return (
        <ErrorBoundary fallback={fallback || <SimpleErrorFallback />}>
            <React.Suspense fallback={
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
            }>
                {children}
            </React.Suspense>
        </ErrorBoundary>
    );
}

// ===== Export =====

export default ErrorBoundary;
