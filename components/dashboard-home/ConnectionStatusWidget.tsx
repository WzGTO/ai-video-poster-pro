"use client";

import Link from "next/link";
import { ExternalLink, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSocialStatus } from "@/lib/hooks/useSWR";

export function ConnectionStatus() {
    const { platforms, isLoading } = useSocialStatus();

    const platformList = [
        { key: "tiktok", label: "TikTok Shop", icon: "🛒" },
        { key: "facebook", label: "Facebook", icon: "📘" },
        { key: "youtube", label: "YouTube", icon: "📺" },
    ];

    const connectedCount = Object.values(platforms).filter(
        (p) => p?.connected && !p?.expired
    ).length;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">การเชื่อมต่อ</h3>
                <span className="text-xs text-gray-500">{connectedCount}/3 แพลตฟอร์ม</span>
            </div>

            <div className="space-y-3">
                {platformList.map((platform) => {
                    const status = platforms[platform.key as keyof typeof platforms] as {
                        connected?: boolean;
                        expired?: boolean;
                        name?: string;
                    } | undefined;

                    if (isLoading) {
                        return (
                            <div key={platform.key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 animate-pulse">
                                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-600" />
                                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-600 rounded" />
                            </div>
                        );
                    }

                    return (
                        <div key={platform.key} className={cn(
                            "flex items-center gap-3 p-3 rounded-xl transition-colors",
                            status?.connected && !status.expired ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-50 dark:bg-gray-700/50"
                        )}>
                            <span className="text-xl">{platform.icon}</span>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{platform.label}</p>
                                {status?.connected && status.name && (
                                    <p className="text-xs text-gray-500 truncate">{status.name}</p>
                                )}
                            </div>
                            {status?.connected && !status.expired ? (
                                <Check className="w-5 h-5 text-green-500" />
                            ) : status?.expired ? (
                                <AlertCircle className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <Link href={`/api/social/connect/${platform.key}`}>
                                    <Button size="sm" variant="outline" className="text-xs">เชื่อมต่อ</Button>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>

            <Link href="/dashboard/settings" className="flex items-center justify-center gap-1 mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                จัดการการเชื่อมต่อ <ExternalLink className="w-3 h-3" />
            </Link>
        </div>
    );
}
