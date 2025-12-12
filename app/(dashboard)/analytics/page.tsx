"use client";

import { useState, useEffect } from "react";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { PlatformTabs } from "@/components/analytics/PlatformTabs";
import { ViewsChart } from "@/components/analytics/ViewsChart";
import { EngagementChart } from "@/components/analytics/EngagementChart";
import { TopVideosTable } from "@/components/analytics/TopVideosTable";
import { BestTimesHeatmap } from "@/components/analytics/BestTimesHeatmap";
import { BarChart3, Loader2 } from "lucide-react";

interface DateRange {
    from: Date;
    to: Date;
}

interface AnalyticsData {
    overview: {
        totalViews: number;
        totalLikes: number;
        totalShares: number;
        totalComments: number;
        viewsChange: number;
    };
    viewsOverTime: Array<{ date: string; views: number }>;
    engagementByPlatform: Array<{ platform: string; views: number; likes: number; shares: number }>;
    topVideos: Array<{ id: string; title: string; platform: string; views: number; likes: number; engagement: number }>;
    bestTimes: Array<{ day: number; hour: number; engagement: number }>;
}

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
    });
    const [platform, setPlatform] = useState<"all" | "tiktok" | "facebook" | "youtube">("all");
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    from: dateRange.from.toISOString(),
                    to: dateRange.to.toISOString(),
                    platform: platform,
                });

                const res = await fetch(`/api/analytics/overview?${params}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Fetch analytics error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [dateRange, platform]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-blue-500" />
                        สถิติ
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        ภาพรวมประสิทธิภาพวิดีโอและโพสต์
                    </p>
                </div>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            {/* Platform Tabs */}
            <PlatformTabs value={platform} onChange={setPlatform} />

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : data ? (
                <div className="space-y-6">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="ยอดวิวรวม" value={data.overview.totalViews} change={data.overview.viewsChange} />
                        <StatCard label="ถูกใจ" value={data.overview.totalLikes} />
                        <StatCard label="แชร์" value={data.overview.totalShares} />
                        <StatCard label="คอมเมนต์" value={data.overview.totalComments} />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ViewsChart data={data.viewsOverTime} />
                        <EngagementChart data={data.engagementByPlatform} />
                    </div>

                    {/* Bottom Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TopVideosTable videos={data.topVideos} />
                        <BestTimesHeatmap data={data.bestTimes} />
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500">
                    ไม่พบข้อมูล
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, change }: { label: string; value: number; change?: number }) {
    const formatNumber = (n: number) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toLocaleString();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(value)}</span>
                {change !== undefined && (
                    <span className={`text-xs ${change >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {change >= 0 ? "+" : ""}{change}%
                    </span>
                )}
            </div>
        </div>
    );
}
