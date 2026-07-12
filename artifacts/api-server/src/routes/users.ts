import { Router, type IRouter } from "express";
import { db, usersTable, activitiesTable, badgesTable, userBadgesTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/users/profile", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number };
  const userId = session.userId!;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const allActivities = await db.select().from(activitiesTable)
    .where(eq(activitiesTable.userId, userId))
    .orderBy(desc(activitiesTable.createdAt));

  const total = allActivities.length;
  const valid = allActivities.filter(a => a.status === "valid").length;
  const invalid = allActivities.filter(a => a.status === "invalid").length;

  const categoryCounts: Record<string, number> = {};
  for (const activity of allActivities) {
    if (activity.status === "valid") {
      categoryCounts[activity.category] = (categoryCounts[activity.category] ?? 0) + 1;
    }
  }

  const recentActivities = allActivities.slice(0, 5).map(a => ({
    id: a.id,
    userId: a.userId,
    userName: user.name,
    category: a.category,
    description: a.description ?? null,
    imageUrl: a.imageUrl ?? null,
    status: a.status,
    confidence: a.confidence ?? null,
    predictedLabel: a.predictedLabel ?? null,
    pointsAwarded: a.pointsAwarded,
    createdAt: a.createdAt.toISOString(),
  }));

  const allBadges = await db.select().from(badgesTable);
  const earnedBadges = await db.select().from(userBadgesTable).where(eq(userBadgesTable.userId, userId));
  const earnedMap = new Map(earnedBadges.map(ub => [ub.badgeId, ub.earnedAt]));

  const badges = allBadges.map(b => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    earned: earnedMap.has(b.id),
    earnedAt: earnedMap.has(b.id) ? earnedMap.get(b.id)!.toISOString() : null,
  }));

  // Get user rank
  const allUsers = await db.select({ id: usersTable.id, points: usersTable.points })
    .from(usersTable)
    .orderBy(desc(usersTable.points));
  const rankIndex = allUsers.findIndex(u => u.id === userId);
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      points: user.points,
      streak: user.streak,
      createdAt: user.createdAt.toISOString(),
    },
    badges,
    stats: {
      totalActivities: total,
      validActivities: valid,
      invalidActivities: invalid,
      totalPoints: user.points,
      currentStreak: user.streak,
      categoryCounts,
      recentActivities,
    },
    rank,
  });
});

router.get("/users/badges", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number };
  const userId = session.userId!;

  const allBadges = await db.select().from(badgesTable);
  const earnedBadges = await db.select().from(userBadgesTable).where(eq(userBadgesTable.userId, userId));
  const earnedMap = new Map(earnedBadges.map(ub => [ub.badgeId, ub.earnedAt]));

  const badges = allBadges.map(b => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    earned: earnedMap.has(b.id),
    earnedAt: earnedMap.has(b.id) ? earnedMap.get(b.id)!.toISOString() : null,
  }));

  res.json(badges);
});

export default router;
