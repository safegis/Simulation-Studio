// SortRoutes-Fastest.tsx

export interface RouteData {
  distance: number; // in meters
  duration: number; // in seconds
  hazards?: {
    obstructions?: number;
    congestion?: number;
    roadClosure?: number;
    laneClosure?: number;
    floodedPoints?: number;
  };
  profile: string; // driving, walking, cycling, motorcycle
  [key: string]: any; // allow other fields
}

/**
 * Weighted Sum Model (WSM) for sorting routes by "Fastest"
 * Scoring formula (travel time/duration only):
 *   score = normalizedDuration
 * Lower score = faster route
 */
export function sortRoutesFastest(routes: RouteData[]): RouteData[] {
  if (!routes || routes.length === 0) return [];

  // Step 1: Extract min/max values for normalization
  const durations = routes.map((r) => r.duration || 0);
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);

  // Step 2: Calculate score for each route (duration only)
  const scoredRoutes = routes.map((route) => {
    const normDuration =
      maxDuration === minDuration
        ? 0
        : ((route.duration || 0) - minDuration) / (maxDuration - minDuration);

    const score = normDuration; // only travel time matters

    return { ...route, score };
  });

  // Step 3: Sort by ascending score (lower = faster)
  return scoredRoutes.sort((a, b) => a.score - b.score);
}
