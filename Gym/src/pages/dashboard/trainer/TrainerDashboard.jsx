import { useMemo } from "react";
import toast from "react-hot-toast";
import { FaTrash } from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import { Link, useParams } from "react-router-dom";
import {
  getTrainerStatusClass,
  TRAINER_STATUSES,
  useTrainerDirectory,
} from "../../../context/TrainerContext";
import {
  getDecisionLabel,
  getDecisionPillClass,
  usePlanRequests,
} from "../../../context/PlanRequestContext";
import "../components/styl/DashboardOverview.css";
import "../components/styl/WorkoutPlans.css";
import "../components/styl/Profile.css";

const getRequestHeadline = (request) =>
  request.requestType === "new_client"
    ? `Membership: ${request.requestedPlan || "Not selected"} | Trainer: ${request.requestedTrainerName || "Not assigned"}`
    : request.requestType === "trainer"
    ? `${request.currentTrainerName || "No trainer"} to ${request.requestedTrainerName}`
    : `${request.currentPlan} to ${request.requestedPlan}`;

const getRequestTypeLabel = (request) =>
  request.requestType === "new_client"
    ? "New Client"
    : request.requestType === "trainer"
    ? "Trainer Change"
    : "Plan Change";

const TrainerDashboard = ({ userId = null }) => {
  const { trainerId: trainerIdParam } = useParams();
  const { trainers, updateTrainerStatus } = useTrainerDirectory();
  const { approvalRequests, reviewApprovalRequest, removeApprovalRequest } = usePlanRequests();
  const trainerId = Number(trainerIdParam ?? userId);
  const trainer = trainers.find((item) => item.id === trainerId);
  const trainerPlanRequests = useMemo(
    () =>
      approvalRequests.filter(
        (request) => (request.trainerId ?? request.requestedTrainerId) === trainerId
      ),
    [approvalRequests, trainerId]
  );
  const pendingPlanRequests = trainerPlanRequests.filter(
    (request) => request.status === "pending"
  );

  const handlePlanRequestReview = async (requestId, decision) => {
    const result = await reviewApprovalRequest({
      requestId,
      actorRole: "trainer",
      decision,
      trainerId,
    });

    if (!result?.ok) {
      toast.error(result?.error || "Unable to review plan change request.");
      return;
    }

    if (decision === "approved") {
      if (result.recovered) {
        toast.success("Request was already approved. Member membership/trainer sync was retried.");
        return;
      }

      toast.success(
        result.applied
          ? result.request?.requestType === "new_client"
            ? "Trainer approved the new client request and membership is now active."
            : result.request?.requestType === "trainer"
            ? "Trainer approved the request and the member assignment was updated."
            : "Trainer approved the request and the member plan was updated."
          : "Trainer approved the request. Waiting for admin approval."
      );
      return;
    }

    toast.success(
      result.request?.requestType === "new_client"
        ? "New client request rejected by trainer."
        : result.request?.requestType === "trainer"
        ? "Trainer change request rejected by trainer."
        : "Plan change request rejected by trainer."
    );
  };

  const handlePlanRequestRemove = (request) => {
    const result = removeApprovalRequest({
      requestId: request.id,
      actorRole: "trainer",
      trainerId,
    });

    if (!result?.ok) {
      toast.error(result?.error || "Unable to remove plan change request.");
      return;
    }

    toast.success(`${getRequestTypeLabel(request)} from ${request.memberName} removed.`);
  };

  if (!trainer) {
    return (
      <DashboardLayout role="trainer">
        <div className="dashboard-overview">
          <div className="dashboard-overview__hero">
            <div>
              <p className="eyebrow">Trainer Dashboard</p>
              <h1>Trainer Not Found</h1>
              <p className="subtext">
                No trainer profile is connected to this dashboard route.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="trainer">
      <div className="dashboard-overview">
        <div className="dashboard-overview__hero">
          <div>
            <p className="eyebrow">Trainer Dashboard</p>
            <h1>{trainer.name}</h1>
            {/* <p className="subtext">
              Update your status manually. The admin dashboard uses the same value.
            </p> */}
          </div>
          <span className={`pill ${getTrainerStatusClass(trainer.status)}`}>
            {trainer.status}
          </span>
        </div>

        <div className="dashboard-overview__stats">
          <div className="overview-stat">
            <span>Specialization</span>
            <strong>{trainer.specialization}</strong>
          </div>
          <div className="overview-stat">
            <span>Eligible Members</span>
            <strong>{trainer.members}</strong>
          </div>
          <div className="overview-stat">
            <span>Pending Requests</span>
            <strong>{pendingPlanRequests.length}</strong>
          </div>
        </div>

        <div className="dashboard-panel">
          <p className="eyebrow">Status Control</p>
          <h2>Set Your Availability</h2>
          <p className="subtext">
            This does not change automatically. Your selection stays active until you update it.
          </p>

          <div className="status-editor">
            <label htmlFor="trainer-status">Current status</label>
            <select
              id="trainer-status"
              value={trainer.status}
              onChange={(event) => updateTrainerStatus(trainer.id, event.target.value)}
            >
              {TRAINER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="dashboard-panel">
          <p className="eyebrow">Approval Requests</p>
          <h2>Member Approval Queue</h2>
          <p className="subtext">
            Review requests routed to you. Trainer changes and plan changes apply only after both
            trainer and admin approve them.
          </p>

          <div className="admin-feedback-list">
            {trainerPlanRequests.map((request) => (
              <article key={request.id} className="admin-feedback-item">
                <div className="admin-feedback-item__meta">
                  <div>
                    <strong>{request.memberName}</strong>
                    <small> {getRequestTypeLabel(request)} | {getRequestHeadline(request)}</small>
                  </div>
                  <div className="admin-feedback-item__actions">
                    <span className={`pill ${getDecisionPillClass(request.status)}`}>
                      {getDecisionLabel(request.status)}
                    </span>
                    <button
                      type="button"
                      className="admin-item-remove"
                      aria-label={`Remove approval request from ${request.memberName}`}
                      onClick={() => handlePlanRequestRemove(request)}
                    >
                      <FaTrash aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="approval-meta">
                  <span>Admin: {getDecisionLabel(request.adminDecision)}</span>
                  <span>Trainer: {getDecisionLabel(request.trainerDecision)}</span>
                  <span>{new Date(request.createdAt).toISOString().slice(0, 10)}</span>
                </div>

                {request.status === "pending" && request.trainerDecision === "pending" ? (
                  <div className="approval-action-row">
                    <button
                      type="button"
                      className="approval-action approval-action--approve"
                      onClick={() => handlePlanRequestReview(request.id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="approval-action approval-action--reject"
                      onClick={() => handlePlanRequestReview(request.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <small>
                    {request.status === "approved"
                      ? request.requestType === "new_client"
                        ? "This new client is fully approved and now active."
                        : request.requestType === "trainer"
                        ? "This request has been fully approved and the trainer assignment is now active."
                        : "This request has been fully approved and the plan is now active."
                      : request.status === "rejected"
                      ? "This request was rejected."
                      : "Trainer has already reviewed this request. Waiting for admin action."}
                  </small>
                )}
              </article>
            ))}

            {trainerPlanRequests.length === 0 && (
              <div className="admin-feedback-empty">
                No approval requests have been sent to this trainer yet.
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-panel">
          <p className="eyebrow">Diet Plans</p>
          <h2>Assign Meal Plans</h2>
          <p className="subtext">
            Push breakfast, lunch, pre-workout, and dinner recommendations to your assigned
            members from the diet planner.
          </p>
          <Link to={`/trainer/${trainer.id}/diets`} className="workout-link">
            Open Diet Planner
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TrainerDashboard;
