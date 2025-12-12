"use client";

import { useState } from "react";
import { RefreshCw, Search, Filter, Package, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductsHeaderProps {
    onSync: () => void;
    isSyncing: boolean;
    syncResult?: {
        synced: number;
        failed: number;
    } | null;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    categoryFilter: string;
    onCategoryChange: (category: string) => void;
    categories: string[];
    stockFilter: string;
    onStockChange: (stock: string) => void;
    stats?: {
        total: number;
        inStock: number;
        outOfStock: number;
    } | null;
}

export function ProductsHeader({
    onSync,
    isSyncing,
    syncResult,
    searchQuery,
    onSearchChange,
    categoryFilter,
    onCategoryChange,
    categories,
    stockFilter,
    onStockChange,
    stats,
}: ProductsHeaderProps) {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="space-y-4">
            {/* Title and Sync */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Package className="h-7 w-7 text-blue-500" />
                        สินค้าของฉัน
                    </h1>
                    {stats && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            ทั้งหมด {stats.total} รายการ • มีสต็อก {stats.inStock} • หมด {stats.outOfStock}
                        </p>
                    )}
                </div>

                <Button
                    onClick={onSync}
                    disabled={isSyncing}
                    className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 dark:text-gray-900 hover:opacity-90"
                >
                    <RefreshCw
                        className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")}
                    />
                    {isSyncing ? "กำลัง Sync..." : "🔄 Sync จาก TikTok Shop"}
                </Button>
            </div>

            {/* Sync Result Toast */}
            {syncResult && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>
                        Sync สำเร็จ! เพิ่ม/อัปเดต {syncResult.synced} รายการ
                        {syncResult.failed > 0 && `, ล้มเหลว ${syncResult.failed} รายการ`}
                    </span>
                </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาสินค้า..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>

                {/* Filter Toggle (Mobile) */}
                <Button
                    variant="outline"
                    className="sm:hidden"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="h-4 w-4 mr-2" />
                    ตัวกรอง
                </Button>

                {/* Filter Dropdowns */}
                <div
                    className={cn(
                        "flex flex-col sm:flex-row gap-3",
                        !showFilters && "hidden sm:flex"
                    )}
                >
                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">หมวดหมู่ทั้งหมด</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

                    {/* Stock Filter */}
                    <select
                        value={stockFilter}
                        onChange={(e) => onStockChange(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">สต็อกทั้งหมด</option>
                        <option value="in_stock">✅ มีสต็อก</option>
                        <option value="low_stock">⚠️ ใกล้หมด</option>
                        <option value="out_of_stock">❌ หมด</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
