import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { AUTH_KEYS, clearAuthStorage, getAuthItem, setAuthItem } from "../utils/authStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = getAuthItem(AUTH_KEYS.currentUser);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  const roleMap = {
    'ADMIN': 'admin',
    'TRAINER': 'trainer',
    'MEMBER': 'user'
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      // We use email as the username for Django login
      const response = await api.post("token/", { username: email, password });
      const { access, refresh } = response.data;

      setAuthItem(AUTH_KEYS.accessToken, access);
      setAuthItem(AUTH_KEYS.refreshToken, refresh);

      // Fetch Profile
      const profileResponse = await api.get("profiles/me/");
      const rawData = profileResponse.data;
      const computedName = rawData.name || `${rawData.user?.first_name || ""} ${rawData.user?.last_name || ""}`.trim() || rawData.user?.username || "";
      
      const userData = {
          ...rawData.user,
          name: computedName,
          phone: rawData.phone || "",
          address: rawData.address || "",
          gender: rawData.gender || "",
          role: roleMap[rawData.role] || 'user', // Normalize to lowercase
          id: rawData.member_id || rawData.trainer_id || rawData.id // Use entity specific ID
      };

      setCurrentUser(userData);
      setAuthItem(AUTH_KEYS.currentUser, JSON.stringify(userData));
      return { ok: true, user: userData };
    } catch (error) {
      console.error("Login failed", error);
      return { ok: false, error: error.response?.data?.detail || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    clearAuthStorage();
  };

  const updateCurrentUser = (updates) => {
    setCurrentUser((previous) => {
      if (!previous) {
        return previous;
      }
      const nextUser = { ...previous, ...updates };
      setAuthItem(AUTH_KEYS.currentUser, JSON.stringify(nextUser));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateCurrentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
