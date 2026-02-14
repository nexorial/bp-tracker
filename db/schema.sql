-- BP Tracker Database Schema
-- Table for storing blood pressure records

CREATE TABLE IF NOT EXISTS bp_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    systolic INTEGER NOT NULL,
    diastolic INTEGER NOT NULL,
    heart_rate INTEGER NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_bp_records_recorded_at ON bp_records(recorded_at);
