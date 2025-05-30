const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { extractTasksFromText } = require('./openaiService');
class TaskService {
  parseDateTime(dateTimeStr) {
    try {
      console.log('parseDateTime input:', dateTimeStr);
      
      // First check if it's a valid ISO string
      const isoDate = new Date(dateTimeStr);
      if (!isNaN(isoDate)) {
        // Extract time components directly from the ISO string
        const matches = dateTimeStr.match(/T(\d{2}):(\d{2}):(\d{2})/);
        if (matches) {
          const [_, hours, minutes, seconds] = matches;
          // Always set year to 2025 and preserve the exact time
          const month = ('0' + (isoDate.getUTCMonth() + 1)).slice(-2);
          const day = ('0' + isoDate.getUTCDate()).slice(-2);
          return `2025-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
      }

      // For non-ISO strings or if time extraction fails, use end of day
      const now = new Date();
      const year = 2025;
      const month = ('0' + (now.getUTCMonth() + 1)).slice(-2);
      const day = ('0' + now.getUTCDate()).slice(-2);
      return `${year}-${month}-${day} 23:59:59`;
    } catch (error) {
      console.error('Error parsing date:', error);
      // If all parsing fails, use end of current day
      const now = new Date();
      const year = 2025;
      const month = ('0' + (now.getUTCMonth() + 1)).slice(-2);
      const day = ('0' + now.getUTCDate()).slice(-2);
      return `${year}-${month}-${day} 23:59:59`;
    }
  }

  async parseAndCreateTasks(text, mode) {
    try {
      // Extract tasks using OpenAI
      let tasks = await extractTasksFromText(text, mode);
      
      // Validate and enforce P3 as default priority
      const validatePriority = (priority) => {
        const validPriorities = ['P1', 'P2', 'P3', 'P4'];
        // Allow all valid priorities, default to P3
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
        let parsedDateTime = this.parseDateTime(dueDateTime);
        console.log('parseAndCreateTasks parsedDateTime:', parsedDateTime);

        // Convert ISO string to MySQL DATETIME format (YYYY-MM-DD HH:mm:ss)
        // Removed redundant conversion since parseDateTime already returns correct format
        // if (parsedDateTime.endsWith('Z')) {
        //   const dateObj = new Date(parsedDateTime);
        //   const year = dateObj.getFullYear();
        //   const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
        //   const day = ('0' + dateObj.getDate()).slice(-2);
        //   const hours = ('0' + dateObj.getHours()).slice(-2);
        //   const minutes = ('0' + dateObj.getMinutes()).slice(-2);
        //   const seconds = ('0' + dateObj.getSeconds()).slice(-2);
        //   parsedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        //   console.log('parseAndCreateTasks converted parsedDateTime:', parsedDateTime);
        // }
        
        // Ensure P3 is default for both single and bulk tasks
        const priority = task.priority || "P3";
        
        // Ensure assignee is never empty
        const assignee = task.assignee || "Unassigned";
        
        await pool.execute(
          'INSERT INTO tasks (id, task_name, assignee, due_date_time, priority) VALUES (?, ?, ?, ?, ?)',
          [id, task.taskName, assignee, parsedDateTime, priority]
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

      // Validate required fields
      if (!task_name || !assignee || !due_date_time || !priority || !status) {
        throw new Error('Missing required fields in update');
      }

      // Parse and convert the due date time
      let parsedDateTime = this.parseDateTime(due_date_time);

      // Convert ISO string to MySQL DATETIME format (YYYY-MM-DD HH:mm:ss)
      if (parsedDateTime.endsWith('Z')) {
        const dateObj = new Date(parsedDateTime);
        const year = dateObj.getFullYear();
        const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
        const day = ('0' + dateObj.getDate()).slice(-2);
        const hours = ('0' + dateObj.getHours()).slice(-2);
        const minutes = ('0' + dateObj.getMinutes()).slice(-2);
        const seconds = ('0' + dateObj.getSeconds()).slice(-2);
        parsedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

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
