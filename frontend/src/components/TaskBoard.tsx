import type { Task, TaskUpdate } from "../types/task"
import { TaskCard } from "./TaskCard"

interface TaskBoardProps {
  tasks: Task[]
  onUpdateTask: (id: string, updates: TaskUpdate) => void
  onDeleteTask: (id: string) => void
  isLoading?: boolean
}

export function TaskBoard({ tasks, onUpdateTask, onDeleteTask, isLoading }: TaskBoardProps) {
  if (isLoading) {
    return (
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-100">Task Board</h2>
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 animate-pulse"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-6 bg-gray-700/50 rounded-full w-20"></div>
                <div className="h-6 w-6 bg-gray-700/50 rounded"></div>
              </div>
              <div className="space-y-3">
                <div className="h-6 bg-gray-700/50 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
                <div className="h-4 bg-gray-700/50 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }


  if (tasks.length === 0) {
    return (
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-100">Task Board</h2>
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-600/50">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-200 mb-2">No tasks yet</h3>
            <p className="text-gray-400">Start by parsing some meeting notes or adding a single task above.</p>
          </div>
        </div>
      </section>
    )
  }


  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Task Board</h2>
        <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task, index) => (
          <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <TaskCard task={task} onUpdate={onUpdateTask} onDelete={onDeleteTask} />
          </div>
        ))}
      </div>
    </section>
  )
}
