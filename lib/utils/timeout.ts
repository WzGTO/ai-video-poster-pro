/**
 * Timeout and Retry Utilities
 * Provides API timeout handling and retry logic with exponential backoff
 * 
 * Usage:
 *   import { withTimeout, withRetry } from '@/lib/utils/timeout';
 *   
 *   const result = await withTimeout(apiCall(), 5000);
 *   const result = await withRetry(() => apiCall(), { maxRetries: 3 });
 */

// ===== Types =====

export interface RetryOptions {
    maxRetries?: number;      // Max retry attempts (default: 3)
    timeout?: number;         // Timeout per attempt in ms (default: 30000)
    backoff?: number;         // Initial backoff delay in ms (default: 1000)
    maxBackoff?: number;      // Max backoff delay in ms (default: 30000)
    exponential?: boolean;    // Use exponential backoff (default: true)
    retryOn?: (error: Error) => boolean;  // Custom retry condition
    onRetry?: (error: Error, attempt: number) => void;  // Retry callback
}

export class TimeoutError extends Error {
    constructor(message: string, public timeoutMs: number) {
        super(message);
        this.name = 'TimeoutError';
    }
}

export class RetryError extends Error {
    constructor(
        message: string,
        public attempts: number,
        public lastError: Error
    ) {
        super(message);
        this.name = 'RetryError';
    }
}

// ===== Timeout Functions =====

/**
 * Wrap a promise with a timeout
 * Rejects if the promise doesn't resolve within the specified time
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage?: string
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new TimeoutError(
                errorMessage || `Operation timed out after ${timeoutMs}ms`,
                timeoutMs
            ));
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId!);
        return result;
    } catch (error) {
        clearTimeout(timeoutId!);
        throw error;
    }
}

/**
 * Create an AbortSignal that times out after specified milliseconds
 */
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller.signal;
}

/**
 * Combine multiple AbortSignals
 */
export function combineSignals(...signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
        if (signal.aborted) {
            controller.abort();
            break;
        }
        signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    return controller.signal;
}

// ===== Retry Functions =====

/**
 * Retry a function with configurable backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        timeout = 30000,
        backoff = 1000,
        maxBackoff = 30000,
        exponential = true,
        retryOn = () => true,
        onRetry,
    } = options;

    let lastError: Error = new Error('Unknown error');
    let attempts = 0;

    while (attempts < maxRetries) {
        attempts++;

        try {
            // Execute with timeout if specified
            if (timeout) {
                return await withTimeout(fn(), timeout);
            }
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Check if we should retry
            const isTimeoutError = error instanceof TimeoutError;
            const shouldRetry = retryOn(lastError) || isTimeoutError;

            if (!shouldRetry || attempts >= maxRetries) {
                break;
            }

            // Calculate backoff delay
            let delay = backoff;
            if (exponential) {
                delay = Math.min(backoff * Math.pow(2, attempts - 1), maxBackoff);
            }

            // Call retry callback
            onRetry?.(lastError, attempts);

            // Wait before retry
            await sleep(delay);
        }
    }

    throw new RetryError(
        `Failed after ${attempts} attempts: ${lastError.message}`,
        attempts,
        lastError
    );
}

/**
 * Retry with timeout wrapper (convenience function)
 */
export async function withTimeoutAndRetry<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    maxRetries: number = 3
): Promise<T> {
    return withRetry(fn, {
        maxRetries,
        timeout: timeoutMs,
        exponential: true,
    });
}

// ===== Utility Functions =====

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delayMs: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delayMs);
    };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limitMs: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limitMs);
        }
    };
}

/**
 * Execute with deadline (specific end time)
 */
export async function withDeadline<T>(
    promise: Promise<T>,
    deadline: Date
): Promise<T> {
    const now = new Date();
    const timeoutMs = deadline.getTime() - now.getTime();

    if (timeoutMs <= 0) {
        throw new TimeoutError('Deadline has already passed', 0);
    }

    return withTimeout(promise, timeoutMs, 'Operation exceeded deadline');
}

// ===== Fetch with Timeout =====

/**
 * Fetch with built-in timeout
 */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
    const { timeout = 30000, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: combineSignals(
                controller.signal,
                ...(fetchOptions.signal ? [fetchOptions.signal] : [])
            ),
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new TimeoutError(`Request to ${url} timed out after ${timeout}ms`, timeout);
        }
        throw error;
    }
}

/**
 * Fetch with retry and timeout
 */
export async function fetchWithRetry(
    url: string,
    options: RequestInit & {
        timeout?: number;
        maxRetries?: number;
        backoff?: number;
    } = {}
): Promise<Response> {
    const { timeout = 30000, maxRetries = 3, backoff = 1000, ...fetchOptions } = options;

    return withRetry(
        () => fetchWithTimeout(url, { ...fetchOptions, timeout }),
        {
            maxRetries,
            backoff,
            exponential: true,
            retryOn: (error) => {
                // Retry on network errors and timeouts
                return error instanceof TimeoutError ||
                    error.name === 'TypeError' ||
                    error.message.includes('network');
            },
        }
    );
}
