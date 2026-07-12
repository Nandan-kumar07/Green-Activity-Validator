import { Router, type IRouter } from "express";
import { db, usersTable, activitiesTable, userBadgesTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "10"), 10)));

  const users = await db.select().from(usersTable)
    .orderBy(desc(usersTable.points))
    .limit(limit);

  const leaderboard = await Promise.all(users.map(async (user, index) => {
    const [validResult] = await db.select({ count: count() })
      .from(activitiesTable)
      .where(eq(activitiesTable.userId, user.id));

    const [badgeResult] = await db.select({ count: count() })
      .from(userBadgesTable)
      .where(eq(userBadgesTable.userId, user.id));

    return {
      rank: index + 1,
      userId: user.id,
      name: user.name,
      points: user.points,
      streak: user.streak,
      validActivities: Number(validResult?.count ?? 0),
      badges: Number(badgeResult?.count ?? 0),
    };
  }));

  res.json(leaderboard);
});

export default router;
