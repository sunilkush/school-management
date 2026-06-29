import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import mongoose from 'mongoose'
import { Exam } from '../models/Exam.model.js'
import { ExamAttempt } from '../models/ExamAttempts.model.js'
import { ExamResult } from '../models/ExamResult.model.js'
import { AdmitCard } from '../models/AdmitCard.model.js'
import { Question } from '../models/Questions.model.js'
import { StudentEnrollment } from '../models/StudentEnrollment.model.js'
import {
    assignExamToClassService,
    createExamService,
    enterMarksBulkService,
    getClassResultSummaryService,
    getExamsService,
    getExamAnalyticsService,
    getStudentResultService,
    publishResultService,
    submitFinalMarksService,
    updateMarksService,
} from '../services/exam.service.js'
import {
    exportAdmitCardsPdf,
    exportResultSheetExcel,
    exportResultSheetPdf,
} from '../utils/exportService.js'

const ensureExamAccess = (exam, user) => {
    if (!exam) throw new ApiError(404, 'Exam not found')
    if (
        user.roleId?.name !== 'Super Admin' &&
        `${exam.schoolId}` !== `${user.schoolId}`
    ) {
        throw new ApiError(403, 'Forbidden for this school exam')
    }
}

export const createExam = asyncHandler(async (req, res) => {
    const exam = await createExamService({ body: req.body, user: req.user })
    return res
        .status(201)
        .json(new ApiResponse(201, exam, 'Exam created successfully'))
})

export const getExams = asyncHandler(async (req, res) => {
    const data = await getExamsService({ query: req.query, user: req.user })
    return res
        .status(200)
        .json(new ApiResponse(200, data, 'Exams fetched successfully'))
})

export const getExamById = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id)
        .populate('schoolClassId', 'name')
        .populate('sectionId', 'name')
        .populate('subjectId', 'name')
        .populate('createdBy', 'name email')
        .lean()

    ensureExamAccess(exam, req.user)
    return res
        .status(200)
        .json(new ApiResponse(200, exam, 'Exam fetched successfully'))
})

export const getExamAnalytics = asyncHandler(async (req, res) => {
    const data = await getExamAnalyticsService({
        examId: req.params.id,
        user: req.user,
    })
    return res
        .status(200)
        .json(new ApiResponse(200, data, 'Exam analytics fetched successfully'))
})

export const updateExam = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id)
    ensureExamAccess(exam, req.user)

    const payload = {
        ...req.body,
        title: req.body.name || req.body.title,
        totalMarks:
            req.body.totalMarks !== undefined
                ? Number(req.body.totalMarks)
                : undefined,
        passingMarks:
            req.body.passingMarks !== undefined
                ? Number(req.body.passingMarks)
                : undefined,
    }

    const effectiveTotal =
        payload.totalMarks !== undefined ? payload.totalMarks : exam.totalMarks
    const effectivePassing =
        payload.passingMarks !== undefined
            ? payload.passingMarks
            : exam.passingMarks

    if (
        effectiveTotal !== undefined &&
        effectivePassing !== undefined &&
        effectivePassing > effectiveTotal
    ) {
        throw new ApiError(400, 'Passing marks cannot exceed total marks')
    }

    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined) {
            exam[key] = value
        }
    })

    await exam.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, exam.toObject(), 'Exam updated successfully')
        )
})

export const deleteExam = asyncHandler(async (req, res) => {
    const existing = await Exam.findById(req.params.id)
        .select('schoolId')
        .lean()
    ensureExamAccess(existing, req.user)

    const exam = await Exam.findByIdAndDelete(req.params.id).lean()
    return res
        .status(200)
        .json(new ApiResponse(200, exam, 'Exam deleted successfully'))
})

export const publishExam = asyncHandler(async (req, res) => {
    const status = req.body?.status || 'published'
    if (!['published', 'draft'].includes(status)) {
        throw new ApiError(400, 'status must be published or draft')
    }

    const existing = await Exam.findById(req.params.id)
        .select('schoolId')
        .lean()
    ensureExamAccess(existing, req.user)

    const exam = await Exam.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
    ).lean()

    return res
        .status(200)
        .json(new ApiResponse(200, exam, `Exam ${status} successfully`))
})

export const assignExamToClass = asyncHandler(async (req, res) => {
    const data = await assignExamToClassService({
        body: req.body,
        user: req.user,
    })
    return res
        .status(200)
        .json(new ApiResponse(200, data, 'Exam assigned to class successfully'))
})

export const enterMarksBulk = asyncHandler(async (req, res) => {
    const data = await enterMarksBulkService({ body: req.body, user: req.user })
    return res
        .status(200)
        .json(new ApiResponse(200, data, 'Marks saved successfully'))
})

