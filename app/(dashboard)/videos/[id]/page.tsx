"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { VideoPlayer } from "@/components/video-detail/VideoPlayer";
import { VideoInfo } from "@/components/video-detail/VideoInfo";
import { VideoActions } from "@/components/video-detail/VideoActions";
import { AdvancedPublishingForm } from "@/components/video-detail/AdvancedPublishingForm";
import { PublishSuccess } from "@/components/video-detail/PublishSuccess";
import { Loader2, AlertCircle } from "lucide-react";

interface VideoData {
    id: string;
    title: string;
    status: string;
    public_url: string;
    thumbnail_url: string;
    script: string;
    duration: number;
    file_size: number;
    resolution: string;
    aspect_ratio: string;
    camera_angles: string[];
    models: { text: string; video: string; tts: string };
    product: {
        id: string;
        name: string;
        price: number;
        tiktok_product_id: string;
        images: string[];
    };
    posts: Array<{
        id: string;
        platform: string;
        status: string;
        post_url: string;
        posted_at: string;
    }>;
    created_at: string;
}

interface PublishResult {
    platform: string;
    success: boolean;
    postId?: string;
    postUrl?: string;
    error?: string;
}

interface SocialStatus {
    tiktok: boolean;
    facebook: boolean;
    youtube: boolean;
}

export default function VideoDetailPage() {
    const params = useParams();
    const router = useRouter();
    const videoId = params.id as string;

    const [video, setVideo] = useState<VideoData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [publishResults, setPublishResults] = useState<PublishResult[] | null>(null);
    const [socialStatus, setSocialStatus] = useState<SocialStatus>({
        tiktok: false,
        facebook: false,
        youtube: false,
    });

    // Fetch video data
    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const res = await fetch(`/api/videos/${videoId}`);
                if (!res.ok) throw new Error("ไม่พบวิดีโอ");
                const data = await res.json();
                setVideo(data.video);
            } catch (err) {
                setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
            } finally {
                setIsLoading(false);
            }
        };

        if (videoId) fetchVideo();
    }, [videoId]);

    // Fetch social media status
    useEffect(() => {
        const fetchSocialStatus = async () => {
            try {
                const res = await fetch("/api/social/status");
                if (res.ok) {
                    const data = await res.json();
                    setSocialStatus({
                        tiktok: data.tiktok?.connected || false,
                        facebook: data.facebook?.connected || false,
                        youtube: data.youtube?.connected || false,
                    });
                }
            } catch (err) {
                console.error("Failed to fetch social status:", err);
            }
        };

        fetchSocialStatus();
    }, []);

    // Handle publish
    const handlePublish = async (publishData: unknown) => {
        try {
            const res = await fetch("/api/posts/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(publishData),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "เกิดข้อผิดพลาด");
            }

            // Check if scheduled or posted immediately
            if ((publishData as { scheduleAt?: string }).scheduleAt) {
                // Scheduled post
                router.push("/dashboard/posts?tab=scheduled");
            } else {
                // Posted immediately
                setPublishResults(result.results);
            }
        } catch (err) {
            throw err;
        }
    };

    // Handle save draft
    const handleSaveDraft = (draftData: unknown) => {
        console.log("Saving draft:", draftData);
        // TODO: Implement save draft to local storage or database
    };

    // Reset publish state
    const handleReset = () => {
        setPublishResults(null);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    // Error state
    if (error || !video) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {error || "ไม่พบวิดีโอ"}
                </h2>
                <p className="text-gray-500">กรุณาตรวจสอบ URL หรือลองใหม่</p>
            </div>
        );
    }

    // Show publish success
    if (publishResults) {
        return (
            <PublishSuccess
                video={video}
                results={publishResults}
                onReset={handleReset}
            />
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {video.product?.name || video.title}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        สร้างเมื่อ {new Date(video.created_at).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Video Player & Info */}
                <div className="space-y-6">
                    <VideoPlayer
                        url={video.public_url}
                        thumbnail={video.thumbnail_url}
                        aspectRatio={video.aspect_ratio}
                    />

                    <VideoInfo
                        duration={video.duration}
                        fileSize={video.file_size}
                        resolution={video.resolution}
                        script={video.script}
                        cameraAngles={video.camera_angles}
                        models={video.models}
                    />

                    <VideoActions
                        video={video}
                    />
                </div>

                {/* Right: Publishing Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        📤 เผยแพร่วิดีโอ
                    </h2>
                    <AdvancedPublishingForm
                        video={{
                            id: video.id,
                            title: video.title,
                            public_url: video.public_url,
                            product_id: video.product?.id,
                            duration: video.duration,
                        }}
                        tiktokProductId={video.product?.tiktok_product_id}
                        socialStatus={socialStatus}
                        onPublish={handlePublish}
                        onSaveDraft={handleSaveDraft}
                    />
                </div>
            </div>
        </div>
    );
}

