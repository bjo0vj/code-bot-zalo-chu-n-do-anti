const { Pool } = require('pg');
const logger = require('./logger');

let pool = null;

const connect = async () => {
    try {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            logger.log("DATABASE_URL not found. Skipping database connection.", "warn");
            return;
        }

        pool = new Pool({
            connectionString,
            ssl: {
                rejectUnauthorized: false // Required for Railway
            }
        });

        await pool.query('SELECT 1');
        logger.log("Connected to PostgreSQL database successfully.", "info");

        await initSchema();
    } catch (error) {
        logger.log(`Failed to connect to database: ${error.message}`, "error");
        pool = null;
    }
};

const initSchema = async () => {
    if (!pool) return;

    try {
        // Table for tracking sessions (target, isRunning, etc.)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tracking_sessions (
                thread_id VARCHAR(50) PRIMARY KEY,
                target INTEGER DEFAULT 0,
                is_running BOOLEAN DEFAULT FALSE,
                sosanh JSONB DEFAULT '[]',
                dagui JSONB DEFAULT '[]',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Table for image history logs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tracking_history (
                id SERIAL PRIMARY KEY,
                thread_id VARCHAR(50) NOT NULL,
                sender_id VARCHAR(50) NOT NULL,
                name TEXT,
                count INTEGER DEFAULT 0,
                timestamp BIGINT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Index for faster history queries
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_history_thread_timestamp ON tracking_history(thread_id, timestamp);`);

        logger.log("Database schema initialized.", "info");
    } catch (error) {
        logger.log(`Failed to initialize schema: ${error.message}`, "error");
    }
};

// --- Helper Methods ---

const getSession = async (threadId) => {
    if (!pool) return null;
    try {
        const res = await pool.query('SELECT * FROM tracking_sessions WHERE thread_id = $1', [threadId]);
        if (res.rows.length > 0) {
            const row = res.rows[0];
            return {
                target: row.target,
                isRunning: row.is_running,
                sosanh: row.sosanh || [],
                dagui: row.dagui || []
            };
        }
        return null;
    } catch (e) {
        console.error("DB getSession error:", e);
        return null;
    }
};

const saveSession = async (threadId, data) => {
    if (!pool) return;
    try {
        await pool.query(`
            INSERT INTO tracking_sessions (thread_id, target, is_running, sosanh, dagui, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (thread_id)
            DO UPDATE SET
                target = EXCLUDED.target,
                is_running = EXCLUDED.is_running,
                sosanh = EXCLUDED.sosanh,
                dagui = EXCLUDED.dagui,
                updated_at = NOW();
        `, [threadId, data.target, data.isRunning, JSON.stringify(data.sosanh), JSON.stringify(data.dagui)]);
    } catch (e) {
        console.error("DB saveSession error:", e);
    }
};

const addHistory = async (threadId, senderId, name, count, timestamp) => {
    if (!pool) return;
    try {
        await pool.query(`
            INSERT INTO tracking_history (thread_id, sender_id, name, count, timestamp)
            VALUES ($1, $2, $3, $4, $5)
        `, [threadId, senderId, name, count, timestamp]);
    } catch (e) {
        console.error("DB addHistory error:", e);
    }
};

const getHistory = async (threadId, startTime) => {
    if (!pool) return [];
    try {
        const res = await pool.query(`
            SELECT * FROM tracking_history
            WHERE thread_id = $1 AND timestamp >= $2
            ORDER BY timestamp ASC
        `, [threadId, startTime]);
        return res.rows;
    } catch (e) {
        console.error("DB getHistory error:", e);
        return [];
    }
};

const clearHistory = async (threadId) => {
    if (!pool) return;
    try {
        await pool.query('DELETE FROM tracking_history WHERE thread_id = $1', [threadId]);
    } catch (e) {
        console.error("DB clearHistory error:", e);
    }
};

module.exports = {
    connect,
    getSession,
    saveSession,
    addHistory,
    getHistory,
    clearHistory
};
