// API utility functions for AI Video Poster Pro

/**
 * Fetch wrapper with error handling
 */
export async function apiFetch<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * POST request helper
 */
export async function apiPost<T>(url: string, data: unknown): Promise<T> {
    return apiFetch<T>(url, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/**
 * GET request helper
 */
export async function apiGet<T>(url: string): Promise<T> {
    return apiFetch<T>(url, {
        method: "GET",
    });
}
