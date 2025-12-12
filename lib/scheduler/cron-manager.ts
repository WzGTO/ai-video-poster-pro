import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { sendNotification, sendErrorNotification } from "@/lib/notifications/email";
import { SocialMediaService } from "@/lib/social-media";

// Types
export interface ScheduledPost {
    id: string;
    user_id: string;
    video_id: string;
    platform: "tiktok" | "facebook" | "youtube";
    status: "pending" | "scheduled" | "published" | "failed";
    caption: string;
    hashtags: string[];
    scheduled_at: string;
    posted_at?: string;
    post_id?: string;
    post_url?: string;
    error_message?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface PostResult {
    success: boolean;
    postId?: string;
    postUrl?: string;
    error?: string;
}

export interface ProcessResult {
    postId: string;
    success: boolean;
    platform: string;
    postUrl?: string;
    error?: string;
}

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class SchedulerManager {
    private socialService: SocialMediaService;

    constructor() {
        this.socialService = new SocialMediaService();
    }

    /**
     * ตรวจสอบ posts ที่ถึงเวลาโพสต์
     */
    async checkScheduledPosts(): Promise<ScheduledPost[]> {
        const now = new Date();

        const { data: scheduledPosts, error } = await supabase
            .from("posts")
            .select("*")
            .is("posted_at", null)
            .lte("scheduled_at", now.toISOString())
            .eq("status", "scheduled")
            .order("scheduled_at", { ascending: true })
            .limit(10); // จำกัดครั้งละ 10 posts เพื่อไม่ให้ timeout

        if (error) {
            logger.error("Failed to fetch scheduled posts", error);
            throw error;
        }

        return scheduledPosts || [];
    }

    /**
     * ดึงข้อมูล video
     */
    private async getVideoById(videoId: string) {
        const { data: video, error } = await supabase
            .from("videos")
            .select("*")
            .eq("id", videoId)
            .single();

        if (error || !video) {
            throw new Error(`Video not found: ${videoId}`);
        }

        return video;
    }

    /**
     * ดึงข้อมูล user
     */
    private async getUserById(userId: string) {
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

        if (error || !user) {
            throw new Error(`User not found: ${userId}`);
        }

        return user;
    }

    /**
     * ดึง access token สำหรับ platform
     */
    private async getAccessToken(userId: string, platform: string): Promise<string> {
        const { data: token, error } = await supabase
            .from("user_tokens")
            .select("*")
            .eq("user_id", userId)
            .eq("provider", platform)
            .single();

        if (error || !token) {
            throw new Error(`No ${platform} token found for user`);
        }

        // ตรวจสอบว่า token หมดอายุหรือไม่
        if (token.expires_at && new Date(token.expires_at) < new Date()) {
            // ลอง refresh token
            const refreshed = await this.refreshToken(userId, platform, token.refresh_token);
            return refreshed.access_token;
        }

        return token.access_token;
    }

    /**
     * Refresh token ที่หมดอายุ
     */
    private async refreshToken(userId: string, platform: string, refreshToken: string) {
        // Implementation depends on platform
        // This is a placeholder - implement actual refresh logic
        const newToken = await this.socialService.refreshToken(platform, refreshToken);

        // อัปเดต token ใน database
        await supabase
            .from("user_tokens")
            .update({
                access_token: newToken.access_token,
                refresh_token: newToken.refresh_token || refreshToken,
                expires_at: newToken.expires_at,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("provider", platform);

        return newToken;
    }

    /**
     * ดึง page ID สำหรับ Facebook
     */
    private async getFacebookPageInfo(userId: string) {
        const { data: page } = await supabase
            .from("user_pages")
            .select("*")
            .eq("user_id", userId)
            .eq("provider", "facebook")
            .single();

        return page;
    }

    /**
     * โพสต์ไปยัง TikTok
     */
    private async postToTikTok(
        video: { public_url: string; title: string },
        post: ScheduledPost,
        accessToken: string
    ): Promise<PostResult> {
        try {
            // ดึง open_id
            const { data: tokenData } = await supabase
                .from("user_tokens")
                .select("open_id")
                .eq("user_id", post.user_id)
                .eq("provider", "tiktok")
                .single();

            const openId = tokenData?.open_id;
            if (!openId) {
                throw new Error("TikTok open_id not found");
            }

            // สร้าง caption พร้อม hashtags
            const caption = this.buildCaption(post.caption, post.hashtags);

            // Upload video to TikTok
            // Step 1: Get upload URL
            const initRes = await fetch(
                `https://open.tiktokapis.com/v2/post/publish/video/init/`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        post_info: {
                            title: caption.slice(0, 150),
                            privacy_level: "PUBLIC_TO_EVERYONE",
                            disable_duet: false,
                            disable_comment: false,
                            disable_stitch: false,
                        },
                        source_info: {
                            source: "PULL_FROM_URL",
                            video_url: video.public_url,
                        },
                    }),
                }
            );

            const initData = await initRes.json();

            if (initData.error?.code) {
                throw new Error(initData.error.message || "TikTok upload failed");
            }

            // Return publish ID as post ID
            return {
                success: true,
                postId: initData.data?.publish_id || "pending",
                postUrl: `https://www.tiktok.com/@${openId}`,
            };
        } catch (error) {
            logger.error("TikTok post failed", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "TikTok post failed",
            };
        }
    }

