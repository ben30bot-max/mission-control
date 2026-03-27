import { Router, type IRouter } from "express";
import { db, inboxTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateInboxItemBody, UpdateInboxItemBody } from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(i: typeof inboxTable.$inferSelect) {
  return { ...i, createdAt: i.createdAt.toISOString() };
}

router.get("/inbox", async (req, res) => {
  try {
    const rows = await db.select().from(inboxTable).orderBy(desc(inboxTable.createdAt));
    res.json(rows.map(serialize));
  } catch (err) {
    req.log.error({ err }, "Error listing inbox");
    res.status(500).json({ error: "Failed to list inbox" });
  }
});

router.post("/inbox", async (req, res) => {
  try {
    const body = CreateInboxItemBody.parse(req.body);
    const [item] = await db.insert(inboxTable).values({
      content: body.content,
      processed: false,
      projectId: body.projectId ?? null,
    }).returning();
    res.status(201).json(serialize(item));
  } catch (err) {
    req.log.error({ err }, "Error creating inbox item");
    res.status(500).json({ error: "Failed to create inbox item" });
  }
});

router.patch("/inbox/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const body = UpdateInboxItemBody.parse(req.body);
    type InboxUpdate = Partial<typeof inboxTable.$inferInsert>;
    const update: InboxUpdate = {};
    if (body.processed !== undefined) update.processed = body.processed;
    if (body.projectId !== undefined) update.projectId = body.projectId ?? undefined;
    const [updated] = await db.update(inboxTable).set(update).where(eq(inboxTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Item not found" }); return; }
    res.json(serialize(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating inbox item");
    res.status(500).json({ error: "Failed to update inbox item" });
  }
});

router.delete("/inbox/:id", async (req, res) => {
  try {
    await db.delete(inboxTable).where(eq(inboxTable.id, parseInt(req.params.id, 10)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting inbox item");
    res.status(500).json({ error: "Failed to delete inbox item" });
  }
});

export default router;
