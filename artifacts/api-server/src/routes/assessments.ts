import { Router, type IRouter } from "express";
import { db, assessmentsTable, assessmentSubmissionsTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { awardPointsAndCheckBadges } from "../lib/gamification";
import { parseIdParam } from "../lib/params";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const ASSESSMENT_POINTS_PER_CORRECT = 15;

router.post("/assessments", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number; userRole?: string };
  if (session.userRole !== "faculty" && session.userRole !== "admin") {
    res.status(403).json({ error: "Only faculty or admin can create assessments" }); return;
  }

  const { title, description, type, questions, classId, dueDate, timeLimit } = req.body;
  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({ error: "Title and questions required" }); return;
  }

  // Debug logging
  logger.info({ userId: session.userId, classId, title }, "Creating assessment");

  const [assessment] = await db.insert(assessmentsTable).values({
    title, description: description ?? null, type: type ?? "online",
    questions: JSON.stringify(questions),
    createdBy: session.userId!,
    classId: classId, // Allow null for admin, but faculty should provide classId
    dueDate: dueDate ? new Date(dueDate) : null,
    timeLimit: timeLimit ?? null,
    isActive: 1,
  }).returning();

  logger.info({ assessmentId: assessment.id, classId: assessment.classId }, "Assessment created successfully");
  res.status(201).json({ ...assessment, questions });
});

router.get("/assessments", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number; userRole?: string };

  let assessments: typeof assessmentsTable.$inferSelect[];
  if (session.userRole === "admin") {
    assessments = await db.select().from(assessmentsTable).orderBy(desc(assessmentsTable.createdAt));
  } else if (session.userRole === "faculty") {
    assessments = await db.select().from(assessmentsTable)
      .where(eq(assessmentsTable.createdBy, session.userId!))
      .orderBy(desc(assessmentsTable.createdAt));
  } else {
    // Students can see all active assessments
    assessments = await db.select().from(assessmentsTable)
      .where(eq(assessmentsTable.isActive, 1))
      .orderBy(desc(assessmentsTable.createdAt));
    
    logger.info({ userId: session.userId, assessmentCount: assessments.length }, "Student fetching all active assessments");
  }

  const submittedIds = new Set<number>();
  const submissions = await db.select().from(assessmentSubmissionsTable)
    .where(eq(assessmentSubmissionsTable.userId, session.userId!));
  submissions.forEach(s => submittedIds.add(s.assessmentId));

  const result = await Promise.all(assessments.map(async a => {
    let creatorName = "";
    const [creator] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, a.createdBy));
    creatorName = creator?.name ?? "";
    return {
      ...a, questions: JSON.parse(a.questions),
      creatorName, submitted: submittedIds.has(a.id),
    };
  }));

  res.json(result);
});

router.get("/assessments/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseIdParam(req.params.id);
  const [assessment] = await db.select().from(assessmentsTable).where(eq(assessmentsTable.id, id));
  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }

  const session = req.session as { userId?: number; userRole?: string };
  
  // Students can access any active assessment
  if (session.userRole === "student" && assessment.isActive !== 1) {
    res.status(403).json({ error: "This assessment is not active" });
    return;
  }

  const [submission] = await db.select().from(assessmentSubmissionsTable)
    .where(and(eq(assessmentSubmissionsTable.assessmentId, id), eq(assessmentSubmissionsTable.userId, session.userId!)));

  res.json({ ...assessment, questions: JSON.parse(assessment.questions), submission: submission ?? null });
});

router.post("/assessments/:id/submit", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number; userRole?: string };
  const id = parseIdParam(req.params.id);

  const [assessment] = await db.select().from(assessmentsTable).where(eq(assessmentsTable.id, id));
  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }

  // Students can submit to any active assessment
  if (session.userRole === "student" && assessment.isActive !== 1) {
    res.status(403).json({ error: "This assessment is not active" });
    return;
  }

  const existing = await db.select().from(assessmentSubmissionsTable)
    .where(and(eq(assessmentSubmissionsTable.assessmentId, id), eq(assessmentSubmissionsTable.userId, session.userId!)));
  if (existing.length > 0) { res.status(409).json({ error: "Already submitted" }); return; }

  const questions: { question: string; options: string[]; answer: number }[] = JSON.parse(assessment.questions);
  const { answers } = req.body;
  if (!Array.isArray(answers)) { res.status(400).json({ error: "Answers array required" }); return; }

  let score = 0;
  answers.forEach((ans, i) => {
    if (i < questions.length && ans === questions[i].answer) score++;
  });

  const maxScore = questions.length;
  const pointsEarned = score * ASSESSMENT_POINTS_PER_CORRECT;

  const [submission] = await db.insert(assessmentSubmissionsTable).values({
    assessmentId: id, userId: session.userId!,
    answers: JSON.stringify(answers), score, maxScore,
  }).returning();

  if (pointsEarned > 0) {
    await awardPointsAndCheckBadges(session.userId!, pointsEarned, "assessment");
  }

  res.status(201).json({ submission, score, maxScore, pointsEarned, percentage: Math.round((score / maxScore) * 100) });
});

router.get("/assessments/:id/results", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number; userRole?: string };
  if (session.userRole !== "faculty" && session.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const id = parseIdParam(req.params.id);
  const submissions = await db.select().from(assessmentSubmissionsTable)
    .where(eq(assessmentSubmissionsTable.assessmentId, id))
    .orderBy(desc(assessmentSubmissionsTable.submittedAt));

  const withNames = await Promise.all(submissions.map(async s => {
    const [user] = await db.select({ name: usersTable.name, email: usersTable.email })
      .from(usersTable).where(eq(usersTable.id, s.userId));
    return { ...s, answers: JSON.parse(s.answers), studentName: user?.name, studentEmail: user?.email };
  }));

  res.json(withNames);
});

router.delete("/assessments/:id", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number; userRole?: string };
  if (session.userRole !== "faculty" && session.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const id = parseIdParam(req.params.id);
  await db.delete(assessmentSubmissionsTable).where(eq(assessmentSubmissionsTable.assessmentId, id));
  await db.delete(assessmentsTable).where(eq(assessmentsTable.id, id));
  res.json({ message: "Assessment deleted" });
});

export default router;
