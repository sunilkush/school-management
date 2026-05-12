import httpClient from "../api/httpClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const EVENT_TYPES = ["Event", "Holiday", "Meeting", "Exam", "Activity", "Reminder"];
export const EVENT_AUDIENCES = ["All", "Students", "Teachers", "Parents", "Staff"];
export const EVENT_STATUSES = ["scheduled", "cancelled", "completed"];

export const fetchSchoolEvents = async (params = {}) => {
  const response = await httpClient.get("/events", { params });
  return unwrap(response) || [];
};

export const fetchSchoolEventStats = async () => {
  const response = await httpClient.get("/events/stats");
  return unwrap(response) || {};
};

export const createSchoolEvent = async (payload) => {
  const response = await httpClient.post("/events", payload);
  return unwrap(response);
};

export const updateSchoolEvent = async (id, payload) => {
  const response = await httpClient.put(`/events/${id}`, payload);
  return unwrap(response);
};

export const deleteSchoolEvent = async (id) => {
  const response = await httpClient.delete(`/events/${id}`);
  return unwrap(response);
};
