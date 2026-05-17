import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMembers } from "./MemberContext";

const STORAGE_KEY = "urbangrind-plan-change-requests";
const PlanRequestContext = createContext(null);

const normalizeRequestType = (value) => {
  if (value === "new_client") {
    return "new_client";
  }

  if (value === "trainer") {
    return "trainer";
  }

  return "plan";
};

const normalizeDecision = (value) => {
  if (value === "approved") {
    return "approved";
  }

  if (value === "rejected") {
    return "rejected";
  }

  return "pending";
};

const normalizeStatus = (value) => {
  if (value === "approved") {
    return "approved";
  }

  if (value === "rejected") {
    return "rejected";
  }

  return "pending";
};

const getFallbackRequestId = (request) => {
  const memberId = request.memberId ?? "unknown";
  const requestType = normalizeRequestType(request.requestType);
  const createdAt = request.createdAt ?? request.updatedAt ?? "unknown";
  const requestedPlan = request.requestedPlan ?? request.requestedPlanId ?? "none";
  const requestedTrainer = request.requestedTrainerId ?? request.trainerId ?? "none";
  return `request-${requestType}-${memberId}-${createdAt}-${requestedPlan}-${requestedTrainer}`;
};

const normalizePlanRequest = (request) => ({
  id: request.id ?? getFallbackRequestId(request),
  requestType: normalizeRequestType(request.requestType),
  memberId: Number(request.memberId),
  memberName: request.memberName?.trim() ?? "",
  trainerId: request.trainerId == null ? null : Number(request.trainerId),
  trainerName: request.trainerName?.trim() ?? "",
  currentPlan: request.currentPlan?.trim() ?? "",
  currentPlanId: request.currentPlanId == null ? null : Number(request.currentPlanId),
  requestedPlan: request.requestedPlan?.trim() ?? "",
  requestedPlanId: request.requestedPlanId == null ? null : Number(request.requestedPlanId),
  currentTrainerId:
    request.currentTrainerId == null ? null : Number(request.currentTrainerId),
  currentTrainerName: request.currentTrainerName?.trim() ?? "",
  requestedTrainerId:
    request.requestedTrainerId == null ? null : Number(request.requestedTrainerId),
  requestedTrainerName: request.requestedTrainerName?.trim() ?? "",
  status: normalizeStatus(request.status),
  adminDecision: normalizeDecision(request.adminDecision),
  trainerDecision: normalizeDecision(request.trainerDecision),
  createdAt: request.createdAt ?? new Date().toISOString(),
  updatedAt: request.updatedAt ?? request.createdAt ?? new Date().toISOString(),
  resolvedAt: request.resolvedAt ?? null,
});

const loadPlanRequests = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizePlanRequest)
      .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
  } catch {
    return [];
  }
};

export const getDecisionLabel = (decision) => {
  if (decision === "approved") {
    return "Approved";
  }

  if (decision === "rejected") {
    return "Rejected";
  }

  return "Pending";
};

export const getDecisionPillClass = (decision) => {
  if (decision === "approved") {
    return "pill--green";
  }

  if (decision === "rejected") {
    return "pill--red";
  }

  return "pill--amber";
};

