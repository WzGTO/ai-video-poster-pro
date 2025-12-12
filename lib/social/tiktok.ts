// TikTok API Integration
// OAuth, Content Posting, and TikTok Shop

import { supabase } from "@/lib/supabase";

// ===== Types =====

export interface TikTokAccessToken {
    access_token: string;
    refresh_token: string;
    open_id: string;
    scope: string;
    expires_in: number;
    refresh_expires_in: number;
}

export interface TikTokPostParams {
    videoUrl: string;
    caption: string;
    hashtags?: string[];
    productId?: string; // TikTok Shop product ID
    privacyLevel?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
}

export interface TikTokPostResult {
    postId: string;
    postUrl: string;
    publishId: string;
    status: "PROCESSING" | "PUBLISHED" | "FAILED";
}

export interface TikTokAnalytics {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    cartClicks?: number;
    purchaseAmount?: number;
}

// ===== Constants =====

const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_API_URL = "https://open.tiktokapis.com/v2";

// ===== TikTok API Class =====

export class TikTokAPI {
    private clientKey: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientKey = process.env.TIKTOK_CLIENT_KEY || "";
        this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || "";
        this.redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/tiktok`;

        if (!this.clientKey || !this.clientSecret) {
            console.warn("TikTok API credentials not configured");
        }
    }

    /**
     * Get OAuth URL to connect TikTok account
     */
    connectAccount(state: string): string {
        const scopes = [
            "user.info.basic",
            "video.publish",
            "video.upload",
        ].join(",");

        const params = new URLSearchParams({
            client_key: this.clientKey,
            scope: scopes,
            response_type: "code",
            redirect_uri: this.redirectUri,
            state,
        });

        return `${TIKTOK_AUTH_URL}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async handleCallback(
        code: string,
        userId: string
    ): Promise<TikTokAccessToken> {
        const response = await fetch(TIKTOK_TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                code,
                grant_type: "authorization_code",
                redirect_uri: this.redirectUri,
            }),
        });

        if (!response.ok) {
            throw new Error(`TikTok token exchange failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`TikTok auth error: ${data.error_description}`);
        }

        const tokenData: TikTokAccessToken = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            open_id: data.open_id,
            scope: data.scope,
            expires_in: data.expires_in,
            refresh_expires_in: data.refresh_expires_in,
        };

        // Store token in database
        await this.storeToken(userId, tokenData);

        return tokenData;
    }

    /**
     * Post video to TikTok
     */
    async postVideo(
        accessToken: string,
        params: TikTokPostParams
    ): Promise<TikTokPostResult> {
        const { videoUrl, caption, hashtags = [], productId, privacyLevel } = params;

        // Build caption with hashtags
        const fullCaption = [
            caption,
            ...hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)),
        ].join(" ");

        try {
            // Step 1: Initialize video upload
            const initResponse = await fetch(
                `${TIKTOK_API_URL}/post/publish/video/init/`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        post_info: {
                            title: fullCaption.slice(0, 150),
                            privacy_level: privacyLevel || "PUBLIC_TO_EVERYONE",
                            disable_duet: false,
                            disable_stitch: false,
                            disable_comment: false,
                            video_cover_timestamp_ms: 1000,
                        },
                        source_info: {
                            source: "PULL_FROM_URL",
                            video_url: videoUrl,
                        },
                    }),
                }
            );

            if (!initResponse.ok) {
                throw new Error(`TikTok upload init failed: ${initResponse.statusText}`);
            }

            const initData = await initResponse.json();

            if (initData.error.code !== "ok") {
                throw new Error(`TikTok error: ${initData.error.message}`);
            }

            const publishId = initData.data.publish_id;

            // Step 2: Check publish status
            const statusResult = await this.checkPublishStatus(accessToken, publishId);

            // Step 3: If productId provided, add to shopping cart
            if (productId && statusResult.postId) {
                await this.addProductToVideo(accessToken, statusResult.postId, productId);
            }

            return statusResult;
        } catch (error) {
            console.error("TikTok post error:", error);
            throw new Error(
                `Failed to post to TikTok: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    }

    /**
     * Check video publish status
     */
    private async checkPublishStatus(
        accessToken: string,
        publishId: string,
        maxAttempts: number = 30
    ): Promise<TikTokPostResult> {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const response = await fetch(
                `${TIKTOK_API_URL}/post/publish/status/fetch/`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ publish_id: publishId }),
                }
            );

            const data = await response.json();

            if (data.error.code !== "ok") {
                throw new Error(`TikTok status check failed: ${data.error.message}`);
            }

            const status = data.data.status;

            if (status === "PUBLISH_COMPLETE") {
                return {
                    postId: data.data.publicaly_available_post_id?.[0] || publishId,
                    postUrl: `https://www.tiktok.com/@user/video/${data.data.publicaly_available_post_id?.[0]}`,
                    publishId,
                    status: "PUBLISHED",
                };
            }

            if (status === "FAILED") {
                throw new Error(`TikTok publish failed: ${data.data.fail_reason}`);
            }

            // Wait before next check
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        return {
            postId: publishId,
            postUrl: "",
            publishId,
            status: "PROCESSING",
        };
    }

    /**
     * Add product to video (TikTok Shop)
     */
    private async addProductToVideo(
        accessToken: string,
        videoId: string,
        productId: string
    ): Promise<void> {
        // TODO: Implement TikTok Shop product tagging API
        console.log(`Adding product ${productId} to video ${videoId}`);
    }

    /**
     * Get video analytics
     */
    async getAnalytics(
        accessToken: string,
        videoId: string
    ): Promise<TikTokAnalytics> {
        try {
            const response = await fetch(`${TIKTOK_API_URL}/video/query/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    filters: {
                        video_ids: [videoId],
                    },
                    fields: [
                        "view_count",
                        "like_count",
                        "comment_count",
                        "share_count",
                    ],
                }),
            });

            const data = await response.json();

            if (data.error.code !== "ok") {
                throw new Error(`TikTok analytics error: ${data.error.message}`);
            }

            const video = data.data.videos?.[0];

            return {
                views: video?.view_count || 0,
                likes: video?.like_count || 0,
                comments: video?.comment_count || 0,
                shares: video?.share_count || 0,
            };
        } catch (error) {
            console.error("TikTok analytics error:", error);
            return { views: 0, likes: 0, comments: 0, shares: 0 };
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string): Promise<TikTokAccessToken> {
        const response = await fetch(TIKTOK_TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(`TikTok refresh error: ${data.error_description}`);
        }

        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            open_id: data.open_id,
            scope: data.scope,
            expires_in: data.expires_in,
            refresh_expires_in: data.refresh_expires_in,
        };
    }

    /**
     * Store token in database
     */
    private async storeToken(
        userId: string,
        token: TikTokAccessToken
    ): Promise<void> {
        const expiresAt = new Date(Date.now() + token.expires_in * 1000);

        await supabase.from("user_tokens").upsert({
            user_id: userId,
            provider: "tiktok",
            access_token: token.access_token,
            refresh_token: token.refresh_token,
            open_id: token.open_id,
            scope: token.scope,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
        });
    }

    /**
     * Get stored token for user
     */
    async getToken(userId: string): Promise<TikTokAccessToken | null> {
        const { data, error } = await supabase
            .from("user_tokens")
            .select("*")
            .eq("user_id", userId)
            .eq("provider", "tiktok")
            .single();

        if (error || !data) {
            return null;
        }

        // Check if token is expired
        if (new Date(data.expires_at) < new Date()) {
            // Try to refresh
            try {
                const newToken = await this.refreshToken(data.refresh_token);
                await this.storeToken(userId, newToken);
                return newToken;
            } catch {
                return null;
            }
        }

        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            open_id: data.open_id,
            scope: data.scope,
            expires_in: 0,
            refresh_expires_in: 0,
        };
    }
}

// Export singleton instance
export const tiktokAPI = new TikTokAPI();

// Export factory function
export function createTikTokAPI() {
    return new TikTokAPI();
}

// Additional types for consistency
export interface TikTokAccount {
    openId: string;
    displayName: string;
    avatarUrl: string;
    followerCount?: number;
}

