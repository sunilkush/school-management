import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isValidObjectId = (value) =>
  typeof value === "string" &&
  mongoose.Types.ObjectId.isValid(value.trim());

const isPositiveInt = (value) => {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return /^\d+$/.test(trimmed) && Number(trimmed) > 0;
  }

  return false;
};

const isBooleanLike = (value) =>
  typeof value === "boolean" ||
  value === "true" ||
  value === "false";

const validate = ({ body = {}, params = {}, query = {} }) => {
  return (req, _res, next) => {
    const errors = [];

    const check = (targetName, schema, data) => {
      Object.entries(schema).forEach(([field, rules]) => {
        const value = data[field];

        if (rules.required && (value === undefined || value === null || value === "")) {
          errors.push(`${targetName}.${field} is required`);
          return;
        }

        if (value === undefined || value === null || value === "") return;

        let typeValid = true;

        switch (rules.type) {
          case "string":
            if (!isNonEmptyString(value)) {
              errors.push(`${targetName}.${field} must be a non-empty string`);
              typeValid = false;
            }
            break;

          case "objectId":
            if (!isValidObjectId(value)) {
              errors.push(`${targetName}.${field} must be a valid ObjectId`);
              typeValid = false;
            }
            break;

          case "positiveInt":
            if (!isPositiveInt(value)) {
              errors.push(`${targetName}.${field} must be a positive integer`);
              typeValid = false;
            }
            break;

          case "boolean":
            if (!isBooleanLike(value)) {
              errors.push(`${targetName}.${field} must be a boolean`);
              typeValid = false;
            }
            break;

          case "array":
            if (!Array.isArray(value)) {
              errors.push(`${targetName}.${field} must be an array`);
              typeValid = false;
            }
            break;

          default:
            break;
        }

        if (typeValid && rules.validate && typeof rules.validate === "function") {
          const isValid = rules.validate(value);
          if (!isValid) {
            errors.push(rules.message || `${targetName}.${field} is invalid`);
          }
        }
      });
    };

    check("body", body, req.body || {});
    check("params", params, req.params || {});
    check("query", query, req.query || {});

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

    const isEmptyString = typeof value === "string" && value.trim() === "";
    const isEmptyArray = Array.isArray(value) && value.length === 0;

    if (value === undefined || value === null || isEmptyString || isEmptyArray) {
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