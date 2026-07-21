// Historically the connection string was built as `${MONGOOSE_URI}/${DB_NAME}`, but
// MONGOOSE_URI already ends in `/?retryWrites=...`, so that produced a malformed URI and
// mongoose silently fell back to its default database — "test" — instead of this name. All
// real data was migrated from "test" to "school_management" to match. See dbConnection() in
// db/index.js for the (now-correct, dbName-option-based) connect call.
export const DB_NAME = "school_management";
