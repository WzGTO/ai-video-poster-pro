import { POST } from '@/app/api/posts/create/route';
import { NextRequest } from 'next/server';

// Mock getServerSession
const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
    getServerSession: () => mockGetServerSession(),
}));

// Mock Supabase client
const mockSupabaseFrom = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: mockSupabaseFrom,
    }),
}));

// Mock Social APIs
jest.mock('@/lib/social/tiktok', () => ({
    TikTokAPI: jest.fn().mockImplementation(() => ({
        postVideo: jest.fn(() => Promise.resolve({
            postId: 'tiktok-post-1',
            postUrl: 'https://tiktok.com/@user/video/123',
        })),
    })),
}));

jest.mock('@/lib/social/facebook', () => ({
    FacebookAPI: jest.fn().mockImplementation(() => ({
        postVideo: jest.fn(() => Promise.resolve({
            postId: 'fb-post-1',
            postUrl: 'https://facebook.com/video/123',
            success: true,
        })),
    })),
}));

jest.mock('@/lib/social/youtube', () => ({
    YouTubeAPI: jest.fn().mockImplementation(() => ({
        uploadVideo: jest.fn(() => Promise.resolve({
            postId: 'yt-video-1',
            postUrl: 'https://youtube.com/watch?v=123',
            success: true,
        })),
    })),
}));

jest.mock('@/lib/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe('POST /api/posts/create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if not authenticated', async () => {
        mockGetServerSession.mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/posts/create', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 if videoId is missing', async () => {
        mockGetServerSession.mockResolvedValue({
            user: { id: 'user-1' },
        });

        const request = new NextRequest('http://localhost:3000/api/posts/create', {
            method: 'POST',
            body: JSON.stringify({
                platforms: ['tiktok'],
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('MISSING_VIDEO_ID');
    });

    it('should return 400 if platforms is empty', async () => {
        mockGetServerSession.mockResolvedValue({
            user: { id: 'user-1' },
        });

        const request = new NextRequest('http://localhost:3000/api/posts/create', {
            method: 'POST',
            body: JSON.stringify({
                videoId: 'video-1',
                platforms: [],
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('MISSING_PLATFORMS');
    });

    it('should return 400 if platform is invalid', async () => {
        mockGetServerSession.mockResolvedValue({
            user: { id: 'user-1' },
        });

        const request = new NextRequest('http://localhost:3000/api/posts/create', {
            method: 'POST',
            body: JSON.stringify({
                videoId: 'video-1',
                platforms: ['twitter'], // Invalid platform
                captions: {},
                hashtags: {},
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('INVALID_PLATFORM');
    });

    it('should return 404 if video not found', async () => {
        mockGetServerSession.mockResolvedValue({
            user: { id: 'user-1' },
        });

        mockSupabaseFrom.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                }),
            }),
        });

        const request = new NextRequest('http://localhost:3000/api/posts/create', {
            method: 'POST',
            body: JSON.stringify({
                videoId: 'video-1',
                platforms: ['tiktok'],
                captions: { tiktok: 'Test caption' },
                hashtags: { tiktok: ['fyp'] },
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.code).toBe('VIDEO_NOT_FOUND');
    });

    it('should return 400 if video status is not completed', async () => {
        mockGetServerSession.mockResolvedValue({
            user: { id: 'user-1' },
        });

        mockSupabaseFrom.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: 'video-1', status: 'processing', public_url: null },
                            error: null,
                        }),
                    }),
                }),
            }),
        });

        const request = new NextRequest('http://localhost:3000/api/posts/create', {
            method: 'POST',
            body: JSON.stringify({
                videoId: 'video-1',
                platforms: ['tiktok'],
                captions: { tiktok: 'Test caption' },
                hashtags: { tiktok: ['fyp'] },
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.code).toBe('VIDEO_NOT_READY');
    });
});
