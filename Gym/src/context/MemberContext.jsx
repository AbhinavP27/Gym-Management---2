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
      let resolvedPlanId = nextPlanId;

      if (typeof nextPlanId === "string") {
        const trimmed = nextPlanId.trim();
        const numeric = Number(trimmed);
        if (!Number.isFinite(numeric) || numeric <= 0) {
          const plansResponse = await api.get("plans/");
          const matchedPlan = (plansResponse.data || []).find(
            (plan) => String(plan.name || "").trim().toLowerCase() === trimmed.toLowerCase()
          );
          if (!matchedPlan?.id) {
            return {
              ok: false,
              error: `Membership plan '${nextPlanId}' was not found.`,
            };
          }
          resolvedPlanId = matchedPlan.id;
        } else {
          resolvedPlanId = numeric;
        }
      }

      await api.patch(`members/${memberId}/`, { plan: resolvedPlanId });
      await fetchMembers();
      return { ok: true };
    } catch (error) {
      console.error("Failed to update plan", error);
      return {
        ok: false,
        error: error.response?.data?.detail || "Failed to update member plan",
      };
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
      await fetchMembers();
      return { ok: true };
    } catch (error) {
      console.error("Failed to switch trainer", error);
      return {
        ok: false,
        error: error.response?.data?.detail || "Failed to switch trainer",
      };
    }
  };

  const applyMemberOnboarding = async ({ memberId, planValue, trainerId }) => {
    try {
      let resolvedPlanId = planValue;
      if (typeof resolvedPlanId === "string") {
        const trimmed = resolvedPlanId.trim();
        const numeric = Number(trimmed);
        if (!Number.isFinite(numeric) || numeric <= 0) {
          const plansResponse = await api.get("plans/");
          const matchedPlan = (plansResponse.data || []).find(
            (plan) => String(plan.name || "").trim().toLowerCase() === trimmed.toLowerCase()
          );
          if (!matchedPlan?.id) {
            return { ok: false, error: `Membership plan '${planValue}' was not found.` };
          }
          resolvedPlanId = matchedPlan.id;
        } else {
          resolvedPlanId = numeric;
        }
      }

      const payload = {};
      if (resolvedPlanId != null && resolvedPlanId !== "") {
        payload.plan = resolvedPlanId;
      }
      if (trainerId != null && trainerId !== "") {
        payload.trainer = Number(trainerId);
      }

      await api.patch(`members/${memberId}/`, payload);
      await fetchMembers();
      return { ok: true };
    } catch (error) {
      console.error("Failed to apply member onboarding", error);
      return {
        ok: false,
        error: error.response?.data?.detail || "Failed to apply member onboarding",
      };
    }
  };

  const addMemberFeedback = async (memberId, feedbackInput) => {
    try {
      const member = memberRecords.find((item) => item.id === Number(memberId));
      if (!member) {
        return { ok: false, error: "Member not found." };
      }

      const nextEntry = {
        id: `feedback-${Date.now()}`,
        category: feedbackInput?.category || "General",
        rating: Number(feedbackInput?.rating || 5),
        message: String(feedbackInput?.message || "").trim(),
        createdAt: new Date().toISOString(),
      };

      if (!nextEntry.message) {
        return { ok: false, error: "Feedback message is required." };
      }

      const nextFeedback = [...(member.feedback || []), nextEntry];
      await api.patch(`members/${member.id}/`, { feedback: nextFeedback });
      await fetchMembers();

      return { ok: true, feedback: nextEntry };
    } catch (error) {
      console.error("Failed to add feedback", error);
      return {
        ok: false,
        error: error.response?.data?.detail || "Failed to submit feedback",
      };
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
      applyMemberOnboarding,
      addMemberFeedback,
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
