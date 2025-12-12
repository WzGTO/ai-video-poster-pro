"use client";

import Image from "next/image";
import Link from "next/link";
import { Video, Play, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVideos } from "@/lib/hooks/useSWR";

export function RecentVideos() {
    const { videos, isLoading } = useVideos({ limit: 6 });

    const formatDuration = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return mins > 0 ? `${mins}:${s.toString().padStart(2, "0")}` : `${s}s`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-purple-500" />
                    วิดีโอล่าสุด
                </h3>
                <Link href="/dashboard/videos" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    ดูทั้งหมด <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-[9/16] bg-gray-200 dark:bg-gray-700 rounded-xl mb-2" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        </div>
                    ))}
                </div>
            ) : videos.length === 0 ? (
                <div className="text-center py-8">
                    <Video className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-gray-500">ยังไม่มีวิดีโอ</p>
                    <Link href="/dashboard/videos/create" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                        สร้างวิดีโอแรก →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {videos.map((video: {
                        id: string;
                        title: string;
                        thumbnail_url?: string;
                        duration?: number;
                        status: string;
                    }) => (
                        <Link key={video.id} href={`/dashboard/videos/${video.id}`} className="group">
                            <div className="relative aspect-[9/16] bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-2">
                                {video.thumbnail_url ? (
                                    <Image src={video.thumbnail_url} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Video className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                {/* Duration Badge */}
                                {video.duration && (
                                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDuration(video.duration)}
                                    </div>
                                )}
                                {/* Play Overlay */}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                        <Play className="w-5 h-5 text-gray-900 ml-0.5" />
                                    </div>
                                </div>
                                {/* Status Badge */}
                                {video.status !== "completed" && (
                                    <div className={cn(
                                        "absolute top-2 left-2 px-2 py-0.5 text-xs rounded-full",
                                        video.status === "processing" ? "bg-yellow-500 text-white" : "bg-red-500 text-white"
                                    )}>
                                        {video.status === "processing" ? "กำลังสร้าง" : "ล้มเหลว"}
                                    </div>
                                )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {video.title}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
