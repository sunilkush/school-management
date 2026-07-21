import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";
import dotenv from "dotenv"
dotenv.config();

// Drops a specific named index if it's still present with the given (old) options, then lets
// syncIndexes() build whatever the model's current schema actually defines. Mongoose never
// drops/renames an index in MongoDB just because the schema definition changed — a stale index
// from an older schema keeps enforcing itself until something explicitly does this.
const repairIndex = async ({ modelPath, exportName, staleIndexName, matches, note }) => {
    try {
        const mod = await import(modelPath);
        const Model = mod[exportName];
        const existing = await Model.collection.indexes();
        const stale = existing.find((idx) => idx.name === staleIndexName && matches(idx));
        if (stale) {
            await Model.collection.dropIndex(staleIndexName);
            console.log(`[db] Dropped stale index ${Model.collection.collectionName}.${staleIndexName} — ${note}`);
        }
        await Model.syncIndexes();
    } catch (error) {
        console.log(`[db] Index repair skipped for ${exportName}: ${error.message}`);
    }
};

// One-off index repairs, run once per boot. Each of these compound indexes was declared
// `sparse` (or, for Role, not even that) to make one field optional-but-unique-when-set — but
// a `sparse` COMPOUND index only skips a document when *every* indexed field is missing, and
// the other field in each pair here (schoolId) is always present. So none of these ever
// actually excluded documents missing the optional field; two such documents in the same
// school collided as a duplicate (schoolId, null) pair. Fixed with a partial index instead,
// which is what "optional but unique when present" actually requires for a compound index.
const repairStaleIndexes = async () => {
    await repairIndex({
        modelPath: "../models/payrollPolicy.model.js",
        exportName: "PayrollPolicy",
        staleIndexName: "schoolId_1",
        matches: (idx) => idx.unique,
        note: "superseded by schoolId_1_effectiveFrom_-1 — settings are now versioned per school, not one-per-school.",
    });
    await repairIndex({
        modelPath: "../models/Employee.model.js",
        exportName: "Employee",
        staleIndexName: "schoolId_1_employeeCode_1",
        matches: (idx) => idx.sparse,
        note: "employees with no employeeCode collided; replaced by a partial index.",
    });
    await repairIndex({
        modelPath: "../models/user.model.js",
        exportName: "User",
        staleIndexName: "regId_1_schoolId_1",
        matches: (idx) => idx.sparse,
        note: "users with no regId (most non-student roles) collided; replaced by a partial index.",
    });
    await repairIndex({
        modelPath: "../models/Roles.model.js",
        exportName: "Role",
        staleIndexName: "code_1_schoolId_1",
        matches: () => true, // this one was never even sparse — always fully enforced on missing code
        note: "roles with no code collided; replaced by a partial index.",
    });
};

const dbConnection = async()=>{
    try {
        // MONGOOSE_URI already ends in `/?retryWrites=...`, so appending "/DB_NAME" as a string
        // (the old approach) produced a malformed URI that mongoose silently ignored, falling
        // back to its default database. The `dbName` option is the correct way to select the
        // database regardless of what the URI's path/query already looks like.
        const connectInstance = await mongoose.connect(process.env.MONGOOSE_URI, { dbName: DB_NAME });
            console.log(`mongoDB database connect : ${connectInstance.connection.host} / ${connectInstance.connection.name}`)
            await repairStaleIndexes();
    } catch (error) {
        console.log(`Database Doesn't Connect`)
    }
}

export default dbConnection
//mongodb+srv://Sunil_Kush:OebG8R7RVVcCrZGn@cluster0.xxwzkn3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
