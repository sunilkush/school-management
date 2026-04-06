import request from "supertest";
import { app } from "../../src/app.js";
import { Class } from "../../src/models/classes.model.js";
import { connectTestDB, clearTestDB, closeTestDB, makeUserWithRole } from "../helpers/testSetup.js";

describe("Class API", () => {
  let adminToken;

  beforeAll(async () => connectTestDB());
  afterAll(async () => closeTestDB());
  beforeEach(async () => {
    await clearTestDB();
    adminToken = (await makeUserWithRole("Super Admin", { email: "class.admin@test.dev" })).token;
  });

  test("POST /api/v1/class/create -> 201", async () => {
    const res = await request(app)
      .post("/api/v1/class/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Class 1" });

    expect(res.status).toBe(201);
  });

  test("GET /api/v1/class/:schoolClassId -> 200", async () => {
    const created = await Class.create({ name: "CLASS 2" });

    const res = await request(app)
      .get(`/api/v1/class/${created._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("PUT /api/v1/class/:schoolClassId -> 200", async () => {
    const created = await Class.create({ name: "CLASS 3" });

    const res = await request(app)
      .put(`/api/v1/class/${created._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Updated" });

    expect(res.status).toBe(200);
  });
});
