const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { pool, initializeDatabase, testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test DB connection and initialize tables
(async () => {
  const connected = await testConnection();
  if (connected) {
    await initializeDatabase();
  } else {
    console.error('Failed to connect to database. Exiting.');
    process.exit(1);
  }
})();

const taskRoutes = require('./routes/taskRoutes');

// Basic route
app.get('/', (req, res) => {
  res.send('AI Meetings to Task Converter Backend is running');
});

// Use task routes
app.use('/api/tasks', taskRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
