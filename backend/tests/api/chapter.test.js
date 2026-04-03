import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../src/app.js";
import { connectTestDB, clearTestDB, closeTestDB, makeUserWithRole } from "../helpers/testSetup.js";

describe("Chapter API", () => {
  let adminToken;

  beforeAll(async () => connectTestDB());
  afterAll(async () => closeTestDB());
  beforeEach(async () => {
    await clearTestDB();
    adminToken = (await makeUserWithRole("Super Admin", { email: "chapter.admin@test.dev" })).token;
  });

  test("POST /api/v1/chapters -> no 500", async () => {
    const res = await request(app)
      .post("/api/v1/chapters")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Intro",
        chapterNo: 1,
        schoolClassId: new mongoose.Types.ObjectId().toString(),
        subjectId: new mongoose.Types.ObjectId().toString(),
        isGlobal: true,
      });

    expect(res.status).toBe(201);
  });
});
