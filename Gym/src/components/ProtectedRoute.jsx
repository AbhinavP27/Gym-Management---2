import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is provided and the user's role isn't in it, redirect them to home/login
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  // Prevent users from accessing other users' URLs
  if (currentUser.role === "user") {
    const match = location.pathname.match(/^\/user\/([^/]+)/);
    if (match && match[1] !== String(currentUser.id)) {
      return <Navigate to={`/user/${currentUser.id}`} replace />;
    }
  }

  // Prevent trainers from accessing other trainers' URLs
  if (currentUser.role === "trainer") {
    const match = location.pathname.match(/^\/trainer\/([^/]+)/);
    if (match && match[1] !== String(currentUser.id)) {
      return <Navigate to={`/trainer/${currentUser.id}`} replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
