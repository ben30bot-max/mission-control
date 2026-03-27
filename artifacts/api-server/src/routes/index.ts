import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentRouter from "./agent";
import tasksRouter from "./tasks";
import logsRouter from "./logs";
import memoryRouter from "./memory";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agentRouter);
router.use(tasksRouter);
router.use(logsRouter);
router.use(memoryRouter);

export default router;
