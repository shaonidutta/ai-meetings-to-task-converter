const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { extractTasksFromText } = require('./openaiService');
class TaskService {
  parseDateTime(dateTimeStr) {
    try {
      // Handle common natural language patterns
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dateMap = {
        'today': today,
        'tomorrow': tomorrow,
        'end of week': (() => {
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (5 - today.getDay())); // Friday
          endOfWeek.setHours(23, 59, 59, 999);
          return endOfWeek;
        })(),
        'next week': (() => {
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          return nextWeek;
        })()
      };

      // Try to parse as ISO date first
      let parsedDate = new Date(dateTimeStr);
      
      // If invalid date or natural language pattern found
      if (isNaN(parsedDate) || !dateTimeStr.includes('-')) {
        const lowerStr = dateTimeStr.toLowerCase();
        for (const [key, value] of Object.entries(dateMap)) {
          if (lowerStr.includes(key)) {
            parsedDate = value;
            break;
          }
        }
      }

      // If still invalid, default to end of current day
      if (isNaN(parsedDate)) {
        today.setHours(23, 59, 59, 999);
        return today.toISOString().slice(0, 19).replace('T', ' ');
      }

      // Convert to MySQL DATETIME format
      return parsedDate.toISOString().slice(0, 19).replace('T', ' ');
    } catch (error) {
      console.error('Error parsing date:', error);
      // Default to end of current day
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return today.toISOString().slice(0, 19).replace('T', ' ');
    }
  }

  async parseAndCreateTasks(text, mode) {
    try {
      // Extract tasks using OpenAI
      let tasks = await extractTasksFromText(text, mode);
      
      // Validate and enforce P3 as default priority
      const validatePriority = (priority) => {
        const validPriorities = ['P1', 'P2', 'P3'];
        // Only allow P1/P2 if explicitly set, otherwise force P3
        return validPriorities.includes(priority) ? priority : 'P3';
      };

      // For single task mode
      if (mode === 'single' && !Array.isArray(tasks)) {
        tasks = {
          ...tasks,
          // Force P3 unless text explicitly mentioned P1/P2 keywords
          priority: validatePriority(tasks.priority)
        };
      }
      
      // For bulk tasks or converted single task
      const tasksArray = Array.isArray(tasks) ? tasks : [tasks];
      tasksArray.forEach(task => {
        task.priority = validatePriority(task.priority);
      });
      
      // Save tasks to database
      const savedTasks = [];
      for (const task of tasksArray) {
        const id = uuidv4();
        
        // Handle empty or missing dueDateTime
        const dueDateTime = task.dueDateTime || 'end of day';
        const parsedDateTime = this.parseDateTime(dueDateTime);
        
        // Ensure P3 is default for both single and bulk tasks
        const priority = task.priority || "P3";
        
        // Ensure assignee is never empty
        const assignee = task.assignee || "Unassigned";
        
        await pool.execute(
          'INSERT INTO tasks (id, task_name, assignee, due_date_time, priority) VALUES (?, ?, ?, ?, ?)',
          [id, task.taskName, task.assignee, parsedDateTime, priority]
        );
        
        // Get the saved task
        const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
        savedTasks.push(rows[0]);
      }
      
      return savedTasks;
    } catch (error) {
      console.error('Error in parseAndCreateTasks:', error);
      throw error;
    }
  }

  async getAllTasks() {
    try {
      const [tasks] = await pool.execute(
        'SELECT * FROM tasks ORDER BY created_at DESC'
      );
      return tasks;
    } catch (error) {
      console.error('Error in getAllTasks:', error);
      throw error;
    }
  }

  async updateTask(id, updates) {
    try {
      const { task_name, assignee, due_date_time, priority, status } = updates;

      // Parse and convert the due date time
      const parsedDateTime = this.parseDateTime(due_date_time);

      await pool.execute(
        'UPDATE tasks SET task_name = ?, assignee = ?, due_date_time = ?, priority = ?, status = ? WHERE id = ?',
        [task_name, assignee, parsedDateTime, priority, status, id]
      );
      
      // Get the updated task
      const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error('Error in updateTask:', error);
      throw error;
    }
  }

  async deleteTask(id) {
    try {
      await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error in deleteTask:', error);
      throw error;
    }
  }
}

module.exports = new TaskService();
