import React, { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetProjects, useGetTasks, useUpdateProject, useDeleteProject,
  useCreateTask, useUpdateTask, useDeleteTask,
} from "@workspace/api-client-react";
import type { Task, Project, UpdateProjectRequest, CreateTaskRequest } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Plus, Check, Trash2, Clock, AlertTriangle,
  ChevronRight, Pencil, X, Circle, CheckCircle2,
} from "lucide-react";
import { format, isPast, isToday, parseISO } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active:  { label: "Active",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30", dot: "bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]" },
  blocked: { label: "Blocked",  color: "text-red-400 bg-red-400/10 border-red-400/30",             dot: "bg-red-400 shadow-[0_0_5px_rgba(239,68,68,0.7)]" },
  planned: { label: "Planned",  color: "text-sky-400 bg-sky-400/10 border-sky-400/30",             dot: "bg-sky-400" },
  on_hold: { label: "On Hold",  color: "text-zinc-400 bg-zinc-400/10 border-zinc-600",             dot: "bg-zinc-500" },
  done:    { label: "Done",     color: "text-zinc-500 bg-zinc-700/20 border-zinc-700",             dot: "bg-zinc-600" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: "CRIT", color: "text-red-400 border-red-400/40 bg-red-400/5" },
  high:     { label: "HIGH", color: "text-orange-400 border-orange-400/40 bg-orange-400/5" },
  medium:   { label: "MED",  color: "text-yellow-400 border-yellow-400/40 bg-yellow-400/5" },
  low:      { label: "LOW",  color: "text-zinc-500 border-zinc-600 bg-zinc-800/30" },
};

const TASK_STATUS_ORDER = ["in_progress", "pending", "failed", "completed", "cancelled"];

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? parseInt(params.id, 10) : null;

  const { data: projects } = useGetProjects();
  const { data: tasks } = useGetTasks();
  const { mutate: updateProject } = useUpdateProject();
  const { mutate: deleteProject } = useDeleteProject();
  const { mutate: createTask, isPending: creatingTask } = useCreateTask();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");

  const project = projects?.find(p => p.id === projectId);
  const projectTasks = (tasks ?? [])
    .filter(t => t.projectId === projectId)
    .sort((a, b) => {
      const so = TASK_STATUS_ORDER.indexOf(a.status) - TASK_STATUS_ORDER.indexOf(b.status);
      if (so !== 0) return so;
      const po: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (po[a.priority] ?? 9) - (po[b.priority] ?? 9);
    });

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim() || !projectId) return;
    createTask({ data: { title: newTaskTitle.trim(), priority: "medium", projectId, dueDate: newTaskDue || undefined } });
    setNewTaskTitle("");
    setNewTaskDue("");
  }

  function toggleTask(task: Task) {
    updateTask({ id: task.id, data: { status: task.status === "completed" ? "pending" : "completed" } });
  }

  if (!project) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-xs font-mono text-muted-foreground">Project not found.</p>
        <Link href="/projects" className="text-xs font-mono text-primary hover:underline flex items-center justify-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to Projects
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.planned;
  const priCfg = PRIORITY_CONFIG[project.priority] ?? PRIORITY_CONFIG.medium;

  const openTasks = projectTasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
  const doneTasks = projectTasks.filter(t => t.status === "completed" || t.status === "cancelled");

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Projects
      </Link>

      {/* Project header */}
      <div className="border border-border rounded p-5 bg-card/30 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={cn("w-2 h-2 rounded-full shrink-0", statusCfg.dot)} />
              <h2 className="text-base font-mono font-bold text-foreground">{project.name}</h2>
              <span className={cn("text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border", statusCfg.color)}>
                {statusCfg.label}
              </span>
              <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border", priCfg.color)}>
                {priCfg.label}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground shrink-0">
            {project.owner && <span>{project.owner}</span>}
            {project.dueDate && (
              <span className={cn("flex items-center gap-1",
                isPast(new Date(project.dueDate)) && !isToday(new Date(project.dueDate)) ? "text-red-400" : "text-muted-foreground"
              )}>
                <Clock className="w-3 h-3" />
                {format(parseISO(project.dueDate), "MMM d, yyyy")}
              </span>
            )}
          </div>
        </div>

        {/* Next step */}
        {project.nextStep && (
          <div className="flex items-start gap-2 pt-1 border-t border-border/40">
            <ChevronRight className="w-3.5 h-3.5 text-primary/50 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Next step</span>
              <p className="text-sm font-mono text-primary/80 mt-0.5">{project.nextStep}</p>
            </div>
          </div>
        )}

        {project.status === "blocked" && (
          <div className="flex items-center gap-2 text-red-400 pt-1 border-t border-red-500/20">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-mono">This project is blocked and needs attention.</span>
          </div>
        )}
      </div>

      {/* Tasks */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Tasks · {openTasks.length} open</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Add task */}
        <form onSubmit={handleAddTask} className="flex items-stretch gap-0 border border-border/50 rounded overflow-hidden focus-within:border-primary/30 transition-colors">
          <input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 bg-transparent px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
          <input
            type="date"
            value={newTaskDue}
            onChange={e => setNewTaskDue(e.target.value)}
            className="bg-transparent border-l border-border px-3 py-2 text-xs font-mono text-muted-foreground focus:outline-none focus:text-foreground w-36"
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim() || creatingTask}
            className="px-3 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 border-l border-border"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* Open tasks */}
        {openTasks.length > 0 ? (
          <div className="space-y-1">
            {openTasks.map(t => (
              <ProjectTaskRow
                key={t.id}
                task={t}
                onToggle={toggleTask}
                onDelete={() => deleteTask({ id: t.id })}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs font-mono text-muted-foreground/40 py-4 text-center">No open tasks.</p>
        )}

        {/* Done tasks */}
        {doneTasks.length > 0 && (
          <div className="space-y-1 opacity-40">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mt-2 mb-1">Done · {doneTasks.length}</div>
            {doneTasks.map(t => (
              <ProjectTaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={() => deleteTask({ id: t.id })} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProjectTaskRow({ task, onToggle, onDelete }: { task: Task; onToggle: (t: Task) => void; onDelete: () => void }) {
  const isCompleted = task.status === "completed" || task.status === "cancelled";
  const PRIORITY_COLOR: Record<string, string> = {
    critical: "text-red-400", high: "text-orange-400", medium: "text-foreground/70", low: "text-muted-foreground/50",
  };

  return (
    <div className={cn("group flex items-center gap-3 px-3 py-2 rounded hover:bg-white/3 transition-colors", isCompleted && "opacity-60")}>
      <button
        onClick={() => onToggle(task)}
        className={cn(
          "w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors",
          isCompleted ? "bg-primary/20 border-primary/40" : "border-border hover:border-primary/40"
        )}
      >
        {isCompleted && <Check className="w-2.5 h-2.5 text-primary" />}
      </button>
      <span className={cn("text-sm font-mono flex-1 min-w-0 truncate", isCompleted && "line-through text-muted-foreground", !isCompleted && PRIORITY_COLOR[task.priority])}>
        {task.title}
      </span>
      {task.dueDate && !isCompleted && (
        <span className={cn("text-[10px] font-mono shrink-0 flex items-center gap-1",
          isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) ? "text-red-400" : isToday(parseISO(task.dueDate)) ? "text-yellow-400" : "text-muted-foreground/50"
        )}>
          <Clock className="w-2.5 h-2.5" />
          {format(parseISO(task.dueDate), "MMM d")}
        </span>
      )}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-red-400 transition-all"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}
