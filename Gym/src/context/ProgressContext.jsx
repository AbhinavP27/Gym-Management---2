import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { members as initialMembers } from "../data/dashboard";

const STORAGE_KEY = "urbangrind-progress-tracking";
const ProgressContext = createContext(null);
const DEFAULT_HISTORY_DATES = ["2025-12-01", "2026-01-01", "2026-02-01", "2026-03-01"];

export const GOAL_OPTIONS = ["Weight Loss", "Weight Gain", "Maintain"];

export const calculateBmi = (heightCm, weightKg) => {
  const normalizedHeight = Number(heightCm) / 100;
  const normalizedWeight = Number(weightKg);

  if (!normalizedHeight || !normalizedWeight) {
    return 0;
  }

  return Number((normalizedWeight / (normalizedHeight * normalizedHeight)).toFixed(1));
};

const buildDefaultHistory = (member, index) => {
  const heightCm = 158 + ((index * 3) % 22);
  const currentWeight = 56 + ((index * 5) % 26);
  const goal = GOAL_OPTIONS[index % GOAL_OPTIONS.length];
  const trendStep =
    goal === "Weight Gain" ? 1.8 : goal === "Weight Loss" ? -1.8 : 0.15;

  return {
    memberId: member.id,
    goal,
    updatedAt: "2026-03-01",
    history: DEFAULT_HISTORY_DATES.map((date, dateIndex) => {
      const fluctuation = goal === "Maintain" ? [0.3, -0.2, 0.2, 0][dateIndex] : 0;
      const weightKg = Number(
        (currentWeight - trendStep * (DEFAULT_HISTORY_DATES.length - 1 - dateIndex) + fluctuation).toFixed(1)
      );
      return {
        id: `${member.id}-${date}`,
        date,
        weightKg,
        heightCm,
        bmi: calculateBmi(heightCm, weightKg),
      };
    }),
  };
};

const isLegacySeededProgress = (progress) =>
  progress?.updatedAt === "2026-03-01" &&
  progress.history?.length === DEFAULT_HISTORY_DATES.length &&
  progress.history.every((entry, index) => entry.date === DEFAULT_HISTORY_DATES[index]);

const migrateLegacyProgress = (progressMap) =>
  Object.entries(progressMap).reduce((accumulator, [memberId, progress]) => {
    const memberIndex = initialMembers.findIndex(
      (member) => String(member.id) === String(memberId)
    );

    if (memberIndex === -1 || !isLegacySeededProgress(progress)) {
      accumulator[memberId] = progress;
      return accumulator;
    }

    accumulator[memberId] = buildDefaultHistory(initialMembers[memberIndex], memberIndex);
    return accumulator;
  }, {});

const normalizeProgressMap = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((accumulator, [memberId, progress]) => {
    if (!progress || typeof progress !== "object") {
      return accumulator;
    }

    const history = Array.isArray(progress.history)
      ? progress.history
          .map((entry) => {
            const heightCm = Number(entry.heightCm);
            const weightKg = Number(entry.weightKg);
            const date = entry.date ?? "";
            return {
              id: entry.id ?? `${memberId}-${date}`,
              date,
              weightKg,
              heightCm,
              bmi: calculateBmi(heightCm, weightKg),
            };
          })
          .filter((entry) => entry.date && entry.heightCm > 0 && entry.weightKg > 0)
          .sort((first, second) => first.date.localeCompare(second.date))
      : [];

    accumulator[memberId] = {
      memberId: Number(memberId),
      goal: GOAL_OPTIONS.includes(progress.goal) ? progress.goal : GOAL_OPTIONS[0],
      updatedAt: progress.updatedAt ?? null,
      history,
    };

    return accumulator;
  }, {});
};

const loadProgress = () => {
  const fallback = initialMembers.reduce((accumulator, member, index) => {
    accumulator[String(member.id)] = buildDefaultHistory(member, index);
    return accumulator;
  }, {});

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return fallback;
    }

    const parsed = normalizeProgressMap(JSON.parse(stored));
    return Object.keys(parsed).length ? migrateLegacyProgress(parsed) : fallback;
  } catch {
    return fallback;
  }
};

export const ProgressProvider = ({ children }) => {
  const [progressByMember, setProgressByMember] = useState(() => loadProgress());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progressByMember));
    } catch (error) {
      console.error("Failed to persist progress data", error);
    }
  }, [progressByMember]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      setProgressByMember(loadProgress());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const saveProgressEntry = ({ memberId, date, weightKg, heightCm, goal }) => {
    const key = String(memberId);
    const bmi = calculateBmi(heightCm, weightKg);

    setProgressByMember((current) => {
      const existing = current[key] ?? {
        memberId,
        goal: GOAL_OPTIONS[0],
        updatedAt: null,
        history: [],
      };
      const nextEntry = {
        id: `${memberId}-${date}`,
        date,
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        bmi,
      };
      const withoutSameDate = existing.history.filter((entry) => entry.date !== date);
      const history = [...withoutSameDate, nextEntry].sort((first, second) =>
        first.date.localeCompare(second.date)
      );

      return {
        ...current,
        [key]: {
          memberId,
          goal: GOAL_OPTIONS.includes(goal) ? goal : existing.goal,
          updatedAt: new Date().toISOString(),
          history,
        },
      };
    });
  };

  const value = useMemo(
    () => ({
      progressByMember,
      saveProgressEntry,
    }),
    [progressByMember]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
};

export const useProgressTracking = () => {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error("useProgressTracking must be used within a ProgressProvider");
  }

  return context;
};
