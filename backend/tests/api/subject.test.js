import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../src/app.js";
import { Subject } from "../../src/models/subject.model.js";
import { connectTestDB, clearTestDB, closeTestDB, makeUserWithRole } from "../helpers/testSetup.js";

describe("Subject API", () => {
  let adminToken;
  let teacherToken;

  beforeAll(async () => connectTestDB());
  afterAll(async () => closeTestDB());
  beforeEach(async () => {
    await clearTestDB();
    adminToken = (await makeUserWithRole("Super Admin")).token;
    teacherToken = (await makeUserWithRole("Teacher", { email: "teacher2@test.dev" })).token;
  });

  test("POST /api/v1/subject/create (valid) -> 201", async () => {
    const res = await request(app)
      .post("/api/v1/subject/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Mathematics" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const saved = await Subject.findOne({ name: "MATHEMATICS" });
    expect(saved).toBeTruthy();
  });

  test("POST /api/v1/subject/create (empty body) -> 400", async () => {
    const res = await request(app)
      .post("/api/v1/subject/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test("POST /api/v1/subject/create (duplicate name) -> 400", async () => {
    await Subject.create({ name: "SCIENCE" });

    const res = await request(app)
      .post("/api/v1/subject/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "science" });

    expect(res.status).toBe(400);
  });

  test("GET /api/v1/subject/all?page=1&limit=10 -> 200 paginated", async () => {
    await Subject.create({ name: "ENGLISH" });

    const res = await request(app)
      .get("/api/v1/subject/all?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(1);
  });

  test("GET /api/v1/subject/:id (invalid ObjectId) -> 400", async () => {
    const res = await request(app)
      .get("/api/v1/subject/invalid-id")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  test("POST /api/v1/subject/create (Teacher role) -> 403", async () => {
    const res = await request(app)
      .post("/api/v1/subject/create")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ name: "History" });

    expect(res.status).toBe(403);
  });
});
