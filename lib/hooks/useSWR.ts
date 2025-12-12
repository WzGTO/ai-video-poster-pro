/**
 * SWR Hooks for Client-Side Data Fetching
 * 
 * Provides optimized data fetching with:
 * - Automatic caching
 * - Revalidation on focus/reconnect
 * - Deduplication
 * - Error handling
 * 
 * Usage:
 *   import { useProducts, useVideos } from '@/lib/hooks/useSWR';
 *   const { products, isLoading, mutate } = useProducts();
 */

import useSWR from 'swr';
import type { SWRConfiguration } from 'swr';

// ===== Fetcher =====

interface FetchError extends Error {
    info?: unknown;
    status?: number;
}

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error: FetchError = new Error('API request failed');
        try {
            error.info = await res.json();
        } catch {
            error.info = { message: res.statusText };
        }
        error.status = res.status;
        throw error;
    }
    return res.json();
};

// ===== Products Hooks =====

interface UseProductsOptions extends SWRConfiguration {
    limit?: number;
    category?: string;
    search?: string;
}

/**
 * Hook for fetching products list
 */
export function useProducts(options?: UseProductsOptions) {
    const { limit, category, search, ...config } = options || {};

    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (category) params.set('category', category);
    if (search) params.set('search', search);

    const queryString = params.toString();
    const url = `/api/products/list${queryString ? `?${queryString}` : ''}`;

    const { data, error, mutate, isLoading, isValidating } = useSWR(
        url,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 60000, // 1 minute
            ...config
        }
    );

    return {
        products: data?.products || [],
        pagination: data?.pagination,
        stats: data?.stats,
        isLoading,
        isValidating,
        isError: error,
        mutate
    };
}

/**
 * Hook for fetching single product
 */
export function useProduct(productId: string | null, config?: SWRConfiguration) {
    const { data, error, mutate, isLoading } = useSWR(
        productId ? `/api/products/${productId}` : null,
        fetcher,
        config
    );

    return {
        product: data?.product,
        isLoading,
        isError: error,
        mutate
    };
}

// ===== Videos Hooks =====

interface UseVideosOptions extends SWRConfiguration {
    limit?: number;
    status?: string;
}

/**
 * Hook for fetching videos list
 */
export function useVideos(options?: UseVideosOptions) {
    const { limit, status, ...config } = options || {};

    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (status) params.set('status', status);

    const queryString = params.toString();
    const url = `/api/videos/list${queryString ? `?${queryString}` : ''}`;

    const { data, error, mutate, isLoading, isValidating } = useSWR(
        url,
        fetcher,
        {
            revalidateOnFocus: false,
            refreshInterval: 0,
            ...config
        }
    );

    return {
        videos: data?.videos || [],
        pagination: data?.pagination,
        isLoading,
        isValidating,
        isError: error,
        mutate
    };
}

/**
 * Hook for fetching single video
 */
export function useVideo(videoId: string | null, config?: SWRConfiguration) {
    const { data, error, mutate, isLoading } = useSWR(
        videoId ? `/api/videos/${videoId}` : null,
        fetcher,
        config
    );

    return {
        video: data?.video,
        isLoading,
        isError: error,
        mutate
    };
}

/**
 * Hook for polling video status during processing
 */
export function useVideoStatus(videoId: string | null, enabled: boolean = true, config?: SWRConfiguration) {
    const { data, error, mutate, isLoading } = useSWR(
        enabled && videoId ? `/api/videos/status/${videoId}` : null,
        fetcher,
        {
            refreshInterval: 2000, // Poll every 2 seconds
            ...config
        }
    );

    return {
        status: data?.status,
        progress: data?.progress,
        isLoading,
        isError: error,
        mutate
    };
}

// ===== Posts Hooks =====

interface UsePostsOptions extends SWRConfiguration {
    limit?: number;
    platform?: string;
    recentOnly?: boolean;
}

/**
 * Hook for fetching posts list
 */
