import { ApiError } from "../utils/ApiError.js";

const validateBody = (requiredFields = []) => {
  return (req, _res, next) => {
    const missingFields = requiredFields.filter((field) => {
      const value = req.body?.[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length) {
      return next(
        new ApiError(400, `Missing required field(s): ${missingFields.join(", ")}`)
      );
    }

    next();
  };
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

export { validateBody, validateRequest };
