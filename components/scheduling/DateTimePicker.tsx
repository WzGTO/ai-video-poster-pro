"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
    label?: string;
    value: Date | null;
    onChange: (date: Date | null) => void;
    minDate?: Date;
    maxDate?: Date;
    timeZone?: string;
    className?: string;
}

export function DateTimePicker({
    label,
    value,
    onChange,
    minDate,
    maxDate,
    timeZone = "Asia/Bangkok",
    className,
}: DateTimePickerProps) {
    const [dateStr, setDateStr] = useState("");
    const [timeStr, setTimeStr] = useState("");

    // Update internal state when value changes
    useEffect(() => {
        if (value) {
            const localDate = new Date(value.toLocaleString("en-US", { timeZone }));
            setDateStr(formatDateForInput(value));
            setTimeStr(formatTimeForInput(value));
        } else {
            setDateStr("");
            setTimeStr("");
        }
    }, [value, timeZone]);

    function formatDateForInput(date: Date): string {
        return date.toISOString().split("T")[0];
    }

    function formatTimeForInput(date: Date): string {
        return date.toTimeString().slice(0, 5);
    }

    function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
        const newDateStr = e.target.value;
        setDateStr(newDateStr);

        if (newDateStr && timeStr) {
            const newDate = new Date(`${newDateStr}T${timeStr}`);
            onChange(newDate);
        }
    }

    function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
        const newTimeStr = e.target.value;
        setTimeStr(newTimeStr);

        if (dateStr && newTimeStr) {
            const newDate = new Date(`${dateStr}T${newTimeStr}`);
            onChange(newDate);
        }
    }

    function getMinDateStr(): string {
        if (!minDate) return "";
        return formatDateForInput(minDate);
    }

    function getMaxDateStr(): string {
        if (!maxDate) return "";
        return formatDateForInput(maxDate);
    }

    return (
        <div className={cn("space-y-3", className)}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}

            <div className="grid grid-cols-2 gap-3">
                {/* Date Input */}
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="date"
                        value={dateStr}
                        onChange={handleDateChange}
                        min={getMinDateStr()}
                        max={getMaxDateStr()}
                        className={cn(
                            "w-full pl-10 pr-3 py-2.5 rounded-xl border bg-white dark:bg-gray-800",
                            "border-gray-200 dark:border-gray-700",
                            "text-gray-900 dark:text-white text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500"
                        )}
                    />
                </div>

                {/* Time Input */}
                <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="time"
                        value={timeStr}
                        onChange={handleTimeChange}
                        className={cn(
                            "w-full pl-10 pr-3 py-2.5 rounded-xl border bg-white dark:bg-gray-800",
                            "border-gray-200 dark:border-gray-700",
                            "text-gray-900 dark:text-white text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500"
                        )}
                    />
                </div>
            </div>

            {/* Timezone indicator */}
            <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                เขตเวลา: {timeZone}
            </p>

            {/* Selected datetime preview */}
            {value && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>
                            กำหนดโพสต์:{" "}
                            {value.toLocaleDateString("th-TH", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}{" "}
                            เวลา{" "}
                            {value.toLocaleTimeString("th-TH", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}{" "}
                            น.
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
}
