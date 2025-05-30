const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function reinitializeDatabase() {
  try {
    // First create database if it doesn't exist
    await pool.query('CREATE DATABASE IF NOT EXISTS task_converter_db;');
    
    // Switch to the database
    await pool.query('USE task_converter_db;');
    
    // Drop existing tables
    await pool.query('DROP TABLE IF EXISTS task_sources;');
    await pool.query('DROP TABLE IF EXISTS tasks;');
    await pool.query('DROP TABLE IF EXISTS meetings;');
    
    // Create tables
    await pool.query(`
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
    );`);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS meetings (
        id VARCHAR(36) PRIMARY KEY,
        content TEXT NOT NULL,
        meeting_date DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_meeting_date (meeting_date)
    );`);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS task_sources (
        task_id VARCHAR(36),
        meeting_id VARCHAR(36),
        PRIMARY KEY (task_id, meeting_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
    );`);
    
    console.log('Database reinitialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error reinitializing database:', error);
    process.exit(1);
  }
}

reinitializeDatabase();
