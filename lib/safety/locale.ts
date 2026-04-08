import { getLocales } from "expo-localization";
import {
  RESOURCES_BY_REGION,
  type RegionResources,
} from "@/constants/resources";

/**
 * Pick the right hotline set for the user.
 *
 * Order of precedence:
 *   1. Explicit override (from settings — passed in by caller)
 *   2. Device locale's region code (e.g. "en-US" → "US")
 *   3. International fallback ("INTL")
 *
 * Always returns *something* — never undefined — because the crisis
 * screen must always render. If the user's region has no entry, we
 * fall back to findahelpline.com / IASP, both of which cover the
 * whole world.
 */
export function pickHotlines(override?: string | null): RegionResources {
  const candidate =
    override ?? getLocales()[0]?.regionCode ?? null;

  if (candidate && RESOURCES_BY_REGION[candidate]) {
    return RESOURCES_BY_REGION[candidate];
  }

  return RESOURCES_BY_REGION.INTL;
}
