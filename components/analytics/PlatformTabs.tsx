"use client";

import { cn } from "@/lib/utils";

interface PlatformTabsProps {
    value: "all" | "tiktok" | "facebook" | "youtube";
    onChange: (platform: "all" | "tiktok" | "facebook" | "youtube") => void;
}

const TABS = [
    { key: "all", label: "ทั้งหมด", icon: "📊" },
    { key: "tiktok", label: "TikTok", icon: "🎵" },
    { key: "facebook", label: "Facebook", icon: "📘" },
    { key: "youtube", label: "YouTube", icon: "📺" },
];

export function PlatformTabs({ value, onChange }: PlatformTabsProps) {
    return (
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {TABS.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key as typeof value)}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                        value === tab.key
                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                </button>
            ))}
        </div>
    );
}
