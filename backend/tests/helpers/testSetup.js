import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Role } from "../../src/models/Roles.model.js";
import { User } from "../../src/models/user.model.js";

let mongoServer;

export const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "test-secret";
};

export const clearTestDB = async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
};

export const closeTestDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
};

export const makeUserWithRole = async (roleName, extras = {}) => {
  const role = await Role.create({ name: roleName, code: roleName.toUpperCase().replace(/\s+/g, "_") });
  const user = await User.create({
    name: `${roleName} User`,
    email: `${roleName.replace(/\s+/g, "").toLowerCase()}@test.dev`,
    password: "Pass@123",
    roleId: role._id,
    ...extras,
  });

  const token = jwt.sign({ _id: user._id }, process.env.ACCESS_TOKEN_SECRET);
  return { user, role, token };
};
