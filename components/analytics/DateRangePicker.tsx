"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
    value: { from: Date; to: Date };
    onChange: (range: { from: Date; to: Date }) => void;
}

const PRESETS = [
    { label: "วันนี้", days: 0 },
    { label: "7 วัน", days: 7 },
    { label: "30 วัน", days: 30 },
    { label: "90 วัน", days: 90 },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activePreset, setActivePreset] = useState(30);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    };

    const handlePreset = (days: number) => {
        const to = new Date();
        const from = days === 0 ? new Date() : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        setActivePreset(days);
        onChange({ from, to });
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="min-w-[200px] justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(value.from)} - {formatDate(value.to)}</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
            </Button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[200px]">
                        <p className="text-xs text-gray-500 mb-2">ช่วงเวลา</p>
                        <div className="space-y-1">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.days}
                                    onClick={() => handlePreset(preset.days)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                        activePreset === preset.days
                                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                    )}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 mb-2">กำหนดเอง</p>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    value={value.from.toISOString().split("T")[0]}
                                    onChange={(e) => onChange({ ...value, from: new Date(e.target.value) })}
                                    className="px-2 py-1 text-sm border rounded"
                                />
                                <input
                                    type="date"
                                    value={value.to.toISOString().split("T")[0]}
                                    onChange={(e) => onChange({ ...value, to: new Date(e.target.value) })}
                                    className="px-2 py-1 text-sm border rounded"
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
