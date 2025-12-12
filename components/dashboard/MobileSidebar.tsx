"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    Home,
    Package,
    Video,
    BarChart3,
    Settings,
    LogOut,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "./ConnectionStatus";
import { StorageInfo } from "./StorageInfo";

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const navItems = [
    {
        href: "/dashboard",
        label: "หน้าหลัก",
        icon: Home,
        exact: true,
    },
    {
        href: "/dashboard/products",
        label: "สินค้าของฉัน",
        icon: Package,
    },
    {
        href: "/dashboard/videos",
        label: "วิดีโอของฉัน",
        icon: Video,
    },
    {
        href: "/dashboard/analytics",
        label: "สถิติ",
        icon: BarChart3,
    },
    {
        href: "/dashboard/settings",
        label: "ตั้งค่า",
        icon: Settings,
    },
];

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar Drawer */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ease-out md:hidden",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
                    <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                            <Video className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-kanit font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            AI Video Pro
                        </span>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href);

                        return (
                            <Link key={item.href} href={item.href} onClick={onClose}>
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                        isActive
                                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Divider */}
                <div className="mx-4 my-4 border-t border-gray-200 dark:border-gray-700" />

                {/* Connection Status */}
                <div className="px-4">
                    <p className="px-4 mb-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        การเชื่อมต่อ
                    </p>
                    <ConnectionStatus />
                </div>

                {/* Storage Info */}
                <div className="px-4 mt-4">
                    <StorageInfo />
                </div>

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => {
                            onClose();
                            signOut({ callbackUrl: "/" });
                        }}
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        ออกจากระบบ
                    </Button>
                </div>
            </aside>
        </>
    );
}
