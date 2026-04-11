import {Router} from 'express';
import {
    getBoardClasses, 
    createBoardClass, 
    getBoardClassById, 
    updateBoardClass, 
    deleteBoardClass
} from '../controllers/boardClass.controllers.js';
import {auth, roleMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const ADMIN_ROLE = ["Super Admin", "School Admin"];

// Create Board Class
router.post("/", auth, roleMiddleware(ADMIN_ROLE), createBoardClass);
// Get Board Classes
router.get("/", auth, roleMiddleware(ADMIN_ROLE), getBoardClasses);
// Get Board Class by ID
router.get("/:id", auth, roleMiddleware(ADMIN_ROLE), getBoardClassById);
// Update Board Class
router.put("/:id", auth, roleMiddleware(ADMIN_ROLE), updateBoardClass);
// Delete
router.delete("/:id", auth, roleMiddleware(ADMIN_ROLE), deleteBoardClass);

export default router;