export const updateMarks = asyncHandler(async (req, res) => {
    const data = await updateMarksService({
        markId: req.params.id,
        body: req.body,
        user: req.user,
    })
    return res
        .status(200)
        .json(new ApiResponse(200, data, 'Marks updated successfully'))
})

export const submitFinalMarks = asyncHandler(async (req, res) => {
    const data = await submitFinalMarksService({
        body: req.body,
        user: req.user,
    })
    return res
        .status(200)
        .json(new ApiResponse(200, data, 'Final marks submitted successfully'))
})

export const publishResult = asyncHandler(async (req, res) => {
    const data = await publishResultService({ body: req.body, user: req.user })
    return res
        .status(200)
        .json(new ApiResponse(200, data, 'Result publish state updated'))
})

export const getStudentResult = asyncHandler(async (req, res) => {
    const data = await getStudentResultService({
        query: req.query,
        user: req.user,
        studentId: req.params.studentId,
    })
    return res
        .status(200)
        .json(new ApiResponse(200, data, 'Result fetched successfully'))
})

export const getParentViewResult = asyncHandler(async (req, res) => {
    const data = await getStudentResultService({
        query: req.query,
        user: req.user,
        studentId: req.params.studentId,
    })
    return res
        .status(200)
        .json(new ApiResponse(200, data, 'Parent result fetched successfully'))
})

export const getClassResultSummary = asyncHandler(async (req, res) => {
    const data = await getClassResultSummaryService({
        query: req.query,
        user: req.user,
    })
    return res
        .status(200)
        .json(new ApiResponse(200, data, 'Class summary fetched successfully'))
})

export const startExamAttempt = asyncHandler(async (req, res) => {
    const { examId, studentId: requestedStudentId } = req.body
    if (!mongoose.Types.ObjectId.isValid(examId))
        throw new ApiError(400, 'Invalid examId')

    const exam = await Exam.findById(examId).select('settings schoolId').lean()
    if (!exam) throw new ApiError(404, 'Exam not found')

    const role = req.userRole?.name
    const isStudent = role === 'Student'
    const resolvedStudentId = isStudent ? req.user._id : requestedStudentId

    if (
        !resolvedStudentId ||
        !mongoose.Types.ObjectId.isValid(resolvedStudentId)
    ) {
        throw new ApiError(400, 'Valid studentId is required')
    }

    if (
        role !== 'Super Admin' &&
        `${exam.schoolId}` !== `${req.user.schoolId}`
    ) {
        throw new ApiError(403, 'Forbidden for this school exam')
    }

    const attempts = await ExamAttempt.countDocuments({
        examId,
        studentId: resolvedStudentId,
    })
    if (attempts >= (exam.settings?.maxAttempts || 1)) {
        throw new ApiError(400, 'Max attempts reached')
    }

    const attempt = await ExamAttempt.create({
        examId,
        studentId: resolvedStudentId,
        schoolId: exam.schoolId,
    })
    return res
        .status(201)
        .json(new ApiResponse(201, attempt, 'Exam attempt started'))
})

export const submitExamAttempt = asyncHandler(async (req, res) => {
    const { attemptId, answers = [] } = req.body
    if (!mongoose.Types.ObjectId.isValid(attemptId))
        throw new ApiError(400, 'Invalid attemptId')
    const attempt = await ExamAttempt.findById(attemptId).populate(
        'examId',
        'examType settings'
    )
    if (!attempt) throw new ApiError(404, 'Attempt not found')
    const role = req.userRole?.name
    if (role === 'Student' && `${attempt.studentId}` !== `${req.user._id}`) {
        throw new ApiError(403, "Forbidden to submit another student's attempt")
    }
    if (
        role !== 'Super Admin' &&
        `${attempt.schoolId}` !== `${req.user.schoolId}`
    ) {
        throw new ApiError(403, 'Forbidden for this school attempt')
    }

    const questionIds = answers.map((item) => item.questionId)
    const questions = await Question.find({ _id: { $in: questionIds } })
        .select('correctAnswer marks')
        .lean()
    const questionMap = new Map(questions.map((q) => [`${q._id}`, q]))

    let totalMarks = 0
    const evaluatedAnswers = answers
        .map((ans) => {
            const question = questionMap.get(`${ans.questionId}`)
            if (!question) return null

            let isCorrect = false
            let marksObtained = 0
            if (attempt.examId.examType !== 'subjective') {
                if (
                    JSON.stringify(question.correctAnswer) ===
                    JSON.stringify(ans.response)
                ) {
                    isCorrect = true
                    marksObtained = ans.marks || question.marks || 0
                } else if (
                    (attempt.examId.settings?.negativeMarking || 0) > 0
                ) {
                    marksObtained = -(
                        attempt.examId.settings?.negativeMarking || 0
                    )
                }
            }

            totalMarks += marksObtained
            return {
                questionId: ans.questionId,
                response: ans.response,
                isCorrect,
                marksObtained,
            }
        })
        .filter(Boolean)

    attempt.answers = evaluatedAnswers
    attempt.totalObtainedMarks = totalMarks
    attempt.status = 'submitted'
    attempt.endedAt = new Date()
    await attempt.save()

    return res
        .status(200)
        .json(new ApiResponse(200, attempt, 'Exam submitted successfully'))
})

