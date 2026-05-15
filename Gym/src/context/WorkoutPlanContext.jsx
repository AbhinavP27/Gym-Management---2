import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { workoutLibrary } from "../data/workoutLibrary";
import api from "../services/api";
import { useAuth } from "./AuthContext";

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

const normalizeApiPlans = (plans) => {
  if (!Array.isArray(plans)) {
    return {};
  }

  return plans.reduce((accumulator, plan) => {
    if (!plan || typeof plan !== "object" || !plan.member) {
      return accumulator;
    }

    const groups = plan?.data?.groups && typeof plan.data.groups === "object" && !Array.isArray(plan.data.groups)
      ? Object.entries(plan.data.groups).reduce((groupAccumulator, [groupId, group]) => {
          if (!group || typeof group !== "object") {
            return groupAccumulator;
          }
          groupAccumulator[groupId] = {
            muscleId: group?.muscleId ?? groupId,
            muscleName: group?.muscleName ?? groupId,
            description: group?.description ?? "",
            workouts: Array.isArray(group?.workouts) ? group.workouts : [],
          };
          return groupAccumulator;
        }, {})
      : {};

    accumulator[String(plan.member)] = {
      id: plan.id,
      userId: Number(plan.member),
      trainerId: plan.trainer ?? null,
      updatedAt: plan.updated_at ?? plan.updatedAt ?? null,
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
  const { currentUser } = useAuth();
  const [plansByMember, setPlansByMember] = useState(() => loadWorkoutPlans());

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const fetchPlans = async () => {
      try {
        const response = await api.get("workouts/");
        const serverPlans = normalizeApiPlans(response.data);
        setPlansByMember(serverPlans);
      } catch (error) {
        console.error("Failed to load workout plans", error);
      }
    };

    fetchPlans();
  }, [currentUser]);

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

  const assignWorkouts = async ({ userId, trainerId, muscleGroup, workouts }) => {
    const memberKey = String(userId);
    const currentPlan = plansByMember[memberKey] ?? {
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

    const nextPlan = {
      userId,
      trainerId,
      updatedAt: new Date().toISOString(),
      groups: nextGroups,
    };

    try {
      await api.post("workouts/", {
        member: userId,
        data: { groups: nextGroups },
      });
      setPlansByMember((current) => ({
        ...current,
        [memberKey]: nextPlan,
      }));
    } catch (error) {
      console.error("Failed to save workout plan", error);
      throw error;
    }
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
