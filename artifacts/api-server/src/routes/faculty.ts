import { Router, type IRouter } from "express";
import { db, usersTable, activitiesTable, classesTable, assessmentSubmissionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { parseIdParam } from "../lib/params";

const router: IRouter = Router();

function requireFacultyOrAdmin(req: any, res: any, next: any) {
  const session = req.session as { userRole?: string };
  if (session.userRole !== "faculty" && session.userRole !== "admin") {
    res.status(403).json({ error: "Faculty or admin access required" });
    return;
  }
  next();
}

router.get("/faculty/students", requireAuth, requireFacultyOrAdmin, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number; userRole?: string };

  let classIds: number[] = [];
  if (session.userRole === "admin") {
    const allClasses = await db.select({ id: classesTable.id }).from(classesTable);
    classIds = allClasses.map(c => c.id);
  } else {
    const myClasses = await db.select({ id: classesTable.id }).from(classesTable)
      .where(eq(classesTable.facultyId, session.userId!));
    classIds = myClasses.map(c => c.id);
  }

  const students = await db.select().from(usersTable).where(eq(usersTable.role, "student"));
  const myStudents = classIds.length > 0
    ? students.filter(s => s.classId !== null && classIds.includes(s.classId!))
    : session.userRole === "admin" ? students : [];

  const withStats = await Promise.all(myStudents.map(async s => {
    const activities = await db.select().from(activitiesTable).where(eq(activitiesTable.userId, s.id));
    const validActivities = activities.filter(a => a.status === "valid").length;
    const submissions = await db.select().from(assessmentSubmissionsTable).where(eq(assessmentSubmissionsTable.userId, s.id));
    const avgAssessmentScore = submissions.length > 0
      ? Math.round(submissions.reduce((acc, sub) => acc + (sub.score / Math.max(sub.maxScore, 1)) * 100, 0) / submissions.length)
      : null;

    let className = null;
    if (s.classId) {
      const [cls] = await db.select({ name: classesTable.name }).from(classesTable).where(eq(classesTable.id, s.classId));
      className = cls?.name ?? null;
    }

    return {
      id: s.id, name: s.name, email: s.email, points: s.points, streak: s.streak,
      classId: s.classId, className, createdAt: s.createdAt.toISOString(),
      totalActivities: activities.length, validActivities,
      totalAssessments: submissions.length, avgAssessmentScore,
    };
  }));

  res.json(withStats.sort((a, b) => b.points - a.points));
});

router.get("/faculty/students/:id", requireAuth, requireFacultyOrAdmin, async (req, res): Promise<void> => {
  const studentId = parseIdParam(req.params.id);
  const [student] = await db.select().from(usersTable).where(and(eq(usersTable.id, studentId), eq(usersTable.role, "student")));
  if (!student) { res.status(404).json({ error: "Student not found" }); return; }

  const activities = await db.select().from(activitiesTable)
    .where(eq(activitiesTable.userId, studentId))
    .orderBy(desc(activitiesTable.createdAt));

  const submissions = await db.select().from(assessmentSubmissionsTable)
    .where(eq(assessmentSubmissionsTable.userId, studentId))
    .orderBy(desc(assessmentSubmissionsTable.submittedAt));

  res.json({
    student: { id: student.id, name: student.name, email: student.email, points: student.points, streak: student.streak },
    activities: activities.map(a => ({ id: a.id, category: a.category, status: a.status, pointsAwarded: a.pointsAwarded, createdAt: a.createdAt.toISOString() })),
    assessmentSubmissions: submissions,
  });
});

router.get("/faculty/export", requireAuth, requireFacultyOrAdmin, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number; userRole?: string };

  let classIds: number[] = [];
  if (session.userRole === "admin") {
    const allClasses = await db.select({ id: classesTable.id }).from(classesTable);
    classIds = allClasses.map(c => c.id);
  } else {
    const myClasses = await db.select({ id: classesTable.id }).from(classesTable)
      .where(eq(classesTable.facultyId, session.userId!));
    classIds = myClasses.map(c => c.id);
  }

  const students = await db.select().from(usersTable).where(eq(usersTable.role, "student"));
  const myStudents = classIds.length > 0
    ? students.filter(s => s.classId !== null && classIds.includes(s.classId!))
    : session.userRole === "admin" ? students : [];

  const rows = await Promise.all(myStudents.map(async s => {
    const activities = await db.select().from(activitiesTable).where(eq(activitiesTable.userId, s.id));
    const valid = activities.filter(a => a.status === "valid").length;
    const submissions = await db.select().from(assessmentSubmissionsTable).where(eq(assessmentSubmissionsTable.userId, s.id));
    const avg = submissions.length > 0
      ? Math.round(submissions.reduce((acc, sub) => acc + (sub.score / Math.max(sub.maxScore, 1)) * 100, 0) / submissions.length)
      : 0;

    let className = "";
    if (s.classId) {
      const [cls] = await db.select({ name: classesTable.name }).from(classesTable).where(eq(classesTable.id, s.classId));
      className = cls?.name ?? "";
    }

    return `"${s.name}","${s.email}","${className}","${s.points}","${s.streak}","${activities.length}","${valid}","${submissions.length}","${avg}%","${s.createdAt.toISOString().split("T")[0]}"`;
  }));

  const csv = [
    `"Name","Email","Class","Points","Streak (days)","Total Activities","Valid Activities","Assessments Taken","Avg Assessment Score","Joined"`,
    ...rows,
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="students-${new Date().toISOString().split("T")[0]}.csv"`);
  res.send(csv);
});

router.get("/admin/classes-overview", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userRole?: string };
  if (session.userRole !== "admin") { res.status(403).json({ error: "Admin only" }); return; }

  const classes = await db.select().from(classesTable);
  const overview = await Promise.all(classes.map(async cls => {
    const [faculty] = await db.select({ name: usersTable.name, email: usersTable.email })
      .from(usersTable).where(eq(usersTable.id, cls.facultyId));
    const students = await db.select().from(usersTable).where(
      and(eq(usersTable.classId, cls.id), eq(usersTable.role, "student"))
    );
    const totalPoints = students.reduce((s, u) => s + u.points, 0);
    return {
      ...cls, facultyName: faculty?.name ?? "Unknown", facultyEmail: faculty?.email ?? "",
      studentCount: students.length, totalPoints,
      avgPoints: students.length > 0 ? Math.round(totalPoints / students.length) : 0,
    };
  }));

  res.json(overview);
});

export default router;
