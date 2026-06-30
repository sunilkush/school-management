import express from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { createVendor, deleteVendor, getVendors, toggleVendor, updateVendor } from "../controllers/vendor.controllers.js";

const router = express.Router();
const MANAGE = ["Super Admin", "School Admin", "Principal", "IT Support"];

router.use(auth);
router.get("/",           roleMiddleware([...MANAGE, "Accountant"]), getVendors);
router.post("/",          roleMiddleware(MANAGE), createVendor);
router.put("/:id",        roleMiddleware(MANAGE), updateVendor);
router.patch("/:id/toggle", roleMiddleware(MANAGE), toggleVendor);
router.delete("/:id",     roleMiddleware(MANAGE), deleteVendor);

export default router;
