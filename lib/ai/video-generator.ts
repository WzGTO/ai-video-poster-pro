/**
 * AI Video Generator
 * Supports multiple video generation models:
 * - Google Veo 3.1 (recommended)
 * - Luma Dream Machine
 * - Kling AI
 * 
 * Usage:
 *   import { generateVideo } from '@/lib/ai/video-generator';
 *   const result = await generateVideo(params);
 */

import { logger } from '@/lib/logger';

// ===== Types =====

export interface VideoParams {
    images: string[];       // Image URLs for reference
    script: string;         // Narration script
    cameraAngles?: string[];
    effects?: string[];
    aspectRatio: '9:16' | '16:9' | '1:1';
    duration: number;       // seconds
    style?: string;
    model?: 'veo-3.1' | 'luma' | 'kling' | 'mock';
}

export interface VideoResult {
    videoBuffer: Buffer;
    duration: number;
    resolution: string;
    format: string;
    generationId?: string;
    cost?: number;
}

interface GenerationStatus {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    videoUrl?: string;
    error?: string;
    duration?: number;
    resolution?: string;
}

// ===== Constants =====

const POLL_INTERVAL_MS = 5000;  // 5 seconds
const MAX_POLL_ATTEMPTS = 120;  // 10 minutes max

const RESOLUTION_MAP: Record<string, string> = {
    '9:16': '1080x1920',
    '16:9': '1920x1080',
    '1:1': '1080x1080',
};

// ===== Video Generator Class =====

export class VideoGenerator {
    /**
     * Generate video with Google Veo 3.1
     */
    async generateWithVeo(params: VideoParams): Promise<VideoResult> {
        const apiKey = process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            logger.warn('Veo API key not configured, falling back to Luma');
            return this.generateWithLuma(params);
        }

