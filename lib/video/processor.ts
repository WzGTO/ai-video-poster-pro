// Video Processor using FFmpeg
// Functions for audio, subtitles, watermark, music, and optimization

import { spawn } from "child_process";
import { writeFile, unlink, readFile, mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

// ===== Types =====

export interface SubtitleStyle {
    position: "top" | "center" | "bottom";
    color: string;
    fontSize: number;
    fontFamily?: string;
    backgroundColor?: string;
    outline?: boolean;
}

export interface WatermarkConfig {
    text: string;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
    opacity: number; // 0.0 - 1.0
    size: number; // font size
    color?: string;
}

export interface PlatformConfig {
    codec: string;
    bitrate: string;
    resolution: { width: number; height: number };
    fps: number;
    audioBitrate: string;
}

// ===== Platform Configurations =====

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
    tiktok: {
        codec: "libx264",
        bitrate: "4M",
        resolution: { width: 1080, height: 1920 },
        fps: 30,
        audioBitrate: "128k",
    },
    facebook: {
        codec: "libx264",
        bitrate: "6M",
        resolution: { width: 1080, height: 1920 },
        fps: 30,
        audioBitrate: "128k",
    },
    youtube: {
        codec: "libx264",
        bitrate: "8M",
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        audioBitrate: "192k",
    },
    instagram: {
        codec: "libx264",
        bitrate: "3.5M",
        resolution: { width: 1080, height: 1920 },
        fps: 30,
        audioBitrate: "128k",
    },
};

// ===== Main Functions =====

/**
 * Add voiceover audio to video
 */
export async function addVoiceoverToVideo(
    videoBuffer: Buffer,
    audioBuffer: Buffer
): Promise<Buffer> {
    const tempDir = await mkdtemp(join(tmpdir(), "video-"));
    const videoPath = join(tempDir, "input.mp4");
    const audioPath = join(tempDir, "audio.mp3");
    const outputPath = join(tempDir, "output.mp4");

    try {
        // Write input files
        await writeFile(videoPath, videoBuffer);
        await writeFile(audioPath, audioBuffer);

        // Run FFmpeg
        await runFFmpeg([
            "-i", videoPath,
            "-i", audioPath,
            "-c:v", "copy",
            "-c:a", "aac",
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-shortest",
            "-y",
            outputPath,
        ]);

        // Read output
        const outputBuffer = await readFile(outputPath);

        return outputBuffer;
    } finally {
        // Cleanup
        await cleanupFiles([videoPath, audioPath, outputPath]);
    }
}

/**
 * Add subtitles to video
 */
export async function addSubtitles(
    videoBuffer: Buffer,
    script: string,
    style: SubtitleStyle
): Promise<Buffer> {
    const tempDir = await mkdtemp(join(tmpdir(), "video-"));
    const videoPath = join(tempDir, "input.mp4");
    const srtPath = join(tempDir, "subtitles.srt");
    const outputPath = join(tempDir, "output.mp4");

    try {
        // Write video
        await writeFile(videoPath, videoBuffer);

        // Generate SRT file from script
        const srtContent = generateSRT(script);
        await writeFile(srtPath, srtContent, "utf-8");

        // Build subtitle filter
        const subtitleFilter = buildSubtitleFilter(srtPath, style);

        // Run FFmpeg
        await runFFmpeg([
            "-i", videoPath,
            "-vf", subtitleFilter,
            "-c:a", "copy",
            "-y",
            outputPath,
        ]);

        const outputBuffer = await readFile(outputPath);
        return outputBuffer;
    } finally {
        await cleanupFiles([videoPath, srtPath, outputPath]);
    }
}

/**
 * Add watermark text overlay
 */
export async function addWatermark(
    videoBuffer: Buffer,
    config: WatermarkConfig
): Promise<Buffer> {
    const tempDir = await mkdtemp(join(tmpdir(), "video-"));
    const videoPath = join(tempDir, "input.mp4");
    const outputPath = join(tempDir, "output.mp4");

    try {
        await writeFile(videoPath, videoBuffer);

        // Build drawtext filter
        const position = getWatermarkPosition(config.position);
        const color = config.color || "white";
        const opacity = config.opacity || 0.7;

        const drawTextFilter = [
            `drawtext=text='${escapeFFmpegText(config.text)}'`,
            `fontsize=${config.size}`,
            `fontcolor=${color}@${opacity}`,
            position,
        ].join(":");

        await runFFmpeg([
            "-i", videoPath,
            "-vf", drawTextFilter,
            "-c:a", "copy",
            "-y",
            outputPath,
        ]);

        const outputBuffer = await readFile(outputPath);
        return outputBuffer;
    } finally {
        await cleanupFiles([videoPath, outputPath]);
    }
}

/**
 * Add background music
 */
export async function addBackgroundMusic(
    videoBuffer: Buffer,
    musicBuffer: Buffer,
    volume: number = 0.3
): Promise<Buffer> {
    const tempDir = await mkdtemp(join(tmpdir(), "video-"));
    const videoPath = join(tempDir, "input.mp4");
    const musicPath = join(tempDir, "music.mp3");
    const outputPath = join(tempDir, "output.mp4");

    try {
        await writeFile(videoPath, videoBuffer);
        await writeFile(musicPath, musicBuffer);

        // Mix audio: keep original audio, add music at lower volume
        const audioFilter = `[1:a]volume=${volume}[music];[0:a][music]amix=inputs=2:duration=first`;

        await runFFmpeg([
            "-i", videoPath,
            "-i", musicPath,
            "-filter_complex", audioFilter,
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            "-y",
            outputPath,
        ]);

        const outputBuffer = await readFile(outputPath);
        return outputBuffer;
    } finally {
        await cleanupFiles([videoPath, musicPath, outputPath]);
    }
}

