import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { ApiError } from "./utils/ApiError.js";
import { corsOptions } from "./config/cors.config.js";
import { appPaths } from "./config/paths.config.js";
import { registerRoutes } from "./routes/registerRoutes.js";
import { sendError } from "./utils/response.js";
import { applySecurityMiddleware } from "./middlewares/security.middleware.js";
import { enforceApiAuthByDefault } from "./middlewares/auth.middleware.js";
import { logError, requestContext } from "./middlewares/requestContext.middleware.js";

dotenv.config();

const app = express();


applySecurityMiddleware(app);
app.use(requestContext);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", appPaths.views);
app.use(express.static(appPaths.public));

registerRoutes(app, enforceApiAuthByDefault);
app.use((req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`)));

app.use((err, req, res, _next) => {
  logError(err, req);
  const statusCode = err.statusCode || 500;
  return sendError(res, {
    statusCode,
    message: err.message || "Internal Server Error",
    data:
      process.env.NODE_ENV !== "production" && err.errors?.length
        ? { errors: err.errors }
        : null,
  });
});

export { app };
