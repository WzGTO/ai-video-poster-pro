/**
 * Text-to-Speech Service
 * Supports multiple TTS providers:
 * - Google Cloud TTS (recommended)
 * - iApp Thai TTS (natural Thai voices)
 * - ElevenLabs (premium voices)
 * - Azure TTS
 * 
 * Usage:
 *   import { generateVoiceover } from '@/lib/ai/text-to-speech';
 *   const audioBuffer = await generateVoiceover({ script, voice, provider });
 */

import { logger } from '@/lib/logger';

// ===== Types =====

export interface TTSParams {
    script: string;
    voice?: string;
    provider?: 'google' | 'iapp' | 'elevenlabs' | 'azure';
    language?: 'th' | 'en';
    speakingRate?: number;  // 0.5 - 2.0, default 1.0
    pitch?: number;         // -20 to 20, default 0
}

export interface TTSResult {
    audioBuffer: Buffer;
    duration: number;       // seconds
    format: string;
    provider: string;
    cost?: number;
}

export interface VoiceOption {
    id: string;
    name: string;
    language: string;
    gender: 'male' | 'female' | 'neutral';
    provider: string;
}

// ===== Constants =====

// Google Thai voices
const GOOGLE_THAI_VOICES = {
    'th-TH-Standard-A': { name: 'ผู้หญิง Standard A', gender: 'female' },
    'th-TH-Neural2-C': { name: 'ผู้หญิง Neural C', gender: 'female' },
    'th-TH-Wavenet-A': { name: 'ผู้หญิง Wavenet A', gender: 'female' },
};

// iApp Thai voices
const IAPP_VOICES = {
    'nok': { name: 'Nok (ผู้หญิง)', gender: 'female' },
    'kai': { name: 'Kai (ผู้ชาย)', gender: 'male' },
    'ploy': { name: 'Ploy (ผู้หญิง)', gender: 'female' },
};

// ===== TTS Generator Class =====

