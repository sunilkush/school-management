
import { School } from '../models/school.model.js';
import { User } from '../models/user.model.js';
import { LoginLog } from '../models/LoginLog.model.js';
import{ AcademicYear } from '../models/AcademicYear.model.js';
// @desc    Create a login log
// @route   POST /api/login-log
exports.createLoginLog = async (req, res) => {
  try {
    const log = await LoginLog.create(req.body);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all login logs with filters
// @route   GET /api/login-log
exports.getLoginLogs = async (req, res) => {
  try {
    const {
      schoolId,
      academicYearId,
      userRole,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (schoolId) query.schoolId = schoolId;
    if (academicYearId) query.academicYearId = academicYearId;
    if (userRole) query.userRole = userRole;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.loginTime = {};
      if (startDate) query.loginTime.$gte = new Date(startDate);
      if (endDate) query.loginTime.$lte = new Date(endDate);
    }

    const total = await LoginLog.countDocuments(query);

    const logs = await LoginLog.find(query)
      .populate('userId', 'name email')
      .populate('schoolId', 'name')
      .populate('academicYearId', 'name')
      .sort({ loginTime: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: logs,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update logout time (e.g. on logout)
// @route   PUT /api/login-log/:id/logout
exports.setLogoutTime = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedLog = await LoginLog.findByIdAndUpdate(
      id,
      { logoutTime: new Date() },
      { new: true }
    );

    if (!updatedLog) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }

    res.status(200).json({ success: true, data: updatedLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get aggregated login stats (e.g. for charts)
// @route   GET /api/login-log/stats
exports.getLoginStats = async (req, res) => {
  try {
    const { academicYearId, schoolId } = req.query;

    const match = {};
    if (academicYearId) match.academicYearId = academicYearId;
    if (schoolId) match.schoolId = schoolId;

    const stats = await LoginLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$userRole',
          totalLogins: { $sum: 1 },
          successfulLogins: {
            $sum: {
              $cond: [{ $eq: ['$status', 'success'] }, 1, 0]
            }
          },
          failedLogins: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { totalLogins: -1 } }
    ]);

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
