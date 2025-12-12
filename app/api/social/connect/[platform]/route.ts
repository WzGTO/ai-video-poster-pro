import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { tiktokAPI } from "@/lib/social/tiktok";
import { facebookAPI } from "@/lib/social/facebook";
import { youtubeAPI } from "@/lib/social/youtube";
import crypto from "crypto";

type Platform = "tiktok" | "facebook" | "youtube";

/**
 * GET /api/social/connect/[platform]
 * Initiate OAuth flow for social platform
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    try {
        const { platform } = await params;

        // 1. ตรวจสอบ authentication
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const userId = session.user.id;

        // 2. Validate platform
        const validPlatforms: Platform[] = ["tiktok", "facebook", "youtube"];

        if (!validPlatforms.includes(platform as Platform)) {
            return NextResponse.json(
                {
                    error: "Platform ไม่ถูกต้อง",
                    code: "INVALID_PLATFORM",
                    validPlatforms,
                },
                { status: 400 }
            );
        }

        // 3. Generate state token for CSRF protection
        const state = crypto.randomBytes(16).toString("hex");

        // Store state in session/cookie (using encrypted cookie)
        const stateData = JSON.stringify({
            userId,
            platform,
            timestamp: Date.now(),
        });

        // 4. Get OAuth URL based on platform
        let authUrl: string;

        switch (platform as Platform) {
            case "tiktok":
                authUrl = tiktokAPI.connectAccount(state);
                break;
            case "facebook":
                authUrl = facebookAPI.connectAccount(state);
                break;
            case "youtube":
                authUrl = youtubeAPI.connectAccount(state);
                break;
            default:
                return NextResponse.json(
                    { error: "Platform ไม่รองรับ" },
                    { status: 400 }
                );
        }

        // 5. Create response with state cookie
        const response = NextResponse.redirect(authUrl);

        // Set state cookie for verification in callback
        response.cookies.set("oauth_state", state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 600, // 10 minutes
            path: "/",
        });

        response.cookies.set("oauth_user", userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 600,
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Social connect error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}
