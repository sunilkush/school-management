/**
 * Checks that records which point at a person stay inside the school they belong to.
 *
 * The same mistake turns up wherever one record names a user: the id is taken from the request
 * and saved without asking whether that person is at this school at all. The record then names
 * somebody who cannot see it, and their name and contact details come back to everyone who can
 * — because the endpoint populates them.
 *
 * This drives the real handlers, so it checks the rule as it is actually enforced rather than
 * a copy of it.
 *
 * Run it against a throwaway database — it drops the database when done:
 *   npm run check:scoping
 */
import mongoose from "mongoose";
import { SupportTicket } from "../src/models/SupportTicket.model.js";
import { User } from "../src/models/user.model.js";
import { updateSupportTicket } from "../src/controllers/supportTicket.controllers.js";

const URI = process.env.E2E_MONGO_URI || "mongodb://127.0.0.1:27017/school_management_scoping_check";
if (/mongodb\+srv|mongodb\.net/i.test(URI)) {
  console.error("Refusing to run against a hosted cluster — point E2E_MONGO_URI at a local mongod.");
  process.exit(1);
}

let pass = 0;
let fail = 0;
const ok = (label, cond, detail = "") => {
  if (cond) {
    pass += 1;
    console.log(`  PASS  ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

await mongoose.connect(URI);
await mongoose.connection.db.dropDatabase();
console.log(`connected to ${mongoose.connection.name}\n`);

const id = () => new mongoose.Types.ObjectId();

/** Calls the handler the way express would, and reports what came back. */
const call = (handler, req) =>
  new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({ status: this.statusCode, body });
      },
    };
    handler(req, res, (err) => resolve({ status: err?.statusCode ?? 500, message: err?.message }));
  });

console.log("── handing a support ticket to someone ──");

const ourSchool = id();
const otherSchool = id();

const roleId = id(); // the role itself is not what is being checked here
const person = (schoolId, extra = {}) =>
  User.create({ name: "Staff", email: `${id()}@example.com`, password: "Passw0rd1", roleId, schoolId, ...extra });

const colleague = await person(ourSchool);
const outsider = await person(otherSchool);
const departed = await person(ourSchool, { isDeleted: true });
const platformUser = await User.create({ name: "Ops", email: `${id()}@example.com`, password: "Passw0rd1", roleId });

const reporter = id();
const ticketFor = (schoolId) =>
  SupportTicket.create({ title: "Wifi down", description: "No wifi in the lab", schoolId, createdBy: reporter });

const asSupport = (ticket, assignedTo) => ({
  params: { id: String(ticket._id) },
  body: { assignedTo },
  user: { _id: id(), schoolId: ourSchool },
  userRole: { name: "IT Support" },
});

{
  const ticket = await ticketFor(ourSchool);
  const res = await call(updateSupportTicket, asSupport(ticket, colleague._id));
  const after = await SupportTicket.findById(ticket._id).lean();
  ok("someone at the same school can be given the ticket", res.status === 200, res.message);
  ok("and the ticket records them", `${after.assignedTo}` === `${colleague._id}`);
}

{
  const ticket = await ticketFor(ourSchool);
  const res = await call(updateSupportTicket, asSupport(ticket, outsider._id));
  const after = await SupportTicket.findById(ticket._id).lean();
  ok("someone at another school is refused", res.status === 404, `status ${res.status}`);
  ok("and the ticket is left unassigned", after.assignedTo === null);
}

{
  const ticket = await ticketFor(ourSchool);
  const res = await call(updateSupportTicket, asSupport(ticket, departed._id));
  ok("someone who has left is refused", res.status === 404, `status ${res.status}`);
}

{
  const ticket = await ticketFor(ourSchool);
  const res = await call(updateSupportTicket, asSupport(ticket, id()));
  ok("an id belonging to nobody is refused", res.status === 404, `status ${res.status}`);
}

{
  const ticket = await ticketFor(ourSchool);
  const res = await call(updateSupportTicket, asSupport(ticket, "not-an-id"));
  ok("something that is not an id at all is refused", res.status === 400, `status ${res.status}`);
}

{
  // The person who raised it may edit their own ticket, but handing it to someone is support work.
  const ticket = await ticketFor(ourSchool);
  const res = await call(updateSupportTicket, {
    params: { id: String(ticket._id) },
    body: { assignedTo: colleague._id },
    user: { _id: reporter, schoolId: ourSchool },
    userRole: { name: "Student" },
  });
  ok("the person who raised it cannot hand it to anyone", res.status === 403, `status ${res.status}`);
}

{
  const ticket = await ticketFor(ourSchool);
  await SupportTicket.updateOne({ _id: ticket._id }, { $set: { assignedTo: colleague._id } });
  const res = await call(updateSupportTicket, asSupport(ticket, null));
  const after = await SupportTicket.findById(ticket._id).lean();
  ok("an assignment can still be cleared", res.status === 200 && after.assignedTo === null, res.message);
}

{
  // A ticket raised by a Super Admin belongs to no school; only a platform user can take it.
  const ticket = await ticketFor(null);
  const mine = {
    params: { id: String(ticket._id) },
    user: { _id: id(), schoolId: undefined },
    userRole: { name: "Super Admin" },
  };
  const refused = await call(updateSupportTicket, { ...mine, body: { assignedTo: colleague._id } });
  ok("a platform ticket is not handed to a school's staff", refused.status === 404, `status ${refused.status}`);
  const taken = await call(updateSupportTicket, { ...mine, body: { assignedTo: platformUser._id } });
  ok("a platform ticket can be handed to a platform user", taken.status === 200, taken.message);
}

{
  // Editing the rest of a ticket still works, and says nothing about who it is with.
  const ticket = await ticketFor(ourSchool);
  const res = await call(updateSupportTicket, {
    params: { id: String(ticket._id) },
    body: { priority: "Urgent", note: "chased this" },
    user: { _id: reporter, schoolId: ourSchool },
    userRole: { name: "Student" },
  });
  const after = await SupportTicket.findById(ticket._id).lean();
  ok("an edit that says nothing about the assignee still works", res.status === 200, res.message);
  ok("and it is left alone", after.assignedTo === null && after.priority === "Urgent");
  ok("the note is kept", after.updates.length === 1 && after.updates[0].note === "chased this");
}

await mongoose.connection.db.dropDatabase();
await mongoose.disconnect();

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