export function usePosts(options?: UsePostsOptions) {
    const { limit, platform, recentOnly, ...config } = options || {};

    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (platform) params.set('platform', platform);
    if (recentOnly) params.set('recentOnly', 'true');

    const queryString = params.toString();
    const url = `/api/posts/list${queryString ? `?${queryString}` : ''}`;

    const { data, error, mutate, isLoading, isValidating } = useSWR(
        url,
        fetcher,
        {
            revalidateOnFocus: true,
            refreshInterval: 300000, // 5 minutes
            ...config
        }
    );

    return {
        posts: data?.posts || [],
        pagination: data?.pagination,
        isLoading,
        isValidating,
        isError: error,
        mutate
    };
}

// ===== Templates Hooks =====

/**
 * Hook for fetching templates list
 */
export function useTemplates(config?: SWRConfiguration) {
    const { data, error, mutate, isLoading, isValidating } = useSWR(
        '/api/templates/list',
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 600000, // 10 minutes
            ...config
        }
    );

    return {
        templates: data?.templates || [],
        isLoading,
        isValidating,
        isError: error,
        mutate
    };
}

// ===== Storage Hooks =====

/**
 * Hook for fetching Google Drive storage info
 */
export function useStorageInfo(config?: SWRConfiguration) {
    const { data, error, mutate, isLoading } = useSWR(
        '/api/drive/storage',
        fetcher,
        {
            revalidateOnFocus: false,
            refreshInterval: 300000, // 5 minutes
            ...config
        }
    );

    return {
        storage: data,
        used: data?.usage?.usedInDrive || 0,
        total: data?.quota?.limit || 15 * 1024 * 1024 * 1024,
        percentage: data ? Math.round((data.usage?.usedInDrive || 0) / (data.quota?.limit || 15 * 1024 * 1024 * 1024) * 100) : 0,
        isLoading,
        isError: error,
        mutate
    };
}

// ===== Social Status Hooks =====

/**
 * Hook for fetching social media connection status
 */
export function useSocialStatus(config?: SWRConfiguration) {
    const { data, error, mutate, isLoading } = useSWR(
        '/api/social/status',
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000, // 1 minute
            ...config
        }
    );

    return {
        platforms: data?.platforms || {
            tiktok: { connected: false },
            facebook: { connected: false },
            youtube: { connected: false }
        },
        isLoading,
        isError: error,
        mutate
    };
}

// ===== Analytics Hooks =====

interface UseAnalyticsOptions extends SWRConfiguration {
    from?: string;
    to?: string;
    platform?: string;
}

/**
 * Hook for fetching analytics overview
 */
export function useAnalytics(options?: UseAnalyticsOptions) {
    const { from, to, platform, ...config } = options || {};

    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (platform) params.set('platform', platform);

    const queryString = params.toString();
    const url = `/api/analytics/overview${queryString ? `?${queryString}` : ''}`;

    const { data, error, mutate, isLoading, isValidating } = useSWR(
        url,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 900000, // 15 minutes
            ...config
        }
    );

    return {
        analytics: data,
        overview: data?.overview,
        viewsOverTime: data?.viewsOverTime || [],
        engagementByPlatform: data?.engagementByPlatform || [],
        topVideos: data?.topVideos || [],
        bestTimes: data?.bestTimes || [],
        isLoading,
        isValidating,
        isError: error,
        mutate
    };
}

// ===== Stats Hooks =====

/**
 * Hook for fetching dashboard stats
 */
export function useDashboardStats(config?: SWRConfiguration) {
    const { data, error, mutate, isLoading } = useSWR(
        '/api/stats/overview',
        fetcher,
        {
            revalidateOnFocus: false,
            refreshInterval: 300000, // 5 minutes
            ...config
        }
    );

    return {
        stats: data,
        isLoading,
        isError: error,
        mutate
    };
}

// ===== Utility Functions =====

/**
 * Prefetch data for a URL
 */
export async function prefetch(url: string) {
    try {
        await fetcher(url);
    } catch (error) {
        console.error('Prefetch error:', error);
    }
}

/**
 * Mutate all SWR caches that match the key pattern
 */
export { mutate as globalMutate } from 'swr';
