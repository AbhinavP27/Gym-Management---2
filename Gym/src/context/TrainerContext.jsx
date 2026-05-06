import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const TrainerContext = createContext(null);

export const TRAINER_STATUSES = ["Active", "Busy", "On Leave"];

export const getTrainerStatusClass = (status) => {
  if (status === "Active") return "pill--green";
  if (status === "Busy") return "pill--blue";
  return "pill--amber";
};

export const TrainerProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrainers = async () => {
    try {
      const response = await api.get("trainers/");
      setTrainers(response.data);
    } catch (error) {
      console.error("Failed to fetch trainers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, [currentUser]);

  const updateTrainerStatus = async (trainerId, status) => {
    try {
      await api.patch(`trainers/${trainerId}/`, { status });
      fetchTrainers();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const saveTrainer = async (trainerData) => {
    try {
      if (trainerData.id) {
        await api.patch(`trainers/${trainerData.id}/`, trainerData);
      } else {
        await api.post("trainers/", trainerData);
      }
      fetchTrainers();
      return { ok: true };
    } catch (error) {
      console.error("Failed to save trainer", error);
      const message = error.response?.data
        ? Object.values(error.response.data).flat().join(" ")
        : "Failed to save trainer";
      return { ok: false, error: message };
    }
  };

  const deleteTrainer = async (trainerId) => {
    try {
      await api.delete(`trainers/${trainerId}/`);
      fetchTrainers();
      return { ok: true };
    } catch (error) {
      console.error("Failed to delete trainer", error);
      return { ok: false, error: "Failed to delete trainer" };
    }
  };

  const value = useMemo(
    () => ({
      trainers,
      loading,
      saveTrainer,
      deleteTrainer,
      updateTrainerStatus,
      refreshTrainers: fetchTrainers
    }),
    [trainers, loading]
  );

  return (
    <TrainerContext.Provider value={value}>{children}</TrainerContext.Provider>
  );
};

export const useTrainerDirectory = () => {
  const context = useContext(TrainerContext);

  if (!context) {
    throw new Error("useTrainerDirectory must be used within a TrainerProvider");
  }

  return context;
};
