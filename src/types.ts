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

export interface CollectorLogEntry {
    threadId: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;  // NOT NULL
    metadata?: Record<string, unknown>;
}

export interface LogEntry {
    threadId: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    metadata?: Record<string, any>;
}

export interface LogRecord {
    id: number;
    thread_id: string;
    level: string;
    message: string;
    metadata: string | null;
    created_at: string;
}
