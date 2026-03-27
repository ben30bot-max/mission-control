import { Router, type IRouter } from "express";
import { db, tasksTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateTaskBody, UpdateTaskBody, UpdateTaskParams, DeleteTaskParams } from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(t: typeof tasksTable.$inferSelect) {
  return {
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    completedAt: t.completedAt?.toISOString() ?? null,
  };
}

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await db.select().from(tasksTable).orderBy(desc(tasksTable.createdAt));
    res.json(tasks.map(serialize));
  } catch (err) {
    req.log.error({ err }, "Error listing tasks");
    res.status(500).json({ error: "Failed to list tasks" });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const body = CreateTaskBody.parse(req.body);
    const [task] = await db.insert(tasksTable).values({
      title: body.title,
      description: body.description ?? null,
      priority: body.priority ?? "medium",
      status: "pending",
      dueDate: body.dueDate ?? null,
      projectId: body.projectId ?? null,
    }).returning();
    res.status(201).json(serialize(task));
  } catch (err) {
    req.log.error({ err }, "Error creating task");
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.patch("/tasks/:id", async (req, res) => {
  try {
    const params = UpdateTaskParams.parse({ id: req.params.id });
    const body = UpdateTaskBody.parse(req.body);
    type TaskUpdate = Partial<typeof tasksTable.$inferInsert> & { updatedAt: Date; completedAt?: Date };
    const update: TaskUpdate = { updatedAt: new Date() };
    if (body.title !== undefined) update.title = body.title;
    if (body.description !== undefined) update.description = body.description ?? undefined;
    if (body.status !== undefined) {
      update.status = body.status;
      if (body.status === "completed" || body.status === "failed") {
        update.completedAt = new Date();
      }
    }
    if (body.priority !== undefined) update.priority = body.priority;
    if (body.dueDate !== undefined) update.dueDate = body.dueDate ?? undefined;
    if (body.projectId !== undefined) update.projectId = body.projectId ?? undefined;

    const [updated] = await db.update(tasksTable).set(update).where(eq(tasksTable.id, params.id)).returning();
    if (!updated) { res.status(404).json({ error: "Task not found" }); return; }
    res.json(serialize(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating task");
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  try {
    const params = DeleteTaskParams.parse({ id: req.params.id });
    await db.delete(tasksTable).where(eq(tasksTable.id, params.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting task");
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
