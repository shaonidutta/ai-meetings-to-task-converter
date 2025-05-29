import type React from "react"
import { useState } from "react"
import type { ParseRequest } from "../types/task"
import { MessageSquare, FileText, Loader2, Sparkles } from "lucide-react"

interface InputFormProps {
  onParse: (request: ParseRequest) => void
  isLoading?: boolean
}

export function InputForm({ onParse, isLoading }: InputFormProps) {
  const [mode, setMode] = useState<"single" | "bulk">("single")
  const [text, setText] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onParse({ text: text.trim(), mode })
    }
  }

  const handleModeChange = (newMode: "single" | "bulk") => {
    setMode(newMode)
    setText("")
  }

  return (
    <section className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          AI Task Manager
        </h1>
        <p className="text-gray-300 text-xl">Transform meeting notes and conversations into actionable tasks</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="flex flex-col sm:flex-row w-full max-w-md gap-2 sm:gap-3 p-1.5 sm:p-2 bg-gray-900/60 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-gray-700/40 shadow-xl shadow-black/30">
          <button
            onClick={() => handleModeChange("single")}
            className={`
        group flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-300 ease-out
        relative overflow-hidden flex-1
        ${
          mode === "single"
            ? "bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/30"
            : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
        }
      `}
          >
            {mode === "single" && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />
            )}
            <MessageSquare
              className={`w-4 h-4 transition-all duration-300 relative z-10 ${mode === "single" ? "drop-shadow-sm" : "group-hover:scale-110"}`}
            />
            <span className="text-sm font-semibold relative z-10 whitespace-nowrap">Single Task</span>
          </button>

          <button
            onClick={() => handleModeChange("bulk")}
            className={`
        group flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-300 ease-out
        relative overflow-hidden flex-1
        ${
          mode === "bulk"
            ? "bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/30"
            : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
        }
      `}
          >
            {mode === "bulk" && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />
            )}
            <FileText
              className={`w-4 h-4 transition-all duration-300 relative z-10 ${mode === "bulk" ? "drop-shadow-sm" : "group-hover:scale-110"}`}
            />
            <span className="text-sm font-semibold relative z-10 whitespace-nowrap">Meeting Transcript</span>
          </button>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="task-input" className="block text-lg font-medium text-gray-200 mb-4">
            {mode === "single" ? "Describe your task in natural language" : "Paste your meeting transcript or notes"}
          </label>

          {mode === "single" ? (
            <input
              id="task-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., Schedule a follow-up meeting with the client next Friday"
              className="w-full px-6 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-lg"
              disabled={isLoading}
            />
          ) : (
            <textarea
              id="task-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your meeting transcript here... The AI will extract actionable tasks, assign them to team members, and set appropriate priorities and due dates."
              rows={8}
              className="w-full px-6 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-xl text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none"
              disabled={isLoading}
            />
          )}
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="
              flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 
              text-white font-semibold rounded-xl hover:from-blue-500 hover:to-purple-500 
              focus:ring-4 focus:ring-blue-400/25 transition-all duration-200 
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25
              border border-blue-500/20
            "
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Tasks
              </>
            )}
          </button>
        </div>
      </form>

      {/* Example hints */}
      <div className="p-6 bg-blue-900/20 backdrop-blur-sm rounded-xl border border-blue-700/30">
        <h3 className="font-medium text-blue-300 mb-3 text-lg">
          {mode === "single" ? "Example single tasks:" : "Example meeting transcript:"}
        </h3>
        <div className="text-blue-200/80 space-y-2">
          {mode === "single" ? (
            <>
              <p>• "Send the quarterly report to Sarah by end of week"</p>
              <p>• "Review the new design mockups and provide feedback"</p>
              <p>• "Schedule a team standup for next Monday morning"</p>
            </>
          ) : (
            <p className="italic leading-relaxed">
              "John mentioned we need to finalize the budget by Friday. Sarah will handle the client presentation next
              week. Mike should review the technical specifications and get back to us by Wednesday..."
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
