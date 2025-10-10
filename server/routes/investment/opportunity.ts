import { Router } from "express";
import * as investmentController from "@controllers/investment";
import { authenticate } from "@middlewares/auth";
import { requireAdmin, requireContractor } from "@middlewares/authorization/rbac";
import upload from "@middlewares/storage/multer";

const router = Router();

router.use(authenticate);

router.get("/statistics", requireAdmin, investmentController.getInvestmentStatistics);
router.get("/my-interests", requireContractor, investmentController.getMyInterests);

router.post(
  "/",
  requireAdmin,
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "documents", maxCount: 5 },
  ]),
  investmentController.createInvestmentOpportunity,
);

router.get("/", investmentController.getAllInvestmentOpportunities);
router.get("/:id", investmentController.getInvestmentOpportunityById);

router.put(
  "/:id",
  requireAdmin,
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "documents", maxCount: 5 },
  ]),
  investmentController.updateInvestmentOpportunity,
);

router.patch(
  "/:id/interests/:contractorId",
  requireAdmin,
  investmentController.updateInterestStatus,
);
router.post("/:id/interest", requireContractor, investmentController.expressInterest);

export default router;
