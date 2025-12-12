"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Upload, Music, Volume2 } from "lucide-react";
import { VideoCreationState } from "@/hooks/useVideoCreation";
import { cn } from "@/lib/utils";

interface StepManualModeProps {
    state: VideoCreationState;
    updateState: (updates: Partial<VideoCreationState>) => void;
}

const ASPECT_RATIOS = [
    { value: "9:16", label: "แนวตั้ง" },
    { value: "16:9", label: "แนวนอน" },
    { value: "1:1", label: "สี่เหลี่ยม" },
];

const CAMERA_TABS = ["พื้นฐาน", "การเคลื่อนไหว", "พิเศษ", "Effects"];
const CAMERA_OPTIONS = {
    0: ["close-up", "wide-shot", "product-showcase"],
    1: ["zoom-in", "zoom-out", "pan", "orbit"],
    2: ["unboxing", "lifestyle", "360-spin"],
    3: ["fade", "flash", "glow", "sparkle"],
};

const VOICES = [
    { value: "iapp-somying", label: "👩 สมหญิง" },
    { value: "iapp-somchai", label: "👨 สมชาย" },
    { value: "none", label: "🔇 ไม่ใส่" },
];

const MUSIC = [
    { value: "none", label: "ไม่ใส่เพลง" },
    { value: "upbeat", label: "🎵 Upbeat" },
    { value: "chill", label: "🎶 Chill" },
];

export function StepManualMode({ state, updateState }: StepManualModeProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [scriptMode, setScriptMode] = useState<"ai" | "custom">("ai");

    const toggleImage = (img: string) => {
        const current = state.selectedImages || [];
        updateState({ selectedImages: current.includes(img) ? current.filter(i => i !== img) : [...current, img] });
    };

    const toggleAngle = (angle: string) => {
        const current = state.cameraAngles || [];
        updateState({ cameraAngles: current.includes(angle) ? current.filter(a => a !== angle) : [...current, angle] });
    };

    return (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">✋ โหมดกำหนดเอง</h2>
            </div>

            {/* Aspect Ratio */}
            <div>
                <label className="block text-sm font-medium mb-2">รูปแบบวิดีโอ</label>
                <div className="flex gap-2">
                    {ASPECT_RATIOS.map(r => (
                        <button key={r.value} onClick={() => updateState({ aspectRatio: r.value as "9:16" | "16:9" | "1:1" })}
                            className={cn("flex-1 p-3 rounded-xl border-2", state.aspectRatio === r.value ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" : "border-gray-200 dark:border-gray-700")}>
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Image Selection */}
            {state.product?.images && (
                <div>
                    <label className="block text-sm font-medium mb-2">เลือกรูป</label>
                    <div className="grid grid-cols-5 gap-2">
                        {state.product.images.map((img, i) => (
                            <button key={i} onClick={() => toggleImage(img)} className={cn("relative aspect-square rounded-lg overflow-hidden border-2", state.selectedImages?.includes(img) ? "border-purple-500" : "border-gray-200")}>
                                <Image src={img} alt="" fill className="object-cover" />
                                {state.selectedImages?.includes(img) && <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center"><Check className="w-5 h-5 text-white" /></div>}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Script */}
            <div>
                <label className="block text-sm font-medium mb-2">บทพูด</label>
                <div className="flex gap-2 mb-3">
                    <button onClick={() => setScriptMode("ai")} className={cn("flex-1 p-2 rounded-lg border", scriptMode === "ai" ? "border-purple-500 bg-purple-50" : "border-gray-200")}>🤖 AI สร้าง</button>
                    <button onClick={() => setScriptMode("custom")} className={cn("flex-1 p-2 rounded-lg border", scriptMode === "custom" ? "border-purple-500 bg-purple-50" : "border-gray-200")}>✍️ เขียนเอง</button>
                </div>
                {scriptMode === "custom" && (
                    <textarea value={state.script} onChange={e => updateState({ script: e.target.value })} maxLength={500} rows={3} className="w-full p-3 rounded-xl border" placeholder="เขียนบทพูด..." />
                )}
            </div>

            {/* Camera Angles */}
            <div>
                <label className="block text-sm font-medium mb-2">มุมกล้อง</label>
                <div className="flex gap-1 mb-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {CAMERA_TABS.map((t, i) => (
                        <button key={i} onClick={() => setActiveTab(i)} className={cn("flex-1 py-1 px-2 text-xs rounded", activeTab === i ? "bg-white dark:bg-gray-600 shadow" : "")}>{t}</button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                    {CAMERA_OPTIONS[activeTab as keyof typeof CAMERA_OPTIONS].map(a => (
                        <button key={a} onClick={() => toggleAngle(a)} className={cn("px-3 py-1 rounded-lg border text-sm", state.cameraAngles?.includes(a) ? "border-purple-500 bg-purple-50" : "border-gray-200")}>{a}</button>
                    ))}
                </div>
            </div>

            {/* Duration */}
            <div>
                <label className="block text-sm font-medium mb-2">ความยาว: {state.duration}s</label>
                <input type="range" min="5" max="60" step="5" value={state.duration || 15} onChange={e => updateState({ duration: parseInt(e.target.value) })} className="w-full" />
            </div>

            {/* Voice & Music */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2"><Volume2 className="inline w-4 h-4 mr-1" />เสียงพากย์</label>
                    <select value={state.voice} onChange={e => updateState({ voice: e.target.value })} className="w-full p-2 rounded-lg border">{VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}</select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2"><Music className="inline w-4 h-4 mr-1" />เพลง</label>
                    <select value={state.music} onChange={e => updateState({ music: e.target.value })} className="w-full p-2 rounded-lg border">{MUSIC.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
                </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-4">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={state.subtitle?.enabled} onChange={e => updateState({ subtitle: { ...state.subtitle, enabled: e.target.checked } })} className="rounded" />
                    <span className="text-sm">ซับไตเติ้ล</span>
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={state.watermark?.enabled} onChange={e => updateState({ watermark: { ...state.watermark, enabled: e.target.checked } })} className="rounded" />
                    <span className="text-sm">Watermark</span>
                </label>
            </div>
        </div>
    );
}
