"use client";

import Link from "next/link";
import { Share2, Eye, Heart, MessageCircle, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePosts } from "@/lib/hooks/useSWR";

const PLATFORM_INFO = {
    tiktok: { icon: "🎵", color: "bg-gray-900 dark:bg-white dark:text-gray-900" },
    facebook: { icon: "📘", color: "bg-blue-600" },
    youtube: { icon: "📺", color: "bg-red-600" },
};

export function RecentPosts() {
    const { posts, isLoading } = usePosts({ limit: 5, recentOnly: true });

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);

        if (mins < 60) return `${mins} นาทีที่แล้ว`;
        if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
        if (days < 7) return `${days} วันที่แล้ว`;
        return date.toLocaleDateString("th-TH");
    };

    const formatNumber = (n: number) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toString();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-green-500" />
                    โพสต์ล่าสุด
                </h3>
                <Link href="/dashboard/posts" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    ดูทั้งหมด <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-8">
                    <Share2 className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-gray-500">ยังไม่มีโพสต์</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post: {
                        id: string;
                        platform: string;
                        caption: string;
                        post_url?: string;
                        posted_at: string;
                        views: number;
                        likes: number;
                        comments: number;
                    }) => {
                        const platform = PLATFORM_INFO[post.platform as keyof typeof PLATFORM_INFO] || { icon: "📱", color: "bg-gray-500" };

                        return (
                            <div key={post.id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                {/* Platform Icon */}
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg", platform.color)}>
                                    {platform.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 dark:text-white line-clamp-1">
                                        {post.caption}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                        <span>{formatTime(post.posted_at)}</span>
                                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(post.views)}</span>
                                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNumber(post.likes)}</span>
                                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{formatNumber(post.comments)}</span>
                                    </div>
                                </div>

                                {/* Link */}
                                {post.post_url && (
                                    <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
