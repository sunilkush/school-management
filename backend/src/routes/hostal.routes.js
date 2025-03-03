import { Router } from 'express'

import { auth, roleMiddleware } from '../middlewares/auth.middleware.js';

const router = Router()


router.route('/asignRoom').post(auth, roleMiddleware(["Super Admin", "Admin"]), assignRoom) // Admin can assign rooms
router
    .route('/getAllHostel')
    .get(auth, roleMiddleware(["Super Admin", "Admin"]), getAllHostelRecords) // Admin can view all hostel records
router
    .route('/my-room')
    .get(auth, roleMiddleware(['Student']), getHostelRoomForStudent) // Students can view their room
router
    .route('/asignRoomUpdated/:id')
    .put(auth, roleMiddleware(["Super Admin", "Admin"]), updateHostelRecord) // Admin can update room details
router
    .route('/asignRoomDelete/:id')
    .delete(auth, roleMiddleware(["Super Admin", "Admin"]), removeStudentFromHostel) // Admin can remove students from hostel

export default router
