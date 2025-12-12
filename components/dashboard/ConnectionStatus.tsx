"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PlatformStatus {
    platform: "tiktok" | "facebook" | "youtube";
    connected: boolean;
    expired?: boolean;
    name?: string;
}

const platformInfo = {
    tiktok: {
        name: "TikTok Shop",
        icon: "🛒",
        color: "bg-gray-900 dark:bg-white",
    },
    facebook: {
        name: "Facebook",
        icon: "📘",
        color: "bg-blue-600",
    },
    youtube: {
        name: "YouTube",
        icon: "📺",
        color: "bg-red-600",
    },
};

export function ConnectionStatus() {
    const [platforms, setPlatforms] = useState<PlatformStatus[]>([
        { platform: "tiktok", connected: false },
        { platform: "facebook", connected: false },
        { platform: "youtube", connected: false },
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConnectionStatus = async () => {
            try {
                const response = await fetch("/api/social/status");
                if (response.ok) {
                    const data = await response.json();
                    setPlatforms([
                        {
                            platform: "tiktok",
                            connected: data.platforms.tiktok.connected,
                            expired: data.platforms.tiktok.expired,
                            name: data.platforms.tiktok.account?.name,
                        },
                        {
                            platform: "facebook",
                            connected: data.platforms.facebook.connected,
                            expired: data.platforms.facebook.expired,
                            name: data.platforms.facebook.pages?.[0]?.name,
                        },
                        {
                            platform: "youtube",
                            connected: data.platforms.youtube.connected,
                            expired: data.platforms.youtube.expired,
                            name: data.platforms.youtube.channel?.name,
                        },
                    ]);
                }
            } catch (error) {
                console.error("Failed to fetch connection status:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchConnectionStatus();
    }, []);

    if (loading) {
        return (
            <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600" />
                        <div className="flex-1">
                            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {platforms.map((status) => {
                const info = platformInfo[status.platform];
                return (
                    <div
                        key={status.platform}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                            status.connected
                                ? "bg-green-50 dark:bg-green-900/20"
                                : "bg-gray-100 dark:bg-gray-700/50"
                        )}
                    >
                        {/* Platform icon */}
                        <span className="text-lg">{info.icon}</span>

                        {/* Platform info */}
                        <div className="flex-1 min-w-0">
                            <p
                                className={cn(
                                    "text-sm font-medium truncate",
                                    status.connected
                                        ? "text-green-700 dark:text-green-400"
                                        : "text-gray-500 dark:text-gray-400"
                                )}
                            >
                                {info.name}
                            </p>
                            {status.connected && status.name && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {status.name}
                                </p>
                            )}
                        </div>

                        {/* Status indicator */}
                        <div
                            className={cn(
                                "w-2 h-2 rounded-full flex-shrink-0",
                                status.expired
                                    ? "bg-yellow-500"
                                    : status.connected
                                        ? "bg-green-500"
                                        : "bg-gray-300 dark:bg-gray-600"
                            )}
                        />
                    </div>
                );
            })}
        </div>
    );
}