export const evaluateAttempt = asyncHandler(async (req, res) => {
    const { attemptId, evaluations = [] } = req.body
    if (!mongoose.Types.ObjectId.isValid(attemptId))
        throw new ApiError(400, 'Invalid attemptId')
    const attempt = await ExamAttempt.findById(attemptId)
    if (!attempt) throw new ApiError(404, 'Attempt not found')
    if (
        req.userRole?.name !== 'Super Admin' &&
        `${attempt.schoolId}` !== `${req.user.schoolId}`
    ) {
        throw new ApiError(403, 'Forbidden for this school attempt')
    }

    let totalMarks = 0
    attempt.answers = attempt.answers.map((ans) => {
        const evalData = evaluations.find(
            (e) => e.questionId === ans.questionId.toString()
        )
        if (evalData) {
            ans.isCorrect = evalData.isCorrect ?? ans.isCorrect
            ans.marksObtained = evalData.marksObtained ?? ans.marksObtained
        }
        totalMarks += ans.marksObtained
        return ans
    })

    attempt.totalObtainedMarks = totalMarks
    attempt.status = 'evaluated'
    attempt.evaluatedBy = req.user._id
    await attempt.save()

    return res
        .status(200)
        .json(new ApiResponse(200, attempt, 'Attempt evaluated successfully'))
})

const ADMIT_CARD_INSTRUCTIONS = [
    'Carry a valid school identity card.',
    'Reach the exam hall at least 30 minutes before start time.',
    'Electronic devices are not allowed unless approved.',
]

const getStoredAdmitCards = async (examId) => AdmitCard.find({ examId })
    .sort({ seatNumber: 1, createdAt: 1 })
    .lean()

const buildAdmitCardPayloads = async (exam, userId) => {
    const enrollmentFilter = {
        schoolId: exam.schoolId,
        academicYearId: exam.academicYearId,
        schoolClassId: exam.schoolClassId?._id || exam.schoolClassId,
        status: 'Active',
    }

    if (exam.sectionId?._id || exam.sectionId) {
        enrollmentFilter.sectionId = exam.sectionId?._id || exam.sectionId
    }

    const enrollments = await StudentEnrollment.find(enrollmentFilter)
        .populate({ path: 'studentId', select: 'userId', populate: { path: 'userId', select: 'name email rollNumber' } })
        .sort({ registrationNumber: 1, createdAt: 1, _id: 1 })
        .lean()

    return enrollments
        .filter((enrollment) => enrollment.studentId?.userId?._id)
        .map((enrollment, index) => {
            const studentUser = enrollment.studentId.userId
            return {
                schoolId: exam.schoolId,
                examId: exam._id,
                examTitle: exam.title,
                examDate: exam.examDate,
                startTime: exam.startTime,
                endTime: exam.endTime,
                className: exam.schoolClassId?.name || null,
                sectionName: exam.sectionId?.name || null,
                subjectName: exam.subjectId?.name || null,
                studentId: studentUser._id,
                studentName: studentUser.name,
                rollNumber: enrollment.registrationNumber || studentUser.rollNumber || `R-${index + 1}`,
                seatNumber: `S-${index + 1}`,
                instructions: ADMIT_CARD_INSTRUCTIONS,
                generatedBy: userId,
            }
        })
}


const getExamForAdmitCards = (examId) => Exam.findById(examId)
    .populate('schoolClassId', 'name')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name')

export const getExamAdmitCards = asyncHandler(async (req, res) => {
    const exam = await getExamForAdmitCards(req.params.id).lean()
    ensureExamAccess(exam, req.user)

    const admitCards = await getStoredAdmitCards(req.params.id)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                admitCards,
                admitCards.length
                    ? 'Admit cards fetched successfully'
                    : 'Admit cards are not generated yet',
                { isGenerated: admitCards.length > 0 }
            )
        )
})

