-- Create database if not exists
CREATE DATABASE IF NOT EXISTS task_converter_db;
USE task_converter_db;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL,
    assignee VARCHAR(100) NOT NULL,
    due_date_time DATETIME NOT NULL,
    priority ENUM('P1', 'P2', 'P3', 'P4') NOT NULL,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_assignee (assignee),
    INDEX idx_due_date (due_date_time),
    INDEX idx_priority (priority),
    INDEX idx_status (status)
);

-- Meetings table (optional, for storing meeting minutes)
CREATE TABLE IF NOT EXISTS meetings (
    id VARCHAR(36) PRIMARY KEY,
    content TEXT NOT NULL,
    meeting_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_meeting_date (meeting_date)
);

-- Task sources table (optional, for linking tasks to meetings)
CREATE TABLE IF NOT EXISTS task_sources (
    task_id VARCHAR(36),
    meeting_id VARCHAR(36),
    PRIMARY KEY (task_id, meeting_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);
