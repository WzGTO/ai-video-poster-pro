"use client";

import { HardDrive, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStorageInfo } from "@/lib/hooks/useSWR";

export function StorageWidget() {
    const { storage, used, total, percentage, isLoading, isError } = useStorageInfo();

    const formatBytes = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
        return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
    };

    const getProgressColor = (pct: number) => {
        if (pct >= 90) return "bg-red-500";
        if (pct >= 70) return "bg-yellow-500";
        return "bg-blue-500";
    };

    // Calculate breakdown (estimate if not available)
    const breakdown = {
        videos: storage?.breakdown?.videos || used * 0.7,
        images: storage?.breakdown?.images || used * 0.3,
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
                <HardDrive className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Google Drive</h3>
            </div>

            {isLoading ? (
                <div className="animate-pulse space-y-3">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            ) : isError ? (
                <p className="text-gray-500 text-sm">ไม่สามารถโหลดข้อมูลได้</p>
            ) : (
                <>
                    {/* Progress Bar */}
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                        <div
                            className={cn("h-full rounded-full transition-all", getProgressColor(percentage))}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    {/* Usage Text */}
                    <div className="flex justify-between text-sm mb-4">
                        <span className="text-gray-600 dark:text-gray-400">
                            {formatBytes(used)} / {formatBytes(total)}
                        </span>
                        <span className={cn(
                            "font-medium",
                            percentage >= 90 ? "text-red-500" : percentage >= 70 ? "text-yellow-500" : "text-blue-500"
                        )}>
                            {percentage}%
                        </span>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                                <span className="text-gray-600 dark:text-gray-400">วิดีโอ</span>
                            </div>
                            <span className="text-gray-900 dark:text-white">{formatBytes(breakdown.videos)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-gray-600 dark:text-gray-400">รูปภาพ</span>
                            </div>
                            <span className="text-gray-900 dark:text-white">{formatBytes(breakdown.images)}</span>
                        </div>
                    </div>
                </>
            )}

            <button
                onClick={() => window.open("https://drive.google.com", "_blank")}
                className="flex items-center justify-center gap-1 w-full mt-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
                <FolderOpen className="w-4 h-4" />
                เปิด Google Drive
            </button>
        </div>
    );
}
