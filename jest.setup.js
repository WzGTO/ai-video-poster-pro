// Jest setup file
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
    useParams: () => ({}),
}));

// Mock next-auth
jest.mock('next-auth', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
    auth: jest.fn(() => Promise.resolve(null)),
    signIn: jest.fn(),
    signOut: jest.fn(),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
                    limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
                })),
                order: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
                })),
            })),
            update: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: {}, error: null })),
            })),
            delete: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ error: null })),
            })),
        })),
    },
}));

// Mock Google Drive
jest.mock('@/lib/google-drive', () => ({
    GoogleDriveManager: jest.fn().mockImplementation(() => ({
        initializeFolder: jest.fn(() => Promise.resolve({
            root: 'root-id',
            products: 'products-id',
            videos: {
                root: 'videos-id',
                originals: 'originals-id',
                optimized: 'optimized-id',
                thumbnails: 'thumbnails-id',
            },
            audio: 'audio-id',
            scripts: 'scripts-id',
            settings: 'settings-id',
        })),
        uploadFile: jest.fn(() => Promise.resolve({
            id: 'file-id',
            name: 'test-file',
            publicUrl: 'https://drive.google.com/test',
        })),
        deleteFile: jest.fn(() => Promise.resolve()),
        getStorageInfo: jest.fn(() => Promise.resolve({
            limit: 15 * 1024 * 1024 * 1024,
            usage: 5 * 1024 * 1024 * 1024,
            available: 10 * 1024 * 1024 * 1024,
            percentUsed: 33.33,
        })),
    })),
    createGoogleDriveManager: jest.fn(),
}));

// Global fetch mock
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    })
) as jest.Mock;

// Console error suppression for expected errors in tests
const originalError = console.error;
beforeAll(() => {
    console.error = (...args: unknown[]) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning: ReactDOM.render') ||
                args[0].includes('Warning: An update to') ||
                args[0].includes('act(...)'))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});

// Reset mocks after each test
afterEach(() => {
    jest.clearAllMocks();
});
