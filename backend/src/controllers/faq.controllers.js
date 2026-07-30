import { Faq } from "../models/Faq.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/escapeRegex.js";

/* ── CREATE ──────────────────────────────────────────────────────────────── */
export const createFaq = asyncHandler(async (req, res) => {
  const { question, answer, category, order, isPublished } = req.body;

  if (!question?.trim()) throw new ApiError(400, "Question is required");
  if (!answer?.trim()) throw new ApiError(400, "Answer is required");

  const faq = await Faq.create({
    question: question.trim(),
    answer: answer.trim(),
    category: category || "general",
    order: order ?? 0,
    isPublished: isPublished !== undefined ? isPublished : true,
    createdBy: req.user._id,
  });

  res.status(201).json(new ApiResponse(201, faq, "FAQ created successfully"));
});

/* ── GET ALL ─────────────────────────────────────────────────────────────── */
export const getFaqs = asyncHandler(async (req, res) => {
  const { category, search, isPublished } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { question: { $regex: safeSearch, $options: "i" } },
      { answer: { $regex: safeSearch, $options: "i" } },
    ];
  }
  if (isPublished !== undefined) filter.isPublished = isPublished === "true";

  const faqs = await Faq.find(filter)
    .populate("createdBy", "name")
    .sort({ category: 1, order: 1, createdAt: -1 });

  res.status(200).json(new ApiResponse(200, faqs, "FAQs fetched successfully"));
});

/* ── GET BY ID ───────────────────────────────────────────────────────────── */
export const getFaqById = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) throw new ApiError(404, "FAQ not found");
  res.status(200).json(new ApiResponse(200, faq, "FAQ fetched"));
});

/* ── UPDATE ──────────────────────────────────────────────────────────────── */
export const updateFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) throw new ApiError(404, "FAQ not found");

  const { question, answer, category, order, isPublished } = req.body;
  if (question) faq.question = question.trim();
  if (answer) faq.answer = answer.trim();
  if (category) faq.category = category;
  if (order !== undefined) faq.order = order;
  if (isPublished !== undefined) faq.isPublished = isPublished;
  faq.updatedBy = req.user._id;

  await faq.save();
  res.status(200).json(new ApiResponse(200, faq, "FAQ updated successfully"));
});

/* ── DELETE ──────────────────────────────────────────────────────────────── */
export const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) throw new ApiError(404, "FAQ not found");
  await faq.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "FAQ deleted successfully"));
});
