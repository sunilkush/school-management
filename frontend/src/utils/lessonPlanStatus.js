// draft → submitted for review → approved (or returned with a comment) → completed once taught.
// Approving and returning happen on the reviewer's screen (Lesson Plan Review).
export const LESSON_STATUS = {
  draft:     { label: "Draft",        color: "default" },
  submitted: { label: "Under review", color: "gold" },
  returned:  { label: "Returned",     color: "red" },
  approved:  { label: "Approved",     color: "green" },
  completed: { label: "Completed",    color: "blue" },
};
