import React, { useState } from "react";
import {
  useGetProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@workspace/api-client-react";
import type { Project, CreateProjectRequest, UpdateProjectRequest } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Plus, ChevronRight, AlertTriangle, Circle, CheckCircle2, Clock, PauseCircle, Zap, Pencil, Trash2, X } from "lucide-react";
import { format, isPast, isWithinInterval, addDays } from "date-fns";

const STATUS_ORDER = ["active", "blocked", "planned", "on_hold", "done"];

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.FC<{ className?: string }>;
  row: string;
  badge: string;
  dot: string;
}> = {
  active:  { label: "Active",   icon: Zap,         row: "border-l-2 border-l-emerald-500/60 bg-card/60 hover:bg-card/90",   badge: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30", dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" },
  blocked: { label: "Blocked",  icon: AlertTriangle, row: "border-l-2 border-l-red-500/70 bg-red-500/5 hover:bg-red-500/8",    badge: "text-red-400 bg-red-400/10 border-red-400/30",             dot: "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.8)]" },
  planned: { label: "Planned",  icon: Circle,       row: "border-l-2 border-l-sky-500/40 bg-card/40 hover:bg-card/70",        badge: "text-sky-400 bg-sky-400/10 border-sky-400/30",             dot: "bg-sky-400" },
  on_hold: { label: "On Hold",  icon: PauseCircle,  row: "border-l-2 border-l-zinc-600 bg-card/20 hover:bg-card/50 opacity-70", badge: "text-zinc-400 bg-zinc-400/10 border-zinc-600",            dot: "bg-zinc-500" },
  done:    { label: "Done",     icon: CheckCircle2, row: "border-l-2 border-l-zinc-700 bg-card/10 hover:bg-card/30 opacity-50", badge: "text-zinc-500 bg-zinc-700/20 border-zinc-700",            dot: "bg-zinc-600" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: "CRIT", color: "text-red-400 border-red-400/40 bg-red-400/5" },
  high:     { label: "HIGH", color: "text-orange-400 border-orange-400/40 bg-orange-400/5" },
  medium:   { label: "MED",  color: "text-yellow-400 border-yellow-400/40 bg-yellow-400/5" },
  low:      { label: "LOW",  color: "text-zinc-500 border-zinc-600 bg-zinc-800/30" },
};

function dueDateStyle(dueDate?: string | null) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isPast(d)) return { label: format(d, "MMM d"), cls: "text-red-400" };
  if (isWithinInterval(d, { start: new Date(), end: addDays(new Date(), 7) }))
    return { label: format(d, "MMM d"), cls: "text-yellow-400" };
  return { label: format(d, "MMM d"), cls: "text-zinc-500" };
}

type StatusKey = keyof typeof STATUS_CONFIG;
type PriorityKey = keyof typeof PRIORITY_CONFIG;

