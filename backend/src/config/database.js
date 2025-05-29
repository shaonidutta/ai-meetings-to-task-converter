const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Create database if it doesn't exist
async function createDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log('Database created or already exists');
    await connection.end();
  } catch (error) {
    console.error('Error creating database:', error);
    await connection.end();
    throw error;
  }
}

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database and tables
async function initializeDatabase() {
  try {
    // Create database first
    await createDatabase();
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'db', 'init.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Split SQL statements and remove USE statement
    const statements = sqlContent
      .split(';')
      .filter(statement => statement.trim())
      .filter(statement => !statement.toLowerCase().includes('use'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.execute(statement);
      }
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    if (error.code === 'ER_BAD_DB_ERROR') {
      // If database doesn't exist, create it and try again
      await createDatabase();
      return testConnection();
    }
    console.error('Error connecting to database:', error);
    return false;
  }
}

module.exports = {
  pool,
  initializeDatabase,
  testConnection
};
