import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import ConfirmPopup from "./ConfirmPopup";
import { useMembers } from "../../../context/MemberContext";
import { useDietPlans } from "../../../context/DietPlanContext";
import { hasTrainerAccess } from "../../../utils/memberAccess";
import "../components/styl/WorkoutPlans.css";

const normalizeSearch = (value = "") =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const formatDate = (value) => {
  if (!value) {
    return "No assignments yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const DietPlans = ({ trainerId: trainerIdProp = null }) => {
  const { trainerId: trainerIdParam } = useParams();
  const { members: memberRoster } = useMembers();
  const { mealGroups, plansByMember, assignDiets } = useDietPlans();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [activeMealId, setActiveMealId] = useState(() => mealGroups[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [draftSelections, setDraftSelections] = useState({});
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const trainerId = Number(trainerIdParam ?? trainerIdProp);

  const trainerMembers = useMemo(
    () =>
      memberRoster.filter(
        (member) => member.trainerId === trainerId && hasTrainerAccess(member.plan)
      ),
    [memberRoster, trainerId]
  );

  useEffect(() => {
    if (!trainerMembers.length) {
      setSelectedMemberId("");
      return;
    }

    setSelectedMemberId((current) =>
      trainerMembers.some((member) => String(member.id) === String(current))
        ? current
        : String(trainerMembers[0].id)
    );
  }, [trainerMembers]);

  useEffect(() => {
    if (!mealGroups.length) {
      setActiveMealId("");
      return;
    }

    setActiveMealId((current) =>
      mealGroups.some((group) => group.id === current) ? current : mealGroups[0].id
    );
  }, [mealGroups]);

  const selectedMember = trainerMembers.find(
    (member) => String(member.id) === String(selectedMemberId)
  );
  const activeMealGroup =
    mealGroups.find((group) => group.id === activeMealId) ?? mealGroups[0];
  const memberPlan =
    plansByMember[String(selectedMemberId)] ?? {
      groups: {},
      updatedAt: null,
    };
  const assignedGroups = mealGroups
    .map((group) => memberPlan.groups?.[group.id])
    .filter(Boolean);
  const totalAssignedMeals = assignedGroups.reduce(
    (count, group) => count + group.meals.length,
    0
  );

  const selectionKey =
    selectedMember && activeMealGroup ? `${selectedMember.id}-${activeMealGroup.id}` : "";
  const assignedMealIds = activeMealGroup
    ? memberPlan.groups?.[activeMealGroup.id]?.meals?.map((meal) => meal.id) ?? []
    : [];
  const selectedMealIds = selectionKey
    ? draftSelections[selectionKey] ?? assignedMealIds
    : [];

  const filteredMeals = useMemo(() => {
    if (!activeMealGroup) {
      return [];
    }

    const term = normalizeSearch(searchQuery);
    return activeMealGroup.meals.filter((meal) => {
      if (!term) {
        return true;
      }

      return [meal.name, meal.calories, meal.timing, meal.goal, meal.portion].some((value) =>
        normalizeSearch(value).includes(term)
      );
    });
  }, [activeMealGroup, searchQuery]);

  const updateCurrentSelection = (nextMealIds) => {
    if (!selectionKey) {
      return;
    }

    setDraftSelections((current) => ({
      ...current,
      [selectionKey]: nextMealIds,
    }));
  };

  const toggleMeal = (mealId) => {
    const nextMealIds = selectedMealIds.includes(mealId)
      ? selectedMealIds.filter((id) => id !== mealId)
      : [...selectedMealIds, mealId];

    updateCurrentSelection(nextMealIds);
  };

  const handleSelectAll = () => {
    if (!activeMealGroup) {
      return;
    }

    updateCurrentSelection(activeMealGroup.meals.map((meal) => meal.id));
  };

  const performClearSelection = () => {
    updateCurrentSelection([]);
    setConfirmClearOpen(false);
  };

  const handleClearSelection = () => {
    if (!selectedMealIds.length) {
      return;
    }

    setConfirmClearOpen(true);
  };

  const handleAssign = () => {
    if (!selectedMember || !activeMealGroup) {
      toast.error("Select a member and meal slot first.");
      return;
    }

    const selectedMeals = activeMealGroup.meals.filter((meal) =>
      selectedMealIds.includes(meal.id)
    );

    assignDiets({
      userId: selectedMember.id,
      trainerId,
      mealGroup: activeMealGroup,
      meals: selectedMeals,
    });

    toast.success(
      selectedMeals.length
        ? `${selectedMeals.length} ${activeMealGroup.name.toLowerCase()} items saved for ${selectedMember.name}.`
        : `${activeMealGroup.name} items cleared for ${selectedMember.name}.`
    );
  };

  if (!trainerMembers.length) {
    return (
      <DashboardLayout role="trainer">
        <div className="workout-page">
          <div className="workout-hero">
            <div>
              <p className="eyebrow">Trainer - Diet Plans</p>
              <h1>Diet Plans</h1>
              <p className="subtext">
                Diet assignments appear here once Gold or Diamond members are connected to this
                trainer.
              </p>
            </div>
          </div>
          <div className="workout-empty">
            No eligible members are assigned to this trainer yet, so there is nobody to push diet
            plans to.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="trainer">
      <div className="workout-page">
        <div className="workout-hero">
          <div>
            <p className="eyebrow">Trainer - Diet Plans</p>
            <h1>Assign Meal-Based Diet Plans</h1>
            <p className="subtext">
              Pick a member, select a meal slot, choose diet items, and push them.
            </p>
          </div>
          <div className="workout-hero__meta">
            <span>Last updated</span>
            <strong>{formatDate(memberPlan.updatedAt)}</strong>
          </div>
        </div>

        <div className="workout-stats">
          <div className="workout-stat">
            <span>Meal Slots</span>
            <strong>{mealGroups.length}</strong>
          </div>
          <div className="workout-stat">
            <span>Active Slot Items</span>
            <strong>{activeMealGroup?.meals.length ?? 0}</strong>
          </div>
          <div className="workout-stat">
            <span>{selectedMember?.name ?? "Member"} Assigned</span>
            <strong>{totalAssignedMeals}</strong>
          </div>
        </div>

        <div className="workout-toolbar">
          <div className="workout-toolbar__filters">
            <label className="workout-field">
              <span>Assign to member</span>
              <select
                value={selectedMemberId}
                onChange={(event) => setSelectedMemberId(event.target.value)}
              >
                {trainerMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} - {member.plan}
                  </option>
                ))}
              </select>
            </label>

            <label className="workout-field workout-field--search">
              <span>Search meal suggestions</span>
              <input
                type="search"
                placeholder="Oats, high protein, 400 kcal..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
          </div>

          <div className="workout-toolbar__actions">
            <button type="button" className="workout-button workout-button--ghost" onClick={handleSelectAll}>
              Select All
            </button>
            <button type="button" className="workout-button workout-button--ghost" onClick={handleClearSelection}>
              Clear
            </button>
            <button type="button" className="workout-button" onClick={handleAssign}>
              Push to My Diet
            </button>
          </div>
        </div>

        <div className="workout-layout">
          <aside className="workout-card workout-card--muscles">
            <div className="workout-card__head">
              <h2>Meal Slots</h2>
              {/* <p>Click a meal slot to load its diet list.</p> */}
            </div>

            <div className="muscle-group-list">
              {mealGroups.map((group) => {
                const savedCount = memberPlan.groups?.[group.id]?.meals?.length ?? 0;

                return (
                  <button
                    key={group.id}
                    type="button"
                    className={`muscle-group-button ${
                      group.id === activeMealId ? "muscle-group-button--active" : ""
                    }`}
                    onClick={() => setActiveMealId(group.id)}
                  >
                    <div>
                      <strong>{group.name}</strong>
                      <span>{group.description}</span>
                    </div>
                    <small>{savedCount} saved</small>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="workout-card workout-card--catalog">
            <div className="workout-card__head">
              <div>
                <h2>{activeMealGroup?.name ?? "Diet Items"}</h2>
                <p>{activeMealGroup?.description}</p>
              </div>
              <div className="workout-card__summary">
                <span>{filteredMeals.length} visible</span>
                <strong>{selectedMealIds.length} selected</strong>
              </div>
            </div>

            <div className="workout-grid">
              {filteredMeals.map((meal) => {
                const isSelected = selectedMealIds.includes(meal.id);

                return (
                  <label
                    key={meal.id}
                    className={`workout-item ${isSelected ? "workout-item--selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMeal(meal.id)}
                    />
                    <div className="workout-item__body">
                      <div className="workout-item__top">
                        <h3>{meal.name}</h3>
                        <span className="pill pill--muted">{meal.calories}</span>
                      </div>
                      <p>{meal.goal}</p>
                      <div className="workout-item__meta">
                        <span>{meal.timing}</span>
                        <span>{meal.portion}</span>
                      </div>
                    </div>
                  </label>
                );
              })}

              {filteredMeals.length === 0 && (
                <div className="workout-empty">
                  No meal suggestions match the current search for this slot.
                </div>
              )}
            </div>
          </section>

          <aside className="workout-card workout-card--summary">
            <div className="workout-card__head">
              <h2>{selectedMember?.name} - My Diet</h2>
              {/* <p>This is what will appear on the user dashboard.</p> */}
            </div>

            <div className="assigned-group-list">
              {assignedGroups.map((group) => (
                <div key={group.mealId} className="assigned-group">
                  <div className="assigned-group__head">
                    <strong>{group.mealName}</strong>
                    <span>{group.meals.length} items</span>
                  </div>
                  <p>{group.description}</p>
                </div>
              ))}

              {assignedGroups.length === 0 && (
                <div className="workout-empty">
                  No diet items have been pushed to this member yet.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <ConfirmPopup
        open={confirmClearOpen}
        badgeLabel="Confirm clear"
        title="Clear selected diet items?"
        message="This removes the currently selected items from the draft for this meal slot. Click Push to My Diet to save the cleared state."
        confirmLabel="Clear items"
        onConfirm={performClearSelection}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </DashboardLayout>
  );
};

export default DietPlans;
