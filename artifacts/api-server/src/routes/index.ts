import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentRouter from "./agent";
import tasksRouter from "./tasks";
import logsRouter from "./logs";
import memoryRouter from "./memory";
import projectsRouter from "./projects";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agentRouter);
router.use(tasksRouter);
router.use(logsRouter);
router.use(memoryRouter);
router.use(projectsRouter);

export default router;
