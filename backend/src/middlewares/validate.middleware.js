import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const validators = {
  objectId: (value) => typeof value === "string" && mongoose.Types.ObjectId.isValid(value),
  positiveInt: (value) => Number.isInteger(Number(value)) && Number(value) > 0,
};

const validate = ({ body = {}, params = {}, query = {} }) => {
  return (req, _res, next) => {
    const errors = [];

    const checkTarget = (targetName, schema, source) => {
      Object.entries(schema).forEach(([key, rule]) => {
        const value = source[key];
        if (rule.required && (value === undefined || value === null || value === "")) {
          errors.push(`${targetName}.${key} is required`);
          return;
        }

        if (value === undefined || value === null || value === "") return;

        if (rule.type === "string" && !nonEmptyString(value)) {
          errors.push(`${targetName}.${key} must be a non-empty string`);
        }

        if (rule.type === "objectId" && !validators.objectId(value)) {
          errors.push(`${targetName}.${key} must be a valid ObjectId`);
        }

        if (rule.type === "positiveInt" && !validators.positiveInt(value)) {
          errors.push(`${targetName}.${key} must be a positive integer`);
        }

        if (rule.type === "boolean" && typeof value !== "boolean") {
          errors.push(`${targetName}.${key} must be a boolean`);
        }
      });
    };

    checkTarget("body", body, req.body || {});
    checkTarget("params", params, req.params || {});
    checkTarget("query", query, req.query || {});

    if (errors.length) {
      return next(new ApiError(400, "Validation failed", errors));
    }

    next();
  };
};

const validateBody = (requiredFields = []) => (req, _res, next) => {
  const errors = [];

  requiredFields.forEach((field) => {
    const value = req.body?.[field];
    if (value === undefined || value === null || value === "") {
      errors.push(`body.${field} is required`);
    }
  });

  if (errors.length) {
    return next(new ApiError(400, "Validation failed", errors));
  }

  next();
};

const validateRequest = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    return next(new ApiError(400, "Validation failed", errors));
  }

  req.body = parsed.data.body;
  req.query = parsed.data.query;
  req.params = parsed.data.params;
  next();
};

export { validate, validateBody, validateRequest };
