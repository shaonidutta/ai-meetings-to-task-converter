export interface Task {
  id: string;
  task_name: string;
  assignee: string;
  due_date_time: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface ParseRequest {
  text: string;
  mode: 'single' | 'bulk';
}

export interface ParseResponse {
  tasks: Task[];
}

export interface TaskUpdate {
  task_name: string;
  assignee: string;
  due_date_time: string;
  priority: Task['priority'];
  status: Task['status'];
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
