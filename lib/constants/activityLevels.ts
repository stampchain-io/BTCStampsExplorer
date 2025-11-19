/**
 * Activity level constants for stamps
 */
export const ActivityLevel = {
  HOT: "HOT",
  WARM: "WARM",
  COOL: "COOL",
  DORMANT: "DORMANT",
  COLD: "COLD",
} as const;

export type ActivityLevelType =
  typeof ActivityLevel[keyof typeof ActivityLevel];
