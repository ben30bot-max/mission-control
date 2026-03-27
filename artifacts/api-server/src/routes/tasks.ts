import { Router, type IRouter } from "express";
import { db, tasksTable, agentTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreateTaskBody,
  UpdateTaskBody,
  UpdateTaskParams,
  DeleteTaskParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
    const mapped = tasks.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      completedAt: t.completedAt?.toISOString() ?? null,
    }));
    res.json(mapped);
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
    }).returning();

    await db
      .update(agentTable)
      .set({ taskCount: sql`${agentTable.taskCount} + 1`, updatedAt: new Date() })
      .where(eq(agentTable.state, "active"));

    res.status(201).json({
      ...task,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      completedAt: task.completedAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Error creating task");
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.patch("/tasks/:id", async (req, res) => {
  try {
    const params = UpdateTaskParams.parse({ id: req.params.id });
    const body = UpdateTaskBody.parse(req.body);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "completed" || body.status === "failed") {
        updateData.completedAt = new Date();
        if (body.status === "completed") {
          await db
            .update(agentTable)
            .set({ completedCount: sql`${agentTable.completedCount} + 1`, updatedAt: new Date() })
            .where(eq(agentTable.name, "Ben"));
        } else {
          await db
            .update(agentTable)
            .set({ errorCount: sql`${agentTable.errorCount} + 1`, updatedAt: new Date() })
            .where(eq(agentTable.name, "Ben"));
        }
      }
    }
    if (body.priority !== undefined) updateData.priority = body.priority;

    const [updated] = await db
      .update(tasksTable)
      .set(updateData as Parameters<typeof db.update>[0])
      .where(eq(tasksTable.id, params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      completedAt: updated.completedAt?.toISOString() ?? null,
    });
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
