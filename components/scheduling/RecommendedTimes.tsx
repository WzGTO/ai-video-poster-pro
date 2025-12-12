"use client";

import { Clock, TrendingUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendedTimesProps {
    onSelect: (date: Date) => void;
    basedOn?: "user_history" | "general" | "platform";
    platform?: "tiktok" | "facebook" | "youtube";
    className?: string;
}

interface TimeSlot {
    label: string;
    time: string;
    dayOffset: number;
    score: number;
    reason: string;
}

// Recommended posting times for Thai users
const RECOMMENDED_TIMES: TimeSlot[] = [
    {
        label: "คืนนี้",
        time: "19:00",
        dayOffset: 0,
        score: 95,
        reason: "ช่วงเวลา Prime Time ที่คนใช้มือถือมากที่สุด",
    },
    {
        label: "คืนนี้",
        time: "20:30",
        dayOffset: 0,
        score: 92,
        reason: "หลังอาหารเย็น คนว่างเลื่อนดูคลิป",
    },
    {
        label: "คืนนี้",
        time: "21:30",
        dayOffset: 0,
        score: 88,
        reason: "ก่อนนอน engagement สูง",
    },
    {
        label: "พรุ่งนี้เช้า",
        time: "07:00",
        dayOffset: 1,
        score: 75,
        reason: "ช่วงเดินทางตอนเช้า ดูคลิปสั้น",
    },
    {
        label: "พรุ่งนี้กลางวัน",
        time: "12:00",
        dayOffset: 1,
        score: 80,
        reason: "พักเที่ยง คนเลื่อนดู TikTok",
    },
    {
        label: "พรุ่งนี้",
        time: "19:00",
        dayOffset: 1,
        score: 95,
        reason: "ช่วงเวลา Prime Time",
    },
];

export function RecommendedTimes({
    onSelect,
    basedOn = "general",
    platform,
    className,
}: RecommendedTimesProps) {
    function getDateFromSlot(slot: TimeSlot): Date {
        const now = new Date();
        const date = new Date(now);
        date.setDate(date.getDate() + slot.dayOffset);

        const [hours, minutes] = slot.time.split(":").map(Number);
        date.setHours(hours, minutes, 0, 0);

        // If the time has already passed today, move to next occurrence
        if (slot.dayOffset === 0 && date < now) {
            date.setDate(date.getDate() + 1);
        }

        return date;
    }

    function getScoreColor(score: number): string {
        if (score >= 90) return "text-green-500";
        if (score >= 80) return "text-blue-500";
        if (score >= 70) return "text-yellow-500";
        return "text-gray-500";
    }

    function getScoreEmoji(score: number): string {
        if (score >= 90) return "🔥";
        if (score >= 80) return "✨";
        if (score >= 70) return "👍";
        return "📌";
    }

    // Filter times that haven't passed yet
    const now = new Date();
    const validTimes = RECOMMENDED_TIMES.filter((slot) => {
        const slotDate = getDateFromSlot(slot);
        return slotDate > now;
    }).slice(0, 4);

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>เวลาแนะนำ (จาก engagement สูง)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {validTimes.map((slot, index) => {
                    const date = getDateFromSlot(slot);

                    return (
                        <button
                            key={index}
                            onClick={() => onSelect(date)}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                                "bg-white dark:bg-gray-800",
                                "border-gray-200 dark:border-gray-700",
                                "hover:border-blue-300 dark:hover:border-blue-600",
                                "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            )}
                        >
                            {/* Score Badge */}
                            <div
                                className={cn(
                                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                                    slot.score >= 90
                                        ? "bg-green-100 dark:bg-green-900/30"
                                        : "bg-gray-100 dark:bg-gray-700"
                                )}
                            >
                                {getScoreEmoji(slot.score)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {slot.label} {slot.time} น.
                                    </span>
                                    <span className={cn("text-xs font-bold", getScoreColor(slot.score))}>
                                        {slot.score}%
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                    {slot.reason}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Tip */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>Tip:</strong> โพสต์ช่วง 19:00-22:00 น. ในวันศุกร์-เสาร์ มักได้ engagement สูงที่สุด
                </p>
            </div>
        </div>
    );
}
