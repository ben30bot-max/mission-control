import { Router, type IRouter } from "express";
import { db, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateProjectBody, UpdateProjectBody } from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(p: typeof projectsTable.$inferSelect) {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/projects", async (req, res) => {
  try {
    const projects = await db.select().from(projectsTable).orderBy(projectsTable.createdAt);
    res.json(projects.map(serialize));
  } catch (err) {
    req.log.error({ err }, "Error listing projects");
    res.status(500).json({ error: "Failed to list projects" });
  }
});

router.post("/projects", async (req, res) => {
  try {
    const body = CreateProjectBody.parse(req.body);
    const [project] = await db.insert(projectsTable).values({
      name: body.name,
      status: body.status ?? "planned",
      priority: body.priority ?? "medium",
      owner: body.owner ?? null,
      nextStep: body.nextStep ?? null,
      description: body.description ?? null,
      dueDate: body.dueDate ?? null,
    }).returning();
    res.status(201).json(serialize(project));
  } catch (err) {
    req.log.error({ err }, "Error creating project");
    res.status(500).json({ error: "Failed to create project" });
  }
});

router.patch("/projects/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const body = UpdateProjectBody.parse(req.body);
    type ProjectUpdate = Partial<typeof projectsTable.$inferInsert> & { updatedAt: Date };
    const update: ProjectUpdate = { updatedAt: new Date() };
    if (body.name !== undefined) update.name = body.name;
    if (body.status !== undefined) update.status = body.status;
    if (body.priority !== undefined) update.priority = body.priority;
    if (body.owner !== undefined) update.owner = body.owner ?? undefined;
    if (body.nextStep !== undefined) update.nextStep = body.nextStep ?? undefined;
    if (body.description !== undefined) update.description = body.description ?? undefined;
    if (body.dueDate !== undefined) update.dueDate = body.dueDate ?? undefined;

    const [updated] = await db
      .update(projectsTable)
      .set(update)
      .where(eq(projectsTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "Project not found" }); return; }
    res.json(serialize(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating project");
    res.status(500).json({ error: "Failed to update project" });
  }
});

router.delete("/projects/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(projectsTable).where(eq(projectsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting project");
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
