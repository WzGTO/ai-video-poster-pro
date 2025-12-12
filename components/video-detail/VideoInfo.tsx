"use client";

import { Clock, HardDrive, Monitor, FileText, Camera, Cpu } from "lucide-react";

interface VideoInfoProps {
    duration: number;
    fileSize: number;
    resolution: string;
    script: string;
    cameraAngles: string[];
    models: { text: string; video: string; tts: string };
}

export function VideoInfo({ duration, fileSize, resolution, script, cameraAngles, models }: VideoInfoProps) {
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
    };

    const formatFileSize = (bytes: number) => {
        if (!bytes) return "-";
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">ข้อมูลวิดีโอ</h3>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs text-gray-500">ความยาว</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatDuration(duration)}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <HardDrive className="w-5 h-5 mx-auto mb-1 text-green-500" />
                    <p className="text-xs text-gray-500">ขนาดไฟล์</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatFileSize(fileSize)}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <Monitor className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-xs text-gray-500">ความละเอียด</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{resolution || "1080x1920"}</p>
                </div>
            </div>

            {/* Script */}
            {script && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">บทพูด</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        {script}
                    </p>
                </div>
            )}

            {/* Camera Angles */}
            {cameraAngles && cameraAngles.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Camera className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">มุมกล้อง</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {cameraAngles.map((angle, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                {angle}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Models */}
            {models && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Cpu className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI โมเดล</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <p className="text-gray-500">Text</p>
                            <p className="font-medium text-gray-900 dark:text-white truncate">{models.text}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <p className="text-gray-500">Video</p>
                            <p className="font-medium text-gray-900 dark:text-white truncate">{models.video}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <p className="text-gray-500">TTS</p>
                            <p className="font-medium text-gray-900 dark:text-white truncate">{models.tts || "-"}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
