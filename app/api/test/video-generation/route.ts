/**
 * Video Generation Test Endpoint
 * POST /api/test/video-generation
 * 
 * For testing video generation APIs in development
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateVideo, getAvailableModels } from '@/lib/ai/video-generator';
import { generateVoiceover, getAvailableProviders } from '@/lib/ai/text-to-speech';
import { logger } from '@/lib/logger';

// Only allow in development
const IS_DEV = process.env.NODE_ENV === 'development';

export async function POST(request: NextRequest) {
    // Block in production
    if (!IS_DEV) {
        return NextResponse.json(
            { error: 'This endpoint is only available in development' },
            { status: 403 }
        );
    }

    try {
        // Check auth
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { type, ...params } = body;

        // Test video generation
        if (type === 'video') {
            logger.info('Testing video generation', { model: params.model });

            const result = await generateVideo({
                images: params.images || [],
                script: params.script || 'ทดสอบสร้างวิดีโอโฆษณาสินค้า',
                cameraAngles: params.cameraAngles || ['close-up', 'pan-right'],
                effects: params.effects || ['smooth-transition'],
                aspectRatio: params.aspectRatio || '9:16',
                duration: params.duration || 5,
                style: params.style || 'modern-minimalist',
                model: params.model || 'mock',
            });

            return NextResponse.json({
                success: true,
                message: 'Video generated successfully',
                result: {
                    duration: result.duration,
                    resolution: result.resolution,
                    format: result.format,
                    sizeBytes: result.videoBuffer.length,
                    generationId: result.generationId,
                    cost: result.cost,
                },
            });
        }

        // Test TTS
        if (type === 'tts') {
            logger.info('Testing TTS generation', { provider: params.provider });

            const result = await generateVoiceover({
                script: params.script || 'สวัสดีครับ นี่คือการทดสอบเสียงพากย์',
                voice: params.voice,
                provider: params.provider,
                speakingRate: params.speakingRate,
            });

            return NextResponse.json({
                success: true,
                message: 'Audio generated successfully',
                result: {
                    duration: result.duration,
                    format: result.format,
                    provider: result.provider,
                    sizeBytes: result.audioBuffer.length,
                    cost: result.cost,
                },
            });
        }

        return NextResponse.json(
            { error: 'Invalid type. Use "video" or "tts"' },
            { status: 400 }
        );

    } catch (error) {
        logger.error('Test generation failed', { error });

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Block in production
    if (!IS_DEV) {
        return NextResponse.json(
            { error: 'This endpoint is only available in development' },
            { status: 403 }
        );
    }

    // Return available models and providers
    return NextResponse.json({
        videoModels: getAvailableModels(),
        ttsProviders: getAvailableProviders(),
        testEndpoint: {
            method: 'POST',
            body: {
                video: {
                    type: 'video',
                    script: 'Video script in Thai',
                    aspectRatio: '9:16',
                    duration: 5,
                    model: 'mock | veo-3.1 | luma | kling',
                },
                tts: {
                    type: 'tts',
                    script: 'Text to convert to speech',
                    provider: 'google | iapp | elevenlabs | azure',
                    voice: 'th-TH-Neural2-C',
                },
            },
        },
    });
}
