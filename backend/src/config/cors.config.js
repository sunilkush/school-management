import { ApiError } from "../utils/ApiError.js";

const configuredOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_ORIGIN,
  process.env.CORS_ORIGIN,
  process.env.CORS_ORIGINS,
]
  .flatMap((value) => (value ? value.split(",") : []))
  .map((origin) => origin.trim())
  .filter(Boolean);

const fallbackOrigins = ["http://localhost:5173", "http://localhost:3000"];
const allowedOrigins = new Set([...fallbackOrigins, ...configuredOrigins]);
const vercelPreviewPattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

export const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin) || vercelPreviewPattern.test(origin)) {
      return callback(null, true);
    }

    return callback(new ApiError(403, `CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
};
