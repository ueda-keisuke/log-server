import express from 'express';
import cors from 'cors';
import { LogDatabase } from './db';
import { LogEntry } from './types';

const app = express();
const db = new LogDatabase();

interface ErrorWithDetails extends Error {
    code?: string;
    stack?: string;
}

app.use(express.json());
app.use(cors());

// ログの保存
app.post('/logs', async (req, res) => {
    try {
        const log: LogEntry = req.body;
        await db.insertLog(log);
        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Error saving log:', err);
        res.status(500).json({ error: 'Failed to save log' });
    }
});

// スレッド一覧の取得
app.get('/threads', async (_req, res) => {
    try {
        const threads = await db.getThreads();
        res.json(threads);
    } catch (err) {
        console.error('Error fetching threads:', err);
        res.status(500).json({ error: 'Failed to fetch threads' });
    }
});

// 特定のスレッドのログを取得
app.get('/threads/:threadId/logs', async (req, res) => {
    try {
        const logs = await db.getThreadLogs(req.params.threadId);
        res.json(logs);
    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// startup関数も修正
async function startup() {
    try {
        await db.connect();

        setInterval(() => {
            db.cleanup().catch((err: unknown) => {
                const error = err as ErrorWithDetails;
                console.error('Cleanup error:', {
                    message: error.message || 'Unknown error',
                    code: error.code,
                    stack: error.stack
                });
            });
        }, 24 * 60 * 60 * 1000);

        const port = process.env.PORT || 4000;
        app.listen(port, () => {
            console.log(`Log collector running on port ${port}`);
        });
    } catch (err: unknown) {
        const error = err as ErrorWithDetails;
        console.error('Startup error:', {
            message: error.message || 'Unknown error',
            code: error.code,
            stack: error.stack
        });

        process.exit(1);
    }
}

startup();