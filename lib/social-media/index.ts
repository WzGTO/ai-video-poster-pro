import { logger } from "@/lib/logger";

/**
 * Social Media Service
 * จัดการการเชื่อมต่อและโพสต์ไปยัง social media platforms
 */
export class SocialMediaService {
    /**
     * Refresh expired token
     */
    async refreshToken(
        platform: string,
        refreshToken: string
    ): Promise<{
        access_token: string;
        refresh_token?: string;
        expires_at?: string;
    }> {
        switch (platform) {
            case "tiktok":
                return this.refreshTikTokToken(refreshToken);
            case "facebook":
                return this.refreshFacebookToken(refreshToken);
            case "youtube":
                return this.refreshYouTubeToken(refreshToken);
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }

    /**
     * Refresh TikTok token
     */
    private async refreshTikTokToken(refreshToken: string) {
        const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_key: process.env.TIKTOK_CLIENT_KEY!,
                client_secret: process.env.TIKTOK_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
        });

        const data = await response.json();

        if (data.error) {
            logger.error("TikTok token refresh failed", data);
            throw new Error(data.error_description || "Token refresh failed");
        }

        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        };
    }

    /**
     * Refresh Facebook token
     * Facebook long-lived tokens don't need refresh, but we can extend them
     */
    private async refreshFacebookToken(accessToken: string) {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?` +
            new URLSearchParams({
                grant_type: "fb_exchange_token",
                client_id: process.env.FACEBOOK_APP_ID!,
                client_secret: process.env.FACEBOOK_APP_SECRET!,
                fb_exchange_token: accessToken,
            })
        );

        const data = await response.json();

        if (data.error) {
            logger.error("Facebook token refresh failed", data);
            throw new Error(data.error.message || "Token refresh failed");
        }

        return {
            access_token: data.access_token,
            expires_at: data.expires_in
                ? new Date(Date.now() + data.expires_in * 1000).toISOString()
                : undefined,
        };
    }

    /**
     * Refresh YouTube (Google) token
     */
    private async refreshYouTubeToken(refreshToken: string) {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
        });

        const data = await response.json();

        if (data.error) {
            logger.error("YouTube token refresh failed", data);
            throw new Error(data.error_description || "Token refresh failed");
        }

        return {
            access_token: data.access_token,
            refresh_token: refreshToken, // Google doesn't always return new refresh token
            expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        };
    }

    /**
     * ตรวจสอบสถานะ token
     */
    async validateToken(platform: string, accessToken: string): Promise<boolean> {
        try {
            switch (platform) {
                case "tiktok":
                    return this.validateTikTokToken(accessToken);
                case "facebook":
                    return this.validateFacebookToken(accessToken);
                case "youtube":
                    return this.validateYouTubeToken(accessToken);
                default:
                    return false;
            }
        } catch (error) {
            logger.error(`Token validation failed for ${platform}`, error);
            return false;
        }
    }

    private async validateTikTokToken(accessToken: string): Promise<boolean> {
        const response = await fetch(
            "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        return response.ok;
    }

    private async validateFacebookToken(accessToken: string): Promise<boolean> {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
        );
        return response.ok;
    }

    private async validateYouTubeToken(accessToken: string): Promise<boolean> {
        const response = await fetch(
            "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        return response.ok;
    }
}

// Export singleton instance
export const socialMediaService = new SocialMediaService();
