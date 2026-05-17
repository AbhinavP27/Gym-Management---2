import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import ConfirmPopup from "../components/ConfirmPopup";
import { useMembers } from "../../../context/MemberContext";
import {
  getTrainerStatusClass,
  useTrainerDirectory,
} from "../../../context/TrainerContext";
import {
  getDecisionLabel,
  getDecisionPillClass,
  usePlanRequests,
} from "../../../context/PlanRequestContext";
import "../components/styl/DashboardOverview.css";
import "../components/styl/Members.css";
import "../components/styl/Profile.css";

const FEEDBACK_CATEGORIES = ["General", "Trainer", "Workout Plan", "Facility", "Billing"];

const createProfileForm = (member) => ({
  name: member?.name ?? "",
  email: member?.email ?? "",
  phone: member?.phone ?? "",
  address: member?.address ?? "",
  fitnessGoal: member?.fitnessGoal ?? "",
  emergencyContact: member?.emergencyContact ?? "",
});

const createFeedbackForm = () => ({
  category: FEEDBACK_CATEGORIES[0],
  rating: "5",
  message: "",
});

const formatDateTime = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const UserProfile = ({ userId: userIdProp = null }) => {
  const { userId: userIdParam } = useParams();
  const {
    getMemberById,
    updateMemberProfile,
    addMemberFeedback,
    deleteMemberAccount,
  } = useMembers();
  const { trainers } = useTrainerDirectory();
  const { approvalRequests, submitTrainerChangeRequest } = usePlanRequests();
  const userId = Number(userIdParam ?? userIdProp);
  const member = getMemberById(userId);
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState(() => createProfileForm(member));
  const [feedbackForm, setFeedbackForm] = useState(createFeedbackForm);
  const [selectedTrainerId, setSelectedTrainerId] = useState(
    member?.trainerId ? String(member.trainerId) : ""
  );
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const latestTrainerRequest = useMemo(
    () =>
      approvalRequests.find(
        (request) => request.memberId === member?.id && request.requestType === "trainer"
      ) ?? null,
    [approvalRequests, member?.id]
  );
  const pendingTrainerRequest = useMemo(
    () =>
      approvalRequests.find(
        (request) =>
          request.memberId === member?.id &&
          request.requestType === "trainer" &&
          request.status === "pending"
      ) ?? null,
    [approvalRequests, member?.id]
  );

  useEffect(() => {
    setProfileForm(createProfileForm(member));
    setSelectedTrainerId(member?.trainerId ? String(member.trainerId) : "");
    setIsEditing(false);
  }, [member]);

  useEffect(() => {
    if (!member || latestTrainerRequest?.status !== "rejected") {
      return;
    }

    setSelectedTrainerId(member.trainerId ? String(member.trainerId) : "");
  }, [latestTrainerRequest?.id, latestTrainerRequest?.status, member, member?.trainerId]);

  const selectedTrainer = useMemo(
    () => trainers.find((trainer) => String(trainer.id) === selectedTrainerId) ?? null,
    [selectedTrainerId, trainers]
  );

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFeedbackChange = (event) => {
    const { name, value } = event.target;
    setFeedbackForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    if (!member) {
      return;
    }

    if (!profileForm.name.trim() || !profileForm.email.trim() || !profileForm.phone.trim()) {
      toast.error("Name, email, and phone are required.");
      return;
    }

    const normalizedProfileEmail = profileForm.email.trim().toLowerCase();
    const trainerEmailTaken =
      normalizedProfileEmail !== member.email.trim().toLowerCase() &&
      trainers.some(
        (trainer) => trainer.email?.trim().toLowerCase() === normalizedProfileEmail
      );

    if (normalizedProfileEmail === "admin@urbangrind.com" || trainerEmailTaken) {
      toast.error("Email already exists. Use a unique email.");
      return;
    }

    const result = await updateMemberProfile(member.id, profileForm);
    if (!result?.ok) {
      toast.error(result?.error || "Unable to update profile.");
      return;
    }

    setIsEditing(false);
    toast.success("Profile updated.");
  };

  const handleTrainerSwitch = () => {
    if (!member) {
      return;
    }

    if (!selectedTrainer) {
      toast.error("Select a trainer first.");
      return;
    }

    if (selectedTrainer.id === member.trainerId) {
      toast.error("You are already assigned to this trainer.");
      return;
    }

    if (selectedTrainer.status === "On Leave") {
      toast.error("Select a trainer who is currently available.");
      return;
    }

    const result = submitTrainerChangeRequest({
      member,
      requestedTrainer: selectedTrainer,
    });

    if (!result?.ok) {
      toast.error(result?.error || "Unable to send trainer change request.");
      return;
    }

    toast.success(`Trainer change request sent to ${selectedTrainer.name} and admin.`);
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();

    if (!member) {
      return;
    }

    if (!feedbackForm.message.trim()) {
      toast.error("Write feedback before sending it.");
      return;
    }

    const result = await addMemberFeedback(member.id, feedbackForm);
    if (!result?.ok) {
      toast.error(result?.error || "Unable to submit feedback.");
      return;
    }
    setFeedbackForm(createFeedbackForm());
    toast.success("Feedback sent to admin.");
  };

  const handleDeleteAccount = () => {
    if (!member) {
      return;
    }

    deleteMemberAccount(member.id);
    setConfirmDeleteOpen(false);
    toast.success("Account deleted from the active member roster.");
  };

  if (!member) {
    return (
      <DashboardLayout role="user">
        <div className="dashboard-overview">
          <div className="dashboard-overview__hero">
            <div>
              <p className="eyebrow">User - Profile</p>
              <h1>Profile Not Found</h1>
              <p className="subtext">
                No member record is connected to this user dashboard route.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (member.isDeleted) {
    return (
      <DashboardLayout role="user">
        <div className="profile-page">
          <div className="dashboard-overview__hero">
            <div>
              <p className="eyebrow">User - Profile</p>
              <h1>Account Deleted</h1>
              <p className="subtext">
                This profile was removed from the active member roster on{" "}
                {formatDateTime(member.deletedAt)}.
              </p>
            </div>
            <span className="pill pill--amber">Inactive</span>
          </div>

          <section className="profile-card">
            <h2>What changed</h2>
            <p className="subtext">
              The account no longer appears in member, trainer, and attendance views. Feedback
              already submitted remains visible to admin.
            </p>
            <Link to="/login" className="profile-primary-action">
              Back to login
            </Link>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="user">
      <div className="profile-page">
        <div className="dashboard-overview__hero">
          <div>
            <p className="eyebrow">User - Profile</p>
            <h1>{member.name}</h1>
            <p className="subtext">
              Keep your details updated, switch trainers, and send feedback directly to admin.
            </p>
          </div>
          <span className="pill pill--blue">{member.trainer || "Trainer pending"}</span>
        </div>

        <div className="dashboard-overview__stats">
          <div className="overview-stat">
            <span>Membership</span>
            <strong>{member.plan || "N/A"}</strong>
          </div>
          <div className="overview-stat">
            <span>Expiry</span>
            <strong>{member.expiry || "N/A"}</strong>
          </div>
          <div className="overview-stat">
            <span>Feedback Sent</span>
            <strong>{member.feedback.length}</strong>
          </div>
          <div className="overview-stat">
            <span>Joined</span>
            <strong>{member.joinedAt}</strong>
          </div>
        </div>

        <div className="profile-grid">
          <section className="profile-card">
            <div className="profile-card__header">
              <div>
                <p className="eyebrow">My Details</p>
                <h2>Editable User Information</h2>
              </div>
              <button
                type="button"
                className="profile-secondary-action"
                onClick={() => {
                  setIsEditing((current) => !current);
                  setProfileForm(createProfileForm(member));
                }}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            <form className="profile-form" onSubmit={handleProfileSave}>
              <label>
                <span>Name</span>
                <input
                  name="name"
                  type="text"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                />
              </label>
              <label>
                <span>Phone</span>
                <input
                  name="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                />
              </label>
              <label>
                <span>Emergency Contact</span>
                <input
                  name="emergencyContact"
                  type="text"
                  value={profileForm.emergencyContact}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                />
              </label>
              <label className="profile-form__full">
                <span>Address</span>
                <textarea
                  name="address"
                  rows="3"
                  value={profileForm.address}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                />
              </label>
              <label className="profile-form__full">
                <span>Fitness Goal</span>
                <textarea
                  name="fitnessGoal"
                  rows="3"
                  value={profileForm.fitnessGoal}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                />
              </label>

              {isEditing && (
                <button type="submit" className="profile-primary-action">
                  Save Changes
                </button>
              )}
            </form>
          </section>

          <section className="profile-card">
            <div className="profile-card__header">
              <div>
                <p className="eyebrow">Switch Trainer</p>
                <h2>Change Current Assignment</h2>
              </div>
              {selectedTrainer && (
                <span className={`pill ${getTrainerStatusClass(selectedTrainer.status)}`}>
                  {selectedTrainer.status}
                </span>
              )}
            </div>

            <p className="subtext">
              Select another trainer and apply the change. This also updates trainer-side member
              lists after admin and the new trainer approve your request.
            </p>

            {latestTrainerRequest && (
              <div className="profile-inline-request">
                <div>
                  <strong>
                    {latestTrainerRequest.currentTrainerName || "No trainer"} to{" "}
                    {latestTrainerRequest.requestedTrainerName}
                  </strong>
                  <small>
                    Admin: {getDecisionLabel(latestTrainerRequest.adminDecision)} | Trainer:{" "}
                    {getDecisionLabel(latestTrainerRequest.trainerDecision)}
                  </small>
                </div>
                <span className={`pill ${getDecisionPillClass(latestTrainerRequest.status)}`}>
                  {getDecisionLabel(latestTrainerRequest.status)}
                </span>
              </div>
            )}

            <div className="profile-trainer-list">
              {trainers.map((trainer) => (
                <button
                  key={trainer.id}
                  type="button"
                  className={`profile-trainer-option ${
                    String(trainer.id) === selectedTrainerId
                      ? "profile-trainer-option--active"
                      : ""
                  }`}
                  disabled={trainer.status === "On Leave" && trainer.id !== member.trainerId}
                  onClick={() => setSelectedTrainerId(String(trainer.id))}
                >
                  <strong>{trainer.name}</strong>
                  <span>{trainer.specialization}</span>
                  <span>{trainer.status}</span>
                  <small>{trainer.members} active members</small>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="profile-primary-action"
              onClick={handleTrainerSwitch}
              disabled={Boolean(pendingTrainerRequest)}
            >
              {pendingTrainerRequest ? "Request Pending" : "Request Trainer Change"}
            </button>
          </section>

          <section className="profile-card">
            <div className="profile-card__header">
              <div>
                <p className="eyebrow">Feedback</p>
                <h2>Send Feedback To Admin</h2>
              </div>
            </div>

            <form className="profile-feedback-form" onSubmit={handleFeedbackSubmit}>
              <label>
                <span>Category</span>
                <select
                  name="category"
                  value={feedbackForm.category}
                  onChange={handleFeedbackChange}
                >
                  {FEEDBACK_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Rating</span>
                <select
                  name="rating"
                  value={feedbackForm.rating}
                  onChange={handleFeedbackChange}
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={String(rating)}>
                      {rating} / 5
                    </option>
                  ))}
                </select>
              </label>

              <label className="profile-form__full">
                <span>Message</span>
                <textarea
                  name="message"
                  rows="5"
                  placeholder="Share your trainer experience, gym feedback, or anything admin should review."
                  value={feedbackForm.message}
                  onChange={handleFeedbackChange}
                />
              </label>

              <button type="submit" className="profile-primary-action">
                Submit Feedback
              </button>
            </form>
          </section>

          <section className="profile-card">
            <div className="profile-card__header">
              <div>
                <p className="eyebrow">History</p>
                <h2>Previous Feedback</h2>
              </div>
            </div>

            <div className="profile-feedback-list">
              {member.feedback.map((entry) => (
                <article key={entry.id} className="profile-feedback-item">
                  <div className="profile-feedback-item__meta">
                    <span className="pill pill--muted">{entry.category}</span>
                    <strong>{entry.rating}/5</strong>
                  </div>
                  <p>{entry.message}</p>
                  <small>{formatDateTime(entry.createdAt)}</small>
                </article>
              ))}

              {member.feedback.length === 0 && (
                <div className="profile-empty">
                  No feedback sent yet. Submitted feedback appears here and in the admin dashboard.
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="profile-card profile-card--danger">
          <div className="profile-card__header">
            <div>
              <p className="eyebrow">Danger Zone</p>
              <h2>Delete Account</h2>
            </div>
          </div>
          <p className="subtext">
            Deleting the account removes this user from active roster views and trainer assignment
            flows. Existing feedback remains available to admin for record keeping.
          </p>
          <button
            type="button"
            className="profile-danger-action"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            Delete Account
          </button>
        </section>
      </div>

      <ConfirmPopup
        open={confirmDeleteOpen}
        badgeLabel="Confirm account removal"
        title="Delete this account?"
        message="The member will be removed from active dashboards and attendance views. This action cannot be undone from the profile."
        confirmLabel="Delete account"
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </DashboardLayout>
  );
};

export default UserProfile;
