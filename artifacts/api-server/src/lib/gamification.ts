import { db, usersTable, activitiesTable, badgesTable, userBadgesTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import { logger } from "./logger";

const BADGE_DEFINITIONS = [
  { name: "First Step", description: "Submit your first activity", icon: "🌱", requirement: "total_activities", threshold: 1 },
  { name: "Go Green", description: "Submit 5 valid activities", icon: "🌿", requirement: "valid_activities", threshold: 5 },
  { name: "Eco Warrior", description: "Submit 20 valid activities", icon: "⚔️", requirement: "valid_activities", threshold: 20 },
  { name: "Tree Hugger", description: "Plant 3 trees", icon: "🌳", requirement: "tree_planting", threshold: 3 },
  { name: "Clean Sweep", description: "Complete 3 waste cleaning activities", icon: "🧹", requirement: "waste_cleaning", threshold: 3 },
  { name: "Recycler", description: "Recycle 5 times", icon: "♻️", requirement: "recycling", threshold: 5 },
  { name: "Streak Master", description: "Maintain a 7-day streak", icon: "🔥", requirement: "streak", threshold: 7 },
  { name: "Point Collector", description: "Earn 500 points", icon: "⭐", requirement: "points", threshold: 500 },
  { name: "Champion", description: "Earn 1000 points", icon: "🏆", requirement: "points", threshold: 1000 },
];

export async function ensureBadgesExist() {
  for (const badge of BADGE_DEFINITIONS) {
    const existing = await db.select().from(badgesTable).where(eq(badgesTable.name, badge.name));
    if (existing.length === 0) {
      await db.insert(badgesTable).values(badge);
    }
  }
}

export async function awardPointsAndCheckBadges(userId: number, pointsToAdd: number, category: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return;

  const today = new Date().toISOString().split("T")[0];
  let newStreak = user.streak;

  if (user.lastActivityDate) {
    const lastDate = new Date(user.lastActivityDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const lastDateStr = lastDate.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (lastDateStr === today) {
      // Same day, no streak change
    } else if (lastDateStr === yesterdayStr) {
      newStreak = user.streak + 1;
    } else {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const newPoints = user.points + pointsToAdd;

  await db.update(usersTable)
    .set({ points: newPoints, streak: newStreak, lastActivityDate: today })
    .where(eq(usersTable.id, userId));

  await checkAndAwardBadges(userId, newPoints, newStreak, category);
}

async function checkAndAwardBadges(userId: number, points: number, streak: number, category: string) {
  const allBadges = await db.select().from(badgesTable);
  const earnedBadgeRows = await db.select({ badgeId: userBadgesTable.badgeId }).from(userBadgesTable).where(eq(userBadgesTable.userId, userId));
  const earnedIds = new Set(earnedBadgeRows.map(r => r.badgeId));

  const [totalResult] = await db.select({ count: count() }).from(activitiesTable).where(eq(activitiesTable.userId, userId));
  const [validResult] = await db.select({ count: count() }).from(activitiesTable).where(and(eq(activitiesTable.userId, userId), eq(activitiesTable.status, "valid")));
  const [catResult] = await db.select({ count: count() }).from(activitiesTable).where(and(eq(activitiesTable.userId, userId), eq(activitiesTable.category, category), eq(activitiesTable.status, "valid")));

  const totalActivities = Number(totalResult?.count ?? 0);
  const validActivities = Number(validResult?.count ?? 0);
  const categoryCount = Number(catResult?.count ?? 0);

  for (const badge of allBadges) {
    if (earnedIds.has(badge.id)) continue;

    let earned = false;
    switch (badge.requirement) {
      case "total_activities": earned = totalActivities >= badge.threshold; break;
      case "valid_activities": earned = validActivities >= badge.threshold; break;
      case "tree_planting": earned = category === "tree_planting" && categoryCount >= badge.threshold; break;
      case "waste_cleaning": earned = category === "waste_cleaning" && categoryCount >= badge.threshold; break;
      case "recycling": earned = category === "recycling" && categoryCount >= badge.threshold; break;
      case "streak": earned = streak >= badge.threshold; break;
      case "points": earned = points >= badge.threshold; break;
    }

    if (earned) {
      try {
        await db.insert(userBadgesTable).values({ userId, badgeId: badge.id });
        logger.info({ userId, badge: badge.name }, "Badge earned");
      } catch (err) {
        logger.warn({ userId, badge: badge.name, err }, "Failed to award badge");
      }
    }
  }
}
