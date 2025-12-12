"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Package, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/database";

interface StepProductSelectionProps {
    products: Product[];
    selectedProductId: string | null;
    onSelect: (productId: string, product: Product) => void;
}

export function StepProductSelection({
    products,
    selectedProductId,
    onSelect,
}: StepProductSelectionProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedProduct = products.find((p) => p.id === selectedProductId);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    เลือกสินค้า
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    เลือกสินค้าที่ต้องการสร้างวิดีโอโฆษณา
                </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="ค้นหาสินค้า..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Selected Product Preview */}
            {selectedProduct && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-2 font-medium">
                        สินค้าที่เลือก:
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-white">
                            {selectedProduct.images[0] ? (
                                <Image
                                    src={selectedProduct.images[0]}
                                    alt={selectedProduct.name}
                                    width={64}
                                    height={64}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <Package className="w-6 h-6 text-gray-400" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {selectedProduct.name}
                            </p>
                            <p className="text-blue-600 dark:text-blue-400 font-bold">
                                ฿{selectedProduct.price.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Grid */}
            <div className="max-h-[400px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>ไม่พบสินค้า</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {filteredProducts.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => onSelect(product.id, product)}
                                className={cn(
                                    "relative p-3 rounded-xl border-2 transition-all duration-200 text-left",
                                    selectedProductId === product.id
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                                )}
                            >
                                {/* Image */}
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 mb-2">
                                    {product.images[0] ? (
                                        <Image
                                            src={product.images[0]}
                                            alt={product.name}
                                            width={120}
                                            height={120}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Name */}
                                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                                    {product.name}
                                </p>

                                {/* Price */}
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                    ฿{product.price.toLocaleString()}
                                </p>

                                {/* Selected Check */}
                                {selectedProductId === product.id && (
                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
