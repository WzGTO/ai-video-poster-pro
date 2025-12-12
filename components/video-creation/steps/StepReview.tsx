"use client";

import Image from "next/image";
import { VideoCreationState } from "@/hooks/useVideoCreation";
import { Package, Video, Mic, Music, Type, Image as ImageIcon, Settings } from "lucide-react";

interface StepReviewProps {
    state: VideoCreationState;
}

export function StepReview({ state }: StepReviewProps) {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    ตรวจสอบการตั้งค่า
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    ตรวจสอบการตั้งค่าก่อนสร้างวิดีโอ
                </p>
            </div>

            <div className="grid gap-4">
                {/* Product */}
                {state.product && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-white">
                            {state.product.images[0] ? (
                                <Image src={state.product.images[0]} alt="" width={64} height={64} className="object-cover w-full h-full" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100"><Package className="w-6 h-6 text-gray-400" /></div>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">สินค้า</p>
                            <p className="font-medium text-gray-900 dark:text-white">{state.product.name}</p>
                            <p className="text-blue-600 dark:text-blue-400 font-bold">฿{state.product.price.toLocaleString()}</p>
                        </div>
                    </div>
                )}

                {/* Settings Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <ReviewItem icon={Settings} label="โหมด" value={state.mode === "auto" ? "🤖 อัตโนมัติ" : "✋ กำหนดเอง"} />
                    <ReviewItem icon={Video} label="รูปแบบ" value={state.aspectRatio} />
                    <ReviewItem icon={Video} label="ความยาว" value={state.duration ? `${state.duration} วินาที` : "AI เลือก"} />
                    <ReviewItem icon={Settings} label="สไตล์" value={state.style === "auto" ? "AI เลือก" : state.style} />
                    <ReviewItem icon={Mic} label="เสียงพากย์" value={state.voice === "none" ? "ไม่ใส่" : state.voice} />
                    <ReviewItem icon={Music} label="เพลง" value={state.music === "none" ? "ไม่ใส่" : state.music} />
                    <ReviewItem icon={Type} label="ซับไตเติ้ล" value={state.subtitle?.enabled ? "✅ เปิด" : "❌ ปิด"} />
                    <ReviewItem icon={ImageIcon} label="Watermark" value={state.watermark?.enabled ? `✅ ${state.watermark.text || "เปิด"}` : "❌ ปิด"} />
                </div>

                {/* AI Models */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">AI โมเดล</p>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Text Model</p>
                            <p className="font-medium text-gray-900 dark:text-white">{state.textModel}</p>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Video Model</p>
                            <p className="font-medium text-gray-900 dark:text-white">{state.videoModel}</p>
                        </div>
                    </div>
                </div>

                {/* Selected Images */}
                {state.selectedImages && state.selectedImages.length > 0 && (
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">รูปที่เลือก ({state.selectedImages.length})</p>
                        <div className="flex gap-2">
                            {state.selectedImages.slice(0, 5).map((img, i) => (
                                <div key={i} className="w-12 h-12 rounded-lg overflow-hidden">
                                    <Image src={img} alt="" width={48} height={48} className="object-cover w-full h-full" />
                                </div>
                            ))}
                            {state.selectedImages.length > 5 && (
                                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm">
                                    +{state.selectedImages.length - 5}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Custom Script */}
                {state.script && (
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">บทพูด</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{state.script}</p>
                    </div>
                )}
            </div>

            {/* Confirm Message */}
            <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                <p>✅ พร้อมสร้างวิดีโอแล้ว! กด "สร้างวิดีโอ" เพื่อเริ่มต้น</p>
            </div>
        </div>
    );
}

function ReviewItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <Icon className="w-4 h-4 text-gray-400" />
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}
