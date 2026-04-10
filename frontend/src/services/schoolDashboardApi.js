import { baseApi } from "./baseApi";

export const schoolDashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoleDashboardOverview: builder.query({
      query: () => ({
        url: "/dashboard/role-overview",
      }),
      transformResponse: (response) => response.data,
    }),
    getSchoolAdminDashboardAnalytics: builder.query({
      query: (schoolId) => ({
        url: "/dashboard/school-admin/analytics",
        params: schoolId ? { schoolId } : undefined,
      }),
      transformResponse: (response) => response.data,
    }),
  }),
});

export const { useGetRoleDashboardOverviewQuery, useGetSchoolAdminDashboardAnalyticsQuery } = schoolDashboardApi;
