const EXAM_ROUTE_PREFIXES = [
  { match: "/dashboard/schooladmin", prefix: "/dashboard/schooladmin/exams", list: "exams-list", create: "exams-create" },
  { match: "/dashboard/examcoordinator", prefix: "/dashboard/examcoordinator/exams", list: "schedule", create: "create" },
  { match: "/dashboard/principal", prefix: "/dashboard/principal/exams", list: "", create: "create" },
  { match: "/dashboard/viceprincipal", prefix: "/dashboard/viceprincipal/exams", list: "", create: "create" },
  { match: "/dashboard/teacher", prefix: "/dashboard/teacher/exams", list: "list", create: "create" },
];

export const getExamRouteConfig = (pathname = "") => {
  const config = EXAM_ROUTE_PREFIXES.find((item) => pathname.startsWith(item.match)) || EXAM_ROUTE_PREFIXES[0];
  const join = (suffix = "") => [config.prefix, suffix].filter(Boolean).join("/");

  return {
    ...config,
    createPath: join(config.create),
    listPath: join(config.list),
    editPath: (id) => join(`edit/${id}`),
  };
};
