import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMembers } from "./MemberContext";
import { useTrainerDirectory } from "./TrainerContext";

const STORAGE_KEY = "urbangrind-attendance-v2";
const AttendanceContext = createContext(null);

export const getToday = () => new Date().toISOString().split("T")[0];

const generatePastDays = (numDays) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < numDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

const buildAttendanceRoster = (trainers, members) => {
  const dates = generatePastDays(30);
  const roster = [];

  dates.forEach((date) => {
    trainers.forEach((trainer, index) => {
      const charCode = date.charCodeAt(date.length - 1) || 0;
      const seed = charCode + index;
      roster.push({
        id: `trainer-${trainer.id}-${date}`,
        userId: trainer.id,
        name: trainer.name,
        role: "trainer",
        trainerId: null,
        date: date,
        status: seed % 7 === 0 ? "Absent" : "Present", // Mostly present
      });
    });

    members.forEach((member, index) => {
      roster.push({
        id: `member-${member.id}-${date}`,
        userId: member.id,
        name: member.name,
        role: "member",
        trainerId: member.trainerId,
        date: date,
        status: "Absent",
      });
    });
  });

  return roster;
};

const normalizeAttendance = (entries) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      id: entry.id,
      userId: Number(entry.userId),
      name: entry.name ?? "",
      role: entry.role,
      trainerId: entry.trainerId == null ? null : Number(entry.trainerId),
      date: entry.date ?? getToday(),
      status: entry.status === "Absent" ? "Absent" : "Present",
    }));
};

const loadStoredAttendance = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    return normalizeAttendance(JSON.parse(stored));
  } catch {
    return null;
  }
};

const syncRoster = (currentEntries, trainers, members) => {
  const existingMap = new Map(currentEntries.map(e => [e.id, e]));
  const defaultRoster = buildAttendanceRoster(trainers, members);
  
  defaultRoster.forEach(entry => {
    if (!existingMap.has(entry.id)) {
      existingMap.set(entry.id, entry);
    }
  });

  return Array.from(existingMap.values());
};

export const AttendanceProvider = ({ children }) => {
  const { members } = useMembers();
  const { trainers } = useTrainerDirectory();
  const [attendance, setAttendance] = useState(() => {
    const stored = loadStoredAttendance();
    return stored && stored.length ? syncRoster(stored, trainers, members) : buildAttendanceRoster(trainers, members);
  });

  useEffect(() => {
    setAttendance((current) => syncRoster(current, trainers, members));
  }, [members, trainers]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attendance));
    } catch (error) {
      console.error("Failed to persist attendance", error);
    }
  }, [attendance]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      const stored = loadStoredAttendance();
      setAttendance(stored && stored.length ? syncRoster(stored, trainers, members) : buildAttendanceRoster(trainers, members));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [members, trainers]);

  const toggleAttendanceStatus = (id) => {
    setAttendance((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "Present" ? "Absent" : "Present",
            }
          : item
      )
    );
  };

  const value = useMemo(
    () => ({
      attendance,
      toggleAttendanceStatus,
    }),
    [attendance]
  );

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);

  if (!context) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }

  return context;
};
