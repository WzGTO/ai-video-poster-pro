import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProductById } from "@/lib/db/products";
import { createVideo, updateVideoStatus, updateVideoFiles } from "@/lib/db/videos";
import { getUserById } from "@/lib/db/users";
import { GoogleDriveManager } from "@/lib/google-drive";
import { generateVideoScript, analyzeProduct } from "@/lib/ai/gemini";
import { revalidateCache } from "@/lib/cache/api-cache";
import {
    VideoCreationRequest,
    PROCESSING_STEPS,
    setJob,
    updateJobProgress,
    updateJobStatus,
    withRetry,
} from "@/lib/video/types";

// ===== Types =====

interface CreateVideoBody extends VideoCreationRequest { }

// ===== Validation =====

function validateRequest(body: CreateVideoBody): { valid: boolean; error?: string } {
    if (!body.productId) {
        return { valid: false, error: "productId is required" };
    }

    if (!body.mode || !["auto", "manual"].includes(body.mode)) {
        return { valid: false, error: "mode must be 'auto' or 'manual'" };
    }

    if (!body.aspectRatio || !["9:16", "16:9", "1:1"].includes(body.aspectRatio)) {
        return { valid: false, error: "aspectRatio must be '9:16', '16:9', or '1:1'" };
    }

    if (!body.duration || body.duration < 5 || body.duration > 180) {
        return { valid: false, error: "duration must be between 5 and 180 seconds" };
    }

    if (body.mode === "manual") {
        if (!body.images || body.images.length === 0) {
            return { valid: false, error: "images are required for manual mode" };
        }
        if (!body.script) {
            return { valid: false, error: "script is required for manual mode" };
        }
    }

    if (!body.models?.video) {
        return { valid: false, error: "models.video is required" };
    }

    return { valid: true };
}

// ===== Route Handler =====

/**
 * POST /api/videos/create
 * Create a new video (async processing)
 */
