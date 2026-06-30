import express from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { addServiceLog, createAMC, deleteAMC, getAMCs, updateAMC } from "../controllers/amcTracking.controllers.js";

const router = express.Router();
const MANAGE = ["Super Admin", "School Admin", "Principal", "IT Support"];

router.use(auth);
router.get("/",                roleMiddleware([...MANAGE, "Accountant"]), getAMCs);
router.post("/",               roleMiddleware(MANAGE), createAMC);
router.put("/:id",             roleMiddleware(MANAGE), updateAMC);
router.post("/:id/service-log", roleMiddleware(MANAGE), addServiceLog);
router.delete("/:id",          roleMiddleware(MANAGE), deleteAMC);

export default router;
