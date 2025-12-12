import { POST } from '@/app/api/videos/create/route';
import { NextRequest } from 'next/server';

// Mock auth
const mockAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
    auth: () => mockAuth(),
}));

// Mock database functions
const mockGetProductById = jest.fn();
const mockCreateVideo = jest.fn();
const mockGetUserById = jest.fn();

jest.mock('@/lib/db/products', () => ({
    getProductById: () => mockGetProductById(),
}));

jest.mock('@/lib/db/videos', () => ({
    createVideo: () => mockCreateVideo(),
    updateVideoStatus: jest.fn(),
    updateVideoFiles: jest.fn(),
}));

jest.mock('@/lib/db/users', () => ({
    getUserById: () => mockGetUserById(),
}));

// Mock video types
jest.mock('@/lib/video/types', () => ({
    setJob: jest.fn(),
    updateJobProgress: jest.fn(),
    updateJobStatus: jest.fn(),
    withRetry: jest.fn((fn) => fn()),
    PROCESSING_STEPS: {
        INITIALIZING: { step: 'initializing', progress: 0 },
        ANALYZING: { step: 'analyzing', progress: 10 },
        GENERATING_SCRIPT: { step: 'generating_script', progress: 20 },
        DOWNLOADING_IMAGES: { step: 'downloading_images', progress: 30 },
        GENERATING_VIDEO: { step: 'generating_video', progress: 40 },
        UPLOADING: { step: 'uploading', progress: 90 },
        COMPLETED: { step: 'completed', progress: 100 },
    },
}));

// Mock AI functions
jest.mock('@/lib/ai/gemini', () => ({
    generateVideoScript: jest.fn(() => Promise.resolve('Test script')),
    analyzeProduct: jest.fn(() => Promise.resolve({
        suggestedCameraAngles: ['front', 'side'],
    })),
}));

describe('POST /api/videos/create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if not authenticated', async () => {
        mockAuth.mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/videos/create', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 if no accessToken', async () => {
        mockAuth.mockResolvedValue({
            user: { id: 'user-1' },
            accessToken: null,
        });

        const request = new NextRequest('http://localhost:3000/api/videos/create', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        expect(response.status).toBe(401);
    });

    it('should return 400 if productId is missing', async () => {
        mockAuth.mockResolvedValue({
            user: { id: 'user-1' },
            accessToken: 'test-token',
        });

        const request = new NextRequest('http://localhost:3000/api/videos/create', {
            method: 'POST',
            body: JSON.stringify({
                mode: 'auto',
                aspectRatio: '9:16',
                duration: 30,
                models: { video: 'veo' },
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 if mode is invalid', async () => {
        mockAuth.mockResolvedValue({
            user: { id: 'user-1' },
            accessToken: 'test-token',
        });

        const request = new NextRequest('http://localhost:3000/api/videos/create', {
            method: 'POST',
            body: JSON.stringify({
                productId: 'product-1',
                mode: 'invalid',
                aspectRatio: '9:16',
                duration: 30,
                models: { video: 'veo' },
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('mode');
    });

    it('should return 400 if aspectRatio is invalid', async () => {
        mockAuth.mockResolvedValue({
            user: { id: 'user-1' },
            accessToken: 'test-token',
        });

        const request = new NextRequest('http://localhost:3000/api/videos/create', {
            method: 'POST',
            body: JSON.stringify({
                productId: 'product-1',
                mode: 'auto',
                aspectRatio: '4:3', // Invalid
                duration: 30,
                models: { video: 'veo' },
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('aspectRatio');
    });

    it('should return 400 if duration is out of range', async () => {
        mockAuth.mockResolvedValue({
            user: { id: 'user-1' },
            accessToken: 'test-token',
        });

        const request = new NextRequest('http://localhost:3000/api/videos/create', {
            method: 'POST',
            body: JSON.stringify({
                productId: 'product-1',
                mode: 'auto',
                aspectRatio: '9:16',
                duration: 300, // Too long
                models: { video: 'veo' },
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('duration');
    });

    it('should return 400 if Google Drive folders not initialized', async () => {
        mockAuth.mockResolvedValue({
            user: { id: 'user-1' },
            accessToken: 'test-token',
        });

        mockGetUserById.mockResolvedValue({
            id: 'user-1',
            google_drive_folders: null,
        });

        const request = new NextRequest('http://localhost:3000/api/videos/create', {
            method: 'POST',
            body: JSON.stringify({
                productId: 'product-1',
                mode: 'auto',
                aspectRatio: '9:16',
                duration: 30,
                models: { video: 'veo' },
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('FOLDERS_NOT_INITIALIZED');
    });

    it('should return 404 if product not found', async () => {
        mockAuth.mockResolvedValue({
            user: { id: 'user-1' },
            accessToken: 'test-token',
        });

        mockGetUserById.mockResolvedValue({
            id: 'user-1',
            google_drive_folders: { root: 'test', videos: { originals: 'test' } },
        });

        mockGetProductById.mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/videos/create', {
            method: 'POST',
            body: JSON.stringify({
                productId: 'product-1',
                mode: 'auto',
                aspectRatio: '9:16',
                duration: 30,
                models: { video: 'veo' },
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should return 202 and start video creation', async () => {
        mockAuth.mockResolvedValue({
            user: { id: 'user-1' },
            accessToken: 'test-token',
        });

        mockGetUserById.mockResolvedValue({
            id: 'user-1',
            google_drive_folders: {
                root: 'root-id',
                videos: { originals: 'originals-id', thumbnails: 'thumbnails-id' },
            },
        });

        mockGetProductById.mockResolvedValue({
            id: 'product-1',
            name: 'Test Product',
            price: 100,
            images: ['https://example.com/image.jpg'],
        });

        mockCreateVideo.mockResolvedValue({
            id: 'video-1',
            status: 'pending',
        });

        const request = new NextRequest('http://localhost:3000/api/videos/create', {
            method: 'POST',
            body: JSON.stringify({
                productId: 'product-1',
                mode: 'auto',
                aspectRatio: '9:16',
                duration: 30,
                models: { video: 'veo', text: 'gemini', tts: 'google' },
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(202);
        expect(data.success).toBe(true);
        expect(data.videoId).toBe('video-1');
        expect(data.status).toBe('processing');
    });
});
