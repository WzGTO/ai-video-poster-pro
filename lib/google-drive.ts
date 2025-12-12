import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

// ===== Types =====

export interface FolderStructure {
    root: string;
    products: string;
    videos: {
        root: string;
        originals: string;
        optimized: string;
        thumbnails: string;
    };
    audio: string;
    scripts: string;
    settings: string;
}

export interface UploadParams {
    file: Buffer;
    filename: string;
    mimeType: string;
    folderId: string;
    description?: string;
}

export interface FileInfo {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    publicUrl: string;
    thumbnailUrl?: string;
    createdAt: string;
    modifiedAt: string;
}

export interface StorageQuota {
    limit: number;
    usage: number;
    available: number;
    percentUsed: number;
}

// ===== Custom Errors =====

export class GoogleDriveError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: unknown
    ) {
        super(message);
        this.name = "GoogleDriveError";
    }
}

export class FolderNotFoundError extends GoogleDriveError {
    constructor(folderName: string) {
        super(`Folder not found: ${folderName}`, "FOLDER_NOT_FOUND");
        this.name = "FolderNotFoundError";
    }
}

export class FileNotFoundError extends GoogleDriveError {
    constructor(fileId: string) {
        super(`File not found: ${fileId}`, "FILE_NOT_FOUND");
        this.name = "FileNotFoundError";
    }
}

export class UploadError extends GoogleDriveError {
    constructor(filename: string, originalError?: unknown) {
        super(`Failed to upload file: ${filename}`, "UPLOAD_FAILED", originalError);
        this.name = "UploadError";
    }
}

export class PermissionError extends GoogleDriveError {
    constructor(fileId: string, originalError?: unknown) {
        super(
            `Failed to set permissions for file: ${fileId}`,
            "PERMISSION_FAILED",
            originalError
        );
        this.name = "PermissionError";
    }
}

export class QuotaExceededError extends GoogleDriveError {
    constructor() {
        super("Google Drive storage quota exceeded", "QUOTA_EXCEEDED");
        this.name = "QuotaExceededError";
    }
}

// ===== Main Class =====

const ROOT_FOLDER_NAME = "AI Video Poster Pro";

export class GoogleDriveManager {
    private drive: drive_v3.Drive;
    private folderStructure: FolderStructure | null = null;

