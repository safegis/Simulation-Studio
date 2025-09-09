// SortRoutes-Fastest.tsx

export interface RouteData {
  distance: number; // in meters
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
 * Scoring formula (distance only):
 *   score = normalizedDistance
 * Lower score = better route
 */
export function sortRoutesFastest(routes: RouteData[]): RouteData[] {
  if (!routes || routes.length === 0) return [];

  // Step 1: Extract min/max values for normalization
  const distances = routes.map((r) => r.distance);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);

  // Step 2: Calculate score for each route (distance only)
  const scoredRoutes = routes.map((route) => {
    const normDistance =
      maxDistance === minDistance
        ? 0
        : (route.distance - minDistance) / (maxDistance - minDistance);

    const score = normDistance; // only distance matters

    return { ...route, score };
  });

  // Step 3: Sort by ascending score (lower = better)
  return scoredRoutes.sort((a, b) => a.score - b.score);
}
