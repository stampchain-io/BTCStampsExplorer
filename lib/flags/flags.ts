const FLAGS = {
  /*
   * Flag will toggle the new filtering experience
   */
  "NEW_ART_STAMP_FILTERS": true,
};

type FlagKeys = keyof typeof FLAGS;

export const flags = {
  getBooleanFlag: (flag: FlagKeys, defaultValue: boolean) => {
    return !!FLAGS[flag] || defaultValue;
  },
  // getStringFlag: (flag: "ART_STAMP_FILTERS", defaultValue: "old" | "new") => "old" | "new",
  getStringFlag: (flag: FlagKeys, defaultValue: string) => {
    return FLAGS[flag] || defaultValue;
  },
};
