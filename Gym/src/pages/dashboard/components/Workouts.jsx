import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { useMembers } from "../../../context/MemberContext";
import { useWorkoutPlans } from "../../../context/WorkoutPlanContext";
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

const Workouts = ({ trainerId: trainerIdProp = null }) => {
  const { trainerId: trainerIdParam } = useParams();
  const { members: memberRoster } = useMembers();
  const { muscleGroups, plansByMember, assignWorkouts } = useWorkoutPlans();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [activeMuscleId, setActiveMuscleId] = useState(() => muscleGroups[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [draftSelections, setDraftSelections] = useState({});
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
    if (!muscleGroups.length) {
      setActiveMuscleId("");
      return;
    }

    setActiveMuscleId((current) =>
      muscleGroups.some((group) => group.id === current) ? current : muscleGroups[0].id
    );
  }, [muscleGroups]);

  const selectedMember = trainerMembers.find(
    (member) => String(member.id) === String(selectedMemberId)
  );
  const activeMuscle =
    muscleGroups.find((group) => group.id === activeMuscleId) ?? muscleGroups[0];
  const memberPlan =
    plansByMember[String(selectedMemberId)] ?? {
      groups: {},
      updatedAt: null,
    };
  const assignedGroups = muscleGroups
    .map((group) => memberPlan.groups?.[group.id])
    .filter(Boolean);
  const totalAssignedWorkouts = assignedGroups.reduce(
    (count, group) => count + group.workouts.length,
    0
  );

  const selectionKey =
    selectedMember && activeMuscle ? `${selectedMember.id}-${activeMuscle.id}` : "";
  const assignedWorkoutIds = activeMuscle
    ? memberPlan.groups?.[activeMuscle.id]?.workouts?.map((workout) => workout.id) ?? []
    : [];
  const selectedWorkoutIds = selectionKey
    ? draftSelections[selectionKey] ?? assignedWorkoutIds
    : [];

  const filteredWorkouts = useMemo(() => {
    if (!activeMuscle) {
      return [];
    }

    const term = normalizeSearch(searchQuery);
    return activeMuscle.workouts.filter((workout) => {
      if (!term) {
        return true;
      }

      return [
        workout.name,
        workout.equipment,
        workout.difficulty,
        workout.focus,
        workout.prescription,
      ].some((value) => normalizeSearch(value).includes(term));
    });
  }, [activeMuscle, searchQuery]);

  const updateCurrentSelection = (nextWorkoutIds) => {
    if (!selectionKey) {
      return;
    }

    setDraftSelections((current) => ({
      ...current,
      [selectionKey]: nextWorkoutIds,
    }));
  };

  const toggleWorkout = (workoutId) => {
    const nextWorkoutIds = selectedWorkoutIds.includes(workoutId)
      ? selectedWorkoutIds.filter((id) => id !== workoutId)
      : [...selectedWorkoutIds, workoutId];

    updateCurrentSelection(nextWorkoutIds);
  };

  const handleSelectAll = () => {
    if (!activeMuscle) {
      return;
    }

    updateCurrentSelection(activeMuscle.workouts.map((workout) => workout.id));
  };

  const handleClearSelection = () => {
    updateCurrentSelection([]);
  };

  const handleAssign = () => {
    if (!selectedMember || !activeMuscle) {
      toast.error("Select a member and muscle group first.");
      return;
    }

    const selectedWorkouts = activeMuscle.workouts.filter((workout) =>
      selectedWorkoutIds.includes(workout.id)
    );

    assignWorkouts({
      userId: selectedMember.id,
      trainerId,
      muscleGroup: activeMuscle,
      workouts: selectedWorkouts,
    });

    toast.success(
      selectedWorkouts.length
        ? `${selectedWorkouts.length} ${activeMuscle.name.toLowerCase()} workouts saved for ${selectedMember.name}.`
        : `${activeMuscle.name} workouts cleared for ${selectedMember.name}.`
    );
  };

  if (!trainerMembers.length) {
    return (
      <DashboardLayout role="trainer">
        <div className="workout-page">
          <div className="workout-hero">
            <div>
              <p className="eyebrow">Trainer - Workout Plans</p>
              <h1>Workout Plans</h1>
              <p className="subtext">
                Assignments appear here once Gold or Diamond members are connected to this trainer.
              </p>
            </div>
          </div>
          <div className="workout-empty">
            No eligible members are assigned to this trainer yet, so there is nobody to push
            workouts to.
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
            <p className="eyebrow">Trainer - Workout Plans</p>
            <h1>Assign Muscle-Based Workout Plans</h1>
            <p className="subtext">
              Pick a member, click a muscle group, select the workouts, and push them.
            </p>
          </div>
          <div className="workout-hero__meta">
            <span>Last updated</span>
            <strong>{formatDate(memberPlan.updatedAt)}</strong>
          </div>
        </div>

        <div className="workout-stats">
          <div className="workout-stat">
            <span>Muscle Groups</span>
            <strong>{muscleGroups.length}</strong>
          </div>
          <div className="workout-stat">
            <span>Active Group Workouts</span>
            <strong>{activeMuscle?.workouts.length ?? 0}</strong>
          </div>
          <div className="workout-stat">
            <span>{selectedMember?.name ?? "Member"} Assigned</span>
            <strong>{totalAssignedWorkouts}</strong>
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
              <span>Search workouts</span>
              <input
                type="search"
                placeholder="Bench press, cable, beginner..."
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
              Push to My Workout
            </button>
          </div>
        </div>

        <div className="workout-layout">
          <aside className="workout-card workout-card--muscles">
            <div className="workout-card__head">
              <h2>Muscle Groups</h2>
              {/* <p>Click a muscle to load its workout list.</p> */}
            </div>

            <div className="muscle-group-list">
              {muscleGroups.map((group) => {
                const savedCount = memberPlan.groups?.[group.id]?.workouts?.length ?? 0;

                return (
                  <button
                    key={group.id}
                    type="button"
                    className={`muscle-group-button ${
                      group.id === activeMuscleId ? "muscle-group-button--active" : ""
                    }`}
                    onClick={() => setActiveMuscleId(group.id)}
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
                <h2>{activeMuscle?.name ?? "Workouts"}</h2>
                <p>{activeMuscle?.description}</p>
              </div>
              <div className="workout-card__summary">
                <span>{filteredWorkouts.length} visible</span>
                <strong>{selectedWorkoutIds.length} selected</strong>
              </div>
            </div>

            <div className="workout-grid">
              {filteredWorkouts.map((workout) => {
                const isSelected = selectedWorkoutIds.includes(workout.id);

                return (
                  <label
                    key={workout.id}
                    className={`workout-item ${isSelected ? "workout-item--selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleWorkout(workout.id)}
                    />
                    <div className="workout-item__body">
                      <div className="workout-item__top">
                        <h3>{workout.name}</h3>
                        <span className="pill pill--muted">{workout.difficulty}</span>
                      </div>
                      <p>{workout.focus}</p>
                      <div className="workout-item__meta">
                        <span>{workout.equipment}</span>
                        <span>{workout.prescription}</span>
                      </div>
                    </div>
                  </label>
                );
              })}

              {filteredWorkouts.length === 0 && (
                <div className="workout-empty">
                  No workouts match the current search for this muscle group.
                </div>
              )}
            </div>
          </section>

          <aside className="workout-card workout-card--summary">
            <div className="workout-card__head">
              <h2>{selectedMember?.name} - My Workout</h2>
              {/* <p>This is what will appear on the user dashboard.</p> */}
            </div>

            <div className="assigned-group-list">
              {assignedGroups.map((group) => (
                <div key={group.muscleId} className="assigned-group">
                  <div className="assigned-group__head">
                    <strong>{group.muscleName}</strong>
                    <span>{group.workouts.length} workouts</span>
                  </div>
                  <p>{group.description}</p>
                </div>
              ))}

              {assignedGroups.length === 0 && (
                <div className="workout-empty">
                  No workouts have been pushed to this member yet.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Workouts;
