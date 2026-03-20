// SortRoutes-BestBalance.tsx

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
 * Weighted Sum Model (WSM) for sorting routes by "Best Balance"
 * Scoring formula (balanced between speed and safety):
 *   score = normalizedDuration * 0.5 + (normalizedIncidentCount * 0.3 + normalizedSeverity * 0.2)
 * Lower score = better balanced route
 *
 * Weights:
 * - Duration: 50% (travel time)
 * - Incident count: 30% (number of incidents)
 * - Severity: 20% (severity of incidents)
 */
export function sortRoutesBestBalance(routes: RouteData[]): RouteData[] {
  if (!routes || routes.length === 0) return [];

  // Step 1: Extract min/max values for normalization
  const durations = routes.map((r) => r.duration || 0);
  const incidentCounts = routes.map((r) => r.trafficData?.incident_count || 0);
  const severityScores = routes.map(
    (r) => r.trafficData?.total_severity_score || 0
  );

  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const minIncidents = Math.min(...incidentCounts);
  const maxIncidents = Math.max(...incidentCounts);
  const minSeverity = Math.min(...severityScores);
  const maxSeverity = Math.max(...severityScores);

  // Step 2: Calculate balanced score for each route
  const scoredRoutes = routes.map((route) => {
    const duration = route.duration || 0;
    const incidentCount = route.trafficData?.incident_count || 0;
    const severityScore = route.trafficData?.total_severity_score || 0;

    // Normalize values (0 = best, 1 = worst)
    const normDuration =
      maxDuration === minDuration
        ? 0
        : (duration - minDuration) / (maxDuration - minDuration);

    const normIncidents =
      maxIncidents === minIncidents
        ? 0
        : (incidentCount - minIncidents) / (maxIncidents - minIncidents);

    const normSeverity =
      maxSeverity === minSeverity
        ? 0
        : (severityScore - minSeverity) / (maxSeverity - minSeverity);

    // Weighted score: duration (50%) + incident count (30%) + severity (20%)
    // Lower score = better balanced route
    const score = normDuration * 0.5 + normIncidents * 0.3 + normSeverity * 0.2;

    return { ...route, score };
  });

  // Step 3: Sort by ascending score (lower = better balance)
  // Use duration as tiebreaker when scores are equal
  return scoredRoutes.sort((a, b) => {
    if (a.score === b.score) {
      // If balance scores are equal, prefer faster route
      return (a.duration || 0) - (b.duration || 0);
    }
    return a.score - b.score;
  });
}
