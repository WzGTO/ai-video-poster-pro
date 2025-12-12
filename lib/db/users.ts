/**
 * Database User Management
 * Handles user creation, updates, and queries
 */

import { supabase } from '@/lib/supabase';
import type { FolderStructure } from '@/lib/google-drive';

// ===== Types =====

export interface User {
    id: string;
    google_id: string;
    email: string;
    name: string | null;
    image: string | null;
    google_drive_folder_id: string | null;
    google_drive_folders: FolderStructure | null;
    tiktok_connected: boolean;
    facebook_connected: boolean;
    youtube_connected: boolean;
    videos_created_count: number;
    storage_used_mb: number;
    created_at: string;
    updated_at: string;
}

export interface CreateUserInput {
    google_id: string;
    email: string;
    name?: string | null;
    image?: string | null;
}

export interface UpdateUserInput {
    name?: string | null;
    image?: string | null;
    google_drive_folder_id?: string | null;
    google_drive_folders?: FolderStructure | null;
    tiktok_connected?: boolean;
    facebook_connected?: boolean;
    youtube_connected?: boolean;
    videos_created_count?: number;
    storage_used_mb?: number;
}

// ===== User Functions =====

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) {
        return null;
    }

    return data as User;
}

/**
 * Get user by Google ID
 */
export async function getUserByGoogleId(googleId: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('google_id', googleId)
        .single();

    if (error || !data) {
        return null;
    }

    return data as User;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !data) {
        return null;
    }

    return data as User;
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<User> {
    const { data, error } = await supabase
        .from('users')
        .insert({
            google_id: input.google_id,
            email: input.email,
            name: input.name ?? null,
            image: input.image ?? null,
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to create user:', error);
        throw new Error(`Failed to create user: ${error.message}`);
    }

    return data as User;
}

/**
 * Create or update user (upsert)
 */
export async function createOrUpdateUser(input: CreateUserInput): Promise<User> {
    const { data, error } = await supabase
        .from('users')
        .upsert(
            {
                google_id: input.google_id,
                email: input.email,
                name: input.name ?? null,
                image: input.image ?? null,
            },
            {
                onConflict: 'google_id',
            }
        )
        .select()
        .single();

    if (error) {
        console.error('Failed to create/update user:', error);
        throw new Error(`Failed to create/update user: ${error.message}`);
    }

    return data as User;
}

/**
 * Update user
 */
export async function updateUser(
    userId: string,
    input: UpdateUserInput
): Promise<User> {
    const updateData: Record<string, unknown> = { ...input };

    const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Failed to update user:', error);
        throw new Error(`Failed to update user: ${error.message}`);
    }

    return data as User;
}

/**
 * Update user's Google Drive folders
 */
export async function updateUserDriveFolders(
    userId: string,
    folderId: string,
    folders: FolderStructure
): Promise<void> {
    const { error } = await supabase
        .from('users')
        .update({
            google_drive_folder_id: folderId,
            google_drive_folders: folders,
        })
        .eq('id', userId);

    if (error) {
        console.error('Failed to update drive folders:', error);
        throw new Error(`Failed to update drive folders: ${error.message}`);
    }
}

/**
 * Update social connection status
 */
export async function updateSocialConnection(
    userId: string,
    platform: 'tiktok' | 'facebook' | 'youtube',
    connected: boolean
): Promise<void> {
    const updateData: Record<string, boolean> = {};
    updateData[`${platform}_connected`] = connected;

    const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

    if (error) {
        console.error('Failed to update social connection:', error);
        throw new Error(`Failed to update social connection: ${error.message}`);
    }
}

/**
 * Increment video count
 */
export async function incrementVideoCount(userId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_video_count', {
        p_user_id: userId,
    });

    // Fallback if RPC doesn't exist
    if (error) {
        const user = await getUserById(userId);
        if (user) {
            await supabase
                .from('users')
                .update({ videos_created_count: (user.videos_created_count || 0) + 1 })
                .eq('id', userId);
        }
    }
}

/**
 * Update storage usage
 */
export async function updateStorageUsage(
    userId: string,
    storageMb: number
): Promise<void> {
    const { error } = await supabase
        .from('users')
        .update({ storage_used_mb: storageMb })
        .eq('id', userId);

    if (error) {
        console.error('Failed to update storage usage:', error);
    }
}

/**
 * Delete user and all related data
 */
export async function deleteUser(userId: string): Promise<void> {
    // Due to CASCADE, this will delete all related records
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

    if (error) {
        console.error('Failed to delete user:', error);
        throw new Error(`Failed to delete user: ${error.message}`);
    }
}
