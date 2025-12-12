import { withRetry, PROCESSING_STEPS, setJob, getJob, updateJobProgress, updateJobStatus, removeJob } from '@/lib/video/types';

describe('Video Processing Types', () => {
    describe('PROCESSING_STEPS', () => {
        it('should have all required steps', () => {
            expect(PROCESSING_STEPS.INITIALIZING).toBeDefined();
            expect(PROCESSING_STEPS.ANALYZING).toBeDefined();
            expect(PROCESSING_STEPS.GENERATING_SCRIPT).toBeDefined();
            expect(PROCESSING_STEPS.DOWNLOADING_IMAGES).toBeDefined();
            expect(PROCESSING_STEPS.GENERATING_VIDEO).toBeDefined();
            expect(PROCESSING_STEPS.GENERATING_VOICEOVER).toBeDefined();
            expect(PROCESSING_STEPS.ADDING_AUDIO).toBeDefined();
            expect(PROCESSING_STEPS.ADDING_SUBTITLES).toBeDefined();
            expect(PROCESSING_STEPS.ADDING_WATERMARK).toBeDefined();
            expect(PROCESSING_STEPS.ADDING_MUSIC).toBeDefined();
            expect(PROCESSING_STEPS.UPLOADING).toBeDefined();
            expect(PROCESSING_STEPS.OPTIMIZING).toBeDefined();
            expect(PROCESSING_STEPS.COMPLETED).toBeDefined();
            expect(PROCESSING_STEPS.FAILED).toBeDefined();
        });

        it('should have progress values from 0 to 100', () => {
            expect(PROCESSING_STEPS.INITIALIZING.progress).toBe(0);
            expect(PROCESSING_STEPS.COMPLETED.progress).toBe(100);
        });

        it('should have step and message properties', () => {
            Object.values(PROCESSING_STEPS).forEach((step) => {
                expect(step).toHaveProperty('step');
                expect(step).toHaveProperty('progress');
                expect(step).toHaveProperty('message');
            });
        });
    });

    describe('Job Store', () => {
        const mockJob = {
            videoId: 'video-1',
            userId: 'user-1',
            accessToken: 'token',
            request: {
                productId: 'product-1',
                mode: 'auto' as const,
                aspectRatio: '9:16' as const,
                duration: 30,
                models: { text: 'gemini', video: 'veo', tts: 'google' },
                watermark: { enabled: false },
                subtitle: { enabled: false },
            },
            status: 'pending' as const,
            progress: 0,
            currentStep: 'initializing',
        };

        afterEach(() => {
            removeJob('video-1');
        });

        it('should store and retrieve job', () => {
            setJob('video-1', mockJob);
            const retrieved = getJob('video-1');

            expect(retrieved).toEqual(mockJob);
        });

        it('should return undefined for non-existent job', () => {
            const retrieved = getJob('non-existent');

            expect(retrieved).toBeUndefined();
        });

        it('should update job progress', () => {
            setJob('video-1', mockJob);
            updateJobProgress('video-1', PROCESSING_STEPS.GENERATING_VIDEO);

            const updated = getJob('video-1');
            expect(updated?.currentStep).toBe('generating_video');
            expect(updated?.progress).toBe(40);
        });

        it('should update job status', () => {
            setJob('video-1', mockJob);
            updateJobStatus('video-1', 'completed');

            const updated = getJob('video-1');
            expect(updated?.status).toBe('completed');
        });

        it('should update job status with error', () => {
            setJob('video-1', mockJob);
            updateJobStatus('video-1', 'failed', 'Something went wrong');

            const updated = getJob('video-1');
            expect(updated?.status).toBe('failed');
            expect(updated?.error).toBe('Something went wrong');
        });

        it('should remove job', () => {
            setJob('video-1', mockJob);
            removeJob('video-1');

            const retrieved = getJob('video-1');
            expect(retrieved).toBeUndefined();
        });
    });

    describe('withRetry', () => {
        it('should return result on first success', async () => {
            const fn = jest.fn().mockResolvedValue('success');

            const result = await withRetry(fn, 3);

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure', async () => {
            const fn = jest
                .fn()
                .mockRejectedValueOnce(new Error('Attempt 1'))
                .mockRejectedValueOnce(new Error('Attempt 2'))
                .mockResolvedValue('success');

            const result = await withRetry(fn, 3, 10); // Use small delay for tests

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should throw after max retries', async () => {
            const fn = jest.fn().mockRejectedValue(new Error('Always fails'));

            await expect(withRetry(fn, 3, 10)).rejects.toThrow('Always fails');
            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should use exponential backoff delays', async () => {
            const delays: number[] = [];
            const originalSetTimeout = global.setTimeout;

            // Mock setTimeout to capture delays
            jest.spyOn(global, 'setTimeout').mockImplementation((callback: () => void, delay?: number) => {
                if (delay !== undefined) delays.push(delay);
                callback();
                return 0 as unknown as NodeJS.Timeout;
            });

            const fn = jest
                .fn()
                .mockRejectedValueOnce(new Error('Attempt 1'))
                .mockRejectedValueOnce(new Error('Attempt 2'))
                .mockResolvedValue('success');

            await withRetry(fn, 3, 100);

            // First retry: 100ms, Second retry: 200ms
            expect(delays[0]).toBe(100);
            expect(delays[1]).toBe(200);

            jest.restoreAllMocks();
        });
    });
});