export class TTSGenerator {
    /**
     * Generate voiceover with Google Cloud TTS
     */
    async generateWithGoogle(params: TTSParams): Promise<TTSResult> {
        const apiKey = process.env.GOOGLE_CLOUD_TTS_KEY;

        if (!apiKey) {
            throw new Error('GOOGLE_CLOUD_TTS_KEY not configured');
        }

        try {
            const voice = params.voice || 'th-TH-Neural2-C';
            const languageCode = params.language === 'en' ? 'en-US' : 'th-TH';

            logger.info('Generating TTS with Google Cloud', { voice, length: params.script.length });

            const response = await fetch(
                `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        input: {
                            text: params.script,
                        },
                        voice: {
                            languageCode,
                            name: voice,
                        },
                        audioConfig: {
                            audioEncoding: 'MP3',
                            speakingRate: params.speakingRate || 1.0,
                            pitch: params.pitch || 0,
                            effectsProfileId: ['headphone-class-device'],
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Google TTS error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            if (!data.audioContent) {
                throw new Error('No audio content in response');
            }

            const audioBuffer = Buffer.from(data.audioContent, 'base64');

            // Estimate duration (Thai: ~2.5 words/sec, each word ~2 chars)
            const estimatedDuration = Math.ceil(params.script.length / 5);

            return {
                audioBuffer,
                duration: estimatedDuration,
                format: 'mp3',
                provider: 'google',
                cost: this.calculateGoogleCost(params.script.length),
            };

        } catch (error) {
            logger.error('Google TTS failed', { error });
            throw error;
        }
    }

    /**
     * Generate voiceover with iApp Thai TTS
     */
    async generateWithIApp(params: TTSParams): Promise<TTSResult> {
        const apiKey = process.env.IAPP_TTS_API_KEY;

        if (!apiKey) {
            throw new Error('IAPP_TTS_API_KEY not configured');
        }

        try {
            const voice = params.voice || 'nok';

            logger.info('Generating TTS with iApp', { voice, length: params.script.length });

            const response = await fetch('https://api.iapp.co.th/tts/v1/synthesize', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: params.script,
                    voice,
                    speed: params.speakingRate || 1.0,
                    format: 'mp3',
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`iApp TTS error: ${response.status} - ${errorText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = Buffer.from(arrayBuffer);

            // Estimate duration
            const estimatedDuration = Math.ceil(params.script.length / 5);

            return {
                audioBuffer,
                duration: estimatedDuration,
                format: 'mp3',
                provider: 'iapp',
                cost: this.calculateIAppCost(params.script.length),
            };

        } catch (error) {
            logger.error('iApp TTS failed', { error });
            throw error;
        }
    }

    /**
     * Generate voiceover with ElevenLabs
     */
    async generateWithElevenLabs(params: TTSParams): Promise<TTSResult> {
        const apiKey = process.env.ELEVENLABS_API_KEY;

        if (!apiKey) {
            throw new Error('ELEVENLABS_API_KEY not configured');
        }

        try {
            // ElevenLabs voice IDs - use multilingual model for Thai
            const voiceId = params.voice || '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel

            logger.info('Generating TTS with ElevenLabs', { voiceId, length: params.script.length });

            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'xi-api-key': apiKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: params.script,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75,
                            style: 0.0,
                            use_speaker_boost: true,
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs error: ${response.status} - ${errorText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = Buffer.from(arrayBuffer);

            // Estimate duration
            const estimatedDuration = Math.ceil(params.script.length / 5);

            return {
                audioBuffer,
                duration: estimatedDuration,
                format: 'mp3',
                provider: 'elevenlabs',
                cost: this.calculateElevenLabsCost(params.script.length),
            };

        } catch (error) {
            logger.error('ElevenLabs TTS failed', { error });
            throw error;
        }
    }

    /**
     * Generate voiceover with Azure TTS
     */
    async generateWithAzure(params: TTSParams): Promise<TTSResult> {
        const apiKey = process.env.AZURE_TTS_KEY;
        const region = process.env.AZURE_TTS_REGION || 'southeastasia';

        if (!apiKey) {
            throw new Error('AZURE_TTS_KEY not configured');
        }

        try {
            const voice = params.voice || 'th-TH-PremwadeeNeural';

            logger.info('Generating TTS with Azure', { voice, length: params.script.length });

            // Get access token
            const tokenResponse = await fetch(
                `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
                {
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': apiKey,
                        'Content-Length': '0',
                    },
                }
            );

            if (!tokenResponse.ok) {
                throw new Error('Failed to get Azure token');
            }

            const accessToken = await tokenResponse.text();

            // Build SSML
            const ssml = `
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='th-TH'>
          <voice name='${voice}'>
            <prosody rate='${(params.speakingRate || 1.0) * 100}%'>
              ${params.script}
            </prosody>
          </voice>
        </speak>
      `;

            // Synthesize speech
            const response = await fetch(
                `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/ssml+xml',
                        'X-Microsoft-OutputFormat': 'audio-48khz-192kbitrate-mono-mp3',
                    },
                    body: ssml,
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Azure TTS error: ${response.status} - ${errorText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = Buffer.from(arrayBuffer);

            // Estimate duration
            const estimatedDuration = Math.ceil(params.script.length / 5);

            return {
                audioBuffer,
                duration: estimatedDuration,
                format: 'mp3',
                provider: 'azure',
                cost: this.calculateAzureCost(params.script.length),
            };

        } catch (error) {
            logger.error('Azure TTS failed', { error });
            throw error;
        }
    }

    // ===== Cost Calculations =====

    private calculateGoogleCost(charCount: number): number {
        // Google Cloud TTS pricing: ~$4 per 1M chars for Neural2
        return (charCount / 1000000) * 4;
    }

    private calculateIAppCost(charCount: number): number {
        // iApp pricing varies
        return (charCount / 1000000) * 2;
    }

    private calculateElevenLabsCost(charCount: number): number {
        // ElevenLabs: ~$0.30 per 1K chars
        return (charCount / 1000) * 0.30;
    }

    private calculateAzureCost(charCount: number): number {
        // Azure Neural TTS: ~$16 per 1M chars
        return (charCount / 1000000) * 16;
    }
}

// ===== Main Export Function =====

/**
 * Generate voiceover from text
 */
export async function generateVoiceover(params: TTSParams): Promise<TTSResult> {
    const generator = new TTSGenerator();

    // Determine provider
    const provider = params.provider || determineAvailableProvider();

    logger.info('Starting TTS generation', {
        provider,
        length: params.script.length,
        voice: params.voice
    });

    switch (provider) {
        case 'google':
            return generator.generateWithGoogle(params);

        case 'iapp':
            return generator.generateWithIApp(params);

        case 'elevenlabs':
            return generator.generateWithElevenLabs(params);

        case 'azure':
            return generator.generateWithAzure(params);

        default:
            // Default: try Google if available
            if (process.env.GOOGLE_CLOUD_TTS_KEY) {
                return generator.generateWithGoogle(params);
            }
            throw new Error('No TTS provider configured');
    }
}

/**
 * Determine which provider is available
 */
function determineAvailableProvider(): TTSParams['provider'] {
    if (process.env.GOOGLE_CLOUD_TTS_KEY) {
        return 'google';
    }

    if (process.env.IAPP_TTS_API_KEY) {
        return 'iapp';
    }

    if (process.env.ELEVENLABS_API_KEY) {
        return 'elevenlabs';
    }

    if (process.env.AZURE_TTS_KEY) {
        return 'azure';
    }

    throw new Error('No TTS provider configured');
}

/**
 * Get available voices for a provider
 */
export function getAvailableVoices(provider?: string): VoiceOption[] {
    const voices: VoiceOption[] = [];

    // Google voices
    if (!provider || provider === 'google') {
        if (process.env.GOOGLE_CLOUD_TTS_KEY) {
            Object.entries(GOOGLE_THAI_VOICES).forEach(([id, info]) => {
                voices.push({
                    id,
                    name: info.name,
                    language: 'th',
                    gender: info.gender as 'male' | 'female',
                    provider: 'google',
                });
            });
        }
    }

    // iApp voices
    if (!provider || provider === 'iapp') {
        if (process.env.IAPP_TTS_API_KEY) {
            Object.entries(IAPP_VOICES).forEach(([id, info]) => {
                voices.push({
                    id,
                    name: info.name,
                    language: 'th',
                    gender: info.gender as 'male' | 'female',
                    provider: 'iapp',
                });
            });
        }
    }

    return voices;
}

/**
 * Get available TTS providers
 */
export function getAvailableProviders(): { id: string; name: string; available: boolean }[] {
    return [
        {
            id: 'google',
            name: 'Google Cloud TTS',
            available: !!process.env.GOOGLE_CLOUD_TTS_KEY,
        },
        {
            id: 'iapp',
            name: 'iApp Thai TTS',
            available: !!process.env.IAPP_TTS_API_KEY,
        },
        {
            id: 'elevenlabs',
            name: 'ElevenLabs',
            available: !!process.env.ELEVENLABS_API_KEY,
        },
        {
            id: 'azure',
            name: 'Azure Speech',
            available: !!process.env.AZURE_TTS_KEY,
        },
    ];
}

/**
 * Estimate audio duration from text
 */
export function estimateAudioDuration(text: string, language: 'th' | 'en' = 'th'): number {
    // Average speaking rates (words per minute)
    const wordsPerMinute = language === 'th' ? 150 : 160;

    // Estimate word count (Thai: ~2 chars per word, English: ~5 chars per word)
    const charsPerWord = language === 'th' ? 2 : 5;
    const wordCount = text.length / charsPerWord;

    // Calculate duration in seconds
    return Math.ceil((wordCount / wordsPerMinute) * 60);
}
