// Route preservation utility
// This helps maintain user's current page when browser is refreshed or returned to

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/members",
  "/classes",
  "/trainers",
  "/billing",
  "/analytics",
  "/reports",
  "/settings",
  "/plans",
  "/tasks",
  "/promotions",
  "/notifications",
  "/profile",
];

export const AUTH_ROUTES = ["/", "/login", "/signup", "/subscribe"];

export const shouldRedirectToDefaultPage = (currentPath: string): boolean => {
  // Only redirect to dashboard if user is on auth pages
  return AUTH_ROUTES.includes(currentPath);
};

export const isProtectedRoute = (path: string): boolean => {
  return PROTECTED_ROUTES.some((route) => path.startsWith(route));
};

export const isAuthRoute = (path: string): boolean => {
  return AUTH_ROUTES.includes(path);
};

// Enhanced route preservation utility for tab state management
interface RouteState {
  tab: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
  pagination?: {
    page: number;
    limit: number;
  };
  search?: string;
  timestamp: number;
}

interface RouteHistory {
  [path: string]: RouteState;
}

const ROUTE_HISTORY_KEY = "mtdrb_route_history";
const MAX_HISTORY_ENTRIES = 50; // Limit memory usage

class RoutePreservationManager {
  private history: RouteHistory = {};
  private initialized = false;

  constructor() {
    this.loadHistory();
  }

