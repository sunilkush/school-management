import helmet from "helmet";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";

/**
 * Off under NODE_ENV=test, and only there.
 *
 * A test run drives thousands of requests from one address in a few minutes, which is exactly what
 * this limiter exists to stop. Left on, it starts answering 429 partway through and every
 * assertion after that point is really only checking that the limiter works — a suite can go green
 * while testing almost nothing, which is worse than a red one.
 *
 * Keyed to NODE_ENV rather than a flag of its own: turning this off in production would take
 * setting NODE_ENV=test there, which breaks enough other things to be noticed immediately.
 */
const isTestRun = () => process.env.NODE_ENV === "test";

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 800,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestRun,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    data: null,
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: isTestRun,
  message: {
    success: false,
    message: "Too many login attempts. Please retry later.",
    data: null,
  },
});

export const applySecurityMiddleware = (app) => {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      hsts: {
        maxAge: 31536000,       // 1 year
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      permittedCrossDomainPolicies: false,
      xContentTypeOptions: true,
      xFrameOptions: { action: "deny" },
    })
  );
  app.use(globalRateLimiter);
  app.use(xss());
  app.use(mongoSanitize());
};