    /**
     * สร้าง GoogleDriveManager instance
     * @param accessToken - Access token จาก NextAuth
     */
    constructor(accessToken: string) {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
            access_token: accessToken,
        });

        this.drive = google.drive({ version: "v3", auth: oauth2Client });
    }

    /**
     * สร้างโครงสร้างโฟลเดอร์สำหรับแอป
     * @returns FolderStructure - Object มี folder IDs ทั้งหมด
     */
    async initializeFolder(): Promise<FolderStructure> {
        try {
            // สร้างหรือหาโฟลเดอร์หลัก
            const rootId = await this.getOrCreateFolder(ROOT_FOLDER_NAME);

            // สร้าง sub-folders
            const [productsId, videosRootId, audioId, scriptsId, settingsId] =
                await Promise.all([
                    this.getOrCreateFolder("Products", rootId),
                    this.getOrCreateFolder("Videos", rootId),
                    this.getOrCreateFolder("Audio", rootId),
                    this.getOrCreateFolder("Scripts", rootId),
                    this.getOrCreateFolder("Settings", rootId),
                ]);

            // สร้าง sub-folders ใน Videos
            const [originalsId, optimizedId, thumbnailsId] = await Promise.all([
                this.getOrCreateFolder("Originals", videosRootId),
                this.getOrCreateFolder("Optimized", videosRootId),
                this.getOrCreateFolder("Thumbnails", videosRootId),
            ]);

            this.folderStructure = {
                root: rootId,
                products: productsId,
                videos: {
                    root: videosRootId,
                    originals: originalsId,
                    optimized: optimizedId,
                    thumbnails: thumbnailsId,
                },
                audio: audioId,
                scripts: scriptsId,
                settings: settingsId,
            };

            return this.folderStructure;
        } catch (error) {
            throw new GoogleDriveError(
                "Failed to initialize folder structure",
                "INIT_FAILED",
                error
            );
        }
    }

    /**
     * อัปโหลดไฟล์ไป Google Drive
     * @param params - UploadParams
     * @returns FileInfo - ข้อมูลไฟล์ที่อัปโหลด
     */
    async uploadFile(params: UploadParams): Promise<FileInfo> {
        const { file, filename, mimeType, folderId, description } = params;

        try {
            // ตรวจสอบ quota ก่อนอัปโหลด
            const quota = await this.getStorageInfo();
            if (file.length > quota.available) {
                throw new QuotaExceededError();
            }

            // สร้าง readable stream จาก Buffer
            const bufferStream = new Readable();
            bufferStream.push(file);
            bufferStream.push(null);

            // อัปโหลดไฟล์
            const response = await this.drive.files.create({
                requestBody: {
                    name: filename,
                    parents: [folderId],
                    description: description,
                },
                media: {
                    mimeType: mimeType,
                    body: bufferStream,
                },
                fields: "id, name, size, mimeType, createdTime, modifiedTime",
            });

            if (!response.data.id) {
                throw new UploadError(filename);
            }

            const fileId = response.data.id;

            // ตั้ง permission เป็น public
            await this.setPublicPermission(fileId);

            // สร้าง public URL
            const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
            const thumbnailUrl = mimeType.startsWith("image/")
                ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`
                : mimeType.startsWith("video/")
                    ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`
                    : undefined;

            return {
                id: fileId,
                name: response.data.name || filename,
                size: parseInt(response.data.size || "0", 10),
                mimeType: response.data.mimeType || mimeType,
                publicUrl,
                thumbnailUrl,
                createdAt: response.data.createdTime || new Date().toISOString(),
                modifiedAt: response.data.modifiedTime || new Date().toISOString(),
            };
        } catch (error) {
            if (error instanceof GoogleDriveError) {
                throw error;
            }
            throw new UploadError(filename, error);
        }
    }

    /**
     * ดาวน์โหลดไฟล์จาก Google Drive เป็น Stream
     * @param fileId - ID ของไฟล์
     * @returns Readable stream
     */
    async downloadFile(fileId: string): Promise<Readable> {
        try {
            // ตรวจสอบว่าไฟล์มีอยู่
            await this.drive.files.get({
                fileId: fileId,
                fields: "id",
            });

            // ดาวน์โหลดไฟล์
            const response = await this.drive.files.get(
                {
                    fileId: fileId,
                    alt: "media",
                },
                { responseType: "stream" }
            );

            return response.data as Readable;
        } catch (error: unknown) {
            if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === 404
            ) {
                throw new FileNotFoundError(fileId);
            }
            throw new GoogleDriveError(
                `Failed to download file: ${fileId}`,
                "DOWNLOAD_FAILED",
                error
            );
        }
    }

    /**
     * ลบไฟล์ออกจาก Google Drive
     * @param fileId - ID ของไฟล์
     */
    async deleteFile(fileId: string): Promise<void> {
        try {
            await this.drive.files.delete({
                fileId: fileId,
            });
        } catch (error: unknown) {
            if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === 404
            ) {
                throw new FileNotFoundError(fileId);
            }
            throw new GoogleDriveError(
                `Failed to delete file: ${fileId}`,
                "DELETE_FAILED",
                error
            );
        }
    }

    /**
     * ดึงข้อมูล storage quota
     * @returns StorageQuota
     */
    async getStorageInfo(): Promise<StorageQuota> {
        try {
            const response = await this.drive.about.get({
                fields: "storageQuota",
            });

            const quota = response.data.storageQuota;

            if (!quota) {
                throw new GoogleDriveError(
                    "Failed to get storage quota",
                    "QUOTA_UNAVAILABLE"
                );
            }

            const limit = parseInt(quota.limit || "0", 10);
            const usage = parseInt(quota.usage || "0", 10);
            const available = limit - usage;
            const percentUsed = limit > 0 ? (usage / limit) * 100 : 0;

            return {
                limit,
                usage,
                available,
                percentUsed: Math.round(percentUsed * 100) / 100,
            };
        } catch (error) {
            if (error instanceof GoogleDriveError) {
                throw error;
            }
            throw new GoogleDriveError(
                "Failed to get storage info",
                "STORAGE_INFO_FAILED",
                error
            );
        }
    }

    /**
     * List ไฟล์ในโฟลเดอร์
     * @param folderId - ID ของโฟลเดอร์
     * @returns FileInfo[]
     */
    async listFiles(folderId: string): Promise<FileInfo[]> {
        try {
            const response = await this.drive.files.list({
                q: `'${folderId}' in parents and trashed=false`,
                fields:
                    "files(id, name, size, mimeType, createdTime, modifiedTime, thumbnailLink)",
                orderBy: "modifiedTime desc",
                pageSize: 100,
            });

            const files = response.data.files || [];

            return files.map((file) => ({
                id: file.id || "",
                name: file.name || "",
                size: parseInt(file.size || "0", 10),
                mimeType: file.mimeType || "",
                publicUrl: `https://drive.google.com/uc?export=view&id=${file.id}`,
                thumbnailUrl: file.thumbnailLink || undefined,
                createdAt: file.createdTime || "",
                modifiedAt: file.modifiedTime || "",
            }));
        } catch (error: unknown) {
            if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === 404
            ) {
                throw new FolderNotFoundError(folderId);
            }
            throw new GoogleDriveError(
                "Failed to list files",
                "LIST_FILES_FAILED",
                error
            );
        }
    }

    /**
     * ดึงโครงสร้างโฟลเดอร์ที่สร้างไว้
     * @returns FolderStructure | null
     */
    getFolderStructure(): FolderStructure | null {
        return this.folderStructure;
    }

    // ===== Private Methods =====

    /**
     * สร้างหรือหาโฟลเดอร์ที่มีอยู่แล้ว
     */
    private async getOrCreateFolder(
        name: string,
        parentId?: string
    ): Promise<string> {
        try {
            // ค้นหาโฟลเดอร์ที่มีอยู่
            const query = parentId
                ? `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
                : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

            const response = await this.drive.files.list({
                q: query,
                fields: "files(id, name)",
                spaces: "drive",
            });

            if (response.data.files && response.data.files.length > 0) {
                return response.data.files[0].id!;
            }

            // สร้างโฟลเดอร์ใหม่
            const folderMetadata: drive_v3.Schema$File = {
                name: name,
                mimeType: "application/vnd.google-apps.folder",
            };

            if (parentId) {
                folderMetadata.parents = [parentId];
            }

            const folder = await this.drive.files.create({
                requestBody: folderMetadata,
                fields: "id",
            });

            if (!folder.data.id) {
                throw new Error("Failed to create folder");
            }

            return folder.data.id;
        } catch (error) {
            throw new GoogleDriveError(
                `Failed to get or create folder: ${name}`,
                "FOLDER_CREATE_FAILED",
                error
            );
        }
    }

    /**
     * ตั้ง permission เป็น public (anyone with link can view)
     */
    private async setPublicPermission(fileId: string): Promise<void> {
        try {
            await this.drive.permissions.create({
                fileId: fileId,
                requestBody: {
                    role: "reader",
                    type: "anyone",
                },
            });
        } catch (error) {
            throw new PermissionError(fileId, error);
        }
    }

    // ===== Utility Methods =====

    /**
     * อัปโหลด JSON ไฟล์
     */
    async uploadJson<T>(
        filename: string,
        data: T,
        folderId: string
    ): Promise<FileInfo> {
        const jsonString = JSON.stringify(data, null, 2);
        const buffer = Buffer.from(jsonString, "utf-8");

        return this.uploadFile({
            file: buffer,
            filename: `${filename}.json`,
            mimeType: "application/json",
            folderId,
        });
    }

    /**
     * ดาวน์โหลดและ parse JSON ไฟล์
     */
    async downloadJson<T>(fileId: string): Promise<T> {
        const stream = await this.downloadFile(fileId);

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            stream.on("end", () => {
                try {
                    const data = Buffer.concat(chunks).toString("utf-8");
                    resolve(JSON.parse(data) as T);
                } catch (error) {
                    reject(
                        new GoogleDriveError(
                            "Failed to parse JSON",
                            "JSON_PARSE_FAILED",
                            error
                        )
                    );
                }
            });
            stream.on("error", reject);
        });
    }

    /**
     * ค้นหาไฟล์ในโฟลเดอร์ตามชื่อ
     */
    async findFileByName(
        filename: string,
        folderId: string
    ): Promise<FileInfo | null> {
        try {
            const response = await this.drive.files.list({
                q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
                fields:
                    "files(id, name, size, mimeType, createdTime, modifiedTime, thumbnailLink)",
            });

            if (!response.data.files || response.data.files.length === 0) {
                return null;
            }

            const file = response.data.files[0];
            return {
                id: file.id || "",
                name: file.name || "",
                size: parseInt(file.size || "0", 10),
                mimeType: file.mimeType || "",
                publicUrl: `https://drive.google.com/uc?export=view&id=${file.id}`,
                thumbnailUrl: file.thumbnailLink || undefined,
                createdAt: file.createdTime || "",
                modifiedAt: file.modifiedTime || "",
            };
        } catch (error) {
            throw new GoogleDriveError(
                "Failed to find file",
                "FIND_FILE_FAILED",
                error
            );
        }
    }

    /**
     * อัปเดตไฟล์ที่มีอยู่
     */
    async updateFile(
        fileId: string,
        file: Buffer,
        mimeType: string
    ): Promise<FileInfo> {
        try {
            const bufferStream = new Readable();
            bufferStream.push(file);
            bufferStream.push(null);

            const response = await this.drive.files.update({
                fileId: fileId,
                media: {
                    mimeType: mimeType,
                    body: bufferStream,
                },
                fields: "id, name, size, mimeType, createdTime, modifiedTime",
            });

            return {
                id: response.data.id || fileId,
                name: response.data.name || "",
                size: parseInt(response.data.size || "0", 10),
                mimeType: response.data.mimeType || mimeType,
                publicUrl: `https://drive.google.com/uc?export=view&id=${response.data.id}`,
                createdAt: response.data.createdTime || "",
                modifiedAt: response.data.modifiedTime || "",
            };
        } catch (error: unknown) {
            if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === 404
            ) {
                throw new FileNotFoundError(fileId);
            }
            throw new GoogleDriveError(
                `Failed to update file: ${fileId}`,
                "UPDATE_FAILED",
                error
            );
        }
    }
}

// ===== Factory Function =====

/**
 * สร้าง GoogleDriveManager instance จาก session
 */
export function createGoogleDriveManager(accessToken: string): GoogleDriveManager {
    if (!accessToken) {
        throw new GoogleDriveError(
            "Access token is required",
            "MISSING_ACCESS_TOKEN"
        );
    }
    return new GoogleDriveManager(accessToken);
}
