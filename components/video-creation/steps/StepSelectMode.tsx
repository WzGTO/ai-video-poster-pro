"use client";

import { Bot, Hand, Sparkles, Clock, Palette, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepSelectModeProps {
    selectedMode: "auto" | "manual" | null;
    onSelectMode: (mode: "auto" | "manual") => void;
}

export function StepSelectMode({ selectedMode, onSelectMode }: StepSelectModeProps) {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    เลือกโหมดการสร้างวิดีโอ
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    เลือกวิธีที่คุณต้องการสร้างวิดีโอโฆษณา
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Auto Mode Card */}
                <button
                    onClick={() => onSelectMode("auto")}
                    className={cn(
                        "group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left",
                        selectedMode === "auto"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md"
                    )}
                >
                    {/* Icon */}
                    <div
                        className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                            selectedMode === "auto"
                                ? "bg-blue-500 text-white"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-500 group-hover:bg-blue-500 group-hover:text-white"
                        )}
                    >
                        <Bot className="w-8 h-8" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        🤖 โหมดอัตโนมัติ
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        AI จะวิเคราะห์สินค้าและสร้างวิดีโอให้อัตโนมัติ
                        เพียงเลือกสินค้าและรูปแบบที่ต้องการ
                    </p>

                    {/* Benefits */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <Sparkles className="w-4 h-4" />
                            <span>AI วิเคราะห์และแนะนำอัตโนมัติ</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <Clock className="w-4 h-4" />
                            <span>ประหยัดเวลา ใช้งานง่าย</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <Zap className="w-4 h-4" />
                            <span>เหมาะกับผู้เริ่มต้น</span>
                        </div>
                    </div>

                    {/* Selected Badge */}
                    {selectedMode === "auto" && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                            เลือกแล้ว ✓
                        </div>
                    )}
                </button>

                {/* Manual Mode Card */}
                <button
                    onClick={() => onSelectMode("manual")}
                    className={cn(
                        "group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left",
                        selectedMode === "manual"
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg"
                            : "border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:shadow-md"
                    )}
                >
                    {/* Icon */}
                    <div
                        className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                            selectedMode === "manual"
                                ? "bg-purple-500 text-white"
                                : "bg-purple-100 dark:bg-purple-900/30 text-purple-500 group-hover:bg-purple-500 group-hover:text-white"
                        )}
                    >
                        <Hand className="w-8 h-8" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        ✋ โหมดกำหนดเอง
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        ควบคุมทุกรายละเอียดด้วยตัวเอง
                        ตั้งแต่เลือกรูป เขียนบท ไปจนถึงเลือกเอฟเฟกต์
                    </p>

                    {/* Benefits */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                            <Palette className="w-4 h-4" />
                            <span>ควบคุมทุกรายละเอียด</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                            <Sparkles className="w-4 h-4" />
                            <span>สร้างสรรค์ตามสไตล์คุณ</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                            <Zap className="w-4 h-4" />
                            <span>เหมาะกับมืออาชีพ</span>
                        </div>
                    </div>

                    {/* Selected Badge */}
                    {selectedMode === "manual" && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-purple-500 text-white text-sm rounded-full">
                            เลือกแล้ว ✓
                        </div>
                    )}
                </button>
            </div>

            {/* Tip */}
            <div className="mt-8 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    💡 <strong>Tip:</strong> ถ้าไม่แน่ใจ ลองเริ่มจากโหมดอัตโนมัติก่อน
                    AI จะช่วยสร้างวิดีโอที่เหมาะกับสินค้าของคุณ
                </p>
            </div>
        </div>
    );
}
