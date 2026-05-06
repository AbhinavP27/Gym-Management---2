import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { workoutLibrary } from "../data/workoutLibrary";

const STORAGE_KEY = "urbangrind-member-workouts";
const WorkoutPlanContext = createContext(null);

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
              muscleId: group?.muscleId ?? groupId,
              muscleName: group?.muscleName ?? groupId,
              description: group?.description ?? "",
              workouts: Array.isArray(group?.workouts) ? group.workouts : [],
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

const loadWorkoutPlans = () => {
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

export const WorkoutPlanProvider = ({ children }) => {
  const [plansByMember, setPlansByMember] = useState(() => loadWorkoutPlans());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plansByMember));
    } catch (error) {
      console.error("Failed to persist workout plans", error);
    }
  }, [plansByMember]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      setPlansByMember(loadWorkoutPlans());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const assignWorkouts = ({ userId, trainerId, muscleGroup, workouts }) => {
    const memberKey = String(userId);

    setPlansByMember((current) => {
      const currentPlan = current[memberKey] ?? {
        userId,
        trainerId,
        updatedAt: null,
        groups: {},
      };
      const nextGroups = { ...currentPlan.groups };

      if (workouts.length > 0) {
        nextGroups[muscleGroup.id] = {
          muscleId: muscleGroup.id,
          muscleName: muscleGroup.name,
          description: muscleGroup.description ?? "",
          workouts,
        };
      } else {
        delete nextGroups[muscleGroup.id];
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
      muscleGroups: workoutLibrary,
      plansByMember,
      assignWorkouts,
    }),
    [plansByMember]
  );

  return (
    <WorkoutPlanContext.Provider value={value}>
      {children}
    </WorkoutPlanContext.Provider>
  );
};

export const useWorkoutPlans = () => {
  const context = useContext(WorkoutPlanContext);

  if (!context) {
    throw new Error("useWorkoutPlans must be used within a WorkoutPlanProvider");
  }

  return context;
};
