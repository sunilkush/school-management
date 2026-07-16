import express from "express";
import {
  createTeam, getTeams, getTeamById, updateTeam, deleteTeam, addTeamMember, removeTeamMember,
  createEvent, getEvents, updateEvent,
  createAchievement, getAchievements, deleteAchievement, getMyAchievements,
} from "../controllers/sports.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

const SPORTS_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Sports Teacher"];
const gate = [auth, roleMiddleware(SPORTS_ROLES)];
const myGate = [auth, roleMiddleware(["Student", "Parent"])];

// ── Teams ──
router.post("/teams", ...gate, validate({ body: { name: { required: true, type: "string" } } }), createTeam);
router.get("/teams", ...gate, getTeams);
router.get("/teams/:id", ...gate, validate({ params: { id: { required: true, type: "objectId" } } }), getTeamById);
router.put("/teams/:id", ...gate, validate({ params: { id: { required: true, type: "objectId" } } }), updateTeam);
router.delete("/teams/:id", ...gate, validate({ params: { id: { required: true, type: "objectId" } } }), deleteTeam);
router.post(
  "/teams/:id/members",
  ...gate,
  validate({ params: { id: { required: true, type: "objectId" } }, body: { studentId: { required: true, type: "objectId" } } }),
  addTeamMember
);
router.delete(
  "/teams/:id/members/:studentId",
  ...gate,
  validate({ params: { id: { required: true, type: "objectId" }, studentId: { required: true, type: "objectId" } } }),
  removeTeamMember
);

// ── Events ──
router.post("/events", ...gate, validate({ body: { title: { required: true, type: "string" } } }), createEvent);
router.get("/events", ...gate, getEvents);
router.put("/events/:id", ...gate, validate({ params: { id: { required: true, type: "objectId" } } }), updateEvent);

// ── Achievements ──
router.post(
  "/achievements",
  ...gate,
  validate({ body: { holderType: { required: true, type: "string" }, title: { required: true, type: "string" } } }),
  createAchievement
);
router.get("/achievements", ...gate, getAchievements);
router.delete("/achievements/:id", ...gate, validate({ params: { id: { required: true, type: "objectId" } } }), deleteAchievement);

// ── Student/Parent self-service ──
router.get("/achievements/my", ...myGate, getMyAchievements);

export default router;
