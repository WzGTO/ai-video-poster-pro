"use client";

import { useRouter } from "next/navigation";
import { Download, RefreshCw, Edit, FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoActionsProps {
    video: {
        id: string;
        public_url: string;
        product?: { id: string };
    };
}

export function VideoActions({ video }: VideoActionsProps) {
    const router = useRouter();

    const handleDownload = async () => {
        try {
            const response = await fetch(video.public_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `video-${video.id}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download error:", error);
            window.open(video.public_url, "_blank");
        }
    };

    const handleRecreate = () => {
        if (video.product?.id) {
            router.push(`/dashboard/videos/create?productId=${video.product.id}`);
        } else {
            router.push("/dashboard/videos/create");
        }
    };

    const handleOpenDrive = () => {
        window.open("https://drive.google.com", "_blank");
    };

    const handleDelete = async () => {
        if (!confirm("ต้องการลบวิดีโอนี้หรือไม่?")) return;

        try {
            const res = await fetch(`/api/videos/${video.id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/dashboard/videos");
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">การดำเนินการ</h3>

            <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    💾 ดาวน์โหลด
                </Button>

                <Button variant="outline" className="justify-start" onClick={handleRecreate}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    🔄 สร้างใหม่
                </Button>

                <Button variant="outline" className="justify-start">
                    <Edit className="w-4 h-4 mr-2" />
                    ✏️ แก้ไข
                </Button>

                <Button variant="outline" className="justify-start" onClick={handleOpenDrive}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    📁 เปิด Drive
                </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                    variant="ghost"
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleDelete}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    ลบวิดีโอ
                </Button>
            </div>
        </div>
    );
}
