"use client";

import { VideoCreationState } from "@/hooks/useVideoCreation";
import { cn } from "@/lib/utils";

interface StepAutoModeProps {
    state: VideoCreationState;
    updateState: (updates: Partial<VideoCreationState>) => void;
}

const ASPECT_RATIOS = [
    { value: "9:16", label: "แนวตั้ง (9:16)", desc: "TikTok, Reels, Shorts" },
    { value: "16:9", label: "แนวนอน (16:9)", desc: "YouTube, Facebook" },
    { value: "1:1", label: "สี่เหลี่ยม (1:1)", desc: "Instagram Feed" },
];

const DURATIONS = [
    { value: 5, label: "5 วินาที", desc: "สั้น กระชับ" },
    { value: 10, label: "10 วินาที", desc: "พอดี" },
    { value: 15, label: "15 วินาที", desc: "มาตรฐาน" },
    { value: 0, label: "🤖 AI เลือก", desc: "แนะนำตามสินค้า" },
];

const STYLES = [
    { value: "auto", label: "🤖 AI เลือก" },
    { value: "tiktok", label: "🎵 TikTok Viral" },
    { value: "professional", label: "💼 Professional" },
    { value: "fun", label: "🎉 สนุกสนาน" },
    { value: "luxury", label: "✨ หรูหรา" },
    { value: "cute", label: "🌸 น่ารัก" },
    { value: "minimal", label: "🎯 Minimal" },
];

const VOICES = [
    { value: "auto", label: "🤖 AI เลือก" },
    { value: "iapp-somying", label: "👩 สมหญิง (หญิง)" },
    { value: "iapp-somchai", label: "👨 สมชาย (ชาย)" },
    { value: "iapp-kanya", label: "👧 กัญญา (หญิง อ่อนหวาน)" },
    { value: "none", label: "🔇 ไม่ใส่เสียง" },
];

export function StepAutoMode({ state, updateState }: StepAutoModeProps) {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    🤖 ตั้งค่าโหมดอัตโนมัติ
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    AI จะวิเคราะห์สินค้าและสร้างวิดีโอให้คุณ
                </p>
            </div>

            {/* Aspect Ratio */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    รูปแบบวิดีโอ
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio.value}
                            onClick={() => updateState({ aspectRatio: ratio.value as "9:16" | "16:9" | "1:1" })}
                            className={cn(
                                "p-4 rounded-xl border-2 transition-all text-center",
                                state.aspectRatio === ratio.value
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                            )}
                        >
                            <div className="font-medium text-gray-900 dark:text-white">
                                {ratio.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {ratio.desc}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Duration */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    ความยาววิดีโอ
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {DURATIONS.map((dur) => (
                        <button
                            key={dur.value}
                            onClick={() => updateState({ duration: dur.value })}
                            className={cn(
                                "p-3 rounded-xl border-2 transition-all text-center",
                                state.duration === dur.value
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                            )}
                        >
                            <div className="font-medium text-gray-900 dark:text-white">
                                {dur.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {dur.desc}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Style */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    สไตล์วิดีโอ
                </label>
                <select
                    value={state.style}
                    onChange={(e) => updateState({ style: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {STYLES.map((style) => (
                        <option key={style.value} value={style.value}>
                            {style.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Voice */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    เสียงพากย์
                </label>
                <select
                    value={state.voice}
                    onChange={(e) => updateState({ voice: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {VOICES.map((voice) => (
                        <option key={voice.value} value={voice.value}>
                            {voice.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Additional Highlights */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    จุดเด่นเพิ่มเติม (ถ้ามี)
                </label>
                <textarea
                    value={state.highlights}
                    onChange={(e) => updateState({ highlights: e.target.value })}
                    placeholder="เช่น ส่งฟรี, ลดราคาพิเศษ, สินค้าขายดี..."
                    rows={3}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
            </div>

            {/* Watermark Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                        ใส่ Watermark
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        แสดงชื่อร้านหรือโลโก้ในวิดีโอ
                    </p>
                </div>
                <button
                    onClick={() =>
                        updateState({
                            watermark: { ...state.watermark, enabled: !state.watermark.enabled },
                        })
                    }
                    className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        state.watermark.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                    )}
                >
                    <div
                        className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                            state.watermark.enabled ? "translate-x-7" : "translate-x-1"
                        )}
                    />
                </button>
            </div>

            {/* Watermark Settings */}
            {state.watermark.enabled && (
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            ข้อความ Watermark
                        </label>
                        <input
                            type="text"
                            value={state.watermark.text}
                            onChange={(e) =>
                                updateState({
                                    watermark: { ...state.watermark, text: e.target.value },
                                })
                            }
                            placeholder="ชื่อร้านหรือโลโก้"
                            className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ตำแหน่ง
                            </label>
                            <select
                                value={state.watermark.position}
                                onChange={(e) =>
                                    updateState({
                                        watermark: { ...state.watermark, position: e.target.value },
                                    })
                                }
                                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                            >
                                <option value="bottom-right">ขวาล่าง</option>
                                <option value="bottom-left">ซ้ายล่าง</option>
                                <option value="top-right">ขวาบน</option>
                                <option value="top-left">ซ้ายบน</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ความโปร่งใส
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={state.watermark.opacity}
                                onChange={(e) =>
                                    updateState({
                                        watermark: { ...state.watermark, opacity: parseFloat(e.target.value) },
                                    })
                                }
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
