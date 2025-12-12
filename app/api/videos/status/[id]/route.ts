import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVideoById } from "@/lib/db/videos";
import { getJob, PROCESSING_STEPS } from "@/lib/video/types";

/**
 * GET /api/videos/status/[id]
 * ตรวจสอบสถานะการสร้างวิดีโอ
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. ตรวจสอบ authentication
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // 2. ดึงข้อมูล video จาก database
        const video = await getVideoById(id, userId);

        if (!video) {
            return NextResponse.json(
                { error: "ไม่พบวิดีโอ", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // 3. ดึง job progress จาก memory (ถ้ามี)
        const job = getJob(id);

        // 4. Determine progress based on status
        let progress = 0;
        let currentStep = "pending";
        let stepMessage = "รอดำเนินการ...";

        if (job) {
            progress = job.progress;
            currentStep = job.currentStep;
            const stepInfo = Object.values(PROCESSING_STEPS).find(
                (s) => s.step === job.currentStep
            );
            stepMessage = stepInfo?.message || "กำลังประมวลผล...";
        } else {
            // Estimate progress from status if no job found
            switch (video.status) {
                case "pending":
                    progress = 0;
                    currentStep = "pending";
                    stepMessage = "รอดำเนินการ...";
                    break;
                case "generating_script":
                    progress = 20;
                    currentStep = "generating_script";
                    stepMessage = "สร้างบทพูด...";
                    break;
                case "generating_video":
                    progress = 50;
                    currentStep = "generating_video";
                    stepMessage = "สร้างวิดีโอ AI...";
                    break;
                case "adding_audio":
                    progress = 70;
                    currentStep = "adding_audio";
                    stepMessage = "ใส่เสียง...";
                    break;
                case "adding_subtitles":
                    progress = 80;
                    currentStep = "adding_subtitles";
                    stepMessage = "ใส่ซับไตเติ้ล...";
                    break;
                case "optimizing":
                    progress = 90;
                    currentStep = "optimizing";
                    stepMessage = "ปรับแต่งวิดีโอ...";
                    break;
                case "completed":
                    progress = 100;
                    currentStep = "completed";
                    stepMessage = "เสร็จสิ้น!";
                    break;
                case "failed":
                    progress = 0;
                    currentStep = "failed";
                    stepMessage = "เกิดข้อผิดพลาด";
                    break;
            }
        }

        // 5. Build response
        const response: Record<string, unknown> = {
            success: true,
            videoId: video.id,
            status: video.status,
            progress,
            currentStep,
            stepMessage,
            isProcessing: !["completed", "failed"].includes(video.status),
            isCompleted: video.status === "completed",
            isFailed: video.status === "failed",
        };

        // Add error message if failed
        if (video.status === "failed") {
            response.error_message = video.error_message || job?.error;
        }

        // Add video URLs if completed
        if (video.status === "completed") {
            response.videoUrl = video.public_url;
            response.thumbnailUrl = video.thumbnail_url;
            response.duration = video.duration;
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error("Get video status error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการดึงสถานะ",
                code: "UNKNOWN_ERROR",
            },
            { status: 500 }
        );
    }
}
