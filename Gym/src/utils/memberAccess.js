const TRAINER_ENABLED_PLANS = new Set(["Gold", "Diamond"]);

export const hasTrainerAccess = (plan = "") =>
  TRAINER_ENABLED_PLANS.has(String(plan).trim());

