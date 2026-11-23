const DASHBOARD_STATUSES = new Set(["all", "in-progress", "completed"]);

export function getLearningDashboardFilters(searchParams) {
  const requestedStatus = searchParams.get("status") ?? "all";

  return {
    search: searchParams.get("search") ?? "",
    status: DASHBOARD_STATUSES.has(requestedStatus)
      ? requestedStatus
      : "all",
  };
}

export function updateLearningDashboardSearchParams(
  searchParams,
  { search, status },
) {
  const nextSearchParams = new URLSearchParams(searchParams);
  const normalizedSearch = typeof search === "string" ? search : "";
  const normalizedStatus = DASHBOARD_STATUSES.has(status) ? status : "all";

  if (normalizedSearch.trim()) {
    nextSearchParams.set("search", normalizedSearch);
  } else {
    nextSearchParams.delete("search");
  }

  if (normalizedStatus === "all") {
    nextSearchParams.delete("status");
  } else {
    nextSearchParams.set("status", normalizedStatus);
  }

  return nextSearchParams;
}

export function getLearningDashboardUrl(searchParams) {
  const filters = getLearningDashboardFilters(searchParams);
  const normalizedSearchParams = new URLSearchParams();

  if (filters.search.trim()) {
    normalizedSearchParams.set("search", filters.search);
  }
  if (filters.status !== "all") {
    normalizedSearchParams.set("status", filters.status);
  }

  const query = normalizedSearchParams.toString();
  return `/learning-dashboard${query ? `?${query}` : ""}`;
}

export function getLearningDashboardReturnPath(value) {
  if (typeof value !== "string") return "";

  const queryIndex = value.indexOf("?");
  const pathname = queryIndex === -1 ? value : value.slice(0, queryIndex);
  if (pathname !== "/learning-dashboard") return "";

  const query = queryIndex === -1 ? "" : value.slice(queryIndex + 1);
  return getLearningDashboardUrl(new URLSearchParams(query));
}
