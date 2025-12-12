'use client';

/**
 * Global Error Handler
 * This handles errors that occur at the root layout level
 * 
 * Note: This must be a client component and must render its own <html> and <body>
 */

import { useEffect } from 'react';

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        // Log the error
        console.error('Global error:', error);

        // Send to external error tracking
        if (typeof window !== 'undefined' && window.Sentry) {
            window.Sentry.captureException(error);
        }
    }, [error]);

    return (
        <html lang="th">
            <body>
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        color: '#fff',
                    }}
                >
                    <div
                        style={{
                            maxWidth: '400px',
                            width: '100%',
                            textAlign: 'center',
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '1rem',
                            padding: '2rem',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        {/* Icon */}
                        <div
                            style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 1.5rem',
                                background: 'rgba(239, 68, 68, 0.2)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <svg
                                width="40"
                                height="40"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                            </svg>
                        </div>

                        {/* Title */}
                        <h1
                            style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                marginBottom: '0.5rem',
                            }}
                        >
                            เกิดข้อผิดพลาดร้ายแรง
                        </h1>

                        {/* Message */}
                        <p
                            style={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                marginBottom: '1.5rem',
                                lineHeight: 1.6,
                            }}
                        >
                            ขออภัยค่ะ แอปพลิเคชันเกิดข้อผิดพลาดที่ไม่คาดคิด
                            <br />
                            กรุณาลองรีเฟรชหน้าใหม่
                        </p>

                        {/* Error ID */}
                        {error.digest && (
                            <p
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    marginBottom: '1rem',
                                }}
                            >
                                Error ID: {error.digest}
                            </p>
                        )}

                        {/* Buttons */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '0.75rem',
                                flexDirection: 'column',
                            }}
                        >
                            <button
                                onClick={reset}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1.5rem',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(139, 92, 246, 0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                    <path d="M21 3v5h-5" />
                                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                    <path d="M8 16H3v5" />
                                </svg>
                                ลองอีกครั้ง
                            </button>

                            <button
                                onClick={() => (window.location.href = '/')}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1.5rem',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#fff',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '0.5rem',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: 'background 0.2s',
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                กลับหน้าหลัก
                            </button>
                        </div>

                        {/* Footer */}
                        <p
                            style={{
                                fontSize: '0.75rem',
                                color: 'rgba(255, 255, 255, 0.4)',
                                marginTop: '1.5rem',
                            }}
                        >
                            AI Video Poster Pro
                        </p>
                    </div>
                </div>
            </body>
        </html>
    );
}
