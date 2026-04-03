import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

/**
 * -----------------------------
 * BASIC HELPERS
 * -----------------------------
 */
const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isValidObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const isPositiveInt = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;

/**
 * -----------------------------
 * MAIN VALIDATOR FUNCTION
 * -----------------------------
 */
const validate = ({ body = {}, params = {}, query = {} }) => {
  return (req, _res, next) => {
    const errors = [];

    const check = (targetName, schema, data) => {
      Object.entries(schema).forEach(([field, rules]) => {
        const value = data[field];

        // Required check
        if (rules.required && (value === undefined || value === null || value === "")) {
          errors.push(`${targetName}.${field} is required`);
          return;
        }

        // Skip if not provided
        if (value === undefined || value === null || value === "") return;

        // Type validation
        switch (rules.type) {
          case "string":
            if (!isNonEmptyString(value)) {
              errors.push(`${targetName}.${field} must be a non-empty string`);
            }
            break;

          case "objectId":
            if (!isValidObjectId(value)) {
              errors.push(`${targetName}.${field} must be a valid ObjectId`);
            }
            break;

          case "positiveInt":
            if (!isPositiveInt(value)) {
              errors.push(`${targetName}.${field} must be a positive integer`);
            }
            break;

          case "boolean":
            if (typeof value !== "boolean") {
              errors.push(`${targetName}.${field} must be a boolean`);
            }
            break;

          case "array":
            if (!Array.isArray(value)) {
              errors.push(`${targetName}.${field} must be an array`);
            }
            break;

          default:
            break;
        }

        // Custom validator (optional)
        if (rules.validate && typeof rules.validate === "function") {
          const isValid = rules.validate(value);
          if (!isValid) {
            errors.push(
              rules.message || `${targetName}.${field} is invalid`
            );
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

/**
 * -----------------------------
 * QUICK SHORTCUT (BODY ONLY)
 * -----------------------------
 */
const validateBody = (schema) => validate({ body: schema });

/**
 * -----------------------------
 * ZOD BASED VALIDATION (ADVANCED)
 * -----------------------------
 */
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

  // Assign sanitized values
  req.body = parsed.data.body;
  req.query = parsed.data.query;
  req.params = parsed.data.params;

  next();
};

/**
 * -----------------------------
 * EXPORTS
 * -----------------------------
 */
export {
  validate,
  validateBody,
  validateRequest,
};