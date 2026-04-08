/**
 * Crisis hotlines bundled in the app binary so the crisis screen
 * works fully offline (PLAN.md §4.6). NEVER fetch these at runtime —
 * a user in crisis with no signal must still see help.
 *
 * Numbers and URLs verified at the time of authoring. They should be
 * re-verified annually as part of the safety audit (§9).
 */

export interface Hotline {
  /** Display name (localized later) */
  name: string;
  /** Tel-scheme phone number, or null if text/web only */
  phone: string | null;
  /** Text-message option, e.g. "Text HOME to 741741" */
  text?: string;
  /** Website for chat or country directory */
  url?: string;
  /** Short description shown under the name */
  description: string;
  /** True for free 24/7 services — surface these first */
  is24h: boolean;
}

export interface RegionResources {
  /** ISO 3166-1 alpha-2 country code, or "INTL" for the global fallback */
  region: string;
  hotlines: Hotline[];
}

export const RESOURCES_BY_REGION: Record<string, RegionResources> = {
  US: {
    region: "US",
    hotlines: [
      {
        name: "988 Suicide & Crisis Lifeline",
        phone: "988",
        text: "Text 988",
        url: "https://988lifeline.org",
        description: "Free, confidential, 24/7. Call or text 988.",
        is24h: true,
      },
      {
        name: "Crisis Text Line",
        phone: null,
        text: "Text HOME to 741741",
        url: "https://www.crisistextline.org",
        description: "Free 24/7 text support with a trained counselor.",
        is24h: true,
      },
    ],
  },
  GB: {
    region: "GB",
    hotlines: [
      {
        name: "Samaritans",
        phone: "116123",
        url: "https://www.samaritans.org",
        description: "Free 24/7 support, any worry big or small.",
        is24h: true,
      },
      {
        name: "Shout",
        phone: null,
        text: "Text SHOUT to 85258",
        url: "https://giveusashout.org",
        description: "Free 24/7 text support across the UK.",
        is24h: true,
      },
    ],
  },
  AU: {
    region: "AU",
    hotlines: [
      {
        name: "Lifeline Australia",
        phone: "131114",
        url: "https://www.lifeline.org.au",
        description: "Free 24/7 crisis support and suicide prevention.",
        is24h: true,
      },
      {
        name: "Beyond Blue",
        phone: "1300224636",
        url: "https://www.beyondblue.org.au",
        description: "24/7 mental health support.",
        is24h: true,
      },
    ],
  },
  CA: {
    region: "CA",
    hotlines: [
      {
        name: "9-8-8 Suicide Crisis Helpline",
        phone: "988",
        text: "Text 988",
        url: "https://988.ca",
        description: "Free, confidential, 24/7. Call or text 988.",
        is24h: true,
      },
    ],
  },
  IN: {
    region: "IN",
    hotlines: [
      {
        name: "iCall",
        phone: "9152987821",
        url: "https://icallhelpline.org",
        description:
          "Free counselling Mon–Sat, 8am–10pm IST. Multiple languages.",
        is24h: false,
      },
      {
        name: "Vandrevala Foundation",
        phone: "18602662345",
        url: "https://www.vandrevalafoundation.com",
        description: "Free 24/7 mental health helpline.",
        is24h: true,
      },
    ],
  },
  BD: {
    region: "BD",
    hotlines: [
      {
        name: "Kaan Pete Roi",
        phone: "9612119911",
        url: "https://kaanpeteroi.org",
        description:
          "Emotional support helpline, daily 3pm–3am Bangladesh time.",
        is24h: false,
      },
    ],
  },
  /**
   * International fallback. Always shown when the user's region is
   * unknown or has no entry. Points to a directory rather than a
   * single number because no global 24/7 line exists.
   */
  INTL: {
    region: "INTL",
    hotlines: [
      {
        name: "Find a helpline near you",
        phone: null,
        url: "https://findahelpline.com",
        description:
          "Free, confidential support directory covering 130+ countries.",
        is24h: true,
      },
      {
        name: "International Association for Suicide Prevention",
        phone: null,
        url: "https://www.iasp.info/resources/Crisis_Centres/",
        description: "Worldwide list of crisis centres by country.",
        is24h: true,
      },
    ],
  },
};

/**
 * Grounding fallback always shown on the crisis screen below the
 * hotline list — gives users *something* to do right now even if
 * they can't bring themselves to call.
 */
export const GROUNDING_5_4_3_2_1 = {
  title: "5-4-3-2-1 grounding",
  description:
    "If calling feels like too much right now, try this first. It takes about a minute.",
  steps: [
    "Name 5 things you can see",
    "Name 4 things you can feel (your feet on the floor, the air on your skin)",
    "Name 3 things you can hear",
    "Name 2 things you can smell",
    "Name 1 thing you can taste",
  ],
};