function ProjectRow({ project, onEdit, onDelete }: { project: Project; onEdit: (p: Project) => void; onDelete: (id: number) => void }) {
  const cfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.planned;
  const pri = PRIORITY_CONFIG[project.priority] ?? PRIORITY_CONFIG.medium;
  const due = dueDateStyle(project.dueDate);

  return (
    <div className={cn("group flex items-start gap-4 px-4 py-3.5 rounded transition-all cursor-default", cfg.row)}>
      {/* Status dot */}
      <div className="mt-1.5 shrink-0">
        <span className={cn("block w-2 h-2 rounded-full", cfg.dot)} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-x-6 gap-y-0.5">
        {/* Row 1: name + priority + due */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-medium text-sm text-foreground truncate">{project.name}</span>
          <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0", pri.color)}>
            {pri.label}
          </span>
          {due && (
            <span className={cn("text-[10px] font-mono shrink-0 flex items-center gap-1", due.cls)}>
              <Clock className="w-3 h-3" />{due.label}
            </span>
          )}
        </div>

        {/* Row 1 right: owner + status badge */}
        <div className="flex items-center gap-2 shrink-0">
          {project.owner && (
            <span className="text-xs font-mono text-muted-foreground">{project.owner}</span>
          )}
          <span className={cn("text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border", cfg.badge)}>
            {cfg.label}
          </span>
        </div>

        {/* Row 2: description */}
        {project.description && (
          <p className="text-xs text-muted-foreground truncate col-span-2 mt-0.5">{project.description}</p>
        )}

        {/* Row 3: next step */}
        {project.nextStep && (
          <div className="flex items-start gap-1.5 col-span-2 mt-1.5">
            <ChevronRight className="w-3 h-3 text-primary/50 mt-0.5 shrink-0" />
            <span className="text-xs text-primary/80 font-mono">{project.nextStep}</span>
          </div>
        )}
      </div>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
        <button onClick={() => onEdit(project)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(project.id)} className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

const BLANK: Omit<CreateProjectRequest, "name"> & { name: string } = {
  name: "", status: "planned", priority: "medium",
  owner: "", nextStep: "", description: "", dueDate: "",
};

function ProjectForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: typeof BLANK;
  onSave: (data: typeof BLANK) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="rounded border border-border bg-card/60 p-5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {initial.name ? "Edit project" : "New project"}
        </span>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Name *</label>
          <input value={form.name} onChange={set("name")} placeholder="Project name" className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Status</label>
          <select value={form.status} onChange={set("status")} className={inputCls}>
            <option value="active">Active</option>
            <option value="planned">Planned</option>
            <option value="blocked">Blocked</option>
            <option value="on_hold">On Hold</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Priority</label>
          <select value={form.priority} onChange={set("priority")} className={inputCls}>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Owner</label>
          <input value={form.owner ?? ""} onChange={set("owner")} placeholder="e.g. George" className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Due date</label>
          <input type="date" value={form.dueDate ?? ""} onChange={set("dueDate")} className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Description</label>
          <textarea value={form.description ?? ""} onChange={set("description")} rows={2} placeholder="Short context..." className={cn(inputCls, "resize-none")} />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Next step</label>
          <input value={form.nextStep ?? ""} onChange={set("nextStep")} placeholder="What needs to happen next?" className={inputCls} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.name.trim() || saving}
          className="px-4 py-1.5 text-xs font-mono bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 transition-colors disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-1.5 text-sm bg-background border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono";

export default function Projects() {
  const { data: projects, isLoading } = useGetProjects({ query: { refetchInterval: 10000 } });
  const { mutate: create, isPending: creating } = useCreateProject();
  const { mutate: update, isPending: updating } = useUpdateProject();
  const { mutate: remove } = useDeleteProject();

  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const grouped = STATUS_ORDER.reduce<Record<string, Project[]>>((acc, status) => {
    acc[status] = (projects ?? []).filter(p => p.status === status);
    return acc;
  }, {});

  const activePlusBlocked = [...(grouped.active ?? []), ...(grouped.blocked ?? [])];
  const otherStatuses = STATUS_ORDER.filter(s => s !== "active" && s !== "blocked");

  function handleCreate(form: typeof BLANK) {
    create(
      { data: { name: form.name, status: form.status as CreateProjectRequest["status"], priority: form.priority as CreateProjectRequest["priority"], owner: form.owner || undefined, nextStep: form.nextStep || undefined, description: form.description || undefined, dueDate: form.dueDate || undefined } },
      { onSuccess: () => setShowNew(false) }
    );
  }

  function handleUpdate(form: typeof BLANK) {
    if (!editing) return;
    update(
      { id: editing.id, data: { name: form.name, status: form.status as UpdateProjectRequest["status"], priority: form.priority as UpdateProjectRequest["priority"], owner: form.owner || null, nextStep: form.nextStep || null, description: form.description || null, dueDate: form.dueDate || null } },
      { onSuccess: () => setEditing(null) }
    );
  }

  function handleDelete(id: number) {
    remove({ id });
  }

  if (isLoading) {
    return <div className="text-xs font-mono text-muted-foreground animate-pulse px-4 pt-8">Loading projects...</div>;
  }

  const totalActive = grouped.active?.length ?? 0;
  const totalBlocked = grouped.blocked?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-mono font-bold uppercase tracking-widest text-foreground">Projects</h1>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            {totalActive} active · {totalBlocked > 0 ? <span className="text-red-400">{totalBlocked} blocked</span> : "0 blocked"}
          </p>
        </div>
        <button
          onClick={() => { setShowNew(true); setEditing(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New project
        </button>
      </div>

      {/* New project form */}
      {showNew && !editing && (
        <ProjectForm initial={BLANK} onSave={handleCreate} onCancel={() => setShowNew(false)} saving={creating} />
      )}

      {/* Active + Blocked — top priority group */}
      {activePlusBlocked.length > 0 && (
        <section>
          <SectionDivider label="Requires attention" />
          <div className="space-y-1.5 mt-3">
            {activePlusBlocked
              .sort((a, b) => {
                const sA = a.status === "blocked" ? 0 : 1;
                const sB = b.status === "blocked" ? 0 : 1;
                if (sA !== sB) return sA - sB;
                const pOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                return (pOrder[a.priority] ?? 9) - (pOrder[b.priority] ?? 9);
              })
              .map(p => (
                editing?.id === p.id ? (
                  <ProjectForm
                    key={p.id}
                    initial={{ name: p.name, status: p.status, priority: p.priority, owner: p.owner ?? "", nextStep: p.nextStep ?? "", description: p.description ?? "", dueDate: p.dueDate ?? "" }}
                    onSave={handleUpdate}
                    onCancel={() => setEditing(null)}
                    saving={updating}
                  />
                ) : (
                  <ProjectRow key={p.id} project={p} onEdit={setEditing} onDelete={handleDelete} />
                )
              ))}
          </div>
        </section>
      )}

      {/* Planned / On Hold / Done */}
      {otherStatuses.map(status => {
        const items = grouped[status] ?? [];
        if (items.length === 0) return null;
        const cfg = STATUS_CONFIG[status]!;
        return (
          <section key={status}>
            <SectionDivider label={cfg.label} count={items.length} />
            <div className="space-y-1.5 mt-3">
              {items
                .sort((a, b) => {
                  const pOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                  return (pOrder[a.priority] ?? 9) - (pOrder[b.priority] ?? 9);
                })
                .map(p => (
                  editing?.id === p.id ? (
                    <ProjectForm
                      key={p.id}
                      initial={{ name: p.name, status: p.status, priority: p.priority, owner: p.owner ?? "", nextStep: p.nextStep ?? "", description: p.description ?? "", dueDate: p.dueDate ?? "" }}
                      onSave={handleUpdate}
                      onCancel={() => setEditing(null)}
                      saving={updating}
                    />
                  ) : (
                    <ProjectRow key={p.id} project={p} onEdit={setEditing} onDelete={handleDelete} />
                  )
                ))}
            </div>
          </section>
        );
      })}

      {(projects ?? []).length === 0 && !showNew && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-xs font-mono text-muted-foreground">No projects yet.</p>
          <button onClick={() => setShowNew(true)} className="mt-3 text-xs font-mono text-primary hover:underline">
            Add your first project →
          </button>
        </div>
      )}
    </div>
  );
}

function SectionDivider({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] font-mono text-muted-foreground/50">{count}</span>
      )}
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}
