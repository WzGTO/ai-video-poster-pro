"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BestTimesHeatmapProps {
    data: Array<{ day: number; hour: number; engagement: number }>;
}

const DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const HOURS = ["00", "04", "08", "12", "16", "20"];

export function BestTimesHeatmap({ data }: BestTimesHeatmapProps) {
    // Create a 7x24 grid
    const grid: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));

    // Fill with data
    data.forEach(({ day, hour, engagement }) => {
        if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
            grid[day][hour] = engagement;
        }
    });

    const maxEngagement = Math.max(...data.map(d => d.engagement), 1);

    const getColor = (value: number) => {
        const intensity = value / maxEngagement;
        if (intensity > 0.8) return "bg-green-500";
        if (intensity > 0.6) return "bg-green-400";
        if (intensity > 0.4) return "bg-green-300";
        if (intensity > 0.2) return "bg-green-200";
        if (intensity > 0) return "bg-green-100";
        return "bg-gray-100 dark:bg-gray-700";
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">เวลาโพสต์ที่ดีที่สุด</h3>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[300px]">
                    {/* Hour labels */}
                    <div className="flex ml-8 mb-1">
                        {HOURS.map((h) => (
                            <span key={h} className="flex-1 text-[10px] text-gray-400 text-center">{h}</span>
                        ))}
                    </div>

                    {/* Grid */}
                    {grid.map((row, dayIndex) => (
                        <div key={dayIndex} className="flex items-center gap-1 mb-1">
                            {/* Day label */}
                            <span className="w-6 text-xs text-gray-500 text-right">{DAYS[dayIndex]}</span>

                            {/* Hour cells */}
                            <div className="flex-1 flex gap-0.5">
                                {row.map((value, hourIndex) => (
                                    <div
                                        key={hourIndex}
                                        className={cn(
                                            "flex-1 h-4 rounded-sm transition-colors cursor-pointer hover:ring-1 hover:ring-gray-400",
                                            getColor(value)
                                        )}
                                        title={`${DAYS[dayIndex]} ${hourIndex}:00 - Engagement: ${value.toFixed(1)}%`}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Legend */}
                    <div className="flex items-center justify-end gap-2 mt-4">
                        <span className="text-xs text-gray-400">น้อย</span>
                        <div className="flex gap-0.5">
                            <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded-sm" />
                            <div className="w-4 h-4 bg-green-100 rounded-sm" />
                            <div className="w-4 h-4 bg-green-200 rounded-sm" />
                            <div className="w-4 h-4 bg-green-300 rounded-sm" />
                            <div className="w-4 h-4 bg-green-400 rounded-sm" />
                            <div className="w-4 h-4 bg-green-500 rounded-sm" />
                        </div>
                        <span className="text-xs text-gray-400">มาก</span>
                    </div>
                </div>
            </div>

            {/* Best time recommendation */}
            <div className="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-sm text-green-700 dark:text-green-400">
                💡 แนะนำ: วันศุกร์-เสาร์ ช่วง 19:00-22:00 น. มักได้ engagement สูงที่สุด
            </div>
        </div>
    );
}
