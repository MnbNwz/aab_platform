import { Router } from "express";
import analyticsRoutes from "./analytics";

const router = Router();

router.use("/", analyticsRoutes);

export default router;
