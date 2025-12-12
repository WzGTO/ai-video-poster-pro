type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    data?: unknown;
    error?: {
        message: string;
        stack?: string;
        name: string;
    };
}

/**
 * Simple logger utility
 * ในอนาคตสามารถเชื่อมต่อกับ Sentry, LogRocket, หรือ service อื่นๆ
 */
class Logger {
    private isDevelopment = process.env.NODE_ENV === "development";

    private formatLog(entry: LogEntry): string {
        const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
        let log = `${prefix} ${entry.message}`;

        if (entry.data) {
            log += ` ${JSON.stringify(entry.data)}`;
        }

        if (entry.error) {
            log += ` Error: ${entry.error.message}`;
            if (this.isDevelopment && entry.error.stack) {
                log += `\n${entry.error.stack}`;
            }
        }

        return log;
    }

    private log(level: LogLevel, message: string, data?: unknown, error?: unknown) {
        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            data: data && typeof data !== "object" ? { value: data } : (data as object),
        };

        if (error) {
            if (error instanceof Error) {
                entry.error = {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                };
            } else if (typeof error === "string") {
                entry.error = {
                    message: error,
                    name: "Error",
                };
            } else {
                entry.error = {
                    message: JSON.stringify(error),
                    name: "Unknown",
                };
            }
        }

        const formatted = this.formatLog(entry);

        switch (level) {
            case "debug":
                if (this.isDevelopment) console.debug(formatted);
                break;
            case "info":
                console.log(formatted);
                break;
            case "warn":
                console.warn(formatted);
                break;
            case "error":
                console.error(formatted);
                // ในอนาคตสามารถส่งไป Sentry ที่นี่
                // if (process.env.SENTRY_DSN) { Sentry.captureException(error); }
                break;
        }
    }

    debug(message: string, data?: unknown) {
        this.log("debug", message, data);
    }

    info(message: string, data?: unknown) {
        this.log("info", message, data);
    }

    warn(message: string, data?: unknown) {
        this.log("warn", message, data);
    }

    error(message: string, error?: unknown, data?: unknown) {
        this.log("error", message, data, error);
    }
}

// Export singleton instance
export const logger = new Logger();