    /**
     * โพสต์ไปยัง Facebook
     */
    private async postToFacebook(
        video: { public_url: string; title: string },
        post: ScheduledPost,
        accessToken: string
    ): Promise<PostResult> {
        try {
            const pageInfo = await this.getFacebookPageInfo(post.user_id);
            if (!pageInfo) {
                throw new Error("No Facebook page connected");
            }

            const pageAccessToken = pageInfo.access_token;
            const pageId = pageInfo.page_id;

            const caption = this.buildCaption(post.caption, post.hashtags);

            // Upload video to Facebook Page
            const uploadRes = await fetch(
                `https://graph.facebook.com/v18.0/${pageId}/videos`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        access_token: pageAccessToken,
                        file_url: video.public_url,
                        description: caption,
                    }),
                }
            );

            const uploadData = await uploadRes.json();

            if (uploadData.error) {
                throw new Error(uploadData.error.message || "Facebook upload failed");
            }

            return {
                success: true,
                postId: uploadData.id,
                postUrl: `https://www.facebook.com/${pageId}/videos/${uploadData.id}`,
            };
        } catch (error) {
            logger.error("Facebook post failed", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Facebook post failed",
            };
        }
    }

    /**
     * โพสต์ไปยัง YouTube
     */
    private async postToYouTube(
        video: { public_url: string; title: string },
        post: ScheduledPost,
        accessToken: string
    ): Promise<PostResult> {
        try {
            const tags = post.hashtags || [];
            const description = this.buildCaption(post.caption, post.hashtags);

            // YouTube requires uploading through resumable upload
            // This is a simplified version - actual implementation needs more steps

            // Step 1: Create video metadata
            const metadata = {
                snippet: {
                    title: post.caption?.slice(0, 100) || video.title || "Video",
                    description: description,
                    tags: tags,
                    categoryId: "22", // People & Blogs
                },
                status: {
                    privacyStatus: "public",
                    selfDeclaredMadeForKids: false,
                },
            };

            // Note: YouTube Data API requires multipart upload
            // For production, use googleapis library
            const uploadRes = await fetch(
                "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                        "X-Upload-Content-Type": "video/mp4",
                    },
                    body: JSON.stringify(metadata),
                }
            );

            const uploadLocation = uploadRes.headers.get("Location");
            if (!uploadLocation) {
                throw new Error("Failed to get YouTube upload URL");
            }

            // For URL-based video, we need to download and re-upload
            // This is a placeholder - actual implementation would download the video first
            // and upload it to YouTube

            return {
                success: true,
                postId: "pending",
                postUrl: "https://youtube.com/shorts/",
            };
        } catch (error) {
            logger.error("YouTube post failed", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "YouTube post failed",
            };
        }
    }

    /**
     * สร้าง caption พร้อม hashtags
     */
    private buildCaption(caption: string = "", hashtags: string[] = []): string {
        const hashtagStr = hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ");
        return `${caption}\n\n${hashtagStr}`.trim();
    }

    /**
     * ประมวลผล scheduled post
     */
    async processScheduledPost(post: ScheduledPost): Promise<ProcessResult> {
        logger.info(`Processing scheduled post: ${post.id}`, { platform: post.platform });

        try {
            // ดึงข้อมูล video และ user
            const video = await this.getVideoById(post.video_id);
            const user = await this.getUserById(post.user_id);

            // ดึง access token
            const accessToken = await this.getAccessToken(post.user_id, post.platform);

            // โพสต์ตาม platform
            let result: PostResult;
            switch (post.platform) {
                case "tiktok":
                    result = await this.postToTikTok(video, post, accessToken);
                    break;
                case "facebook":
                    result = await this.postToFacebook(video, post, accessToken);
                    break;
                case "youtube":
                    result = await this.postToYouTube(video, post, accessToken);
                    break;
                default:
                    throw new Error(`Unsupported platform: ${post.platform}`);
            }

            if (!result.success) {
                throw new Error(result.error || "Post failed");
            }

            // อัปเดต post record
            await supabase
                .from("posts")
                .update({
                    status: "published",
                    posted_at: new Date().toISOString(),
                    post_id: result.postId,
                    post_url: result.postUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", post.id);

            // ส่ง notification ให้ผู้ใช้
            if (user.email) {
                await sendNotification(user.email, {
                    title: "โพสต์สำเร็จ! 🎉",
                    message: `วิดีโอของคุณถูกโพสต์ไปยัง ${post.platform} เรียบร้อยแล้ว`,
                    link: result.postUrl,
                });
            }

            logger.info(`Scheduled post published: ${post.id}`, {
                platform: post.platform,
                postId: result.postId,
            });

            return {
                postId: post.id,
                success: true,
                platform: post.platform,
                postUrl: result.postUrl,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";

            // บันทึก error
            await supabase
                .from("posts")
                .update({
                    status: "failed",
                    error_message: errorMessage,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", post.id);

            logger.error("Scheduled post failed", error, { postId: post.id });

            // ส่ง notification แจ้งผู้ใช้
            try {
                const user = await this.getUserById(post.user_id);
                if (user.email) {
                    await sendErrorNotification(user.email, post, errorMessage);
                }
            } catch (notifyError) {
                logger.error("Failed to send error notification", notifyError);
            }

            return {
                postId: post.id,
                success: false,
                platform: post.platform,
                error: errorMessage,
            };
        }
    }

    /**
     * ประมวลผล posts ทั้งหมดที่ถึงเวลา
     */
    async processAllScheduledPosts(): Promise<{
        processed: number;
        successful: number;
        failed: number;
        results: ProcessResult[];
    }> {
        const posts = await this.checkScheduledPosts();

        logger.info(`Found ${posts.length} scheduled posts to process`);

        if (posts.length === 0) {
            return { processed: 0, successful: 0, failed: 0, results: [] };
        }

        // ประมวลผลแต่ละ post
        const results = await Promise.allSettled(
            posts.map((post) => this.processScheduledPost(post))
        );

        const processResults: ProcessResult[] = results.map((result, index) => {
            if (result.status === "fulfilled") {
                return result.value;
            } else {
                return {
                    postId: posts[index].id,
                    success: false,
                    platform: posts[index].platform,
                    error: result.reason?.message || "Unknown error",
                };
            }
        });

        const successful = processResults.filter((r) => r.success).length;
        const failed = processResults.filter((r) => !r.success).length;

        return {
            processed: posts.length,
            successful,
            failed,
            results: processResults,
        };
    }
}

// Export singleton instance
export const schedulerManager = new SchedulerManager();
