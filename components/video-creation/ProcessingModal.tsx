"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Video, Sparkles, Mic, Wand2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProcessingModalProps {
    videoId: string | null;
    progress: { status: string; progress: number; stepMessage: string } | null;
    error: string | null;
}

const TIPS = [
    "💡 Tip: วิดีโอแนวตั้งได้รับการมีส่วนร่วมสูงกว่าบน TikTok",
    "💡 Tip: ใส่ Call-to-action ใน 3 วินาทีแรกเพื่อดึงดูดความสนใจ",
    "💡 Tip: เสียงพากย์ภาษาไทยช่วยเพิ่มยอดขายได้ดี",
    "💡 Tip: Hashtag ที่เหมาะสมช่วยให้วิดีโอถูกค้นพบง่ายขึ้น",
    "💡 Tip: โพสต์ช่วง 19:00-21:00 มักได้ engagement สูง",
];

const STEPS = [
    { key: "analyzing", label: "วิเคราะห์สินค้า", icon: Sparkles },
    { key: "generating_script", label: "สร้างบทพูด", icon: Wand2 },
    { key: "generating_video", label: "สร้างวิดีโอ AI", icon: Video },
    { key: "generating_voice", label: "สร้างเสียงพากย์", icon: Mic },
    { key: "processing", label: "ประมวลผลวิดีโอ", icon: Loader2 },
    { key: "uploading", label: "อัปโหลดไฟล์", icon: Upload },
    { key: "completed", label: "เสร็จสิ้น", icon: CheckCircle },
];

export function ProcessingModal({ videoId, progress, error }: ProcessingModalProps) {
    const router = useRouter();
    const [tip, setTip] = useState(TIPS[0]);
    const [tipIndex, setTipIndex] = useState(0);

    // Rotate tips
    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % TIPS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setTip(TIPS[tipIndex]);
    }, [tipIndex]);

    const isCompleted = progress?.status === "completed";
    const isFailed = progress?.status === "failed" || error;

    const getCurrentStepIndex = () => {
        if (!progress) return 0;
        const idx = STEPS.findIndex(s => s.key === progress.status);
        return idx >= 0 ? idx : 0;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
                {/* Header */}
                {!isFailed && !isCompleted && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 relative">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
                            <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                                <Video className="w-8 h-8 text-blue-500 animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            กำลังสร้างวิดีโอ
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {progress?.stepMessage || "กรุณารอสักครู่..."}
                        </p>
                    </>
                )}

                {/* Success */}
                {isCompleted && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            สร้างวิดีโอสำเร็จ! 🎉
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            วิดีโอพร้อมโพสต์แล้ว
                        </p>
                    </>
                )}

                {/* Error */}
                {isFailed && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            เกิดข้อผิดพลาด
                        </h3>
                        <p className="text-red-500 mb-6">
                            {error || "ไม่สามารถสร้างวิดีโอได้ กรุณาลองใหม่"}
                        </p>
                    </>
                )}

                {/* Progress Bar */}
                {!isFailed && !isCompleted && (
                    <div className="mb-6">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${progress?.progress || 0}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{progress?.progress || 0}%</p>
                    </div>
                )}

                {/* Steps Timeline */}
                {!isCompleted && !isFailed && (
                    <div className="flex justify-center gap-2 mb-6">
                        {STEPS.slice(0, 6).map((step, i) => {
                            const current = getCurrentStepIndex();
                            const isDone = i < current;
                            const isActive = i === current;
                            return (
                                <div key={step.key} className="flex flex-col items-center">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs",
                                        isDone ? "bg-green-500 text-white" :
                                            isActive ? "bg-blue-500 text-white" :
                                                "bg-gray-200 dark:bg-gray-700 text-gray-400"
                                    )}>
                                        {isDone ? "✓" : i + 1}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tip */}
                {!isCompleted && !isFailed && (
                    <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-sm text-yellow-700 dark:text-yellow-300">
                        {tip}
                    </div>
                )}

                {/* Actions */}
                {(isCompleted || isFailed) && (
                    <div className="flex gap-3 mt-6">
                        {isCompleted && (
                            <>
                                <Button variant="outline" className="flex-1" onClick={() => router.push("/dashboard/videos")}>
                                    ดูทั้งหมด
                                </Button>
                                <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500" onClick={() => router.push(`/dashboard/videos/${videoId}`)}>
                                    ดูวิดีโอ
                                </Button>
                            </>
                        )}
                        {isFailed && (
                            <>
                                <Button variant="outline" className="flex-1" onClick={() => router.push("/dashboard/videos")}>
                                    กลับ
                                </Button>
                                <Button className="flex-1" onClick={() => window.location.reload()}>
                                    ลองใหม่
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
