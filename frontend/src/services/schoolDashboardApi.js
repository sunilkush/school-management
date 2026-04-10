import { baseApi } from "./baseApi";

export const schoolDashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSchoolAdminDashboardAnalytics: builder.query({
      query: (schoolId) => ({
        url: "/dashboard/school-admin/analytics",
        params: schoolId ? { schoolId } : undefined,
      }),
      transformResponse: (response) => response.data,
    }),
  }),
});

export const { useGetSchoolAdminDashboardAnalyticsQuery } = schoolDashboardApi;
