// SortRoutes-Safest.tsx

export interface RouteData {
  distance: number; // in meters
  duration: number; // in seconds
  trafficData?: {
    incident_count: number;
    total_severity_score: number;
    category_counts: Record<string, number>;
    incidents: any[];
  };
  profile: string; // driving, walking, cycling, motorcycle
  [key: string]: any; // allow other fields
}

/**
 * Weighted Sum Model (WSM) for sorting routes by "Safest"
 * Scoring formula (traffic incidents only):
 *   score = normalizedIncidentCount * 0.6 + normalizedSeverity * 0.4
 * Lower score = safer route (fewer/less severe incidents)
 */
export function sortRoutesSafest(routes: RouteData[]): RouteData[] {
  if (!routes || routes.length === 0) return [];

  // Step 1: Extract min/max values for normalization
  const incidentCounts = routes.map((r) => r.trafficData?.incident_count || 0);
  const severityScores = routes.map(
    (r) => r.trafficData?.total_severity_score || 0
  );

  const minIncidents = Math.min(...incidentCounts);
  const maxIncidents = Math.max(...incidentCounts);
  const minSeverity = Math.min(...severityScores);
  const maxSeverity = Math.max(...severityScores);

  // Step 2: Calculate safety score for each route
  const scoredRoutes = routes.map((route) => {
    const incidentCount = route.trafficData?.incident_count || 0;
    const severityScore = route.trafficData?.total_severity_score || 0;

    // Normalize values (0 = best, 1 = worst)
    const normIncidents =
      maxIncidents === minIncidents
        ? 0
        : (incidentCount - minIncidents) / (maxIncidents - minIncidents);

    const normSeverity =
      maxSeverity === minSeverity
        ? 0
        : (severityScore - minSeverity) / (maxSeverity - minSeverity);

    // Weighted score: incident count (60%) + severity (40%)
    // Lower score = safer route
    const score = normIncidents * 0.6 + normSeverity * 0.4;

    console.log(`[Safest Sort] Route ${route.profile} (${route.duration}s):`, {
      incidentCount,
      severityScore,
      normIncidents,
      normSeverity,
      score,
      duration: route.duration,
    });

    return { ...route, score };
  });

  // Step 3: Sort by ascending score (lower = safer)
  // Use duration as tiebreaker when scores are equal
  return scoredRoutes.sort((a, b) => {
    if (a.score === b.score) {
      // If safety scores are equal, prefer faster route
      return (a.duration || 0) - (b.duration || 0);
    }
    return a.score - b.score;
  });
}
