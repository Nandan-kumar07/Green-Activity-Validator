import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { ensureBadgesExist } from "../lib/gamification";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "../lib/session";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, role } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userRole = role === "admin" ? "admin" : role === "faculty" ? "faculty" : "student";

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash,
    role: userRole,
  }).returning();

  await ensureBadgesExist();

  const session = req.session as { userId?: number; userRole?: string };
  session.userId = user.id;
  session.userRole = user.role;

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      points: user.points,
      streak: user.streak,
      createdAt: user.createdAt.toISOString(),
    },
    message: "Registration successful",
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(400).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Invalid email or password" });
    return;
  }

  await ensureBadgesExist();

  const session = req.session as { userId?: number; userRole?: string };
  session.userId = user.id;
  session.userRole = user.role;

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
    message: "Login successful",
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to logout" });
      return;
    }

    res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const session = req.session as { userId?: number };
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId!));

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    points: user.points,
    streak: user.streak,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
