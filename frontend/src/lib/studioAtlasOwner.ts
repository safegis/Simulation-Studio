/** localStorage key for guest/device owner UUID (Atlas chat rows in Supabase). */
export const STUDIO_ATLAS_OWNER_LS_KEY = "safegis_studio_atlas_owner_key";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns a stable UUID for this browser (guest mode).
 * When the user signs in with Supabase, use their access token instead of this header.
 */
export function getOrCreateStudioGuestOwnerKey(): string {
  if (typeof window === "undefined") {
    return "00000000-0000-4000-8000-000000000000";
  }
  try {
    const existing = window.localStorage.getItem(STUDIO_ATLAS_OWNER_LS_KEY);
    if (existing && UUID_RE.test(existing)) {
      return existing.toLowerCase();
    }
    const uuid = crypto.randomUUID().toLowerCase();
    window.localStorage.setItem(STUDIO_ATLAS_OWNER_LS_KEY, uuid);
    return uuid;
  } catch {
    return "00000000-0000-4000-8000-000000000001";
  }
}
