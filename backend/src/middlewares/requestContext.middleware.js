import crypto from "crypto";

const safeStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return '"[unserializable]"';
  }
};

export const requestContext = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const startTime = Date.now();
  console.info(
    safeStringify({
      level: "info",
      event: "request.started",
      requestId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    })
  );

  res.on("finish", () => {
    console.info(
      safeStringify({
        level: "info",
        event: "request.completed",
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startTime,
      })
    );
  });

  next();
};

export const logError = (err, req) => {
  console.error(
    safeStringify({
      level: "error",
      event: "request.error",
      requestId: req?.requestId,
      message: err?.message,
      statusCode: err?.statusCode,
      stack: process.env.NODE_ENV === "production" ? undefined : err?.stack,
    })
  );
};
