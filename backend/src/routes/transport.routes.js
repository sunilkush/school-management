import express from "express";
import {
  createRoute,
  createVehicle,
  deleteRoute,
  deleteVehicle,
  getRoutes,
  getVehicles,
  updateRoute,
  updateVehicle,
} from "../controllers/transport.controllers.js";

const router = express.Router();

router.get("/vehicles", getVehicles);
router.post("/vehicles", createVehicle);
router.put("/vehicles/:id", updateVehicle);
router.delete("/vehicles/:id", deleteVehicle);

router.get("/routes", getRoutes);
router.post("/routes", createRoute);
router.put("/routes/:id", updateRoute);
router.delete("/routes/:id", deleteRoute);

export default router;
