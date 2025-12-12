import { NextRequest, NextResponse } from "next/server";
import { tiktokAPI } from "@/lib/social/tiktok";
import { facebookAPI } from "@/lib/social/facebook";
import { youtubeAPI } from "@/lib/social/youtube";

type Platform = "tiktok" | "facebook" | "youtube";

/**
 * GET /api/social/callback/[platform]
 * Handle OAuth callback from social platform
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    try {
        const { platform } = await params;
        const { searchParams } = new URL(request.url);

        // 1. Get OAuth params
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // 2. Check for OAuth errors
        if (error) {
            console.error(`OAuth error from ${platform}:`, error, errorDescription);
            return NextResponse.redirect(
                new URL(
                    `/dashboard/settings?error=${encodeURIComponent(errorDescription || error)}&platform=${platform}`,
                    request.url
                )
            );
        }

        if (!code) {
            return NextResponse.redirect(
                new URL(
                    `/dashboard/settings?error=missing_code&platform=${platform}`,
                    request.url
                )
            );
        }

        // 3. Verify state (CSRF protection)
        const storedState = request.cookies.get("oauth_state")?.value;
        const userId = request.cookies.get("oauth_user")?.value;

        if (!storedState || storedState !== state) {
            return NextResponse.redirect(
                new URL(
                    `/dashboard/settings?error=invalid_state&platform=${platform}`,
                    request.url
                )
            );
        }

        if (!userId) {
            return NextResponse.redirect(
                new URL(
                    `/login?callbackUrl=${encodeURIComponent(`/api/social/connect/${platform}`)}`,
                    request.url
                )
            );
        }

        // 4. Exchange code for token based on platform
        try {
            switch (platform as Platform) {
                case "tiktok":
                    await tiktokAPI.handleCallback(code, userId);
                    break;
                case "facebook":
                    await facebookAPI.handleCallback(code, userId);
                    break;
                case "youtube":
                    await youtubeAPI.handleCallback(code, userId);
                    break;
                default:
                    throw new Error(`Unsupported platform: ${platform}`);
            }
        } catch (tokenError) {
            console.error(`Token exchange error for ${platform}:`, tokenError);
            return NextResponse.redirect(
                new URL(
                    `/dashboard/settings?error=token_exchange_failed&platform=${platform}`,
                    request.url
                )
            );
        }

        // 5. Clear OAuth cookies
        const response = NextResponse.redirect(
            new URL(
                `/dashboard/settings?connected=${platform}&success=true`,
                request.url
            )
        );

        response.cookies.delete("oauth_state");
        response.cookies.delete("oauth_user");

        return response;
    } catch (error) {
        console.error("Social callback error:", error);

        const { platform } = await params;

        return NextResponse.redirect(
            new URL(
                `/dashboard/settings?error=unknown_error&platform=${platform}`,
                request.url
            )
        );
    }
}
