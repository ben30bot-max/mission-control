import React, { useState } from "react";
import { useGetTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@workspace/api-client-react";
import type { Task, CreateTaskRequest, CreateTaskRequestPriority, UpdateTaskRequestStatus } from "@workspace/api-client-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2, Clock, CheckCircle2, Play, AlertCircle, XCircle, ListTodo } from "lucide-react";
import { format } from "date-fns";

export default function Tasks() {
  const { data: tasks, isLoading } = useGetTasks();
  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();

  const [isModalOpen, setModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<CreateTaskRequest>>({ priority: "medium" as CreateTaskRequestPriority });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;
    createTask(
      { data: newTask as CreateTaskRequest },
      { onSuccess: () => { setModalOpen(false); setNewTask({ priority: "medium" as CreateTaskRequestPriority }); } }
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-muted-foreground" />;
      case "in_progress": return <Play className="w-4 h-4 text-primary" />;
      case "completed": return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "failed": return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "cancelled": return <XCircle className="w-4 h-4 text-warning" />;
      default: return null;
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "critical": return <Badge variant="destructive">CRITICAL</Badge>;
      case "high": return <Badge variant="warning">HIGH</Badge>;
      case "medium": return <Badge variant="outline">MEDIUM</Badge>;
      case "low": return <Badge variant="secondary">LOW</Badge>;
      default: return <Badge variant="outline">{prio}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-border/50 pb-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-widest uppercase">Task Queue</h1>
          <p className="text-sm font-mono text-muted-foreground mt-2">Manage operational directives</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Directive
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading && <div className="text-primary font-mono animate-pulse p-4">Loading directives...</div>}
        
        {tasks && tasks.length === 0 && (
          <Card className="p-12 text-center border-dashed border-2 border-border/50">
            <ListTodo className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-mono text-muted-foreground">Queue is empty</p>
          </Card>
        )}

        {tasks?.map((task) => (
          <Card key={task.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/30 transition-colors">
            <div className="flex-1 flex items-start space-x-4">
              <div className="mt-1 bg-background p-2 rounded-full border border-border">
                {getStatusIcon(task.status)}
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">T-{task.id.toString().padStart(4, '0')}</span>
                  <h3 className="font-display font-semibold text-lg text-foreground tracking-wide">{task.title}</h3>
                </div>
                {task.description && <p className="text-sm text-muted-foreground font-mono mb-2 line-clamp-2">{task.description}</p>}
                <div className="flex items-center space-x-4 text-xs font-mono text-muted-foreground opacity-60">
                  <span>Created: {format(new Date(task.createdAt), 'MMM dd, HH:mm')}</span>
                  {task.completedAt && <span>Completed: {format(new Date(task.completedAt), 'MMM dd, HH:mm')}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 min-w-[140px]">
              {getPriorityBadge(task.priority)}
              
              <div className="flex items-center space-x-2">
                {task.status === "pending" && (
                  <Button variant="outline" size="sm" className="h-8" onClick={() => updateTask({ id: task.id, data: { status: "cancelled" as UpdateTaskRequestStatus } })}>
                    Cancel
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteTask({ id: task.id })}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="New Directive">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-primary mb-1 uppercase">Directive Title</label>
            <Input 
              autoFocus
              value={newTask.title || ""} 
              onChange={e => setNewTask({...newTask, title: e.target.value})} 
              placeholder="E.g., Analyze logs from sector 7"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-primary mb-1 uppercase">Parameters / Description</label>
            <Textarea 
              value={newTask.description || ""} 
              onChange={e => setNewTask({...newTask, description: e.target.value})} 
              placeholder="Additional operational details..."
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-primary mb-1 uppercase">Priority Level</label>
            <select 
              className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
              value={newTask.priority}
              onChange={e => setNewTask({...newTask, priority: e.target.value as CreateTaskRequestPriority})}
            >
              <option value="low">LOW</option>
              <option value="medium">MEDIUM</option>
              <option value="high">HIGH</option>
              <option value="critical">CRITICAL</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!newTask.title || isCreating}>
              Initialize Directive
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

