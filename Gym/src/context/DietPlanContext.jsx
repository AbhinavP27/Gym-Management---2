import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dietLibrary } from "../data/dietLibrary";

const STORAGE_KEY = "urbangrind-member-diets";
const DietPlanContext = createContext(null);

const normalizeStoredPlans = (plans) => {
  if (!plans || typeof plans !== "object" || Array.isArray(plans)) {
    return {};
  }

  return Object.entries(plans).reduce((accumulator, [memberId, plan]) => {
    if (!plan || typeof plan !== "object") {
      return accumulator;
    }

    const groups =
      plan.groups && typeof plan.groups === "object" && !Array.isArray(plan.groups)
        ? Object.entries(plan.groups).reduce((groupAccumulator, [groupId, group]) => {
            groupAccumulator[groupId] = {
              mealId: group?.mealId ?? groupId,
              mealName: group?.mealName ?? groupId,
              description: group?.description ?? "",
              meals: Array.isArray(group?.meals) ? group.meals : [],
            };
            return groupAccumulator;
          }, {})
        : {};

    accumulator[memberId] = {
      userId: Number(memberId),
      trainerId: Number(plan.trainerId) || null,
      updatedAt: plan.updatedAt ?? null,
      groups,
    };

    return accumulator;
  }, {});
};

const loadDietPlans = () => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {};
    }

    return normalizeStoredPlans(JSON.parse(stored));
  } catch {
    return {};
  }
};

export const DietPlanProvider = ({ children }) => {
  const [plansByMember, setPlansByMember] = useState(() => loadDietPlans());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plansByMember));
    } catch (error) {
      console.error("Failed to persist diet plans", error);
    }
  }, [plansByMember]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      setPlansByMember(loadDietPlans());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const assignDiets = ({ userId, trainerId, mealGroup, meals }) => {
    const memberKey = String(userId);

    setPlansByMember((current) => {
      const currentPlan = current[memberKey] ?? {
        userId,
        trainerId,
        updatedAt: null,
        groups: {},
      };
      const nextGroups = { ...currentPlan.groups };

      if (meals.length > 0) {
        nextGroups[mealGroup.id] = {
          mealId: mealGroup.id,
          mealName: mealGroup.name,
          description: mealGroup.description ?? "",
          meals,
        };
      } else {
        delete nextGroups[mealGroup.id];
      }

      return {
        ...current,
        [memberKey]: {
          userId,
          trainerId,
          updatedAt: new Date().toISOString(),
          groups: nextGroups,
        },
      };
    });
  };

  const value = useMemo(
    () => ({
      mealGroups: dietLibrary,
      plansByMember,
      assignDiets,
    }),
    [plansByMember]
  );

  return <DietPlanContext.Provider value={value}>{children}</DietPlanContext.Provider>;
};

export const useDietPlans = () => {
  const context = useContext(DietPlanContext);

  if (!context) {
    throw new Error("useDietPlans must be used within a DietPlanProvider");
  }

  return context;
};
