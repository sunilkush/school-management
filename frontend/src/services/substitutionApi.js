import httpClient from "../api/httpClient";

const unwrap = (response) => response.data?.data ?? response.data;

/**
 * The day's picture: who is away, which periods that leaves uncovered, and ranked candidates for
 * each. `absentTeacherIds` covers the teacher who simply did not arrive and has no leave on
 * record — approved leave for the date is picked up automatically.
 */
export const fetchSubstitutionPlan = async ({ date, academicYearId, absentTeacherIds = [] }) =>
  unwrap(
    await httpClient.get("/substitutions/plan", {
      params: {
        date,
        academicYearId,
        ...(absentTeacherIds.length ? { absentTeacherIds: absentTeacherIds.join(",") } : {}),
      },
    })
  );

export const assignSubstitute = async (payload) =>
  unwrap(await httpClient.post("/substitutions", payload));

/** The daily register. Pass `date`, or `from`/`to` for a range. */
export const fetchSubstitutions = async (params = {}) =>
  unwrap(await httpClient.get("/substitutions", { params })) || [];

export const cancelSubstitution = async (id) =>
  unwrap(await httpClient.patch(`/substitutions/${id}/cancel`));

/** The signed-in teacher's own cover duties. */
export const fetchMySubstitutions = async (params = {}) =>
  unwrap(await httpClient.get("/substitutions/mine", { params })) || [];
