import { Router } from "express";
import opportunityRoutes from "./opportunity";

const router = Router();

router.use("/opportunities", opportunityRoutes);

export default router;
