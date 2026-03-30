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

export { validateBody };
