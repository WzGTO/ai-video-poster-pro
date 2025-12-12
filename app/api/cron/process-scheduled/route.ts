import { NextRequest, NextResponse } from "next/server";
import { schedulerManager } from "@/lib/scheduler/cron-manager";
import { logger } from "@/lib/logger";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// 60 seconds timeout (Vercel Pro)
export const maxDuration = 60;

/**
 * Cron job endpoint สำหรับประมวลผล scheduled posts
 *
 * เรียกโดย Vercel Cron หรือ external cron service ทุก 5 นาที
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now();

    // ตรวจสอบ authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // ยอมรับทั้ง Bearer token และ Vercel Cron header
    const vercelCronHeader = request.headers.get("x-vercel-cron");

    if (!vercelCronHeader && authHeader !== `Bearer ${cronSecret}`) {
        logger.warn("Unauthorized cron request attempted");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("Cron job started: process-scheduled");

    try {
        // ประมวลผล scheduled posts
        const result = await schedulerManager.processAllScheduledPosts();

        const duration = Date.now() - startTime;

        logger.info("Cron job completed", {
            ...result,
            duration: `${duration}ms`,
        });

        return NextResponse.json({
            success: true,
            processed: result.processed,
            successful: result.successful,
            failed: result.failed,
            results: result.results,
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
        });
    } catch (error) {
        const duration = Date.now() - startTime;

        logger.error("Cron job failed", error, { duration: `${duration}ms` });

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
                duration: `${duration}ms`,
            },
            { status: 500 }
        );
    }
}

/**
 * Manual trigger endpoint (POST)
 * ใช้สำหรับ trigger ด้วยตนเองจาก admin panel
 */
export async function POST(request: NextRequest) {
    // ต้องมี authorization header
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const { postId } = body as { postId?: string };

        if (postId) {
            // Process specific post
            const { createClient } = await import("@supabase/supabase-js");
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: post, error } = await supabase
                .from("posts")
                .select("*")
                .eq("id", postId)
                .single();

            if (error || !post) {
                return NextResponse.json({ error: "Post not found" }, { status: 404 });
            }

            const result = await schedulerManager.processScheduledPost(post);

            return NextResponse.json({
                success: result.success,
                result,
                timestamp: new Date().toISOString(),
            });
        } else {
            // Process all scheduled posts
            const result = await schedulerManager.processAllScheduledPosts();

            return NextResponse.json({
                success: true,
                ...result,
                timestamp: new Date().toISOString(),
            });
        }
    } catch (error) {
        logger.error("Manual cron trigger failed", error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