/**
 * Optimize video for specific platform
 */
export async function optimizeForPlatform(
    videoBuffer: Buffer,
    platform: "tiktok" | "facebook" | "youtube" | "instagram"
): Promise<Buffer> {
    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
        throw new Error(`Unknown platform: ${platform}`);
    }

    const tempDir = await mkdtemp(join(tmpdir(), "video-"));
    const videoPath = join(tempDir, "input.mp4");
    const outputPath = join(tempDir, "output.mp4");

    try {
        await writeFile(videoPath, videoBuffer);

        await runFFmpeg([
            "-i", videoPath,
            "-c:v", config.codec,
            "-b:v", config.bitrate,
            "-vf", `scale=${config.resolution.width}:${config.resolution.height}:force_original_aspect_ratio=decrease,pad=${config.resolution.width}:${config.resolution.height}:(ow-iw)/2:(oh-ih)/2`,
            "-r", String(config.fps),
            "-c:a", "aac",
            "-b:a", config.audioBitrate,
            "-movflags", "+faststart",
            "-y",
            outputPath,
        ]);

        const outputBuffer = await readFile(outputPath);
        return outputBuffer;
    } finally {
        await cleanupFiles([videoPath, outputPath]);
    }
}

/**
 * Extract thumbnail from video
 */
export async function extractThumbnail(
    videoBuffer: Buffer,
    timeSeconds: number = 0
): Promise<Buffer> {
    const tempDir = await mkdtemp(join(tmpdir(), "video-"));
    const videoPath = join(tempDir, "input.mp4");
    const outputPath = join(tempDir, "thumbnail.jpg");

    try {
        await writeFile(videoPath, videoBuffer);

        await runFFmpeg([
            "-i", videoPath,
            "-ss", String(timeSeconds),
            "-vframes", "1",
            "-q:v", "2",
            "-y",
            outputPath,
        ]);

        const outputBuffer = await readFile(outputPath);
        return outputBuffer;
    } finally {
        await cleanupFiles([videoPath, outputPath]);
    }
}

/**
 * Get video duration
 */
export async function getVideoDuration(videoBuffer: Buffer): Promise<number> {
    const tempDir = await mkdtemp(join(tmpdir(), "video-"));
    const videoPath = join(tempDir, "input.mp4");

    try {
        await writeFile(videoPath, videoBuffer);

        const result = await runFFprobe([
            "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            videoPath,
        ]);

        return parseFloat(result.trim());
    } finally {
        await cleanupFiles([videoPath]);
    }
}

// ===== Helper Functions =====

/**
 * Run FFmpeg command
 */
function runFFmpeg(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const process = spawn("ffmpeg", args);
        let stdout = "";
        let stderr = "";

        process.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        process.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        process.on("close", (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
            }
        });

        process.on("error", (error) => {
            reject(new Error(`FFmpeg error: ${error.message}`));
        });
    });
}

/**
 * Run FFprobe command
 */
function runFFprobe(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const process = spawn("ffprobe", args);
        let stdout = "";
        let stderr = "";

        process.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        process.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        process.on("close", (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`FFprobe failed: ${stderr}`));
            }
        });
    });
}

/**
 * Generate SRT subtitle file from script
 */
function generateSRT(script: string, durationPerLine: number = 3): string {
    const lines = script.split(/[.!?。！？]+/).filter((line) => line.trim());
    let srt = "";
    let startTime = 0;

    lines.forEach((line, index) => {
        const endTime = startTime + durationPerLine;
        srt += `${index + 1}\n`;
        srt += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
        srt += `${line.trim()}\n\n`;
        startTime = endTime;
    });

    return srt;
}

/**
 * Format time for SRT
 */
function formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

/**
 * Build subtitle filter string
 */
function buildSubtitleFilter(srtPath: string, style: SubtitleStyle): string {
    const yPosition = {
        top: "10",
        center: "(h-text_h)/2",
        bottom: "h-th-10",
    };

    const fontColor = style.color || "white";
    const fontSize = style.fontSize || 24;
    const bgColor = style.backgroundColor || "black@0.5";

    return `subtitles=${srtPath}:force_style='FontSize=${fontSize},PrimaryColour=&H${hexToFFmpegColor(fontColor)}&,OutlineColour=&H80000000&,BorderStyle=4,BackColour=&H${hexToFFmpegColor(bgColor)}&,Alignment=2,MarginV=${style.position === "top" ? 50 : 30}'`;
}

/**
 * Get watermark position
 */
function getWatermarkPosition(position: WatermarkConfig["position"]): string {
    const positions: Record<string, string> = {
        "top-left": "x=10:y=10",
        "top-right": "x=w-tw-10:y=10",
        "bottom-left": "x=10:y=h-th-10",
        "bottom-right": "x=w-tw-10:y=h-th-10",
        "center": "x=(w-tw)/2:y=(h-th)/2",
    };
    return positions[position] || positions["bottom-right"];
}

/**
 * Escape text for FFmpeg
 */
function escapeFFmpegText(text: string): string {
    return text
        .replace(/'/g, "'\\''")
        .replace(/:/g, "\\:")
        .replace(/\\/g, "\\\\");
}

/**
 * Convert hex color to FFmpeg format
 */
function hexToFFmpegColor(hex: string): string {
    // Remove # if present
    hex = hex.replace("#", "");
    // FFmpeg uses BGR format
    if (hex.length === 6) {
        return hex.slice(4, 6) + hex.slice(2, 4) + hex.slice(0, 2);
    }
    return "FFFFFF";
}

/**
 * Cleanup temporary files
 */
async function cleanupFiles(paths: string[]): Promise<void> {
    for (const path of paths) {
        try {
            await unlink(path);
        } catch {
            // Ignore cleanup errors
        }
    }
}
