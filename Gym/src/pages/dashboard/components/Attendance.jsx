import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
const CustomCalendar = ({ selectedDate, onSelect, attendanceData }) => {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  const pad = (n) => n.toString().padStart(2, "0");

  return (
    <div className="custom-calendar-container">
      <div className="cc-header">
        <button className="cc-nav" onClick={prevMonth}>&lt;</button>
        <span className="cc-month">{monthNames[month]} {year}</span>
        <button className="cc-nav" onClick={nextMonth}>&gt;</button>
      </div>
      <div className="cc-weekdays">
        {weekDays.map((d) => (
          <div key={d} className="cc-weekday">{d}</div>
        ))}
      </div>
      <div className="cc-grid">
        {days.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="cc-empty"></div>;
          
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isoDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
          
          const dayEntries = attendanceData.filter((e) => e.date === isoDate);
          let statusClass = "";
          if (dayEntries.length > 0) {
            const presents = dayEntries.filter((e) => e.status === "Present").length;
            if (presents === dayEntries.length) statusClass = "cc-present";
            else if (presents === 0) statusClass = "cc-absent";
            else statusClass = "cc-mixed";
          }

          return (
            <button 
              key={idx} 
              className={`cc-day ${isSelected ? "selected" : ""} ${statusClass}`}
              onClick={() => onSelect(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

import { useAttendance, getToday } from "../../../context/AttendanceContext";
import { useMembers } from "../../../context/MemberContext";
import { useTrainerDirectory } from "../../../context/TrainerContext";
import { hasTrainerAccess } from "../../../utils/memberAccess";
import "../components/styl/Attendance.css";
import DashboardLayout from "../layouts/DashboardLayout";

const COLORS = ["#10b981", "#ef4444"]; // Emerald and Red
const ROLE_LABELS = {
  trainer: "Trainer",
  member: "Client",
};

const normalizeSearch = (value = "") =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const Attendance = ({ role, userId }) => {
  const { trainerId: trainerIdParam, userId: userIdParam } = useParams();
  const { attendance, toggleAttendanceStatus } = useAttendance();
  const { members } = useMembers();
  const { trainers } = useTrainerDirectory();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const trainerId = Number(trainerIdParam ?? userId);
  const resolvedUserId = Number(userIdParam ?? userId);

  const validTrainerIds = useMemo(() => new Set(trainers.map((t) => Number(t.id))), [trainers]);

  const eligibleTrainerMemberIds = useMemo(
    () =>
      new Set(
        members
          .filter(
            (member) => member.trainerId === trainerId && hasTrainerAccess(member.plan)
          )
          .map((member) => member.id)
      ),
    [members, trainerId]
  );

  // General Filtered base down to relevant scope (the exact user/trainer's members)
  const scopedAttendance = useMemo(() => {
    let data = attendance;

    if (role === "admin") {
      data = data.filter((entry) => entry.role === "trainer" && validTrainerIds.has(Number(entry.userId)));
    }

    if (role === "trainer") {
      data = data.filter(
        (entry) =>
          entry.role === "member" &&
          entry.trainerId === trainerId &&
          eligibleTrainerMemberIds.has(entry.userId)
      );
    }

    if (role === "user") {
      data = data.filter(
        (entry) => entry.role === "member" && entry.userId === resolvedUserId
      );
    }
    return data;
  }, [attendance, role, trainerId, eligibleTrainerMemberIds, resolvedUserId, validTrainerIds]);

  const filteredScopedAttendance = useMemo(() => {
    let data = scopedAttendance;
    if (filter === "today") {
      const today = getToday();
      data = data.filter((entry) => entry.date === today);
    } else if (filter === "present") {
      data = data.filter((entry) => entry.status === "Present");
    } else if (filter === "absent") {
      data = data.filter((entry) => entry.status === "Absent");
    }
    return data;
  }, [scopedAttendance, filter]);

  // Specific filtered list for the Table view
  const tableData = useMemo(() => {
    let data = filteredScopedAttendance;

    if (activeTab === "calendar") {
      const pad = (n) => n.toString().padStart(2, "0");
      const dStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
      data = data.filter((entry) => entry.date === dStr);
    }

    const term = normalizeSearch(query);
    if (term) {
      data = data.filter((entry) => {
        const roleLabel = ROLE_LABELS[entry.role] || entry.role;
        return (
          normalizeSearch(entry.name).includes(term) ||
          normalizeSearch(roleLabel).includes(term) ||
          normalizeSearch(entry.date).includes(term) ||
          normalizeSearch(entry.status).includes(term)
        );
      });
    }

    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredScopedAttendance, activeTab, selectedDate, query]);

  // Stats for Overview pie chart
  const overallStats = useMemo(() => {
    const present = filteredScopedAttendance.filter((entry) => entry.status === "Present").length;
    const absent = filteredScopedAttendance.length - present;

    return [
      { name: "Present", value: present },
      { name: "Absent", value: absent },
    ];
  }, [filteredScopedAttendance]);

  const statsBreakdown = {
    total: filteredScopedAttendance.length,
    present: overallStats[0].value,
    absent: overallStats[1].value,
    rate: filteredScopedAttendance.length
      ? Math.round((overallStats[0].value / filteredScopedAttendance.length) * 100)
      : 0,
  };

  // Monthly Trend Data for Bar Chart
  const trendData = useMemo(() => {
    const dateMap = new Map();
    
    // Aggregate past 30 days
    filteredScopedAttendance.forEach((entry) => {
      if (!dateMap.has(entry.date)) {
        dateMap.set(entry.date, { date: entry.date, Present: 0, Absent: 0 });
      }
      dateMap.get(entry.date)[entry.status]++;
    });

    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14); // Last 14 days for cleaner UI
  }, [filteredScopedAttendance]);

  const exportCSV = () => {
    const rows = [
      ["Name", "Role", "Date", "Status"],
      ...tableData.map((entry) => [
        entry.name,
        ROLE_LABELS[entry.role] || entry.role,
        entry.date,
        entry.status,
      ]),
    ];

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute(
      "href",
      `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
    );
    link.setAttribute("download", `attendance-${getToday()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };




  return (
    <DashboardLayout role={role}>
      <div className="attendance-page">
        {/* Header Section */}
        <div className="attendance-header">
          <div>
            <h1>Attendance Management</h1>
            <p className="attendance-sub">Track scheduling, presence, and history efficiently.</p>
          </div>
          <button className="export-btn" onClick={exportCSV}>
            Export CSV
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="attendance-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`tab-btn ${activeTab === "calendar" ? "active" : ""}`}
              onClick={() => setActiveTab("calendar")}
            >
              Calendar
            </button>
            <button
              className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
              onClick={() => setActiveTab("list")}
            >
              Detailed List
            </button>
          </div>
          <div className="filter-wrap" style={{ display: "flex", gap: "10px", alignItems: "center", background: "transparent", border: "none" }}>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Filter:</span>
            <select 
              value={filter} 
              onChange={(event) => setFilter(event.target.value)}
              style={{
                background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", 
                borderRadius: "6px", padding: "6px 12px", outline: "none", cursor: "pointer"
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="present">Only Present</option>
              <option value="absent">Only Absent</option>
            </select>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="tab-content overview-tab animate-fade-in">
            <div className="stats-row">
              <div className="stat-card">
                <h3>Total Records</h3>
                <p className="value">{statsBreakdown.total}</p>
                <span className="trend positive">Lifetime</span>
              </div>
              <div className="stat-card">
                <h3>Present</h3>
                <p className="value text-emerald">{statsBreakdown.present}</p>
                <span className="trend positive">Entries</span>
              </div>
              <div className="stat-card">
                <h3>Absent</h3>
                <p className="value text-red">{statsBreakdown.absent}</p>
                <span className="trend negative">Entries</span>
              </div>
              <div className="stat-card highlight-card">
                <h3>Attendance Rate</h3>
                <p className="value">{statsBreakdown.rate}%</p>
                <span className="trend">Performance Metric</span>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-wrapper trend-chart">
                <h3>14-Day Trend</h3>
                <div style={{ height: "300px", width: "100%", marginTop: "20px" }}>
                  <ResponsiveContainer>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8" 
                        tickFormatter={(v) => v.slice(5)} 
                        tickMargin={10} 
                      />
                      <YAxis stroke="#94a3b8" tickCount={5} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#f8fafc" }}
                        itemStyle={{ color: "#f8fafc" }}
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                      <Bar dataKey="Present" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="Absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-wrapper pie-chart-wrap">
                <h3>Overall Distribution</h3>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                  <PieChart width={280} height={280}>
                    <Pie 
                      data={overallStats} 
                      dataKey="value" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={65} 
                      outerRadius={100} 
                      paddingAngle={5}
                      stroke="none"
                    >
                      {overallStats.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px" }}
                      itemStyle={{ color: "#f8fafc" }}
                    />
                  </PieChart>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar & List Sharing Tab Content Context */}
        {activeTab !== "overview" && (
          <div className={`tab-content dual-col animate-fade-in ${activeTab === 'list' ? 'list-only' : ''}`}>
            
            {activeTab === "calendar" && (
              <div className="calendar-panel">
                <div className="panel-header">
                  <h3>Select a Date</h3>
                  <div className="legend">
                    <span className="legend-item"><span className="dot dot-present"></span> Present</span>
                    <span className="legend-item"><span className="dot dot-absent"></span> Absent</span>
                    <span className="legend-item"><span className="dot dot-mixed"></span> Mixed</span>
                  </div>
                </div>
                <div className="custom-calendar-wrapper">
                  <CustomCalendar 
                    selectedDate={selectedDate} 
                    onSelect={setSelectedDate} 
                    attendanceData={filteredScopedAttendance}
                  />
                </div>
              </div>
            )}

            <div className="list-panel">
              <div className="list-controls">
                <div className="search-wrap">
                  <input
                    type="search"
                    placeholder="Search name, role..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                {activeTab === "calendar" && (
                  <div className="date-indicator">
                    Showing: {selectedDate.getFullYear()}-{(selectedDate.getMonth() + 1).toString().padStart(2, "0")}-{selectedDate.getDate().toString().padStart(2, "0")}
                  </div>
                )}
              </div>

              <div className="attendance-table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Date</th>
                      <th>Status</th>
                      {role !== "user" && <th className="text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length > 0 ? (
                      tableData.map((item) => (
                        <tr key={item.id}>
                          <td className="font-medium text-white">{item.name}</td>
                          <td className="text-slate">{ROLE_LABELS[item.role] || item.role}</td>
                          <td className="text-slate">{item.date}</td>
                          <td>
                            <span
                              className={`status-pill ${
                                item.status === "Present"
                                  ? "status-pill-present"
                                  : "status-pill-absent"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          {role !== "user" && (
                            <td className="text-right">
                              <button
                                className={`toggle-btn ${
                                  item.status === "Present" ? "toggle-btn-absent" : "toggle-btn-present"
                                }`}
                                onClick={() => toggleAttendanceStatus(item.id)}
                              >
                                {item.status === "Present" ? "Mark Absent" : "Mark Present"}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={role !== "user" ? 5 : 4} className="empty-state">
                          No attendance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
