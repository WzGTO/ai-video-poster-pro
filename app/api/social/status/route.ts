import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { tiktokAPI } from "@/lib/social/tiktok";
import { facebookAPI } from "@/lib/social/facebook";
import { youtubeAPI } from "@/lib/social/youtube";

/**
 * GET /api/social/status
 * Get connected social accounts status
 */
export async function GET(request: NextRequest) {
    try {
        // 1. ตรวจสอบ authentication
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // 2. Get all tokens for user
        const { data: tokens, error: tokensError } = await supabase
            .from("user_tokens")
            .select("provider, expires_at, updated_at")
            .eq("user_id", userId);

        // 3. Get all pages for user
        const { data: pages, error: pagesError } = await supabase
            .from("user_pages")
            .select("provider, page_id, page_name, picture_url, metadata")
            .eq("user_id", userId);

        // 4. Build status for each platform
        const platforms = {
            tiktok: {
                connected: false,
                expired: false,
                lastUpdated: null as string | null,
                account: null as { name: string; picture?: string } | null,
            },
            facebook: {
                connected: false,
                expired: false,
                lastUpdated: null as string | null,
                pages: [] as Array<{ id: string; name: string; picture?: string }>,
            },
            youtube: {
                connected: false,
                expired: false,
                lastUpdated: null as string | null,
                channel: null as {
                    id: string;
                    name: string;
                    picture?: string;
                    subscriberCount?: number;
                } | null,
            },
        };

        // Process tokens
        if (tokens) {
            for (const token of tokens) {
                const isExpired = new Date(token.expires_at) < new Date();

                if (token.provider === "tiktok") {
                    platforms.tiktok.connected = true;
                    platforms.tiktok.expired = isExpired;
                    platforms.tiktok.lastUpdated = token.updated_at;
                }

                if (token.provider === "facebook") {
                    platforms.facebook.connected = true;
                    platforms.facebook.expired = isExpired;
                    platforms.facebook.lastUpdated = token.updated_at;
                }

                if (token.provider === "youtube") {
                    platforms.youtube.connected = true;
                    platforms.youtube.expired = isExpired;
                    platforms.youtube.lastUpdated = token.updated_at;
                }
            }
        }

        // Process pages
        if (pages) {
            for (const page of pages) {
                if (page.provider === "facebook") {
                    platforms.facebook.pages.push({
                        id: page.page_id,
                        name: page.page_name,
                        picture: page.picture_url,
                    });
                }

                if (page.provider === "youtube") {
                    platforms.youtube.channel = {
                        id: page.page_id,
                        name: page.page_name,
                        picture: page.picture_url,
                        subscriberCount: page.metadata?.subscriberCount,
                    };
                }

                if (page.provider === "tiktok") {
                    platforms.tiktok.account = {
                        name: page.page_name,
                        picture: page.picture_url,
                    };
                }
            }
        }

        // 5. Return status
        return NextResponse.json({
            success: true,
            platforms,
            summary: {
                connectedCount: Object.values(platforms).filter((p) => p.connected)
                    .length,
                totalPlatforms: 3,
                hasExpired: Object.values(platforms).some(
                    (p) => p.connected && p.expired
                ),
            },
        });
    } catch (error) {
        console.error("Social status error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการดึงข้อมูล",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/social/status
 * Disconnect a social account
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const { searchParams } = new URL(request.url);
        const platform = searchParams.get("platform");

        if (!platform || !["tiktok", "facebook", "youtube"].includes(platform)) {
            return NextResponse.json(
                { error: "Platform ไม่ถูกต้อง", code: "INVALID_PLATFORM" },
                { status: 400 }
            );
        }

        // Delete tokens
        await supabase
            .from("user_tokens")
            .delete()
            .eq("user_id", userId)
            .eq("provider", platform);

        // Delete pages
        await supabase
            .from("user_pages")
            .delete()
            .eq("user_id", userId)
            .eq("provider", platform);

        return NextResponse.json({
            success: true,
            message: `ยกเลิกการเชื่อมต่อ ${platform} สำเร็จ`,
            platform,
        });
    } catch (error) {
        console.error("Social disconnect error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}
