"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type CRMTask,
  MetricCard,
  EmptyState,
  PriorityDot,
  StatusBadge,
  formatDate,
  formatRelativeDate,
  isOverdue,
  isDueToday,
} from "./crm-shared"

interface TasksProps {
  tasks: CRMTask[]
  onCompleteTask: (id: string) => void
  onAddTask: (contactId?: string) => void
}

export function CRMTasks({ tasks, onCompleteTask, onAddTask }: TasksProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "overdue">("pending")

  const pendingTasks = useMemo(() => tasks.filter((t) => t.status === "pending" || t.status === "in_progress"), [tasks])
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === "completed"), [tasks])
  const overdueTasks = useMemo(() => pendingTasks.filter((t) => isOverdue(t.due_date)), [pendingTasks])
  const todayTasks = useMemo(() => pendingTasks.filter((t) => isDueToday(t.due_date)), [pendingTasks])

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case "pending": return pendingTasks
      case "completed": return completedTasks
      case "overdue": return overdueTasks
      default: return tasks
    }
  }, [tasks, pendingTasks, completedTasks, overdueTasks, filter])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Pending" value={pendingTasks.length} icon={ListTodo} detail={`${todayTasks.length} due today`} />
        <MetricCard title="Overdue" value={overdueTasks.length} icon={AlertCircle} detail="Need immediate attention" accent={overdueTasks.length > 0 ? "red" : undefined} />
        <MetricCard title="Due Today" value={todayTasks.length} icon={Clock} detail="Tasks for today" accent={todayTasks.length > 0 ? "amber" : undefined} />
        <MetricCard title="Completed" value={completedTasks.length} icon={CheckCircle2} detail="All time" accent="emerald" />
      </section>

      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["pending", "overdue", "completed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1 opacity-60">
                {f === "pending" ? pendingTasks.length : f === "overdue" ? overdueTasks.length : f === "completed" ? completedTasks.length : tasks.length}
              </span>
            </button>
          ))}
        </div>
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={() => onAddTask()}>
          <Plus className="mr-2 h-4 w-4" /> New Task
        </Button>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filteredTasks.map((task) => {
          const overdue = isOverdue(task.due_date) && task.status !== "completed"
          return (
            <div
              key={task.id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                overdue ? "border-red-200 bg-red-50/50" : task.status === "completed" ? "border-zinc-100 bg-zinc-50/30" : "border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {/* Checkbox */}
              {task.status !== "completed" ? (
                <button
                  onClick={() => onCompleteTask(task.id)}
                  className="shrink-0 rounded-md border border-zinc-300 h-5 w-5 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
                >
                  <CheckCircle2 className="h-3 w-3 text-zinc-300" />
                </button>
              ) : (
                <div className="shrink-0 rounded-md bg-emerald-100 h-5 w-5 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                </div>
              )}

              <PriorityDot priority={task.priority} />

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${task.status === "completed" ? "line-through text-zinc-400" : "text-zinc-900"}`}>
                  {task.title}
                </div>
                {(task.contact || task.deal || task.description) && (
                  <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    {task.contact && <span>{task.contact.company_name || task.contact.full_name}</span>}
                    {task.deal && <span>· {task.deal.deal_name}</span>}
                    {task.description && !task.contact && !task.deal && <span>{task.description}</span>}
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] capitalize">{task.task_type.replaceAll("_", " ")}</Badge>
                <Badge variant="outline" className="text-[10px] capitalize">{task.priority}</Badge>
                {task.due_date && (
                  <span className={`text-xs flex items-center gap-1 ${overdue ? "text-red-600 font-medium" : "text-zinc-400"}`}>
                    <Calendar className="h-3 w-3" />
                    {overdue ? "Overdue" : isDueToday(task.due_date) ? "Today" : formatDate(task.due_date)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        {filteredTasks.length === 0 && (
          <EmptyState
            title={filter === "overdue" ? "No overdue tasks" : filter === "completed" ? "No completed tasks" : "No tasks"}
            description={filter === "pending" ? "Create a task to track your follow-ups and action items." : "Nothing here."}
            action={filter === "pending" ? <Button size="sm" onClick={() => onAddTask()}><Plus className="mr-2 h-4 w-4" />Add Task</Button> : undefined}
          />
        )}
      </div>
    </div>
  )
}
