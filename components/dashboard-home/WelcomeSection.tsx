"use client";

import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeSectionProps {
    userName: string;
}

export function WelcomeSection({ userName }: WelcomeSectionProps) {
    const now = new Date();
    const greeting = getGreeting(now.getHours());
    const dateStr = now.toLocaleDateString("th-TH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const timeStr = now.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {greeting}, {userName}! 👋
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {dateStr} • {timeStr} น.
                </p>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" asChild>
                    <Link href="/api/products/sync">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync สินค้า
                    </Link>
                </Button>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500" asChild>
                    <Link href="/dashboard/videos/create">
                        <Plus className="w-4 h-4 mr-2" />
                        สร้างวิดีโอ
                    </Link>
                </Button>
            </div>
        </div>
    );
}

function getGreeting(hour: number): string {
    if (hour < 12) return "สวัสดีตอนเช้า";
    if (hour < 17) return "สวัสดีตอนบ่าย";
    return "สวัสดีตอนเย็น";
}
