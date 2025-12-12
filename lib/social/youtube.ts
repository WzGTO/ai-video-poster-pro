import { google, youtube_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { Readable } from "stream";
import { logger } from "@/lib/logger";

// Types
export interface YouTubeUploadParams {
    videoUrl: string;
    title: string;
    description: string;
    tags: string[];
    videoType?: "short" | "regular";
    categoryId?: string;
    privacyStatus?: "public" | "private" | "unlisted";
}

export interface YouTubePostResult {
    success: boolean;
    postId?: string;
    postUrl?: string;
    platform: "youtube";
    videoType: "short" | "regular";
    error?: string;
}

export interface YouTubeChannel {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    subscriberCount: number;
    videoCount: number;
}

/**
 * YouTube API Service
 * จัดการการอัปโหลดวิดีโอไปยัง YouTube และ YouTube Shorts
 */
export class YouTubeAPI {
    private youtube: youtube_v3.Youtube;
    private auth: OAuth2Client;

    constructor(accessToken: string, refreshToken?: string) {
        this.auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        this.auth.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        this.youtube = google.youtube({ version: "v3", auth: this.auth });
    }

    /**
     * ดาวน์โหลดวิดีโอจาก URL และสร้าง stream
     */
    private async downloadVideo(videoUrl: string): Promise<Readable> {
        const response = await fetch(videoUrl);

        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        return Readable.from(buffer);
    }

    /**
     * อัปโหลดวิดีโอไปยัง YouTube
     */
    async uploadVideo(params: YouTubeUploadParams): Promise<YouTubePostResult> {
        const {
            videoUrl,
            title,
            description,
            tags,
            videoType = "short",
            categoryId = "22", // People & Blogs
            privacyStatus = "public",
        } = params;

        try {
            logger.info("Starting YouTube upload", { title, videoType });

            // ดาวน์โหลดวิดีโอ
            const videoStream = await this.downloadVideo(videoUrl);

            // เตรียม metadata
            let finalTitle = title;
            let finalDescription = description;

            // ถ้าเป็น Short: เพิ่ม #Shorts ใน title และ description
            if (videoType === "short") {
                if (!finalTitle.includes("#Shorts")) {
                    finalTitle = `${finalTitle} #Shorts`.slice(0, 100); // YouTube title limit
                }
                if (!finalDescription.includes("#Shorts")) {
                    finalDescription = `#Shorts\n${finalDescription}`;
                }
            }

            // อัปโหลด
            const response = await this.youtube.videos.insert({
                part: ["snippet", "status"],
                requestBody: {
                    snippet: {
                        title: finalTitle,
                        description: finalDescription,
                        tags: tags,
                        categoryId: categoryId,
                    },
                    status: {
                        privacyStatus: privacyStatus,
                        selfDeclaredMadeForKids: false,
                    },
                },
                media: {
                    body: videoStream,
                },
            });

            const videoId = response.data.id;

            if (!videoId) {
                throw new Error("Failed to get video ID from YouTube response");
            }

            const postUrl =
                videoType === "short"
                    ? `https://youtube.com/shorts/${videoId}`
                    : `https://www.youtube.com/watch?v=${videoId}`;

            logger.info("YouTube upload successful", { videoId, postUrl });

            return {
                success: true,
                postId: videoId,
                postUrl: postUrl,
                platform: "youtube",
                videoType: videoType,
            };
        } catch (error) {
            logger.error("YouTube upload failed", error);

            return {
                success: false,
                platform: "youtube",
                videoType: videoType,
                error: error instanceof Error ? error.message : "Upload failed",
            };
        }
    }

    /**
     * ดึงข้อมูล channel ของผู้ใช้
     */
    async getChannel(): Promise<YouTubeChannel | null> {
        try {
            const response = await this.youtube.channels.list({
                part: ["snippet", "statistics"],
                mine: true,
            });

            const channel = response.data.items?.[0];
            if (!channel) return null;

            return {
                id: channel.id || "",
                title: channel.snippet?.title || "",
                description: channel.snippet?.description || "",
                thumbnailUrl: channel.snippet?.thumbnails?.default?.url || "",
                subscriberCount: parseInt(channel.statistics?.subscriberCount || "0"),
                videoCount: parseInt(channel.statistics?.videoCount || "0"),
            };
        } catch (error) {
            logger.error("Failed to fetch YouTube channel", error);
            return null;
        }
    }

    /**
     * ตรวจสอบสถานะการอัปโหลด
     */
    async getVideoStatus(videoId: string): Promise<string | null> {
        try {
            const response = await this.youtube.videos.list({
                part: ["status", "processingDetails"],
                id: [videoId],
            });

            const video = response.data.items?.[0];
            if (!video) return null;

            return video.status?.uploadStatus || null;
        } catch (error) {
            logger.error("Failed to get video status", error);
            return null;
        }
    }

    /**
     * ดึงรายการวิดีโอจาก channel
     */
    async getVideos(maxResults: number = 10) {
        try {
            const response = await this.youtube.search.list({
                part: ["snippet"],
                forMine: true,
                type: ["video"],
                maxResults: maxResults,
                order: "date",
            });

            return response.data.items?.map((item) => ({
                id: item.id?.videoId,
                title: item.snippet?.title,
                description: item.snippet?.description,
                thumbnailUrl: item.snippet?.thumbnails?.medium?.url,
                publishedAt: item.snippet?.publishedAt,
            }));
        } catch (error) {
            logger.error("Failed to fetch videos", error);
            return [];
        }
    }

    /**
     * ดึงสถิติของวิดีโอ
     */
    async getVideoStats(videoId: string) {
        try {
            const response = await this.youtube.videos.list({
                part: ["statistics"],
                id: [videoId],
            });

            const stats = response.data.items?.[0]?.statistics;
            if (!stats) return null;

            return {
                viewCount: parseInt(stats.viewCount || "0"),
                likeCount: parseInt(stats.likeCount || "0"),
                commentCount: parseInt(stats.commentCount || "0"),
            };
        } catch (error) {
            logger.error("Failed to get video stats", error);
            return null;
        }
    }
}

// Export singleton factory
export function createYouTubeAPI(accessToken: string, refreshToken?: string) {
    return new YouTubeAPI(accessToken, refreshToken);
}
