import { useMemo } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useMembers } from "../../../context/MemberContext";
import { useWorkoutPlans } from "../../../context/WorkoutPlanContext";
import { hasTrainerAccess } from "../../../utils/memberAccess";
import "../components/styl/WorkoutPlans.css";

const formatDate = (value) => {
  if (!value) {
    return "Not assigned yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const UserWorkout = ({ userId: userIdProp = null }) => {
  const { userId: userIdParam } = useParams();
  const { members: memberRoster } = useMembers();
  const { muscleGroups, plansByMember } = useWorkoutPlans();
  const userId = Number(userIdParam ?? userIdProp);
  const member = memberRoster.find((item) => item.id === userId);
  const hasPremiumAccess = hasTrainerAccess(member?.plan);
  const memberPlan =
    plansByMember[String(userId)] ?? {
      groups: {},
      updatedAt: null,
      trainerId: member?.trainerId ?? null,
    };

  const workoutGroups = useMemo(
    () => muscleGroups.map((group) => memberPlan.groups?.[group.id]).filter(Boolean),
    [memberPlan.groups, muscleGroups]
  );
  const totalWorkouts = workoutGroups.reduce(
    (count, group) => count + group.workouts.length,
    0
  );

  if (!hasPremiumAccess) {
    return (
      <DashboardLayout role="user">
        <div className="workout-page">
          <div className="workout-hero">
            <div>
              <p className="eyebrow">User - My Workout</p>
              <h1>Workout Schedule Locked</h1>
              <p className="subtext">
                Upgrade to Gold or Diamond to unlock trainer-assigned workout schedules.
              </p>
            </div>
          </div>

          <div className="workout-empty">
            Your current plan is {member?.plan ?? "Basic"}. Workout schedules are available only
            for Gold and Diamond members.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="user">
      <div className="workout-page">
        <div className="workout-hero">
          <div>
            <p className="eyebrow">User - My Workout</p>
            <h1>{member ? `${member.name}'s Workout Plan` : "My Workout"}</h1>
            <p className="subtext">
              Your trainer pushes selected workouts here muscle-group by muscle-group.
            </p>
          </div>
          <div className="workout-hero__meta">
            <span>Latest trainer update</span>
            <strong>{formatDate(memberPlan.updatedAt)}</strong>
          </div>
        </div>

        <div className="workout-stats">
          <div className="workout-stat">
            <span>Assigned Muscle Groups</span>
            <strong>{workoutGroups.length}</strong>
          </div>
          <div className="workout-stat">
            <span>Total Workouts</span>
            <strong>{totalWorkouts}</strong>
          </div>
          <div className="workout-stat">
            <span>Trainer</span>
            <strong>{member?.trainer ?? "Not linked"}</strong>
          </div>
        </div>

        {workoutGroups.length > 0 ? (
          <div className="user-workout-groups">
            {workoutGroups.map((group) => (
              <section key={group.muscleId} className="workout-card user-workout-group">
                <div className="workout-card__head">
                  <div>
                    <h2>{group.muscleName}</h2>
                    <p>{group.description}</p>
                  </div>
                  <div className="workout-card__summary">
                    <span>Assigned</span>
                    <strong>{group.workouts.length} workouts</strong>
                  </div>
                </div>

                <div className="user-workout-list">
                  {group.workouts.map((workout) => (
                    <article key={workout.id} className="user-workout-item">
                      <div className="user-workout-item__top">
                        <h3>{workout.name}</h3>
                        <span className="pill pill--muted">{workout.difficulty}</span>
                      </div>
                      <p>{workout.focus}</p>
                      <div className="workout-item__meta">
                        <span>{workout.equipment}</span>
                        <span>{workout.prescription}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="workout-empty">
            Your trainer has not pushed workouts yet. Once they assign muscle-group plans, they
            will appear here automatically.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserWorkout;
