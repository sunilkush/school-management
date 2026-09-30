import mongoose from "mongoose";
import { ApiError } from "./ApiError.js";

// Pattern A in docs/bug-audit.md: an id taken from the request must belong to the caller's school
// before it is saved or used. Unchecked, another school's record was linked in and the response
// populated it — its people's names and contact details, its vendors, its classes.

const toIdList = (ids) =>
  [...new Set((Array.isArray(ids) ? ids : [ids]).filter((id) => id !== undefined && id !== null && id !== "").map(String))];

/**
 * Every given id must be a document of `Model` in `schoolId`. Empty values are skipped, so
 * optional fields can be passed as they come. 400 for a malformed id, 404 when any is not this
 * school's. `allowShared` also accepts platform-wide records (schoolId null), such as global
 * subjects and NCERT chapters.
 */
export const assertInSchool = async (Model, ids, schoolId, label = "record", { allowShared = false } = {}) => {
  const list = toIdList(ids);
  if (!list.length) return;
  if (list.some((id) => !mongoose.Types.ObjectId.isValid(id))) throw new ApiError(400, `Invalid ${label} id`);
  const scope = allowShared ? { schoolId: { $in: [schoolId, null] } } : { schoolId };
  const found = await Model.countDocuments({ _id: { $in: list }, ...scope });
  if (found !== list.length) throw new ApiError(404, `${label[0].toUpperCase()}${label.slice(1)} not found in this school`);
};

/** Several checks at once: `[[Model, ids, label, options?], ...]`. */
export const assertAllInSchool = (schoolId, checks) =>
  Promise.all(checks.map(([Model, ids, label, options]) => assertInSchool(Model, ids, schoolId, label, options)));
