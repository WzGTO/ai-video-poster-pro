import { createClient } from "@supabase/supabase-js";

// Supabase Client สำหรับ server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// ===== Types =====

export interface User {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    google_drive_folder_id: string | null;
    google_drive_folders: FolderStructureDB | null;
    created_at: string;
    updated_at: string;
}

export interface FolderStructureDB {
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

export interface Video {
    id: string;
    user_id: string;
    product_id: string | null;
    title: string;
    script: string | null;
    duration: number | null;
    aspect_ratio: string;
    status: "pending" | "processing" | "completed" | "failed";
    original_file_id: string | null;
    optimized_file_id: string | null;
    thumbnail_file_id: string | null;
    audio_file_id: string | null;
    public_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    user_id: string;
    tiktok_product_id: string | null;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    images: string[];
    stock: number;
    category: string | null;
    synced_at: string;
    created_at: string;
}

// ===== Helper Functions =====

/**
 * หา user หรือสร้างใหม่
 */
export async function findOrCreateUser(
    userId: string,
    email: string,
    name?: string | null,
    image?: string | null
): Promise<User | null> {
    // หา user ก่อน
    const { data: existingUser, error: findError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    if (existingUser) {
        return existingUser as User;
    }

    // สร้าง user ใหม่
    const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
            id: userId,
            email,
            name,
            image,
        })
        .select()
        .single();

    if (createError) {
        console.error("Error creating user:", createError);
        return null;
    }

    return newUser as User;
}

/**
 * อัปเดต folder structure ของ user
 */
export async function updateUserFolders(
    userId: string,
    folderId: string,
    folders: FolderStructureDB
): Promise<boolean> {
    const { error } = await supabase
        .from("users")
        .update({
            google_drive_folder_id: folderId,
            google_drive_folders: folders,
            updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

    return !error;
}

/**
 * ดึง user จาก ID
 */
export async function getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        return null;
    }

    return data as User;
}

/**
 * สร้าง video record
 */
export async function createVideo(
    video: Partial<Video> & { user_id: string }
): Promise<Video | null> {
    const { data, error } = await supabase
        .from("videos")
        .insert(video)
        .select()
        .single();

    if (error) {
        console.error("Error creating video:", error);
        return null;
    }

    return data as Video;
}

/**
 * อัปเดต video record
 */
export async function updateVideo(
    videoId: string,
    updates: Partial<Video>
): Promise<boolean> {
    const { error } = await supabase
        .from("videos")
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq("id", videoId);

    return !error;
}

/**
 * ลบ video record
 */
export async function deleteVideoRecord(videoId: string): Promise<boolean> {
    const { error } = await supabase.from("videos").delete().eq("id", videoId);

    return !error;
}

/**
 * ดึง videos ของ user
 */
export async function getUserVideos(userId: string): Promise<Video[]> {
    const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        return [];
    }

    return data as Video[];
}

/**
 * ดึง products ของ user
 */
export async function getUserProducts(userId: string): Promise<Product[]> {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", userId)
        .order("synced_at", { ascending: false });

    if (error) {
        return [];
    }

    return data as Product[];
}
