import {
    GoogleDriveManager,
    GoogleDriveError,
    QuotaExceededError,
    FileNotFoundError,
    UploadError,
} from '@/lib/google-drive';

// Mock googleapis
const mockDriveFilesCreate = jest.fn();
const mockDriveFilesGet = jest.fn();
const mockDriveFilesDelete = jest.fn();
const mockDriveFilesList = jest.fn();
const mockDriveFilesUpdate = jest.fn();
const mockDriveAboutGet = jest.fn();
const mockDrivePermissionsCreate = jest.fn();

jest.mock('googleapis', () => ({
    google: {
        auth: {
            OAuth2: jest.fn().mockImplementation(() => ({
                setCredentials: jest.fn(),
            })),
        },
        drive: jest.fn().mockImplementation(() => ({
            files: {
                create: mockDriveFilesCreate,
                get: mockDriveFilesGet,
                delete: mockDriveFilesDelete,
                list: mockDriveFilesList,
                update: mockDriveFilesUpdate,
            },
            about: {
                get: mockDriveAboutGet,
            },
            permissions: {
                create: mockDrivePermissionsCreate,
            },
        })),
    },
}));

describe('GoogleDriveManager', () => {
    let manager: GoogleDriveManager;

    beforeEach(() => {
        jest.clearAllMocks();
        manager = new GoogleDriveManager('test-access-token');
    });

    describe('initializeFolder', () => {
        it('should create folder structure', async () => {
            mockDriveFilesList.mockResolvedValue({
                data: { files: [] },
            });

            mockDriveFilesCreate.mockResolvedValue({
                data: { id: 'folder-id' },
            });

            const result = await manager.initializeFolder();

            expect(result).toHaveProperty('root');
            expect(result).toHaveProperty('products');
            expect(result).toHaveProperty('videos');
            expect(result.videos).toHaveProperty('originals');
            expect(result.videos).toHaveProperty('optimized');
            expect(result.videos).toHaveProperty('thumbnails');
            expect(result).toHaveProperty('audio');
            expect(result).toHaveProperty('scripts');
            expect(result).toHaveProperty('settings');
        });

        it('should reuse existing folders', async () => {
            mockDriveFilesList.mockResolvedValue({
                data: {
                    files: [{ id: 'existing-folder-id', name: 'AI Video Poster Pro' }],
                },
            });

            mockDriveFilesCreate.mockResolvedValue({
                data: { id: 'new-folder-id' },
            });

            const result = await manager.initializeFolder();

            expect(result.root).toBe('existing-folder-id');
        });
    });

    describe('uploadFile', () => {
        beforeEach(() => {
            mockDriveAboutGet.mockResolvedValue({
                data: {
                    storageQuota: {
                        limit: '15000000000',
                        usage: '5000000000',
                    },
                },
            });

            mockDriveFilesCreate.mockResolvedValue({
                data: {
                    id: 'file-id',
                    name: 'test.txt',
                    size: '100',
                    mimeType: 'text/plain',
                    createdTime: '2024-01-01T00:00:00Z',
                    modifiedTime: '2024-01-01T00:00:00Z',
                },
            });

            mockDrivePermissionsCreate.mockResolvedValue({ data: {} });
        });

        it('should upload file successfully', async () => {
            const result = await manager.uploadFile({
                file: Buffer.from('test content'),
                filename: 'test.txt',
                mimeType: 'text/plain',
                folderId: 'folder-id',
            });

            expect(result.id).toBe('file-id');
            expect(result.name).toBe('test.txt');
            expect(result.publicUrl).toContain('file-id');
        });

        it('should throw QuotaExceededError when storage is full', async () => {
            mockDriveAboutGet.mockResolvedValue({
                data: {
                    storageQuota: {
                        limit: '100',
                        usage: '100',
                    },
                },
            });

            await expect(
                manager.uploadFile({
                    file: Buffer.from('test content'),
                    filename: 'test.txt',
                    mimeType: 'text/plain',
                    folderId: 'folder-id',
                })
            ).rejects.toThrow(QuotaExceededError);
        });

        it('should throw UploadError when upload fails', async () => {
            mockDriveFilesCreate.mockResolvedValue({
                data: { id: null },
            });

            await expect(
                manager.uploadFile({
                    file: Buffer.from('test content'),
                    filename: 'test.txt',
                    mimeType: 'text/plain',
                    folderId: 'folder-id',
                })
            ).rejects.toThrow(UploadError);
        });
    });

    describe('deleteFile', () => {
        it('should delete file successfully', async () => {
            mockDriveFilesDelete.mockResolvedValue({});

            await expect(manager.deleteFile('file-id')).resolves.toBeUndefined();
            expect(mockDriveFilesDelete).toHaveBeenCalledWith({ fileId: 'file-id' });
        });

        it('should throw FileNotFoundError when file does not exist', async () => {
            mockDriveFilesDelete.mockRejectedValue({ code: 404 });

            await expect(manager.deleteFile('non-existent-id')).rejects.toThrow(FileNotFoundError);
        });
    });

    describe('getStorageInfo', () => {
        it('should return storage quota information', async () => {
            mockDriveAboutGet.mockResolvedValue({
                data: {
                    storageQuota: {
                        limit: '15000000000',
                        usage: '5000000000',
                    },
                },
            });

            const result = await manager.getStorageInfo();

            expect(result.limit).toBe(15000000000);
            expect(result.usage).toBe(5000000000);
            expect(result.available).toBe(10000000000);
            expect(result.percentUsed).toBeCloseTo(33.33, 1);
        });
    });

    describe('listFiles', () => {
        it('should list files in folder', async () => {
            mockDriveFilesList.mockResolvedValue({
                data: {
                    files: [
                        {
                            id: 'file-1',
                            name: 'test1.txt',
                            size: '100',
                            mimeType: 'text/plain',
                            createdTime: '2024-01-01T00:00:00Z',
                            modifiedTime: '2024-01-01T00:00:00Z',
                        },
                        {
                            id: 'file-2',
                            name: 'test2.txt',
                            size: '200',
                            mimeType: 'text/plain',
                            createdTime: '2024-01-02T00:00:00Z',
                            modifiedTime: '2024-01-02T00:00:00Z',
                        },
                    ],
                },
            });

            const result = await manager.listFiles('folder-id');

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('file-1');
            expect(result[1].id).toBe('file-2');
        });

        it('should return empty array for empty folder', async () => {
            mockDriveFilesList.mockResolvedValue({
                data: { files: [] },
            });

            const result = await manager.listFiles('folder-id');

            expect(result).toHaveLength(0);
        });
    });
});

describe('GoogleDriveError', () => {
    it('should create error with code', () => {
        const error = new GoogleDriveError('Test error', 'TEST_CODE');

        expect(error.message).toBe('Test error');
        expect(error.code).toBe('TEST_CODE');
        expect(error.name).toBe('GoogleDriveError');
    });

    it('should include original error', () => {
        const originalError = new Error('Original');
        const error = new GoogleDriveError('Test error', 'TEST_CODE', originalError);

        expect(error.originalError).toBe(originalError);
    });
});
