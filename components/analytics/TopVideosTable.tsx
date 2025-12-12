"use client";

import Link from "next/link";
import { Trophy, ExternalLink } from "lucide-react";

interface TopVideosTableProps {
    videos: Array<{
        id: string;
        title: string;
        platform: string;
        views: number;
        likes: number;
        engagement: number;
    }>;
}

const PLATFORM_ICONS = {
    tiktok: "🎵",
    facebook: "📘",
    youtube: "📺",
};

export function TopVideosTable({ videos }: TopVideosTableProps) {
    const formatNumber = (n: number) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toString();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">วิดีโอยอดนิยม</h3>
            </div>

            {videos.length === 0 ? (
                <div className="py-8 text-center text-gray-400">ไม่มีข้อมูล</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
                                <th className="text-left py-2 font-medium">#</th>
                                <th className="text-left py-2 font-medium">วิดีโอ</th>
                                <th className="text-center py-2 font-medium">แพลตฟอร์ม</th>
                                <th className="text-right py-2 font-medium">Views</th>
                                <th className="text-right py-2 font-medium">Likes</th>
                                <th className="text-right py-2 font-medium">Eng %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {videos.slice(0, 5).map((video, i) => {
                                const icon = PLATFORM_ICONS[video.platform as keyof typeof PLATFORM_ICONS] || "📱";
                                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;

                                return (
                                    <tr key={video.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-3 text-center">{medal}</td>
                                        <td className="py-3">
                                            <Link href={`/dashboard/videos/${video.id}`} className="text-sm text-gray-900 dark:text-white hover:text-blue-600 line-clamp-1 flex items-center gap-1">
                                                {video.title}
                                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                            </Link>
                                        </td>
                                        <td className="py-3 text-center text-lg">{icon}</td>
                                        <td className="py-3 text-right text-sm font-medium text-gray-900 dark:text-white">{formatNumber(video.views)}</td>
                                        <td className="py-3 text-right text-sm text-gray-600 dark:text-gray-400">{formatNumber(video.likes)}</td>
                                        <td className="py-3 text-right">
                                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                                {video.engagement.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
