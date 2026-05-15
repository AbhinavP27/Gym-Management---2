import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const MemberContext = createContext(null);

export const MemberProvider = ({ children }) => {
  const [memberRecords, setMemberRecords] = useState([]);
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      const response = await api.get("members/");
      setMemberRecords(response.data);
    } catch (error) {
      console.error("Failed to fetch members", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMembers();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const members = useMemo(
    () => memberRecords,
    [memberRecords]
  );

  const updateMemberPlan = async (memberId, nextPlanId) => {
    try {
      await api.patch(`members/${memberId}/`, { plan: nextPlanId });
      fetchMembers();
    } catch (error) {
      console.error("Failed to update plan", error);
    }
  };

  const updateMemberProfile = async (memberId, updates) => {
    try {
      await api.patch(`members/${memberId}/`, updates);
      await fetchMembers();
      return { ok: true };
    } catch (error) {
      console.error("Failed to update profile", error);
      return {
        ok: false,
        error:
          error.response?.data?.detail ||
          "Failed to update profile",
      };
    }
  };

  const removeMemberFeedback = async ({ memberId, feedbackId }) => {
    try {
      const member = memberRecords.find(m => m.id === memberId);
      if (!member) return;
      const updatedFeedback = member.feedback.filter(f => f.id !== feedbackId);
      await api.patch(`members/${memberId}/`, { feedback: updatedFeedback });
      fetchMembers();
    } catch (error) {
      console.error("Failed to remove feedback", error);
    }
  };

  const switchMemberTrainer = async (memberId, trainer) => {
    try {
      if (!trainer?.id) {
        throw new Error("Invalid trainer selected.");
      }
      await api.patch(`members/${memberId}/`, { trainer: trainer.id });
      fetchMembers();
    } catch (error) {
      console.error("Failed to switch trainer", error);
    }
  };

  const deleteMemberAccount = async (memberId) => {
    try {
      await api.delete(`members/${memberId}/`);
      fetchMembers();
    } catch (error) {
      console.error("Failed to delete member", error);
    }
  };

  const sendPlanReminder = async (memberId) => {
    try {
      await api.post(`members/${memberId}/remind_plan/`);
      return { ok: true };
    } catch (error) {
      console.error("Failed to send reminder", error);
      return { ok: false, error: "Failed to send reminder" };
    }
  };

  const getMemberById = (memberId) =>
    memberRecords.find((member) => member.id === Number(memberId)) ?? null;

  const isEmailTaken = (email) => {
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    if (!normalizedEmail) return false;
    return memberRecords.some(
      (member) => member.email?.trim().toLowerCase() === normalizedEmail
    );
  };

  const registerMember = async (memberData) => {
    try {
      // This would ideally call a custom registration endpoint
      // For now, we'll assume a standard POST to members/
      const response = await api.post("members/", memberData);
      if (currentUser) {
        fetchMembers();
      }
      return {
        ok: true,
        member: response.data,
      };
    } catch (error) {
      console.error("Registration failed", error);
      const errorData = error.response?.data;
      const parsedError =
        typeof errorData === "string"
          ? errorData
          : errorData?.detail ||
            Object.values(errorData ?? {})
              .flat()
              .join(" ")
              .trim();
      return {
        ok: false,
        error: parsedError || "Registration failed",
      };
    }
  };

  const value = useMemo(
    () => ({
      members: memberRecords.filter(m => !m.isDeleted),
      allMembers: memberRecords,
      loading,
      getMemberById,
      isEmailTaken,
      registerMember,
      updateMemberPlan,
      switchMemberTrainer,
      updateMemberProfile,
      deleteMemberAccount,
      removeMemberFeedback,
      sendPlanReminder,
      refreshMembers: fetchMembers
    }),
    [memberRecords, loading]
  );

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
};

export const useMembers = () => {
  const context = useContext(MemberContext);

  if (!context) {
    throw new Error("useMembers must be used within a MemberProvider");
  }

  return context;
};
