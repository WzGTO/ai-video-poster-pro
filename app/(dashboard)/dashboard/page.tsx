"use client";

import { useSession } from "next-auth/react";
import { WelcomeSection } from "@/components/dashboard-home/WelcomeSection";
import { StatsCards } from "@/components/dashboard-home/StatsCards";
import { ConnectionStatus } from "@/components/dashboard-home/ConnectionStatusWidget";
import { StorageWidget } from "@/components/dashboard-home/StorageWidget";
import { RecentVideos } from "@/components/dashboard-home/RecentVideos";
import { RecentPosts } from "@/components/dashboard-home/RecentPosts";
import { QuickTips } from "@/components/dashboard-home/QuickTips";

export default function DashboardPage() {
    const { data: session } = useSession();

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <WelcomeSection userName={session?.user?.name || "ผู้ใช้"} />

            {/* Stats Cards */}
            <StatsCards />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - 2/3 */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Videos */}
                    <RecentVideos />

                    {/* Recent Posts */}
                    <RecentPosts />
                </div>

                {/* Right Column - 1/3 */}
                <div className="space-y-6">
                    {/* Connection Status */}
                    <ConnectionStatus />

                    {/* Storage Widget */}
                    <StorageWidget />

                    {/* Quick Tips */}
                    <QuickTips />
                </div>
            </div>
        </div>
    );
}
