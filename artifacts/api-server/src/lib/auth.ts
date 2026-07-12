import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const session = req.session as { userId?: number; userRole?: string };
  if (!session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const session = req.session as { userId?: number; userRole?: string };
  if (!session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (session.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return;
  }
  next();
}
