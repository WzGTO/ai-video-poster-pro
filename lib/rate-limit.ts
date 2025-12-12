/**
 * Rate Limiting Module
 * Database-backed rate limiting for API protection
 * 
 * Usage:
 *   import { withRateLimit, RateLimiter } from '@/lib/rate-limit';
 *   
 *   // In API route:
 *   return withRateLimit(userId, '/api/videos/create', async () => {
 *     // handler logic
 *   });
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ===== Types =====

export interface RateLimitConfig {
    interval: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    reset: number;         // Seconds until reset
    limit: number;
}

interface RateLimitRecord {
    id: string;
    identifier: string;
    identifier_type: 'user' | 'ip';
    endpoint: string;
    request_count: number;
    window_start: string;
}

// ===== Configuration =====

// Endpoint-specific rate limits
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
    // Video creation - expensive operation
    '/api/videos/create': {
        interval: 60 * 60 * 1000,  // 1 hour
        maxRequests: 10,           // 10 videos/hour
    },

    // Product sync
    '/api/products/sync': {
        interval: 60 * 60 * 1000,  // 1 hour
        maxRequests: 5,            // 5 syncs/hour
    },
    '/api/tiktok/sync-products': {
        interval: 60 * 60 * 1000,  // 1 hour
        maxRequests: 5,
    },

    // Post creation
    '/api/posts/create': {
        interval: 60 * 60 * 1000,  // 1 hour
        maxRequests: 30,           // 30 posts/hour
    },
    '/api/posts/schedule': {
        interval: 60 * 60 * 1000,
        maxRequests: 30,
    },

    // File uploads
    '/api/drive/upload': {
        interval: 60 * 1000,       // 1 minute
        maxRequests: 30,           // 30 uploads/minute
    },

    // AI generation (expensive)
    '/api/generate-script': {
        interval: 60 * 1000,       // 1 minute
        maxRequests: 10,           // 10 scripts/minute
    },

    // Social media connections
    '/api/social/connect': {
        interval: 60 * 60 * 1000,  // 1 hour
        maxRequests: 20,           // 20 connection attempts/hour
    },

    // Default for unlisted endpoints
    'default': {
        interval: 60 * 1000,       // 1 minute
        maxRequests: 60,           // 60 requests/minute
    },
};

// ===== RateLimiter Class =====

export class RateLimiter {
    private config: Record<string, RateLimitConfig>;

    constructor(customConfig?: Record<string, RateLimitConfig>) {
        this.config = { ...RATE_LIMITS, ...customConfig };
    }

    /**
     * Check if request is allowed
     */
    async check(
        identifier: string,
        endpoint: string,
        identifierType: 'user' | 'ip' = 'user'
    ): Promise<RateLimitResult> {
        const config = this.getConfig(endpoint);
        const now = new Date();
        const windowStart = new Date(now.getTime() - config.interval);

        try {
            // Find existing rate limit record within the window
            const { data: existing, error: selectError } = await supabase
                .from('rate_limits')
                .select('*')
                .eq('identifier', identifier)
                .eq('identifier_type', identifierType)
                .eq('endpoint', endpoint)
                .gte('window_start', windowStart.toISOString())
                .order('window_start', { ascending: false })
                .limit(1)
                .single();

            if (selectError && selectError.code !== 'PGRST116') {
                // PGRST116 = no rows found
                logger.error('Rate limit check failed', { error: selectError });
                // Allow request on error to prevent blocking
                return this.createAllowedResult(config.maxRequests, config.interval);
            }

            if (existing) {
                return this.handleExistingRecord(existing, config, now);
            } else {
                return this.createNewRecord(identifier, identifierType, endpoint, config, now);
            }
        } catch (error) {
            logger.error('Rate limit error', { error });
            // Allow request on error
            return this.createAllowedResult(config.maxRequests, config.interval);
        }
    }

    /**
     * Handle existing rate limit record
     */
    private async handleExistingRecord(
        record: RateLimitRecord,
        config: RateLimitConfig,
        now: Date
    ): Promise<RateLimitResult> {
        const windowStartTime = new Date(record.window_start).getTime();
        const resetTime = windowStartTime + config.interval;
        const secondsUntilReset = Math.ceil((resetTime - now.getTime()) / 1000);

        if (record.request_count >= config.maxRequests) {
            // Rate limit exceeded
            logger.warn('Rate limit exceeded', {
                identifier: record.identifier,
                endpoint: record.endpoint,
                count: record.request_count,
                limit: config.maxRequests,
            });

            return {
                allowed: false,
                remaining: 0,
                reset: secondsUntilReset,
                limit: config.maxRequests,
            };
        }

        // Increment counter
        await supabase
            .from('rate_limits')
            .update({
                request_count: record.request_count + 1,
            })
            .eq('id', record.id);

        return {
            allowed: true,
            remaining: config.maxRequests - record.request_count - 1,
            reset: secondsUntilReset,
            limit: config.maxRequests,
        };
    }

    /**
     * Create new rate limit record
     */
    private async createNewRecord(
        identifier: string,
        identifierType: 'user' | 'ip',
        endpoint: string,
        config: RateLimitConfig,
        now: Date
    ): Promise<RateLimitResult> {
        await supabase.from('rate_limits').insert({
            identifier,
            identifier_type: identifierType,
            endpoint,
            request_count: 1,
            window_start: now.toISOString(),
        });

        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            reset: Math.ceil(config.interval / 1000),
            limit: config.maxRequests,
        };
    }

    /**
     * Create result for allowed request
     */
    private createAllowedResult(limit: number, interval: number): RateLimitResult {
        return {
            allowed: true,
            remaining: limit - 1,
            reset: Math.ceil(interval / 1000),
            limit,
        };
    }

    /**
     * Get config for endpoint
     */
    private getConfig(endpoint: string): RateLimitConfig {
        // Try exact match first
        if (this.config[endpoint]) {
            return this.config[endpoint];
        }

        // Try prefix match for dynamic routes
        for (const [pattern, cfg] of Object.entries(this.config)) {
            if (pattern !== 'default' && endpoint.startsWith(pattern)) {
                return cfg;
            }
        }

        return this.config['default'];
    }

    /**
     * Clean up old rate limit records
     */
    async cleanup(olderThanHours: number = 24): Promise<number> {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - olderThanHours);

        const { data, error } = await supabase
            .from('rate_limits')
            .delete()
            .lt('window_start', cutoff.toISOString())
            .select('id');

        if (error) {
            logger.error('Rate limit cleanup failed', { error });
            return 0;
        }

        const deletedCount = data?.length || 0;
        logger.info('Rate limit cleanup completed', { deletedCount });
        return deletedCount;
    }

    /**
     * Reset rate limit for a user/endpoint
     */
    async reset(identifier: string, endpoint?: string): Promise<void> {
        let query = supabase
            .from('rate_limits')
            .delete()
            .eq('identifier', identifier);

        if (endpoint) {
            query = query.eq('endpoint', endpoint);
        }

        await query;
    }

    /**
     * Get current usage for a user
     */
    async getUsage(
        identifier: string,
        identifierType: 'user' | 'ip' = 'user'
    ): Promise<Record<string, { count: number; limit: number; remaining: number }>> {
        const now = new Date();
        const usage: Record<string, { count: number; limit: number; remaining: number }> = {};

        const { data, error } = await supabase
            .from('rate_limits')
            .select('*')
            .eq('identifier', identifier)
            .eq('identifier_type', identifierType);

        if (error || !data) {
            return usage;
        }

        for (const record of data) {
            const config = this.getConfig(record.endpoint);
            const windowStart = new Date(record.window_start);

            // Check if still within window
            if (now.getTime() - windowStart.getTime() < config.interval) {
                usage[record.endpoint] = {
                    count: record.request_count,
                    limit: config.maxRequests,
                    remaining: Math.max(0, config.maxRequests - record.request_count),
                };
            }
        }

        return usage;
    }
}