export async function POST(request: NextRequest) {
    try {
        // 1. ตรวจสอบ authentication
        const session = await auth();

        if (!session?.user?.id || !session?.accessToken) {
            return NextResponse.json(
                { error: "กรุณาเข้าสู่ระบบ", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const accessToken = session.accessToken;

        // 2. Parse and validate request
        const body: CreateVideoBody = await request.json();
        const validation = validateRequest(body);

        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error, code: "VALIDATION_ERROR" },
                { status: 400 }
            );
        }

        // 3. ตรวจสอบ user folders
        const user = await getUserById(userId);
        if (!user?.google_drive_folders) {
            return NextResponse.json(
                {
                    error: "กรุณาสร้างโฟลเดอร์ Google Drive ก่อน",
                    code: "FOLDERS_NOT_INITIALIZED",
                },
                { status: 400 }
            );
        }

        // 4. ตรวจสอบ product
        const product = await getProductById(body.productId, userId);
        if (!product) {
            return NextResponse.json(
                { error: "ไม่พบสินค้า", code: "PRODUCT_NOT_FOUND" },
                { status: 404 }
            );
        }

        // 5. สร้าง video record ใน database (status: pending)
        const video = await createVideo(userId, {
            product_id: body.productId,
            title: `${product.name} - AI Video`,
            aspect_ratio: body.aspectRatio,
            duration: body.duration,
            style: body.style,
            voice: body.voice,
            camera_angles: body.cameraAngles || [],
            effects: body.effects || [],
            model_text: body.models.text,
            model_video: body.models.video,
            watermark_enabled: body.watermark?.enabled ?? false,
            watermark_text: body.watermark?.text,
            watermark_position: body.watermark?.position,
        });

        // 6. Create job and start async processing
        setJob(video.id, {
            videoId: video.id,
            userId,
            accessToken,
            request: body,
            status: "pending",
            progress: 0,
            currentStep: "initializing",
        });

        // 7. Start async processing (don't await)
        processVideoAsync(video.id, userId, accessToken, body, product, user).catch(
            (error) => {
                console.error("Async video processing error:", error);
            }
        );

        // 8. Return immediately with video ID (202 Accepted)
        return NextResponse.json(
            {
                success: true,
                message: "กำลังสร้างวิดีโอ...",
                videoId: video.id,
                status: "processing",
                statusUrl: `/api/videos/status/${video.id}`,
            },
            { status: 202 }
        );
    } catch (error) {
        console.error("Video create error:", error);

        return NextResponse.json(
            {
                error: "เกิดข้อผิดพลาดในการสร้างวิดีโอ",
                code: "UNKNOWN_ERROR",
                details: error instanceof Error ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}

// ===== Async Processing =====

async function processVideoAsync(
    videoId: string,
    userId: string,
    accessToken: string,
    request: CreateVideoBody,
    product: Awaited<ReturnType<typeof getProductById>>,
    user: Awaited<ReturnType<typeof getUserById>>
) {
    if (!product || !user?.google_drive_folders) {
        return;
    }

    try {
        // Update status to processing
        await updateVideoStatus(videoId, userId, "generating_script");
        updateJobProgress(videoId, PROCESSING_STEPS.INITIALIZING);

        const driveManager = new GoogleDriveManager(accessToken);
        const folders = user.google_drive_folders;

        let script = request.script || "";
        let images = request.images || [];
        let cameraAngles = request.cameraAngles || [];

        // ===== Auto Mode: Analyze and Generate =====
        if (request.mode === "auto") {
            // Step 1: Analyze product
            updateJobProgress(videoId, PROCESSING_STEPS.ANALYZING);

            try {
                const analysis = await withRetry(() =>
                    analyzeProduct(
                        {
                            name: product.name,
                            description: product.description || undefined,
                            price: product.price,
                            category: product.category || undefined,
                        },
                        product.images.slice(0, 4)
                    )
                );

                // Use suggested camera angles if not provided
                if (cameraAngles.length === 0) {
                    cameraAngles = analysis.suggestedCameraAngles;
                }
            } catch (error) {
                console.warn("Product analysis failed, using defaults:", error);
            }

            // Step 2: Generate script
            updateJobProgress(videoId, PROCESSING_STEPS.GENERATING_SCRIPT);

            script = await withRetry(() =>
                generateVideoScript({
                    productName: product.name,
                    description: product.description || undefined,
                    price: product.price,
                    style: (request.style as Parameters<typeof generateVideoScript>[0]["style"]) || "tiktok",
                    duration: request.duration,
                    language: "th",
                })
            );

            // Use product images
            images = product.images;
        }

        // Update video record with script
        await updateVideoFiles(videoId, userId, {});

        // Step 3: Download images from Drive
        updateJobProgress(videoId, PROCESSING_STEPS.DOWNLOADING_IMAGES);

        const imageBuffers: Buffer[] = [];
        for (const imageUrl of images.slice(0, 5)) {
            try {
                // Check if it's a Drive URL or external URL
                const driveMatch = imageUrl.match(/id=([a-zA-Z0-9_-]+)/);
                if (driveMatch) {
                    const stream = await driveManager.downloadFile(driveMatch[1]);
                    const chunks: Buffer[] = [];
                    for await (const chunk of stream) {
                        chunks.push(Buffer.from(chunk));
                    }
                    imageBuffers.push(Buffer.concat(chunks));
                } else {
                    // Download from external URL
                    const response = await fetch(imageUrl);
                    const arrayBuffer = await response.arrayBuffer();
                    imageBuffers.push(Buffer.from(arrayBuffer));
                }
            } catch (error) {
                console.warn(`Failed to download image: ${imageUrl}`, error);
            }
        }

        if (imageBuffers.length === 0) {
            throw new Error("ไม่สามารถดาวน์โหลดรูปภาพได้");
        }

        // Step 4: Generate video (mock for now - actual implementation would call video AI)
        updateJobProgress(videoId, PROCESSING_STEPS.GENERATING_VIDEO);
        await updateVideoStatus(videoId, userId, "generating_video");

        // TODO: Implement actual video generation with Veo/Luma/Kling
        // For now, create a placeholder video
        const videoBuffer = await generateMockVideo(request.duration);

        // Step 5: Generate voiceover if voice is specified
        let audioBuffer: Buffer | undefined;
        if (request.voice && script) {
            updateJobProgress(videoId, PROCESSING_STEPS.GENERATING_VOICEOVER);
            await updateVideoStatus(videoId, userId, "adding_audio");

            // TODO: Implement actual TTS
            // audioBuffer = await generateVoiceover({ script, voice: request.voice, language: 'th' });
        }

        // Step 6: Merge audio with video
        if (audioBuffer) {
            updateJobProgress(videoId, PROCESSING_STEPS.ADDING_AUDIO);
            // TODO: videoBuffer = await addVoiceoverToVideo(videoBuffer, audioBuffer);
        }

        // Step 7: Add subtitles
        if (request.subtitle?.enabled && script) {
            updateJobProgress(videoId, PROCESSING_STEPS.ADDING_SUBTITLES);
            await updateVideoStatus(videoId, userId, "adding_subtitles");
            // TODO: videoBuffer = await addSubtitles(videoBuffer, script, request.subtitle.style);
        }

        // Step 8: Add watermark
        if (request.watermark?.enabled) {
            updateJobProgress(videoId, PROCESSING_STEPS.ADDING_WATERMARK);
            // TODO: videoBuffer = await addWatermark(videoBuffer, request.watermark);
        }

        // Step 9: Add background music
        if (request.music) {
            updateJobProgress(videoId, PROCESSING_STEPS.ADDING_MUSIC);
            // TODO: videoBuffer = await addBackgroundMusic(videoBuffer, musicBuffer, 0.3);
        }

        // Step 10: Upload video to Drive
        updateJobProgress(videoId, PROCESSING_STEPS.UPLOADING);

        const uploadedVideo = await driveManager.uploadFile({
            file: videoBuffer,
            filename: `video_${videoId}.mp4`,
            mimeType: "video/mp4",
            folderId: folders.videos.originals,
            description: `AI Video for ${product.name}`,
        });

        // Step 11: Generate and upload thumbnail
        const thumbnailBuffer = await generateThumbnail(imageBuffers[0]);
        const uploadedThumbnail = await driveManager.uploadFile({
            file: thumbnailBuffer,
            filename: `thumbnail_${videoId}.jpg`,
            mimeType: "image/jpeg",
            folderId: folders.videos.thumbnails,
        });

        // Step 12: Optimize for platforms (TODO)
        updateJobProgress(videoId, PROCESSING_STEPS.OPTIMIZING);
        await updateVideoStatus(videoId, userId, "optimizing");

        // Step 13: Update video record with file info
        await updateVideoFiles(videoId, userId, {
            original_file_id: uploadedVideo.id,
            thumbnail_file_id: uploadedThumbnail.id,
            public_url: uploadedVideo.publicUrl,
            thumbnail_url: uploadedThumbnail.publicUrl,
        });

        // Step 14: Mark as completed
        await updateVideoStatus(videoId, userId, "completed");
        updateJobProgress(videoId, PROCESSING_STEPS.COMPLETED);
        updateJobStatus(videoId, "completed");

        // Revalidate videos cache
        await revalidateCache('videos');

        console.log(`Video ${videoId} processing completed successfully`);
    } catch (error) {
        console.error(`Video ${videoId} processing failed:`, error);

        // Update status to failed
        const errorMessage =
            error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";

        await updateVideoStatus(videoId, userId, "failed", errorMessage);
        updateJobStatus(videoId, "failed", errorMessage);
    }
}

// ===== Helper Functions =====

async function generateMockVideo(duration: number): Promise<Buffer> {
    // In production, this would call actual video generation API
    // For now, return a minimal video buffer placeholder
    console.log(`Generating mock video for ${duration} seconds`);

    // Return empty buffer (actual implementation would generate real video)
    return Buffer.alloc(1024);
}

async function generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    // In production, this would extract first frame or resize image
    // For now, return the input image
    return imageBuffer;
}
