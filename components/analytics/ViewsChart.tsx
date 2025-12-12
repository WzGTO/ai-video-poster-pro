"use client";

import { TrendingUp } from "lucide-react";

interface ViewsChartProps {
    data: Array<{ date: string; views: number }>;
}

export function ViewsChart({ data }: ViewsChartProps) {
    const maxViews = Math.max(...data.map(d => d.views), 1);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">ยอดวิวตามเวลา</h3>
            </div>

            {data.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-gray-400">
                    ไม่มีข้อมูล
                </div>
            ) : (
                <div className="h-[200px] flex items-end gap-1">
                    {data.slice(-14).map((item, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            {/* Bar */}
                            <div
                                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all hover:from-blue-600 hover:to-blue-500"
                                style={{
                                    height: `${(item.views / maxViews) * 160}px`,
                                    minHeight: item.views > 0 ? "4px" : "0",
                                }}
                                title={`${item.views.toLocaleString()} views`}
                            />
                            {/* Label (show every 2nd) */}
                            {i % 2 === 0 && (
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                    {formatDate(item.date)}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-blue-500 to-blue-400" />
                    <span>ยอดวิว</span>
                </div>
            </div>
        </div>
    );
}
