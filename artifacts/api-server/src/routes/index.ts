import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import activitiesRouter from "./activities";
import usersRouter from "./users";
import leaderboardRouter from "./leaderboard";
import adminRouter from "./admin";
import classesRouter from "./classes";
import assessmentsRouter from "./assessments";
import chatRouter from "./chat";
import facultyRouter from "./faculty";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(activitiesRouter);
router.use(usersRouter);
router.use(leaderboardRouter);
router.use(adminRouter);
router.use(classesRouter);
router.use(assessmentsRouter);
router.use(chatRouter);
router.use(facultyRouter);

export default router;
