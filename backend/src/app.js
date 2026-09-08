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
import { autoAudit } from "./middlewares/autoAudit.middleware.js";
import { checkIpRestriction } from "./middlewares/ipRestriction.middleware.js";

dotenv.config();

const app = express();


applySecurityMiddleware(app);
app.use(requestContext);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
// Gateway webhooks (webhook.routes.js) verify an HMAC signature over the exact raw request
// body bytes — re-serializing the already-parsed req.body with JSON.stringify is not
// guaranteed to byte-for-byte match what the gateway actually sent and signed (key ordering,
// whitespace), so the verify callback stashes the untouched raw buffer here for that one route
// to use. Every other route keeps using req.body as normal; this is purely additive.
app.use(express.json({ limit: "1mb", verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", appPaths.views);
app.use(express.static(appPaths.public));

// Auto-audit all mutations (POST/PUT/PATCH/DELETE) after auth
app.use("/api/v1", autoAudit);
// IP restriction check (fires after auth hydrates req.user)
app.use("/api/v1", checkIpRestriction);

registerRoutes(app, enforceApiAuthByDefault);
app.use((req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`)));

/**
 * Turns the database's complaints about bad input into answers a caller can act on.
 *
 * Without this, a value a controller did not think to check — a category outside the enum, a
 * malformed id, a duplicate code — reaches Mongoose, throws, and comes back as 500 Internal Server
 * Error. That is wrong twice over: it tells the user the server broke when in fact their input was
 * rejected, and it hides the one sentence that would let them fix it. It also makes a genuine
 * server fault indistinguishable from a typo in a form.
 *
 * Only the three shapes that always mean "the caller sent something invalid" are translated.
 * Anything else keeps its status, so a real fault still reads as one.
 */
const asClientError = (err) => {
  if (err?.name === "ValidationError" && err.errors) {
    const messages = Object.values(err.errors).map((e) => {
      if (e.kind === "enum" && e.properties?.enumValues) {
        return `${e.path}: "${e.value}" is not allowed — use one of ${e.properties.enumValues.join(", ")}`;
      }
      if (e.kind === "required") return `${e.path} is required`;
      return e.message;
    });
    return { statusCode: 400, message: messages.join("; ") };
  }

  if (err?.name === "CastError") {
    return { statusCode: 400, message: `${err.path} is not a valid ${err.kind === "ObjectId" ? "id" : err.kind}` };
  }

  if (err?.code === 11000) {
    const fields = Object.keys(err.keyPattern || err.keyValue || {}).join(", ");
    return { statusCode: 409, message: fields ? `A record with that ${fields} already exists` : "That record already exists" };
  }

  return null;
};

app.use((err, req, res, _next) => {
  logError(err, req);
  const translated = err.statusCode ? null : asClientError(err);
  const statusCode = translated?.statusCode || err.statusCode || 500;
  return sendError(res, {
    statusCode,
    message: translated?.message || err.message || "Internal Server Error",
    data:
      process.env.NODE_ENV !== "production" && err.errors?.length
        ? { errors: err.errors }
        : null,
  });
});

export { app };
