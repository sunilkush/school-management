import { Router } from 'express'

import { auth, roleMiddleware } from '../middlewares/auth.middleware.js';

const router = Router()


router.route('/asignRoom').post(auth, roleMiddleware('Admin'), assignRoom) // Admin can assign rooms
router
    .route('/getAllHostel')
    .get(auth, roleMiddleware('Admin'), getAllHostelRecords) // Admin can view all hostel records
router
    .route('/my-room')
    .get(auth, roleMiddleware('Student'), getHostelRoomForStudent) // Students can view their room
router
    .route('/asignRoomUpdated/:id')
    .put(auth, roleMiddleware('Admin'), updateHostelRecord) // Admin can update room details
router
    .route('/asignRoomDelete/:id')
    .delete(auth, roleMiddleware('Admin'), removeStudentFromHostel) // Admin can remove students from hostel

export default router
