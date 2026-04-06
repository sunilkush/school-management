import { baseApi } from "./baseApi";

export const schoolApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => "/user/profile",
      transformResponse: (response) => response.data,
      providesTags: ["Profile"],
    }),

    getSubjects: builder.query({
      query: ({ page = 1, limit = 20, search = "" } = {}) => ({
        url: "/subject",
        params: { page, limit, search },
      }),
      transformResponse: (response) => ({
        items: response.data,
        meta: response.meta,
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map((subject) => ({ type: "Subject", id: subject._id })),
              { type: "Subject", id: "LIST" },
            ]
          : [{ type: "Subject", id: "LIST" }],
    }),

    createSubject: builder.mutation({
      query: (payload) => ({
        url: "/subject",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "Subject", id: "LIST" }],
    }),

    getClasses: builder.query({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: "/class",
        params: { page, limit },
      }),
      transformResponse: (response) => ({
        items: response.data,
        meta: response.meta,
      }),
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map((cls) => ({ type: "Class", id: cls._id })),
              { type: "Class", id: "LIST" },
            ]
          : [{ type: "Class", id: "LIST" }],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useGetSubjectsQuery,
  useCreateSubjectMutation,
  useGetClassesQuery,
} = schoolApi;
