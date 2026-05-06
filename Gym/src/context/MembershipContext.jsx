import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const MembershipContext = createContext(null);

export const MembershipProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      const response = await api.get("plans/");
      setPlans(response.data);
    } catch (error) {
      console.error("Failed to fetch plans", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [currentUser]);

  const savePlan = async (planData) => {
    try {
      if (planData.id) {
        await api.put(`plans/${planData.id}/`, planData);
      } else {
        await api.post("plans/", planData);
      }
      fetchPlans();
      return { ok: true };
    } catch (error) {
      console.error("Failed to save plan", error);
      return { ok: false, error: "Failed to save plan" };
    }
  };

  const deletePlan = async (planId) => {
    try {
      await api.delete(`plans/${planId}/`);
      fetchPlans();
      return { ok: true };
    } catch (error) {
      console.error("Failed to delete plan", error);
      return { ok: false, error: "Failed to delete plan" };
    }
  };

  const value = useMemo(
    () => ({
      plans,
      loading,
      savePlan,
      deletePlan,
      refreshPlans: fetchPlans
    }),
    [plans, loading]
  );

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
};

export const useMembershipPlans = () => {
  const context = useContext(MembershipContext);

  if (!context) {
    throw new Error("useMembershipPlans must be used within a MembershipProvider");
  }

  return context;
};
