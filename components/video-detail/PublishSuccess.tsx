"use client";

import Link from "next/link";
import { CheckCircle, XCircle, ExternalLink, BarChart3, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublishSuccessProps {
    video: {
        id: string;
        product?: { name: string };
    };
    results: Array<{
        platform: string;
        success: boolean;
        postUrl?: string;
        error?: string;
    }>;
    onReset: () => void;
}

const PLATFORM_INFO = {
    tiktok: { label: "TikTok", icon: "🎵", color: "bg-gray-900" },
    facebook: { label: "Facebook", icon: "📘", color: "bg-blue-600" },
    youtube: { label: "YouTube", icon: "📺", color: "bg-red-600" },
    scheduled: { label: "ตั้งเวลาโพสต์", icon: "📅", color: "bg-purple-600" },
};

export function PublishSuccess({ video, results, onReset }: PublishSuccessProps) {
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    const isScheduled = results.some(r => r.platform === "scheduled");

    return (
        <div className="max-w-lg mx-auto text-center py-8">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                {isScheduled ? (
                    <Clock className="w-10 h-10 text-purple-500" />
                ) : (
                    <CheckCircle className="w-10 h-10 text-green-500" />
                )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isScheduled ? "ตั้งเวลาสำเร็จ! 📅" : "โพสต์สำเร็จ! 🎉"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
                {isScheduled
                    ? "วิดีโอจะถูกโพสต์ตามเวลาที่กำหนด"
                    : failedCount > 0
                        ? `สำเร็จ ${successCount} แพลตฟอร์ม, ล้มเหลว ${failedCount} แพลตฟอร์ม`
                        : `โพสต์ไปยัง ${successCount} แพลตฟอร์มเรียบร้อย`}
            </p>

            {/* Results */}
            {!isScheduled && (
                <div className="space-y-3 mb-8">
                    {results.map((result, i) => {
                        const info = PLATFORM_INFO[result.platform as keyof typeof PLATFORM_INFO] || {
                            label: result.platform,
                            icon: "📱",
                            color: "bg-gray-500",
                        };

                        return (
                            <div
                                key={i}
                                className={`flex items-center gap-4 p-4 rounded-xl ${result.success
                                        ? "bg-green-50 dark:bg-green-900/20"
                                        : "bg-red-50 dark:bg-red-900/20"
                                    }`}
                            >
                                <span className="text-2xl">{info.icon}</span>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {info.label}
                                    </p>
                                    {result.success ? (
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                            โพสต์สำเร็จ
                                        </p>
                                    ) : (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            {result.error || "เกิดข้อผิดพลาด"}
                                        </p>
                                    )}
                                </div>
                                {result.success && result.postUrl && (
                                    <a
                                        href={result.postUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <ExternalLink className="w-5 h-5 text-blue-500" />
                                    </a>
                                )}
                                {result.success ? (
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-500" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
                <Link href="/dashboard/analytics">
                    <Button variant="outline" className="w-full">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        ดูสถิติ
                    </Button>
                </Link>
                <Link href="/dashboard/videos/create">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500">
                        <Plus className="w-4 h-4 mr-2" />
                        สร้างวิดีโอใหม่
                    </Button>
                </Link>
            </div>

            {/* Back Button */}
            <button
                onClick={onReset}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
                ← กลับไปหน้าวิดีโอ
            </button>
        </div>
    );
}