export const generateExamAdmitCards = asyncHandler(async (req, res) => {
    const exam = await getExamForAdmitCards(req.params.id).lean()
    ensureExamAccess(exam, req.user)

    const existingAdmitCards = await getStoredAdmitCards(req.params.id)
    if (existingAdmitCards.length) {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    existingAdmitCards,
                    'Admit cards already generated. Use view or download option.',
                    { isGenerated: true, alreadyGenerated: true }
                )
            )
    }

    const admitCardPayloads = await buildAdmitCardPayloads(exam, req.user._id)
    if (!admitCardPayloads.length) {
        throw new ApiError(400, 'No students found to generate admit cards')
    }

    const admitCards = await AdmitCard.insertMany(admitCardPayloads, { ordered: true })

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                admitCards,
                'Admit cards generated successfully',
                { isGenerated: true, alreadyGenerated: false }
            )
        )
})
export const getExamSeatPlan = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id).lean()
    ensureExamAccess(exam, req.user)

    const enrollmentFilter = {
        schoolId: exam.schoolId,
        academicYearId: exam.academicYearId,
        schoolClassId: exam.schoolClassId,
        status: 'Active',
    }
    if (exam.sectionId) enrollmentFilter.sectionId = exam.sectionId

    const enrollments = await StudentEnrollment.find(enrollmentFilter)
        .populate({ path: 'studentId', select: 'userId', populate: { path: 'userId', select: 'name rollNumber' } })
        .sort({ registrationNumber: 1, createdAt: 1, _id: 1 })
        .lean()

    const roomCapacity = Math.max(Number(req.query.roomCapacity) || 30, 1)
    const seatPlan = enrollments.map((enrollment, index) => {
        const roomNumber = `Room-${Math.floor(index / roomCapacity) + 1}`
        const seatNumber = `Seat-${(index % roomCapacity) + 1}`
        const studentUser = enrollment.studentId?.userId
        return {
            examId: exam._id,
            studentId: studentUser?._id,
            studentName: studentUser?.name,
            rollNumber: enrollment.registrationNumber || studentUser?.rollNumber || null,
            roomNumber,
            seatNumber,
        }
    })

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                roomCapacity,
                totalStudents: enrollments.length,
                totalRooms: Math.ceil(enrollments.length / roomCapacity),
                seatPlan,
            },
            'Seat plan generated successfully'
        )
    )
})

export const downloadAdmitCardPdf = asyncHandler(async (req, res) => {
    const exam = await getExamForAdmitCards(req.params.id).lean()
    ensureExamAccess(exam, req.user)

    const cards = await getStoredAdmitCards(req.params.id)
    if (!cards.length) {
        throw new ApiError(404, 'No admit cards found. Please generate admit cards first.')
    }

    const { studentId } = req.query
    const filtered = studentId
        ? cards.filter((c) => `${c.studentId}` === `${studentId}`)
        : cards

    if (!filtered.length) throw new ApiError(404, 'No admit card found for the specified student')

    const pdfBuffer = await exportAdmitCardsPdf(filtered, exam)
    const safeName = (exam.title || 'admit-cards').replace(/[^a-zA-Z0-9-_]/g, '-')

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}-admit-cards.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    return res.end(pdfBuffer)
})

export const downloadResultSheet = asyncHandler(async (req, res) => {
    const { examId, schoolClassId, sectionId, format = 'excel' } = req.query
    if (!examId || !schoolClassId) {
        throw new ApiError(400, 'examId and schoolClassId are required query parameters')
    }

    const exam = await Exam.findById(examId)
        .populate('schoolClassId', 'name')
        .lean()
    if (!exam) throw new ApiError(404, 'Exam not found')

    if (req.user.roleId?.name !== 'Super Admin' && `${exam.schoolId}` !== `${req.user.schoolId}`) {
        throw new ApiError(403, 'Forbidden: exam belongs to a different school')
    }

    const filter = {
        schoolId: exam.schoolId,
        examId,
        schoolClassId,
        isPublished: true,
    }
    if (sectionId) filter.sectionId = sectionId

    const results = await ExamResult.find(filter)
        .populate('studentId', 'name rollNumber')
        .sort({ rank: 1, totalObtainedMarks: -1 })
        .lean()

    if (!results.length) {
        throw new ApiError(404, 'No published results found. Publish the results first.')
    }

    const className = exam.schoolClassId?.name || ''
    const safeName = (exam.title || 'result-sheet').replace(/[^a-zA-Z0-9-_]/g, '-')

    if (format === 'pdf') {
        const pdfBuffer = await exportResultSheetPdf(results, exam, className)
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}-marksheet.pdf"`)
        res.setHeader('Content-Length', pdfBuffer.length)
        return res.end(pdfBuffer)
    }

    const xlsxBuffer = await exportResultSheetExcel(results, exam)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}-marksheet.xlsx"`)
    res.setHeader('Content-Length', xlsxBuffer.length)
    return res.end(xlsxBuffer)
})