export const PlanRequestProvider = ({ children }) => {
  const { updateMemberPlan, switchMemberTrainer, applyMemberOnboarding } = useMembers();
  const [planRequests, setPlanRequests] = useState(() => loadPlanRequests());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(planRequests));
    } catch (error) {
      console.error("Failed to persist plan change requests", error);
    }
  }, [planRequests]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      setPlanRequests(loadPlanRequests());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const submitPlanChangeRequest = ({ member, requestedPlan, requestedPlanId = null }) => {
    if (!member) {
      return {
        ok: false,
        error: "Member account was not found.",
      };
    }

    if (!requestedPlan || member.plan === requestedPlan) {
      return {
        ok: false,
        error: "Choose a different plan before sending a request.",
      };
    }

    if (!member.trainerId || !member.trainer) {
      return {
        ok: false,
        error: "A trainer must be assigned before sending a plan change request.",
      };
    }

    const hasPendingRequest = planRequests.some(
      (request) =>
        request.memberId === member.id &&
        request.requestType === "plan" &&
        request.status === "pending"
    );

    if (hasPendingRequest) {
      return {
        ok: false,
        error: "A plan change request is already pending for this account.",
      };
    }

    const now = new Date().toISOString();
    const nextRequest = normalizePlanRequest({
      id: `plan-request-${member.id}-${Date.now()}`,
      requestType: "plan",
      memberId: member.id,
      memberName: member.name,
      trainerId: member.trainerId,
      trainerName: member.trainer,
      currentPlan: member.plan,
      currentPlanId: member.planId ?? null,
      requestedPlan,
      requestedPlanId,
      status: "pending",
      adminDecision: "pending",
      trainerDecision: "pending",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    });

    setPlanRequests((current) => [nextRequest, ...current]);

    return {
      ok: true,
      request: nextRequest,
    };
  };

  const submitTrainerChangeRequest = ({ member, requestedTrainer }) => {
    if (!member) {
      return {
        ok: false,
        error: "Member account was not found.",
      };
    }

    if (!requestedTrainer?.id || !requestedTrainer?.name) {
      return {
        ok: false,
        error: "Choose a valid trainer before sending a request.",
      };
    }

    if (Number(member.trainerId) === Number(requestedTrainer.id)) {
      return {
        ok: false,
        error: "Choose a different trainer before sending a request.",
      };
    }

    const hasPendingRequest = planRequests.some(
      (request) =>
        request.memberId === member.id &&
        request.requestType === "trainer" &&
        request.status === "pending"
    );

    if (hasPendingRequest) {
      return {
        ok: false,
        error: "A trainer change request is already pending for this account.",
      };
    }

    const now = new Date().toISOString();
    const nextRequest = normalizePlanRequest({
      id: `trainer-request-${member.id}-${Date.now()}`,
      requestType: "trainer",
      memberId: member.id,
      memberName: member.name,
      trainerId: requestedTrainer.id,
      trainerName: requestedTrainer.name,
      currentTrainerId: member.trainerId,
      currentTrainerName: member.trainer,
      requestedTrainerId: requestedTrainer.id,
      requestedTrainerName: requestedTrainer.name,
      status: "pending",
      adminDecision: "pending",
      trainerDecision: "pending",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    });

    setPlanRequests((current) => [nextRequest, ...current]);

    return {
      ok: true,
      request: nextRequest,
    };
  };

  const submitRegistrationApprovalRequests = ({
    member,
    requestedPlan,
    requestedPlanId = null,
    requestedTrainer = null,
  }) => {
    const memberId = Number(member?.id);
    if (!memberId) {
      return {
        ok: false,
        error: "Member account was not found for registration approval.",
      };
    }

    const memberName = member?.name?.trim() || member?.email?.trim() || `Member ${memberId}`;
    const now = new Date().toISOString();
    const existingRequest = planRequests.find(
      (request) => request.memberId === memberId && request.requestType === "new_client"
    );
    if (existingRequest) {
      return {
        ok: false,
        error: "New client approval request already exists for this member.",
      };
    }

    const targetTrainerId = null;
    const targetTrainerName = "";
    const nextRequest = normalizePlanRequest({
      id: `new-client-request-${memberId}-${Date.now()}`,
      requestType: "new_client",
      memberId,
      memberName,
      trainerId: targetTrainerId,
      trainerName: targetTrainerName,
      currentPlan: "Not assigned",
      currentPlanId: null,
      requestedPlan: "",
      requestedPlanId: null,
      currentTrainerId: null,
      currentTrainerName: "Not assigned",
      requestedTrainerId: targetTrainerId,
      requestedTrainerName: targetTrainerName,
      status: "pending",
      adminDecision: "pending",
      trainerDecision: "approved",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    });

    setPlanRequests((current) => [nextRequest, ...current]);

    return {
      ok: true,
      requests: [nextRequest],
    };
  };

  const reviewApprovalRequest = async ({ requestId, actorRole, decision, trainerId = null }) => {
    const normalizedDecision = normalizeDecision(decision);

    if (!["admin", "trainer"].includes(actorRole) || normalizedDecision === "pending") {
      return { ok: false, error: "Invalid review action." };
    }

    let actionResult = { ok: false, error: "Approval request was not found." };
    let approvedPlanChange = null;
    let approvedTrainerChange = null;
    let reapplyPlanChange = null;
    let reapplyTrainerChange = null;

    const nextRequests = planRequests.map((request) => {
      if (String(request.id) !== String(requestId)) {
        return request;
      }

      if (request.status !== "pending") {
        if (request.status === "approved" && normalizedDecision === "approved") {
          if (request.requestType === "trainer") {
            reapplyTrainerChange = {
              memberId: request.memberId,
              trainer: {
                id: request.requestedTrainerId,
                name: request.requestedTrainerName || request.trainerName || "Assigned Trainer",
              },
            };
          } else if (request.requestType === "new_client") {
            if (request.requestedPlanId || request.requestedPlan) {
              reapplyPlanChange = {
                memberId: request.memberId,
                requestedPlan: request.requestedPlan,
                requestedPlanId: request.requestedPlanId,
              };
            }
            if (request.requestedTrainerId) {
              reapplyTrainerChange = {
                memberId: request.memberId,
                trainer: {
                  id: request.requestedTrainerId,
                  name: request.requestedTrainerName || request.trainerName || "Assigned Trainer",
                },
              };
            }
          } else {
            reapplyPlanChange = {
              memberId: request.memberId,
              requestedPlan: request.requestedPlan,
              requestedPlanId: request.requestedPlanId,
            };
          }

          actionResult = { ok: true, request, applied: false, recovered: true };
          return request;
        }

        actionResult = { ok: false, error: "This approval request has already been finalized." };
        return request;
      }

      const assignedTrainerId = request.trainerId ?? request.requestedTrainerId;
      if (actorRole === "trainer" && Number(trainerId) !== Number(assignedTrainerId)) {
        actionResult = { ok: false, error: "Only the assigned trainer can review this request." };
        return request;
      }
      if (actorRole === "admin" && request.adminDecision !== "pending") {
        actionResult = { ok: false, error: "Admin has already reviewed this request." };
        return request;
      }
      if (actorRole === "trainer" && request.trainerDecision !== "pending") {
        actionResult = { ok: false, error: "Trainer has already reviewed this request." };
        return request;
      }

      const now = new Date().toISOString();
      const nextRequest = {
        ...request,
        adminDecision: actorRole === "admin" ? normalizedDecision : request.adminDecision,
        trainerDecision: actorRole === "trainer" ? normalizedDecision : request.trainerDecision,
        updatedAt: now,
      };

      if (normalizedDecision === "rejected") {
        nextRequest.status = "rejected";
        nextRequest.resolvedAt = now;
        actionResult = { ok: true, request: nextRequest, applied: false };
        return nextRequest;
      }

      const effectiveTrainerId = nextRequest.trainerId ?? nextRequest.requestedTrainerId ?? null;
      const trainerApprovalComplete =
        effectiveTrainerId == null || nextRequest.trainerDecision === "approved";

      if (nextRequest.adminDecision === "approved" && trainerApprovalComplete) {
        nextRequest.status = "approved";
        nextRequest.resolvedAt = now;
        if (nextRequest.requestType === "trainer") {
          approvedTrainerChange = {
            memberId: nextRequest.memberId,
            trainer: {
              id: nextRequest.requestedTrainerId,
              name: nextRequest.requestedTrainerName || "Assigned Trainer",
            },
          };
        } else if (nextRequest.requestType === "new_client") {
          if (nextRequest.requestedPlanId || nextRequest.requestedPlan) {
            approvedPlanChange = {
              memberId: nextRequest.memberId,
              requestedPlan: nextRequest.requestedPlan,
              requestedPlanId: nextRequest.requestedPlanId,
            };
          }
          if (nextRequest.requestedTrainerId) {
            approvedTrainerChange = {
              memberId: nextRequest.memberId,
              trainer: {
                id: nextRequest.requestedTrainerId,
                name: nextRequest.requestedTrainerName || nextRequest.trainerName || "Assigned Trainer",
              },
            };
          }
        } else {
          approvedPlanChange = {
            memberId: nextRequest.memberId,
            requestedPlan: nextRequest.requestedPlan,
            requestedPlanId: nextRequest.requestedPlanId,
          };
        }
      }

      actionResult = {
        ok: true,
        request: nextRequest,
        applied: Boolean(approvedPlanChange || approvedTrainerChange),
      };
      return nextRequest;
    });

    if (!actionResult.ok) {
      return actionResult;
    }

    setPlanRequests(nextRequests);

    const applyTasks = [];
    const isNewClientApproval = actionResult.request?.requestType === "new_client";
    if (isNewClientApproval) {
      applyTasks.push(
        applyMemberOnboarding({
          memberId: actionResult.request.memberId,
          planValue:
            actionResult.request.requestedPlanId ?? actionResult.request.requestedPlan ?? null,
          trainerId: actionResult.request.requestedTrainerId ?? null,
        })
      );
    } else {
      if (approvedPlanChange) {
        applyTasks.push(
          updateMemberPlan(
            approvedPlanChange.memberId,
            approvedPlanChange.requestedPlanId ?? approvedPlanChange.requestedPlan
          )
        );
      }
      if (approvedTrainerChange) {
        applyTasks.push(
          switchMemberTrainer(approvedTrainerChange.memberId, approvedTrainerChange.trainer)
        );
      }
    }
    if (reapplyPlanChange) {
      applyTasks.push(
        updateMemberPlan(
          reapplyPlanChange.memberId,
          reapplyPlanChange.requestedPlanId ?? reapplyPlanChange.requestedPlan
        )
      );
    }
    if (reapplyTrainerChange) {
      applyTasks.push(
        switchMemberTrainer(reapplyTrainerChange.memberId, reapplyTrainerChange.trainer)
      );
    }

    if (!applyTasks.length) {
      return actionResult;
    }

    const results = await Promise.all(applyTasks);
    const failed = results.find((result) => result && result.ok === false);
    if (failed) {
      return {
        ...actionResult,
        ok: false,
        error: failed.error || "Approval was saved but member updates failed.",
      };
    }

    return actionResult;
  };

  const removeApprovalRequest = ({ requestId, actorRole, trainerId = null }) => {
    let actionResult = { ok: false, error: "Approval request was not found." };

    const nextRequests = planRequests.filter((request) => {
      if (String(request.id) !== String(requestId)) {
        return true;
      }

      const assignedTrainerId = request.trainerId ?? request.requestedTrainerId;
      if (actorRole === "trainer" && Number(trainerId) !== Number(assignedTrainerId)) {
        actionResult = { ok: false, error: "Only the assigned trainer can remove this request." };
        return true;
      }
      if (!["admin", "trainer"].includes(actorRole)) {
        actionResult = { ok: false, error: "Invalid remove action." };
        return true;
      }

      actionResult = { ok: true, request };
      return false;
    });

    if (actionResult.ok) {
      setPlanRequests(nextRequests);
    }

    return actionResult;
  };

  const value = useMemo(
    () => ({
      planRequests,
      approvalRequests: planRequests,
      getMemberOnboardingRequest: (memberId) =>
        planRequests.find(
          (request) =>
            request.memberId === Number(memberId) && request.requestType === "new_client"
        ) ?? null,
      isMemberOnboardingBlocked: (memberId) => {
        const request = planRequests.find(
          (item) =>
            item.memberId === Number(memberId) && item.requestType === "new_client"
        );
        return Boolean(request && request.status !== "approved");
      },
      submitPlanChangeRequest,
      submitTrainerChangeRequest,
      submitRegistrationApprovalRequests,
      reviewPlanChangeRequest: reviewApprovalRequest,
      reviewApprovalRequest,
      removePlanChangeRequest: removeApprovalRequest,
      removeApprovalRequest,
    }),
    [planRequests]
  );

  return (
    <PlanRequestContext.Provider value={value}>{children}</PlanRequestContext.Provider>
  );
};

export const usePlanRequests = () => {
  const context = useContext(PlanRequestContext);

  if (!context) {
    throw new Error("usePlanRequests must be used within a PlanRequestProvider");
  }

  return context;
};
