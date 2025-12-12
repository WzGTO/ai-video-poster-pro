import type { NextConfig } from "next";

// Security headers
const securityHeaders = [
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
    },
    {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    },
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://*.supabase.co https://*.googleapis.com https://generativelanguage.googleapis.com https://accounts.google.com wss://*.supabase.co",
            "media-src 'self' https://drive.google.com https://*.googlevideo.com blob:",
            "frame-src 'self' https://accounts.google.com https://www.youtube.com",
            "frame-ancestors 'self'",
            "form-action 'self'",
            "base-uri 'self'",
        ].join('; '),
    },
];

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "drive.google.com",
            },
            {
                protocol: "https",
                hostname: "**.tiktokcdn.com",
            },
            {
                protocol: "https",
                hostname: "**.googleusercontent.com",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
            {
                protocol: "https",
                hostname: "**.fbcdn.net",
            },
            {
                protocol: "https",
                hostname: "**.ytimg.com",
            },
            {
                protocol: "https",
                hostname: "via.placeholder.com",
            },
        ],
        formats: ["image/avif", "image/webp"],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "50mb",
        },
    },
    env: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },
    async headers() {
        return [
            // Security headers for all routes
            {
                source: '/:path*',
                headers: securityHeaders,
            },
            // Cron routes - no cache
            {
                source: "/api/cron/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "no-store",
                    },
                ],
            },
            // Cacheable API routes - products list
            {
                source: "/api/products/list",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, s-maxage=3600, stale-while-revalidate=7200",
                    },
                ],
            },
            // Cacheable API routes - videos list
            {
                source: "/api/videos/list",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, s-maxage=60, stale-while-revalidate=120",
                    },
                ],
            },
            // Cacheable API routes - templates list
            {
                source: "/api/templates/list",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, s-maxage=3600, stale-while-revalidate=7200",
                    },
                ],
            },
            // API routes - no cache by default
            {
                source: "/api/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "no-store, max-age=0",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;

