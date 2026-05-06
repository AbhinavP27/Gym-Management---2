import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
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

      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);

      // Fetch Profile
      const profileResponse = await api.get("profiles/me/");
      const rawData = profileResponse.data;
      
      const userData = {
          ...rawData.user,
          role: roleMap[rawData.role] || 'user', // Normalize to lowercase
          id: rawData.member_id || rawData.trainer_id || rawData.id // Use entity specific ID
      };

      setCurrentUser(userData);
      localStorage.setItem("currentUser", JSON.stringify(userData));
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
    localStorage.removeItem("currentUser");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
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
