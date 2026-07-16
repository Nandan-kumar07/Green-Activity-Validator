import { Router, type IRouter } from "express";
import { db, classesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { parseIdParam } from "../lib/params";

const router: IRouter = Router();

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

router.post("/classes", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number; userRole?: string };
  if (session.userRole !== "faculty" && session.userRole !== "admin") {
    res.status(403).json({ error: "Only faculty or admin can create classes" });
    return;
  }

  const { name, description, subject } = req.body;
  if (!name) { res.status(400).json({ error: "Class name required" }); return; }

  const code = generateCode();
  const [cls] = await db.insert(classesTable).values({
    name, description: description ?? null, subject: subject ?? null,
    facultyId: session.userId!, code,
  }).returning();

  res.status(201).json(cls);
});

router.get("/classes", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number; userRole?: string };
  let classes: (typeof classesTable.$inferSelect)[] = [];
  if (session.userRole === "admin") {
    classes = await db.select().from(classesTable);
  } else if (session.userRole === "faculty") {
    classes = await db.select().from(classesTable).where(eq(classesTable.facultyId, session.userId!));
  } else {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId!));
    if (user?.classId) {
      classes = await db.select().from(classesTable).where(eq(classesTable.id, user.classId));
    } else {
      classes = [];
    }
  }

  const classesWithCounts = await Promise.all(classes.map(async cls => {
    const students = await db.select().from(usersTable).where(
      and(eq(usersTable.classId, cls.id), eq(usersTable.role, "student"))
    );
    return { ...cls, studentCount: students.length };
  }));

  res.json(classesWithCounts);
});

router.post("/classes/join", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number; userRole?: string };
  if (session.userRole !== "student") {
    res.status(403).json({ error: "Only students can join classes" });
    return;
  }

  const { code } = req.body;
  if (!code) { res.status(400).json({ error: "Class code required" }); return; }

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.code, code.toUpperCase()));
  if (!cls) { res.status(404).json({ error: "Invalid class code" }); return; }

  // Check if already in a class
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId!));
  if (user?.classId) {
    res.status(400).json({ error: "You are already in a class" });
    return;
  }

  await db.update(usersTable).set({ classId: cls.id }).where(eq(usersTable.id, session.userId!));
  
  // Verify the update
  const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId!));
  
  res.json({ 
    message: "Joined class successfully", 
    class: cls,
    userClassId: updatedUser?.classId 
  });
});

router.delete("/classes/:id", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number; userRole?: string };
  if (session.userRole !== "faculty" && session.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const classId = parseIdParam(req.params.id);
  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, classId));
  if (!cls) { res.status(404).json({ error: "Class not found" }); return; }
  if (session.userRole === "faculty" && cls.facultyId !== session.userId) {
    res.status(403).json({ error: "Not your class" }); return;
  }

  await db.update(usersTable).set({ classId: null }).where(eq(usersTable.classId, classId));
  await db.delete(classesTable).where(eq(classesTable.id, classId));
  res.json({ message: "Class deleted" });
});

export default router;
