
import express from "express";

import {
    createBoard,
    getBoards,
    getBoardById,
    updateBoard,
    deleteBoard,
    assignSchoolBoards,
    removeSchoolBoard
} from "../controllers/board.controllers.js";

const router = express.Router();
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const ADMIN_ROLE = ["Super Admin", "School Admin"];

// Create Board
router.post("/",auth,roleMiddleware(ADMIN_ROLE), createBoard);

// Get All Boards
router.get("/",auth,roleMiddleware(ADMIN_ROLE), getBoards);
// Get Board by ID
router.get("/:id",auth,roleMiddleware(ADMIN_ROLE), getBoardById);
// Assign school boards
router.put("/assignSchool-boards",auth,roleMiddleware(ADMIN_ROLE), assignSchoolBoards);
// Remove Assign Boards
router.put("/removeAssignSchool-boards", auth, roleMiddleware(ADMIN_ROLE), removeSchoolBoard);
// Update Board
router.put("/:id",auth,roleMiddleware(ADMIN_ROLE), updateBoard);
// Delete Board
router.delete("/:id",auth,roleMiddleware(ADMIN_ROLE), deleteBoard);


export default router;