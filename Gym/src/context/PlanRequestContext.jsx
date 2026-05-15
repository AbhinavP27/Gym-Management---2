import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMembers } from "./MemberContext";

const STORAGE_KEY = "urbangrind-plan-change-requests";
const PlanRequestContext = createContext(null);

const normalizeRequestType = (value) => {
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

const normalizePlanRequest = (request) => ({
  id: request.id ?? `plan-request-${Date.now()}`,
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
  const { updateMemberPlan, switchMemberTrainer } = useMembers();
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

  const reviewApprovalRequest = ({
    requestId,
    actorRole,
    decision,
    trainerId = null,
  }) => {
    const normalizedDecision = normalizeDecision(decision);

    if (!["admin", "trainer"].includes(actorRole) || normalizedDecision === "pending") {
      return {
        ok: false,
        error: "Invalid review action.",
      };
    }

    let actionResult = {
      ok: false,
      error: "Approval request was not found.",
    };
    let approvedPlanChange = null;
    let approvedTrainerChange = null;

    setPlanRequests((current) =>
      current.map((request) => {
        if (request.id !== requestId) {
          return request;
        }

        if (request.status !== "pending") {
          actionResult = {
            ok: false,
            error: "This approval request has already been finalized.",
          };
          return request;
        }

        if (actorRole === "trainer" && Number(trainerId) !== request.trainerId) {
          actionResult = {
            ok: false,
            error: "Only the assigned trainer can review this request.",
          };
          return request;
        }

        if (actorRole === "admin" && request.adminDecision !== "pending") {
          actionResult = {
            ok: false,
            error: "Admin has already reviewed this request.",
          };
          return request;
        }

        if (actorRole === "trainer" && request.trainerDecision !== "pending") {
          actionResult = {
            ok: false,
            error: "Trainer has already reviewed this request.",
          };
          return request;
        }

        const now = new Date().toISOString();
        const nextRequest = {
          ...request,
          adminDecision:
            actorRole === "admin" ? normalizedDecision : request.adminDecision,
          trainerDecision:
            actorRole === "trainer" ? normalizedDecision : request.trainerDecision,
          updatedAt: now,
        };

        if (normalizedDecision === "rejected") {
          nextRequest.status = "rejected";
          nextRequest.resolvedAt = now;
          actionResult = {
            ok: true,
            request: nextRequest,
            applied: false,
          };
          return nextRequest;
        }

        if (
          nextRequest.adminDecision === "approved" &&
          nextRequest.trainerDecision === "approved"
        ) {
          nextRequest.status = "approved";
          nextRequest.resolvedAt = now;
          if (nextRequest.requestType === "trainer") {
            approvedTrainerChange = {
              memberId: nextRequest.memberId,
              trainer: {
                id: nextRequest.requestedTrainerId,
                name: nextRequest.requestedTrainerName,
              },
            };
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
      })
    );

    if (approvedPlanChange) {
      updateMemberPlan(
        approvedPlanChange.memberId,
        approvedPlanChange.requestedPlanId ?? approvedPlanChange.requestedPlan
      );
    }

    if (approvedTrainerChange) {
      switchMemberTrainer(approvedTrainerChange.memberId, approvedTrainerChange.trainer);
    }

    return actionResult;
  };

  const removeApprovalRequest = ({ requestId, actorRole, trainerId = null }) => {
    let actionResult = {
      ok: false,
      error: "Approval request was not found.",
    };

    setPlanRequests((current) =>
      current.filter((request) => {
        if (request.id !== requestId) {
          return true;
        }

        if (actorRole === "trainer" && Number(trainerId) !== request.trainerId) {
          actionResult = {
            ok: false,
            error: "Only the assigned trainer can remove this request.",
          };
          return true;
        }

        if (!["admin", "trainer"].includes(actorRole)) {
          actionResult = {
            ok: false,
            error: "Invalid remove action.",
          };
          return true;
        }

        actionResult = {
          ok: true,
          request,
        };
        return false;
      })
    );

    return actionResult;
  };

  const value = useMemo(
    () => ({
      planRequests,
      approvalRequests: planRequests,
      submitPlanChangeRequest,
      submitTrainerChangeRequest,
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
