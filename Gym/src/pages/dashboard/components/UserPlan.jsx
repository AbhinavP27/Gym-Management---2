import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useMembershipPlans } from "../../../context/MembershipContext";
import { useMembers } from "../../../context/MemberContext";
import {
  getDecisionLabel,
  getDecisionPillClass,
  usePlanRequests,
} from "../../../context/PlanRequestContext";
import "../components/styl/UserPlan.css";
import "../components/styl/DashboardOverview.css";

const UserPlan = ({ userId: userIdProp = null }) => {
  const { userId: userIdParam } = useParams();
  const { plans } = useMembershipPlans();
  const { members } = useMembers();
  const { approvalRequests, submitPlanChangeRequest } = usePlanRequests();
  const userId = Number(userIdParam ?? userIdProp);
  const member = members.find((item) => item.id === userId);

  const latestRequest =
    approvalRequests.find(
      (request) => request.memberId === member?.id && request.requestType === "plan"
    ) ?? null;
  const pendingRequest =
    approvalRequests.find(
      (request) =>
        request.memberId === member?.id &&
        request.requestType === "plan" &&
        request.status === "pending"
    ) ?? null;

  const handlePlanUpdate = (planName) => {
    if (!member || member.plan === planName) {
      return;
    }

    const selectedPlan = plans.find((plan) => plan.name === planName);
    const result = submitPlanChangeRequest({
      member,
      requestedPlan: planName,
      requestedPlanId: selectedPlan?.id ?? null,
    });

    if (!result?.ok) {
      toast.error(result?.error || "Unable to send plan change request.");
      return;
    }

    toast.success(`Plan change request for ${planName} was sent to admin and trainer.`);
  };

  const currentPlan = plans.find((plan) => plan.name === member?.plan);

  return (
    <DashboardLayout role="user">
      <div className="user-plan-page">
        <div className="dashboard-overview__hero">
          <div>
            <p className="eyebrow">User - My Plan</p>
            <h1>Current Membership Plan</h1>
            <p className="subtext">
              Review your current plan and send a change request when you want to move to another
              membership.
            </p>
          </div>
        </div>

        <div className="dashboard-overview__stats">
          <div className="overview-stat">
            <span>Current Plan</span>
            <strong>{member?.plan ?? "N/A"}</strong>
          </div>
          <div className="overview-stat">
            <span>Expiry</span>
            <strong>{member?.expiry ?? "N/A"}</strong>
          </div>
          <div className="overview-stat">
            <span>Trainer</span>
            <strong>{member?.trainer ?? "Not assigned"}</strong>
          </div>
        </div>

        {latestRequest && (
          <section className="dashboard-panel user-plan-request">
            <div className="user-plan-request__head">
              <div>
                <p className="eyebrow">Latest Request</p>
                <h2>
                  {latestRequest.currentPlan} to {latestRequest.requestedPlan}
                </h2>
                <p className="subtext">
                  Sent to admin and {latestRequest.trainerName || "assigned trainer"} for
                  approval.
                </p>
              </div>
              <span className={`pill ${getDecisionPillClass(latestRequest.status)}`}>
                {getDecisionLabel(latestRequest.status)}
              </span>
            </div>

            <div className="user-plan-request__status">
              <div className="user-plan-request__status-item">
                <span>Admin</span>
                <strong>{getDecisionLabel(latestRequest.adminDecision)}</strong>
              </div>
              <div className="user-plan-request__status-item">
                <span>Trainer</span>
                <strong>{getDecisionLabel(latestRequest.trainerDecision)}</strong>
              </div>
              <div className="user-plan-request__status-item">
                <span>Requested On</span>
                <strong>{latestRequest.createdAt.slice(0, 10)}</strong>
              </div>
            </div>

            {pendingRequest && (
              <p className="user-plan-request__note">
                This request is still pending. Your membership changes only after both admin and
                trainer approve it.
              </p>
            )}
          </section>
        )}

        {currentPlan && (
          <section className="dashboard-panel user-plan-current">
            <p className="eyebrow">My Current Plan</p>
            <h2>{currentPlan.name}</h2>
            <p className="user-plan-price">{currentPlan.price}</p>
            <ul className="user-plan-feature-list">
              {currentPlan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="user-plan-grid">
          {plans.map((plan) => {
            const isCurrent = member?.plan === plan.name;
            const isPendingForThisPlan = pendingRequest?.requestedPlan === plan.name;
            const requestBlocked = Boolean(pendingRequest);
            const actionLabel = isCurrent
              ? "Current Plan"
              : isPendingForThisPlan
              ? "Request Pending"
              : requestBlocked
              ? "Request In Review"
              : "Request Plan Change";

            return (
              <article
                key={plan.id}
                className={`user-plan-card ${isCurrent ? "user-plan-card--active" : ""}`}
              >
                <div className="user-plan-card__head">
                  <div>
                    <h3>{plan.name}</h3>
                    <p>{plan.price}</p>
                  </div>
                  {plan.popular && <span className="pill pill--amber">Popular</span>}
                </div>

                <div className="user-plan-badges">
                  {plan.trainerRequired && <span className="user-plan-badge">Trainer Included</span>}
                  {isCurrent && <span className="user-plan-badge user-plan-badge--active">Current Plan</span>}
                </div>

                <ul className="user-plan-feature-list">
                  {plan.features.map((feature) => (
                    <li key={`${plan.id}-${feature}`}>{feature}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="user-plan-action"
                  disabled={isCurrent || requestBlocked}
                  onClick={() => handlePlanUpdate(plan.name)}
                >
                  {actionLabel}
                </button>
              </article>
            );
          })}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default UserPlan;
