import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { useMembers } from "../../../context/MemberContext";
import {
  calculateBmi,
  GOAL_OPTIONS,
  useProgressTracking,
} from "../../../context/ProgressContext";
import { hasTrainerAccess } from "../../../utils/memberAccess";
import "../components/styl/ProgressTracking.css";

const createEmptyForm = (goal = GOAL_OPTIONS[0]) => ({
  date: new Date().toISOString().slice(0, 10),
  weightKg: "",
  heightCm: "",
  goal,
});

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatChartDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));

const Progress = ({ role, userId }) => {
  const { trainerId: trainerIdParam, userId: userIdParam } = useParams();
  const { members } = useMembers();
  const { progressByMember, saveProgressEntry } = useProgressTracking();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [form, setForm] = useState(createEmptyForm());
  const trainerId = Number(trainerIdParam ?? userId);
  const resolvedUserId = Number(userIdParam ?? userId);

  const trainerMembers = useMemo(
    () =>
      members.filter(
        (member) => member.trainerId === trainerId && hasTrainerAccess(member.plan)
      ),
    [members, trainerId]
  );
  const selectedMember =
    role === "trainer"
      ? trainerMembers.find((member) => String(member.id) === String(selectedMemberId))
      : members.find((member) => member.id === resolvedUserId);

  const activeProgress =
    progressByMember[String(selectedMember?.id)] ?? {
      goal: GOAL_OPTIONS[0],
      updatedAt: null,
      history: [],
    };
  const latestEntry = activeProgress.history[activeProgress.history.length - 1] ?? null;
  const chartData = activeProgress.history.map((entry) => ({
    ...entry,
    label: formatChartDate(entry.date),
  }));
  const bmiPreview = calculateBmi(form.heightCm, form.weightKg);

  useEffect(() => {
    if (role !== "trainer") {
      return;
    }

    if (!trainerMembers.length) {
      setSelectedMemberId("");
      return;
    }

    setSelectedMemberId((current) =>
      trainerMembers.some((member) => String(member.id) === String(current))
        ? current
        : String(trainerMembers[0].id)
    );
  }, [role, trainerMembers]);

  useEffect(() => {
    if (!selectedMember) {
      return;
    }

    if (latestEntry) {
      setForm({
        date: new Date().toISOString().slice(0, 10),
        weightKg: String(latestEntry.weightKg),
        heightCm: String(latestEntry.heightCm),
        goal: activeProgress.goal,
      });
      return;
    }

    setForm(createEmptyForm(activeProgress.goal));
  }, [selectedMember?.id, latestEntry?.date, latestEntry?.heightCm, latestEntry?.weightKg, activeProgress.goal]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const loadEntryForEdit = (entry) => {
    setForm({
      date: entry.date,
      weightKg: String(entry.weightKg),
      heightCm: String(entry.heightCm),
      goal: activeProgress.goal,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedMember) {
      toast.error("Select a member first.");
      return;
    }

    const weightKg = Number(form.weightKg);
    const heightCm = Number(form.heightCm);

    if (!form.date || weightKg <= 0 || heightCm <= 0) {
      toast.error("Enter a valid date, weight, and height.");
      return;
    }

    saveProgressEntry({
      memberId: selectedMember.id,
      date: form.date,
      weightKg,
      heightCm,
      goal: form.goal,
    });

    toast.success(`Progress saved for ${selectedMember.name}.`);
  };

  if (role === "trainer") {
    return (
      <DashboardLayout role="trainer">
        <div className="progress-page">
          <div className="progress-hero">
            <div>
              <p className="eyebrow">Trainer - Progress Tracking</p>
              <h1>Track Assigned Client Progress</h1>
              <p className="subtext">
                Click a client card, add or edit weight and height, and BMI updates automatically.
              </p>
            </div>
          </div>

          <div className="progress-client-grid">
            {trainerMembers.map((member) => {
              const memberProgress = progressByMember[String(member.id)];
              const lastEntry = memberProgress?.history?.[memberProgress.history.length - 1];

              return (
                <button
                  key={member.id}
                  type="button"
                  className={`progress-client-card ${
                    String(member.id) === String(selectedMemberId)
                      ? "progress-client-card--active"
                      : ""
                  }`}
                  onClick={() => setSelectedMemberId(String(member.id))}
                >
                  <strong>{member.name}</strong>
                  <span>{member.plan}</span>
                  <small>{memberProgress?.goal ?? "No goal"}</small>
                  <p>
                    {lastEntry
                      ? `BMI ${lastEntry.bmi} | ${lastEntry.weightKg} kg`
                      : "No progress saved yet"}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedMember ? (
            <>
              <div className="progress-stats">
                <div className="progress-stat">
                  <span>Current Weight</span>
                  <strong>{latestEntry ? `${latestEntry.weightKg} kg` : "--"}</strong>
                </div>
                <div className="progress-stat">
                  <span>Current Height</span>
                  <strong>{latestEntry ? `${latestEntry.heightCm} cm` : "--"}</strong>
                </div>
                <div className="progress-stat">
                  <span>Current BMI</span>
                  <strong>{latestEntry ? latestEntry.bmi : "--"}</strong>
                </div>
                <div className="progress-stat">
                  <span>Goal</span>
                  <strong>{activeProgress.goal}</strong>
                </div>
              </div>

              <div className="progress-layout">
                <form className="progress-card progress-form" onSubmit={handleSubmit}>
                  <div className="progress-card__head">
                    <div>
                      <h2>{selectedMember.name}</h2>
                      <p>Add a new daily record or edit an existing date.</p>
                    </div>
                  </div>

                  <label className="progress-field">
                    <span>Date</span>
                    <input name="date" type="date" value={form.date} onChange={handleChange} />
                  </label>

                  <label className="progress-field">
                    <span>Weight (kg)</span>
                    <input
                      name="weightKg"
                      type="number"
                      min="1"
                      step="0.1"
                      value={form.weightKg}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="progress-field">
                    <span>Height (cm)</span>
                    <input
                      name="heightCm"
                      type="number"
                      min="1"
                      step="0.1"
                      value={form.heightCm}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="progress-field">
                    <span>Goal</span>
                    <select name="goal" value={form.goal} onChange={handleChange}>
                      {GOAL_OPTIONS.map((goal) => (
                        <option key={goal} value={goal}>
                          {goal}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="progress-bmi-preview">
                    <span>Automatic BMI</span>
                    <strong>{bmiPreview || "--"}</strong>
                  </div>

                  <button type="submit" className="progress-primary">
                    Save Progress
                  </button>
                </form>

                <div className="progress-card">
                  <div className="progress-card__head">
                    <div>
                      <h2>{selectedMember.name} History</h2>
                      <p>Use edit on any row to load it back into the form.</p>
                    </div>
                  </div>

                  <div className="progress-history">
                    {activeProgress.history.map((entry) => (
                      <div key={entry.id} className="progress-history__row">
                        <span>{formatDate(entry.date)}</span>
                        <span>{entry.weightKg} kg</span>
                        <span>{entry.heightCm} cm</span>
                        <span>BMI {entry.bmi}</span>
                        <button type="button" onClick={() => loadEntryForEdit(entry)}>
                          Edit
                        </button>
                      </div>
                    ))}

                    {activeProgress.history.length === 0 && (
                      <div className="progress-empty">No progress entries for this client yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="progress-chart-grid">
                <div className="progress-card">
                  <div className="progress-card__head">
                    <div>
                      <h2>Weight Trend</h2>
                      <p>Track weight movement across saved check-ins.</p>
                    </div>
                  </div>
                  <div className="progress-chart">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="label" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="weightKg" stroke="#38bdf8" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="progress-card">
                  <div className="progress-card__head">
                    <div>
                      <h2>BMI Trend</h2>
                      <p>Calculated automatically from saved weight and height.</p>
                    </div>
                  </div>
                  <div className="progress-chart">
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="label" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="bmi" stroke="#f59e0b" fill="#f59e0b33" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="progress-empty">No assigned clients available for progress tracking.</div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="user">
      <div className="progress-page">
        <div className="progress-hero">
          <div>
            <p className="eyebrow">User - Progress</p>
            <h1>{selectedMember ? `${selectedMember.name} Progress` : "My Progress"}</h1>
            <p className="subtext">
              Your trainer updates these numbers. Weight, height, and BMI charts stay in sync.
            </p>
          </div>
        </div>

        <div className="progress-stats">
          <div className="progress-stat">
            <span>Current Weight</span>
            <strong>{latestEntry ? `${latestEntry.weightKg} kg` : "--"}</strong>
          </div>
          <div className="progress-stat">
            <span>Current Height</span>
            <strong>{latestEntry ? `${latestEntry.heightCm} cm` : "--"}</strong>
          </div>
          <div className="progress-stat">
            <span>BMI</span>
            <strong>{latestEntry ? latestEntry.bmi : "--"}</strong>
          </div>
          <div className="progress-stat">
            <span>Goal</span>
            <strong>{activeProgress.goal}</strong>
          </div>
        </div>

        <div className="progress-chart-grid">
          <div className="progress-card">
            <div className="progress-card__head">
              <div>
                <h2>Weight Diagram</h2>
                <p>Every saved weigh-in from your trainer.</p>
              </div>
            </div>
            <div className="progress-chart">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="weightKg" stroke="#38bdf8" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="progress-card">
            <div className="progress-card__head">
              <div>
                <h2>BMI Diagram</h2>
                <p>Calculated automatically from height and weight.</p>
              </div>
            </div>
            <div className="progress-chart">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="bmi" stroke="#22c55e" fill="#22c55e33" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-card__head">
            <div>
              <h2>Progress History</h2>
              <p>Latest check-ins saved by your trainer.</p>
            </div>
          </div>

          <div className="progress-history">
            {activeProgress.history.map((entry) => (
              <div key={entry.id} className="progress-history__row progress-history__row--user">
                <span>{formatDate(entry.date)}</span>
                <span>{entry.weightKg} kg</span>
                <span>{entry.heightCm} cm</span>
                <span>BMI {entry.bmi}</span>
              </div>
            ))}

            {activeProgress.history.length === 0 && (
              <div className="progress-empty">No progress history has been added yet.</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Progress;
