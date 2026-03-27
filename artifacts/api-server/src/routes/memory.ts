import { Router, type IRouter } from "express";
import { db, memoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateMemoryBody, DeleteMemoryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/memory", async (req, res) => {
  try {
    const items = await db.select().from(memoryTable).orderBy(memoryTable.createdAt);
    const mapped = items.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Error listing memory");
    res.status(500).json({ error: "Failed to list memory" });
  }
});

router.post("/memory", async (req, res) => {
  try {
    const body = CreateMemoryBody.parse(req.body);
    const [item] = await db.insert(memoryTable).values({
      key: body.key,
      value: body.value,
      category: body.category ?? null,
    }).returning();

    res.status(201).json({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating memory item");
    res.status(500).json({ error: "Failed to create memory item" });
  }
});

router.delete("/memory/:id", async (req, res) => {
  try {
    const params = DeleteMemoryParams.parse({ id: req.params.id });
    await db.delete(memoryTable).where(eq(memoryTable.id, params.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting memory item");
    res.status(500).json({ error: "Failed to delete memory item" });
  }
});

export default router;