// ===== Middleware Helper =====

/**
 * Wrap API handler with rate limiting
 */
export async function withRateLimit(
    identifier: string,
    endpoint: string,
    handler: () => Promise<Response>,
    identifierType: 'user' | 'ip' = 'user'
): Promise<Response> {
    const limiter = new RateLimiter();
    const result = await limiter.check(identifier, endpoint, identifierType);

    // Rate limit headers
    const rateLimitHeaders = {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
    };

    if (!result.allowed) {
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                message: `คุณใช้งานเกินขีดจำกัดแล้ว กรุณารอ ${result.reset} วินาที`,
                retryAfter: result.reset,
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': result.reset.toString(),
                    ...rateLimitHeaders,
                },
            }
        );
    }

    // Execute handler
    const response = await handler();

    // Add rate limit headers to response
    const newHeaders = new Headers(response.headers);
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}

// ===== IP-based Rate Limiting =====

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
    // Try various headers
    const headers = request.headers;

    const xForwardedFor = headers.get('x-forwarded-for');
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0].trim();
    }

    const xRealIp = headers.get('x-real-ip');
    if (xRealIp) {
        return xRealIp;
    }

    const cfConnectingIp = headers.get('cf-connecting-ip');
    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    return 'unknown';
}

/**
 * Rate limit by IP address (for unauthenticated endpoints)
 */
export async function withIPRateLimit(
    request: Request,
    endpoint: string,
    handler: () => Promise<Response>
): Promise<Response> {
    const ip = getClientIP(request);
    return withRateLimit(ip, endpoint, handler, 'ip');
}

// ===== Export singleton =====

export const rateLimiter = new RateLimiter();
