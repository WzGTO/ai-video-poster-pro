/**
 * Rate Limit Cleanup Cron Job
 * Removes old rate limit records from the database
 * 
 * Schedule: Every hour (0 * * * *)
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization');
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const cronSecret = process.env.CRON_SECRET;

    // Allow if Vercel cron or correct secret
    const isAuthorized =
        isVercelCron ||
        (cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isAuthorized) {
        logger.warn('Unauthorized rate limit cleanup attempt');
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        logger.info('Starting rate limit cleanup');

        const limiter = new RateLimiter();
        const deletedCount = await limiter.cleanup(24); // Delete records older than 24 hours

        logger.info('Rate limit cleanup completed', { deletedCount });

        return NextResponse.json({
            success: true,
            message: 'Rate limit cleanup completed',
            deletedCount,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('Rate limit cleanup failed', { error });

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
