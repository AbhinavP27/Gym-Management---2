import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAttendance } from "../../../context/AttendanceContext";
import { useMembers } from "../../../context/MemberContext";
import { useWorkoutPlans } from "../../../context/WorkoutPlanContext";
import { useDietPlans } from "../../../context/DietPlanContext";
import { hasTrainerAccess } from "../../../utils/memberAccess";
import "../components/styl/DashboardOverview.css";
import "../components/styl/WorkoutPlans.css";

const formatDate = (value) => {
  if (!value) {
    return "Waiting for trainer assignment";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const UserDashboard = ({ userId: userIdProp = null }) => {
  const { userId: userIdParam } = useParams();
  const { attendance } = useAttendance();
  const { members: memberRoster } = useMembers();
  const { muscleGroups, plansByMember } = useWorkoutPlans();
  const { mealGroups, plansByMember: dietPlansByMember } = useDietPlans();
  const userId = Number(userIdParam ?? userIdProp);
  const member = memberRoster.find((item) => item.id === userId);
  const hasPremiumAccess = hasTrainerAccess(member?.plan);
  const memberPlan =
    plansByMember[String(userId)] ?? {
      groups: {},
      updatedAt: null,
    };
  const dietPlan =
    dietPlansByMember[String(userId)] ?? {
      groups: {},
      updatedAt: null,
    };

  const workoutGroups = useMemo(
    () => muscleGroups.map((group) => memberPlan.groups?.[group.id]).filter(Boolean),
    [memberPlan.groups, muscleGroups]
  );
  const dietGroups = useMemo(
    () => mealGroups.map((group) => dietPlan.groups?.[group.id]).filter(Boolean),
    [dietPlan.groups, mealGroups]
  );
  const totalWorkouts = workoutGroups.reduce(
    (count, group) => count + group.workouts.length,
    0
  );
  const totalDietItems = dietGroups.reduce(
    (count, group) => count + group.meals.length,
    0
  );
  const todayAttendance = attendance.find(
    (entry) => entry.role === "member" && entry.userId === userId
  );
  const visibleWorkoutGroups = hasPremiumAccess ? workoutGroups : [];
  const visibleDietGroups = hasPremiumAccess ? dietGroups : [];
  const visibleWorkoutCount = hasPremiumAccess ? totalWorkouts : 0;
  const visibleDietCount = hasPremiumAccess ? totalDietItems : 0;

  return (
    <DashboardLayout role="user">
      <div className="dashboard-overview">
        <div className="dashboard-overview__hero">
          <div>
            <p className="eyebrow">User Dashboard</p>
            <h1>{member?.name ?? "Member Dashboard"}</h1>
            <p className="subtext">
              Track the workout and diet plans your trainer pushed into your dashboard.
            </p>
          </div>
          <span className="pill pill--blue">{member?.trainer ?? "Trainer pending"}</span>
        </div>

        <div className="dashboard-overview__stats">
          <div className="overview-stat">
            <span>Membership Plan</span>
            <strong>{member?.plan ?? "N/A"}</strong>
          </div>
          <div className="overview-stat">
            <span>Muscle Groups</span>
            <strong>{visibleWorkoutGroups.length}</strong>
          </div>
          <div className="overview-stat">
            <span>My Workouts</span>
            <strong>{visibleWorkoutCount}</strong>
          </div>
          <div className="overview-stat">
            <span>Diet Items</span>
            <strong>{visibleDietCount}</strong>
          </div>
          <div className="overview-stat">
            <span>Today Attendance</span>
            <strong>{todayAttendance?.status ?? "N/A"}</strong>
          </div>
        </div>

        <div className="dashboard-panel">
          <p className="eyebrow">My Workout</p>
          <h2>Trainer Assigned Workout Plan</h2>
          <p className="subtext">Last updated: {formatDate(memberPlan.updatedAt)}</p>

          {hasPremiumAccess ? (
            <>
              {visibleWorkoutGroups.length > 0 ? (
                <>
                  <div className="dashboard-workout-preview">
                    {visibleWorkoutGroups.map((group) => (
                      <div key={group.muscleId} className="dashboard-workout-preview__item">
                        <strong>{group.muscleName}</strong>
                        <span>{group.workouts.length} workouts assigned</span>
                      </div>
                    ))}
                  </div>
                  <Link to={`/user/${userId}/workout`} className="workout-link">
                    Open My Workout
                  </Link>
                </>
              ) : (
                <div className="workout-empty">
                  No workout plan has been pushed yet. Your trainer can assign workouts from the
                  trainer dashboard.
                </div>
              )}
            </>
          ) : (
            <div className="workout-empty">
              Workout schedules are locked on the Basic plan. Upgrade to Gold or Diamond to
              unlock this feature.
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <p className="eyebrow">My Diet</p>
          <h2>Trainer Assigned Diet Plan</h2>
          <p className="subtext">Last updated: {formatDate(dietPlan.updatedAt)}</p>

          {hasPremiumAccess ? (
            <>
              {visibleDietGroups.length > 0 ? (
                <>
                  <div className="dashboard-workout-preview">
                    {visibleDietGroups.map((group) => (
                      <div key={group.mealId} className="dashboard-workout-preview__item">
                        <strong>{group.mealName}</strong>
                        <span>{group.meals.length} diet items assigned</span>
                      </div>
                    ))}
                  </div>
                  <Link to={`/user/${userId}/diet`} className="workout-link">
                    Open My Diet
                  </Link>
                </>
              ) : (
                <div className="workout-empty">
                  No diet plan has been pushed yet. Your trainer can assign meal plans from the
                  trainer dashboard.
                </div>
              )}
            </>
          ) : (
            <div className="workout-empty">
              Diet plans are locked on the Basic plan. Upgrade to Gold or Diamond to unlock this
              feature.
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <p className="eyebrow">My Plan</p>
          <h2>Current Membership</h2>
          <p className="subtext">
            Current plan: {member?.plan ?? "N/A"} | Expiry: {member?.expiry ?? "N/A"}
          </p>
          <Link to={`/user/${userId}/plan`} className="workout-link">
            Update My Plan
          </Link>
        </div>

        <div className="dashboard-panel">
          <p className="eyebrow">Progress</p>
          <h2>Track Weight, Height, and BMI</h2>
          <p className="subtext">
            Your trainer updates the data and the charts are available in your progress page.
          </p>
          <Link to={`/user/${userId}/progress`} className="workout-link">
            Open Progress
          </Link>
        </div>

        <div className="dashboard-panel">
          <p className="eyebrow">Attendance</p>
          <h2>Today&apos;s Attendance Status</h2>
          <p className="subtext">
            Trainer update:{" "}
            <span className={`pill ${todayAttendance?.status === "Present" ? "pill--green" : "pill--amber"}`}>
              {todayAttendance?.status ?? "Not marked"}
            </span>
          </p>
          <Link to={`/user/${userId}/attendance`} className="workout-link">
            Open Attendance
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
