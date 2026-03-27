import { Router, type IRouter } from "express";
import { db, eventsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { CreateEventBody, UpdateEventBody } from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(e: typeof eventsTable.$inferSelect) {
  return { ...e, createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString() };
}

router.get("/events", async (req, res) => {
  try {
    const { date } = req.query as { date?: string };
    let rows = await db.select().from(eventsTable).orderBy(asc(eventsTable.date), asc(eventsTable.startTime));
    if (date) rows = rows.filter(e => e.date === date);
    res.json(rows.map(serialize));
  } catch (err) {
    req.log.error({ err }, "Error listing events");
    res.status(500).json({ error: "Failed to list events" });
  }
});

router.post("/events", async (req, res) => {
  try {
    const body = CreateEventBody.parse(req.body);
    const [event] = await db.insert(eventsTable).values({
      title: body.title, date: body.date,
      startTime: body.startTime ?? null, endTime: body.endTime ?? null,
      description: body.description ?? null, location: body.location ?? null,
    }).returning();
    res.status(201).json(serialize(event));
  } catch (err) {
    req.log.error({ err }, "Error creating event");
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.patch("/events/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const body = UpdateEventBody.parse(req.body);
    type EventUpdate = Partial<typeof eventsTable.$inferInsert> & { updatedAt: Date };
    const update: EventUpdate = { updatedAt: new Date() };
    if (body.title !== undefined) update.title = body.title;
    if (body.date !== undefined) update.date = body.date;
    if (body.startTime !== undefined) update.startTime = body.startTime ?? undefined;
    if (body.endTime !== undefined) update.endTime = body.endTime ?? undefined;
    if (body.description !== undefined) update.description = body.description ?? undefined;
    if (body.location !== undefined) update.location = body.location ?? undefined;
    const [updated] = await db.update(eventsTable).set(update).where(eq(eventsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Event not found" }); return; }
    res.json(serialize(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating event");
    res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/events/:id", async (req, res) => {
  try {
    await db.delete(eventsTable).where(eq(eventsTable.id, parseInt(req.params.id, 10)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting event");
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
