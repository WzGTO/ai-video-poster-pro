"use client";

import { VideoCreationState } from "@/hooks/useVideoCreation";
import { cn } from "@/lib/utils";
import { Sparkles, Zap, Crown, Info } from "lucide-react";

interface StepSelectModelsProps {
    state: VideoCreationState;
    updateState: (updates: Partial<VideoCreationState>) => void;
}

const TEXT_MODELS = [
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", desc: "เร็ว คุณภาพดี", icon: Zap, badge: "แนะนำ" },
    { value: "gemini-2.0-pro", label: "Gemini 2.0 Pro", desc: "คุณภาพสูงสุด ช้ากว่า", icon: Crown },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash", desc: "รุ่นเก่า ประหยัด", icon: Sparkles },
];

const VIDEO_MODELS = [
    { value: "veo-3.1", label: "Google Veo 3.1", desc: "คุณภาพสูง AI ล่าสุด", quota: "ฟรี 10 วิดีโอ/วัน", icon: Crown, badge: "แนะนำ" },
    { value: "luma", label: "Luma Dream Machine", desc: "สมจริง เคลื่อนไหวดี", quota: "ฟรี 5 วิดีโอ/วัน", icon: Sparkles },
    { value: "kling", label: "Kling AI 1.6", desc: "คมชัด รายละเอียดสูง", quota: "ฟรี 3 วิดีโอ/วัน", icon: Zap },
    { value: "minimax", label: "Minimax Video", desc: "เร็ว คุ้มค่า", quota: "ฟรี 5 วิดีโอ/วัน", icon: Sparkles },
];

export function StepSelectModels({ state, updateState }: StepSelectModelsProps) {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    เลือก AI โมเดล
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    เลือกโมเดลที่จะใช้สร้างวิดีโอ
                </p>
            </div>

            {/* Text Model */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    โมเดลสร้างบทพูด (Text)
                </label>
                <div className="space-y-2">
                    {TEXT_MODELS.map((model) => (
                        <button
                            key={model.value}
                            onClick={() => updateState({ textModel: model.value })}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                                state.textModel === model.value
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                state.textModel === model.value ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                            )}>
                                <model.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-white">{model.label}</span>
                                    {model.badge && (
                                        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
                                            {model.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{model.desc}</p>
                            </div>
                            <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                state.textModel === model.value ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300"
                            )}>
                                {state.textModel === model.value && <span className="text-xs">✓</span>}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Video Model */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    โมเดลสร้างวิดีโอ (Video AI)
                </label>
                <div className="space-y-2">
                    {VIDEO_MODELS.map((model) => (
                        <button
                            key={model.value}
                            onClick={() => updateState({ videoModel: model.value })}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                                state.videoModel === model.value
                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                state.videoModel === model.value ? "bg-purple-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                            )}>
                                <model.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-white">{model.label}</span>
                                    {model.badge && (
                                        <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full">
                                            {model.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{model.desc}</p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{model.quota}</p>
                            </div>
                            <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                state.videoModel === model.value ? "border-purple-500 bg-purple-500 text-white" : "border-gray-300"
                            )}>
                                {state.videoModel === model.value && <span className="text-xs">✓</span>}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Image Enhancement */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={state.imageEnhancement}
                        onChange={(e) => updateState({ imageEnhancement: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                        <span className="font-medium text-gray-900 dark:text-white">ปรับปรุงรูปด้วย AI</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">เพิ่มความคมชัดและปรับแสงอัตโนมัติ</p>
                    </div>
                </label>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-300">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>โควต้าฟรีจะรีเซ็ตทุกวันเวลา 00:00 น. หากใช้เกินโควต้าจะมีค่าใช้จ่ายเพิ่มเติม</p>
            </div>
        </div>
    );
}
