import dbConnection from "./db/index.js";
import { app } from "./app.js";
import { startSubscriptionExpiryJob } from "./jobs/subscriptionExpiry.job.js";

const PORT = process.env.PORT || 9000;

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION — shutting down:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION — shutting down:", reason);
  process.exit(1);
});

dbConnection()
  .then(() => {
    startSubscriptionExpiryJob();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    });

    // Graceful shutdown on SIGTERM (Docker / cloud platforms send this)
    process.on("SIGTERM", () => {
      console.log("SIGTERM received — closing server gracefully");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });
  })
  .catch((error) => {
    console.error("DB connection failed:", error);
    process.exit(1);
  });
