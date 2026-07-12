import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assessmentsTable = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("online"),
  questions: text("questions").notNull(),
  createdBy: integer("created_by").notNull(),
  classId: integer("class_id"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  timeLimit: integer("time_limit"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assessmentSubmissionsTable = pgTable("assessment_submissions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  userId: integer("user_id").notNull(),
  answers: text("answers").notNull(),
  score: integer("score").notNull().default(0),
  maxScore: integer("max_score").notNull().default(0),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAssessmentSchema = createInsertSchema(assessmentsTable).omit({ id: true, createdAt: true });
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessmentsTable.$inferSelect;

export const insertAssessmentSubmissionSchema = createInsertSchema(assessmentSubmissionsTable).omit({ id: true, submittedAt: true });
export type InsertAssessmentSubmission = z.infer<typeof insertAssessmentSubmissionSchema>;
export type AssessmentSubmission = typeof assessmentSubmissionsTable.$inferSelect;
