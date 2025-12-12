import { logger } from "@/lib/logger";

// Types
export interface FacebookPostParams {
    videoUrl: string;
    caption: string;
    targetType?: "page" | "profile";
    targetId?: string; // page_id (ถ้าเป็น page)
    pageAccessToken?: string; // page access token
    videoType?: "reel" | "regular";
}

export interface FacebookPostResult {
    success: boolean;
    postId?: string;
    postUrl?: string;
    platform: "facebook";
    targetType: "page" | "profile";
    videoType: "reel" | "regular";
    error?: string;
}

export interface FacebookPage {
    id: string;
    name: string;
    category: string;
    accessToken: string;
    pictureUrl?: string;
}

export interface FacebookUserInfo {
    id: string;
    name: string;
    email?: string;
    picture?: string;
}

/**
 * Facebook API Service
 * จัดการการโพสต์วิดีโอไปยัง Facebook Pages และ Reels
 */
export class FacebookAPI {
    private accessToken: string;
    private apiVersion = "v18.0";
    private baseUrl = "https://graph.facebook.com";

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    /**
     * Facebook Graph API request helper
     */
    private async graphRequest(
        endpoint: string,
        method: "GET" | "POST" = "GET",
        body?: Record<string, unknown>
    ) {
        const url = `${this.baseUrl}/${this.apiVersion}${endpoint}`;

        const options: RequestInit = {
            method,
            headers: {
                "Content-Type": "application/json",
            },
        };

        if (method === "POST" && body) {
            options.body = JSON.stringify({
                ...body,
                access_token: this.accessToken,
            });
        }

        const separator = endpoint.includes("?") ? "&" : "?";
        const requestUrl =
            method === "GET" ? `${url}${separator}access_token=${this.accessToken}` : url;

        const response = await fetch(requestUrl, options);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || "Facebook API error");
        }

        return data;
    }

    /**
     * ดาวน์โหลดวิดีโอจาก URL
     */
    private async downloadVideo(videoUrl: string): Promise<Buffer> {
        const response = await fetch(videoUrl);

        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }

        return Buffer.from(await response.arrayBuffer());
    }

    /**
     * โพสต์วิดีโอไปยัง Facebook Page หรือ Profile
     */
    async postVideo(params: FacebookPostParams): Promise<FacebookPostResult> {
        const {
            videoUrl,
            caption,
            targetType = "page",
            targetId,
            pageAccessToken,
            videoType = "reel",
        } = params;

        try {
            logger.info("Starting Facebook video upload", { targetType, videoType });

            // ใช้ page access token ถ้าเป็นการโพสต์ไปยัง page
            const token = targetType === "page" && pageAccessToken ? pageAccessToken : this.accessToken;

            let endpoint: string;
            let response: { id?: string; post_id?: string };

            if (targetType === "page" && targetId) {
                if (videoType === "reel") {
                    // Facebook Reels - ใช้ Resumable Upload API
                    response = await this.uploadReelToPage(targetId, videoUrl, caption, token);
                } else {
                    // Regular video to page
                    response = await this.uploadVideoToPage(targetId, videoUrl, caption, token);
                }
            } else {
                // โพสต์ไปยัง Profile
                endpoint = videoType === "reel" ? "/me/video_reels" : "/me/videos";
                response = await this.uploadVideoToEndpoint(endpoint, videoUrl, caption, token);
            }

            const postId = response.id || response.post_id || "";
            const postUrl = this.buildPostUrl(targetType, targetId, postId);

            logger.info("Facebook upload successful", { postId, postUrl });

            return {
                success: true,
                postId,
                postUrl,
                platform: "facebook",
                targetType,
                videoType,
            };
        } catch (error) {
            logger.error("Facebook upload failed", error);

            return {
                success: false,
                platform: "facebook",
                targetType,
                videoType,
                error: error instanceof Error ? error.message : "Upload failed",
            };
        }
    }

    /**
     * อัปโหลด Reel ไปยัง Page (Resumable Upload)
     */
    private async uploadReelToPage(
        pageId: string,
        videoUrl: string,
        caption: string,
        accessToken: string
    ): Promise<{ id?: string }> {
        // Step 1: Initialize upload session
        const initUrl = `${this.baseUrl}/${this.apiVersion}/${pageId}/video_reels`;
        const initResponse = await fetch(initUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                upload_phase: "start",
                access_token: accessToken,
            }),
        });

        const initData = await initResponse.json();
        if (initData.error) throw new Error(initData.error.message);

        const videoId = initData.video_id;
        const uploadUrl = initData.upload_url;

        // Step 2: Upload video file
        const videoBuffer = await this.downloadVideo(videoUrl);

        const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                Authorization: `OAuth ${accessToken}`,
                file_url: videoUrl,
            },
            body: videoBuffer,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.error) throw new Error(uploadData.error.message);

        // Step 3: Finish upload
        const finishUrl = `${this.baseUrl}/${this.apiVersion}/${pageId}/video_reels`;
        const finishResponse = await fetch(finishUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                upload_phase: "finish",
                video_id: videoId,
                video_state: "PUBLISHED",
                description: caption,
                access_token: accessToken,
            }),
        });

        const finishData = await finishResponse.json();
        if (finishData.error) throw new Error(finishData.error.message);

        return { id: finishData.post_id || videoId };
    }

    /**
     * อัปโหลด Video ปกติไปยัง Page
     */
    private async uploadVideoToPage(
        pageId: string,
        videoUrl: string,
        caption: string,
        accessToken: string
    ): Promise<{ id?: string }> {
        const url = `${this.baseUrl}/${this.apiVersion}/${pageId}/videos`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                file_url: videoUrl,
                description: caption,
                access_token: accessToken,
            }),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        return { id: data.id };
    }

    /**
     * อัปโหลด Video ไปยัง endpoint ที่กำหนด
     */
    private async uploadVideoToEndpoint(
        endpoint: string,
        videoUrl: string,
        caption: string,
        accessToken: string
    ): Promise<{ id?: string; post_id?: string }> {
        const url = `${this.baseUrl}/${this.apiVersion}${endpoint}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                file_url: videoUrl,
                description: caption,
                access_token: accessToken,
            }),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        return data;
    }

    /**
     * สร้าง URL ของโพสต์
     */
    private buildPostUrl(
        targetType: "page" | "profile",
        targetId: string | undefined,
        postId: string
    ): string {
        if (targetType === "page" && targetId) {
            return `https://facebook.com/${targetId}/videos/${postId}`;
        }
        return `https://facebook.com/${postId}`;
    }

    /**
     * ดึงรายการ Pages ที่ผู้ใช้จัดการ
     */
    async getPages(): Promise<FacebookPage[]> {
        try {
            const data = await this.graphRequest("/me/accounts?fields=id,name,category,access_token,picture");

            return (data.data || []).map((page: Record<string, unknown>) => ({
                id: page.id as string,
                name: page.name as string,
                category: page.category as string,
                accessToken: page.access_token as string,
                pictureUrl: (page.picture as Record<string, Record<string, string>>)?.data?.url,
            }));
        } catch (error) {
            logger.error("Failed to fetch Facebook pages", error);
            return [];
        }
    }

    /**
     * ดึงข้อมูลผู้ใช้
     */
    async getUserInfo(): Promise<FacebookUserInfo | null> {
        try {
            const data = await this.graphRequest("/me?fields=id,name,email,picture");

            return {
                id: data.id,
                name: data.name,
                email: data.email,
                picture: data.picture?.data?.url,
            };
        } catch (error) {
            logger.error("Failed to fetch user info", error);
            return null;
        }
    }

    /**
     * ดึงสถิติของโพสต์
     */
    async getPostInsights(postId: string) {
        try {
            const data = await this.graphRequest(
                `/${postId}/insights?metric=post_impressions,post_engaged_users,post_reactions_by_type_total`
            );

            const metrics: Record<string, number> = {};
            for (const item of data.data || []) {
                metrics[item.name] = item.values?.[0]?.value || 0;
            }

            return metrics;
        } catch (error) {
            logger.error("Failed to fetch post insights", error);
            return null;
        }
    }

    /**
     * ยืดอายุ access token (long-lived token)
     */
    async exchangeForLongLivedToken(): Promise<{ accessToken: string; expiresIn: number } | null> {
        try {
            const url =
                `${this.baseUrl}/${this.apiVersion}/oauth/access_token?` +
                `grant_type=fb_exchange_token&` +
                `client_id=${process.env.FACEBOOK_APP_ID}&` +
                `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
                `fb_exchange_token=${this.accessToken}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) throw new Error(data.error.message);

            return {
                accessToken: data.access_token,
                expiresIn: data.expires_in,
            };
        } catch (error) {
            logger.error("Failed to exchange token", error);
            return null;
        }
    }
}

// Export factory function
export function createFacebookAPI(accessToken: string) {
    return new FacebookAPI(accessToken);
}
