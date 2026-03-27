import React, { useState } from "react";
import { Link } from "wouter";
import {
  useGetProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@workspace/api-client-react";
import type { Project, CreateProjectRequest, UpdateProjectRequest } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  Plus, ChevronRight, AlertTriangle, Clock, Pencil,
  Trash2, X, ArrowRight,
} from "lucide-react";
import { format, isPast, isWithinInterval, addDays } from "date-fns";

// ─── Config ──────────────────────────────────────────────────────────────────

const P_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const PRI: Record<string, { label: string; cls: string }> = {
  critical: { label: "CRIT", cls: "text-red-400 border-red-400/40 bg-red-400/5" },
  high:     { label: "HIGH", cls: "text-orange-400 border-orange-400/40 bg-orange-400/5" },
  medium:   { label: "MED",  cls: "text-yellow-500/80 border-yellow-500/20 bg-yellow-500/5" },
  low:      { label: "LOW",  cls: "text-zinc-500 border-zinc-700 bg-zinc-800/20" },
};

function dueMeta(dueDate?: string | null) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isPast(d)) return { label: format(d, "MMM d"), cls: "text-red-400" };
  if (isWithinInterval(d, { start: new Date(), end: addDays(new Date(), 7) }))
    return { label: format(d, "MMM d"), cls: "text-yellow-400" };
  return { label: format(d, "MMM d"), cls: "text-zinc-500" };
}

// ─── Row components ───────────────────────────────────────────────────────────

