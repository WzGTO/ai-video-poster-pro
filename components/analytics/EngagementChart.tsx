"use client";

import { BarChart3 } from "lucide-react";

interface EngagementChartProps {
    data: Array<{ platform: string; views: number; likes: number; shares: number }>;
}

const PLATFORM_COLORS = {
    tiktok: { bg: "bg-gray-800", bar: "bg-gray-700" },
    facebook: { bg: "bg-blue-600", bar: "bg-blue-500" },
    youtube: { bg: "bg-red-600", bar: "bg-red-500" },
};

const PLATFORM_ICONS = {
    tiktok: "🎵",
    facebook: "📘",
    youtube: "📺",
};

export function EngagementChart({ data }: EngagementChartProps) {
    const maxValue = Math.max(...data.flatMap(d => [d.views, d.likes, d.shares]), 1);

    const formatNumber = (n: number) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toString();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Engagement ตามแพลตฟอร์ม</h3>
            </div>

            {data.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-gray-400">
                    ไม่มีข้อมูล
                </div>
            ) : (
                <div className="space-y-6">
                    {data.map((item) => {
                        const colors = PLATFORM_COLORS[item.platform as keyof typeof PLATFORM_COLORS] || { bg: "bg-gray-500", bar: "bg-gray-400" };
                        const icon = PLATFORM_ICONS[item.platform as keyof typeof PLATFORM_ICONS] || "📱";

                        return (
                            <div key={item.platform}>
                                {/* Platform Label */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{icon}</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{item.platform}</span>
                                </div>

                                {/* Bars */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-12">Views</span>
                                        <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className={`h-full ${colors.bar} rounded-full`} style={{ width: `${(item.views / maxValue) * 100}%` }} />
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-12 text-right">{formatNumber(item.views)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-12">Likes</span>
                                        <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className={`h-full ${colors.bar} rounded-full opacity-75`} style={{ width: `${(item.likes / maxValue) * 100}%` }} />
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-12 text-right">{formatNumber(item.likes)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-12">Shares</span>
                                        <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className={`h-full ${colors.bar} rounded-full opacity-50`} style={{ width: `${(item.shares / maxValue) * 100}%` }} />
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-12 text-right">{formatNumber(item.shares)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
