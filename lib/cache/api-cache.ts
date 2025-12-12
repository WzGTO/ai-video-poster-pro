/**
 * API Response Caching Module
 * 
 * Uses Next.js unstable_cache for server-side caching with revalidation
 * 
 * Usage:
 *   import { getCachedProducts, revalidateCache } from '@/lib/cache/api-cache';
 *   
 *   const products = await getCachedProducts(userId);
 *   await revalidateCache('products');
 */

import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { supabase } from '@/lib/supabase';

// ===== Cache Durations =====

const CACHE_DURATIONS = {
    products: 3600,      // 1 hour
    templates: 3600,     // 1 hour
    user: 300,           // 5 minutes
    analytics: 900,      // 15 minutes
    socialStatus: 60,    // 1 minute
} as const;

// ===== Products Cache =====

/**
 * Get cached products list for a user
 */
export const getCachedProducts = unstable_cache(
    async (userId: string, options?: { limit?: number; category?: string }) => {
        let query = supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (options?.limit) {
            query = query.limit(options.limit);
        }

        if (options?.category) {
            query = query.eq('category', options.category);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching cached products:', error);
            return [];
        }

        return data || [];
    },
    ['products-list'],
    {
        revalidate: CACHE_DURATIONS.products,
        tags: ['products'],
    }
);

/**
 * Get cached product by ID
 */
export const getCachedProductById = unstable_cache(
    async (userId: string, productId: string) => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .eq('id', productId)
            .single();

        if (error) {
            return null;
        }

        return data;
    },
    ['product-detail'],
    {
        revalidate: CACHE_DURATIONS.products,
        tags: ['products'],
    }
);

// ===== Templates Cache =====

/**
 * Get cached templates list
 */
export const getCachedTemplates = unstable_cache(
    async (userId: string) => {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .or(`user_id.eq.${userId},is_public.eq.true`)
            .order('usage_count', { ascending: false });

        if (error) {
            console.error('Error fetching cached templates:', error);
            return [];
        }

        return data || [];
    },
    ['templates-list'],
    {
        revalidate: CACHE_DURATIONS.templates,
        tags: ['templates'],
    }
);

/**
 * Get cached template by ID
 */
export const getCachedTemplateById = unstable_cache(
    async (userId: string, templateId: string) => {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', templateId)
            .or(`user_id.eq.${userId},is_public.eq.true`)
            .single();

        if (error) {
            return null;
        }

        return data;
    },
    ['template-detail'],
    {
        revalidate: CACHE_DURATIONS.templates,
        tags: ['templates'],
    }
);

// ===== User Settings Cache =====

/**
 * Get cached user settings
 */
export const getCachedUserSettings = unstable_cache(
    async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching cached user:', error);
            return null;
        }

        return data;
    },
    ['user-settings'],
    {
        revalidate: CACHE_DURATIONS.user,
        tags: ['user'],
    }
);

// ===== Videos Cache =====

/**
 * Get cached videos list
 */
export const getCachedVideos = unstable_cache(
    async (userId: string, options?: { limit?: number; status?: string }) => {
        let query = supabase
            .from('videos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (options?.limit) {
            query = query.limit(options.limit);
        }

        if (options?.status) {
            query = query.eq('status', options.status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching cached videos:', error);
            return [];
        }

        return data || [];
    },
    ['videos-list'],
    {
        revalidate: 60, // 1 minute for videos (changes more frequently)
        tags: ['videos'],
    }
);

// ===== Social Status Cache =====

/**
 * Get cached social connection status
 */
export const getCachedSocialStatus = unstable_cache(
    async (userId: string) => {
        const { data: tokens, error } = await supabase
            .from('social_tokens')
            .select('provider, expires_at, account_name, account_id')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching cached social status:', error);
            return null;
        }

        const now = new Date();
        const status: Record<string, {
            connected: boolean;
            accountName?: string;
            accountId?: string;
            expiresAt?: string;
        }> = {
            tiktok: { connected: false },
            facebook: { connected: false },
            youtube: { connected: false },
        };

        tokens?.forEach((token: { provider: string; expires_at?: string; account_name?: string; account_id?: string }) => {
            const isValid = token.expires_at ? new Date(token.expires_at) > now : true;
            if (isValid) {
                status[token.provider] = {
                    connected: true,
                    accountName: token.account_name,
                    accountId: token.account_id,
                    expiresAt: token.expires_at,
                };
            }
        });

        return status;
    },
    ['social-status'],
    {
        revalidate: CACHE_DURATIONS.socialStatus,
        tags: ['social'],
    }
);

// ===== Analytics Cache =====

/**
 * Get cached analytics summary
 */
export const getCachedAnalyticsSummary = unstable_cache(
    async (userId: string, days: number = 7) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('analytics')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching cached analytics:', error);
            return null;
        }

        // Aggregate data
        const summary = {
            totalViews: 0,
            totalLikes: 0,
            totalShares: 0,
            totalComments: 0,
            byPlatform: {} as Record<string, { views: number; likes: number; shares: number }>,
            byDate: [] as Array<{ date: string; views: number; likes: number }>,
        };

        data?.forEach((row: { platform: string; views?: number; likes?: number; shares?: number; comments?: number }) => {
            summary.totalViews += row.views || 0;
            summary.totalLikes += row.likes || 0;
            summary.totalShares += row.shares || 0;
            summary.totalComments += row.comments || 0;

            // By platform
            if (!summary.byPlatform[row.platform]) {
                summary.byPlatform[row.platform] = { views: 0, likes: 0, shares: 0 };
            }
            summary.byPlatform[row.platform].views += row.views || 0;
            summary.byPlatform[row.platform].likes += row.likes || 0;
            summary.byPlatform[row.platform].shares += row.shares || 0;
        });

        return summary;
    },
    ['analytics-summary'],
    {
        revalidate: CACHE_DURATIONS.analytics,
        tags: ['analytics'],
    }
);

// ===== Cache Revalidation =====

export type CacheTag = 'products' | 'templates' | 'videos' | 'user' | 'social' | 'analytics';

/**
 * Revalidate a specific cache tag
 */
export async function revalidateCache(tag: CacheTag) {
    try {
        revalidateTag(tag);
    } catch (error) {
        console.error(`Failed to revalidate cache tag: ${tag}`, error);
    }
}

/**
 * Revalidate multiple cache tags
 */
export async function revalidateCaches(tags: CacheTag[]) {
    for (const tag of tags) {
        await revalidateCache(tag);
    }
}

/**
 * Revalidate all caches for a user
 */
export async function revalidateUserCaches() {
    await revalidateCaches(['products', 'templates', 'videos', 'user', 'social', 'analytics']);
}

// ===== Cache Stats (for debugging) =====

export const CACHE_STATS = {
    products: { duration: CACHE_DURATIONS.products, description: 'Products list' },
    templates: { duration: CACHE_DURATIONS.templates, description: 'Templates list' },
    user: { duration: CACHE_DURATIONS.user, description: 'User settings' },
    analytics: { duration: CACHE_DURATIONS.analytics, description: 'Analytics data' },
    socialStatus: { duration: CACHE_DURATIONS.socialStatus, description: 'Social connection status' },
};
