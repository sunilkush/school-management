/** Opens the page search (components/navbar/GlobalSearch.jsx) from anywhere. */
export const GLOBAL_SEARCH_OPEN_EVENT = "global-search:open";

export const openGlobalSearch = () => window.dispatchEvent(new Event(GLOBAL_SEARCH_OPEN_EVENT));

export const isMacPlatform = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
