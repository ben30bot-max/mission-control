import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentRouter from "./agent";
import tasksRouter from "./tasks";
import logsRouter from "./logs";
import memoryRouter from "./memory";
import projectsRouter from "./projects";
import eventsRouter from "./events";
import inboxRouter from "./inbox";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agentRouter);
router.use(tasksRouter);
router.use(logsRouter);
router.use(memoryRouter);
router.use(projectsRouter);
router.use(eventsRouter);
router.use(inboxRouter);

export default router;