function BlockedRow({ project, onEdit, onDelete }: { project: Project; onEdit: (p: Project) => void; onDelete: (id: number) => void }) {
  const pri = PRI[project.priority] ?? PRI.medium;
  const due = dueMeta(project.dueDate);

  return (
    <div className="group relative border-l-4 border-l-red-500/80 bg-red-950/25 hover:bg-red-950/35 rounded-r transition-colors">
      <Link href={`/projects/${project.id}`}>
        <div className="flex items-center gap-4 px-4 py-3.5 cursor-pointer">
          {/* Alert dot */}
          <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,1)] shrink-0" />

          {/* Name */}
          <span className="text-sm font-mono font-semibold text-foreground min-w-0 truncate flex-none w-56">
            {project.name}
          </span>

          {/* Owner */}
          {project.owner && (
            <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">{project.owner}</span>
          )}

          {/* Priority */}
          <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0", pri.cls)}>
            {pri.label}
          </span>

          {/* Due */}
          {due && (
            <span className={cn("text-[10px] font-mono flex items-center gap-1 shrink-0", due.cls)}>
              <Clock className="w-2.5 h-2.5" />{due.label}
            </span>
          )}

          {/* Blocker / next step */}
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-red-400/80 shrink-0" />
            <span className="text-xs font-mono text-red-300/70 truncate">
              {project.nextStep ?? "No resolution path defined"}
            </span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-red-400/40 shrink-0 transition-colors" />
        </div>
      </Link>

      {/* Actions */}
      <RowActions project={project} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function ActiveRow({ project, onEdit, onDelete }: { project: Project; onEdit: (p: Project) => void; onDelete: (id: number) => void }) {
  const pri = PRI[project.priority] ?? PRI.medium;
  const due = dueMeta(project.dueDate);

  return (
    <div className="group relative border-l-2 border-l-emerald-500/50 hover:bg-white/[0.025] rounded-r transition-colors">
      <Link href={`/projects/${project.id}`}>
        <div className="flex items-center gap-4 px-4 py-3 cursor-pointer">
          {/* Dot */}
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] shrink-0" />

          {/* Name */}
          <span className="text-sm font-mono font-medium text-foreground min-w-0 truncate flex-none w-56">
            {project.name}
          </span>

          {/* Owner */}
          {project.owner && (
            <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">{project.owner}</span>
          )}

          {/* Priority */}
          <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0", pri.cls)}>
            {pri.label}
          </span>

          {/* Due */}
          {due && (
            <span className={cn("text-[10px] font-mono flex items-center gap-1 shrink-0", due.cls)}>
              <Clock className="w-2.5 h-2.5" />{due.label}
            </span>
          )}

          {/* Next step */}
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            {project.nextStep && (
              <>
                <ChevronRight className="w-3 h-3 text-primary/40 shrink-0" />
                <span className="text-[11px] font-mono text-muted-foreground/50 truncate">
                  {project.nextStep}
                </span>
              </>
            )}
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-primary/40 shrink-0 transition-colors" />
        </div>
      </Link>

      <RowActions project={project} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function PlannedRow({ project, onEdit, onDelete }: { project: Project; onEdit: (p: Project) => void; onDelete: (id: number) => void }) {
  const pri = PRI[project.priority] ?? PRI.medium;
  const due = dueMeta(project.dueDate);

  return (
    <div className="group relative border-l-2 border-l-sky-500/25 hover:bg-white/[0.02] rounded-r transition-colors">
      <Link href={`/projects/${project.id}`}>
        <div className="flex items-center gap-4 px-4 py-2.5 cursor-pointer">
          <span className="w-2 h-2 rounded-full bg-sky-400/60 shrink-0" />

          <span className="text-sm font-mono text-foreground/70 min-w-0 truncate flex-none w-56">
            {project.name}
          </span>

          {project.owner && (
            <span className="text-[10px] font-mono text-muted-foreground/40 shrink-0">{project.owner}</span>
          )}

          <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 opacity-70", pri.cls)}>
            {pri.label}
          </span>

          {due && (
            <span className={cn("text-[10px] font-mono flex items-center gap-1 shrink-0 opacity-70", due.cls)}>
              <Clock className="w-2.5 h-2.5" />{due.label}
            </span>
          )}

          <div className="flex-1 min-w-0">
            {project.nextStep && (
              <span className="text-[11px] font-mono text-muted-foreground/35 truncate block">
                {project.nextStep}
              </span>
            )}
          </div>
        </div>
      </Link>
      <RowActions project={project} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function DimRow({ project, onEdit, onDelete }: { project: Project; onEdit: (p: Project) => void; onDelete: (id: number) => void }) {
  const due = dueMeta(project.dueDate);
  return (
    <div className="group relative hover:bg-white/[0.015] rounded transition-colors opacity-50">
      <Link href={`/projects/${project.id}`}>
        <div className="flex items-center gap-4 px-4 py-2 cursor-pointer">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
          <span className="text-sm font-mono text-muted-foreground/60 truncate flex-none w-56">{project.name}</span>
          {project.owner && <span className="text-[10px] font-mono text-muted-foreground/30 shrink-0">{project.owner}</span>}
          {due && <span className={cn("text-[10px] font-mono shrink-0", due.cls)}>{due.label}</span>}
          <div className="flex-1" />
        </div>
      </Link>
      <RowActions project={project} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function RowActions({ project, onEdit, onDelete }: { project: Project; onEdit: (p: Project) => void; onDelete: (id: number) => void }) {
  return (
    <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={e => { e.preventDefault(); onEdit(project); }}
        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
      >
        <Pencil className="w-3 h-3" />
      </button>
      <button
        onClick={e => { e.preventDefault(); onDelete(project.id); }}
        className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ text, count, danger }: { text: string; count?: number; danger?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className={cn("text-[10px] font-mono uppercase tracking-widest", danger ? "text-red-400/80" : "text-muted-foreground/50")}>
        {text}{count !== undefined && <span className="ml-1.5 opacity-60">{count}</span>}
      </span>
      <div className="flex-1 h-px bg-border/30" />
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

const BLANK = { name: "", status: "planned" as const, priority: "medium" as const, owner: "", nextStep: "", description: "", dueDate: "" };
type FormState = typeof BLANK;

function ProjectForm({ initial, onSave, onCancel, saving, title }: { initial: FormState; onSave: (d: FormState) => void; onCancel: () => void; saving: boolean; title: string }) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="border border-border/60 rounded bg-card/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">{title}</span>
        <button onClick={onCancel} className="text-muted-foreground/50 hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FieldLabel>Name</FieldLabel>
          <input value={form.name} onChange={set("name")} placeholder="Project name" className={F} />
        </div>
        <div>
          <FieldLabel>Status</FieldLabel>
          <select value={form.status} onChange={set("status")} className={F}>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="planned">Planned</option>
            <option value="on_hold">On Hold</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div>
          <FieldLabel>Priority</FieldLabel>
          <select value={form.priority} onChange={set("priority")} className={F}>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <FieldLabel>Owner</FieldLabel>
          <input value={form.owner} onChange={set("owner")} placeholder="e.g. George" className={F} />
        </div>
        <div>
          <FieldLabel>Due date</FieldLabel>
          <input type="date" value={form.dueDate} onChange={set("dueDate")} className={F} />
        </div>
        <div className="col-span-2">
          <FieldLabel>Next step</FieldLabel>
          <input value={form.nextStep} onChange={set("nextStep")} placeholder="What needs to happen next?" className={F} />
        </div>
        <div className="col-span-2">
          <FieldLabel>Description</FieldLabel>
          <textarea value={form.description} onChange={set("description")} rows={2} placeholder="Brief context..." className={cn(F, "resize-none")} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
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

const F = "w-full px-3 py-1.5 text-sm bg-background border border-border/60 rounded text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors font-mono";
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-1">{children}</label>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Projects() {
  const { data: projects, isLoading } = useGetProjects({ query: { refetchInterval: 10000 } });
  const { mutate: create, isPending: creating } = useCreateProject();
  const { mutate: update, isPending: updating } = useUpdateProject();
  const { mutate: remove } = useDeleteProject();

  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const byStatus = (status: string) =>
    (projects ?? [])
      .filter(p => p.status === status)
      .sort((a, b) => (P_ORDER[a.priority] ?? 9) - (P_ORDER[b.priority] ?? 9));

  const blocked  = byStatus("blocked");
  const active   = byStatus("active");
  const planned  = byStatus("planned");
  const onHold   = byStatus("on_hold");
  const done     = byStatus("done");

  function handleCreate(form: FormState) {
    create(
      { data: { name: form.name, status: form.status, priority: form.priority, owner: form.owner || undefined, nextStep: form.nextStep || undefined, description: form.description || undefined, dueDate: form.dueDate || undefined } },
      { onSuccess: () => setShowNew(false) }
    );
  }

  function handleUpdate(form: FormState) {
    if (!editing) return;
    update(
      { id: editing.id, data: { name: form.name, status: form.status, priority: form.priority, owner: form.owner || null, nextStep: form.nextStep || null, description: form.description || null, dueDate: form.dueDate || null } },
      { onSuccess: () => setEditing(null) }
    );
  }

  function handleDelete(id: number) {
    remove({ id });
  }

  const editForm = (p: Project) => (
    <ProjectForm
      key={p.id}
      title="Edit project"
      initial={{ name: p.name, status: p.status as FormState["status"], priority: p.priority as FormState["priority"], owner: p.owner ?? "", nextStep: p.nextStep ?? "", description: p.description ?? "", dueDate: p.dueDate ?? "" }}
      onSave={handleUpdate}
      onCancel={() => setEditing(null)}
      saving={updating}
    />
  );

  if (isLoading) return <div className="text-xs font-mono text-muted-foreground/50 pt-8">Loading...</div>;

  const totalActive  = active.length;
  const totalBlocked = blocked.length;

  return (
    <div className="space-y-7">

      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-border/40">
        <div className="flex items-baseline gap-4">
          <h1 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">Projects</h1>
          <div className="flex items-center gap-4 text-[10px] font-mono">
            {totalActive > 0 && (
              <span className="flex items-center gap-1.5 text-emerald-400/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                {totalActive} active
              </span>
            )}
            {totalBlocked > 0 && (
              <span className="flex items-center gap-1.5 text-red-400">
                <AlertTriangle className="w-3 h-3" />
                {totalBlocked} blocked
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => { setShowNew(true); setEditing(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-primary/8 text-primary border border-primary/25 rounded hover:bg-primary/15 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New project
        </button>
      </div>

      {/* New project form */}
      {showNew && !editing && (
        <ProjectForm title="New project" initial={BLANK} onSave={handleCreate} onCancel={() => setShowNew(false)} saving={creating} />
      )}

      {/* ── BLOCKED ──────────────────────────────────────── */}
      {blocked.length > 0 && (
        <section>
          <SectionLabel text="Blocked" count={blocked.length} danger />
          <div className="space-y-1">
            {blocked.map(p => editing?.id === p.id ? editForm(p) : <BlockedRow key={p.id} project={p} onEdit={setEditing} onDelete={handleDelete} />)}
          </div>
        </section>
      )}

      {/* ── ACTIVE ───────────────────────────────────────── */}
      {active.length > 0 && (
        <section>
          <SectionLabel text="Active" count={active.length} />
          <div className="space-y-px">
            {active.map(p => editing?.id === p.id ? editForm(p) : <ActiveRow key={p.id} project={p} onEdit={setEditing} onDelete={handleDelete} />)}
          </div>
        </section>
      )}

      {/* ── PLANNED ──────────────────────────────────────── */}
      {planned.length > 0 && (
        <section>
          <SectionLabel text="Planned" count={planned.length} />
          <div className="space-y-px">
            {planned.map(p => editing?.id === p.id ? editForm(p) : <PlannedRow key={p.id} project={p} onEdit={setEditing} onDelete={handleDelete} />)}
          </div>
        </section>
      )}

      {/* ── ON HOLD ──────────────────────────────────────── */}
      {onHold.length > 0 && (
        <section>
          <SectionLabel text="On hold" count={onHold.length} />
          <div className="space-y-px">
            {onHold.map(p => editing?.id === p.id ? editForm(p) : <DimRow key={p.id} project={p} onEdit={setEditing} onDelete={handleDelete} />)}
          </div>
        </section>
      )}

      {/* ── DONE ─────────────────────────────────────────── */}
      {done.length > 0 && (
        <section>
          <SectionLabel text="Done" count={done.length} />
          <div className="space-y-px">
            {done.map(p => editing?.id === p.id ? editForm(p) : <DimRow key={p.id} project={p} onEdit={setEditing} onDelete={handleDelete} />)}
          </div>
        </section>
      )}

      {(projects ?? []).length === 0 && !showNew && (
        <div className="py-20 text-center">
          <p className="text-xs font-mono text-muted-foreground/30">No projects yet.</p>
          <button onClick={() => setShowNew(true)} className="mt-3 text-xs font-mono text-primary/60 hover:text-primary transition-colors">
            Add your first project →
          </button>
        </div>
      )}
    </div>
  );
}
