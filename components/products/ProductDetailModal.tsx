"use client";

import { useState } from "react";
import Image from "next/image";
import {
    X,
    ChevronLeft,
    ChevronRight,
    Video,
    Edit,
    Trash2,
    Package,
    Tag,
    Layers,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/database";

interface ProductDetailModalProps {
    product: Product;
    onClose: () => void;
    onCreateVideo: (product: Product) => void;
    onUpdate: () => void;
}

export function ProductDetailModal({
    product,
    onClose,
    onCreateVideo,
    onUpdate,
}: ProductDetailModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Image navigation
    const nextImage = () => {
        setCurrentImageIndex((prev) =>
            prev === product.images.length - 1 ? 0 : prev + 1
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? product.images.length - 1 : prev - 1
        );
    };

    // Delete product
    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/products/${product.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                onUpdate();
                onClose();
            } else {
                throw new Error("Failed to delete");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("ไม่สามารถลบสินค้าได้");
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    // Stock status
    const stockStatus = getStockStatus(product.stock);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                    {/* Image Section */}
                    <div className="relative w-full md:w-1/2 bg-gray-100 dark:bg-gray-900">
                        {/* Main Image */}
                        <div className="relative aspect-square">
                            {product.images[currentImageIndex] ? (
                                <Image
                                    src={product.images[currentImageIndex]}
                                    alt={product.name}
                                    fill
                                    className="object-contain"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Package className="w-20 h-20 text-gray-300" />
                                </div>
                            )}

                            {/* Navigation arrows */}
                            {product.images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {product.images.length > 1 && (
                            <div className="flex gap-2 p-4 overflow-x-auto">
                                {product.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentImageIndex(i)}
                                        className={cn(
                                            "w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors",
                                            i === currentImageIndex
                                                ? "border-blue-500"
                                                : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <Image
                                            src={img}
                                            alt={`${product.name} ${i + 1}`}
                                            width={64}
                                            height={64}
                                            className="object-cover w-full h-full"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {/* Category */}
                        {product.category && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                <Tag className="h-4 w-4" />
                                {product.category}
                            </div>
                        )}

                        {/* Name */}
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {product.name}
                        </h2>

                        {/* Price */}
                        <div className="flex items-baseline gap-3 mb-4">
                            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                ฿{product.price.toLocaleString()}
                            </span>
                            {product.original_price && product.original_price > product.price && (
                                <>
                                    <span className="text-lg text-gray-400 line-through">
                                        ฿{product.original_price.toLocaleString()}
                                    </span>
                                    <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium">
                                        -{Math.round((1 - product.price / product.original_price) * 100)}%
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Stock */}
                        <div className="flex items-center gap-3 mb-6">
                            <Layers className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">
                                สต็อก: {product.stock} ชิ้น
                            </span>
                            <span
                                className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    stockStatus.className
                                )}
                            >
                                {stockStatus.label}
                            </span>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    รายละเอียดสินค้า
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* TikTok Shop Link */}
                        {product.tiktok_product_id && (
                            <a
                                href={`https://www.tiktok.com/view/product/${product.tiktok_product_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors mb-6"
                            >
                                <ExternalLink className="h-4 w-4" />
                                ดูใน TikTok Shop
                            </a>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {/* Create Video Button */}
                            <Button
                                size="lg"
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                onClick={() => onCreateVideo(product)}
                            >
                                <Video className="h-5 w-5 mr-2" />
                                🎬 สร้างวิดีโอสำหรับสินค้านี้
                            </Button>

                            {/* Edit and Delete */}
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1">
                                    <Edit className="h-4 w-4 mr-2" />
                                    แก้ไข
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Delete Confirmation */}
                        {showDeleteConfirm && (
                            <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <p className="text-red-700 dark:text-red-400 mb-3">
                                    ต้องการลบสินค้านี้หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        ยกเลิก
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-red-500 hover:bg-red-600"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? "กำลังลบ..." : "ยืนยันลบ"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== Helper =====

function getStockStatus(stock: number): {
    label: string;
    className: string;
} {
    if (stock === 0) {
        return {
            label: "หมดสต็อก",
            className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
        };
    }
    if (stock <= 10) {
        return {
            label: "ใกล้หมด",
            className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400",
        };
    }
    return {
        label: "พร้อมขาย",
        className: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
    };
}
