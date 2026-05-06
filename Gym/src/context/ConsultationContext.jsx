import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "urbangrind-consultations";
const ConsultationContext = createContext(null);

const normalizeConsultation = (entry) => ({
  id: entry.id ?? `consult-${Date.now()}`,
  name: entry.name?.trim() ?? "",
  email: entry.email?.trim() ?? "",
  phone: entry.phone?.trim() ?? "",
  goal: entry.goal?.trim() ?? "",
  message: entry.message?.trim() ?? "",
  createdAt: entry.createdAt ?? new Date().toISOString(),
  source: entry.source?.trim() ?? "Home Page",
});

const loadConsultations = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeConsultation);
  } catch {
    return [];
  }
};

export const ConsultationProvider = ({ children }) => {
  const [consultationRequests, setConsultationRequests] = useState(() => loadConsultations());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consultationRequests));
    } catch (error) {
      console.error("Failed to persist consultation requests", error);
    }
  }, [consultationRequests]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      setConsultationRequests(loadConsultations());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const submitConsultationRequest = (request) => {
    const normalizedRequest = normalizeConsultation({
      ...request,
      id: `consult-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });

    setConsultationRequests((current) => [normalizedRequest, ...current]);
    return normalizedRequest;
  };

  const removeConsultationRequest = (requestId) => {
    setConsultationRequests((current) =>
      current.filter((request) => request.id !== requestId)
    );
  };

  const value = useMemo(
    () => ({
      consultationRequests,
      submitConsultationRequest,
      removeConsultationRequest,
    }),
    [consultationRequests]
  );

  return (
    <ConsultationContext.Provider value={value}>{children}</ConsultationContext.Provider>
  );
};

export const useConsultations = () => {
  const context = useContext(ConsultationContext);

  if (!context) {
    throw new Error("useConsultations must be used within a ConsultationProvider");
  }

  return context;
};
