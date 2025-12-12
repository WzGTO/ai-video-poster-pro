"use client";

import { useEffect, useState } from "react";
import { HardDrive, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StorageData {
    used: number;
    total: number;
    usedFormatted: string;
    totalFormatted: string;
    percentage: number;
}

export function StorageInfo() {
    const [storage, setStorage] = useState<StorageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const formatBytes = (bytes: number): string => {
            if (bytes === 0) return "0 B";
            const k = 1024;
            const sizes = ["B", "KB", "MB", "GB", "TB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        };

        const fetchStorageInfo = async () => {
            try {
                const response = await fetch("/api/drive/storage");
                if (response.ok) {
                    const data = await response.json();
                    const used = data.usage.usedInDrive || 0;
                    const total = data.quota.limit || 15 * 1024 * 1024 * 1024; // 15GB default
                    const percentage = Math.round((used / total) * 100);

                    setStorage({
                        used,
                        total,
                        usedFormatted: formatBytes(used),
                        totalFormatted: formatBytes(total),
                        percentage,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch storage info:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStorageInfo();
    }, []);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const openGoogleDrive = () => {
        window.open("https://drive.google.com", "_blank");
    };

    if (loading) {
        return (
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-600" />
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded" />
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full mb-2" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded" />
            </div>
        );
    }

    const getProgressColor = (percentage: number): string => {
        if (percentage >= 90) return "bg-red-500";
        if (percentage >= 70) return "bg-yellow-500";
        return "bg-blue-500";
    };

    return (
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
            {/* Title */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <HardDrive className="w-4 h-4" />
                    <span className="text-sm font-medium">Google Drive</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-2">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500",
                        getProgressColor(storage?.percentage || 0)
                    )}
                    style={{ width: `${storage?.percentage || 0}%` }}
                />
            </div>

            {/* Usage text */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                    {storage?.usedFormatted} / {storage?.totalFormatted}
                </span>
                <span>{storage?.percentage}%</span>
            </div>

            {/* Open Drive button */}
            <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                onClick={openGoogleDrive}
            >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                เปิด Google Drive
            </Button>
        </div>
    );
}
