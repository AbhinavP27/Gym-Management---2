import { useMemo } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { useMembers } from "../../../context/MemberContext";
import { useDietPlans } from "../../../context/DietPlanContext";
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

const UserDiet = ({ userId: userIdProp = null }) => {
  const { userId: userIdParam } = useParams();
  const { members: memberRoster } = useMembers();
  const { mealGroups, plansByMember } = useDietPlans();
  const userId = Number(userIdParam ?? userIdProp);
  const member = memberRoster.find((item) => item.id === userId);
  const hasPremiumAccess = hasTrainerAccess(member?.plan);
  const memberPlan =
    plansByMember[String(userId)] ?? {
      groups: {},
      updatedAt: null,
      trainerId: member?.trainerId ?? null,
    };

  const assignedGroups = useMemo(
    () => mealGroups.map((group) => memberPlan.groups?.[group.id]).filter(Boolean),
    [memberPlan.groups, mealGroups]
  );
  const totalMeals = assignedGroups.reduce(
    (count, group) => count + group.meals.length,
    0
  );

  if (!hasPremiumAccess) {
    return (
      <DashboardLayout role="user">
        <div className="workout-page">
          <div className="workout-hero">
            <div>
              <p className="eyebrow">User - My Diet</p>
              <h1>Diet Plan Locked</h1>
              <p className="subtext">
                Upgrade to Gold or Diamond to unlock trainer-assigned diet plans.
              </p>
            </div>
          </div>

          <div className="workout-empty">
            Your current plan is {member?.plan ?? "Basic"}. Diet plans are available only for
            Gold and Diamond members.
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
            <p className="eyebrow">User - My Diet</p>
            <h1>{member ? `${member.name}'s Diet Plan` : "My Diet"}</h1>
            <p className="subtext">
              Your trainer pushes meal-based diet recommendations here slot by slot.
            </p>
          </div>
          <div className="workout-hero__meta">
            <span>Latest trainer update</span>
            <strong>{formatDate(memberPlan.updatedAt)}</strong>
          </div>
        </div>

        <div className="workout-stats">
          <div className="workout-stat">
            <span>Assigned Meal Slots</span>
            <strong>{assignedGroups.length}</strong>
          </div>
          <div className="workout-stat">
            <span>Total Diet Items</span>
            <strong>{totalMeals}</strong>
          </div>
          <div className="workout-stat">
            <span>Trainer</span>
            <strong>{member?.trainer ?? "Not linked"}</strong>
          </div>
        </div>

        {assignedGroups.length > 0 ? (
          <div className="user-workout-groups">
            {assignedGroups.map((group) => (
              <section key={group.mealId} className="workout-card user-workout-group">
                <div className="workout-card__head">
                  <div>
                    <h2>{group.mealName}</h2>
                    <p>{group.description}</p>
                  </div>
                  <div className="workout-card__summary">
                    <span>Assigned</span>
                    <strong>{group.meals.length} items</strong>
                  </div>
                </div>

                <div className="user-workout-list">
                  {group.meals.map((meal) => (
                    <article key={meal.id} className="user-workout-item">
                      <div className="user-workout-item__top">
                        <h3>{meal.name}</h3>
                        <span className="pill pill--muted">{meal.calories}</span>
                      </div>
                      <p>{meal.goal}</p>
                      <div className="workout-item__meta">
                        <span>{meal.timing}</span>
                        <span>{meal.portion}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="workout-empty">
            Your trainer has not pushed diet items yet. Once they assign meal-slot plans, they
            will appear here automatically.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserDiet;
