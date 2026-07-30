import mongoose from "mongoose";
import Topic from "../models/Topic.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const topicPopulate = [
  { path: "chapterId", select: "name chapterNo subjectId boardClassId" },
];

const isSuperAdmin = (req) => (req.userRole?.name || req.user?.role?.name) === "Super Admin";

const assertTopicWriteAccess = (req, topic) => {
  if (isSuperAdmin(req)) return;
  if (topic.isGlobal) throw new ApiError(403, "Only Super Admin can modify global topics");
  const schoolId = req.user?.schoolId?._id || req.user?.schoolId;
  if (`${topic.schoolId}` !== `${schoolId}`) {
    throw new ApiError(403, "Forbidden access outside your school");
  }
};

const createTopic = asyncHandler(async (req, res) => {
  const {
    name,
    topicNo,
    description,
    chapterId,
    isGlobal = false,
    schoolId,
    academicYearId,
  } = req.body;

  if (!chapterId) {
    throw new ApiError(400, "chapterId is required");
  }

  const topic = await Topic.create({
    name: name.trim(),
    topicNo,
    description,
    chapterId,
    isGlobal,
    schoolId: isGlobal ? null : schoolId || req.user.schoolId || null,
    academicYearId: isGlobal ? undefined : academicYearId,
    createdByRole: req.userRole?.name || req.user?.role?.name || "School Admin",
    createdBy: req.user._id,
  });

  const populatedTopic = await Topic.findById(topic._id).populate(topicPopulate);

  return res.status(201).json(new ApiResponse(201, populatedTopic, "Topic created successfully"));
});

const getAllTopics = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.chapterId) {
    filter.chapterId = req.query.chapterId;
  }

  if (req.query.isGlobal !== undefined) {
    filter.isGlobal = req.query.isGlobal === "true";
  }

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search?.trim()) {
    filter.name = { $regex: escapeRegex(req.query.search.trim()), $options: "i" };
  }

  const topics = await Topic.find(filter)
    .sort({ topicNo: 1, createdAt: -1 })
    .populate(topicPopulate);

  return res.status(200).json(new ApiResponse(200, topics, "Topics fetched successfully"));
});

const getTopicById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid topic id");

  const topic = await Topic.findById(id).populate(topicPopulate);
  if (!topic) throw new ApiError(404, "Topic not found");

  return res.status(200).json(new ApiResponse(200, topic, "Topic fetched"));
});

const updateTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid topic id");

  const existing = await Topic.findById(id);
  if (!existing) throw new ApiError(404, "Topic not found");
  assertTopicWriteAccess(req, existing);

  const topic = await Topic.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).populate(
    topicPopulate
  );
  if (!topic) throw new ApiError(404, "Topic not found");

  return res.status(200).json(new ApiResponse(200, topic, "Topic updated"));
});

const deleteTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid topic id");

  const existing = await Topic.findById(id);
  if (!existing) throw new ApiError(404, "Topic not found");
  assertTopicWriteAccess(req, existing);

  const topic = await Topic.findByIdAndUpdate(id, { isActive: false, status: "Inactive" }, { new: true });
  if (!topic) throw new ApiError(404, "Topic not found");

  return res.status(200).json(new ApiResponse(200, null, "Topic deleted successfully"));
});

export { createTopic, getAllTopics, getTopicById, updateTopic, deleteTopic };