  private loadHistory(): void {
    try {
      const saved = localStorage.getItem(ROUTE_HISTORY_KEY);
      if (saved) {
        this.history = JSON.parse(saved);
        // Clean up old entries
        this.cleanupOldEntries();
      }
      this.initialized = true;
    } catch (error) {
      console.error("Failed to load route history:", error);
      this.history = {};
      this.initialized = true;
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(ROUTE_HISTORY_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.error("Failed to save route history:", error);
    }
  }

  private cleanupOldEntries(): void {
    const entries = Object.entries(this.history);
    if (entries.length > MAX_HISTORY_ENTRIES) {
      // Sort by timestamp and keep only the most recent entries
      const sortedEntries = entries.sort(
        (a, b) => b[1].timestamp - a[1].timestamp,
      );
      this.history = Object.fromEntries(
        sortedEntries.slice(0, MAX_HISTORY_ENTRIES),
      );
    }
  }

  // Save complete route state
  saveRouteState(path: string, state: Partial<RouteState>): void {
    if (!this.initialized) return;

    const existingState = this.history[path] || {
      tab: "overview",
      timestamp: Date.now(),
    };

    this.history[path] = {
      ...existingState,
      ...state,
      timestamp: Date.now(),
    };

    this.saveHistory();
  }

  // Get route state
  getRouteState(path: string): RouteState | null {
    if (!this.initialized) return null;
    return this.history[path] || null;
  }

  // Save tab state for specific route
  saveTabState(path: string, tab: string): void {
    this.saveRouteState(path, { tab });
  }

  // Get tab for specific route
  getTabForRoute(path: string): string {
    const state = this.getRouteState(path);
    return state?.tab || "overview";
  }

  // Save filter state
  saveFilterState(path: string, filters: Record<string, any>): void {
    this.saveRouteState(path, { filters });
  }

  // Get filter state
  getFilterState(path: string): Record<string, any> {
    const state = this.getRouteState(path);
    return state?.filters || {};
  }

  // Save sort state
  saveSortState(path: string, field: string, direction: "asc" | "desc"): void {
    this.saveRouteState(path, { sort: { field, direction } });
  }

  // Get sort state
  getSortState(
    path: string,
  ): { field: string; direction: "asc" | "desc" } | null {
    const state = this.getRouteState(path);
    return state?.sort || null;
  }

  // Save pagination state
  savePaginationState(path: string, page: number, limit: number): void {
    this.saveRouteState(path, { pagination: { page, limit } });
  }

  // Get pagination state
  getPaginationState(path: string): { page: number; limit: number } | null {
    const state = this.getRouteState(path);
    return state?.pagination || null;
  }

  // Save search state
  saveSearchState(path: string, search: string): void {
    this.saveRouteState(path, { search });
  }

  // Get search state
  getSearchState(path: string): string {
    const state = this.getRouteState(path);
    return state?.search || "";
  }

  // Clear state for specific route
  clearRouteState(path: string): void {
    delete this.history[path];
    this.saveHistory();
  }

  // Clear all history
  clearAllHistory(): void {
    this.history = {};
    this.saveHistory();
  }

  // Get navigation history for breadcrumbs
  getNavigationHistory(
    limit: number = 5,
  ): Array<{ path: string; timestamp: number }> {
    const entries = Object.entries(this.history)
      .map(([path, state]) => ({ path, timestamp: state.timestamp }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return entries;
  }

  // URL-based state management
  encodeStateToURL(path: string, baseURL: string): string {
    const state = this.getRouteState(path);
    if (!state) return baseURL;

    const params = new URLSearchParams();

    if (state.tab && state.tab !== "overview") {
      params.set("tab", state.tab);
    }

    if (state.search) {
      params.set("search", state.search);
    }

    if (state.sort) {
      params.set("sort", `${state.sort.field}:${state.sort.direction}`);
    }

    if (state.pagination && state.pagination.page > 1) {
      params.set("page", state.pagination.page.toString());
    }

    if (state.filters && Object.keys(state.filters).length > 0) {
      params.set("filters", JSON.stringify(state.filters));
    }

    const paramString = params.toString();
    return paramString ? `${baseURL}?${paramString}` : baseURL;
  }

  // Decode state from URL
  decodeStateFromURL(searchParams: URLSearchParams): Partial<RouteState> {
    const state: Partial<RouteState> = {};

    const tab = searchParams.get("tab");
    if (tab) state.tab = tab;

    const search = searchParams.get("search");
    if (search) state.search = search;

    const sort = searchParams.get("sort");
    if (sort) {
      const [field, direction] = sort.split(":");
      if (field && (direction === "asc" || direction === "desc")) {
        state.sort = { field, direction };
      }
    }

    const page = searchParams.get("page");
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        state.pagination = { page: pageNum, limit: 20 }; // Default limit
      }
    }

    const filters = searchParams.get("filters");
    if (filters) {
      try {
        state.filters = JSON.parse(filters);
      } catch (error) {
        console.error("Failed to parse filters from URL:", error);
      }
    }

    return state;
  }

  // Update URL without page reload
  updateURL(path: string, state: Partial<RouteState>): void {
    const currentURL = new URL(window.location.href);
    const newURL = this.encodeStateToURL(path, `${currentURL.origin}${path}`);

    if (newURL !== window.location.href) {
      window.history.replaceState(null, "", newURL);
    }
  }

  // Initialize route from URL parameters
  initializeFromURL(path: string): RouteState | null {
    const urlParams = new URLSearchParams(window.location.search);
    const urlState = this.decodeStateFromURL(urlParams);

    if (Object.keys(urlState).length > 0) {
      // Merge URL state with stored state
      const storedState = this.getRouteState(path);
      const mergedState = {
        tab: "overview",
        timestamp: Date.now(),
        ...storedState,
        ...urlState,
      };

      this.saveRouteState(path, mergedState);
      return mergedState;
    }

    return this.getRouteState(path);
  }

  // Enhanced browser navigation support
  setupBrowserNavigation(): void {
    // Handle browser back/forward buttons
    window.addEventListener("popstate", (event) => {
      const path = window.location.pathname;
      const state = this.initializeFromURL(path);

      // Dispatch custom event for components to listen to
      window.dispatchEvent(
        new CustomEvent("routeStateChange", {
          detail: { path, state },
        }),
      );
    });
  }

  // Check if current route has saved state
  hasStateForRoute(path: string): boolean {
    return !!this.history[path];
  }

  // Get statistics about usage patterns
  getUsageStats(): {
    totalRoutes: number;
    mostVisitedRoute: string | null;
    recentRoutes: string[];
  } {
    const entries = Object.entries(this.history);
    const mostVisited = entries.sort(
      (a, b) => b[1].timestamp - a[1].timestamp,
    )[0];
    const recent = entries
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .slice(0, 5)
      .map(([path]) => path);

    return {
      totalRoutes: entries.length,
      mostVisitedRoute: mostVisited ? mostVisited[0] : null,
      recentRoutes: recent,
    };
  }
}

// Create singleton instance
export const routePreservation = new RoutePreservationManager();

// React hook for easy integration
export const useRoutePreservation = (path: string) => {
  const saveState = (state: Partial<RouteState>) => {
    routePreservation.saveRouteState(path, state);
  };

  const getState = (): RouteState | null => {
    return routePreservation.getRouteState(path);
  };

  const saveTab = (tab: string) => {
    routePreservation.saveTabState(path, tab);
    routePreservation.updateURL(path, { tab });
  };

  const getTab = (): string => {
    return routePreservation.getTabForRoute(path);
  };

  const saveFilters = (filters: Record<string, any>) => {
    routePreservation.saveFilterState(path, filters);
    routePreservation.updateURL(path, { filters });
  };

  const getFilters = (): Record<string, any> => {
    return routePreservation.getFilterState(path);
  };

  const saveSort = (field: string, direction: "asc" | "desc") => {
    routePreservation.saveSortState(path, field, direction);
    routePreservation.updateURL(path, { sort: { field, direction } });
  };

  const getSort = () => {
    return routePreservation.getSortState(path);
  };

  const savePagination = (page: number, limit: number) => {
    routePreservation.savePaginationState(path, page, limit);
    routePreservation.updateURL(path, { pagination: { page, limit } });
  };

  const getPagination = () => {
    return routePreservation.getPaginationState(path);
  };

  const saveSearch = (search: string) => {
    routePreservation.saveSearchState(path, search);
    routePreservation.updateURL(path, { search });
  };

  const getSearch = (): string => {
    return routePreservation.getSearchState(path);
  };

  const initializeFromURL = () => {
    return routePreservation.initializeFromURL(path);
  };

  return {
    saveState,
    getState,
    saveTab,
    getTab,
    saveFilters,
    getFilters,
    saveSort,
    getSort,
    savePagination,
    getPagination,
    saveSearch,
    getSearch,
    initializeFromURL,
  };
};

// Initialize browser navigation support
if (typeof window !== "undefined") {
  routePreservation.setupBrowserNavigation();
}
