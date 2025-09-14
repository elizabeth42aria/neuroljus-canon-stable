export type NLProfile = {
  id: string;
  alias?: string;
  preferences?: {
    communication_modes?: string[];
    calming_strategies?: string[];
    avoid_strategies?: string[];
    known_triggers?: string[];
  };
  consent?: { use_signals?: boolean; share_with_clinician?: boolean };
};

export const MOCK_PROFILE: NLProfile = {
  id: "demo-001",
  alias: "A.",
  preferences: {
    communication_modes: ["short-text"],
    calming_strategies: ["low-light", "quiet-corner"],
    avoid_strategies: ["crowded-places"],
    known_triggers: ["sudden-noise"]
  },
  consent: { use_signals: true, share_with_clinician: false }
};