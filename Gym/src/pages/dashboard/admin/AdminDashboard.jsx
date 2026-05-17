import { useMemo } from "react";
import toast from "react-hot-toast";
import { FaTrash } from "react-icons/fa";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardLayout from "../layouts/DashboardLayout";
import "../components/styl/DashboardOverview.css";
import "../components/styl/Members.css";
import "../components/styl/Profile.css";
import { useConsultations } from "../../../context/ConsultationContext";
import { useMembers } from "../../../context/MemberContext";
import { useMembershipPlans } from "../../../context/MembershipContext";
import {
  getDecisionLabel,
  getDecisionPillClass,
  usePlanRequests,
} from "../../../context/PlanRequestContext";
import { useTrainerDirectory } from "../../../context/TrainerContext";

const getRequestHeadline = (request) =>
  request.requestType === "new_client"
    ? "Registration pending admin approval"
    : request.requestType === "trainer"
    ? `${request.currentTrainerName || "No trainer"} to ${request.requestedTrainerName}`
    : `${request.currentPlan} to ${request.requestedPlan}`;

const getRequestTypeLabel = (request) =>
  request.requestType === "new_client"
    ? "New Client"
    : request.requestType === "trainer"
    ? "Trainer Change"
    : "Plan Change";

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const formatCurrency = (value) =>
  `Rs ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value)}`;

const formatAxisCurrency = (value) =>
  value >= 1000 ? `Rs ${Math.round(value / 1000)}k` : `Rs ${value}`;

const parsePrice = (priceLabel = "") =>
  Number(priceLabel.replace(/[^0-9.]/g, "")) || 0;

const PLAN_COLORS = ["#38bdf8", "#22c55e", "#f59e0b", "#f97316", "#a855f7"];

