import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { CollectorLogEntry, LogRecord, Thread } from "./types";
import * as path from "node:path";
import * as fs from "node:fs";

// SQLiteErrorの型定義
interface SQLiteError extends Error {
    code?: string;
    errno?: number;
}

export class LogDatabase {
    private db: Database | null = null;

    async connect(): Promise<void> {
        try {
            const dbPath = process.env.SQLITE_DB_PATH || './logs.db';

            console.log('Database connection attempt:', {
                path: dbPath,
                absolutePath: path.resolve(dbPath),
                exists: fs.existsSync(dbPath),
                dirExists: fs.existsSync(path.dirname(dbPath)),
                permissions: fs.existsSync(dbPath) ?
                    fs.statSync(dbPath).mode.toString(8) : 'N/A'
            });

            this.db = await open({
                filename: dbPath,
                driver: sqlite3.Database
            });

            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS logs (
                                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                    thread_id TEXT NOT NULL,
                                                    level TEXT NOT NULL,
                                                    message TEXT NOT NULL,
                                                    metadata TEXT,
                                                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_thread_id ON logs(thread_id);
                CREATE INDEX IF NOT EXISTS idx_created_at ON logs(created_at);
            `);
        } catch (error: unknown) {
            const dbError = error as SQLiteError;
            console.error('Database connection error:', {
                error: {
                    message: dbError.message,
                    code: dbError.code,
                    errno: dbError.errno,
                    stack: dbError.stack
                },
                env: {
                    pwd: process.cwd(),
                    uid: process.getuid?.(),
                    gid: process.getgid?.(),
                    dbPath: process.env.SQLITE_DB_PATH
                }
            });
            throw error;
        }
    }

    async insertLog(log: CollectorLogEntry): Promise<void> {
        if (!this.db) throw new Error('Database not connected');

        const message = log.message ||
            (typeof log.metadata === 'object' ?
                JSON.stringify(log.metadata) :
                'No message provided');

        await this.db.run(
            'INSERT INTO logs (thread_id, level, message, metadata) VALUES (?, ?, ?, ?)',
            log.threadId,
            log.level,
            message,
            log.metadata ? JSON.stringify(log.metadata) : null
        );
    }

    async getThreads(): Promise<Thread[]> {
        if (!this.db) throw new Error('Database not connected');

        const results = await this.db.all<{
            threadId: string;
            logCount: number;
            startedAt: string;
            lastUpdated: string;
        }[]>(`
            SELECT 
                thread_id as threadId,
                COUNT(*) as logCount,
                MIN(created_at) as startedAt,
                MAX(created_at) as lastUpdated
            FROM logs 
            GROUP BY thread_id 
            ORDER BY MAX(created_at) DESC
            LIMIT 100
        `);

        return results;
    }

    async getThreadLogs(threadId: string): Promise<LogRecord[]> {
        if (!this.db) throw new Error('Database not connected');

        type RawLogRecord = {
            id: number;
            thread_id: string;
            level: string;
            message: string;
            metadata: string | null;
            created_at: string;
        };

        const logs = await this.db.all<RawLogRecord[]>(
            'SELECT * FROM logs WHERE thread_id = ? ORDER BY created_at ASC',
            threadId
        );

        return logs.map((log: RawLogRecord) => ({
            ...log,
            metadata: log.metadata ? JSON.parse(log.metadata) : null
        }));
    }

    async cleanup(): Promise<void> {
        if (!this.db) throw new Error('Database not connected');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        await this.db.run(
            'DELETE FROM logs WHERE created_at < ?',
            thirtyDaysAgo.toISOString()
        );
    }

    async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
}