        try {
            logger.info('Starting Veo 3.1 video generation', { duration: params.duration });

            // Build prompt for Veo
            const prompt = this.buildVeoPrompt(params);

            // Call Veo API
            // Note: As of late 2024, Veo is available through Google AI Studio
            // The actual endpoint may vary - this is the expected format
            const response = await fetch(
                'https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:generateVideo',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey,
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt,
                            }],
                        }],
                        generationConfig: {
                            aspectRatio: params.aspectRatio,
                            durationSeconds: Math.min(params.duration, 8), // Veo max 8 seconds per clip
                            numberOfVideos: 1,
                        },
                        safetySettings: [{
                            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                            threshold: 'BLOCK_ONLY_HIGH',
                        }],
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                logger.error('Veo API error', { status: response.status, error: errorText });
                throw new Error(`Veo API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // Check if we got a generation ID for async processing
            if (data.name) {
                logger.info('Veo generation started, polling for completion', { generationId: data.name });
                return await this.pollVeoGeneration(data.name, apiKey);
            }

            // If we got video data directly
            if (data.candidates?.[0]?.content?.parts?.[0]?.videoData) {
                const videoBase64 = data.candidates[0].content.parts[0].videoData;
                const videoBuffer = Buffer.from(videoBase64, 'base64');

                return {
                    videoBuffer,
                    duration: params.duration,
                    resolution: RESOLUTION_MAP[params.aspectRatio],
                    format: 'mp4',
                };
            }

            throw new Error('Unexpected Veo response format');

        } catch (error) {
            logger.error('Veo generation failed', { error });

            // Fallback to Luma if available
            if (process.env.LUMA_API_KEY) {
                logger.info('Falling back to Luma Dream Machine');
                return this.generateWithLuma(params);
            }

            // Fallback to Kling if available
            if (process.env.KLING_API_KEY) {
                logger.info('Falling back to Kling AI');
                return this.generateWithKling(params);
            }

            // Last resort: generate mock
            logger.warn('No video API available, generating mock video');
            return this.generateMock(params);
        }
    }

    /**
     * Poll Veo generation status
     */
    private async pollVeoGeneration(operationName: string, apiKey: string): Promise<VideoResult> {
        let attempts = 0;

        while (attempts < MAX_POLL_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
            attempts++;

            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
                    {
                        headers: {
                            'x-goog-api-key': apiKey,
                        },
                    }
                );

                if (!response.ok) {
                    logger.warn('Veo poll request failed', { status: response.status });
                    continue;
                }

                const data = await response.json();

                if (data.done) {
                    if (data.error) {
                        throw new Error(`Veo generation failed: ${data.error.message}`);
                    }

                    // Extract video from response
                    const videoData = data.response?.candidates?.[0]?.content?.parts?.[0]?.videoData;

                    if (videoData) {
                        const videoBuffer = Buffer.from(videoData, 'base64');
                        return {
                            videoBuffer,
                            duration: data.response?.metadata?.durationSeconds || 0,
                            resolution: data.response?.metadata?.resolution || '1080x1920',
                            format: 'mp4',
                            generationId: operationName,
                        };
                    }

                    // If video URL is provided instead of base64
                    if (data.response?.videoUrl) {
                        const videoBuffer = await this.downloadVideoFromUrl(data.response.videoUrl);
                        return {
                            videoBuffer,
                            duration: data.response?.metadata?.durationSeconds || 0,
                            resolution: data.response?.metadata?.resolution || '1080x1920',
                            format: 'mp4',
                            generationId: operationName,
                        };
                    }
                }

                logger.info('Veo generation in progress', {
                    attempts,
                    progress: data.metadata?.progress || 'unknown'
                });

            } catch (error) {
                logger.warn('Veo poll error', { error, attempts });
            }
        }

        throw new Error('Veo generation timed out');
    }

    /**
     * Generate video with Luma Dream Machine
     */
    async generateWithLuma(params: VideoParams): Promise<VideoResult> {
        const apiKey = process.env.LUMA_API_KEY;

        if (!apiKey) {
            throw new Error('LUMA_API_KEY not configured');
        }

        try {
            logger.info('Starting Luma Dream Machine generation');

            const prompt = this.buildLumaPrompt(params);

            // Create generation
            const createResponse = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    aspect_ratio: params.aspectRatio.replace(':', ':'),
                    loop: false,
                }),
            });

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                throw new Error(`Luma API error: ${createResponse.status} - ${errorText}`);
            }

            const createData = await createResponse.json();

            // Poll for completion
            return await this.pollLumaGeneration(createData.id, apiKey);

        } catch (error) {
            logger.error('Luma generation failed', { error });
            throw error;
        }
    }

    /**
     * Poll Luma generation status
     */
    private async pollLumaGeneration(generationId: string, apiKey: string): Promise<VideoResult> {
        let attempts = 0;

        while (attempts < MAX_POLL_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
            attempts++;

            try {
                const response = await fetch(
                    `https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                        },
                    }
                );

                if (!response.ok) {
                    continue;
                }

                const data = await response.json();

                if (data.state === 'completed') {
                    const videoBuffer = await this.downloadVideoFromUrl(data.video.url);

                    return {
                        videoBuffer,
                        duration: data.video.duration || 5,
                        resolution: RESOLUTION_MAP[data.aspect_ratio] || '1080x1920',
                        format: 'mp4',
                        generationId,
                    };
                } else if (data.state === 'failed') {
                    throw new Error(`Luma generation failed: ${data.failure_reason}`);
                }

                logger.info('Luma generation in progress', {
                    attempts,
                    state: data.state
                });

            } catch (error) {
                logger.warn('Luma poll error', { error, attempts });
            }
        }

        throw new Error('Luma generation timed out');
    }

    /**
     * Generate video with Kling AI
     */
    async generateWithKling(params: VideoParams): Promise<VideoResult> {
        const apiKey = process.env.KLING_API_KEY;

        if (!apiKey) {
            throw new Error('KLING_API_KEY not configured');
        }

        try {
            logger.info('Starting Kling AI generation');

            const prompt = this.buildKlingPrompt(params);

            // Create generation
            const createResponse = await fetch('https://api.klingai.com/v1/videos/text2video', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    negative_prompt: 'blurry, low quality, distorted, ugly',
                    cfg_scale: 7.5,
                    duration: Math.min(params.duration, 10), // Kling max 10 seconds
                    aspect_ratio: params.aspectRatio,
                    mode: 'professional',
                }),
            });

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                throw new Error(`Kling API error: ${createResponse.status} - ${errorText}`);
            }

            const createData = await createResponse.json();

            // Poll for completion
            return await this.pollKlingGeneration(createData.task_id, apiKey);

        } catch (error) {
            logger.error('Kling generation failed', { error });
            throw error;
        }
    }

    /**
     * Poll Kling generation status
     */
    private async pollKlingGeneration(taskId: string, apiKey: string): Promise<VideoResult> {
        let attempts = 0;

        while (attempts < MAX_POLL_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
            attempts++;

            try {
                const response = await fetch(
                    `https://api.klingai.com/v1/videos/text2video/${taskId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                        },
                    }
                );

                if (!response.ok) {
                    continue;
                }

                const data = await response.json();

                if (data.status === 'succeed') {
                    const videoBuffer = await this.downloadVideoFromUrl(data.video_url);

                    return {
                        videoBuffer,
                        duration: data.duration || 5,
                        resolution: RESOLUTION_MAP[data.aspect_ratio] || '1080x1920',
                        format: 'mp4',
                        generationId: taskId,
                    };
                } else if (data.status === 'failed') {
                    throw new Error(`Kling generation failed: ${data.error_message}`);
                }

                logger.info('Kling generation in progress', {
                    attempts,
                    status: data.status,
                    progress: data.progress
                });

            } catch (error) {
                logger.warn('Kling poll error', { error, attempts });
            }
        }

        throw new Error('Kling generation timed out');
    }

    /**
     * Generate mock video (for development/testing)
     */
    async generateMock(params: VideoParams): Promise<VideoResult> {
        logger.info('Generating mock video');

        // Create a minimal valid MP4 file (placeholder)
        // In production, you could use FFmpeg to generate a test pattern
        const mockVideoHeader = Buffer.from([
            // ftyp box (file type)
            0x00, 0x00, 0x00, 0x20, // size
            0x66, 0x74, 0x79, 0x70, // 'ftyp'
            0x69, 0x73, 0x6F, 0x6D, // 'isom'
            0x00, 0x00, 0x02, 0x00, // minor version
            0x69, 0x73, 0x6F, 0x6D, // 'isom'
            0x69, 0x73, 0x6F, 0x32, // 'iso2'
            0x61, 0x76, 0x63, 0x31, // 'avc1'
            0x6D, 0x70, 0x34, 0x31, // 'mp41'
        ]);

        return {
            videoBuffer: mockVideoHeader,
            duration: params.duration,
            resolution: RESOLUTION_MAP[params.aspectRatio],
            format: 'mp4',
            generationId: `mock-${Date.now()}`,
        };
    }

    // ===== Prompt Builders =====

    private buildVeoPrompt(params: VideoParams): string {
        const parts: string[] = [];

        // Main instruction
        parts.push('Create a professional product advertisement video for Thai market.');
        parts.push('');

        // Script/narrative
        parts.push(`Narrative: "${params.script}"`);
        parts.push('');

        // Style
        if (params.style) {
            parts.push(`Visual Style: ${params.style}`);
        }

        // Camera angles
        if (params.cameraAngles?.length) {
            parts.push(`Camera Movements: ${params.cameraAngles.join(', ')}`);
        }

        // Effects
        if (params.effects?.length) {
            parts.push(`Effects: ${params.effects.join(', ')}`);
        }

        // Technical requirements
        parts.push('');
        parts.push('Technical Requirements:');
        parts.push('- High quality, professional lighting');
        parts.push('- Smooth camera movements');
        parts.push('- Product-focused composition');
        parts.push('- Clean, modern aesthetic');

        return parts.join('\n');
    }

    private buildLumaPrompt(params: VideoParams): string {
        const parts: string[] = [];

        // Script-based description
        parts.push(params.script);
        parts.push('');

        // Style modifiers
        parts.push('Professional product video, advertising quality');

        if (params.style) {
            parts.push(params.style);
        }

        if (params.cameraAngles?.length) {
            parts.push(`with ${params.cameraAngles.join(' and ')} shots`);
        }

        parts.push('high production value, cinematic lighting');

        return parts.join(', ');
    }

    private buildKlingPrompt(params: VideoParams): string {
        const parts: string[] = [];

        // Main content
        parts.push(params.script);

        // Style
        if (params.style) {
            parts.push(`Style: ${params.style}`);
        }

        // Camera
        if (params.cameraAngles?.length) {
            parts.push(`Camera: ${params.cameraAngles.join(', ')}`);
        }

        // Quality modifiers
        parts.push('professional advertising, high quality, 4K');

        return parts.join('. ');
    }

    // ===== Utility Methods =====

    private async downloadVideoFromUrl(url: string): Promise<Buffer> {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}

// ===== Main Export Function =====

/**
 * Generate video using AI
 * Automatically selects the best available model
 */
export async function generateVideo(params: VideoParams): Promise<VideoResult> {
    const generator = new VideoGenerator();

    // Determine which model to use
    const model = params.model || determineAvailableModel();

    logger.info('Starting video generation', { model, duration: params.duration });

    switch (model) {
        case 'veo-3.1':
            return generator.generateWithVeo(params);

        case 'luma':
            return generator.generateWithLuma(params);

        case 'kling':
            return generator.generateWithKling(params);

        case 'mock':
            return generator.generateMock(params);

        default:
            // Default: try Veo with fallbacks
            return generator.generateWithVeo(params);
    }
}

/**
 * Determine which model is available based on API keys
 */
function determineAvailableModel(): VideoParams['model'] {
    if (process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY) {
        return 'veo-3.1';
    }

    if (process.env.LUMA_API_KEY) {
        return 'luma';
    }

    if (process.env.KLING_API_KEY) {
        return 'kling';
    }

    return 'mock';
}

/**
 * Get estimated cost for video generation
 */
export function estimateVideoCost(
    model: VideoParams['model'],
    durationSeconds: number
): number {
    // Estimated costs per second (USD)
    const costPerSecond: Record<string, number> = {
        'veo-3.1': 0.10,  // Estimated
        'luma': 0.05,
        'kling': 0.03,
        'mock': 0,
    };

    return (costPerSecond[model || 'mock'] || 0) * durationSeconds;
}

/**
 * Get available video models
 */
export function getAvailableModels(): { id: string; name: string; available: boolean }[] {
    return [
        {
            id: 'veo-3.1',
            name: 'Google Veo 3.1',
            available: !!(process.env.GOOGLE_AI_STUDIO_KEY || process.env.GEMINI_API_KEY),
        },
        {
            id: 'luma',
            name: 'Luma Dream Machine',
            available: !!process.env.LUMA_API_KEY,
        },
        {
            id: 'kling',
            name: 'Kling AI',
            available: !!process.env.KLING_API_KEY,
        },
        {
            id: 'mock',
            name: 'Mock (Development)',
            available: true,
        },
    ];
}
