import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import employeesRouter from "./employees";
import schedulesRouter from "./schedules";
import documentsRouter from "./documents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(employeesRouter);
router.use(schedulesRouter);
router.use(documentsRouter);

export default router;
