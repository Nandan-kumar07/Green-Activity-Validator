import { Router, type IRouter } from "express";
import { db, activitiesTable, usersTable, userBadgesTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { AdminOverrideActivityBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/activities", requireAdmin, async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;
  const userId = req.query.userId ? parseInt(String(req.query.userId), 10) : undefined;

  const allActivities = await db.select({
    activity: activitiesTable,
    userName: usersTable.name,
  }).from(activitiesTable)
    .leftJoin(usersTable, eq(activitiesTable.userId, usersTable.id))
    .orderBy(desc(activitiesTable.createdAt));

  let filtered = allActivities;
  if (status) filtered = filtered.filter(r => r.activity.status === status);
  if (userId && !isNaN(userId)) filtered = filtered.filter(r => r.activity.userId === userId);

  const total = filtered.length;
  const paged = filtered.slice(offset, offset + limit);

  res.json({
    activities: paged.map(r => ({
      id: r.activity.id,
      userId: r.activity.userId,
      userName: r.userName ?? null,
      category: r.activity.category,
      description: r.activity.description ?? null,
      imageUrl: r.activity.imageUrl ?? null,
      status: r.activity.status,
      confidence: r.activity.confidence ?? null,
      predictedLabel: r.activity.predictedLabel ?? null,
      pointsAwarded: r.activity.pointsAwarded,
      createdAt: r.activity.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
  });
});

router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const [userCountResult] = await db.select({ count: count() }).from(usersTable);
  const allActivities = await db.select({
    activity: activitiesTable,
    userName: usersTable.name,
  }).from(activitiesTable)
    .leftJoin(usersTable, eq(activitiesTable.userId, usersTable.id))
    .orderBy(desc(activitiesTable.createdAt));

  const total = allActivities.length;
  const valid = allActivities.filter(r => r.activity.status === "valid").length;
  const invalid = allActivities.filter(r => r.activity.status === "invalid").length;
  const pending = allActivities.filter(r => r.activity.status === "pending").length;

  const totalPoints = allActivities.reduce((sum, r) => sum + r.activity.pointsAwarded, 0);

  const categoryBreakdown: Record<string, number> = {};
  for (const r of allActivities) {
    categoryBreakdown[r.activity.category] = (categoryBreakdown[r.activity.category] ?? 0) + 1;
  }

  const recentActivities = allActivities.slice(0, 10).map(r => ({
    id: r.activity.id,
    userId: r.activity.userId,
    userName: r.userName ?? null,
    category: r.activity.category,
    description: r.activity.description ?? null,
    imageUrl: r.activity.imageUrl ?? null,
    status: r.activity.status,
    confidence: r.activity.confidence ?? null,
    predictedLabel: r.activity.predictedLabel ?? null,
    pointsAwarded: r.activity.pointsAwarded,
    createdAt: r.activity.createdAt.toISOString(),
  }));

  res.json({
    totalUsers: Number(userCountResult?.count ?? 0),
    totalActivities: total,
    validActivities: valid,
    invalidActivities: invalid,
    pendingActivities: pending,
    totalPointsAwarded: totalPoints,
    categoryBreakdown,
    recentActivities,
  });
});

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;

  const allUsers = await db.select().from(usersTable).orderBy(desc(usersTable.points));
  const total = allUsers.length;
  const paged = allUsers.slice(offset, offset + limit);

  res.json({
    users: paged.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      points: u.points,
      streak: u.streak,
      createdAt: u.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
  });
});

router.patch("/admin/activities/:id/override", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid activity ID" });
    return;
  }

  const parsed = AdminOverrideActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(activitiesTable).where(eq(activitiesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  const newStatus = parsed.data.status;
  const wasValid = existing.status === "valid";
  const nowValid = newStatus === "valid";

  let pointsAwarded = existing.pointsAwarded;

  if (!wasValid && nowValid) {
    pointsAwarded = 50;
    await db.update(usersTable)
      .set({ points: db.select({ points: usersTable.points }).from(usersTable).where(eq(usersTable.id, existing.userId)) as any })
      .where(eq(usersTable.id, existing.userId));
    // Simple approach: just add points
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, existing.userId));
    if (user) {
      await db.update(usersTable).set({ points: user.points + 50 }).where(eq(usersTable.id, existing.userId));
    }
  } else if (wasValid && !nowValid) {
    // Revoke points
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, existing.userId));
    if (user) {
      await db.update(usersTable).set({ points: Math.max(0, user.points - existing.pointsAwarded) }).where(eq(usersTable.id, existing.userId));
    }
    pointsAwarded = 0;
  }

  const [updated] = await db.update(activitiesTable)
    .set({
      status: newStatus,
      pointsAwarded,
      adminNotes: parsed.data.notes ?? null,
    })
    .where(eq(activitiesTable.id, id))
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));

  res.json({
    id: updated.id,
    userId: updated.userId,
    userName: user?.name ?? null,
    category: updated.category,
    description: updated.description ?? null,
    imageUrl: updated.imageUrl ?? null,
    status: updated.status,
    confidence: updated.confidence ?? null,
    predictedLabel: updated.predictedLabel ?? null,
    pointsAwarded: updated.pointsAwarded,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
