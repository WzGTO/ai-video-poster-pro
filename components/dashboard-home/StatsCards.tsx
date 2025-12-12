"use client";

import { useState, useEffect } from "react";
import { Package, Video, Share2, Eye, TrendingUp, TrendingDown } from "lucide-react";

interface Stats {
    products: { total: number; change: number };
    videos: { total: number; change: number };
    posts: { total: number; change: number };
    views: { total: number; change: number };
}

export function StatsCards() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch from multiple endpoints
                const [productsRes, videosRes, postsRes] = await Promise.all([
                    fetch("/api/products/list?includeStats=true&limit=1"),
                    fetch("/api/videos/list?includeStats=true&limit=1"),
                    fetch("/api/posts/list?includeStats=true&limit=1"),
                ]);

                const productsData = await productsRes.json();
                const videosData = await videosRes.json();
                const postsData = await postsRes.json();

                setStats({
                    products: { total: productsData.stats?.total || 0, change: 5 },
                    videos: { total: videosData.stats?.total || 0, change: 12 },
                    posts: { total: postsData.stats?.total || 0, change: 8 },
                    views: { total: postsData.stats?.totalViews || 0, change: 15 },
                });
            } catch (error) {
                console.error("Fetch stats error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        { key: "products", label: "สินค้าทั้งหมด", icon: Package, color: "blue", value: stats?.products.total || 0, change: stats?.products.change || 0 },
        { key: "videos", label: "วิดีโอที่สร้าง", icon: Video, color: "purple", value: stats?.videos.total || 0, change: stats?.videos.change || 0 },
        { key: "posts", label: "โพสต์ทั้งหมด", icon: Share2, color: "green", value: stats?.posts.total || 0, change: stats?.posts.change || 0 },
        { key: "views", label: "ยอดวิวรวม", icon: Eye, color: "orange", value: stats?.views.total || 0, change: stats?.views.change || 0 },
    ];

    const colorClasses = {
        blue: "bg-blue-500",
        purple: "bg-purple-500",
        green: "bg-green-500",
        orange: "bg-orange-500",
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
                <div
                    key={card.key}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700"
                >
                    {loading ? (
                        <div className="animate-pulse">
                            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 mb-3" />
                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    ) : (
                        <>
                            <div className={`w-10 h-10 rounded-xl ${colorClasses[card.color as keyof typeof colorClasses]} flex items-center justify-center mb-3`}>
                                <card.icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {card.value.toLocaleString()}
                                </span>
                                {card.change !== 0 && (
                                    <span className={`text-xs flex items-center ${card.change > 0 ? "text-green-500" : "text-red-500"}`}>
                                        {card.change > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                                        {Math.abs(card.change)}%
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}
