/**
 * Token Encryption and Management
 * Securely stores and retrieves OAuth tokens
 * 
 * Usage:
 *   import { storeUserToken, getUserToken, deleteUserToken } from '@/lib/db/tokens';
 *   
 *   // Store token
 *   await storeUserToken(userId, 'google', accessToken, refreshToken, expiresAt);
 *   
 *   // Get token
 *   const token = await getUserToken(userId, 'google');
 */

import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

// ===== Types =====

interface EncryptedData {
    encrypted: string;
    iv: string;
    tag: string;
}

interface TokenData {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    openId?: string;
    scope?: string;
}

// ===== Configuration =====

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
function getEncryptionKey(): Buffer {
    const key = process.env.TOKEN_ENCRYPTION_KEY;

    if (!key) {
        // In development, use a fallback key (NOT for production!)
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ TOKEN_ENCRYPTION_KEY not set, using development fallback');
            return crypto.scryptSync('development-key', 'salt', 32);
        }
        throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required');
    }

    // Key should be 64 hex characters (32 bytes)
    if (key.length !== 64) {
        throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    return Buffer.from(key, 'hex');
}

// ===== Encryption Functions =====

/**
 * Encrypt a string using AES-256-GCM
 */
function encryptToken(token: string): EncryptedData {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
    };
}

/**
 * Decrypt a string using AES-256-GCM
 */
function decryptToken(data: EncryptedData): string {
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(data.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// ===== Token Management Functions =====

/**
 * Store OAuth token for a user (server-side only)
 * Tokens are encrypted before storage
 */
export async function storeUserToken(
    userId: string,
    provider: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date,
    metadata?: { openId?: string; scope?: string }
): Promise<void> {
    // Encrypt tokens
    const encryptedAccess = encryptToken(accessToken);
    const encryptedRefresh = refreshToken ? encryptToken(refreshToken) : null;

    // Prepare data
    const tokenData = {
        user_id: userId,
        provider,
        access_token: JSON.stringify(encryptedAccess),
        refresh_token: encryptedRefresh ? JSON.stringify(encryptedRefresh) : null,
        token_expires_at: expiresAt?.toISOString() ?? null,
        open_id: metadata?.openId ?? null,
        scope: metadata?.scope ?? null,
        updated_at: new Date().toISOString(),
    };

    // Upsert token
    const { error } = await supabase
        .from('user_tokens')
        .upsert(tokenData, {
            onConflict: 'user_id,provider',
        });

    if (error) {
        console.error('Failed to store token:', error);
        throw new Error(`Failed to store token for ${provider}: ${error.message}`);
    }
}

/**
 * Get OAuth token for a user (server-side only)
 * Returns decrypted access token or null if not found
 */
export async function getUserToken(
    userId: string,
    provider: string
): Promise<string | null> {
    const { data, error } = await supabase
        .from('user_tokens')
        .select('access_token, token_expires_at')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();

    if (error || !data?.access_token) {
        return null;
    }

    // Check if token is expired
    if (data.token_expires_at) {
        const expiresAt = new Date(data.token_expires_at);
        if (expiresAt < new Date()) {
            console.warn(`Token for ${provider} is expired`);
            // Could trigger refresh here
            return null;
        }
    }

    // Decrypt and return
    try {
        const encryptedData: EncryptedData = JSON.parse(data.access_token);
        return decryptToken(encryptedData);
    } catch (err) {
        console.error('Failed to decrypt token:', err);
        return null;
    }
}

/**
 * Get full token data including refresh token
 */
export async function getFullTokenData(
    userId: string,
    provider: string
): Promise<TokenData | null> {
    const { data, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();

    if (error || !data) {
        return null;
    }

    try {
        const result: TokenData = {
            accessToken: '',
        };

        // Decrypt access token
        if (data.access_token) {
            const encryptedAccess: EncryptedData = JSON.parse(data.access_token);
            result.accessToken = decryptToken(encryptedAccess);
        }

        // Decrypt refresh token
        if (data.refresh_token) {
            const encryptedRefresh: EncryptedData = JSON.parse(data.refresh_token);
            result.refreshToken = decryptToken(encryptedRefresh);
        }

        // Add metadata
        if (data.token_expires_at) {
            result.expiresAt = new Date(data.token_expires_at);
        }
        result.openId = data.open_id;
        result.scope = data.scope;

        return result;
    } catch (err) {
        console.error('Failed to decrypt token data:', err);
        return null;
    }
}

/**
 * Check if token is expired or about to expire
 */
export async function isTokenExpired(
    userId: string,
    provider: string,
    bufferMinutes: number = 5
): Promise<boolean> {
    const { data, error } = await supabase
        .from('user_tokens')
        .select('token_expires_at')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();

    if (error || !data?.token_expires_at) {
        return true; // Assume expired if not found
    }

    const expiresAt = new Date(data.token_expires_at);
    const bufferMs = bufferMinutes * 60 * 1000;

    return expiresAt.getTime() - bufferMs < Date.now();
}

/**
 * Delete OAuth token for a user
 */
export async function deleteUserToken(
    userId: string,
    provider: string
): Promise<void> {
    const { error } = await supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider);

    if (error) {
        console.error('Failed to delete token:', error);
        throw new Error(`Failed to delete token for ${provider}: ${error.message}`);
    }
}

/**
 * Delete all tokens for a user (on account deletion)
 */
export async function deleteAllUserTokens(userId: string): Promise<void> {
    const { error } = await supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', userId);

    if (error) {
        console.error('Failed to delete all tokens:', error);
        throw new Error(`Failed to delete all tokens: ${error.message}`);
    }
}

/**
 * Update just the access token (after refresh)
 */
export async function updateAccessToken(
    userId: string,
    provider: string,
    newAccessToken: string,
    newExpiresAt?: Date
): Promise<void> {
    const encryptedAccess = encryptToken(newAccessToken);

    const updateData: Record<string, unknown> = {
        access_token: JSON.stringify(encryptedAccess),
        updated_at: new Date().toISOString(),
    };

    if (newExpiresAt) {
        updateData.token_expires_at = newExpiresAt.toISOString();
    }

    const { error } = await supabase
        .from('user_tokens')
        .update(updateData)
        .eq('user_id', userId)
        .eq('provider', provider);

    if (error) {
        console.error('Failed to update access token:', error);
        throw new Error(`Failed to update access token: ${error.message}`);
    }
}

/**
 * Check if user has connected a provider
 */
export async function hasProviderConnected(
    userId: string,
    provider: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from('user_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();

    return !error && !!data;
}

/**
 * Get all connected providers for a user
 */
export async function getConnectedProviders(
    userId: string
): Promise<string[]> {
    const { data, error } = await supabase
        .from('user_tokens')
        .select('provider')
        .eq('user_id', userId);

    if (error || !data) {
        return [];
    }

    return data.map(row => row.provider);
}
