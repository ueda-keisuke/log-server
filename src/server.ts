import express from 'express';
import cors from 'cors';
import { LogDatabase } from './db';
import { LogEntry } from './types';

const app = express();
const db = new LogDatabase();

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

async function startup() {
    await db.connect();

    // 定期的なクリーンアップ処理
    setInterval(() => db.cleanup(), 24 * 60 * 60 * 1000); // 毎日実行

    const port = process.env.PORT || 4000;
    app.listen(port, () => {
        console.log(`Log collector running on port ${port}`);
    });
}

startup();