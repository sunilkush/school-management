import express from 'express';
import { 
    getSchoolOverviewReport 
} from '../controllers/report.controllers.js';
const router = express.Router();

router.get('/school/:schoolId/academic-year/:academicYearId', getSchoolOverviewReport);

export default router;