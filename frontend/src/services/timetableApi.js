import httpClient from "../api/httpClient";

const unwrap = (response) => response.data?.data ?? response.data;

/**
 * Builds a clash-free week from each class's subject plan.
 *
 * Defaults to a PREVIEW — pass `commit: true` only once the user has seen the result and asked
 * for it. Committing replaces the targeted sections' existing rows, which may be hand-tuned.
 *
 * Resolves { entries, unmet, filledSlots, totalSlots, committed }.
 */
export const generateTimetable = async ({ academicYearId, targets, workingDays, commit = false }) =>
  unwrap(
    await httpClient.post("/timetable/generate", {
      academicYearId,
      targets,
      ...(workingDays?.length ? { workingDays } : {}),
      commit,
    })
  );
