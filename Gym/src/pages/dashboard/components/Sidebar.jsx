import { Link, useParams } from "react-router-dom";
import React from "react";
import "./styl/Sidebar.css";
import { sidebarConfig } from "../../../data/sidebarConfig";
import { useMembers } from "../../../context/MemberContext";
import { hasTrainerAccess } from "../../../utils/memberAccess";
import { useAuth } from "../../../context/AuthContext";
import { usePlanRequests } from "../../../context/PlanRequestContext";

const Sidebar = ({ role , isMobile, isOpen, setIsOpen }) => {
  const { trainerId, userId } = useParams();
  const { getMemberById } = useMembers();
  const { logout } = useAuth();
  const { isMemberOnboardingBlocked } = usePlanRequests();
  const member = role === "user" ? getMemberById(userId) : null;
  const hasPremiumAccess = hasTrainerAccess(member?.plan);
  const isUserOnboardingBlocked =
    role === "user" && userId ? isMemberOnboardingBlocked(userId) : false;

  const handleClose = () => {
    if (isMobile) setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const menuItems = isUserOnboardingBlocked
    ? (sidebarConfig[role] || []).filter((item) => item.path === "/user")
    : sidebarConfig[role] || [];
  const resolvePath = (path) => {
    if (role === "trainer" && trainerId && path.startsWith("/trainer")) {
      return path.replace("/trainer", `/trainer/${trainerId}`);
    }

    if (role === "user" && userId && path.startsWith("/user")) {
      return path.replace("/user", `/user/${userId}`);
    }

    return path;
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <h2 className="sidebar-title">UrbanGrind</h2>

      <ul className="sidebar-menu">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isRestrictedUserItem =
            role === "user" &&
            !hasPremiumAccess &&
            (item.path === "/user/workout" || item.path === "/user/diet");

          return (
            <li key={index}>
              {isRestrictedUserItem ? (
                <span className="sidebar-link sidebar-link--disabled">
                  {Icon && <Icon size={18} strokeWidth={1.75} />}
                  <span>{item.name}</span>
                  <small>Gold or Diamond</small>
                </span>
              ) : (
                <Link to={resolvePath(item.path)} onClick={handleClose}>
                  {Icon && <Icon size={18} strokeWidth={1.75} />}
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}

        <li>
          <Link to="/login" className="logout" onClick={handleLogout}>
            Logout
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
