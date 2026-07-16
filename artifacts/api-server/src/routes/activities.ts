import { Router, type IRouter } from "express";
import multer from "multer";
import { createHash } from "crypto";
import { db, activitiesTable, usersTable } from "@workspace/db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { SubmitActivityBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { classifyActivityImage } from "../lib/imageClassifier";
import { awardPointsAndCheckBadges } from "../lib/gamification";
import { logger } from "../lib/logger";
import { getPhotoTakenAt } from "../lib/photoMetadata";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const VALID_CATEGORIES = [
  "tree_planting", "waste_cleaning", "recycling", "composting", "energy_saving",
];
const POINTS_FOR_VALID = 50;
const CONFIDENCE_THRESHOLD = 0.6;

function formatActivity(activity: typeof activitiesTable.$inferSelect, userName?: string | null) {
  return {
    id: activity.id,
    userId: activity.userId,
    userName: userName ?? null,
    category: activity.category,
    description: activity.description ?? null,
    imageUrl: activity.imageUrl ?? null,
    status: activity.status,
    confidence: activity.confidence ?? null,
    predictedLabel: activity.predictedLabel ?? null,
    pointsAwarded: activity.pointsAwarded,
    createdAt: activity.createdAt.toISOString(),
  };
}

router.get("/activities/stats", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number };
  const userId = session.userId!;

  const allActivities = await db.select().from(activitiesTable)
    .where(eq(activitiesTable.userId, userId))
    .orderBy(desc(activitiesTable.createdAt));

  const total = allActivities.length;
  const valid = allActivities.filter(a => a.status === "valid").length;
  const invalid = allActivities.filter(a => a.status === "invalid").length;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  const categoryCounts: Record<string, number> = {};
  for (const activity of allActivities) {
    if (activity.status === "valid") {
      categoryCounts[activity.category] = (categoryCounts[activity.category] ?? 0) + 1;
    }
  }

  const recentActivities = allActivities.slice(0, 5).map(a => formatActivity(a, user?.name));

  res.json({
    totalActivities: total,
    validActivities: valid,
    invalidActivities: invalid,
    totalPoints: user?.points ?? 0,
    currentStreak: user?.streak ?? 0,
    categoryCounts,
    recentActivities,
  });
});

router.get("/activities", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number };
  const userId = session.userId!;

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;
  const category = req.query.category as string | undefined;
  const status = req.query.status as string | undefined;

  let query = db.select().from(activitiesTable)
    .where(eq(activitiesTable.userId, userId));

  const allUserActivities = await db.select().from(activitiesTable)
    .where(eq(activitiesTable.userId, userId))
    .orderBy(desc(activitiesTable.createdAt));

  let filtered = allUserActivities;
  if (category) filtered = filtered.filter(a => a.category === category);
  if (status) filtered = filtered.filter(a => a.status === status);

  const total = filtered.length;
  const page_activities = filtered.slice(offset, offset + limit);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.json({
    activities: page_activities.map(a => formatActivity(a, user?.name)),
    total,
    page,
    limit,
  });
});

router.post("/activities", requireAuth, upload.single("image"), async (req, res): Promise<void> => {
  const session = req.session as { userId?: number };
  const userId = session.userId!;

  const category = req.body.category as string;
  const description = req.body.description as string | undefined;

  if (!category || !VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: "Invalid or missing category" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "Image file is required" });
    return;
  }

  req.log.info({ userId, category }, "Processing activity submission");

  const imageBase64 = req.file.buffer.toString("base64");
  const mimeType = req.file.mimetype;

  // Store image as data URL (for simplicity; in production use object storage)
  const imageUrl = `data:${mimeType};base64,${imageBase64}`;

  const photoTakenAt = getPhotoTakenAt(req.file.buffer);
  const finalPhotoTime = photoTakenAt || new Date();
  
  if (!photoTakenAt) {
    // Fallback to current time if EXIF data is missing (for development/testing)
    logger.warn({ userId }, "Photo missing EXIF metadata, using current time as fallback");
  }

  // Multi-layered duplicate detection
  // 1. Hash-based detection (most reliable - detects exact duplicates) - DISABLED FOR TESTING
  const imageHash = createHash('sha256').update(req.file.buffer).digest('hex');
  // const [existingByHash] = await db.select({ id: activitiesTable.id }).from(activitiesTable)
  //   .where(eq(activitiesTable.imageUrl, `data:${mimeType};base64,${imageBase64}`))
  //   .limit(1);
  
  // if (existingByHash) {
  //   logger.warn({ userId, imageHash }, "Duplicate photo detected by hash");
  //   res.status(409).json({ error: "This photo has already been uploaded" });
  //   return;
  // }

  // 2. EXIF timestamp detection (check across all users, not just current user) - DISABLED FOR TESTING
  // if (photoTakenAt) {
  //   const [existingPhoto] = await db.select({ id: activitiesTable.id }).from(activitiesTable)
  //     .where(eq(activitiesTable.photoTakenAt, photoTakenAt))
  //     .limit(1);
  //   if (existingPhoto) {
  //     logger.warn({ userId, photoTakenAt }, "Duplicate photo detected by EXIF timestamp");
  //     res.status(409).json({ error: "A photo taken at this exact date and time has already been uploaded" });
  //     return;
  //   }
  // }

  // 3. Time-based detection (prevent rapid re-uploads within 1 minute)
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const [recentUpload] = await db.select({ id: activitiesTable.id, createdAt: activitiesTable.createdAt }).from(activitiesTable)
    .where(and(
      eq(activitiesTable.userId, userId),
      eq(activitiesTable.category, category)
    ))
    .orderBy(desc(activitiesTable.createdAt))
    .limit(1);
  
  if (recentUpload && new Date(recentUpload.createdAt) > oneMinuteAgo) {
    logger.warn({ userId, recentUploadId: recentUpload.id }, "Rapid re-upload detected");
    res.status(429).json({ error: "Please wait at least 1 minute before uploading another photo" });
    return;
  }

  const classification = await classifyActivityImage(imageBase64, mimeType, category, description, finalPhotoTime);

  const isValid = classification.isValid && classification.confidence >= CONFIDENCE_THRESHOLD;
  const status = isValid ? "valid" : "invalid";
  const pointsAwarded = isValid ? POINTS_FOR_VALID : 0;

  const [activity] = await db.insert(activitiesTable).values({
    userId,
    category,
    description: description ?? null,
    imageUrl,
    status,
    confidence: classification.confidence,
    predictedLabel: classification.predictedLabel,
    pointsAwarded,
    photoTakenAt,
  }).returning();

  if (isValid) {
    await awardPointsAndCheckBadges(userId, pointsAwarded, category);
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.status(201).json(formatActivity(activity, user?.name));
});

router.get("/activities/:id", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number };
  const userId = session.userId!;

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid activity ID" });
    return;
  }

  const [activity] = await db.select().from(activitiesTable)
    .where(and(eq(activitiesTable.id, id), eq(activitiesTable.userId, userId)));

  if (!activity) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  res.json(formatActivity(activity, user?.name));
});

export default router;
