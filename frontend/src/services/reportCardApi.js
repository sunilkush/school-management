import httpClient from "../api/httpClient";

const unwrap = (response) => response.data?.data ?? response.data;

/* ── Templates ───────────────────────────────────────────────────── */

export const fetchReportCardTemplates = async (params = {}) =>
  unwrap(await httpClient.get("/report-cards/templates", { params })) || [];

export const fetchReportCardTemplate = async (id) =>
  unwrap(await httpClient.get(`/report-cards/templates/${id}`));

export const createReportCardTemplate = async (payload) =>
  unwrap(await httpClient.post("/report-cards/templates", payload));

export const updateReportCardTemplate = async (id, payload) =>
  unwrap(await httpClient.put(`/report-cards/templates/${id}`, payload));

export const deleteReportCardTemplate = async (id) =>
  unwrap(await httpClient.delete(`/report-cards/templates/${id}`));

/* ── Cards ───────────────────────────────────────────────────────── */

export const generateReportCards = async (payload) =>
  unwrap(await httpClient.post("/report-cards/generate", payload));

export const fetchReportCards = async (params = {}) =>
  unwrap(await httpClient.get("/report-cards", { params })) || [];

export const fetchReportCard = async (id) =>
  unwrap(await httpClient.get(`/report-cards/${id}`));

/** Class-teacher finishing pass — co-scholastic grades and the written remark. */
export const updateReportCard = async (id, payload) =>
  unwrap(await httpClient.patch(`/report-cards/${id}`, payload));

export const publishReportCards = async (payload) =>
  unwrap(await httpClient.post("/report-cards/publish", payload));

/* ── Self-service ────────────────────────────────────────────────── */

export const fetchMyReportCards = async () =>
  unwrap(await httpClient.get("/report-cards/mine")) || [];

export const fetchChildReportCards = async (studentId) =>
  unwrap(await httpClient.get(`/report-cards/child/${studentId}`)) || [];

/**
 * Triggers a browser download of the card. The endpoint returns a PDF stream, so this asks axios
 * for a blob and drives an object URL — the same approach MySubscription.jsx uses for invoices.
 */
export const downloadReportCardPdf = async (id, filename = "report-card.pdf") => {
  const response = await httpClient.get(`/report-cards/${id}/pdf`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