const AdminDashboard = () => {
  const { members, allMembers, removeMemberFeedback } = useMembers();
  const { plans } = useMembershipPlans();
  const { trainers } = useTrainerDirectory();
  const { consultationRequests, removeConsultationRequest } = useConsultations();
  const { approvalRequests, reviewApprovalRequest, removeApprovalRequest } = usePlanRequests();

  const feedbackEntries = useMemo(
    () =>
      allMembers
        .flatMap((member) =>
          (member.feedback || []).map((entry) => ({
            ...entry,
            memberId: member.id,
            memberName: member.name || "Unknown Member",
            trainer: member.trainer || "Not assigned",
            isDeleted: member.isDeleted,
          }))
        )
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt)),
    [allMembers]
  );

  const deletedAccounts = useMemo(
    () => allMembers.filter((member) => member.isDeleted).length,
    [allMembers]
  );

  const planMetrics = useMemo(
    () =>
      plans.map((plan) => {
        const activeMembers = members.filter((member) => member.plan === plan.name).length;
        const monthlyRevenue = activeMembers * parsePrice(plan.price);

        return {
          name: plan.name,
          members: activeMembers,
          revenue: monthlyRevenue,
        };
      }),
    [members, plans]
  );

  const monthlyRevenue = useMemo(
    () => planMetrics.reduce((total, item) => total + item.revenue, 0),
    [planMetrics]
  );
  const pendingPlanRequests = useMemo(
    () => approvalRequests.filter((request) => request.status === "pending"),
    [approvalRequests]
  );

  const revenueChartData = useMemo(
    () =>
      planMetrics.map((item) => ({
        name: item.name,
        revenue: item.revenue,
      })),
    [planMetrics]
  );

  const membershipChartData = useMemo(
    () =>
      planMetrics.map((item) => ({
        name: item.name,
        members: item.members,
      })),
    [planMetrics]
  );

  const handleConsultationRemove = (requestId) => {
    removeConsultationRequest(requestId);
    toast.success("Consultation request removed.");
  };

  const handleFeedbackRemove = (entry) => {
    removeMemberFeedback({
      memberId: entry.memberId,
      feedbackId: entry.id,
      createdAt: entry.createdAt,
    });
    toast.success("Feedback removed.");
  };

  const handlePlanRequestReview = async (requestId, decision) => {
    const result = await reviewApprovalRequest({
      requestId,
      actorRole: "admin",
      decision,
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
            ? "Admin approved the new client request and membership is now active."
            : result.request?.requestType === "trainer"
            ? "Admin approved the request and the trainer assignment was updated."
            : "Admin approved the request and the plan was updated."
          : "Admin approved the request. Waiting for trainer approval."
      );
      return;
    }

    toast.success(
      result.request?.requestType === "new_client"
        ? "New client request rejected by admin."
        : result.request?.requestType === "trainer"
        ? "Trainer change request rejected by admin."
        : "Plan change request rejected by admin."
    );
  };

  const handlePlanRequestRemove = (request) => {
    const result = removeApprovalRequest({
      requestId: request.id,
      actorRole: "admin",
    });

    if (!result?.ok) {
      toast.error(result?.error || "Unable to remove plan change request.");
      return;
    }

    toast.success(`${getRequestTypeLabel(request)} from ${request.memberName} removed.`);
  };

  return (
    <DashboardLayout role="admin">
      <div className="dashboard-overview">
        <div className="dashboard-overview__hero">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1>Control Center</h1>
            <p className="subtext">
              Use the admin menu to manage trainers, members, attendance, consultation leads, and
              user feedback.
            </p>
          </div>
        </div>

        <div className="dashboard-overview__stats">
          <div className="overview-stat">
            <span>Active Members</span>
            <strong>{members.length}</strong>
          </div>
          <div className="overview-stat">
            <span>Trainers</span>
            <strong>{trainers.length}</strong>
          </div>
          <div className="overview-stat">
            <span>Feedback Received</span>
            <strong>{feedbackEntries.length}</strong>
          </div>
          <div className="overview-stat">
            <span>Monthly Revenue</span>
            <strong>{formatCurrency(monthlyRevenue)}</strong>
          </div>
          <div className="overview-stat">
            <span>Deleted Accounts</span>
            <strong>{deletedAccounts}</strong>
          </div>
          <div className="overview-stat">
            <span>Free Consult Requests</span>
            <strong>{consultationRequests.length}</strong>
          </div>
          <div className="overview-stat">
            <span>Approval Requests</span>
            <strong>{pendingPlanRequests.length}</strong>
          </div>
        </div>

        <div className="admin-feedback-grid">
          <section className="admin-feedback-card admin-feedback-card--wide">
            <div className="admin-feedback-card__header">
              <div>
                <p className="eyebrow">Approval Inbox</p>
                <h2>Member Change Requests</h2>
              </div>
            </div>

            <div className="admin-feedback-list">
              {approvalRequests.map((request) => (
                <article key={request.id} className="admin-feedback-item">
                  <div className="admin-feedback-item__meta">
                    <div>
                      <strong>{request.memberName}</strong>
                      <small>
                        {" "}
                        {getRequestTypeLabel(request)} | {getRequestHeadline(request)}
                        {request.requestType !== "new_client" ? (
                          <> | Trainer: {request.trainerName || "Not assigned"}</>
                        ) : null}
                      </small>
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
                    <span>{formatDateTime(request.createdAt)}</span>
                  </div>

                  {request.status === "pending" && request.adminDecision === "pending" ? (
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
                          : "This request has been fully approved and applied."
                        : request.status === "rejected"
                        ? "This request was rejected."
                        : "Admin has already reviewed this request. Waiting for trainer action."}
                    </small>
                  )}
                </article>
              ))}

              {approvalRequests.length === 0 && (
                <div className="admin-feedback-empty">
                  No approval requests have been submitted yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="admin-feedback-grid">
          <section className="admin-feedback-card admin-feedback-card--wide">
            <div className="admin-feedback-card__header">
              <div>
                <p className="eyebrow">Lead Inbox</p>
                <h2>Free Consultation Requests</h2>
              </div>
            </div>

            <div className="admin-feedback-list">
              {consultationRequests.map((request) => (
                <article key={request.id} className="admin-feedback-item">
                  <div className="admin-feedback-item__meta">
                    <div>
                      <strong>{request.name}</strong>
                      <small> {request.email}</small>
                    </div>
                    <div className="admin-feedback-item__actions">
                      <span className="pill pill--muted">{request.goal}</span>
                      <button
                        type="button"
                        className="admin-item-remove"
                        aria-label={`Remove consultation request from ${request.name}`}
                        onClick={() => handleConsultationRemove(request.id)}
                      >
                        <FaTrash aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <p>{request.message || "No extra notes were provided."}</p>
                  <small>
                    {request.phone} | {request.source} | {formatDateTime(request.createdAt)}
                  </small>
                </article>
              ))}

              {consultationRequests.length === 0 && (
                <div className="admin-feedback-empty">
                  No free consultation requests have been submitted yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="admin-feedback-grid">
          <section className="admin-feedback-card admin-feedback-card--wide">
            <div className="admin-feedback-card__header">
              <div>
                <p className="eyebrow">Revenue Graph</p>
                <h2>Monthly Revenue By Active Plan</h2>
              </div>
            </div>

            <div className="admin-chart admin-chart--large">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueChartData}
                  margin={{ top: 12, right: 24, left: 8, bottom: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={formatAxisCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Monthly Revenue"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    isAnimationActive={false}
                    dot={{ r: 5, fill: "#38bdf8" }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="admin-feedback-grid">
          <section className="admin-feedback-card">
            <div className="admin-feedback-card__header">
              <div>
                <p className="eyebrow">Plan Graph</p>
                <h2>Plan-Wise Member Distribution</h2>
              </div>
            </div>

            <div className="admin-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={membershipChartData}
                    dataKey="members"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={108}
                    paddingAngle={4}
                    isAnimationActive={false}
                  >
                    {membershipChartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={PLAN_COLORS[index % PLAN_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} members`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="admin-feedback-summary">
              {membershipChartData.map((item) => (
                <div key={item.name} className="admin-feedback-summary__row">
                  <span>{item.name}</span>
                  <strong>{item.members} members</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-feedback-card">
            <div className="admin-feedback-card__header">
              <div>
                <p className="eyebrow">Feedback Inbox</p>
                <h2>Latest User Feedback</h2>
              </div>
            </div>

            <div className="admin-feedback-list">
              {feedbackEntries.map((entry) => (
                <article key={entry.id} className="admin-feedback-item">
                  <div className="admin-feedback-item__meta">
                    <div>
                      <strong>{entry.memberName}</strong>
                      <small> Trainer: {entry.trainer}</small>
                    </div>
                    <div className="admin-feedback-item__actions">
                      <span className="pill pill--muted">
                        {entry.category} | {entry.rating}/5
                      </span>
                      <button
                        type="button"
                        className="admin-item-remove"
                        aria-label={`Remove feedback from ${entry.memberName}`}
                        onClick={() => handleFeedbackRemove(entry)}
                      >
                        <FaTrash aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <p>{entry.message}</p>
                  <small>
                    {formatDateTime(entry.createdAt)}
                    {entry.isDeleted ? " | Account deleted" : ""}
                  </small>
                </article>
              ))}

              {feedbackEntries.length === 0 && (
                <div className="admin-feedback-empty">
                  No user feedback has been submitted yet.
                </div>
              )}
            </div>
          </section>

          <section className="admin-feedback-card">
            <div className="admin-feedback-card__header">
              <div>
                <p className="eyebrow">Account Snapshot</p>
                <h2>Members Health</h2>
              </div>
            </div>

            <div className="admin-feedback-summary">
              <div className="admin-feedback-summary__row">
                <span>Members assigned to trainers</span>
                <strong>{members.filter((member) => member.trainerId != null).length}</strong>
              </div>
              <div className="admin-feedback-summary__row">
                <span>Members without trainer</span>
                <strong>{members.filter((member) => member.trainerId == null).length}</strong>
              </div>
              <div className="admin-feedback-summary__row">
                <span>Profiles with feedback</span>
                <strong>
                  {allMembers.filter((member) => member.feedback.length > 0).length}
                </strong>
              </div>
              <div className="admin-feedback-summary__row">
                <span>Inactive profiles</span>
                <strong>{deletedAccounts}</strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
