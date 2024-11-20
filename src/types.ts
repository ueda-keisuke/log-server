export interface LogEntry {
    threadId: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    metadata?: Record<string, any>;
}

export interface Thread {
    threadId: string;
    logCount: number;
    startedAt: string;
    lastUpdated: string;
}